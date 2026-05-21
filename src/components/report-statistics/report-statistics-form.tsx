'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Download,
    Loader2,
    RotateCcw,
} from 'lucide-react'
import { isValidDateStr } from '@/components/ui/single-date-picker'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { getWorkflowStateBadgeClasses } from '@/lib/workflow-state-colors'

const EXPORT_ROW_CAP = 200_000
const PREVIEW_LIMIT = 20
/** Chọn trang bằng dropdown; nhiều hơn sẽ dùng ô số (tránh hàng nghìn mục trong DOM). */
const PREVIEW_MAX_SELECT_PAGES = 200
const SEARCH_DEBOUNCE_MS = 400

function formatDateInput(date: Date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

/** yyyy-mm-dd (local) → UTC 00:00:00 cùng calendar day (giống sidebar). */
function localDateStrToUtcStartIso(dateStr: string): string {
    if (!isValidDateStr(dateStr)) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString()
}

function localDateStrToUtcEndIso(dateStr: string): string {
    if (!isValidDateStr(dateStr)) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString()
}

function formatDateTimeVi(iso?: string) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function formatSampleTypeLabel(st: { typeName: string; typeCode?: string }) {
    return `${st.typeName}${st.typeCode ? ` (${st.typeCode})` : ''}`
}

type PreviewRow = {
    id: string
    createdAt?: string
    actionTimestamp?: string
    roomName?: string
    sampleTypeName?: string | null
    serviceRequest?: {
        hisServiceReqCode?: string
        serviceReqCode?: string
        patientName?: string
        patientCode?: string
        receptionCode?: string
        flag?: string | null
    }
    toState?: { stateName?: string; stateCode?: string }
    creator?: { id?: string; userName?: string; fullName?: string }
}

export default function ReportStatisticsForm() {
    const { toast } = useToast()
    const today = formatDateInput(new Date())
    const [fromDate, setFromDate] = useState(today)
    const [toDate, setToDate] = useState(today)
    const [selectedRoomId, setSelectedRoomId] = useState<string>('all')
    const [selectedStateId, setSelectedStateId] = useState<string>('all')
    const [codeInput, setCodeInput] = useState('')
    const [patientNameInput, setPatientNameInput] = useState('')
    const [selectedFlag, setSelectedFlag] = useState<string>('all')
    const [selectedSampleTypeId, setSelectedSampleTypeId] = useState<string>('all')
    const [resultConcludeInput, setResultConcludeInput] = useState('')
    const [icdNameInput, setIcdNameInput] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    const [lastExportInfo, setLastExportInfo] = useState<{ total: number; exported: number } | null>(null)
    const [debouncedCode, setDebouncedCode] = useState('')
    const [debouncedPatientName, setDebouncedPatientName] = useState('')
    const [debouncedResultConclude, setDebouncedResultConclude] = useState('')
    const [debouncedIcdName, setDebouncedIcdName] = useState('')
    const [previewOffset, setPreviewOffset] = useState(0)
    const [pageJumpDraft, setPageJumpDraft] = useState('1')
    const [fromDateInputKey, setFromDateInputKey] = useState(0)
    const [toDateInputKey, setToDateInputKey] = useState(0)
    const [textFiltersOpen, setTextFiltersOpen] = useState(false)
    const [sampleTypeSearch, setSampleTypeSearch] = useState('')
    const [sampleTypeSelectOpen, setSampleTypeSelectOpen] = useState(false)

    const activeTextFilterCount = useMemo(() => {
        let n = 0
        if (codeInput.trim()) n++
        if (patientNameInput.trim()) n++
        if (resultConcludeInput.trim()) n++
        if (icdNameInput.trim()) n++
        return n
    }, [codeInput, patientNameInput, resultConcludeInput, icdNameInput])

    const handleFromDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value
            if (!v) {
                toast({
                    title: 'Cảnh báo',
                    description:
                        'Vui lòng chọn ngày để tránh hệ thống bị quá tải.',
                    variant: 'destructive',
                })
                setFromDateInputKey((k) => k + 1)
                return
            }
            setFromDate(v)
        },
        [toast],
    )

    const handleToDateChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const v = e.target.value
            if (!v) {
                toast({
                    title: 'Cảnh báo',
                    description:
                        'Không được để trống Đến ngày. Vui lòng chọn ngày để tránh tải quá nhiều dữ liệu.',
                    variant: 'destructive',
                })
                setToDateInputKey((k) => k + 1)
                return
            }
            setToDate(v)
        },
        [toast],
    )

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedCode(codeInput.trim()), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(id)
    }, [codeInput])

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedPatientName(patientNameInput.trim()), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(id)
    }, [patientNameInput])

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedResultConclude(resultConcludeInput.trim()), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(id)
    }, [resultConcludeInput])

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedIcdName(icdNameInput.trim()), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(id)
    }, [icdNameInput])

    const datesValid = isValidDateStr(fromDate) && isValidDateStr(toDate)
    const dateRangeValid = datesValid && fromDate <= toDate
    const previewSampleTypeId = selectedSampleTypeId === 'all' ? undefined : selectedSampleTypeId

    useEffect(() => {
        setPreviewOffset(0)
    }, [
        fromDate,
        toDate,
        selectedRoomId,
        selectedStateId,
        debouncedCode,
        debouncedPatientName,
        selectedFlag,
        previewSampleTypeId,
        debouncedResultConclude,
        debouncedIcdName,
    ])

    const previewFromIso = useMemo(
        () => (datesValid ? localDateStrToUtcStartIso(fromDate) : ''),
        [fromDate, datesValid],
    )
    const previewToIso = useMemo(
        () => (datesValid ? localDateStrToUtcEndIso(toDate) : ''),
        [toDate, datesValid],
    )
    const previewRoomId = selectedRoomId === 'all' ? '' : selectedRoomId
    const previewStateId = selectedStateId === 'all' ? undefined : selectedStateId

    const { data: statesData, isLoading: isLoadingStates } = useQuery({
        queryKey: ['workflow-states'],
        queryFn: () =>
            apiClient.getWorkflowStates({
                limit: 100,
                offset: 0,
                isActive: 1,
                order: 'ASC',
                orderBy: 'stateOrder',
            }),
    })

    const { data: userRoomsData, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['my-user-rooms'],
        queryFn: () => apiClient.getMyUserRooms(),
        staleTime: 5 * 60 * 1000,
    })

    const { data: sampleTypesData, isLoading: isLoadingSampleTypes } = useQuery({
        queryKey: ['sample-types-report-filter'],
        queryFn: () => apiClient.getSampleTypes({ isActive: true, limit: 500, offset: 0 }),
        staleTime: 10 * 60 * 1000,
    })

    const workflowStates = useMemo(() => statesData?.data?.items ?? [], [statesData?.data?.items])
    const sampleTypes = useMemo(
        () => sampleTypesData?.data?.sampleTypes ?? [],
        [sampleTypesData?.data?.sampleTypes],
    )
    const normalizedSampleTypeSearch = sampleTypeSearch.trim()
    const {
        data: searchedSampleTypeData,
        isError: isSampleTypeSearchError,
        error: sampleTypeSearchError,
        isFetching: isSearchingSampleType,
    } = useQuery({
        queryKey: ['sample-type-search-report', normalizedSampleTypeSearch],
        queryFn: () =>
            apiClient.getSampleTypes({
                search: normalizedSampleTypeSearch,
                isActive: true,
                limit: 100,
                offset: 0,
            }),
        enabled: normalizedSampleTypeSearch.length > 0,
        placeholderData: (previousData) => previousData,
        retry: false,
    })
    const filteredSampleTypes = useMemo(() => {
        type St = { id: string; typeName: string; typeCode?: string }
        let list: St[]
        if (normalizedSampleTypeSearch) {
            list = (searchedSampleTypeData?.data?.sampleTypes ?? []) as St[]
        } else {
            list = sampleTypes as St[]
        }
        if (
            selectedSampleTypeId !== 'all' &&
            !list.some((s) => s.id === selectedSampleTypeId)
        ) {
            const selected = (sampleTypes as St[]).find((s) => s.id === selectedSampleTypeId)
            if (selected) list = [selected, ...list]
        }
        return list
    }, [
        normalizedSampleTypeSearch,
        searchedSampleTypeData,
        sampleTypes,
        selectedSampleTypeId,
    ])
    const selectedSampleTypeLabel = useMemo(() => {
        if (selectedSampleTypeId === 'all') return undefined
        const st =
            (sampleTypes as { id: string; typeName: string; typeCode?: string }[]).find(
                (s) => s.id === selectedSampleTypeId,
            ) ?? filteredSampleTypes.find((s) => s.id === selectedSampleTypeId)
        return st ? formatSampleTypeLabel(st) : undefined
    }, [selectedSampleTypeId, sampleTypes, filteredSampleTypes])
    const userRooms = useMemo(() => userRoomsData?.data?.rooms ?? [], [userRoomsData?.data?.rooms])

    const {
        data: previewResponse,
        isLoading: isPreviewLoading,
        isFetching: isPreviewFetching,
    } = useQuery({
        queryKey: [
            'report-workflow-preview',
            previewRoomId,
            previewStateId,
            previewFromIso,
            previewToIso,
            debouncedCode,
            debouncedPatientName,
            selectedFlag,
            previewSampleTypeId,
            debouncedResultConclude,
            debouncedIcdName,
            previewOffset,
        ],
        queryFn: () =>
            apiClient.getWorkflowHistory({
                roomId: previewRoomId,
                stateId: previewStateId,
                roomType: 'currentRoomId',
                stateType: 'toStateId',
                timeType: 'actionTimestamp',
                fromDate: previewFromIso,
                toDate: previewToIso,
                limit: PREVIEW_LIMIT,
                offset: previewOffset,
                order: 'DESC',
                orderBy: 'actionTimestamp',
                code: debouncedCode || undefined,
                patientName: debouncedPatientName || undefined,
                flag: selectedFlag !== 'all' ? selectedFlag : undefined,
                sampleTypeId: previewSampleTypeId,
                resultConclude: debouncedResultConclude || undefined,
                icdName: debouncedIcdName || undefined,
            }),
        enabled: dateRangeValid && Boolean(previewFromIso && previewToIso),
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
    })

    const previewItems = (previewResponse?.data?.items ?? []) as PreviewRow[]
    const previewTotal = previewResponse?.data?.pagination?.total ?? 0
    const previewPage = Math.floor(previewOffset / PREVIEW_LIMIT) + 1
    const previewTotalPages = Math.max(1, Math.ceil(previewTotal / PREVIEW_LIMIT))

    useEffect(() => {
        setPageJumpDraft(String(previewPage))
    }, [previewPage, previewTotalPages])

    function goToPage(page: number) {
        const p = Math.min(previewTotalPages, Math.max(1, Math.floor(page)))
        setPreviewOffset((p - 1) * PREVIEW_LIMIT)
    }

    function commitPageJump() {
        const n = Math.floor(Number(pageJumpDraft))
        if (!Number.isFinite(n)) {
            setPageJumpDraft(String(previewPage))
            return
        }
        goToPage(n)
    }

    function handleReset() {
        setFromDate(formatDateInput(new Date()))
        setToDate(formatDateInput(new Date()))
        setSelectedRoomId('all')
        setSelectedStateId('all')
        setCodeInput('')
        setPatientNameInput('')
        setSelectedFlag('all')
        setSelectedSampleTypeId('all')
        setSampleTypeSearch('')
        setResultConcludeInput('')
        setIcdNameInput('')
        setPreviewOffset(0)
        setTextFiltersOpen(false)
    }

    async function handleExportReport() {
        if (!datesValid) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn đủ Từ ngày và Đến ngày',
                variant: 'destructive',
            })
            return
        }
        if (fromDate > toDate) {
            toast({
                title: 'Lỗi',
                description: 'Từ ngày không được sau Đến ngày',
                variant: 'destructive',
            })
            return
        }

        const days =
            Math.round(
                (new Date(`${toDate}T00:00:00`).getTime() -
                    new Date(`${fromDate}T00:00:00`).getTime()) /
                86_400_000,
            ) + 1
        if (days > 31) {
            const ok = window.confirm(
                `Khoảng lọc là ${days} ngày. Quá trình tải có thể mất vài phút. Tiếp tục xuất?`,
            )
            if (!ok) return
        }

        setIsExporting(true)
        try {
            const roomId = selectedRoomId === 'all' ? '' : selectedRoomId
            const stateId = selectedStateId === 'all' ? undefined : selectedStateId

            const { blob, fileName, total } = await apiClient.downloadWorkflowHistoryReportExport({
                roomId,
                stateId,
                roomType: 'currentRoomId',
                stateType: 'toStateId',
                fromDate: localDateStrToUtcStartIso(fromDate),
                toDate: localDateStrToUtcEndIso(toDate),
                maxRows: EXPORT_ROW_CAP,
                order: 'DESC',
                orderBy: 'actionTimestamp',
                code: codeInput.trim() || undefined,
                patientName: patientNameInput.trim() || undefined,
                flag: selectedFlag !== 'all' ? selectedFlag : undefined,
                sampleTypeId: selectedSampleTypeId !== 'all' ? selectedSampleTypeId : undefined,
                resultConclude: resultConcludeInput.trim() || undefined,
                icdName: icdNameInput.trim() || undefined,
            })

            if (total === 0) {
                setLastExportInfo({ total: 0, exported: 0 })
                toast({
                    title: 'Thông báo',
                    description: 'Không có dữ liệu trong khoảng lọc đã chọn',
                })
                return
            }

            const objectUrl = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = objectUrl
            anchor.download = fileName
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            setTimeout(() => URL.revokeObjectURL(objectUrl), 5_000)

            const isTruncated = total >= EXPORT_ROW_CAP
            setLastExportInfo({ total, exported: total })

            if (isTruncated) {
                toast({
                    title: `Cảnh báo: chạm giới hạn ${EXPORT_ROW_CAP.toLocaleString('vi-VN')} dòng`,
                    description: `Kết quả đã bị cắt ở giới hạn an toàn ${EXPORT_ROW_CAP.toLocaleString('vi-VN')} dòng. Vui lòng thu hẹp khoảng ngày hoặc tách kỳ xuất để có đủ dữ liệu.`,
                })
            }

            toast({
                title: 'Thành công',
                description: `Đã xuất ${total.toLocaleString('vi-VN')} dòng ra file Excel`,
            })
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Có lỗi khi xuất báo cáo'
            toast({
                title: 'Lỗi',
                description: message,
                variant: 'destructive',
            })
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
                    {/* <p className="mt-1 text-sm text-muted-foreground">
                        Xuất Excel theo lịch sử trạng thái (một dòng = một bản ghi workflow), lọc theo thời điểm
                        chuyển trạng thái.
                    </p> */}
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleReset} disabled={isExporting}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Đặt lại
                    </Button>
                    <Button type="button" onClick={handleExportReport} disabled={isExporting}>
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang xuất...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Xuất báo cáo
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="space-y-4 p-4">
                    <div className="text-sm font-semibold text-gray-900">Bộ lọc báo cáo</div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Từ ngày</Label>
                                <div className="relative">
                                    <Input
                                        key={fromDateInputKey}
                                        type="date"
                                        value={fromDate}
                                        onChange={handleFromDateChange}
                                        className="w-full pr-10"
                                    />
                                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Đến ngày</Label>
                                <div className="relative">
                                    <Input
                                        key={toDateInputKey}
                                        type="date"
                                        value={toDate}
                                        onChange={handleToDateChange}
                                        className="w-full pr-10"
                                    />
                                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Phòng</Label>
                                <Select
                                    value={selectedRoomId}
                                    onValueChange={setSelectedRoomId}
                                    disabled={isLoadingRooms}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={isLoadingRooms ? 'Đang tải...' : 'Chọn phòng'}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả phòng được phân quyền</SelectItem>
                                        {userRooms.map(
                                            (room: { roomId: string; roomName: string; roomCode?: string }) => (
                                                <SelectItem key={room.roomId} value={room.roomId}>
                                                    {room.roomName}
                                                    {room.roomCode ? ` (${room.roomCode})` : ''}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                                <Select
                                    value={selectedStateId}
                                    onValueChange={setSelectedStateId}
                                    disabled={isLoadingStates}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue
                                            placeholder={isLoadingStates ? 'Đang tải...' : 'Chọn trạng thái'}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        {workflowStates.map((s: { id: string; stateName: string }) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.stateName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Phân loại BP</Label>
                                <Select value={selectedFlag} onValueChange={setSelectedFlag}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tất cả" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả phân loại</SelectItem>
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

                            <div className="flex min-w-0 flex-col gap-1.5">
                                <Label className="text-xs text-muted-foreground">Vị trí bệnh phẩm</Label>
                                <Select
                                    value={selectedSampleTypeId}
                                    onValueChange={setSelectedSampleTypeId}
                                    open={sampleTypeSelectOpen}
                                    onOpenChange={setSampleTypeSelectOpen}
                                    disabled={isLoadingSampleTypes && sampleTypes.length === 0}
                                >
                                    <SelectTrigger
                                        className="w-full"
                                        title={selectedSampleTypeLabel}
                                    >
                                        <SelectValue
                                            placeholder={
                                                isLoadingSampleTypes ? 'Đang tải...' : 'Tất cả vị trí'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent
                                        position="popper"
                                        className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
                                    >
                                        <div
                                            className="sticky top-0 z-10 border-b bg-white px-2 py-2"
                                            role="none"
                                            onKeyDownCapture={(e) => e.stopPropagation()}
                                        >
                                            <Input
                                                placeholder="Tìm kiếm vị trí..."
                                                value={sampleTypeSearch}
                                                onChange={(e) => setSampleTypeSearch(e.target.value)}
                                                onKeyDownCapture={(e) => e.stopPropagation()}
                                                className="text-sm"
                                                autoComplete="off"
                                            />
                                        </div>
                                        <SelectItem value="all">Tất cả vị trí</SelectItem>
                                        {isSampleTypeSearchError ? (
                                            <div className="px-2 py-1 text-sm text-red-600">
                                                Lỗi tìm kiếm:{' '}
                                                {sampleTypeSearchError instanceof Error
                                                    ? sampleTypeSearchError.message
                                                    : 'Không thể tải dữ liệu'}
                                            </div>
                                        ) : null}
                                        {filteredSampleTypes.length
                                            ? filteredSampleTypes.map((st) => {
                                                  const label = formatSampleTypeLabel(st)
                                                  return (
                                                      <SelectItem
                                                          key={st.id}
                                                          value={st.id}
                                                          className="truncate"
                                                          title={label}
                                                      >
                                                          <span className="block truncate" title={label}>
                                                              {label}
                                                          </span>
                                                      </SelectItem>
                                                  )
                                              })
                                            : !isSearchingSampleType && (
                                                  <div className="px-2 py-1 text-sm text-muted-foreground">
                                                      Không có dữ liệu
                                                  </div>
                                              )}
                                        {isSearchingSampleType ? (
                                            <div className="px-2 py-1 text-sm text-muted-foreground">
                                                Đang tìm kiếm...
                                            </div>
                                        ) : null}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                                onClick={() => setTextFiltersOpen((open) => !open)}
                                aria-expanded={textFiltersOpen}
                            >
                                {textFiltersOpen ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                ) : (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                )}
                                Tìm thêm
                                {activeTextFilterCount > 0 ? (
                                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                        {activeTextFilterCount}
                                    </span>
                                ) : null}
                            </Button>
                            {!textFiltersOpen && activeTextFilterCount > 0 ? (
                                <span className="text-xs text-muted-foreground">
                                    Đang lọc theo {activeTextFilterCount} tiêu chí tìm kiếm
                                </span>
                            ) : null}
                        </div>

                        {textFiltersOpen ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <Label
                                        className="text-xs text-muted-foreground"
                                        title="Mã y lệnh / Barcode / Mã bệnh nhân"
                                    >
                                        Mã / Barcode / Mã BN
                                    </Label>
                                    <Input
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value)}
                                        placeholder="Tùy chọn"
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Tên bệnh nhân</Label>
                                    <Input
                                        value={patientNameInput}
                                        onChange={(e) => setPatientNameInput(e.target.value)}
                                        placeholder="Tùy chọn"
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Kết luận</Label>
                                    <Input
                                        value={resultConcludeInput}
                                        onChange={(e) => setResultConcludeInput(e.target.value)}
                                        placeholder="Tìm theo kết luận (một phần)"
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex min-w-0 flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Chẩn đoán lâm sàng</Label>
                                    <Input
                                        value={icdNameInput}
                                        onChange={(e) => setIcdNameInput(e.target.value)}
                                        placeholder="Tìm theo chẩn đoán (một phần)"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {lastExportInfo && (
                        <div className="text-xs text-muted-foreground">
                            Lần xuất gần nhất: {lastExportInfo.exported.toLocaleString('vi-VN')} dòng
                            {lastExportInfo.total >= EXPORT_ROW_CAP &&
                                ` (đã chạm giới hạn an toàn ${EXPORT_ROW_CAP.toLocaleString('vi-VN')} dòng)`}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Xem trước danh sách</div>
                        </div>
                        {!dateRangeValid && (
                            <span className="text-xs font-medium text-destructive">Từ ngày không được sau Đến ngày</span>
                        )}
                    </div>

                    {!dateRangeValid ? null : isPreviewLoading && !previewResponse ? (
                        <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Đang tải danh sách…
                        </div>
                    ) : previewTotal === 0 ? (
                        <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                            Không có bản ghi trong khoảng lọc đã chọn
                        </div>
                    ) : (
                        <>
                            <div
                                className={cn(
                                    'relative rounded-md border',
                                    isPreviewFetching && !isPreviewLoading && 'opacity-80',
                                )}
                            >
                                {isPreviewFetching && !isPreviewLoading ? (
                                    <div className="absolute inset-0 z-[1] flex items-center justify-center rounded-md bg-background/40">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : null}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">STT</TableHead>
                                            <TableHead>Barcode</TableHead>
                                            <TableHead>Mã Y lệnh</TableHead>
                                            <TableHead>Mã bệnh nhân</TableHead>
                                            <TableHead>Tên bệnh nhân</TableHead>
                                            <TableHead>Vị trí bệnh phẩm</TableHead>
                                            <TableHead>Phân loại BP</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Phòng</TableHead>
                                            <TableHead className="min-w-[100px]">Người thực hiện</TableHead>
                                            <TableHead className="whitespace-nowrap">Thời gian (ghi nhận)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewItems.map((item, idx) => {
                                            const sr = item.serviceRequest
                                            const yLenh =
                                                sr?.hisServiceReqCode || sr?.serviceReqCode || '—'
                                            const barcode = sr?.receptionCode || '—'
                                            const ts = item.actionTimestamp ?? item.createdAt
                                            const stateName = item.toState?.stateName
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="text-muted-foreground">
                                                        {previewOffset + idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-mono">{barcode}</TableCell>
                                                    <TableCell className="font-mono">{yLenh}</TableCell>
                                                    <TableCell className="font-mono">
                                                        {sr?.patientCode || '—'}
                                                    </TableCell>
                                                    <TableCell>{sr?.patientName || '—'}</TableCell>
                                                    <TableCell>{item.sampleTypeName || '—'}</TableCell>
                                                    <TableCell>{item.serviceRequest?.flag || '—'}</TableCell>
                                                    <TableCell>
                                                        {stateName ? (
                                                            <span
                                                                className={cn(
                                                                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                                                    getWorkflowStateBadgeClasses(
                                                                        item.toState?.stateCode,
                                                                    ),
                                                                )}
                                                            >
                                                                {stateName}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{item.roomName || '—'}</TableCell>
                                                    <TableCell className="text-xs">
                                                        {item.creator ? (
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-medium text-foreground">
                                                                    {item.creator.fullName || '—'}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {item.creator.userName || '—'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {formatDateTimeVi(ts)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-muted-foreground">
                                    Tổng{' '}
                                    <span className="font-medium text-foreground">
                                        {previewTotal.toLocaleString('vi-VN')}
                                    </span>{' '}
                                    bản ghi
                                </span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span>Trang</span>
                                        {previewTotalPages <= PREVIEW_MAX_SELECT_PAGES ? (
                                            <Select
                                                value={String(previewPage)}
                                                onValueChange={(v) => {
                                                    const p = Number(v)
                                                    if (Number.isFinite(p)) {
                                                        goToPage(p)
                                                    }
                                                }}
                                                disabled={isPreviewFetching}
                                            >
                                                <SelectTrigger className="h-8 w-24" id="report-preview-page-select">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.from(
                                                        { length: previewTotalPages },
                                                        (_, i) => i + 1,
                                                    ).map((p) => (
                                                        <SelectItem key={p} value={String(p)}>
                                                            {p} / {previewTotalPages}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={previewTotalPages}
                                                    className="h-8 w-16 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    name="report-preview-page-jump"
                                                    value={pageJumpDraft}
                                                    onChange={(e) => setPageJumpDraft(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur()
                                                        }
                                                    }}
                                                    onBlur={commitPageJump}
                                                    disabled={isPreviewFetching}
                                                />
                                                <span>/ {previewTotalPages}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={previewOffset === 0 || isPreviewFetching}
                                            onClick={() => setPreviewOffset((o) => Math.max(0, o - PREVIEW_LIMIT))}
                                            aria-label="Trang trước"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={
                                                previewOffset + PREVIEW_LIMIT >= previewTotal || isPreviewFetching
                                            }
                                            onClick={() => setPreviewOffset((o) => o + PREVIEW_LIMIT)}
                                            aria-label="Trang sau"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
