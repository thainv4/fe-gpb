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
import { apiClient, Province, ProvinceRequest, ProvinceFilters } from '@/lib/api/client'
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
import { ProvinceForm } from './province-form'
import { formatDate } from '@/lib/utils'

export function ProvinceTable() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [filterActive, setFilterActive] = useState('all')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProvince, setEditingProvince] = useState<Province | undefined>(undefined)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [provinceToDelete, setProvinceToDelete] = useState<Province | null>(null)

    // Build filters
    const filters: ProvinceFilters = {
        search: searchTerm || undefined,
        isActive: filterActive !== 'all' ? filterActive === 'true' : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch provinces
    const { data: provinces, isLoading, error } = useQuery({
        queryKey: ['provinces', filters],
        queryFn: () => apiClient.getProvinces(filters),
    })

    const createMutation = useMutation({
        mutationFn: (newProvince: ProvinceRequest) => apiClient.createProvince(newProvince),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provinces'] })
            toast({
                title: 'Thành công',
                description: 'Tỉnh đã được tạo thành công',
            })
            setIsFormOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo tỉnh',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProvinceRequest> }) =>
            apiClient.updateProvince(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provinces'] })
            toast({
                title: 'Thành công',
                description: 'Tỉnh đã được cập nhật thành công',
            })
            setIsFormOpen(false)
            setEditingProvince(undefined)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật tỉnh',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteProvince(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provinces'] })
            toast({
                title: 'Thành công',
                description: 'Tỉnh đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa tỉnh',
                variant: 'destructive',
            })
        },
    })

    const handleEdit = (province: Province) => {
        setEditingProvince(province)
        setIsFormOpen(true)
    }

    const handleDelete = (province: Province) => {
        setProvinceToDelete(province)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (provinceToDelete) {
            deleteMutation.mutate(provinceToDelete.id)
            setDeleteDialogOpen(false)
            setProvinceToDelete(null)
        }
    }

    const handleFormSubmit = (data: ProvinceRequest) => {
        if (editingProvince) {
            updateMutation.mutate({ id: editingProvince.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    const totalPages = provinces?.data ? Math.ceil(provinces.data.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi</CardTitle>
                    <CardDescription>Không thể tải dữ liệu tỉnh.</CardDescription>
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
                <CardTitle className="text-2xl font-bold">Quản lý tỉnh/thành phố</CardTitle>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingProvince(undefined)} className="medical-gradient">
                            <Plus className="mr-2 h-4 w-4" /> Thêm tỉnh
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingProvince ? 'Cập nhật tỉnh' : 'Tạo tỉnh mới'}</DialogTitle>
                            <DialogDescription>
                                {editingProvince ? 'Chỉnh sửa thông tin tỉnh.' : 'Điền thông tin để tạo tỉnh mới.'}
                            </DialogDescription>
                        </DialogHeader>
                        <ProvinceForm
                            initialData={editingProvince}
                            onSubmit={handleFormSubmit}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa tỉnh</DialogTitle>
                            <DialogDescription>
                Bạn có chắc chắn muốn xóa tỉnh &quot;{provinceToDelete?.provinceName}&quot;? 
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
                            placeholder="Tìm kiếm theo tên hoặc mã tỉnh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
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
                                <TableHead>Mã tỉnh</TableHead>
                                <TableHead>Tên tỉnh</TableHead>
                                <TableHead>Tên viết tắt</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" /> Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                provinces?.data?.provinces?.map((province:Province) => (
                                    <TableRow key={province.id}>
                                        <TableCell className="font-medium">{province.provinceCode}</TableCell>
                                        <TableCell>{province.provinceName}</TableCell>
                                        <TableCell>{province.shortName || 'N/A'}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${province.isActive === 1
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {province.isActive === 1 ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </TableCell>
                                        <TableCell>{formatDate(province.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(province)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(province)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && provinces?.data?.provinces?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Không có tỉnh nào.
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
