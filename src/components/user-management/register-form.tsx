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
import { apiClient, RegisterWithProfileRequest, Province, Ward, Department } from '@/lib/api/client'

// Schema cho đăng ký với profile
const registerWithProfileSchema = z.object({
    // User fields (required)
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự').max(50, 'Tên đăng nhập tối đa 50 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
    
    // Profile fields (optional)
    provinceId: z.string().optional(),
    wardId: z.string().optional(),
    address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional(),
    departmentId: z.string().optional(),
    position: z.string().max(100, 'Chức vụ tối đa 100 ký tự').optional(),
    employeeCode: z.string().max(50, 'Mã nhân viên tối đa 50 ký tự').optional(),
    phoneNumber: z.string().regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ').min(10).max(20).optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    mappedUsername: z.string().min(3).max(100).optional(),
    mappedPassword: z.string().min(6).max(100).optional(),
})

type RegisterWithProfileFormData = z.infer<typeof registerWithProfileSchema>

interface RegisterFormProps {
    onSubmit: (data: RegisterWithProfileRequest) => void
    isLoading?: boolean
}

export function RegisterForm({ onSubmit, isLoading = false }: RegisterFormProps) {
    const [provinces, setProvinces] = useState<Province[]>([])
    const [wards, setWards] = useState<Ward[]>([])
    const [departments, setDepartments] = useState<Department[]>([])

    const form = useForm<RegisterWithProfileFormData>({
        resolver: zodResolver(registerWithProfileSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            fullName: '',
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

    function handleSubmit(data: RegisterWithProfileFormData) {
        // Chỉ gửi các trường có giá trị (loại bỏ empty string)
        const submitData: RegisterWithProfileRequest = {
            username: data.username,
            email: data.email,
            password: data.password,
            fullName: data.fullName,
        }

        // Thêm các trường profile nếu có giá trị
        if (data.provinceId) submitData.provinceId = data.provinceId
        if (data.wardId) submitData.wardId = data.wardId
        if (data.address) submitData.address = data.address
        if (data.departmentId) submitData.departmentId = data.departmentId
        if (data.position) submitData.position = data.position
        if (data.employeeCode) submitData.employeeCode = data.employeeCode
        if (data.phoneNumber) submitData.phoneNumber = data.phoneNumber
        if (data.dateOfBirth) submitData.dateOfBirth = data.dateOfBirth
        if (data.gender) submitData.gender = data.gender
        if (data.mappedUsername) submitData.mappedUsername = data.mappedUsername
        if (data.mappedPassword) submitData.mappedPassword = data.mappedPassword

        onSubmit(submitData)
    }

    const selectedProvinceId = form.watch('provinceId')
    const filteredWards = selectedProvinceId
        ? wards.filter(ward => ward.provinceId === selectedProvinceId)
        : []

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* User fields - Required */}
                <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Thông tin đăng nhập</h3>
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tên đăng nhập *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập tên đăng nhập (tối thiểu 3 ký tự)" {...field} />
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
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mật khẩu *</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Họ tên *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nhập họ tên (tối thiểu 2 ký tự)" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Profile fields - Optional */}
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
                                    <FormLabel>Mật khẩu HIS</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Nhập mật khẩu HIS" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full medical-gradient" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Đăng ký người dùng
                </Button>
            </form>
        </Form>
    )
}
