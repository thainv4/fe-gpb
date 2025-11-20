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
    DialogFooter
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiClient, DepartmentType, DepartmentTypeRequest, DepartmentTypeFilters } from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DepartmentTypeForm } from './department-type-form'
import { formatDate } from '@/lib/utils'

export function DepartmentTypeTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingDepartmentType, setEditingDepartmentType] = useState<DepartmentType | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [departmentTypeToDelete, setDepartmentTypeToDelete] = useState<DepartmentType | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Build filters
    const filters: DepartmentTypeFilters = {
        search: searchTerm || undefined,
        isActive: selectedStatus && selectedStatus !== 'all' ? selectedStatus === 'active' : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch department types
    const { data: departmentTypes, isLoading, error } = useQuery({
        queryKey: ['department-types', filters],
        queryFn: () => apiClient.getDepartmentTypes(filters),
    })

    const createMutation = useMutation({
        mutationFn: (newDepartmentType: DepartmentTypeRequest) => apiClient.createDepartmentType(newDepartmentType),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['department-types'] })
            toast({
                title: 'Thành công',
                description: 'Loại khoa đã được tạo thành công',
            })
            setIsCreateDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo loại khoa',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<DepartmentTypeRequest> }) =>
            apiClient.updateDepartmentType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['department-types'] })
            toast({
                title: 'Thành công',
                description: 'Loại khoa đã được cập nhật thành công',
            })
            setIsCreateDialogOpen(false)
            setEditingDepartmentType(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật loại khoa',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteDepartmentType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['department-types'] })
            toast({
                title: 'Thành công',
                description: 'Loại khoa đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa loại khoa',
                variant: 'destructive',
            })
        },
    })

    const handleCreateDepartmentType = (data: DepartmentTypeRequest) => {
        createMutation.mutate(data)
    }

    const handleUpdateDepartmentType = (data: DepartmentTypeRequest) => {
        if (editingDepartmentType) {
            updateMutation.mutate({ id: editingDepartmentType.id, data })
        }
    }

    const handleEdit = (departmentType: DepartmentType) => {
        setEditingDepartmentType(departmentType)
        setIsCreateDialogOpen(true)
    }

    function handleDeleteDepartmentType(departmentType: DepartmentType) {
        setDepartmentTypeToDelete(departmentType)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (departmentTypeToDelete) {
            deleteMutation.mutate(departmentTypeToDelete.id)
            setDeleteDialogOpen(false)
            setDepartmentTypeToDelete(null)
        }
    }

    const totalPages = departmentTypes?.data ? Math.ceil(departmentTypes.data.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</CardTitle>
                    <CardDescription className="text-red-500">
                        Không thể tải dữ liệu loại khoa. Vui lòng thử lại sau.
                    </CardDescription>
                    <p className="mt-2 text-sm text-red-700">{error.message}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">Quản lý loại khoa</CardTitle>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingDepartmentType(null)} className="medical-gradient">
                                <Plus className="mr-2 h-4 w-4" /> Thêm loại khoa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editingDepartmentType ? 'Cập nhật loại khoa' : 'Tạo loại khoa mới'}</DialogTitle>
                                <DialogDescription>
                                    {editingDepartmentType ? 'Chỉnh sửa thông tin loại khoa.' : 'Điền thông tin để tạo loại khoa mới.'}
                                </DialogDescription>
                            </DialogHeader>
                            {editingDepartmentType ? (
                                <DepartmentTypeForm
                                    initialData={editingDepartmentType}
                                    onSubmit={handleUpdateDepartmentType}
                                    isLoading={updateMutation.isPending}
                                />
                            ) : (
                                <DepartmentTypeForm
                                    onSubmit={handleCreateDepartmentType}
                                    isLoading={createMutation.isPending}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm theo tên hoặc mã loại khoa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tất cả trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="active">Hoạt động</SelectItem>
                                <SelectItem value="inactive">Không hoạt động</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Thông tin</TableHead>
                                            <TableHead>Mô tả</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead>Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {departmentTypes?.data?.items?.map((departmentType) => (
                                            <TableRow key={departmentType.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-medical-100 rounded-full">
                                                            <Building2 className="h-4 w-4 text-medical-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{departmentType.typeName}</div>
                                                            <div className="text-sm text-muted-foreground">{departmentType.typeCode}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {departmentType.description || '-'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${departmentType.isActiveFlag === 1
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {departmentType.isActiveFlag === 1 ? 'Hoạt động' : 'Không hoạt động'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDate(departmentType.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(departmentType)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteDepartmentType(departmentType)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Hiển thị {departmentTypes?.data?.items?.length || 0} trong tổng số {departmentTypes?.data?.total || 0} loại khoa
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Trang {currentPage + 1} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa loại khoa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa loại khoa &quot;{departmentTypeToDelete?.typeName}&quot;?
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
        </div>
    )
}
