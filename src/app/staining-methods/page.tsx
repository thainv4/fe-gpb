'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { StainingMethodTable } from '@/components/staining-method-management/staining-method-table'

export default function StainingMethodsPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <StainingMethodTable />
        </DashboardLayout>
    )
}
