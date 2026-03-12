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
import { apiClient, User, UserRequest, UserFilters, RegisterWithProfileRequest } from '@/lib/api/client'
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForm } from './user-form'
import { RegisterForm } from './register-form'

const PAGE_SIZE = 20

export function UserTable() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [currentPage, setCurrentPage] = useState(0)

    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Fetch departments cho dropdown Khoa (giống user-rooms)
    const { data: departmentsData } = useQuery({
        queryKey: ['departments', { limit: 200, offset: 0 }],
        queryFn: () => apiClient.getDepartments({ limit: 200, offset: 0 }),
        staleTime: 5 * 60 * 1000,
    })
    const departments = departmentsData?.data?.departments || []

    // Build filters - giống user-rooms: search + departmentId
    const filters: UserFilters = {
        search: searchTerm || undefined,
        departmentId: selectedDepartmentId || undefined,
        isActive: selectedStatus && selectedStatus !== 'all' ? selectedStatus === 'active' : undefined,
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
    }

    // Fetch users list (một API getUsers với search, giống user-rooms)
    const { data: usersResponse, isLoading, error } = useQuery({
        queryKey: ['users', filters],
        queryFn: () => apiClient.getUsers(filters),
    })

    const displayUsers = usersResponse as typeof usersResponse & {
        data: {
            users: User[];
            total: number;
            limit: number;
            offset: number;
        }
    } | undefined

    const displayError = error
    const displayLoading = isLoading

    const createMutation = useMutation({
        mutationFn: async (newUser: RegisterWithProfileRequest) => {
            const response = await apiClient.registerWithProfile(newUser)
            // Nếu API trả về success: false, throw error để trigger onError
            if (!response.success) {
                throw new Error(response.error || response.message || 'Không thể tạo người dùng')
            }
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast({
                title: 'Thành công',
                description: 'Người dùng đã được tạo thành công',
            })
            setIsCreateDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo người dùng',
                variant: 'destructive',
            })
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<UserRequest> }) => {
            // Chỉ gửi các trường có giá trị thực sự (không phải empty string hoặc undefined)
            const profileData: {
                provinceId?: string;
                wardId?: string;
                address?: string;
                departmentId?: string;
                position?: string;
                employeeCode?: string;
                phoneNumber?: string;
                dateOfBirth?: string;
                mappedUsername?: string;
                mappedPassword?: string;
            } = {};
            
            if (data.provinceId) profileData.provinceId = data.provinceId;
            if (data.wardId) profileData.wardId = data.wardId;
            if (data.address) profileData.address = data.address;
            if (data.departmentId) profileData.departmentId = data.departmentId;
            if (data.position) profileData.position = data.position;
            if (data.employeeCode) profileData.employeeCode = data.employeeCode;
            if (data.phoneNumber) profileData.phoneNumber = data.phoneNumber;
            if (data.dateOfBirth) profileData.dateOfBirth = data.dateOfBirth;
            if (data.mappedUsername) profileData.mappedUsername = data.mappedUsername;
            if (data.mappedPassword) profileData.mappedPassword = data.mappedPassword;
            
            // Gọi API updateProfile thay vì updateUser
            const response = await apiClient.updateProfile(id, profileData);
            // Nếu API trả về success: false, throw error để trigger onError
            if (!response.success) {
                throw new Error(response.error || response.message || 'Không thể cập nhật profile')
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast({
                title: 'Thành công',
                description: 'Profile đã được cập nhật thành công',
            })
            setIsCreateDialogOpen(false)
            setEditingUser(null)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể cập nhật profile',
                variant: 'destructive',
            })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.deleteUser(id)
            // Nếu API trả về success: false, throw error để trigger onError
            if (!response.success) {
                throw new Error(response.error || response.message || 'Không thể xóa người dùng')
            }
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast({
                title: 'Thành công',
                description: 'Người dùng đã được xóa thành công',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể xóa người dùng',
                variant: 'destructive',
            })
        },
    })

    const handleCreateUser = (data: RegisterWithProfileRequest) => {
        createMutation.mutate(data)
    }

    const handleUpdateUser = (data: UserRequest) => {
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data })
        }
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setIsCreateDialogOpen(true)
    }

    function handleDeleteUser(user: User) {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (userToDelete) {
            deleteMutation.mutate(userToDelete.id)
            setDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    const totalPages = displayUsers?.data ? Math.ceil(displayUsers.data.total / PAGE_SIZE) : 0

    if (displayError) {
        return (
            <Card>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-semibold text-red-600">Lỗi tải dữ liệu</CardTitle>
                    <CardDescription className="text-red-500">
                        Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.
                    </CardDescription>
                    <p className="mt-2 text-sm text-red-700">{displayError.message}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-2xl font-bold">Quản lý người dùng</CardTitle>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setEditingUser(null)} className="medical-gradient">
                                <Plus className="mr-2 h-4 w-4" /> Thêm người dùng
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingUser ? 'Cập nhật người dùng' : 'Tạo người dùng mới'}</DialogTitle>
                                <DialogDescription>
                                    {editingUser ? 'Chỉnh sửa thông tin người dùng.' : 'Điền thông tin để tạo người dùng mới.'}
                                </DialogDescription>
                            </DialogHeader>
                            {editingUser ? (
                                <UserForm
                                    initialData={editingUser}
                                    onSubmit={handleUpdateUser}
                                    isLoading={updateMutation.isPending}
                                />
                            ) : (
                                <RegisterForm
                                    onSubmit={handleCreateUser}
                                    isLoading={createMutation.isPending}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm người dùng..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(0)
                                }}
                                className="pl-8"
                            />
                        </div>
                        <Select
                            value={selectedDepartmentId || 'all'}
                            onValueChange={(v) => {
                                setSelectedDepartmentId(v === 'all' ? '' : v)
                                setCurrentPage(0)
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tất cả khoa" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả khoa</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.departmentName || d.departmentCode || d.id}
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

                    {displayLoading ? (
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
                                            <TableHead>Khoa</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayUsers?.data?.users && displayUsers.data.users.length > 0 ? (
                                            displayUsers.data.users.map((user) => (
                                                <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-medical-100 rounded-full">
                                                            <UserIcon className="h-4 w-4 text-medical-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{user.fullName}</div>
                                                            <div className="text-sm text-muted-foreground">{user.username}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell>
                                                    <div className="flex items-center text-sm">
                                                        {(user.departmentName ?? user.department?.departmentName) ? (
                                                            <>
                                                                <Building2 className="h-3 w-3 mr-1 shrink-0 text-muted-foreground" />
                                                                {user.departmentName ?? user.department?.departmentName}
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(user)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <UserIcon className="h-12 w-12 text-gray-300" />
                                                        <p className="text-lg font-medium">Không có người dùng nào</p>
                                                        <p className="text-sm">Hãy thêm người dùng mới để bắt đầu</p>
                                                    </div>
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
                                        Hiển thị {displayUsers?.data?.users?.length ?? 0} trong tổng số {displayUsers?.data?.total ?? 0} người dùng
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
                        <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa người dùng &quot;{userToDelete?.fullName}&quot;?
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
