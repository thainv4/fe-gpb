// src/components/service-requests-sidebar/service-requests-sidebar.tsx
import {useState, useMemo, useEffect} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api/client'
import {useCurrentRoomStore} from '@/lib/stores/current-room'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {Loader2, Trash2, FileSpreadsheet} from 'lucide-react'
import {cn} from '@/lib/utils'
import {useToast} from '@/hooks/use-toast'
import {exportToExcel, formatDateTimeForExcel, type ExportExcelItem} from '@/utils/export-excel'
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface ServiceRequestsSidebarProps {
    readonly onSelect: (serviceReqCode: string, storedServiceReqId?: string, receptionCode?: string) => void
    readonly selectedCode?: string
    readonly serviceReqCode?: string
    readonly defaultStateId?: string
    readonly refreshTrigger?: number
}

interface FilterParams {
    roomType: 'actionRoomId' | 'currentRoomId' | 'transitionedByRoomId'
    stateType: 'toStateId' | 'fromStateId' | ''
    isCurrent?: number
    timeType: 'actionTimestamp' | 'startedAt' | 'completedAt' | 'currentStateStartedAt'
    fromDate?: string
    toDate?: string
    limit: number
    offset: number
    order: 'ASC' | 'DESC'
    orderBy: 'actionTimestamp' | 'createdAt' | 'startedAt'
    hisServiceReqCode?: string
    flag?: string
}

// Function to get color for each workflow state
const getStateColor = (stateCode?: string) => {
    switch (stateCode) {
        case 'SAMPLE_COLLECTION':
            return 'bg-yellow-100 text-yellow-800'
        case 'SAMPLE_HANDOVER':
            return 'bg-blue-100 text-blue-800'
        case 'SAMPLE_SEPARATION':
            return 'bg-purple-100 text-purple-800'
        case 'MACHINE_RUNNING':
            return 'bg-indigo-100 text-indigo-800'
        case 'RESULT_EVALUATION':
            return 'bg-orange-100 text-orange-800'
        case 'RESULT_APPROVAL':
            return 'bg-green-100 text-green-800'
        case 'COMPLETED':
            return 'bg-emerald-100 text-emerald-800'
        default:
            return 'bg-gray-100 text-gray-800'
    }
}

