'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { apiClient, User, UserRequest, Province, Ward, Department } from '@/lib/api/client'

// Schema cho cập nhật (đầy đủ trường)
const updateSchema = z.object({
    username: z.string().min(1, 'Tên đăng nhập là bắt buộc').max(50, 'Tên đăng nhập tối đa 50 ký tự'),
    email: z.string().email('Email không hợp lệ').max(100, 'Email tối đa 100 ký tự'),
    fullName: z.string().min(1, 'Họ tên là bắt buộc').max(100, 'Họ tên tối đa 100 ký tự'),
    phoneNumber: z.string().max(20, 'Số điện thoại tối đa 20 ký tự').optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional(),
    role: z.string().min(1, 'Vai trò là bắt buộc'),
    isActive: z.boolean().default(true),
    hisUsername: z.string().max(50, 'Tên đăng nhập HIS tối đa 50 ký tự').optional(),
    hisPassword: z.string().max(100, 'Mật khẩu HIS tối đa 100 ký tự').optional(),
    provinceId: z.string().optional(),
    wardId: z.string().optional(),
    departmentId: z.string().optional(),
})

type UpdateFormData = z.infer<typeof updateSchema>

interface UserFormProps {
    initialData: User
    onSubmit: (data: UserRequest) => void
    isLoading?: boolean
}

export function UserForm({ initialData, onSubmit, isLoading = false }: UserFormProps) {
    const [provinces, setProvinces] = useState<Province[]>([])
    const [wards, setWards] = useState<Ward[]>([])
    const [departments, setDepartments] = useState<Department[]>([])

    const form = useForm<UpdateFormData>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            username: initialData?.username || '',
            email: initialData?.email || '',
            fullName: initialData?.fullName || '',
            phoneNumber: initialData?.phoneNumber || '',
            dateOfBirth: initialData?.dateOfBirth || '',
            address: initialData?.address || '',
            role: 'user',
            isActive: initialData?.isActive ?? true,
            hisUsername: initialData?.profile?.mappedUsername || '',
            hisPassword: '',
            provinceId: initialData?.profile?.provinceId || '',
            wardId: initialData?.profile?.wardId || '',
            departmentId: initialData?.profile?.departmentId || '',
        },
    })

    useEffect(() => {
        async function fetchData() {
            try {
                const [provincesRes, wardsRes, departmentsRes] = await Promise.all([
                    apiClient.getProvinces(),
                    apiClient.getWards(),
                    apiClient.getDepartments(),
                ])

                if (provincesRes.success && provincesRes.data) {
                    setProvinces(provincesRes.data.provinces || [])
                }
                if (wardsRes.success && wardsRes.data) {
                    setWards(wardsRes.data.wards || [])
                }
                if (departmentsRes.success && departmentsRes.data) {
                    setDepartments(departmentsRes.data.departments || [])
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            }
        }

        fetchData()
    }, [])

    function handleSubmit(data: UpdateFormData) {
        // Map hisUsername và hisPassword sang mappedUsername và mappedPassword
        const submitData: UserRequest = {
            ...data,
            mappedUsername: data.hisUsername,
            mappedPassword: data.hisPassword,
        }
        // Xóa các field không cần thiết
        delete (submitData as any).hisUsername
        delete (submitData as any).hisPassword
        
        onSubmit(submitData)
    }

    const selectedProvinceId = form.watch('provinceId')
    const filteredWards = selectedProvinceId
        ? wards.filter(ward => ward.provinceId === selectedProvinceId)
        : []

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên đăng nhập *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập tên đăng nhập" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="Nhập email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Họ tên *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập họ tên" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập số điện thoại" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ngày sinh</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Địa chỉ</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nhập địa chỉ" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vai trò *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn vai trò" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="user">User</SelectItem>
                                                <SelectItem value="doctor">Doctor</SelectItem>
                                                <SelectItem value="nurse">Nurse</SelectItem>
                                                <SelectItem value="technician">Technician</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trạng thái</FormLabel>
                                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn trạng thái" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="true">Hoạt động</SelectItem>
                                                <SelectItem value="false">Không hoạt động</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="hisUsername"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tên đăng nhập HIS</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nhập tên đăng nhập HIS" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="hisPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mật khẩu HIS</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="Nhập mật khẩu HIS" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="provinceId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tỉnh/Thành phố</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn tỉnh/thành phố" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {provinces?.map((province) => (
                                                    <SelectItem key={province.id} value={province.id}>
                                                        {province.provinceName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="wardId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phường/Xã</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedProvinceId}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn phường/xã" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredWards.map((ward) => (
                                                    <SelectItem key={ward.id} value={ward.id}>
                                                        {ward.wardName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="departmentId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Khoa</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn khoa" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments?.map((department) => (
                                                    <SelectItem key={department.id} value={department.id}>
                                                        {department.departmentName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                </div>

                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cập nhật người dùng
                </Button>

                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {initialData ? 'Cập nhật người dùng' : 'Tạo người dùng'}
                </Button>
            </form>
        </Form>
    )
}
