// src/components/service-requests-sidebar/service-requests-sidebar.tsx
import {useState, useMemo} from 'react'
import {useQuery} from '@tanstack/react-query'
import {apiClient} from '@/lib/api/client'
import {useCurrentRoomStore} from '@/lib/stores/current-room'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Loader2} from 'lucide-react'
import {cn} from '@/lib/utils'

interface ServiceRequestsSidebarProps {
    readonly onSelect: (serviceReqCode: string, storedServiceReqId?: string) => void
    readonly selectedCode?: string
    readonly serviceReqCode?: string
    readonly defaultStateId?: string
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
    serviceReqCode?: string
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

export function ServiceRequestsSidebar({onSelect, selectedCode, serviceReqCode, defaultStateId}: ServiceRequestsSidebarProps) {
    const {currentRoomId} = useCurrentRoomStore()
    // selectedStateId: 'all' means show all states (no state filter)
    // Default to 'all' to show all states, or use defaultStateId if provided
    const [selectedStateId, setSelectedStateId] = useState<string | undefined>(defaultStateId ?? 'all')
    const [filters, setFilters] = useState<FilterParams>({
        roomType: 'currentRoomId',
        stateType: '',
        timeType: 'actionTimestamp',
        limit: 15,
        offset: 0,
        order: 'DESC',
        orderBy: 'actionTimestamp',
        serviceReqCode: serviceReqCode
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
    const {data, isLoading} = useQuery({
        queryKey: ['workflow-history', currentRoomId, selectedStateId, filters],
        queryFn: () => {
            // build params: include stateId only when a concrete state is selected
            const params: any = {roomId: currentRoomId!, ...filters}
            if (selectedStateId && selectedStateId !== 'all') {
                params.stateId = selectedStateId
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

    const loadMore = () => {
        // keep for compatibility: move to next page
        setFilters(prev => ({...prev, offset: prev.offset + prev.limit}))
    }

    return (
        <div className="h-full flex flex-col border-r border-gray-200 bg-gray-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Danh sách yêu cầu</h3>

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
                        value={filters.serviceReqCode ?? ''}
                        onChange={(e) => updateFilter('serviceReqCode', e.target.value || undefined)}
                        placeholder="Tìm theo mã Y lệnh..."
                        className="text-sm"
                    />

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
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">
                                    Mã Y lệnh
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">
                                    Tên bệnh nhân
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-700 p-2 border-r border-gray-200">Trạng thái</th>
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
                                };
                            }) => {
                                const serviceReq = item.serviceRequest
                                const serviceReqCode = serviceReq?.hisServiceReqCode || serviceReq?.serviceReqCode || ''
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
                                        onClick={() => onSelect(serviceReqCode, item.storedServiceReqId)}
                                        className={cn(
                                            'cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100',
                                            selectedCode === serviceReqCode && 'bg-blue-100'
                                        )}
                                    >
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
                                        <td className="p-2 text-xs text-gray-500">
                                            {createdDate}
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
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
         </div>
     )
 }
