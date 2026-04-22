'use client'

import { useMemo, useState } from 'react'
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
import { CalendarDays, Download, Loader2, RotateCcw } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'

const EXPORT_ROW_CAP = 200_000

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

    function handleReset() {
        setFromDate(formatDateInput(new Date()))
        setToDate(formatDateInput(new Date()))
        setSelectedRoomId('all')
        setSelectedStateId('all')
        setCodeInput('')
        setPatientNameInput('')
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
        </div>
    )
}