export function ServiceRequestsSidebar({onSelect, selectedCode, serviceReqCode, defaultStateId, refreshTrigger}: ServiceRequestsSidebarProps) {
    const {currentRoomId} = useCurrentRoomStore()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    // selectedStateId: 'all' means show all states (no state filter)
    // Default to 'all' to show all states, or use defaultStateId if provided
    const [selectedStateId, setSelectedStateId] = useState<string | undefined>(defaultStateId ?? 'all')
    // State tạm thời cho input tìm kiếm (chỉ update filters khi nhấn Enter)
    const [searchInput, setSearchInput] = useState<string>(serviceReqCode ?? '')
    // State để quản lý radio được chọn (chỉ một)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    // State để quản lý dialog xác nhận xóa
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    // State để quản lý filter flag
    const [selectedFlag, setSelectedFlag] = useState<string>('all')
    const [filters, setFilters] = useState<FilterParams>({
        roomType: 'currentRoomId',
        stateType: '',
        timeType: 'actionTimestamp',
        limit: 15,
        offset: 0,
        order: 'DESC',
        orderBy: 'actionTimestamp',
        hisServiceReqCode: serviceReqCode
    })

    // Query workflow states
    const {data: statesData} = useQuery({
        queryKey: ['workflow-states'],
        queryFn: () => apiClient.getWorkflowStates({
            limit: 100,
            offset: 0,
            isActive: 1,
            order: 'ASC',
            orderBy: 'stateOrder'
        }),
    })

    const workflowStates = useMemo(() => statesData?.data?.items ?? [], [statesData?.data?.items])

    // Query service requests
    const {data, isLoading, refetch} = useQuery({
        queryKey: ['workflow-history', currentRoomId, selectedStateId, selectedFlag, filters, refreshTrigger],
        queryFn: () => {
            // build params: include stateId only when a concrete state is selected
            const params: any = {roomId: currentRoomId!, ...filters}
            if (selectedStateId && selectedStateId !== 'all') {
                params.stateId = selectedStateId
            }
            // Thêm flag nếu được chọn (khác 'all')
            if (selectedFlag && selectedFlag !== 'all') {
                params.flag = selectedFlag
            }
            // Thêm hisServiceReqCode với giá trị mặc định là '' nếu không có
            if (!params.hisServiceReqCode) {
                params.hisServiceReqCode = ''
            }
            return apiClient.getWorkflowHistory(params)
        },
        // enabled when room selected and we've initialized state selection (can be 'all')
        enabled: !!currentRoomId && selectedStateId !== undefined,
        // Prevent refetch when clicking rows or switching focus
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    })

    const serviceRequests = data?.data?.items ?? []
    const total = data?.data?.pagination?.total ?? 0

    // useEffect để refresh khi refreshTrigger thay đổi
    useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            refetch()
        }
    }, [refreshTrigger, refetch])

    // Pagination helpers (page-based). limit is fixed in filters (default 10)
    const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 10)) + 1
    const totalPages = Math.max(1, Math.ceil(total / (filters.limit || 10)))

    const goToPage = (page: number) => {
        const p = Math.max(1, Math.min(page, totalPages))
        setFilters(prev => ({...prev, offset: (p - 1) * prev.limit}))
    }

    const updateFilter = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
        setFilters(prev => ({...prev, [key]: value, offset: 0}))
    }

    // Xử lý tìm kiếm khi nhấn Enter
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            updateFilter('hisServiceReqCode', searchInput || undefined)
        }
    }

    // Helper function để extract error message từ API response
    const getErrorMessage = (response: any, defaultMessage: string = "Có lỗi xảy ra"): string => {
        if (response?.message) return String(response.message)
        if (response?.error) {
            if (typeof response.error === 'string') return response.error
            if (typeof response.error === 'object' && response.error !== null && 'message' in response.error) {
                return String(response.error.message)
            }
        }
        return defaultMessage
    }

    // Mutation để xóa workflow history
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.deleteWorkflowHistory(id)
            if (!response.success) {
                throw new Error(getErrorMessage(response, 'Không thể xóa bản ghi dòng thời gian'))
            }
            return response
        },
        onSuccess: () => {
            toast({
                title: 'Thành công',
                description: 'Đã xóa bản ghi dòng thời gian',
            })
            // Refresh danh sách
            queryClient.invalidateQueries({ queryKey: ['workflow-history'] })
            // Xóa id đã chọn và đóng dialog
            setSelectedId(null)
            setDeleteDialogOpen(false)
        },
        onError: (error: any) => {
            const errorMessage = error?.message || getErrorMessage(error, 'Không thể xóa bản ghi')
            toast({
                title: 'Lỗi',
                description: errorMessage,
                variant: 'destructive',
            })
        },
    })

    // Xử lý mở dialog xác nhận xóa
    const handleDeleteClick = () => {
        if (!selectedId) {
            toast({
                title: 'Thông báo',
                description: 'Vui lòng chọn một bản ghi để xóa',
            })
            return
        }
        setDeleteDialogOpen(true)
    }

    // Xử lý xóa bản ghi đã chọn
    const handleConfirmDelete = async () => {
        if (!selectedId) return
        
        try {
            await deleteMutation.mutateAsync(selectedId)
        } catch (error) {
            console.error('Error deleting workflow history:', error)
            // Error đã được xử lý trong onError của mutation
        }
    }

    // Xử lý xuất Excel
    const handleExportExcel = () => {
        if (serviceRequests.length === 0) {
            toast({
                title: 'Thông báo',
                description: 'Không có dữ liệu để xuất',
                variant: 'default',
            })
            return
        }

        try {
            // Lấy tên trạng thái hiện tại
            const currentStateName = selectedStateId === 'all' 
                ? 'Tất cả' 
                : workflowStates.find(s => s.id === selectedStateId)?.stateName || 'Chưa xác định'

            // Chuẩn bị dữ liệu cho Excel
            const excelData: ExportExcelItem[] = serviceRequests.map((item: {
                id: string;
                storedServiceReqId?: string;
                createdAt?: string;
                toState?: {
                    id: string;
                    stateName: string;
                    stateCode: string;
                };
                serviceRequest?: {
                    id?: string;
                    hisServiceReqCode?: string;
                    serviceReqCode?: string;
                    patientName?: string;
                    patientCode?: string;
                    receptionCode?: string;
                };
            }) => {
                const serviceReq = item.serviceRequest
                const serviceReqCode = serviceReq?.hisServiceReqCode || serviceReq?.serviceReqCode || ''
                const patientName = serviceReq?.patientName || ''
                const stateName = item.toState?.stateName || 'Chưa xác định'
                const createdAt = formatDateTimeForExcel(item.createdAt)

                return {
                    serviceReqCode,
                    patientName,
                    stateName,
                    createdAt,
                }
            })

            // Xuất Excel
            exportToExcel({
                data: excelData,
                stateName: currentStateName,
                sheetName: 'Dòng thời gian',
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xuất Excel'
            toast({
                title: 'Lỗi',
                description: errorMessage,
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="h-full flex flex-col border-r border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Dòng thời gian</h3>
                    <div className="flex items-center gap-2">
                        {serviceRequests.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleExportExcel}
                                className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Xuất Excel"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                            </Button>
                        )}
                        {selectedId && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteClick}
                                disabled={deleteMutation.isPending}
                                className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Workflow State Selector */}
                <div className="mb-3">
                    <Select value={selectedStateId ?? 'all'}
                            onValueChange={(v) => {
                                const val = v === 'all' ? 'all' : v
                                setSelectedStateId(val)
                                // reset to first page when changing state
                                setFilters(prev => ({...prev, offset: 0}))
                            }}>
                        <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Chọn trạng thái..."/>
                        </SelectTrigger>
                        <SelectContent>
                            {/* All option: when selected we won't pass stateId to the API */}
                            <SelectItem value="all">Tất cả</SelectItem>
                            {workflowStates.map((state) => (
                                <SelectItem key={state.id} value={state.id}>
                                    {state.stateName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 pt-2 border-t">
                    <Input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Tìm theo mã Y lệnh (nhấn Enter)..."
                        className="text-sm"
                    />

                    {/* Filter by Flag */}
                    <div className="flex gap-2 py-1">
                        <Label className="text-sm font-medium">Lọc theo cờ:</Label>
                        <RadioGroup value={selectedFlag} onValueChange={(value) => {
                            setSelectedFlag(value)
                            setFilters(prev => ({...prev, offset: 0}))
                        }} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="flag-all" />
                                <Label htmlFor="flag-all" className="cursor-pointer text-xs">Tất cả</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ST" id="flag-st-filter" />
                                <Label htmlFor="flag-st-filter" className="cursor-pointer text-xs">ST</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PT" id="flag-pt-filter" />
                                <Label htmlFor="flag-pt-filter" className="cursor-pointer text-xs">PT</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="HC" id="flag-hc-filter" />
                                <Label htmlFor="flag-hc-filter" className="cursor-pointer text-xs">HC</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={filters.fromDate?.slice(0, 10) ?? ''}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const date = new Date(e.target.value)
                                    date.setHours(0, 0, 0, 0)
                                    updateFilter('fromDate', date.toISOString())
                                } else {
                                    updateFilter('fromDate', undefined)
                                }
                            }}
                            className="text-xs"
                            placeholder="Từ ngày"
                        />
                        <Input
                            type="date"
                            value={filters.toDate?.slice(0, 10) ?? ''}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const date = new Date(e.target.value)
                                    date.setHours(23, 59, 59, 999)
                                    updateFilter('toDate', date.toISOString())
                                } else {
                                    updateFilter('toDate', undefined)
                                }
                            }}
                            className="text-xs"
                            placeholder="Đến ngày"
                        />
                    </div>
                </div>

            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto">
                {!currentRoomId && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Vui lòng chọn phòng làm việc
                    </div>
                )}

                {currentRoomId && !selectedStateId && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Vui lòng chọn trạng thái
                    </div>
                )}

                {currentRoomId && selectedStateId && isLoading && filters.offset === 0 && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400"/>
                    </div>
                )}

                {currentRoomId && selectedStateId && !isLoading && serviceRequests.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy kết quả
                    </div>
                )}

                {currentRoomId && selectedStateId && serviceRequests.length > 0 && (
                    <div className="bg-white">
                        <RadioGroup value={selectedId || ''} onValueChange={setSelectedId} className="w-full">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200 w-12">
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">
                                        Mã Y lệnh
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">
                                        Tên bệnh nhân
                                    </th>
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">Trạng thái</th>
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">Người tạo</th>
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2">Thời gian</th>
                                </tr>
                                </thead>
                                <tbody>
                                {serviceRequests.map((item: {
                                    id: string;
                                    storedServiceReqId?: string;
                                    createdAt?: string;
                                    toState?: {
                                        id: string;
                                        stateName: string;
                                        stateCode: string;
                                    };
                                    serviceRequest?: {
                                        id?: string;
                                        hisServiceReqCode?: string;
                                        serviceReqCode?: string;
                                        patientName?: string;
                                        patientCode?: string;
                                        receptionCode?: string;
                                    };
                                    creator?: {
                                        id?: string;
                                        userName?: string;
                                        fullName?: string;
                                    };
                                }) => {
                                    const serviceReq = item.serviceRequest
                                    const serviceReqCode = serviceReq?.hisServiceReqCode || serviceReq?.serviceReqCode || ''
                                    const receptionCode = serviceReq?.receptionCode || ''
                                    const stateName = item.toState?.stateName || 'Chưa xác định'
                                    const stateColor = getStateColor(item.toState?.stateCode)
                                    const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }) : ''

                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={(e) => {
                                                // Không trigger onSelect khi click vào radio
                                                if ((e.target as HTMLElement).closest('[role="radio"]')) {
                                                    return
                                                }
                                                onSelect(serviceReqCode, item.storedServiceReqId, receptionCode)
                                            }}
                                            className={cn(
                                                'cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100',
                                                selectedCode === serviceReqCode && 'bg-blue-100'
                                            )}
                                        >
                                            <td 
                                                className="p-2 border-r border-gray-100"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <RadioGroupItem value={item.id} />
                                            </td>
                                            <td className="p-2 text-xs font-medium text-gray-900 border-r border-gray-100">
                                                {serviceReqCode}
                                            </td>
                                            <td className="p-2 text-xs text-gray-700 border-r border-gray-100">
                                                {serviceReq?.patientName}
                                            </td>
                                            <td className="p-2 text-xs border-r border-gray-100">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stateColor}`}>
                                                    {stateName}
                                                </span>
                                            </td>
                                            <td className="p-2 text-xs text-gray-700 border-r border-gray-100">
                                                {item.creator ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.creator.userName || '-'}</span>
                                                        <span className="text-gray-500 text-[10px]">{item.creator.fullName || '-'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-2 text-xs text-gray-500">
                                                {createdDate}
                                            </td>
                                        </tr>
                                    )
                                })}
                                </tbody>
                            </table>
                        </RadioGroup>
                    </div>
                )}
            </div>

            {/* Pagination controls: Fixed at bottom, outside scroll area */}
            {currentRoomId && selectedStateId && serviceRequests.length > 0 && (
                <div className="p-3 text-center border-t bg-white">
                    <div className="flex items-center justify-between gap-2">
                        <Button size="sm" variant="outline" onClick={() => goToPage(currentPage - 1)} disabled={isLoading || currentPage <= 1}>
                            Trước
                        </Button>

                        <div className="text-sm text-gray-700">Trang {currentPage} / {totalPages}</div>

                        <Button size="sm" variant="outline" onClick={() => goToPage(currentPage + 1)} disabled={isLoading || currentPage >= totalPages}>
                            Sau
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialog xác nhận xóa */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa bản ghi dòng thời gian đã chọn? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteMutation.isPending}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                'Xóa'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
         </div>
     )
 }
