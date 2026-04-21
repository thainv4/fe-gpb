'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingSpinner } from '@/components/ui/loading'

const ReportStatisticsForm = dynamic(
    () => import('@/components/report-statistics/report-statistics-form').then((m) => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner size="medium" />
            </div>
        ),
    }
)

export default function ReportsPage() {
    return (
        <DashboardLayout>
            <ReportStatisticsForm />
        </DashboardLayout>
    )
}
