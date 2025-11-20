'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'

interface AuthProviderProps {
    children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { isInitialized, setLoading, setInitialized } = useAuthStore()

    useEffect(() => {
        // Kiểm tra trạng thái đăng nhập khi app khởi động
        const checkAuthStatus = async () => {
            if (isInitialized) return // Đã khởi tạo rồi

            setLoading(true)

            try {
                // Kiểm tra token trong localStorage
                const storedToken = localStorage.getItem('auth-token')
                const storedUser = localStorage.getItem('auth-user')

                if (storedToken && storedUser) {
                    // Token tồn tại, khôi phục trạng thái
                    const { apiClient } = await import('@/lib/api/client')
                    apiClient.setToken(storedToken)

                    // Khôi phục trạng thái đăng nhập
                    const userData = JSON.parse(storedUser)
                    const refreshToken = localStorage.getItem('auth-refresh-token') || ''

                    useAuthStore.getState().login(storedToken, refreshToken, userData)
                } else {
                    // Không có token, đảm bảo logout
                    useAuthStore.getState().logout()
                }
            } catch (error) {
                console.error('Auth check failed:', error)
                // Nếu có lỗi, logout để đảm bảo an toàn
                useAuthStore.getState().logout()
            } finally {
                setLoading(false)
                setInitialized(true)
            }
        }

        // Chỉ chạy một lần khi component mount
        checkAuthStatus()
    }, [isInitialized, setLoading, setInitialized])

    return <>{children}</>
}
