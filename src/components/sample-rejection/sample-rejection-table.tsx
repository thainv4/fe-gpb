'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
    apiClient,
    SampleRejection,
    SampleRejectionRequest,
    SampleRejectionFilters,
} from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SampleRejectionForm } from './sample-rejection-form'
import { formatDate } from '@/lib/utils'

const GENDER_LABELS: Record<string, string> = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
}

function formatDateOnly(date: string): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) return date
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export function SampleRejectionTable() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<SampleRejection | undefined>(undefined)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<SampleRejection | null>(null)

    const { data: myRoomsData, isLoading: loadingRooms } = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyUserRooms(),
        staleTime: 5 * 60 * 1000,
    })

    const isGenRoom = useMemo(() => {
        const raw = myRoomsData?.data?.resultFormType
        return raw !== undefined && raw !== null && Number(raw) === 2
    }, [myRoomsData])

    const filters: SampleRejectionFilters = {
        search: appliedSearch || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    const { data: listResponse, isLoading, error } = useQuery({
        queryKey: ['sample-rejections', filters],
        queryFn: () => apiClient.getSampleRejections(filters),
        enabled: isGenRoom,
    })

    const sampleRejections = listResponse?.data?.sampleRejections || []
    const total = listResponse?.data?.total || 0
    const totalPages = Math.ceil(total / pageSize)

    const createMutation = useMutation({
        mutationFn: (data: SampleRejectionRequest) => apiClient.createSampleRejection(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sample-rejections'] })
            toast({ title: 'Thành công', description: 'Đã thêm bản ghi từ chối bệnh phẩm' })
            setIsFormOpen(false)
        },
        onError: (err: Error) => {
            toast({ title: 'Lỗi', description: err.message || 'Không thể thêm bản ghi', variant: 'destructive' })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: SampleRejectionRequest }) =>
            apiClient.updateSampleRejection(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sample-rejections'] })
            toast({ title: 'Thành công', description: 'Đã cập nhật bản ghi' })
            setIsFormOpen(false)
            setEditingItem(undefined)
        },
        onError: (err: Error) => {
            toast({ title: 'Lỗi', description: err.message || 'Không thể cập nhật bản ghi', variant: 'destructive' })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteSampleRejection(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sample-rejections'] })
            toast({ title: 'Thành công', description: 'Đã xóa bản ghi' })
            setDeleteDialogOpen(false)
            setItemToDelete(null)
        },
        onError: (err: Error) => {
            toast({ title: 'Lỗi', description: err.message || 'Không thể xóa bản ghi', variant: 'destructive' })
        },
    })

    const handleSearch = () => {
        setAppliedSearch(searchTerm.trim())
        setCurrentPage(0)
    }

    const handleEdit = (item: SampleRejection) => {
        setEditingItem(item)
        setIsFormOpen(true)
    }

    const handleDelete = (item: SampleRejection) => {
        setItemToDelete(item)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (itemToDelete) deleteMutation.mutate(itemToDelete.id)
    }

    const handleFormSubmit = (data: SampleRejectionRequest) => {
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    if (loadingRooms || myRoomsData === undefined) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!isGenRoom) {
        return (
            <Alert className="max-w-xl">
                <AlertTitle>Từ chối bệnh phẩm</AlertTitle>
                <AlertDescription className="space-y-3">
                    <p>Chức năng chỉ dành cho Đơn vị Gen (resultFormType = 2).</p>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard">Về trang chủ</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi</CardTitle>
                    <CardDescription>Không thể tải dữ liệu bảng từ chối bệnh phẩm.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">{error.message}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-2xl font-bold">Bảng từ chối bệnh phẩm</CardTitle>
                    <CardDescription>Nhập và lưu trữ danh sách từ chối bệnh phẩm</CardDescription>
                </div>
                <Dialog
                    open={isFormOpen}
                    onOpenChange={(open) => {
                        setIsFormOpen(open)
                        if (!open) setEditingItem(undefined)
                    }}
                >
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingItem(undefined)} className="medical-gradient">
                            <Plus className="mr-2 h-4 w-4" /> Thêm mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[640px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Cập nhật bản ghi' : 'Thêm bản ghi từ chối bệnh phẩm'}
                            </DialogTitle>
                            <DialogDescription>
                                Tất cả các trường đều bắt buộc.
                            </DialogDescription>
                        </DialogHeader>
                        <SampleRejectionForm
                            key={editingItem?.id ?? 'new'}
                            initialData={editingItem}
                            onSubmit={handleFormSubmit}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn xóa bản ghi của &quot;{itemToDelete?.patientName}&quot; (mã {itemToDelete?.sampleCode})?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
                            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Xóa
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo họ tên hoặc mã bệnh phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-8"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleSearch}>Tìm kiếm</Button>
                </div>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">STT</TableHead>
                                <TableHead className="min-w-[140px]">Họ và tên BN</TableHead>
                                <TableHead className="min-w-[100px]">Sinh nhật</TableHead>
                                <TableHead className="w-20">Giới tính</TableHead>
                                <TableHead className="min-w-[160px]">Chẩn đoán bệnh</TableHead>
                                <TableHead className="min-w-[140px]">Chỉ định XN</TableHead>
                                <TableHead className="min-w-[120px]">BS chỉ định</TableHead>
                                <TableHead className="min-w-[160px]">Địa chỉ BN</TableHead>
                                <TableHead className="min-w-[110px]">Mã bệnh phẩm</TableHead>
                                <TableHead className="min-w-[120px]">Vị trí lấy mẫu</TableHead>
                                <TableHead className="min-w-[130px]">PP lấy mẫu</TableHead>
                                <TableHead className="min-w-[140px]">Thời gian từ chối</TableHead>
                                <TableHead className="min-w-[160px]">Lý do từ chối</TableHead>
                                <TableHead className="w-24 sticky right-0 bg-background">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={14} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" /> Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sampleRejections.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{currentPage * pageSize + index + 1}</TableCell>
                                        <TableCell className="font-medium">{item.patientName}</TableCell>
                                        <TableCell>{formatDateOnly(item.dateOfBirth)}</TableCell>
                                        <TableCell>{GENDER_LABELS[item.gender] ?? item.gender}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={item.diagnosis}>{item.diagnosis}</TableCell>
                                        <TableCell className="max-w-[180px] truncate" title={item.testIndication}>{item.testIndication}</TableCell>
                                        <TableCell>{item.orderingDoctor}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={item.patientAddress}>{item.patientAddress}</TableCell>
                                        <TableCell>{item.sampleCode}</TableCell>
                                        <TableCell>{item.samplingSite}</TableCell>
                                        <TableCell>{item.samplingMethod}</TableCell>
                                        <TableCell>{formatDate(item.rejectionTime)}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={item.rejectionReason}>{item.rejectionReason}</TableCell>
                                        <TableCell className="sticky right-0 bg-background">
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && sampleRejections.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={14} className="h-24 text-center">
                                        Không có bản ghi nào.
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
                        onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                    >
                        <ChevronLeft className="h-4 w-4" /> Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Trang {currentPage + 1} / {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage >= totalPages - 1 || totalPages === 0}
                    >
                        Sau <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
