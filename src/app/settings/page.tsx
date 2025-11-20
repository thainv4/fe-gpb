'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, User, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
    const { user, isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cài đặt</h1>
                    <p className="text-gray-600">
                        Quản lý cài đặt tài khoản và hệ thống
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <CardTitle>Thông tin cá nhân</CardTitle>
                            </div>
                            <CardDescription>
                                Cập nhật thông tin tài khoản của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tên đăng nhập</Label>
                                <Input
                                    id="name"
                                    value={user?.username || ''}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={user?.email || ''}
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Vai trò</Label>
                                <Input
                                    id="role"
                                    value="Admin"
                                    disabled
                                />
                            </div>
                            <Button className="medical-gradient">
                                Cập nhật thông tin
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Security Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Shield className="h-5 w-5" />
                                <CardTitle>Bảo mật</CardTitle>
                            </div>
                            <CardDescription>
                                Quản lý bảo mật tài khoản
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Mật khẩu mới</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Nhập mật khẩu mới"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Xác nhận mật khẩu mới"
                                />
                            </div>
                            <Button className="medical-gradient">
                                Đổi mật khẩu
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Bell className="h-5 w-5" />
                                <CardTitle>Thông báo</CardTitle>
                            </div>
                            <CardDescription>
                                Cài đặt thông báo hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Thông báo email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Nhận thông báo qua email
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    Bật
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Thông báo hệ thống</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Hiển thị thông báo trong hệ thống
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    Bật
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                <Settings className="h-5 w-5" />
                                <CardTitle>Cài đặt hệ thống</CardTitle>
                            </div>
                            <CardDescription>
                                Cấu hình hệ thống và giao diện
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Chế độ tối</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Chuyển đổi giao diện tối/sáng
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    Tắt
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Ngôn ngữ</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Chọn ngôn ngữ hiển thị
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    Tiếng Việt
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
