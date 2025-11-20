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
import { apiClient, UnitOfMeasure, UnitOfMeasureRequest, UnitOfMeasureFilters } from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Ruler,
    Code
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UnitOfMeasureForm } from './unit-of-measure-form'

export function UnitOfMeasureTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingUnitOfMeasure, setEditingUnitOfMeasure] = useState<UnitOfMeasure | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [unitOfMeasureToDelete, setUnitOfMeasureToDelete] = useState<UnitOfMeasure | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Build filters
    const filters: UnitOfMeasureFilters = {
        search: searchTerm || undefined,
        isActive: selectedStatus && selectedStatus !== 'all' ? selectedStatus === 'active' : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch unit of measures
    const { data: unitOfMeasures, isLoading, error } = useQuery({
        queryKey: ['unit-of-measures', filters],
        queryFn: () => apiClient.getUnitOfMeasures(filters),
    })

    const createMutation = useMutation({
        mutationFn: (newUnitOfMeasure: UnitOfMeasureRequest) => apiClient.createUnitOfMeasure(newUnitOfMeasure),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit-of-measures'] })
            toast({
                title: 'Thành công',
                description: 'Đơn vị tính đã được tạo thành công',
            })
            setIsCreateDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo đơn vị tính',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<UnitOfMeasureRequest> }) =>
            apiClient.updateUnitOfMeasure(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit-of-measures'] })
            toast({
                title: 'Thành công',
                description: 'Đơn vị tính đã được cập nhật thành công',
            })
            setIsCreateDialogOpen(false)
            setEditingUnitOfMeasure(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật đơn vị tính',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteUnitOfMeasure(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unit-of-measures'] })
            toast({
                title: 'Thành công',
                description: 'Đơn vị tính đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa đơn vị tính',
                variant: 'destructive',
            })
        },
    })

    const handleCreateUnitOfMeasure = (data: UnitOfMeasureRequest) => {
        createMutation.mutate(data)
    }

    const handleUpdateUnitOfMeasure = (data: UnitOfMeasureRequest) => {
        if (editingUnitOfMeasure) {
            updateMutation.mutate({ id: editingUnitOfMeasure.id, data })
        }
    }

    const handleEdit = (unitOfMeasure: UnitOfMeasure) => {
        setEditingUnitOfMeasure(unitOfMeasure)
        setIsCreateDialogOpen(true)
    }

    function handleDeleteUnitOfMeasure(unitOfMeasure: UnitOfMeasure) {
        setUnitOfMeasureToDelete(unitOfMeasure)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (unitOfMeasureToDelete) {
            deleteMutation.mutate(unitOfMeasureToDelete.id)
            setDeleteDialogOpen(false)
            setUnitOfMeasureToDelete(null)
        }
    }

    const totalPages = unitOfMeasures?.data ? Math.ceil(unitOfMeasures.data.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</CardTitle>
                    <CardDescription className="text-red-500">
                        Không thể tải dữ liệu đơn vị tính. Vui lòng thử lại sau.
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
                    <CardTitle className="text-2xl font-bold">Quản lý đơn vị tính</CardTitle>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingUnitOfMeasure(null)} className="medical-gradient">
                                <Plus className="mr-2 h-4 w-4" /> Thêm đơn vị tính
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editingUnitOfMeasure ? 'Cập nhật đơn vị tính' : 'Tạo đơn vị tính mới'}</DialogTitle>
                                <DialogDescription>
                                    {editingUnitOfMeasure ? 'Chỉnh sửa thông tin đơn vị tính.' : 'Điền thông tin để tạo đơn vị tính mới.'}
                                </DialogDescription>
                            </DialogHeader>
                            {editingUnitOfMeasure ? (
                                <UnitOfMeasureForm
                                    initialData={editingUnitOfMeasure}
                                    onSubmit={handleUpdateUnitOfMeasure}
                                    isLoading={updateMutation.isPending}
                                />
                            ) : (
                                <UnitOfMeasureForm
                                    onSubmit={handleCreateUnitOfMeasure}
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
                                placeholder="Tìm kiếm theo tên hoặc mã đơn vị tính..."
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
                                            <TableHead>Mapping HIS</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unitOfMeasures?.data?.items?.map((unitOfMeasure) => (
                                            <TableRow key={unitOfMeasure.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-medical-100 rounded-full">
                                                            <Ruler className="h-4 w-4 text-medical-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{unitOfMeasure.unitOfMeasureName}</div>
                                                            <div className="text-sm text-muted-foreground">{unitOfMeasure.unitOfMeasureCode}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {unitOfMeasure.description || '-'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {unitOfMeasure.mapping ? (
                                                        <div className="flex items-center text-sm">
                                                            <Code className="h-3 w-3 mr-1" />
                                                            <span className="text-muted-foreground">Có mapping</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${unitOfMeasure.isActiveFlag === 1
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {unitOfMeasure.isActiveFlag === 1 ? 'Hoạt động' : 'Không hoạt động'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(unitOfMeasure)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteUnitOfMeasure(unitOfMeasure)}
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
                                        Hiển thị {unitOfMeasures?.data?.items?.length || 0} trong tổng số {unitOfMeasures?.data?.total || 0} đơn vị tính
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
                        <DialogTitle>Xác nhận xóa đơn vị tính</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa đơn vị tính &quot;{unitOfMeasureToDelete?.unitOfMeasureName}&quot;?
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
