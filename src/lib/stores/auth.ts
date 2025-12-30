import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    username: string
    email: string
    fullName: string
    role: string
    isActive: number
}

interface AuthState {
    user: User | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isLoading: boolean
    isInitialized: boolean
    login: (token: string, refreshToken: string, user: User) => void
    logout: () => void
    setLoading: (loading: boolean) => void
    setInitialized: (initialized: boolean) => void
    updateTokens: (token: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,

            login: (token: string, refreshToken: string, user: User) => {
                set({
                    token,
                    refreshToken,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    isInitialized: true,
                })
                // Lưu vào localStorage để đảm bảo persistence
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth-token', token)
                    localStorage.setItem('auth-refresh-token', refreshToken)
                    localStorage.setItem('auth-user', JSON.stringify(user))
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isInitialized: false,
                })
                // Xóa khỏi localStorage và sessionStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-token')
                    localStorage.removeItem('auth-refresh-token')
                    localStorage.removeItem('auth-user')
                    localStorage.removeItem('auth-storage')
                    sessionStorage.clear()
                }
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading })
            },

            setInitialized: (initialized: boolean) => {
                set({ isInitialized: initialized })
            },

            updateTokens: (token: string, refreshToken: string) => {
                set({ token, refreshToken })
                // Cập nhật localStorage
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth-token', token)
                    localStorage.setItem('auth-refresh-token', refreshToken)
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
                isInitialized: state.isInitialized,
            }),
        }
    )
)
