'use client'

import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'

const SampleCabinetsForm = dynamic(
    () => import('@/components/sample-cabinets/sample-cabinets-form').then((m) => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner size="medium" />
            </div>
        ),
    }
)

export default function SampleCabinetsPage() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <SampleCabinetsForm />
        </DashboardLayout>
    )
}
