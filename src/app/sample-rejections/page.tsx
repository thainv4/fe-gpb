'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { SampleRejectionTable } from '@/components/sample-rejection/sample-rejection-table'

export default function SampleRejectionsPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <SampleRejectionTable />
        </DashboardLayout>
    )
}
