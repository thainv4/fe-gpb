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
import { useToast } from '@/hooks/use-toast'
import { apiClient, StainingMethod, StainingMethodRequest, StainingMethodFilters } from '@/lib/api/client'
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
import { StainingMethodForm } from './staining-method-form'
import { formatDate } from '@/lib/utils'

export function StainingMethodTable() {
    const queryClient = useQueryClient()
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingStainingMethod, setEditingStainingMethod] = useState<StainingMethod | undefined>(undefined)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [stainingMethodToDelete, setStainingMethodToDelete] = useState<StainingMethod | null>(null)

    // Build filters
    const filters: StainingMethodFilters = {
        search: searchTerm || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch staining methods
    const { data: stainingMethodsResponse, isLoading, error } = useQuery({
        queryKey: ['staining-methods', filters],
        queryFn: () => apiClient.getStainingMethods(filters),
    })

    const stainingMethods = stainingMethodsResponse?.data?.stainingMethods || []
    const total = stainingMethodsResponse?.data?.total || 0

    const createMutation = useMutation({
        mutationFn: (newStainingMethod: StainingMethodRequest) => apiClient.createStainingMethod(newStainingMethod),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staining-methods'] })
            toast({
                title: 'Thành công',
                description: 'Phương pháp nhuộm đã được tạo thành công',
            })
            setIsFormOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo phương pháp nhuộm',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<StainingMethodRequest> }) =>
            apiClient.updateStainingMethod(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staining-methods'] })
            toast({
                title: 'Thành công',
                description: 'Phương pháp nhuộm đã được cập nhật thành công',
            })
            setIsFormOpen(false)
            setEditingStainingMethod(undefined)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật phương pháp nhuộm',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteStainingMethod(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staining-methods'] })
            toast({
                title: 'Thành công',
                description: 'Phương pháp nhuộm đã được xóa thành công',
            })
            setDeleteDialogOpen(false)
            setStainingMethodToDelete(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa phương pháp nhuộm',
                variant: 'destructive',
            })
        },
    })

    const handleEdit = (stainingMethod: StainingMethod) => {
        setEditingStainingMethod(stainingMethod)
        setIsFormOpen(true)
    }

    const handleDelete = (stainingMethod: StainingMethod) => {
        setStainingMethodToDelete(stainingMethod)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (stainingMethodToDelete) {
            deleteMutation.mutate(stainingMethodToDelete.id)
        }
    }

    const handleFormSubmit = (data: StainingMethodRequest) => {
        if (editingStainingMethod) {
            updateMutation.mutate({ id: editingStainingMethod.id, data })
        } else {
            createMutation.mutate(data)
        }
    }

    const totalPages = Math.ceil(total / pageSize)

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi</CardTitle>
                    <CardDescription>Không thể tải dữ liệu phương pháp nhuộm.</CardDescription>
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
                    <CardTitle className="text-2xl font-bold">Quản lý phương pháp nhuộm</CardTitle>
                    <CardDescription>Quản lý danh sách các phương pháp nhuộm trong hệ thống</CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingStainingMethod(undefined)} className="medical-gradient">
                            <Plus className="mr-2 h-4 w-4" /> Thêm phương pháp nhuộm
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingStainingMethod ? 'Cập nhật phương pháp nhuộm' : 'Tạo phương pháp nhuộm mới'}</DialogTitle>
                            <DialogDescription>
                                {editingStainingMethod ? 'Chỉnh sửa thông tin phương pháp nhuộm.' : 'Điền thông tin để tạo phương pháp nhuộm mới.'}
                            </DialogDescription>
                        </DialogHeader>
                        <StainingMethodForm
                            initialData={editingStainingMethod}
                            onSubmit={handleFormSubmit}
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa phương pháp nhuộm</DialogTitle>
                            <DialogDescription>
                                Bạn có chắc chắn muốn xóa phương pháp nhuộm &quot;{stainingMethodToDelete?.methodName}&quot;? 
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
                            placeholder="Tìm kiếm theo tên phương pháp nhuộm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên phương pháp nhuộm</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Ngày cập nhật</TableHead>
                                <TableHead>Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" /> Đang tải...
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stainingMethods.map((stainingMethod: StainingMethod) => (
                                    <TableRow key={stainingMethod.id}>
                                        <TableCell className="font-medium">{stainingMethod.methodName}</TableCell>
                                        <TableCell>{stainingMethod.createdAt ? formatDate(stainingMethod.createdAt) : 'N/A'}</TableCell>
                                        <TableCell>{stainingMethod.updatedAt ? formatDate(stainingMethod.updatedAt) : 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(stainingMethod)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(stainingMethod)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!isLoading && stainingMethods.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Không có phương pháp nhuộm nào.
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
                        disabled={currentPage === totalPages - 1 || totalPages === 0}
                    >
                        Sau <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
