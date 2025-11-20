'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useHisStore } from '@/lib/stores/his'
import { useAuthStore } from '@/lib/stores/auth'
import { apiClient, HisApiCallRequest } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function useHisIntegration() {
    const { toast } = useToast()
    const { user } = useAuthStore()
    const router = useRouter()
    const {
        token,
        tokenStatus,
        isLoggedIn,
        setToken,
        setLoggedIn,
        clearHisData
    } = useHisStore()

    // HIS Login
    const hisLoginMutation = useMutation({
        mutationFn: () => apiClient.hisLogin(),
        onSuccess: (response) => {
            if (response.success && response.data) {
                setToken(response.data)
                setLoggedIn(true)
                toast({
                    title: 'Đăng nhập HIS thành công',
                    description: `Chào mừng ${response.data.userName}!`,
                })
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi đăng nhập HIS',
                description: error.message || 'Không thể đăng nhập HIS',
                variant: 'destructive',
            })
        },
    })

    // HIS Login with Credentials
    const hisLoginWithCredentialsMutation = useMutation({
        mutationFn: (credentials: { username: string; password: string }) =>
            apiClient.hisLoginWithCredentials(credentials),
        onSuccess: (response) => {
            console.log('HIS Login Success Response:', response)
            if (response.success && response.data) {
                // Store the HIS token from the direct login response
                setToken(response.data.hisToken)
                setLoggedIn(true)

                // Also store in auth store for dual auth support
                const { login } = useAuthStore.getState()
                login(
                    response.data.accessToken, // Use HIS accessToken as JWT
                    response.data.accessToken, // Use same token as refresh token
                    {
                        id: response.data.hisToken.userGCode,
                        username: response.data.hisToken.userLoginName,
                        email: response.data.hisToken.userEmail,
                        fullName: response.data.hisToken.userName,
                        role: 'his_user',
                        isActive: 1,
                        lastLoginAt: new Date().toISOString()
                    }
                )

                toast({
                    title: 'Đăng nhập HIS thành công',
                    description: `Chào mừng ${response.data.hisToken.userName}!`,
                })
                // Redirect to dashboard after successful login
                console.log('Redirecting to dashboard...')
                console.log('Router object:', router)

                // Add small delay to ensure state is updated
                setTimeout(() => {
                    try {
                        router.push('/dashboard')
                        console.log('Router.push called successfully')
                    } catch (error) {
                        console.error('Router.push error:', error)
                    }
                }, 100)
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi đăng nhập HIS',
                description: error.message || 'Không thể đăng nhập HIS',
                variant: 'destructive',
            })
        },
    })

    // HIS Logout
    const hisLogoutMutation = useMutation({
        mutationFn: (username: string) => apiClient.hisLogout(username),
        onSuccess: () => {
            clearHisData()
            toast({
                title: 'Đăng xuất HIS thành công',
                description: 'Đã đăng xuất khỏi hệ thống HIS',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi đăng xuất HIS',
                description: error.message || 'Không thể đăng xuất HIS',
                variant: 'destructive',
            })
        },
    })

    // Get HIS Token
    const { refetch: refetchHisToken } = useQuery({
        queryKey: ['his-token', user?.username],
        queryFn: () => apiClient.getHisToken(user?.username),
        enabled: !!user && isLoggedIn,
        select: (response) => response.success ? response.data : null,
    })

    // Get HIS User Info
    const { data: hisUserInfoData, refetch: refetchHisUserInfo } = useQuery({
        queryKey: ['his-user-info', user?.username],
        queryFn: () => apiClient.getHisUserInfo(user?.username || ''),
        enabled: !!user && isLoggedIn,
        select: (response) => response.success ? response.data : null,
    })

    // Get HIS Token Status
    const { data: hisTokenStatusData, refetch: refetchHisTokenStatus } = useQuery({
        queryKey: ['his-token-status', user?.username],
        queryFn: () => apiClient.getHisTokenStatus(user?.username),
        enabled: !!user && isLoggedIn,
        select: (response) => response.success ? response.data : null,
        refetchInterval: 60000, // Refetch every minute
    })

    // Renew HIS Token
    const renewHisTokenMutation = useMutation({
        mutationFn: (renewCode: string) => apiClient.hisRenewToken(renewCode),
        onSuccess: (response) => {
            if (response.success && response.data) {
                setToken(response.data)
                toast({
                    title: 'Gia hạn HIS token thành công',
                    description: 'Token HIS đã được gia hạn',
                })
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi gia hạn HIS token',
                description: error.message || 'Không thể gia hạn HIS token',
                variant: 'destructive',
            })
        },
    })

    // Call HIS API
    const callHisApiMutation = useMutation({
        mutationFn: (request: HisApiCallRequest) => apiClient.callHisApi(request),
        onSuccess: (response) => {
            if (response.success) {
                toast({
                    title: 'Gọi HIS API thành công',
                    description: 'Dữ liệu đã được lấy từ HIS',
                })
            }
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi gọi HIS API',
                description: error.message || 'Không thể gọi HIS API',
                variant: 'destructive',
            })
        },
    })

    // Auto-renew token if expiring soon
    const checkTokenExpiry = () => {
        if (tokenStatus?.isExpiringSoon && token?.renewCode) {
            renewHisTokenMutation.mutate(token.renewCode)
        }
    }

    return {
        // State
        token,
        userInfo: hisUserInfoData,
        tokenStatus: hisTokenStatusData,
        isLoggedIn,

        // Mutations
        hisLogin: hisLoginMutation.mutate,
        hisLoginWithCredentials: (credentials: { username: string; password: string }) =>
            hisLoginWithCredentialsMutation.mutate(credentials),
        hisLogout: (username: string) => hisLogoutMutation.mutate(username),
        renewHisToken: (renewCode: string) => renewHisTokenMutation.mutate(renewCode),
        callHisApi: (request: HisApiCallRequest) => callHisApiMutation.mutate(request),

        // Loading states
        isLoggingIn: hisLoginMutation.isPending,
        isLoggingInWithCredentials: hisLoginWithCredentialsMutation.isPending,
        isLoggingOut: hisLogoutMutation.isPending,
        isRenewing: renewHisTokenMutation.isPending,
        isCallingApi: callHisApiMutation.isPending,

        // Refetch functions
        refetchHisToken,
        refetchHisUserInfo,
        refetchHisTokenStatus,

        // Utility functions
        checkTokenExpiry,
        clearHisData,
    }
}
