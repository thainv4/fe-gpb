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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { apiClient, Branch, BranchRequest, BranchFilters } from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    Building2,
    MapPin,
    Phone,
    User
} from 'lucide-react'
import { BranchForm } from './branch-form'
import { formatDate } from '@/lib/utils'

export function BranchTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedProvince, setSelectedProvince] = useState('all')
    const [selectedLevel, setSelectedLevel] = useState('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Fetch provinces and wards
    const { data: provincesData } = useQuery({
        queryKey: ['provinces'],
        queryFn: () => apiClient.getProvinces({ limit: 100, offset: 0, isActive: true }),
    })

    const { data: wardsData } = useQuery({
        queryKey: ['wards'],
        queryFn: () => apiClient.getWards({ limit: 100, offset: 0 }),
    })

    const provinces = provincesData?.data?.provinces || []
    const wards = wardsData?.data?.wards || []

    // Build filters
    const filters: BranchFilters = {
        search: searchTerm || undefined,
        provinceId: selectedProvince && selectedProvince !== 'all' ? selectedProvince : undefined,
        hospitalLevel: selectedLevel && selectedLevel !== 'all' ? selectedLevel : undefined,
        limit: pageSize,
        offset: currentPage * pageSize,
    }

    // Fetch branches
    const { data: branches, isLoading, error } = useQuery({
        queryKey: ['branches', filters],
        queryFn: () => apiClient.getBranches(filters),
    })

    // Create branch mutation
    const createMutation = useMutation({
        mutationFn: (data: BranchRequest) => apiClient.createBranch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] })
            setIsCreateDialogOpen(false)
            toast({
                title: 'Thành công',
                description: 'Chi nhánh đã được tạo thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo chi nhánh',
                variant: 'destructive',
            })
        },
    })

    // Update branch mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BranchRequest> }) =>
            apiClient.updateBranch(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] })
            setEditingBranch(null)
            toast({
                title: 'Thành công',
                description: 'Chi nhánh đã được cập nhật thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật chi nhánh',
                variant: 'destructive',
            })
        },
    })

    // Delete branch mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiClient.deleteBranch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] })
            toast({
                title: 'Thành công',
                description: 'Chi nhánh đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa chi nhánh',
                variant: 'destructive',
            })
        },
    })

    function handleCreateBranch(data: BranchRequest) {
        createMutation.mutate(data)
    }

    function handleUpdateBranch(data: Partial<BranchRequest>) {
        if (editingBranch) {
            updateMutation.mutate({ id: editingBranch.id, data })
        }
    }

    function handleDeleteBranch(branch: Branch) {
        setBranchToDelete(branch)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (branchToDelete) {
            deleteMutation.mutate(branchToDelete.id)
            setDeleteDialogOpen(false)
            setBranchToDelete(null)
        }
    }

    function getProvinceName(provinceId: string) {
        const province = provinces.find(p => p.id === provinceId)
        return province?.provinceName || 'N/A'
    }

    function getWardName(wardId: string) {
        const ward = wards.find(w => w.id === wardId)
        return ward?.wardName || 'N/A'
    }


    const totalPages = branches?.data ? Math.ceil(branches.data.pagination.total / pageSize) : 0

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        Lỗi khi tải danh sách chi nhánh: {error.message}
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
                            <CardTitle className="flex items-center">
                                <Building2 className="mr-2 h-5 w-5" />
                                Quản lý chi nhánh
                            </CardTitle>
                            <CardDescription>
                                Quản lý các chi nhánh/cơ sở của bệnh viện
                            </CardDescription>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="medical-gradient">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm chi nhánh
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Thêm chi nhánh mới</DialogTitle>
                                    <DialogDescription>
                                        Tạo một chi nhánh mới trong hệ thống
                                    </DialogDescription>
                                </DialogHeader>
                                <BranchForm
                                    onSubmit={handleCreateBranch}
                                    isLoading={createMutation.isPending}
                                    provinces={provinces}
                                    wards={wards}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm chi nhánh..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tất cả tỉnh" />
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
                        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tất cả cấp bậc" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả cấp bậc</SelectItem>
                                <SelectItem value="Hạng Đặc biệt">Hạng Đặc biệt</SelectItem>
                                <SelectItem value="Hạng I">Hạng I</SelectItem>
                                <SelectItem value="Hạng II">Hạng II</SelectItem>
                                <SelectItem value="Hạng III">Hạng III</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Đang tải...</span>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã</TableHead>
                                        <TableHead>Tên chi nhánh</TableHead>
                                        <TableHead>Địa chỉ</TableHead>
                                        <TableHead>Tỉnh/TP</TableHead>
                                        <TableHead>Phường/Xã</TableHead>
                                        <TableHead>Cấp bậc</TableHead>
                                        <TableHead>Liên hệ</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!branches?.data?.items || branches.data.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                                Không có chi nhánh nào
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        branches.data.items.map((branch) => (
                                            <TableRow key={branch.id}>
                                                <TableCell className="font-medium">{branch.branchCode}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{branch.branchName}</div>
                                                        {branch.shortName && (
                                                            <div className="text-sm text-muted-foreground">{branch.shortName}</div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                                                        <span className="text-sm">{branch.address}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getProvinceName(branch.provinceId)}</TableCell>
                                                <TableCell>{getWardName(branch.wardId)}</TableCell>
                                                <TableCell>{branch.hospitalLevel || '-'}</TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {branch.phoneNumber && (
                                                            <div className="flex items-center text-sm">
                                                                <Phone className="h-3 w-3 mr-1" />
                                                                {branch.phoneNumber}
                                                            </div>
                                                        )}
                                                        {branch.representative && (
                                                            <div className="flex items-center text-sm">
                                                                <User className="h-3 w-3 mr-1" />
                                                                {branch.representative}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        {branch.isActive === 1 ? (
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
                                                    {formatDate(branch.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingBranch(branch)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteBranch(branch)}
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Hiển thị {branches?.data?.items?.length || 0} trong tổng số {branches?.data?.pagination?.total || 0} chi nhánh
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                            disabled={currentPage === 0}
                                        >
                                            Trước
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
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!editingBranch} onOpenChange={() => setEditingBranch(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa chi nhánh</DialogTitle>
                        <DialogDescription>
                            Cập nhật thông tin chi nhánh
                        </DialogDescription>
                    </DialogHeader>
                    {editingBranch && (
                        <BranchForm
                            initialData={editingBranch}
                            onSubmit={handleUpdateBranch}
                            isLoading={updateMutation.isPending}
                            provinces={provinces}
                            wards={wards}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa chi nhánh</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa chi nhánh &quot;{branchToDelete?.branchName}&quot;?
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
