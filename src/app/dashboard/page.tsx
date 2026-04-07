'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHome } from '@/components/dashboard/dashboard-home'

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-green-700">Viện Xét nghiệm Y học</h1>
                    <p className="text-gray-600">Chào mừng trở lại, {user?.fullName}</p>
                </div>

                <DashboardHome />
            </div>
        </DashboardLayout>
    )
}
