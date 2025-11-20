'use client'

import { useHisIntegration } from '@/hooks/use-his'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Building2, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    RefreshCw,
    LogOut
} from 'lucide-react'

export function HisStatus() {
    const { user } = useAuthStore()
    const { 
        token, 
        tokenStatus, 
        isLoggedIn,
        hisLogin,
        hisLogout,
        isLoggingIn,
        isLoggingOut,
        refetchHisTokenStatus
    } = useHisIntegration()

    if (!user) {
        return null
    }

    const getStatusBadge = () => {
        if (!isLoggedIn) {
            return <Badge variant="secondary">Chưa đăng nhập HIS</Badge>
        }

        if (tokenStatus?.isExpired) {
            return <Badge variant="destructive">Token hết hạn</Badge>
        }

        if (tokenStatus?.isExpiringSoon) {
            return <Badge variant="outline" className="border-orange-500 text-orange-600">
                Sắp hết hạn
            </Badge>
        }

        return <Badge variant="default" className="bg-green-500">Hoạt động</Badge>
    }

    const getStatusIcon = () => {
        if (!isLoggedIn) {
            return <AlertCircle className="h-5 w-5 text-gray-500" />
        }

        if (tokenStatus?.isExpired) {
            return <AlertCircle className="h-5 w-5 text-red-500" />
        }

        if (tokenStatus?.isExpiringSoon) {
            return <Clock className="h-5 w-5 text-orange-500" />
        }

        return <CheckCircle className="h-5 w-5 text-green-500" />
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-medical-500" />
                    <CardTitle className="text-lg">HIS Integration</CardTitle>
                </div>
                {getStatusBadge()}
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoggedIn && token ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {getStatusIcon()}
                            <span className="text-sm font-medium">
                                {token.userName} ({token.userLoginName})
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Email:</span>
                                <p className="font-medium">{token.userEmail}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Mobile:</span>
                                <p className="font-medium">{token.userMobile}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">G Code:</span>
                                <p className="font-medium">{token.userGCode}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">App Code:</span>
                                <p className="font-medium">{token.applicationCode}</p>
                            </div>
                        </div>

                        {tokenStatus && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Token Status:</span>
                                    <span className={`text-sm font-medium ${tokenStatus.isExpired ? 'text-red-600' :
                                            tokenStatus.isExpiringSoon ? 'text-orange-600' :
                                                'text-green-600'
                                        }`}>
                                        {tokenStatus.minutesUntilExpire} phút
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Login: {new Date(tokenStatus.loginTime).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Expire: {new Date(tokenStatus.expireTime).toLocaleString()}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetchHisTokenStatus()}
                                className="flex-1"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => hisLogout(user.username)}
                                disabled={isLoggingOut}
                                className="flex-1"
                            >
                                {isLoggingOut ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <LogOut className="h-4 w-4 mr-2" />
                                )}
                                Logout
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm">Chưa đăng nhập HIS</span>
                        </div>
                        <Button
                            onClick={() => hisLogin()}
                            disabled={isLoggingIn}
                            className="w-full"
                        >
                            {isLoggingIn ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Đang đăng nhập...
                                </>
                            ) : (
                                <>
                                    <Building2 className="h-4 w-4 mr-2" />
                                    Đăng nhập HIS
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-gray-500">
                            Đăng nhập HIS để sử dụng các tính năng tích hợp
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
