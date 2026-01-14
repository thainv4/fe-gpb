'use client'

import {useState} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
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
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    TestTube,
    Trash2,
    Edit,
    Search
} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {SampleTypeForm} from './sample-type-form'
import {useToast} from '@/hooks/use-toast'
import {apiClient, SampleType, SampleTypeRequest, SampleTypeFilters} from '@/lib/api/client'

export function SampleTypeTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingSampleType, setEditingSampleType] = useState<SampleType | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [sampleTypeToDelete, setSampleTypeToDelete] = useState<SampleType | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const {toast} = useToast()
    const queryClient = useQueryClient()

    // Build filters
    const filters: SampleTypeFilters = {
        search: searchTerm || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch sample types - use different API based on search term
    const {data: sampleTypes, isLoading, error} = useQuery({
        queryKey: ['sample-types', searchTerm, currentPage, pageSize],
        queryFn: async () => {
            // If there's a search term, use the by-type-name API
            if (searchTerm?.trim()) {
                const response = await apiClient.getSampleTypeByTypeName(searchTerm.trim())
                // API returns array in response.data, convert to expected structure
                return {
                    data: {
                        sampleTypes: response.data || [],
                        total: response.data?.length || 0,
                        limit: pageSize,
                        offset: 0,
                    }
                }
            }
            // Otherwise use the regular list API with pagination
            return apiClient.getSampleTypes(filters)
        },
    })

    const createMutation = useMutation({
        mutationFn: (newSampleType: SampleTypeRequest) => apiClient.createSampleType(newSampleType),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['sample-types']})
            toast({
                title: 'Thành công',
                description: 'Loại mẫu đã được tạo thành công',
            })
            setIsCreateDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo loại mẫu',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({id, data}: { id: string; data: Partial<SampleTypeRequest> }) =>
            apiClient.updateSampleType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['sample-types']})
            toast({
                title: 'Thành công',
                description: 'Loại mẫu đã được cập nhật thành công',
            })
            setIsCreateDialogOpen(false)
            setEditingSampleType(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật loại mẫu',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteSampleType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['sample-types']})
            toast({
                title: 'Thành công',
                description: 'Loại mẫu đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa loại mẫu',
                variant: 'destructive',
            })
        },
    })

    const handleCreateSampleType = (data: SampleTypeRequest) => {
        createMutation.mutate(data)
    }

    const handleUpdateSampleType = (data: SampleTypeRequest) => {
        if (editingSampleType) {
            updateMutation.mutate({id: editingSampleType.id, data})
        }
    }

    const handleEdit = (sampleType: SampleType) => {
        setEditingSampleType(sampleType)
        setIsCreateDialogOpen(true)
    }

    function handleDeleteSampleType(sampleType: SampleType) {
        setSampleTypeToDelete(sampleType)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (sampleTypeToDelete) {
            deleteMutation.mutate(sampleTypeToDelete.id)
            setDeleteDialogOpen(false)
            setSampleTypeToDelete(null)
        }
    }

    const totalPages = sampleTypes?.data ? Math.ceil(sampleTypes.data.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</CardTitle>
                    <CardDescription className="text-red-500">
                        Không thể tải dữ liệu loại mẫu. Vui lòng thử lại sau.
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
                    <CardTitle className="text-2xl font-bold">Quản lý loại mẫu</CardTitle>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingSampleType(null)} className="medical-gradient">
                                <Plus className="mr-2 h-4 w-4"/> Thêm loại mẫu
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editingSampleType ? 'Cập nhật loại mẫu' : 'Tạo loại mẫu mới'}</DialogTitle>
                                <DialogDescription>
                                    {editingSampleType ? 'Chỉnh sửa thông tin loại mẫu.' : 'Điền thông tin để tạo loại mẫu mới.'}
                                </DialogDescription>
                            </DialogHeader>
                            {editingSampleType ? (
                                <SampleTypeForm
                                    initialData={editingSampleType}
                                    onSubmit={handleUpdateSampleType}
                                    isLoading={updateMutation.isPending}
                                />
                            ) : (
                                <SampleTypeForm
                                    onSubmit={handleCreateSampleType}
                                    isLoading={createMutation.isPending}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Tìm kiếm theo tên loại mẫu..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(0) // Reset to first page when searching
                                }}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin"/>
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
                                            <TableHead>Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sampleTypes?.data?.sampleTypes?.map((sampleType) => (
                                            <TableRow key={sampleType.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-medical-100 rounded-full">
                                                            <TestTube className="h-4 w-4 text-medical-600"/>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{sampleType.typeName}</div>
                                                            <div
                                                                className="text-sm text-muted-foreground">{sampleType.typeCode}</div>
                                                            {sampleType.shortName && (
                                                                <div
                                                                    className="text-xs text-muted-foreground">({sampleType.shortName})</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <p className="text-sm text-muted-foreground truncate">
                                                            {sampleType.description || '-'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(sampleType)}
                                                        >
                                                            <Edit className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteSampleType(sampleType)}
                                                        >
                                                            <Trash2 className="h-4 w-4"/>
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
                                        số {sampleTypes?.data?.total || 0} loại mẫu
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4"/>
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
                                            <ChevronRight className="h-4 w-4"/>
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
                        <DialogTitle>Xác nhận xóa loại mẫu</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa loại mẫu &quot;{sampleTypeToDelete?.typeName}&quot;?
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
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
