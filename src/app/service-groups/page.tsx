'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ServiceGroupTable } from '@/components/service-group-management/service-group-table'

export default function ServiceGroupsPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <ServiceGroupTable />
        </DashboardLayout>
    )
}
