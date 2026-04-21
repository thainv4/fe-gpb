'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { CalendarDays, Download, FileClock, RotateCcw, Save } from 'lucide-react'

interface ExportColumn {
    id: string
    label: string
    checked: boolean
}

const DEFAULT_COLUMNS: ExportColumn[] = [
    { id: 'department', label: 'Khoa / phòng chỉ định', checked: true },
    { id: 'sampleReceiver', label: 'Người nhận mẫu và thời gian nhận mẫu', checked: true },
    { id: 'sampleType', label: 'Vị trí bệnh phẩm', checked: true },
    { id: 'stainingMethod', label: 'Phương pháp nhuộm', checked: false },
    { id: 'result', label: 'Kết quả xét nghiệm', checked: true },
    { id: 'services', label: 'Dịch vụ xét nghiệm', checked: false },
    { id: 'status', label: 'Trạng thái', checked: false },
    { id: 'createdAt', label: 'Ngày tạo', checked: false },
    { id: 'note', label: 'Ghi chú', checked: false },
]

function formatDateInput(date: Date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default function ReportStatisticsForm() {
    const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS)
    const [fromDate] = useState(formatDateInput(new Date()))
    const [toDate] = useState(formatDateInput(new Date()))
    const [isColumnsExpanded, setIsColumnsExpanded] = useState(false)

    const selectedCount = useMemo(() => columns.filter((item) => item.checked).length, [columns])
    const selectedLabels = useMemo(
        () => columns.filter((item) => item.checked).map((item) => item.label),
        [columns]
    )

    function handleToggleColumn(id: string, checked: boolean) {
        setColumns((prev) => prev.map((item) => (item.id === id ? { ...item, checked } : item)))
    }

    function handleSelectAllColumns() {
        setColumns((prev) => prev.map((item) => ({ ...item, checked: true })))
    }

    function handleClearAllColumns() {
        setColumns((prev) => prev.map((item) => ({ ...item, checked: false })))
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Đặt lại
                    </Button>
                    <Button type="button" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Xuất báo cáo
                    </Button>
                    <Button type="button">
                        <Save className="mr-2 h-4 w-4" />
                        Lưu mẫu mới
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <Card className="xl:col-span-1">
                    <CardContent className="space-y-3 p-4">
                        <div className="text-sm font-semibold text-gray-900">Mẫu đã lưu</div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Hệ thống</div>

                        <button
                            type="button"
                            className="w-full rounded-lg border border-blue-200 bg-blue-50 p-3 text-left transition hover:bg-blue-100"
                        >
                            <div className="flex items-start gap-2">
                                <FileClock className="mt-0.5 h-4 w-4 text-blue-700" />
                                <div>
                                    <div className="text-sm font-medium text-blue-900">
                                        Tài liệu sắp hết hạn (30 ngày)
                                    </div>
                                    <div className="mt-1 text-xs text-blue-800">
                                        Tài liệu đã phê chuẩn duyệt trong 30 ngày tới
                                    </div>
                                    <div className="mt-1 text-[11px] text-blue-700">21/04/2026</div>
                                </div>
                            </div>
                        </button>
                    </CardContent>
                </Card>

                <Card className="xl:col-span-3">
                    <CardContent className="space-y-4 p-4">
                        <div className="text-sm font-semibold text-gray-900">Bộ lọc báo cáo</div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Trường ngày</Label>
                                <Select defaultValue="createdDate">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ngày tạo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="createdDate">Ngày tạo</SelectItem>
                                        <SelectItem value="approvedDate">Ngày phê duyệt</SelectItem>
                                        <SelectItem value="effectiveDate">Ngày hiệu lực</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Từ ngày</Label>
                                <div className="relative">
                                    <Input type="date" defaultValue={fromDate} className="pr-10" />
                                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Đến ngày</Label>
                                <div className="relative">
                                    <Input type="date" defaultValue={toDate} className="pr-10" />
                                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Khoa / Phòng chỉ định</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả khoa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả khoa</SelectItem>
                                        <SelectItem value="department-1">Khoa Giải phẫu bệnh</SelectItem>
                                        <SelectItem value="department-2">Khoa Sinh hóa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Vị trí bệnh phẩm</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả vị trí bệnh phẩm" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả vị trí bệnh phẩm</SelectItem>
                                        <SelectItem value="breast">Vú</SelectItem>
                                        <SelectItem value="thyroid">Tuyến giáp</SelectItem>
                                        <SelectItem value="stomach">Dạ dày</SelectItem>
                                        <SelectItem value="colon">Đại tràng</SelectItem>
                                        <SelectItem value="lung">Phổi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Trạng thái</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tất cả trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="active">Đang hiệu lực</SelectItem>
                                        <SelectItem value="expired">Hết hiệu lực</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gray-900">
                            Cột xuất Excel ({selectedCount}/{columns.length} đã chọn)
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="link" className="h-auto p-0" onClick={handleSelectAllColumns}>
                                Chọn tất cả
                            </Button>
                            <Button type="button" variant="link" className="h-auto p-0" onClick={handleClearAllColumns}>
                                Bỏ chọn
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsColumnsExpanded((prev) => !prev)}
                            >
                                {isColumnsExpanded ? 'Thu gọn' : 'Chọn cột'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {selectedLabels.slice(0, 6).map((label) => (
                            <span key={label} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                {label}
                            </span>
                        ))}
                        {selectedLabels.length > 6 && (
                            <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                +{selectedLabels.length - 6}
                            </span>
                        )}
                    </div>

                    {isColumnsExpanded && (
                        <div className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-2">
                            {columns.map((item) => (
                                <label key={item.id} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50">
                                    <Checkbox
                                        checked={item.checked}
                                        onCheckedChange={(checked) => handleToggleColumn(item.id, checked === true)}
                                    />
                                    <span className="text-sm text-gray-900">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
