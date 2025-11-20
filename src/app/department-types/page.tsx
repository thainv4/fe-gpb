'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DepartmentTypeTable } from '@/components/department-type-management/department-type-table'

export default function DepartmentTypesPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <DepartmentTypeTable />
        </DashboardLayout>
    )
}
