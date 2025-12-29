'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, User } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Users } from 'lucide-react'
import { UserRoomList } from './user-room-list'

export function UserRoomManagement() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // Fetch danh sách users
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users', { search: searchTerm, limit: 100 }],
        queryFn: () => apiClient.getUsers({ search: searchTerm, limit: 100, offset: 0 }),
    })

    const users = usersData?.data?.users || []

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Danh sách users */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Danh sách người dùng
                    </CardTitle>
                    <CardDescription>Chọn người dùng để quản lý phòng</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm người dùng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {(() => {
                            if (isLoadingUsers) {
                                return (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Đang tải...
                                    </p>
                                )
                            }
                            
                            if (users.length === 0) {
                                return (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Không tìm thấy người dùng
                                    </p>
                                )
                            }
                            
                            return users.map((user) => {
                                const isSelected = selectedUser?.id === user.id
                                const buttonClassName = isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                
                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setSelectedUser(user)}
                                        className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-colors ${buttonClassName}`}
                                    >
                                        <div className="font-medium text-sm">{user.fullName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            @{user.username}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </button>
                                )
                            })
                        })()}
                    </div>
                </CardContent>
            </Card>

            {/* Quản lý phòng cho user */}
            <div className="md:col-span-2">
                {selectedUser ? (
                    <UserRoomList user={selectedUser} />
                ) : (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Chọn một người dùng để quản lý phòng</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

