// src/components/service-requests-sidebar/service-requests-sidebar.tsx
import {useState, useMemo, useEffect} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {apiClient} from '@/lib/api/client'
import {useCurrentRoomStore} from '@/lib/stores/current-room'
import {useHisStore} from '@/lib/stores/his'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Label} from '@/components/ui/label'
import {Loader2, Trash2} from 'lucide-react'
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
    code?: string // Gộp receptionCode và hisServiceReqCode thành một trường
    flag?: string
    // Deprecated: sử dụng code thay thế
    hisServiceReqCode?: string
    receptionCode?: string
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
    const { token: hisToken } = useHisStore()
    // selectedStateId: 'all' means show all states (no state filter)
    // Default to 'all' to show all states, or use defaultStateId if provided
    const [selectedStateId, setSelectedStateId] = useState<string | undefined>(defaultStateId ?? 'all')
    // State để quản lý phòng được chọn từ dropdown
    const [selectedRoomId, setSelectedRoomId] = useState<string>('')
    // State tạm thời cho input tìm kiếm (chỉ update filters khi nhấn Enter)
    // Gộp cả mã Y lệnh và mã barcode vào một input
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
        limit: 20,
        offset: 0,
        order: 'DESC',
        orderBy: 'actionTimestamp',
        code: serviceReqCode || undefined
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

    // Query user rooms
    const {data: userRoomsData, isLoading: isLoadingUserRooms} = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyUserRooms(),
        staleTime: 5 * 60 * 1000,
    })

    const userRooms = useMemo(() => {
        const raw = (userRoomsData?.data as unknown) ?? []
        return Array.isArray(raw) ? (raw as any[]) : []
    }, [userRoomsData])

    // Auto-select phòng làm việc hiện tại nếu chưa chọn
    useEffect(() => {
        if (selectedRoomId) {
            // Đã chọn phòng, không cần làm gì
            return
        }
        // Ưu tiên chọn phòng làm việc hiện tại từ store
        if (currentRoomId && userRooms.length > 0) {
            // Kiểm tra xem currentRoomId có trong danh sách phòng của user không
            const currentRoomExists = userRooms.some((room: any) => room.roomId === currentRoomId)
            if (currentRoomExists) {
                setSelectedRoomId(currentRoomId)
                return
            }
        }
        // Nếu không có phòng làm việc hiện tại hoặc không có trong danh sách, chọn phòng đầu tiên
        if (userRooms.length > 0) {
            setSelectedRoomId(userRooms[0].roomId)
        } else {
            // Nếu không có phòng nào, chọn "Tất cả các phòng"
            setSelectedRoomId('all')
        }
    }, [userRooms, selectedRoomId, currentRoomId])

    // Query service requests
    const {data, isLoading, refetch} = useQuery({
        queryKey: ['workflow-history', selectedRoomId, selectedStateId, selectedFlag, filters, refreshTrigger],
        queryFn: () => {
            // build params: include stateId only when a concrete state is selected
            // Loại bỏ hisServiceReqCode và receptionCode khỏi filters để tránh gửi các trường deprecated
            const { hisServiceReqCode, receptionCode, ...filtersWithoutDeprecated } = filters
            // Nếu selectedRoomId là "all", truyền "" cho roomId, ngược lại truyền selectedRoomId
            const params: any = {roomId: selectedRoomId === 'all' ? '' : selectedRoomId, ...filtersWithoutDeprecated}
            if (selectedStateId && selectedStateId !== 'all') {
                params.stateId = selectedStateId
            }
            // Thêm flag nếu được chọn (khác 'all')
            if (selectedFlag && selectedFlag !== 'all') {
                params.flag = selectedFlag
            }
            // Sử dụng code (gộp từ hisServiceReqCode và receptionCode)
            if (filters.code) {
                params.code = filters.code
            } else {
                // Backward compatibility: nếu không có code, gộp từ hisServiceReqCode và receptionCode
                const code = [hisServiceReqCode, receptionCode].filter(Boolean).join(',') || undefined
                if (code) {
                    params.code = code
                }
            }
            return apiClient.getWorkflowHistory(params)
        },
        // enabled when state selection is initialized (can be 'all')
        // selectedRoomId có thể là rỗng để chọn tất cả phòng
        enabled: selectedStateId !== undefined,
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

    // Xử lý tìm kiếm khi nhấn Enter - gộp cả mã Y lệnh và mã barcode
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            // Gộp searchInput thành code
            updateFilter('code', searchInput || undefined)
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
            // Tìm workflow history item được chọn để lấy thông tin trước khi xóa
            const selectedItem = serviceRequests.find((item: any) => item.id === id) as any
            
            console.log('deleteMutation - id:', id)
            console.log('deleteMutation - selectedItem:', selectedItem)
            console.log('deleteMutation - toStateId:', selectedItem?.toStateId)
            
            // Nếu toStateId = '426df256-bbfa-28d1-e065-9e6b783dd008', gọi API unstart TRƯỚC khi xóa
            if (selectedItem?.toStateId === '426df256-bbfa-28d1-e065-9e6b783dd008') {
                console.log('✅ toStateId matches, calling unstartHisPacs BEFORE delete')
                
                const serviceReq = selectedItem?.serviceRequest
                const tdlServiceReqCode = serviceReq?.hisServiceReqCode || serviceReq?.serviceReqCode || ''
                
                console.log('deleteMutation - serviceReq:', serviceReq)
                console.log('deleteMutation - tdlServiceReqCode:', tdlServiceReqCode)
                
                if (tdlServiceReqCode) {
                    try {
                        // Lấy HIS token code
                        let tokenCode: string | null = typeof globalThis.window !== 'undefined' ? sessionStorage.getItem('hisTokenCode') : null
                        if (!tokenCode) {
                            tokenCode = hisToken?.tokenCode || null
                        }
                        if (!tokenCode) {
                            const hisStorage = localStorage.getItem('his-storage')
                            if (hisStorage) {
                                try {
                                    const parsed = JSON.parse(hisStorage)
                                    tokenCode = parsed.state?.token?.tokenCode || null
                                } catch (e) {
                                    console.error('Error parsing HIS storage:', e)
                                }
                            }
                        }
                        
                        if (tokenCode) {
                            console.log('✅ Calling unstartHisPacs with tdlServiceReqCode:', tdlServiceReqCode, 'tokenCode:', tokenCode?.substring(0, 10) + '...')
                            const unstartResponse = await apiClient.unstartHisPacs(
                                tdlServiceReqCode,
                                tokenCode
                            )
                            
                            console.log('unstartHisPacs response:', unstartResponse)
                            
                            if (!unstartResponse.success) {
                                console.error('❌ Lỗi gọi API HIS-PACS unstart:', unstartResponse)
                                // Không throw error để vẫn tiếp tục xóa workflow-history
                            } else {
                                console.log('✅ unstartHisPacs called successfully')
                            }
                        } else {
                            console.warn('⚠️ Không có TokenCode để gọi API HIS-PACS unstart')
                        }
                    } catch (unstartError: any) {
                        console.error('❌ Lỗi gọi API HIS-PACS unstart:', unstartError)
                        // Không throw error để vẫn tiếp tục xóa workflow-history
                    }
                }
            }
            
            // Sau khi gọi API unstart (nếu cần), mới gọi API xóa workflow-history
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
            const excelData: ExportExcelItem[] = serviceRequests.map((item: any) => {
                const serviceReq = item.serviceRequest
                const serviceReqCode = serviceReq?.hisServiceReqCode || serviceReq?.serviceReqCode || ''
                const patientName = serviceReq?.patientName || ''
                const stateName = item.toState?.stateName || 'Chưa xác định'
                const createdAt = formatDateTimeForExcel(item.createdAt)
                const receptionCode = serviceReq?.receptionCode || ''
                
                // Lấy numOfBlock từ nhiều vị trí có thể
                let numOfBlock = ''
                if (item.numOfBlock !== undefined && item.numOfBlock !== null && item.numOfBlock !== '') {
                    numOfBlock = String(item.numOfBlock)
                } else if (item.storedServiceRequest?.numOfBlock !== undefined && item.storedServiceRequest?.numOfBlock !== null && item.storedServiceRequest?.numOfBlock !== '') {
                    numOfBlock = String(item.storedServiceRequest.numOfBlock)
                } else if (serviceReq?.numOfBlock !== undefined && serviceReq?.numOfBlock !== null && serviceReq?.numOfBlock !== '') {
                    numOfBlock = String(serviceReq.numOfBlock)
                }

                // Debug log để kiểm tra cấu trúc dữ liệu
                if (serviceRequests.length > 0 && serviceRequests.indexOf(item) === 0) {
                    console.log('📦 Debug Excel export - First item structure:', {
                        item,
                        itemNumOfBlock: item.numOfBlock,
                        storedServiceRequest: item.storedServiceRequest,
                        serviceReq,
                    })
                }

                return {
                    serviceReqCode,
                    receptionCode,
                    patientName,
                    stateName,
                    numOfBlock,
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
                    <h3 className="text-sm font-semibold">Danh sách bệnh nhân</h3>
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
                                Xuất Excel
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

                {/* Room Selector */}
                <div className="mb-3">
                    <Select 
                        value={selectedRoomId} 
                        onValueChange={(value) => {
                            setSelectedRoomId(value)
                            // Reset to first page when changing room
                            setFilters(prev => ({...prev, offset: 0}))
                        }}
                        disabled={isLoadingUserRooms}
                    >
                        <SelectTrigger className="text-sm">
                            <SelectValue placeholder={isLoadingUserRooms ? "Đang tải..." : "Chọn phòng..."}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả các phòng</SelectItem>
                            {userRooms.map((room: any) => (
                                <SelectItem key={room.roomId} value={room.roomId}>
                                    {room.roomName} ({room.roomCode})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
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
                        placeholder="Tìm theo mã Y lệnh hoặc mã barcode (nhấn Enter)..."
                        className="text-sm"
                    />

                    {/* Filter by Flag */}
                    

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
                        <Select value={selectedFlag} onValueChange={(value) => {
                            setSelectedFlag(value)
                            setFilters(prev => ({...prev, offset: 0}))
                        }}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Chọn bệnh phẩm..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="ST">ST</SelectItem>
                                <SelectItem value="PT">PT</SelectItem>
                                <SelectItem value="HMMD">HMMD</SelectItem>
                                <SelectItem value="CL">CL</SelectItem>
                                <SelectItem value="HC">HC</SelectItem>
                                <SelectItem value="DB">DB</SelectItem>
                                <SelectItem value="HQMD">HQMD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto">
                {!selectedRoomId && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Vui lòng chọn phòng làm việc
                    </div>
                )}

                {selectedRoomId && !selectedStateId && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Vui lòng chọn trạng thái
                    </div>
                )}

                {selectedRoomId && selectedStateId && isLoading && filters.offset === 0 && (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400"/>
                    </div>
                )}

                {selectedRoomId && selectedStateId && !isLoading && serviceRequests.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy kết quả
                    </div>
                )}

                {selectedRoomId && selectedStateId && serviceRequests.length > 0 && (
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
                                    <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">Barcode</th>
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
                                                {receptionCode || <span className="text-gray-400">-</span>}
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
            {selectedRoomId && selectedStateId && serviceRequests.length > 0 && (
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
                            Bạn có chắc chắn muốn xóa bản ghi đã chọn? Hành động này không thể hoàn tác.
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
