'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SampleTypeTable } from '@/components/sample-type-management/sample-type-table'

export default function SampleTypesPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <SampleTypeTable />
        </DashboardLayout>
    )
}
