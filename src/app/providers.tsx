'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AuthGuard } from '@/components/auth/auth-guard'
import { RoleGuard } from '@/components/auth/role-guard'
import { DepartmentTypeGuard } from '@/components/auth/department-type-guard'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                retry: 1,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AuthGuard>
                    <RoleGuard>
                        <DepartmentTypeGuard>
                            {children}
                        </DepartmentTypeGuard>
                    </RoleGuard>
                </AuthGuard>
            </AuthProvider>
        </QueryClientProvider>
    )
}
