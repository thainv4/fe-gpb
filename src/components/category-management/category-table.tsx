'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { apiClient, Category, CategoryRequest } from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react'
import { CategoryForm } from './category-form'

export function CategoryTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Fetch categories
    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.getCategories(),
    })

    // Create category mutation
    const createMutation = useMutation({
        mutationFn: (data: CategoryRequest) => apiClient.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            setIsCreateDialogOpen(false)
            toast({
                title: 'Thành công',
                description: 'Danh mục đã được tạo thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo danh mục',
                variant: 'destructive',
            })
        },
    })

    // Update category mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryRequest> }) =>
            apiClient.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            setEditingCategory(null)
            toast({
                title: 'Thành công',
                description: 'Danh mục đã được cập nhật thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật danh mục',
                variant: 'destructive',
            })
        },
    })

    // Delete category mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            toast({
                title: 'Thành công',
                description: 'Danh mục đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa danh mục',
                variant: 'destructive',
            })
        },
    })

    // Filter categories based on search term
    const filteredCategories = categories?.data?.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    function handleCreateCategory(data: CategoryRequest) {
        createMutation.mutate(data)
    }

    function handleUpdateCategory(data: Partial<CategoryRequest>) {
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data })
        }
    }

    function handleDeleteCategory(category: Category) {
        setCategoryToDelete(category)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id)
            setDeleteDialogOpen(false)
            setCategoryToDelete(null)
        }
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        Lỗi khi tải danh sách danh mục: {error.message}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Quản lý danh mục</CardTitle>
                            <CardDescription>
                                Quản lý các danh mục trong hệ thống
                            </CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="medical-gradient">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm danh mục
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Thêm danh mục mới</DialogTitle>
                                    <DialogDescription>
                                        Tạo một danh mục mới trong hệ thống
                                    </DialogDescription>
                                </DialogHeader>
                                <CategoryForm
                                    onSubmit={handleCreateCategory}
                                    isLoading={createMutation.isPending}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm danh mục..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Đang tải...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã danh mục</TableHead>
                                    <TableHead>Tên danh mục</TableHead>
                                    <TableHead>Mô tả</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Không có danh mục nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.code}</TableCell>
                                            <TableCell>{category.name}</TableCell>
                                            <TableCell>{category.description || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    {category.isActive ? (
                                                        <>
                                                            <Eye className="h-4 w-4 text-green-500 mr-1" />
                                                            <span className="text-green-600">Hoạt động</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="h-4 w-4 text-red-500 mr-1" />
                                                            <span className="text-red-600">Không hoạt động</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingCategory(category)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteCategory(category)}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin danh mục
                        </DialogDescription>
                    </DialogHeader>
                    {editingCategory && (
                        <CategoryForm
                            initialData={editingCategory}
                            onSubmit={handleUpdateCategory}
                            isLoading={updateMutation.isPending}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa danh mục</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa danh mục &quot;{categoryToDelete?.name}&quot;? 
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
