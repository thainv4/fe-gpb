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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiClient, Ward, WardRequest, WardFilters } from '@/lib/api/client'
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
import { WardForm } from './ward-form'
import { formatDate } from '@/lib/utils'

export function WardTable() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [filterProvince, setFilterProvince] = useState('all')
    const [filterActive, setFilterActive] = useState('all')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingWard, setEditingWard] = useState<Ward | undefined>(undefined)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [wardToDelete, setWardToDelete] = useState<Ward | null>(null)

    // Fetch provinces for filter
    const { data: provincesData } = useQuery({
        queryKey: ['provinces'],
        queryFn: () => apiClient.getProvinces({ limit: 100, offset: 0, isActive: true }),
    })

    const provinces = provincesData?.data?.provinces || []

    // Build filters
    const filters: WardFilters = {
        search: searchTerm || undefined,
        provinceId: filterProvince !== 'all' ? filterProvince : undefined,
        isActive: filterActive !== 'all' ? filterActive === 'true' : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch wards
    const { data: wards, isLoading, error } = useQuery({
        queryKey: ['wards', filters],
        queryFn: () => apiClient.getWards(filters),
    })

    const createMutation = useMutation({
        mutationFn: (newWard: WardRequest) => apiClient.createWard(newWard),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] })
            toast({
                title: 'Thành công',
                description: 'Phường/xã đã được tạo thành công',
            })
            setIsFormOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo phường/xã',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<WardRequest> }) =>
            apiClient.updateWard(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] })
            toast({
                title: 'Thành công',
                description: 'Phường/xã đã được cập nhật thành công',
            })
            setIsFormOpen(false)
            setEditingWard(undefined)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật phường/xã',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteWard(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wards'] })
            toast({
                title: 'Thành công',
                description: 'Phường/xã đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa phường/xã',
                variant: 'destructive',
            })
        },
    })

    const handleEdit = (ward: Ward) => {
        setEditingWard(ward)
        setIsFormOpen(true)
    }

    const handleDelete = (ward: Ward) => {
        setWardToDelete(ward)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (wardToDelete) {
            deleteMutation.mutate(wardToDelete.id)
            setDeleteDialogOpen(false)
            setWardToDelete(null)
        }
    }

    const handleFormSubmit = (data: WardRequest) => {
        if (editingWard) {
            updateMutation.mutate({ id: editingWard.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    function getProvinceName(provinceId: string) {
        const province = provinces.find(p => p.id === provinceId)
        return province?.provinceName || 'N/A'
    }

    const totalPages = wards?.data?.pagination ? wards.data.pagination.totalPages : 0

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi</CardTitle>
                    <CardDescription>Không thể tải dữ liệu phường/xã.</CardDescription>
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
                <CardTitle className="text-2xl font-bold">Quản lý phường/xã</CardTitle>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingWard(undefined)} className="medical-gradient">
                            <Plus className="mr-2 h-4 w-4" /> Thêm phường/xã
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingWard ? 'Cập nhật phường/xã' : 'Tạo phường/xã mới'}</DialogTitle>
                            <DialogDescription>
                                {editingWard ? 'Chỉnh sửa thông tin phường/xã.' : 'Điền thông tin để tạo phường/xã mới.'}
                            </DialogDescription>
                        </DialogHeader>
                        <WardForm
                            initialData={editingWard}
                            onSubmit={handleFormSubmit}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa phường/xã</DialogTitle>
                            <DialogDescription>
                Bạn có chắc chắn muốn xóa phường/xã &quot;{wardToDelete?.wardName}&quot;? 
                Hành động này không thể hoàn tác.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                Hủy
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDelete}
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
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc mã phường/xã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={filterProvince} onValueChange={setFilterProvince}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Lọc theo tỉnh" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả tỉnh</SelectItem>
                            {provinces.map((province) => (
                                <SelectItem key={province.id} value={province.id}>
                                    {province.provinceName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterActive} onValueChange={setFilterActive}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Lọc theo trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="true">Đang hoạt động</SelectItem>
                            <SelectItem value="false">Không hoạt động</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã phường/xã</TableHead>
                                <TableHead>Tên phường/xã</TableHead>
                                <TableHead>Tên viết tắt</TableHead>
                                <TableHead>Tỉnh/Thành phố</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" /> Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                wards?.data?.wards?.map((ward) => (
                                    <TableRow key={ward.id}>
                                        <TableCell className="font-medium">{ward.wardCode}</TableCell>
                                        <TableCell>{ward.wardName}</TableCell>
                                        <TableCell>{ward.shortName || 'N/A'}</TableCell>
                                        <TableCell>{getProvinceName(ward.provinceId)}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ward.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {ward.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{formatDate(ward.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(ward)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(ward)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && wards?.data?.wards?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Không có phường/xã nào.
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1 || totalPages === 0}
                    >
                        Sau <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
