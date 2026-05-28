'use client'

import { useCallback, useState } from 'react'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Download, Loader2, RotateCcw } from 'lucide-react'
import { isValidDateStr } from '@/components/ui/single-date-picker'
import { apiClient, ServiceRequestAuditLogItem } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/stores/auth'

const PAGE_SIZE = 20
const EVENT_CATEGORIES = ['WORKFLOW', 'RESULT', 'SIGN', 'DOCUMENT', 'TICKET'] as const

function formatDateInput(date: Date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

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

function defaultFromDate() {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return formatDateInput(d)
}

export default function AuditLogTable() {
    const { toast } = useToast()
    const { user } = useAuthStore()
    const isAdmin = user?.role?.toLowerCase() === 'admin'

    const [fromDate, setFromDate] = useState(defaultFromDate)
    const [toDate, setToDate] = useState(formatDateInput(new Date()))
    const [codeInput, setCodeInput] = useState('')
    const [patientNameInput, setPatientNameInput] = useState('')
    const [selectedRoomId, setSelectedRoomId] = useState<string>('all')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [offset, setOffset] = useState(0)
    const [applied, setApplied] = useState({
        fromDate: defaultFromDate(),
        toDate: formatDateInput(new Date()),
        code: '',
        patientName: '',
        roomId: 'all',
        category: 'all',
    })
    const [detailId, setDetailId] = useState<string | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    const { data: myRoomsData } = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyRooms(),
    })
    const rooms = myRoomsData?.data?.rooms ?? []

    const listQuery = useQuery({
        queryKey: ['service-request-audit-logs', applied, offset],
        queryFn: () =>
            apiClient.getServiceRequestAuditLogs({
                fromDate: localDateStrToUtcStartIso(applied.fromDate),
                toDate: localDateStrToUtcEndIso(applied.toDate),
                code: applied.code || undefined,
                patientName: applied.patientName || undefined,
                roomId: applied.roomId !== 'all' ? applied.roomId : undefined,
                eventCategory:
                    applied.category !== 'all' ? [applied.category] : undefined,
                limit: PAGE_SIZE,
                offset,
            }),
    })

    const detailQuery = useQuery({
        queryKey: ['service-request-audit-log', detailId],
        queryFn: () => apiClient.getServiceRequestAuditLogById(detailId!),
        enabled: !!detailId,
    })

    const items = listQuery.data?.data?.items ?? []
    const total = listQuery.data?.data?.pagination?.total ?? 0
    const page = Math.floor(offset / PAGE_SIZE) + 1
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    const applyFilters = useCallback(() => {
        setApplied({
            fromDate,
            toDate,
            code: codeInput.trim(),
            patientName: patientNameInput.trim(),
            roomId: selectedRoomId,
            category: selectedCategory,
        })
        setOffset(0)
    }, [fromDate, toDate, codeInput, patientNameInput, selectedRoomId, selectedCategory])

    const resetFilters = () => {
        const from = defaultFromDate()
        const to = formatDateInput(new Date())
        setFromDate(from)
        setToDate(to)
        setCodeInput('')
        setPatientNameInput('')
        setSelectedRoomId('all')
        setSelectedCategory('all')
        setApplied({
            fromDate: from,
            toDate: to,
            code: '',
            patientName: '',
            roomId: 'all',
            category: 'all',
        })
        setOffset(0)
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const { blob, fileName, total: exportTotal } =
                await apiClient.downloadServiceRequestAuditLogsExport({
                    fromDate: localDateStrToUtcStartIso(applied.fromDate),
                    toDate: localDateStrToUtcEndIso(applied.toDate),
                    code: applied.code || undefined,
                    patientName: applied.patientName || undefined,
                    roomId: applied.roomId !== 'all' ? applied.roomId : undefined,
                    eventCategory:
                        applied.category !== 'all' ? [applied.category] : undefined,
                })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            a.click()
            URL.revokeObjectURL(url)
            toast({
                title: 'Xuất Excel thành công',
                description: `${exportTotal} dòng`,
            })
        } catch (e: unknown) {
            toast({
                variant: 'destructive',
                title: 'Lỗi xuất file',
                description: e instanceof Error ? e.message : 'Không thể xuất Excel',
            })
        } finally {
            setIsExporting(false)
        }
    }

    const serviceLabel = (row: ServiceRequestAuditLogItem) => {
        if (row.scope === 'TICKET' && !row.serviceName) return 'Cả phiếu'
        return row.serviceName || '—'
    }

    const detail = detailQuery.data?.data

    return (
        <div className="space-y-4 p-4 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold">Nhật ký phiếu</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Lịch sử tác động lên phiếu và từng dịch vụ (không hiển thị diff nội dung kết quả).
                </p>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <Label>Từ ngày</Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Đến ngày</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Mã phiếu</Label>
                            <Input
                                placeholder="GPB / HIS / tiếp nhận"
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Tên bệnh nhân</Label>
                            <Input
                                value={patientNameInput}
                                onChange={(e) => setPatientNameInput(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Phòng</Label>
                            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Phòng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isAdmin && (
                                        <SelectItem value="all">Tất cả phòng</SelectItem>
                                    )}
                                    {rooms.map((r) => (
                                        <SelectItem key={r.roomId} value={r.roomId}>
                                            {r.roomName || r.roomCode}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Loại sự kiện</Label>
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    {EVENT_CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={applyFilters}>
                            Tìm
                        </Button>
                        <Button type="button" variant="outline" onClick={resetFilters}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4 mr-1" />
                            )}
                            Xuất Excel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    {listQuery.isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Người thực hiện</TableHead>
                                        <TableHead>Phòng</TableHead>
                                        <TableHead>Loại</TableHead>
                                        <TableHead>Hành động</TableHead>
                                        <TableHead>Phiếu</TableHead>
                                        <TableHead>Bệnh nhân</TableHead>
                                        <TableHead>Dịch vụ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                Không có dữ liệu
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => setDetailId(row.id)}
                                            >
                                                <TableCell>
                                                    {formatDateTimeVi(row.occurredAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {row.actionUserFullName ||
                                                        row.actionUsername ||
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {row.actionRoomName || '—'}
                                                </TableCell>
                                                <TableCell>{row.eventCategory}</TableCell>
                                                <TableCell>{row.eventTitle}</TableCell>
                                                <TableCell>
                                                    {row.serviceReqCode ||
                                                        row.hisServiceReqCode ||
                                                        '—'}
                                                </TableCell>
                                                <TableCell>{row.patientName || '—'}</TableCell>
                                                <TableCell>{serviceLabel(row)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-muted-foreground">
                                    Tổng {total} dòng — trang {page}/{totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={offset <= 0}
                                        onClick={() =>
                                            setOffset((o) => Math.max(0, o - PAGE_SIZE))
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={offset + PAGE_SIZE >= total}
                                        onClick={() => setOffset((o) => o + PAGE_SIZE)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{detail?.eventTitle ?? 'Chi tiết'}</DialogTitle>
                    </DialogHeader>
                    {detailQuery.isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    ) : detail ? (
                        <div className="space-y-3 text-sm">
                            <p>
                                <span className="font-medium">Thời gian:</span>{' '}
                                {formatDateTimeVi(detail.occurredAt)}
                            </p>
                            <p>
                                <span className="font-medium">Người thực hiện:</span>{' '}
                                {detail.actionUserFullName || detail.actionUsername}
                            </p>
                            {detail.summary && (
                                <p>
                                    <span className="font-medium">Tóm tắt:</span> {detail.summary}
                                </p>
                            )}
                            {detail.notes && (
                                <p>
                                    <span className="font-medium">Ghi chú:</span> {detail.notes}
                                </p>
                            )}
                            {detail.payload && (
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(detail.payload, null, 2)}
                                </pre>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    )
}
