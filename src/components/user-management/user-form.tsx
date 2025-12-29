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

// Schema cho cập nhật - tương tự form đăng ký nhưng không có username, email, password
const updateSchema = z.object({
    // Profile fields (optional) - giống RegisterForm
    provinceId: z.string().optional(),
    wardId: z.string().optional(),
    address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional(),
    departmentId: z.string().optional(),
    position: z.string().max(100, 'Chức vụ tối đa 100 ký tự').optional(),
    employeeCode: z.string().max(50, 'Mã nhân viên tối đa 50 ký tự').optional(),
    phoneNumber: z.string().regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ').min(10).max(20).optional().or(z.literal('')),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    mappedUsername: z.string().min(3).max(100).optional().or(z.literal('')),
    mappedPassword: z.string().min(6).max(100).optional().or(z.literal('')),
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
    const [profileLoading, setProfileLoading] = useState(true)

    const form = useForm<UpdateFormData>({
        resolver: zodResolver(updateSchema),
        defaultValues: {
            provinceId: '',
            wardId: '',
            address: '',
            departmentId: '',
            position: '',
            employeeCode: '',
            phoneNumber: '',
            dateOfBirth: '',
            gender: undefined,
            mappedUsername: '',
            mappedPassword: '',
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

    // Fetch profile data khi component mount
    useEffect(() => {
        async function fetchProfile() {
            if (!initialData?.id) return
            
            setProfileLoading(true)
            try {
                const profileRes = await apiClient.getProfileByUserId(initialData.id)
                
                if (profileRes.success && profileRes.data) {
                    const profile = profileRes.data
                    // Format dateOfBirth to YYYY-MM-DD for input[type="date"]
                    let formattedDate = ''
                    if (profile.dateOfBirth) {
                        const date = new Date(profile.dateOfBirth)
                        if (!isNaN(date.getTime())) {
                            formattedDate = date.toISOString().split('T')[0]
                        }
                    }
                    
                    form.reset({
                        provinceId: profile.provinceId || '',
                        wardId: profile.wardId || '',
                        address: profile.address || '',
                        departmentId: profile.departmentId || '',
                        position: profile.position || '',
                        employeeCode: profile.employeeCode || '',
                        phoneNumber: profile.phoneNumber || '',
                        dateOfBirth: formattedDate,
                        gender: profile.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
                        mappedUsername: profile.mappedUsername || '',
                        mappedPassword: '', // Không hiển thị password cũ
                    })
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
            } finally {
                setProfileLoading(false)
            }
        }

        fetchProfile()
    }, [initialData?.id, form])

    function handleSubmit(data: UpdateFormData) {
        // Chỉ gửi các trường có giá trị (loại bỏ empty string)
        const submitData: Partial<UserRequest> = {}

        // Thêm các trường profile nếu có giá trị
        if (data.departmentId) submitData.departmentId = data.departmentId
        if (data.position) submitData.position = data.position
        if (data.employeeCode) submitData.employeeCode = data.employeeCode
        if (data.mappedUsername) submitData.mappedUsername = data.mappedUsername
        if (data.mappedPassword) submitData.mappedPassword = data.mappedPassword

        onSubmit(submitData as UserRequest)
    }

    const selectedProvinceId = form.watch('provinceId')
    const filteredWards = selectedProvinceId
        ? wards.filter(ward => ward.provinceId === selectedProvinceId)
        : []

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Đang tải thông tin profile...</span>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Thông tin người dùng (readonly) */}
                <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Thông tin đăng nhập</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tên đăng nhập</label>
                            <Input value={initialData?.username || ''} disabled className="bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input value={initialData?.email || ''} disabled className="bg-gray-50" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Họ tên</label>
                        <Input value={initialData?.fullName || ''} disabled className="bg-gray-50" />
                    </div>
                </div>

                {/* Profile fields - Optional - giống RegisterForm */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Thông tin công việc</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chức vụ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập chức vụ" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="employeeCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mã nhân viên</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập mã nhân viên" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <h4 className="col-span-2 text-md font-semibold">Thông tin tích hợp HIS</h4>
                        <FormField
                            control={form.control}
                            name="mappedUsername"
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
                            name="mappedPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mật khẩu HIS (để trống nếu không đổi)</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Nhập mật khẩu HIS mới" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cập nhật thông tin
                </Button>
            </form>
        </Form>
    )
}
