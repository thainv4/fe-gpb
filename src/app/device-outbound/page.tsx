'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'

const DeviceOutboundTable = dynamic(
    () => import('@/components/device-outbound/device-outbound-table').then((m) => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner size="medium" />
            </div>
        ),
    }
)

export default function DeviceOutboundPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <DeviceOutboundTable />
        </DashboardLayout>
    )
}
