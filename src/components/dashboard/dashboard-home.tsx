'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useCurrentRoomStore } from '@/lib/stores/current-room'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BarChart3, GitBranch, AlertCircle, Loader2 } from 'lucide-react'
import { getCaseVolumeColumnTooltip } from '@/components/dashboard/case-volume-period-range'

const BAR_COLORS = [
    'bg-red-600',
    'bg-orange-500',
    'bg-amber-500',
    'bg-lime-600',
    'bg-emerald-600',
    'bg-sky-600',
    'bg-blue-700',
    'bg-fuchsia-600',
]

function defaultDateRange(): { startDate: Date; endDate: Date } {
    const end = dayjs().endOf('day')
    const start = dayjs().subtract(29, 'day').startOf('day')
    return { startDate: start.toDate(), endDate: end.toDate() }
}

export function DashboardHome() {
    const { user } = useAuthStore()
    const [{ startDate, endDate }, setRange] = useState<{
        startDate: Date | null
        endDate: Date | null
    }>(defaultDateRange)
    const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
    const [filterByCurrentContext, setFilterByCurrentContext] = useState(false)

    const {
        currentRoomId,
        currentDepartmentId,
        currentRoomName,
        currentDepartmentName,
    } = useCurrentRoomStore()

    const fromIso = useMemo(() => {
        if (!startDate) return undefined
        return dayjs(startDate).startOf('day').toISOString()
    }, [startDate])

    const toIso = useMemo(() => {
        if (!endDate) return undefined
        return dayjs(endDate).endOf('day').toISOString()
    }, [endDate])

    const roomFilter = useMemo(() => {
        if (!filterByCurrentContext || !currentRoomId || !currentDepartmentId) {
            return { currentRoomId: undefined, currentDepartmentId: undefined }
        }
        return { currentRoomId, currentDepartmentId }
    }, [filterByCurrentContext, currentRoomId, currentDepartmentId])

    const stateQuery = useQuery({
        queryKey: [
            'dashboard',
            'workflow-state-distribution',
            fromIso,
            toIso,
            roomFilter.currentRoomId ?? '',
            roomFilter.currentDepartmentId ?? '',
        ],
        queryFn: async () => {
            const res = await apiClient.getDashboardWorkflowStateDistribution({
                fromDate: fromIso,
                toDate: toIso,
                currentRoomId: roomFilter.currentRoomId,
                currentDepartmentId: roomFilter.currentDepartmentId,
            })
            if (!res.success) {
                throw new Error(res.error || 'Không tải được phân bổ workflow')
            }
            return res.data!
        },
        enabled: Boolean(fromIso && toIso),
    })

    const volumeQuery = useQuery({
        queryKey: [
            'dashboard',
            'case-volume',
            granularity,
            fromIso,
            toIso,
            roomFilter.currentRoomId ?? '',
            roomFilter.currentDepartmentId ?? '',
        ],
        queryFn: async () => {
            const res = await apiClient.getDashboardCaseVolume({
                granularity,
                fromDate: fromIso,
                toDate: toIso,
                currentRoomId: roomFilter.currentRoomId,
                currentDepartmentId: roomFilter.currentDepartmentId,
            })
            if (!res.success) {
                throw new Error(res.error || 'Không tải được khối lượng ca')
            }
            return res.data!
        },
        enabled: Boolean(fromIso && toIso),
    })

    const stateTotalCases = useMemo(() => stateQuery.data?.totalCases ?? 0, [stateQuery.data?.totalCases])

    const maxVolume = useMemo(() => {
        const series = volumeQuery.data?.series ?? []
        return series.reduce((m, p) => Math.max(m, p.count), 0) || 1
    }, [volumeQuery.data?.series])

    const resetRange = () => setRange(defaultDateRange())

    const rangeIncomplete = !startDate || !endDate

    return (
        <div className="space-y-6">
            {rangeIncomplete && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Chọn đủ khoảng ngày</AlertTitle>
                    <AlertDescription>
                        Cần có ngày bắt đầu và ngày kết thúc để tải biểu đồ, hoặc bấm &quot;Đặt lại 30
                        ngày&quot;.
                    </AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Bộ lọc thời gian</CardTitle>
                    <CardDescription>
                        
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="space-y-2">
                        <DateRangePicker
                            value={{ startDate, endDate }}
                            onChange={({ startDate: s, endDate: e }) =>
                                setRange({ startDate: s, endDate: e })
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Select
                            value={granularity}
                            onValueChange={(v) => setGranularity(v as 'day' | 'week' | 'month')}
                        >
                            <SelectTrigger id="granularity" className="w-[200px]">
                                <SelectValue placeholder="Chọn" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Theo ngày</SelectItem>
                                <SelectItem value="week">Theo tuần (ISO)</SelectItem>
                                <SelectItem value="month">Theo tháng</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2 pb-2">
                        <Checkbox
                            id="room-filter"
                            checked={filterByCurrentContext}
                            disabled={!currentRoomId || !currentDepartmentId}
                            onCheckedChange={(c) => setFilterByCurrentContext(c === true)}
                        />
                        <label
                            htmlFor="room-filter"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Lọc theo phòng/khoa hiện tại
                            {currentRoomName ? (
                                <span className="text-muted-foreground font-normal">
                                    {' '}
                                    ({currentRoomName}
                                    {currentDepartmentName ? ` — ${currentDepartmentName}` : ''})
                                </span>
                            ) : (
                                <span className="text-muted-foreground font-normal">
                                    {' '}
                                    (chưa chọn phòng)
                                </span>
                            )}
                        </label>
                    </div>
                    <Button type="button" variant="outline" onClick={resetRange}>
                        Đặt lại 30 ngày gần nhất
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card className="min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <GitBranch className="h-5 w-5 text-emerald-700" />
                            <div>
                                <CardTitle>Phân bổ ca theo trạng thái</CardTitle>
                                <CardDescription className='mt-1'>
                                    Tổng:{' '}
                                    {stateQuery.isSuccess ? stateQuery.data.totalCases : '—'}
                                    {filterByCurrentContext && currentRoomName ? (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            — lọc: {currentRoomName}
                                            {currentDepartmentName ? `, ${currentDepartmentName}` : ''}
                                        </span>
                                    ) : null}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {stateQuery.isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                <span className="text-sm">Đang tải…</span>
                            </div>
                        ) : stateQuery.isError ? (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Không tải được dữ liệu</AlertTitle>
                                <AlertDescription>
                                    {stateQuery.error instanceof Error
                                        ? stateQuery.error.message
                                        : 'Lỗi không xác định'}
                                </AlertDescription>
                            </Alert>
                        ) : stateQuery.isSuccess && stateQuery.data.items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Không có dữ liệu.</p>
                        ) : stateQuery.isSuccess ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                                        {stateQuery.data.items.map((row, idx) => {
                                            const color =
                                                BAR_COLORS[idx % BAR_COLORS.length] ?? 'bg-emerald-600'
                                            const pct =
                                                stateTotalCases > 0
                                                    ? (row.count / stateTotalCases) * 100
                                                    : 0
                                            return (
                                                <div
                                                    key={row.stateId}
                                                    className={`inline-block h-full ${color}`}
                                                    style={{ width: `${pct}%` }}
                                                    title={`${row.stateName}: ${row.count}`}
                                                />
                                            )
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Thanh tổng 100% biểu diễn tỷ lệ số ca theo từng trạng thái.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {stateQuery.data.items.map((row, idx) => {
                                        const pct =
                                            stateTotalCases > 0 ? (row.count / stateTotalCases) * 100 : 0
                                        const color =
                                            BAR_COLORS[idx % BAR_COLORS.length] ?? 'bg-emerald-600'
                                        return (
                                            <div key={row.stateId} className="rounded-md border px-3 py-2">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span className="truncate pr-2">
                                                        <span
                                                            className={`mr-2 inline-block h-2 w-2 rounded-full ${color}`}
                                                        />
                                                        <span className="font-mono text-[11px]">{row.stateCode}</span>{' '}
                                                        - {row.stateName}
                                                    </span>
                                                    <span className="tabular-nums shrink-0">
                                                        {row.count} ({pct.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full ${color}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="min-w-0">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-700" />
                            <div>
                                <CardTitle>Khối lượng ca theo thời gian</CardTitle>
                                <CardDescription className='mt-1'>
                                    {volumeQuery.isSuccess
                                        ? `Tổng ${volumeQuery.data.total} (kỳ: ${volumeQuery.data.granularity})`
                                        : ''}
                                    
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {volumeQuery.isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                <span className="text-sm">Đang tải…</span>
                            </div>
                        ) : volumeQuery.isError ? (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Không tải được dữ liệu</AlertTitle>
                                <AlertDescription>
                                    {volumeQuery.error instanceof Error
                                        ? volumeQuery.error.message
                                        : 'Lỗi không xác định'}
                                </AlertDescription>
                            </Alert>
                        ) : volumeQuery.isSuccess && volumeQuery.data.series.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Không có dữ liệu.</p>
                        ) : volumeQuery.isSuccess ? (
                            <div className="space-y-4">
                                <div className="overflow-x-auto pb-2">
                                    <div
                                        className="flex min-h-[220px] items-end gap-1.5"
                                        style={{
                                            minWidth: `${Math.max(volumeQuery.data.series.length * 28, 280)}px`,
                                        }}
                                    >
                                        {volumeQuery.data.series.map((p) => {
                                            const h = Math.max(8, (p.count / maxVolume) * 180)
                                            const columnTitle = getCaseVolumeColumnTooltip(
                                                p.period,
                                                volumeQuery.data.granularity,
                                                p.count,
                                            )
                                            return (
                                                <div
                                                    key={p.period}
                                                    className="flex min-w-[24px] max-w-[48px] flex-1 cursor-help flex-col items-center justify-end gap-1"
                                                    title={columnTitle}
                                                >
                                                    <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                                                        {p.count}
                                                    </span>
                                                    <div
                                                        className="w-full rounded-t-md bg-emerald-600/85 transition-all"
                                                        style={{ height: `${h}px` }}
                                                    />
                                                    <span className="max-w-full truncate text-center text-[10px] text-muted-foreground">
                                                        {p.period}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {dayjs(volumeQuery.data.fromDate).format('DD/MM/YYYY HH:mm')} —{' '}
                                    {dayjs(volumeQuery.data.toDate).format('DD/MM/YYYY HH:mm')}
                                </p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>

            {/* <Card>
                <CardHeader>
                    <CardTitle>Thông tin phiên</CardTitle>
                    <CardDescription>Tài khoản và phòng làm việc hiện tại</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                            <span className="text-muted-foreground">Ứng dụng</span>
                            <span>v1.0.0</span>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                            <span className="text-muted-foreground">Người dùng</span>
                            <span className="text-right font-mono text-xs">{user?.username ?? '—'}</span>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-border/60 pb-2 sm:col-span-2">
                            <span className="text-muted-foreground">Phòng hiện tại</span>
                            <span className="text-right">
                                {currentRoomName ?? '—'}
                                {currentRoomId ? (
                                    <span className="block text-xs text-muted-foreground font-mono">
                                        {currentRoomId}
                                    </span>
                                ) : null}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    )
}
