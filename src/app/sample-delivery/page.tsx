'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'
import { redirect } from 'next/navigation'

const SampleDeliveryForm = dynamic(
    () => import('@/components/sample-delivery/sample-delivery-form').then((m) => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner size="medium" />
            </div>
        ),
    }
)

export default function SampleDelivery() {
    const { isAuthenticated } = useAuthStore()

    if (!isAuthenticated) {
        redirect('/auth/login')
    }

    return (
        <DashboardLayout>
            <SampleDeliveryForm />
        </DashboardLayout>
    )
}