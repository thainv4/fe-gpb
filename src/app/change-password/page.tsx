'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z.string().min(1, 'Mật khẩu mới là bắt buộc'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
    path: ['confirmPassword'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
    const { isAuthenticated } = useAuthStore()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [pendingData, setPendingData] = useState<ChangePasswordFormData | null>(null)

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(data: ChangePasswordFormData) {
        // Mở dialog xác nhận thay vì gọi API ngay
        setPendingData(data)
        setConfirmDialogOpen(true)
    }

    async function confirmChangePassword() {
        if (!pendingData) return

        setIsLoading(true)
        setConfirmDialogOpen(false)

        try {
            const response = await apiClient.changePassword({
                currentPassword: pendingData.currentPassword,
                newPassword: pendingData.newPassword,
            })

            if (response.success) {
                toast({
                    title: 'Thành công',
                    description: 'Đổi mật khẩu thành công',
                    variant: 'default',
                })
                // Reset form sau khi đổi mật khẩu thành công
                form.reset()
                setPendingData(null)
            } else {
                toast({
                    title: 'Lỗi',
                    description: response.message || response.error || 'Không thể đổi mật khẩu',
                    variant: 'destructive',
                })
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi đổi mật khẩu'
            toast({
                title: 'Lỗi',
                description: errorMessage,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="w-full max-w-2xl space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Đổi mật khẩu</h1>
                  
                    </div>

                    <Card>
                    <CardHeader>
                
                        <CardDescription>
                            Vui lòng nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mật khẩu hiện tại</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        placeholder="Nhập mật khẩu hiện tại"
                                                        {...field}
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showCurrentPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mật khẩu mới</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showNewPassword ? "text" : "password"}
                                                        placeholder="Nhập mật khẩu mới"
                                                        {...field}
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showNewPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Nhập lại mật khẩu mới"
                                                        {...field}
                                                        className="pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showConfirmPassword ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="medical-gradient"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            'Đổi mật khẩu'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => form.reset()}
                                        disabled={isLoading}
                                    >
                                        Hủy
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialog xác nhận đổi mật khẩu */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận đổi mật khẩu</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn đổi mật khẩu? Hành động này sẽ thay đổi mật khẩu tài khoản của bạn.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setConfirmDialogOpen(false)
                                setPendingData(null)
                            }}
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={confirmChangePassword}
                            disabled={isLoading}
                            className="medical-gradient"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
