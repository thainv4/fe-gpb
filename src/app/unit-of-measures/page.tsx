'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { UnitOfMeasureTable } from '@/components/unit-of-measure-management/unit-of-measure-table'

export default function UnitOfMeasuresPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <UnitOfMeasureTable />
        </DashboardLayout>
    )
}
