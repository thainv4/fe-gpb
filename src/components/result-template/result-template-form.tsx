'use client'

import {useState, useEffect} from 'react'
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query'
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
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
import {Textarea} from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit,
    Search,
    FileText,
    Copy
} from 'lucide-react'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {useToast} from '@/hooks/use-toast'
import {apiClient, ResultTemplate, ResultTemplateRequest, ResultTemplateFilters} from '@/lib/api/client'

// Default template
const defaultTemplate = `<h2>NHẬN XÉT ĐẠI THỂ:</h2>
<p></p>

<h2>MÔ TẢ VI THỂ:</h2>
<p></p>

<h2>CHẨN ĐOÁN MÔ BỆNH HỌC:</h2>
<p></p>

<h2>BÀN LUẬN:</h2>
<p></p>

<h2>KHUYẾN NGHỊ:</h2>
<p></p>

<h2>HỘI CHẨN:</h2>
<p></p>`

// Validation schema
const resultTemplateSchema = z.object({
    templateName: z
        .string()
        .min(1, 'Tên mẫu kết quả không được để trống')
        .max(200, 'Tên mẫu tối đa 200 ký tự'),
    resultTextTemplate: z
        .string()
        .min(1, 'Nội dung mẫu không được để trống')
        .max(2000, 'Nội dung mẫu tối đa 2000 ký tự'),
})

type ResultTemplateFormData = z.infer<typeof resultTemplateSchema>

