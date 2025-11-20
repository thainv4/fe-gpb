'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HisStatus } from '@/components/his-integration/his-status'
import { HisApiCaller } from '@/components/his-integration/his-api-caller'
import {
    Users,
    Activity,
    TrendingUp,
    Shield,
    Clock
} from 'lucide-react'

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">
                        Chào mừng trở lại, {user?.username}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tổng danh mục
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">24</div>
                            <p className="text-xs text-muted-foreground">
                                +2 từ tháng trước
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Hoạt động hôm nay
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">156</div>
                            <p className="text-xs text-muted-foreground">
                                +12% từ hôm qua
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tỷ lệ thành công
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">98.5%</div>
                            <p className="text-xs text-muted-foreground">
                                +0.3% từ tháng trước
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Thời gian phản hồi
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">1.2s</div>
                            <p className="text-xs text-muted-foreground">
                                -0.1s từ tuần trước
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* HIS Integration */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HisStatus />
                    <HisApiCaller />
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hoạt động gần đây</CardTitle>
                            <CardDescription>
                                Các hoạt động mới nhất trong hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-medical-100 rounded-full">
                                        <Shield className="h-4 w-4 text-medical-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Đăng nhập thành công</p>
                                        <p className="text-xs text-muted-foreground">2 phút trước</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-green-100 rounded-full">
                                        <Users className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Tạo danh mục mới</p>
                                        <p className="text-xs text-muted-foreground">15 phút trước</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        <Activity className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Cập nhật cấu hình</p>
                                        <p className="text-xs text-muted-foreground">1 giờ trước</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin hệ thống</CardTitle>
                            <CardDescription>
                                Trạng thái và thông tin hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Phiên bản</span>
                                    <span className="text-sm text-muted-foreground">v1.0.0</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Trạng thái</span>
                                    <span className="text-sm text-green-600">Hoạt động bình thường</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Cập nhật cuối</span>
                                    <span className="text-sm text-muted-foreground">14/10/2024</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Người dùng hiện tại</span>
                                    <span className="text-sm text-muted-foreground">{user?.username}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
