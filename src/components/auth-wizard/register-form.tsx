'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { Loader2, UserPlus, Shield } from 'lucide-react'
import { apiClient, RegisterWithProfileRequest, Department } from '@/lib/api/client'

const registerSchema = z.object({
    username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự').max(50, 'Tên đăng nhập tối đa 50 ký tự'),
    password: z.string().min(1, 'Mật khẩu là bắt buộc'),
    fullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự').max(100, 'Họ tên tối đa 100 ký tự'),
    departmentId: z.string().min(1, 'Vui lòng chọn khoa'),
    position: z.string().min(1, 'Chức vụ là bắt buộc').max(100, 'Chức vụ tối đa 100 ký tự'),
    employeeCode: z.string().min(1, 'Mã nhân viên là bắt buộc').max(50, 'Mã nhân viên tối đa 50 ký tự'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPageForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [departments, setDepartments] = useState<Department[]>([])
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)
    const { toast } = useToast()
    const router = useRouter()

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: '',
            password: '',
            fullName: '',
            departmentId: '',
            position: '',
            employeeCode: '',
        },
    })

    useEffect(() => {
        async function fetchDepartments() {
            try {
                setIsLoadingDepartments(true)
                const response = await apiClient.getDepartments()
                if (response.success && response.data) {
                    const deptsData = response.data as any
                    setDepartments(deptsData.departments || deptsData.items || [])
                }
            } catch (error) {
                console.error('Error fetching departments:', error)
                toast({
                    title: 'Lỗi',
                    description: 'Không thể tải danh sách khoa',
                    variant: 'destructive',
                })
            } finally {
                setIsLoadingDepartments(false)
            }
        }

        fetchDepartments()
    }, [toast])

    async function onSubmit(data: RegisterFormData) {
        setIsLoading(true)

        try {
            const submitData: RegisterWithProfileRequest = {
                username: data.username,
                password: data.password,
                fullName: data.fullName,
                departmentId: data.departmentId,
                position: data.position,
                employeeCode: data.employeeCode,
                // username và mappedUsername dùng chung 1 input
                mappedUsername: data.username,
                // password và mappedPassword dùng chung 1 input
                mappedPassword: data.password,
            }

            const result = await apiClient.registerWithProfile(submitData)

            if (result.success) {
                toast({
                    title: 'Đăng ký thành công',
                    description: 'Tài khoản của bạn đã được tạo thành công. Vui lòng đăng nhập.',
                })
                // Redirect to login page
                router.push('/auth/login')
            } else {
                let errorMessage = 'Đã xảy ra lỗi, vui lòng thử lại'
                if (result.error) {
                    if (typeof result.error === 'object' && result.error !== null && 'message' in result.error) {
                        errorMessage = String((result.error as { message: unknown }).message)
                    } else {
                        errorMessage = String(result.error)
                    }
                } else if (result.message) {
                    errorMessage = String(result.message)
                }
                throw new Error(errorMessage)
            }
        } catch (error) {
            let errorMessage = 'Đã xảy ra lỗi, vui lòng thử lại'
            if (error instanceof Error) {
                errorMessage = error.message
            } else if (typeof error === 'string') {
                errorMessage = error
            }
            toast({
                title: 'Đăng ký thất bại',
                description: errorMessage,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-50 to-medical-100 p-4">
            <Card className="w-full max-w-2xl medical-shadow">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-medical-500 rounded-full">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-medical-900">
                        Đăng ký tài khoản
                    </CardTitle>
                    <CardDescription className="text-medical-600">
                        Điền thông tin để tạo tài khoản mới
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tên đăng nhập *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập tên đăng nhập (dùng chung cho hệ thống và HIS)"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
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
                                                <Input
                                                    type="password"
                                                    placeholder="Nhập mật khẩu (dùng chung cho hệ thống và HIS)"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
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
                                            <Input
                                                placeholder="Nhập họ tên"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="departmentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Khoa *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                disabled={isLoading || isLoadingDepartments}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn khoa" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {isLoadingDepartments ? (
                                                        <SelectItem value="_loading" disabled>
                                                            Đang tải...
                                                        </SelectItem>
                                                    ) : departments.length === 0 ? (
                                                        <SelectItem value="_empty" disabled>
                                                            Không có khoa nào
                                                        </SelectItem>
                                                    ) : (
                                                        departments.map((department) => (
                                                            <SelectItem key={department.id} value={department.id}>
                                                                {department.departmentName}
                                                            </SelectItem>
                                                        ))
                                                    )}
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
                                            <FormLabel>Chức vụ *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập chức vụ"
                                                    {...field}
                                                    disabled={isLoading}
                                                />
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
                                        <FormLabel>Mã nhân viên *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Nhập mã nhân viên"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full medical-gradient"
                                disabled={isLoading || isLoadingDepartments}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang đăng ký...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Đăng ký
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm text-gray-600">
                                <p>
                                    Đã có tài khoản?{' '}
                                    <a
                                        href="/auth/login"
                                        className="text-medical-600 hover:text-medical-700 font-medium underline"
                                    >
                                        Đăng nhập
                                    </a>
                                </p>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

