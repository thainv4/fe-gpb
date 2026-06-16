'use client'

import { useState, useEffect } from 'react'
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
    DeviceOutboundListData,
    DeviceOutboundBatchBody,
    DeviceOutboundBatchItem,
    CreateDeviceOutboundBody,
    DeviceOutboundItem,
    UpdateDeviceOutboundPatientBody,
} from '@/lib/api/client'
import { Plus, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

const PAGE_SIZE = 20

function formatDateTimeVi(iso?: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

function formatQueueStatus(status: number): string {
    if (status === 0) return 'Chờ gửi'
    if (status === 1) return 'Đã gửi'
    if (status === 3) return 'Đã hủy'
    if (status === 4) return 'Đã cập nhật BN'
    return String(status)
}

function QueueStatusBadge({ status }: { status: number }) {
    const label = formatQueueStatus(status)
    if (status === 1) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                {label}
            </span>
        )
    }
    if (status === 3) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                {label}
            </span>
        )
    }
    if (status === 4) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                {label}
            </span>
        )
    }
    return <span>{label}</span>
}

function truncateError(msg?: string | null, max = 80): string {
    if (!msg?.trim()) return '—'
    const t = msg.trim()
    return t.length > max ? `${t.slice(0, max)}…` : t
}

export default function DeviceOutboundTable() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const [receptionCodeFilter, setReceptionCodeFilter] = useState('')
    const [appliedReceptionCode, setAppliedReceptionCode] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const [formReceptionCode, setFormReceptionCode] = useState('')
    const [formServiceCode, setFormServiceCode] = useState('')
    const [formBlockNumber, setFormBlockNumber] = useState<string>('1')
    const [formSlideNumber, setFormSlideNumber] = useState<string>('1')
    const [formMethod, setFormMethod] = useState('')
    const [batchItems, setBatchItems] = useState<DeviceOutboundBatchItem[]>([])
    const [selectedBatchIndexes, setSelectedBatchIndexes] = useState<number[]>([])
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

    const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [editingItemContext, setEditingItemContext] = useState<Pick<DeviceOutboundItem, 'lisCaseId' | 'slideId'> | null>(null)
    const [patientFamily, setPatientFamily] = useState('')
    const [patientGiven, setPatientGiven] = useState('')
    const [patientDob, setPatientDob] = useState('')
    const [patientGender, setPatientGender] = useState<'M' | 'F' | ''>('')

    const listParams = {
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        receptionCode: appliedReceptionCode || undefined,
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ['device-outbound', listParams],
        queryFn: () => apiClient.getDeviceOutboundList(listParams),
    })

    const listData = data?.data as DeviceOutboundListData | undefined
    const items = listData?.items ?? []
    const pagination = listData?.pagination ?? { total: 0, limit: PAGE_SIZE, offset: 0, has_next: false, has_prev: false }
    const totalPages = Math.ceil(pagination.total / PAGE_SIZE) || 1

    const { data: servicesData } = useQuery({
        queryKey: ['device-outbound-services', formReceptionCode],
        queryFn: () => apiClient.getDeviceOutboundServices(formReceptionCode),
        enabled: isFormOpen && !!formReceptionCode.trim(),
    })
    const serviceOptions = servicesData?.data ?? []

    const { data: stainingData, isError: isStainingError, error: stainingError } = useQuery({
        queryKey: ['device-staining-methods', 'dropdown'],
        queryFn: () => apiClient.getDeviceStainingMethods({ limit: 1000, offset: 0 }),
        enabled: isFormOpen,
    })
    const stainingMethods = stainingData?.data?.deviceStainingMethods ?? []

    const {
        data: patientDetailData,
        isLoading: isPatientDetailLoading,
        error: patientDetailError,
    } = useQuery({
        queryKey: ['device-outbound-detail', editingItemId],
        queryFn: () => apiClient.getDeviceOutboundById(editingItemId!),
        enabled: isPatientDialogOpen && !!editingItemId,
    })

    useEffect(() => {
        if (!isPatientDialogOpen || !patientDetailData?.data) return
        const detail = patientDetailData.data
        setPatientFamily(detail.patientFamily ?? '')
        setPatientGiven(detail.patientGiven ?? '')
        setPatientDob(detail.patientDob ? detail.patientDob.slice(0, 10) : '')
        setPatientGender(detail.patientGender === 'M' || detail.patientGender === 'F' ? detail.patientGender : '')
    }, [isPatientDialogOpen, patientDetailData])

    const createBatchMutation = useMutation({
        mutationFn: (body: DeviceOutboundBatchBody) => apiClient.createDeviceOutboundBatch(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({ title: 'Thành công', description: 'Đã gửi order vào hàng đợi HL7.' })
            resetForm()
            setIsFormOpen(false)
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể gửi order.', variant: 'destructive' })
        },
    })

    const createSingleMutation = useMutation({
        mutationFn: (body: CreateDeviceOutboundBody) => apiClient.createDeviceOutbound(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({ title: 'Thành công', description: 'Đã gửi order vào hàng đợi HL7.' })
            resetForm()
            setIsFormOpen(false)
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể gửi order.', variant: 'destructive' })
        },
    })

    const cancelBatchMutation = useMutation({
        mutationFn: (ids: string[]) => apiClient.cancelDeviceOutboundBatch(ids),
        onSuccess: (_data, ids) => {
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            setSelectedItemIds([])
            toast({
                title: 'Thành công',
                description: `Đã hủy ${ids.length} order.`,
            })
        },
        onError: (e: Error) => {
            toast({ title: 'Lỗi', description: e.message || 'Không thể hủy order.', variant: 'destructive' })
        },
    })

    const updatePatientMutation = useMutation({
        mutationFn: (body: UpdateDeviceOutboundPatientBody) =>
            apiClient.updateDeviceOutboundPatient(editingItemId!, body),
        onSuccess: (res) => {
            const id = editingItemId
            if (res?.data && id) {
                queryClient.setQueryData(['device-outbound-detail', id], res)
            }
            if (id) {
                queryClient.invalidateQueries({ queryKey: ['device-outbound-detail', id] })
            }
            queryClient.invalidateQueries({ queryKey: ['device-outbound'] })
            toast({
                title: 'Thành công',
                description: 'Đã cập nhật thông tin bệnh nhân. Trạng thái chuyển sang Đã cập nhật BN.',
            })
            closePatientDialog()
        },
        onError: (e: Error) => {
            toast({
                title: 'Lỗi',
                description: e.message || 'Không thể cập nhật thông tin bệnh nhân.',
                variant: 'destructive',
            })
        },
    })

    function resetPatientForm() {
        setPatientFamily('')
        setPatientGiven('')
        setPatientDob('')
        setPatientGender('')
    }

    function closePatientDialog() {
        setIsPatientDialogOpen(false)
        setEditingItemId(null)
        setEditingItemContext(null)
        resetPatientForm()
    }

    function openPatientDialog(item: DeviceOutboundItem) {
        resetPatientForm()
        setEditingItemId(item.id)
        setEditingItemContext({ lisCaseId: item.lisCaseId, slideId: item.slideId })
        setIsPatientDialogOpen(true)
    }

    function handleSavePatient() {
        if (!patientFamily.trim() || !patientGiven.trim() || !patientDob || !patientGender) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng nhập đủ họ, tên, ngày sinh và giới tính.',
                variant: 'destructive',
            })
            return
        }
        updatePatientMutation.mutate({
            patientFamily: patientFamily.trim(),
            patientGiven: patientGiven.trim(),
            patientDob,
            patientGender,
        })
    }

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
        resetForm()
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
            toast({ title: 'Lỗi', description: 'Vui lòng chọn phương pháp.', variant: 'destructive' })
            return null
        }
        return { blockNum, slideNum }
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

        if (selectedBatchIndexes.length > 1 && batchItems.length > 0) {
            const itemsToSend: DeviceOutboundBatchItem[] = selectedBatchIndexes
                .sort((a, b) => a - b)
                .map((i) => batchItems[i])

            createBatchMutation.mutate({
                receptionCode: baseReceptionCode,
                serviceCode: baseServiceCode,
                items: itemsToSend,
            })
            return
        }

        if (selectedBatchIndexes.length === 1 && batchItems.length > 0) {
            const item = batchItems[selectedBatchIndexes[0]]
            createSingleMutation.mutate({
                receptionCode: baseReceptionCode,
                serviceCode: baseServiceCode,
                blockNumber: item.blockNumber,
                slideNumber: item.slideNumber,
                method: item.method,
            })
            return
        }

        if (batchItems.length > 1) {
            createBatchMutation.mutate({
                receptionCode: baseReceptionCode,
                serviceCode: baseServiceCode,
                items: batchItems,
            })
            return
        }

        createSingleMutation.mutate({
            receptionCode: baseReceptionCode,
            serviceCode: baseServiceCode,
            blockNumber: blockNum,
            slideNumber: slideNum,
            method: formMethod.trim(),
        })
    }

    function applyFilters() {
        setAppliedReceptionCode(receptionCodeFilter.trim())
        setCurrentPage(0)
        setSelectedItemIds([])
    }

    function handleCancelSelected() {
        if (selectedItemIds.length === 0) return
        cancelBatchMutation.mutate(selectedItemIds)
    }

    const allPageItemsSelected =
        items.length > 0 && items.every((item) => selectedItemIds.includes(item.id))

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi</CardTitle>
                    <CardDescription>Không thể tải danh sách hàng đợi HL7.</CardDescription>
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
                        Gửi order vào hàng đợi HL7 (BML_HL7_OUT_QUEUE). Hệ thống ngoài sẽ xử lý gửi máy.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="destructive"
                        disabled={selectedItemIds.length === 0 || cancelBatchMutation.isPending}
                        onClick={handleCancelSelected}
                    >
                        {cancelBatchMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Hủy
                    </Button>
                    <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} className="medical-gradient">
                                <Plus className="mr-2 h-4 w-4" /> Tạo order
                            </Button>
                        </DialogTrigger>
                    <DialogContent className="sm:max-w-[640px] max-w-[95vw]">
                        <DialogHeader>
                            <DialogTitle>Tạo order</DialogTitle>
                            <DialogDescription>
                                Nhập mã Barcode để load dịch vụ, chọn phương pháp nhuộm thiết bị, block/slide rồi bấm Gửi.
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
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-2">
                                <Label className="col-span-1">Dịch vụ *</Label>
                                <select
                                    className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    value={formServiceCode}
                                    onChange={(e) => setFormServiceCode(e.target.value)}
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
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                        value={formMethod}
                                        onChange={(e) => setFormMethod(e.target.value)}
                                    >
                                        <option value="">Chọn phương pháp</option>
                                        {stainingMethods.map((m) => (
                                            <option key={m.id} value={m.methodName}>
                                                {m.methodName}
                                            </option>
                                        ))}
                                    </select>
                                    {isStainingError && (
                                        <p className="text-xs text-destructive">
                                            {(stainingError as Error)?.message || 'Không tải được danh sách phương pháp'}
                                        </p>
                                    )}
                                </div>
                            </div>
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
                                                                    setSelectedBatchIndexes(batchItems.map((_, i) => i))
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
                                                        : '—'
                                                    const slideId = formReceptionCode
                                                        ? `${formReceptionCode}A.${it.blockNumber}.${it.slideNumber}`
                                                        : '—'
                                                    return (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <Checkbox
                                                                    checked={selectedBatchIndexes.includes(idx)}
                                                                    onCheckedChange={(checked) => {
                                                                        setSelectedBatchIndexes((prev) =>
                                                                            checked
                                                                                ? [...prev, idx]
                                                                                : prev.filter((i) => i !== idx),
                                                                        )
                                                                    }}
                                                                />
                                                            </TableCell>
                                                            <TableCell>{idx + 1}</TableCell>
                                                            <TableCell className="font-mono text-xs">{blockId}</TableCell>
                                                            <TableCell className="font-mono text-xs">{slideId}</TableCell>
                                                            <TableCell>{it.method}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setBatchItems((prev) =>
                                                                            prev.filter((_, i) => i !== idx),
                                                                        )
                                                                        setSelectedBatchIndexes((prev) =>
                                                                            prev
                                                                                .filter((i) => i !== idx)
                                                                                .map((i) => (i > idx ? i - 1 : i)),
                                                                        )
                                                                    }}
                                                                >
                                                                    Xóa
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
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleAddBatchItem}
                                disabled={createBatchMutation.isPending || createSingleMutation.isPending}
                            >
                                Thêm slide
                            </Button>
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Hủy</Button>
                            <Button
                                className="bg-green-600"
                                onClick={handleSubmitSend}
                                disabled={createBatchMutation.isPending || createSingleMutation.isPending}
                            >
                                {(createBatchMutation.isPending || createSingleMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Gửi
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                    </Dialog>
                    <Dialog open={isPatientDialogOpen} onOpenChange={(open) => { if (!open) closePatientDialog() }}>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>Cập nhật thông tin bệnh nhân</DialogTitle>
                                <DialogDescription>
                                    Barcode: {editingItemContext?.lisCaseId ?? '—'}
                                    {' — '}
                                    Slide: {editingItemContext?.slideId ?? '—'}
                                </DialogDescription>
                            </DialogHeader>
                            {isPatientDetailLoading ? (
                                <div className="flex min-h-[200px] items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : patientDetailError ? (
                                <p className="text-sm text-destructive py-4">
                                    {(patientDetailError as Error).message || 'Không thể tải thông tin bệnh nhân.'}
                                </p>
                            ) : (
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-2">
                                        <Label className="col-span-1">Họ *</Label>
                                        <Input
                                            className="col-span-3"
                                            value={patientFamily}
                                            onChange={(e) => setPatientFamily(e.target.value)}
                                            placeholder="Họ"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-2">
                                        <Label className="col-span-1">Tên *</Label>
                                        <Input
                                            className="col-span-3"
                                            value={patientGiven}
                                            onChange={(e) => setPatientGiven(e.target.value)}
                                            placeholder="Tên"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-2">
                                        <Label className="col-span-1">Ngày sinh *</Label>
                                        <Input
                                            type="date"
                                            className="col-span-3"
                                            value={patientDob}
                                            onChange={(e) => setPatientDob(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-2">
                                        <Label className="col-span-1">Giới tính *</Label>
                                        <select
                                            className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            value={patientGender}
                                            onChange={(e) => setPatientGender(e.target.value as 'M' | 'F' | '')}
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="M">Nam</option>
                                            <option value="F">Nữ</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <DialogFooter>
                                <Button variant="outline" onClick={closePatientDialog}>Hủy</Button>
                                <Button
                                    onClick={handleSavePatient}
                                    disabled={
                                        isPatientDetailLoading ||
                                        !!patientDetailError ||
                                        updatePatientMutation.isPending
                                    }
                                >
                                    {updatePatientMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Lưu
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
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
                    <Button variant="secondary" size="sm" onClick={applyFilters}>
                        <Search className="mr-2 h-4 w-4" /> Lọc
                    </Button>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        aria-label="Chọn tất cả bản ghi trên trang"
                                        checked={allPageItemsSelected}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedItemIds(items.map((item) => item.id))
                                            } else {
                                                setSelectedItemIds([])
                                            }
                                        }}
                                        disabled={isLoading || items.length === 0}
                                    />
                                </TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Slide ID</TableHead>
                                <TableHead>Block ID</TableHead>
                                <TableHead>Phương pháp</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày giờ tạo</TableHead>
                                <TableHead>Ngày giờ gửi</TableHead>
                                <TableHead>Lỗi</TableHead>
                                <TableHead className="w-28">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" /> Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Checkbox
                                                aria-label={`Chọn ${item.slideId ?? item.id}`}
                                                checked={selectedItemIds.includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedItemIds((prev) =>
                                                        checked
                                                            ? [...prev, item.id]
                                                            : prev.filter((id) => id !== item.id),
                                                    )
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{item.lisCaseId}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.slideId ?? '—'}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.blockId ?? '—'}</TableCell>
                                        <TableCell>{item.testVantageCode ?? '—'}</TableCell>
                                        <TableCell>
                                            <QueueStatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell>{formatDateTimeVi(item.createdTime)}</TableCell>
                                        <TableCell>{formatDateTimeVi(item.sentTime)}</TableCell>
                                        <TableCell className="max-w-[200px] text-xs text-muted-foreground" title={item.errorMessage ?? undefined}>
                                            {truncateError(item.errorMessage)}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={item.status === 3}
                                                onClick={() => openPatientDialog(item)}
                                            >
                                                Cập nhật
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        Không có bản ghi nào. Tạo order hoặc thử đổi bộ lọc.
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
                        onClick={() => {
                            setCurrentPage((p) => Math.max(0, p - 1))
                            setSelectedItemIds([])
                        }}
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
                        onClick={() => {
                            setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                            setSelectedItemIds([])
                        }}
                        disabled={currentPage >= totalPages - 1 || totalPages === 0}
                    >
                        Sau <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
