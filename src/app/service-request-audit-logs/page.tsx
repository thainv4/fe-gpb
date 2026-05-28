'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoadingSpinner } from '@/components/ui/loading'
import { ServiceRequestsSidebar } from '@/components/service-requests-sidebar'

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
    const [selectedCode, setSelectedCode] = useState('')

    return (
        <DashboardLayout>
            <div className="p-2">
                <div
                    className="flex h-screen overflow-y-auto border border-gray-200 rounded-md bg-white"
                    style={{ maxHeight: 'calc(100vh - 100px)' }}
                >
                    <div className="w-1/4 border-r border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
                        <ServiceRequestsSidebar
                            mode="audit"
                            selectedCode={selectedCode}
                            onSelect={(serviceReqCode) => {
                                setSelectedCode(serviceReqCode || '')
                            }}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 pt-2 bg-white">
                        <AuditLogTable
                            selectedCode={selectedCode}
                            onSelectedCodeChange={setSelectedCode}
                            useSidebarMode
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
