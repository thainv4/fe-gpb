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
                    <h1 className="text-3xl font-bold text-green-700">Viện xét nghiệm Y học</h1>
                    <p className="text-gray-600">
                        Chào mừng trở lại, {user?.fullName}
                    </p>
                </div>

                {/* HIS Integration */}
                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HisStatus />
                    <HisApiCaller />
                </div> */}

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                

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
