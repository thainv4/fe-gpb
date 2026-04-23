'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { CalendarDays, ChevronLeft, ChevronRight, Download, Loader2, RotateCcw } from 'lucide-react'
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
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)).toISOString()
}

function localDateStrToUtcEndIso(dateStr: string): string {
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

type PreviewRow = {
    id: string
    createdAt?: string
    actionTimestamp?: string
    roomName?: string
    serviceRequest?: {
        hisServiceReqCode?: string
        serviceReqCode?: string
        patientName?: string
        patientCode?: string
        receptionCode?: string
    }
    toState?: { stateName?: string; stateCode?: string }
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
    const [isExporting, setIsExporting] = useState(false)
    const [lastExportInfo, setLastExportInfo] = useState<{ total: number; exported: number } | null>(null)
    const [debouncedCode, setDebouncedCode] = useState('')
    const [debouncedPatientName, setDebouncedPatientName] = useState('')
    const [previewOffset, setPreviewOffset] = useState(0)
    const [pageJumpDraft, setPageJumpDraft] = useState('1')

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedCode(codeInput.trim()), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(id)
    }, [codeInput])

    useEffect(() => {
        const id = window.setTimeout(() => setDebouncedPatientName(patientNameInput.trim()), SEARCH_DEBOUNCE_MS)
        return () => window.clearTimeout(id)
    }, [patientNameInput])

    const dateRangeValid = fromDate <= toDate

    useEffect(() => {
        setPreviewOffset(0)
    }, [fromDate, toDate, selectedRoomId, selectedStateId, debouncedCode, debouncedPatientName])

    const previewFromIso = localDateStrToUtcStartIso(fromDate)
    const previewToIso = localDateStrToUtcEndIso(toDate)
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

    const workflowStates = useMemo(() => statesData?.data?.items ?? [], [statesData?.data?.items])
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
            }),
        enabled: dateRangeValid,
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
        setPreviewOffset(0)
    }

    async function handleExportReport() {
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

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Phòng</Label>
                            <Select
                                value={selectedRoomId}
                                onValueChange={setSelectedRoomId}
                                disabled={isLoadingRooms}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingRooms ? 'Đang tải...' : 'Chọn phòng'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả phòng được phân quyền</SelectItem>
                                    {userRooms.map((room: { roomId: string; roomName: string; roomCode?: string }) => (
                                        <SelectItem key={room.roomId} value={room.roomId}>
                                            {room.roomName}
                                            {room.roomCode ? ` (${room.roomCode})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Trạng thái</Label>
                            <Select
                                value={selectedStateId}
                                onValueChange={setSelectedStateId}
                                disabled={isLoadingStates}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingStates ? 'Đang tải...' : 'Chọn trạng thái'} />
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

                        <div className="space-y-2">
                            <Label>Từ ngày</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="pr-10"
                                />
                                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Đến ngày</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="pr-10"
                                />
                                <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Mã (y lệnh / barcode / mã BN)</Label>
                            <Input
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                                placeholder="Tùy chọn"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tên bệnh nhân</Label>
                            <Input
                                value={patientNameInput}
                                onChange={(e) => setPatientNameInput(e.target.value)}
                                placeholder="Tùy chọn"
                            />
                        </div>
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
                            <div className="text-sm font-semibold text-gray-900">Xem trước kết quả</div>
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
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Phòng</TableHead>
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
