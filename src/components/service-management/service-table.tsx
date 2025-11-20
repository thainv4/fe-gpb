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
import { apiClient, Service, ServiceRequest, ServiceFilters } from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    Package,
    Ruler,
    DollarSign,
    Code,
    ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceForm } from './service-form'

export function ServiceTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedGroup, setSelectedGroup] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingService, setEditingService] = useState<Service | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Fetch service groups for filter
    const { data: serviceGroupsData } = useQuery({
        queryKey: ['service-groups'],
        queryFn: () => apiClient.getServiceGroups(),
    })

    const serviceGroups = serviceGroupsData?.data?.items || []

    // Build filters
    const filters: ServiceFilters = {
        search: searchTerm || undefined,
        serviceGroupId: selectedGroup && selectedGroup !== 'all' ? selectedGroup : undefined,
        isActive: selectedStatus && selectedStatus !== 'all' ? selectedStatus === 'active' : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch services
    const { data: services, isLoading, error } = useQuery({
        queryKey: ['services', filters],
        queryFn: () => apiClient.getServices(filters),
    })

    const createMutation = useMutation({
        mutationFn: (newService: ServiceRequest) => apiClient.createService(newService),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] })
            toast({
                title: 'Thành công',
                description: 'Dịch vụ đã được tạo thành công',
            })
            setIsCreateDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo dịch vụ',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ServiceRequest> }) =>
            apiClient.updateService(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] })
            toast({
                title: 'Thành công',
                description: 'Dịch vụ đã được cập nhật thành công',
            })
            setIsCreateDialogOpen(false)
            setEditingService(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật dịch vụ',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteService(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] })
            toast({
                title: 'Thành công',
                description: 'Dịch vụ đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa dịch vụ',
                variant: 'destructive',
            })
        },
    })

    const handleCreateService = (data: ServiceRequest) => {
        createMutation.mutate(data)
    }

    const handleUpdateService = (data: ServiceRequest) => {
        if (editingService) {
            updateMutation.mutate({ id: editingService.id, data })
        }
    }

    const handleEdit = (service: Service) => {
        setEditingService(service)
        setIsCreateDialogOpen(true)
    }

    function handleDeleteService(service: Service) {
        setServiceToDelete(service)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (serviceToDelete) {
            deleteMutation.mutate(serviceToDelete.id)
            setDeleteDialogOpen(false)
            setServiceToDelete(null)
        }
    }

    const totalPages = services?.data ? Math.ceil(services.data.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</CardTitle>
                    <CardDescription className="text-red-500">
                        Không thể tải dữ liệu dịch vụ. Vui lòng thử lại sau.
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
                    <CardTitle className="text-2xl font-bold">Quản lý dịch vụ</CardTitle>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingService(null)} className="medical-gradient">
                                <Plus className="mr-2 h-4 w-4" /> Thêm dịch vụ
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingService ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ mới'}</DialogTitle>
                                <DialogDescription>
                                    {editingService ? 'Chỉnh sửa thông tin dịch vụ.' : 'Điền thông tin để tạo dịch vụ mới.'}
                                </DialogDescription>
                            </DialogHeader>
                            {editingService ? (
                                <ServiceForm
                                    initialData={editingService}
                                    onSubmit={handleUpdateService}
                                    isLoading={updateMutation.isPending}
                                />
                            ) : (
                                <ServiceForm
                                    onSubmit={handleCreateService}
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
                                placeholder="Tìm kiếm theo tên hoặc mã dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tất cả nhóm dịch vụ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả nhóm dịch vụ</SelectItem>
                                {serviceGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.serviceGroupName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                            <TableHead>Nhóm dịch vụ</TableHead>
                                            <TableHead>Đơn vị tính</TableHead>
                                            <TableHead>Giá</TableHead>
                                            <TableHead>Thứ tự</TableHead>
                                            <TableHead>Mapping HIS</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services?.data?.items?.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-medical-100 rounded-full">
                                                            <Stethoscope className="h-4 w-4 text-medical-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{service.serviceName}</div>
                                                            <div className="text-sm text-muted-foreground">{service.serviceCode}</div>
                                                            {service.shortName && (
                                                                <div className="text-xs text-muted-foreground">({service.shortName})</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {service.serviceGroup ? (
                                                        <div className="flex items-center text-sm">
                                                            <Package className="h-3 w-3 mr-1" />
                                                            {service.serviceGroup.serviceGroupName}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {service.unitOfMeasure ? (
                                                        <div className="flex items-center text-sm">
                                                            <Ruler className="h-3 w-3 mr-1" />
                                                            {service.unitOfMeasure.unitOfMeasureName}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {service.currentPrice ? (
                                                        <div className="flex items-center text-sm">
                                                            <DollarSign className="h-3 w-3 mr-1" />
                                                            {service.currentPrice.toLocaleString('vi-VN')} VNĐ
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {service.numOrder !== undefined ? (
                                                        <div className="flex items-center text-sm">
                                                            <ArrowUpDown className="h-3 w-3 mr-1" />
                                                            {service.numOrder}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {service.mapping ? (
                                                        <div className="flex items-center text-sm">
                                                            <Code className="h-3 w-3 mr-1" />
                                                            <span className="text-muted-foreground">Có mapping</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.isActiveFlag === 1
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {service.isActiveFlag === 1 ? 'Hoạt động' : 'Không hoạt động'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(service)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteService(service)}
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
                                        Hiển thị {services?.data?.items?.length || 0} trong tổng số {services?.data?.total || 0} dịch vụ
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
                        <DialogTitle>Xác nhận xóa dịch vụ</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa dịch vụ &quot;{serviceToDelete?.serviceName}&quot;?
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
