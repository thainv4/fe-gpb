'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isLoading, isInitialized } = useAuthStore()
    const router = useRouter()
    const pathname = usePathname()

    // Danh sách các route không cần authentication
    const publicRoutes = ['/auth/login', '/auth/register', '/']
    const isPublicRoute = publicRoutes.includes(pathname)

    useEffect(() => {
        // Chờ cho đến khi auth được khởi tạo
        if (!isInitialized || isLoading) {
            return
        }

        // Nếu là public route, cho phép truy cập
        if (isPublicRoute) {
            return
        }

        // Nếu không đăng nhập và không phải public route, redirect đến login
        if (!isAuthenticated) {
            router.push('/auth/login')
        }
    }, [isInitialized, isLoading, isAuthenticated, isPublicRoute, pathname, router])

    // Hiển thị loading khi đang kiểm tra hoặc chưa khởi tạo
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang kiểm tra xác thực...</p>
                </div>
            </div>
        )
    }

    // Nếu là public route và đã đăng nhập, redirect đến dashboard
    if (isPublicRoute && isAuthenticated && pathname === '/') {
        router.push('/dashboard')
        return null
    }

    // Nếu không phải public route và chưa đăng nhập, hiển thị loading
    if (!isPublicRoute && !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang chuyển hướng...</p>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
