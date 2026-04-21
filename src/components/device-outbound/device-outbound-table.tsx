'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
    apiClient,
    DeviceOutboundItem,
    DeviceOutboundListData,
    UpdateDeviceOutboundBody,
    DeviceOutboundBatchBody,
    DeviceOutboundBatchItem,
    CreateDeviceOutboundBody,
} from '@/lib/api/client'
import { Plus, Search, Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

const PAGE_SIZE = 20

export default function DeviceOutboundTable() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const [receptionCodeFilter, setReceptionCodeFilter] = useState('')
    const [serviceCodeFilter, setServiceCodeFilter] = useState('')
    const [appliedReceptionCode, setAppliedReceptionCode] = useState('')
    const [appliedServiceCode, setAppliedServiceCode] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<DeviceOutboundItem | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<DeviceOutboundItem | null>(null)

    // Form state (create/edit)
    const [formReceptionCode, setFormReceptionCode] = useState('')
    const [formServiceCode, setFormServiceCode] = useState('')
    const [formBlockNumber, setFormBlockNumber] = useState<string>('1')
    const [formSlideNumber, setFormSlideNumber] = useState<string>('1')
    const [formMethod, setFormMethod] = useState('')
    const [batchItems, setBatchItems] = useState<DeviceOutboundBatchItem[]>([])
    const [selectedBatchIndexes, setSelectedBatchIndexes] = useState<number[]>([])

    const listParams = {
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        receptionCode: appliedReceptionCode || undefined,
        serviceCode: appliedServiceCode || undefined,
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ['device-outbound', listParams],
        queryFn: () => apiClient.getDeviceOutboundList(listParams),
    })

    const listData = data?.data as DeviceOutboundListData | undefined
    const items = listData?.items ?? []
    const pagination = listData?.pagination ?? { total: 0, limit: PAGE_SIZE, offset: 0, has_next: false, has_prev: false }
    const totalPages = Math.ceil(pagination.total / PAGE_SIZE) || 1

    // Load services by receptionCode for dropdown (when form is open and receptionCode has value)
    const { data: servicesData } = useQuery({
        queryKey: ['device-outbound-services', formReceptionCode],
        queryFn: () => apiClient.getDeviceOutboundServices(formReceptionCode),
        enabled: isFormOpen && !!formReceptionCode.trim(),
    })
    const serviceOptions = servicesData?.data ?? []

    const createBatchMutation = useMutation({
        mutationFn: (body: DeviceOutboundBatchBody) => apiClient.createDeviceOutboundBatch(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({ title: 'Thành công', description: 'Đã tạo order.' })
            resetForm()
            setIsFormOpen(false)
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể tạo bản ghi.', variant: 'destructive' })
        },
    })

    const createSingleMutation = useMutation({
        mutationFn: (body: CreateDeviceOutboundBody) => apiClient.createDeviceOutbound(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({ title: 'Thành công', description: 'Đã tạo order.' })
            resetForm()
            setIsFormOpen(false)
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể tạo bản ghi.', variant: 'destructive' })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: UpdateDeviceOutboundBody }) =>
            apiClient.updateDeviceOutbound(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({ title: 'Thành công', description: 'Đã cập nhật bản ghi.' })
            resetForm()
            setIsFormOpen(false)
            setEditingItem(null)
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể cập nhật.', variant: 'destructive' })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteDeviceOutbound(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({ title: 'Thành công', description: 'Đã xóa bản ghi.' })
            setDeleteDialogOpen(false)
            setItemToDelete(null)
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể xóa.', variant: 'destructive' })
        },
    })

    function resetForm() {
        setFormReceptionCode('')
        setFormServiceCode('')
        setFormBlockNumber('1')
        setFormSlideNumber('1')
        setFormMethod('')
        setBatchItems([])
        setSelectedBatchIndexes([])
    }

    function openCreate() {
        setEditingItem(null)
        resetForm()
        setIsFormOpen(true)
    }

    function openEdit(item: DeviceOutboundItem) {
        setEditingItem(item)
        setFormReceptionCode(item.receptionCode)
        setFormServiceCode(item.serviceCode)
        const blockNum = item.blockId?.split('.').pop() ?? '1'
        const slideNum = item.slideId?.split('.').pop() ?? '1'
        setFormBlockNumber(blockNum)
        setFormSlideNumber(slideNum)
        setFormMethod(item.method ?? '')
        setIsFormOpen(true)
    }

    function validateSingleInputs() {
        const blockNum = parseInt(formBlockNumber, 10)
        const slideNum = parseInt(formSlideNumber, 10)
        if (!formReceptionCode.trim()) {
            toast({ title: 'Lỗi', description: 'Vui lòng nhập mã Barcode.', variant: 'destructive' })
            return null
        }
        if (!formServiceCode.trim()) {
            toast({ title: 'Lỗi', description: 'Vui lòng chọn dịch vụ.', variant: 'destructive' })
            return null
        }
        if (Number.isNaN(blockNum) || blockNum < 1) {
            toast({ title: 'Lỗi', description: 'Số block phải ≥ 1.', variant: 'destructive' })
            return null
        }
        if (Number.isNaN(slideNum) || slideNum < 1) {
            toast({ title: 'Lỗi', description: 'Số slide phải ≥ 1.', variant: 'destructive' })
            return null
        }
        if (!formMethod.trim()) {
            toast({ title: 'Lỗi', description: 'Vui lòng nhập phương pháp (vd: HE).', variant: 'destructive' })
            return null
        }
        return { blockNum, slideNum }
    }

    function handleSubmitEdit() {
        if (!editingItem) return
        const validated = validateSingleInputs()
        if (!validated) return
        const { blockNum, slideNum } = validated

        updateMutation.mutate({
            id: editingItem.id,
            body: {
                receptionCode: formReceptionCode.trim(),
                serviceCode: formServiceCode.trim(),
                blockNumber: blockNum,
                slideNumber: slideNum,
                method: formMethod.trim(),
            },
        })
    }

    function handleAddBatchItem() {
        const validated = validateSingleInputs()
        if (!validated) return
        const { blockNum, slideNum } = validated
        const newItem: DeviceOutboundBatchItem = {
            blockNumber: blockNum,
            slideNumber: slideNum,
            method: formMethod.trim(),
        }
        setBatchItems((prev) => [...prev, newItem])
        setSelectedBatchIndexes([])
    }

    function handleSubmitSend() {
        const validated = validateSingleInputs()
        if (!validated) return
        const { blockNum, slideNum } = validated

        const baseReceptionCode = formReceptionCode.trim()
        const baseServiceCode = formServiceCode.trim()

        // Nếu chọn nhiều slide => gọi batch API với đúng các slide đã chọn
        if (selectedBatchIndexes.length > 1 && batchItems.length > 0) {
            const itemsToSend: DeviceOutboundBatchItem[] = selectedBatchIndexes
                .sort((a, b) => a - b)
                .map((i) => batchItems[i])

            const body: DeviceOutboundBatchBody = {
                receptionCode: baseReceptionCode,
                serviceCode: baseServiceCode,
                items: itemsToSend,
            }
            createBatchMutation.mutate(body)
            return
        }

        // Nếu chọn đúng 1 slide trong danh sách => gửi single cho slide đó
        if (selectedBatchIndexes.length === 1 && batchItems.length > 0) {
            const idx = selectedBatchIndexes[0]
            const item = batchItems[idx]

            const body: CreateDeviceOutboundBody = {
                receptionCode: baseReceptionCode,
                serviceCode: baseServiceCode,
                blockNumber: item.blockNumber,
                slideNumber: item.slideNumber,
                method: item.method,
            }
            createSingleMutation.mutate(body)
            return
        }

        // Không chọn checkbox: nếu có nhiều slide trong danh sách => gửi batch cho tất cả
        if (batchItems.length > 1) {
            const body: DeviceOutboundBatchBody = {
                receptionCode: baseReceptionCode,
                serviceCode: baseServiceCode,
                items: batchItems,
            }
            createBatchMutation.mutate(body)
            return
        }

        // Trường hợp còn lại: gửi single theo form hiện tại
        const body: CreateDeviceOutboundBody = {
            receptionCode: baseReceptionCode,
            serviceCode: baseServiceCode,
            blockNumber: blockNum,
            slideNumber: slideNum,
            method: formMethod.trim(),
        }
        createSingleMutation.mutate(body)
    }

    function applyFilters() {
        setAppliedReceptionCode(receptionCodeFilter.trim())
        setAppliedServiceCode(serviceCodeFilter.trim())
        setCurrentPage(0)
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi</CardTitle>
                    <CardDescription>Không thể tải danh sách xuất thiết bị.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">{(error as Error).message}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-2xl font-bold">Kết nối máy</CardTitle>
                    <CardDescription>
                        Quản lý dữ liệu xuất ra thiết bị. Mỗi bản ghi gắn mã Barcode, dịch vụ, block/slide và phương pháp.
                    </CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingItem(null); }}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="medical-gradient">
                            <Plus className="mr-2 h-4 w-4" /> Tạo order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[640px] max-w-[95vw]">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Cập nhật bản ghi xuất thiết bị' : 'Tạo order'}</DialogTitle>
                            <DialogDescription>
                                {editingItem ? 'Chỉnh sửa thông tin. Backend sẽ tính lại blockId/slideId nếu đổi receptionCode/blockNumber/slideNumber.' : 'Nhập mã Barcode để load danh sách dịch vụ, sau đó điền block, slide và phương pháp.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-2">
                                <Label className="col-span-1">Mã Barcode *</Label>
                                <Input
                                    className="col-span-3"
                                    value={formReceptionCode}
                                    onChange={(e) => setFormReceptionCode(e.target.value)}
                                    placeholder="VD: S2601.0312"
                                    disabled={!!editingItem}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                                <Label className="col-span-1">Dịch vụ *</Label>
                                <select
                                    className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={formServiceCode}
                                    onChange={(e) => setFormServiceCode(e.target.value)}
                                    disabled={!!editingItem}
                                >
                                    <option value="">Chọn dịch vụ</option>
                                    {serviceOptions.map((opt) => (
                                        <option key={opt.id} value={opt.serviceCode ?? opt.id}>
                                            {opt.serviceName || opt.serviceCode || opt.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm">Số block *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formBlockNumber}
                                        onChange={(e) => setFormBlockNumber(e.target.value)}
                                        placeholder="≥ 1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">Số slide *</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formSlideNumber}
                                        onChange={(e) => setFormSlideNumber(e.target.value)}
                                        placeholder="≥ 1"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm">Phương pháp *</Label>
                                    <Input
                                        value={formMethod}
                                        onChange={(e) => setFormMethod(e.target.value)}
                                        placeholder="VD: HE"
                                    />
                                </div>
                            </div>
                            {!editingItem && (
                                <div className="w-full min-w-0">
                                    <Label className="text-sm font-medium mb-2 block">Danh sách slide</Label>
                                    <div className="rounded-md border min-h-[280px] max-h-72 overflow-auto min-w-0 bg-muted/30">
                                        {batchItems.length === 0 ? (
                                            <div className="min-h-[280px] flex items-center justify-center text-muted-foreground text-sm px-4">
                                                Chưa có slide. Nhập Block, Slide, PP ở trên và bấm &quot;Thêm slide&quot;.
                                            </div>
                                        ) : (
                                            <Table className="min-w-[380px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[40px]">
                                                            <Checkbox
                                                                aria-label="Chọn tất cả slide"
                                                                checked={
                                                                    batchItems.length > 0 &&
                                                                    selectedBatchIndexes.length === batchItems.length
                                                                }
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setSelectedBatchIndexes(
                                                                            batchItems.map((_, i) => i)
                                                                        )
                                                                    } else {
                                                                        setSelectedBatchIndexes([])
                                                                    }
                                                                }}
                                                            />
                                                        </TableHead>
                                                        <TableHead className="w-[60px]">STT</TableHead>
                                                        <TableHead>Block ID</TableHead>
                                                        <TableHead>Slide ID</TableHead>
                                                        <TableHead>Phương pháp</TableHead>
                                                        <TableHead className="w-[60px]">Xóa</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {batchItems.map((it, idx) => {
                                                        const blockId = formReceptionCode
                                                            ? `${formReceptionCode}A.${it.blockNumber}`
                                                            : `A.${it.blockNumber}`
                                                        const slideId = formReceptionCode
                                                            ? `${formReceptionCode}A.${it.blockNumber}.${it.slideNumber}`
                                                            : `A.${it.blockNumber}.${it.slideNumber}`
                                                        const isSelected = selectedBatchIndexes.includes(idx)
                                                        return (
                                                            <TableRow key={`${it.blockNumber}-${it.slideNumber}-${idx}`}>
                                                                <TableCell className="text-center">
                                                                    <Checkbox
                                                                        aria-label="Chọn slide"
                                                                        checked={isSelected}
                                                                        onCheckedChange={(checked) => {
                                                                            setSelectedBatchIndexes((prev) => {
                                                                                if (checked) {
                                                                                    if (prev.includes(idx)) return prev
                                                                                    return [...prev, idx]
                                                                                }
                                                                                return prev.filter((i) => i !== idx)
                                                                            })
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-center">{idx + 1}</TableCell>
                                                                <TableCell>{blockId}</TableCell>
                                                                <TableCell>{slideId}</TableCell>
                                                                <TableCell>{it.method}</TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() => {
                                                                            setBatchItems((prev) =>
                                                                                prev.filter((_, i) => i !== idx)
                                                                            )
                                                                            setSelectedBatchIndexes((prev) =>
                                                                                prev.filter((i) => i !== idx)
                                                                            )
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            {editingItem ? (
                                <Button
                                    onClick={handleSubmitEdit}
                                    disabled={updateMutation.isPending}
                                >
                                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Cập nhật
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleAddBatchItem}
                                        disabled={createBatchMutation.isPending || createSingleMutation.isPending}
                                    >
                                        Thêm slide
                                    </Button>
                                    <Button className="bg-blue-500">Cập nhật</Button>
                                    <Button variant="destructive" onClick={() => setIsFormOpen(false)}>Hủy</Button>
                                    <Button
                                        className="bg-green-600"
                                        onClick={handleSubmitSend}
                                        disabled={createBatchMutation.isPending || createSingleMutation.isPending}
                                    >
                                        Gửi
                                    </Button>
                                    {/* <Button
                                        onClick={handleSubmitBatch}
                                        disabled={createMutation.isPending}
                                    >
                                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Gửi tất cả
                                    </Button> */}
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc muốn xóa bản ghi &quot;{itemToDelete?.blockId} / {itemToDelete?.slideId}&quot;? Sau khi xóa sẽ không xuất hiện trong danh sách.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
                            <Button
                                variant="destructive"
                                onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Xóa
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Mã Barcode</Label>
                        <Input
                            placeholder="Lọc theo Barcode"
                            value={receptionCodeFilter}
                            onChange={(e) => setReceptionCodeFilter(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">Mã dịch vụ</Label>
                        <Input
                            placeholder="Lọc theo mã dịch vụ"
                            value={serviceCodeFilter}
                            onChange={(e) => setServiceCodeFilter(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={applyFilters}>
                        <Search className="mr-2 h-4 w-4" /> Lọc
                    </Button>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Mã dịch vụ</TableHead>
                                <TableHead>Block ID</TableHead>
                                <TableHead>Slide ID</TableHead>
                                <TableHead>Phương pháp</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" /> Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.receptionCode}</TableCell>
                                        <TableCell>{item.serviceCode}</TableCell>
                                        <TableCell>{item.blockId}</TableCell>
                                        <TableCell>{item.slideId}</TableCell>
                                        <TableCell>{item.method}</TableCell>
                                        <TableCell>{item.createdAt ? formatDate(item.createdAt) : '—'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => { setItemToDelete(item); setDeleteDialogOpen(true); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Không có bản ghi nào. Thêm bản ghi hoặc thử đổi bộ lọc.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                    >
                        <ChevronLeft className="h-4 w-4" /> Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Trang {currentPage + 1} / {totalPages} (tổng {pagination.total} bản ghi)
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1 || totalPages === 0}
                    >
                        Sau <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
