'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarDays, Eraser, RefreshCw, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function SampleCabinetsForm() {
    const [selectedCell, setSelectedCell] = useState<string | null>(null)

    const selectedLabel = useMemo(() => {
        if (!selectedCell) return 'Chọn khay để xem vị trí lưu mẫu'
        return `Đang chọn vị trí: ${selectedCell}`
    }, [selectedCell])

    return (
        <div className="space-y-3">
            <div className="rounded-md border bg-white p-3">
                <div className="mb-2 text-sm font-semibold text-gray-900">TỦ LƯU MẪU</div>

                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="mb-3 h-9">
                        <TabsTrigger value="create">Nhập thông tin lưu mẫu</TabsTrigger>
                        <TabsTrigger value="export">Xuất/Hủy mẫu</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử hủy mẫu</TabsTrigger>
                    </TabsList>

                    <TabsContent value="create" className="mt-0 space-y-3">
                        <Card>
                            <CardContent className="space-y-3 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold">Sơ đồ lưu mẫu</div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                                            <Eraser className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                                    <div className="space-y-1 xl:col-span-2">
                                        <Label>Ngày tiếp nhận</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <Input type="date" className="h-8 pr-9" />
                                                <CalendarDays className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                            <div className="relative">
                                                <Input type="date" className="h-8 pr-9" />
                                                <CalendarDays className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Loại mẫu</Label>
                                        <Select>
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Chọn loại mẫu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mau-mo">Mẫu mô</SelectItem>
                                                <SelectItem value="mau-te-bao">Mẫu tế bào</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Code</Label>
                                        <Input className="h-8" placeholder="Nhập barcode, mã y lệnh, mã bệnh nhân" />
                                    </div>

                                    <div className="flex items-end gap-2 pb-1">
                                        <Checkbox id="outside-sample" />
                                        <Label htmlFor="outside-sample">Mẫu ngoài</Label>
                                    </div>
                                </div>

                                <div className="rounded-md border p-3">
                                    <div className="mb-2 text-sm font-semibold">Thông tin mẫu:</div>
                                    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                                        <div>Tên bệnh nhân:</div>
                                        <div>Ngày sinh:</div>
                                        <div>Giới tính:</div>
                                        <div>Ghi chú:</div>
                                        <div>Người nhận mẫu:</div>
                                        <div>Ngày nhận mẫu:</div>
                                        <div>Người lưu mẫu:</div>
                                        <div>Ngày lưu mẫu:</div>
                                    </div>
                                </div>

                                <div className="rounded-md border p-3">
                                    <div className="mb-2 text-sm font-semibold">Vị trí khay</div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[900px] border-collapse text-center text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="h-9 w-14 border bg-muted/40" />
                                                    {COLUMNS.map((column) => (
                                                        <th key={column} className="h-9 border bg-muted/40 font-medium">
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ROWS.map((row) => (
                                                    <tr key={row}>
                                                        <td className="h-9 border bg-muted/20 font-medium">{row}</td>
                                                        {COLUMNS.map((column) => {
                                                            const cellKey = `${column}${row}`
                                                            const isSelected = selectedCell === cellKey

                                                            return (
                                                                <td key={cellKey} className="h-9 border p-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSelectedCell(cellKey)}
                                                                        className={cn(
                                                                            'h-full w-full transition-colors',
                                                                            isSelected
                                                                                ? 'bg-blue-100 text-blue-700'
                                                                                : 'hover:bg-muted/40'
                                                                        )}
                                                                    />
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <div className="text-sm font-medium text-red-500">{selectedLabel}</div>
                                        <Button type="button" className="h-8">
                                            <Save className="mr-2 h-4 w-4" />
                                            Lưu mẫu
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="export" className="mt-0">
                        <Card>
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                Màn hình Xuất/Hủy mẫu đang được hoàn thiện.
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <Card>
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                Màn hình Lịch sử hủy mẫu đang được hoàn thiện.
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
