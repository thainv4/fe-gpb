'use client'

import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingSpinner } from '@/components/ui/loading'

const AuditLogTable = dynamic(
    () =>
        import('@/components/service-request-audit-log/audit-log-table').then((m) => m.default),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner size="medium" />
            </div>
        ),
    },
)

export default function ServiceRequestAuditLogsPage() {
    return (
        <DashboardLayout>
            <AuditLogTable />
        </DashboardLayout>
    )
}
