'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles?: string[]
}

// Routes chỉ admin mới truy cập được
const adminOnlyRoutes = [
    '/departments',
    '/rooms',
    '/sample-types',
    '/result-templates',
    '/users',
    '/user-rooms',
    '/settings'
]

// Routes user có thể truy cập
const userAllowedRoutes = [
    '/dashboard',
    '/test-indications',
    '/sample-delivery',
    '/test-results',
    '/change-password'
]

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!user) return

        const userRole = user.role?.toLowerCase()
        const isAdmin = userRole === 'admin'
        const isUser = userRole === 'user'

        // Kiểm tra nếu route yêu cầu admin
        const requiresAdmin = adminOnlyRoutes.some(route => pathname?.startsWith(route))
        
        if (requiresAdmin && !isAdmin) {
            // User cố truy cập route admin, redirect về dashboard
            router.push('/dashboard')
            return
        }

        // Kiểm tra nếu route được phép cho user
        if (isUser) {
            const isAllowed = userAllowedRoutes.some(route => pathname?.startsWith(route)) || pathname === '/dashboard'
            if (!isAllowed) {
                router.push('/dashboard')
                return
            }
        }
    }, [user, pathname, router])

    return <>{children}</>
}