// Form component for create/edit
function TemplateDialog({
                            open,
                            onOpenChange,
                            initialData,
                            onSubmit,
                            isLoading
                        }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: ResultTemplate | null
    onSubmit: (data: ResultTemplateRequest) => void
    isLoading: boolean
}) {
    const form = useForm<ResultTemplateFormData>({
        resolver: zodResolver(resultTemplateSchema),
        defaultValues: {
            templateName: initialData?.templateName ?? '',
            resultTextTemplate: initialData?.resultTextTemplate ?? defaultTemplate,
        },
    })

    // Reset form when dialog opens or initialData changes
    useEffect(() => {
        if (open) {
            form.reset({
                templateName: initialData?.templateName ?? '',
                resultTextTemplate: initialData?.resultTextTemplate ?? defaultTemplate,
            })
        }
    }, [open, initialData, form])

    function handleSubmit(data: ResultTemplateFormData) {
        onSubmit(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>
                        {initialData ? 'Cập nhật mẫu kết quả' : 'Tạo mẫu kết quả xét nghiệm mới'}
                    </DialogTitle>
                    <DialogDescription>
                        {initialData
                            ? 'Chỉnh sửa nội dung mẫu kết quả xét nghiệm.'
                            : 'Nhập nội dung mẫu kết quả xét nghiệm.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="templateName"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Tên mẫu kết quả *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập tên mẫu kết quả..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        {field.value?.length || 0} / 200 ký tự
                                    </p>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="resultTextTemplate"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Nội dung mẫu *</FormLabel>
                                    <DialogDescription>Nhập nội dung vào &lt;p&gt;....&lt;/p&gt; và &lt;h2&gt;....&lt;/h2&gt;
                                    </DialogDescription>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập nội dung mẫu kết quả xét nghiệm..."
                                            className="min-h-[350px] font-mono text-sm"
                                            {...field}
                                        />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">
                                        {field.value?.length || 0} / 2000 ký tự
                                    </p>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {initialData ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// Main component
export default function ResultTemplateForm() {
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<ResultTemplate | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [templateToDelete, setTemplateToDelete] = useState<ResultTemplate | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const {toast} = useToast()
    const queryClient = useQueryClient()

    // Build filters
    const filters: ResultTemplateFilters = {
        keyword: searchTerm || undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
    }

    // Fetch templates
    const {data: templatesData, isLoading, error} = useQuery({
        queryKey: ['result-templates', filters],
        queryFn: () =>
            searchTerm
                ? apiClient.searchResultTemplates(filters)
                : apiClient.getResultTemplates(filters),
    })

    const createMutation = useMutation({
        mutationFn: (newTemplate: ResultTemplateRequest) => apiClient.createResultTemplate(newTemplate),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['result-templates']})
            toast({
                title: 'Thành công',
                description: 'Mẫu kết quả đã được tạo thành công',
            })
            setIsCreateDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo mẫu kết quả',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({id, data}: { id: string; data: Partial<ResultTemplateRequest> }) =>
            apiClient.updateResultTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['result-templates']})
            toast({
                title: 'Thành công',
                description: 'Mẫu kết quả đã được cập nhật thành công',
            })
            setIsCreateDialogOpen(false)
            setEditingTemplate(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật mẫu kết quả',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteResultTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['result-templates']})
            toast({
                title: 'Thành công',
                description: 'Mẫu kết quả đã được xóa thành công',
            })
            setDeleteDialogOpen(false)
            setTemplateToDelete(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa mẫu kết quả',
                variant: 'destructive',
            })
        },
    })

    const handleCreateTemplate = (data: ResultTemplateRequest) => {
        createMutation.mutate(data)
    }

    const handleUpdateTemplate = (data: ResultTemplateRequest) => {
        if (editingTemplate) {
            updateMutation.mutate({id: editingTemplate.id, data})
        }
    }

    const handleEdit = (template: ResultTemplate) => {
        setEditingTemplate(template)
        setIsCreateDialogOpen(true)
    }

    const handleDeleteTemplate = (template: ResultTemplate) => {
        setTemplateToDelete(template)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (templateToDelete) {
            deleteMutation.mutate(templateToDelete.id)
        }
    }

    const handleCopyTemplate = (template: ResultTemplate) => {
        navigator.clipboard.writeText(template.resultTextTemplate)
        toast({
            title: 'Đã sao chép',
            description: 'Nội dung mẫu đã được sao chép vào clipboard',
        })
    }

    const totalPages = templatesData?.data ? Math.ceil(templatesData.data.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</CardTitle>
                    <CardDescription className="text-red-500">
                        Không thể tải dữ liệu mẫu kết quả. Vui lòng thử lại sau.
                    </CardDescription>
                    <p className="mt-2 text-sm text-red-700">{(error as Error).message}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-2xl font-bold">Quản lý mẫu kết quả</CardTitle>
                        <CardDescription>
                            Tạo và quản lý các mẫu kết quả xét nghiệm
                        </CardDescription>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingTemplate(null)
                            setIsCreateDialogOpen(true)
                        }}
                        className="medical-gradient"
                    >
                        <Plus className="mr-2 h-4 w-4"/> Thêm mẫu
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Tìm kiếm nội dung mẫu..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(0)
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
                                            <TableHead className="w-[25%]">Tên mẫu</TableHead>
                                            <TableHead className="w-[45%]">Nội dung mẫu</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead className="text-right">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templatesData?.data?.data && templatesData.data.data.length > 0 ? (
                                            templatesData.data.data.map((template) => (
                                                <TableRow key={template.id}>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-3">
                                                            <div
                                                                className="p-2 bg-medical-100 rounded-full flex-shrink-0">
                                                                <FileText className="h-4 w-4 text-medical-600"/>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {template.templateName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div
                                                            className="text-sm font-mono text-gray-700 line-clamp-2 whitespace-pre-wrap">
                                                            {template.resultTextTemplate}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {template.resultTextTemplate?.length || 0} ký tự
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {new Date(template.createdAt).toLocaleDateString('vi-VN')}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(template.createdAt).toLocaleTimeString('vi-VN')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleCopyTemplate(template)}
                                                                title="Sao chép"
                                                            >
                                                                <Copy className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(template)}
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteTemplate(template)}
                                                                title="Xóa"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600"/>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4}
                                                           className="text-center py-8 text-muted-foreground">
                                                    {searchTerm ? 'Không tìm thấy mẫu nào' : 'Chưa có mẫu kết quả nào'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Trang {currentPage + 1} / {totalPages} (Tổng: {templatesData?.data?.total || 0} mẫu)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                            disabled={currentPage === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4"/>
                                            Trước
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                            disabled={currentPage >= totalPages - 1}
                                        >
                                            Sau
                                            <ChevronRight className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <TemplateDialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                    setIsCreateDialogOpen(open)
                    if (!open) setEditingTemplate(null)
                }}
                initialData={editingTemplate}
                onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                isLoading={createMutation.isPending || updateMutation.isPending}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa mẫu kết quả này không? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    {templateToDelete && (
                        <div className="my-4 p-4 bg-gray-50 rounded-md">
                            <p className="text-sm font-mono text-gray-700 line-clamp-3">
                                {templateToDelete.resultTextTemplate}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false)
                                setTemplateToDelete(null)
                            }}
                            disabled={deleteMutation.isPending}
                        >
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
