'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient, User } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { UserRoomList } from './user-room-list'

const PAGE_SIZE = 20

export function UserRoomManagement() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
    const [page, setPage] = useState(0)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // Fetch danh sách departments cho dropdown
    const { data: departmentsData } = useQuery({
        queryKey: ['departments', { limit: 200, offset: 0 }],
        queryFn: () => apiClient.getDepartments({ limit: 200, offset: 0 }),
        staleTime: 5 * 60 * 1000,
    })
    const departments = departmentsData?.data?.departments || []

    // Fetch danh sách users với limit, offset, departmentId
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users', { search: searchTerm, departmentId: selectedDepartmentId || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE }],
        queryFn: () => apiClient.getUsers({
            search: searchTerm || undefined,
            departmentId: selectedDepartmentId || undefined,
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
        }),
    })

    const users = usersData?.data?.users || []
    const total = usersData?.data?.total ?? 0
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

    const goPrev = () => setPage((p) => Math.max(0, p - 1))
    const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1))

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
                    <div className="mb-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm kiếm người dùng..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(0)
                                }}
                                className="pl-8"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Khoa</label>
                            <Select
                                value={selectedDepartmentId || 'all'}
                                onValueChange={(v) => {
                                    setSelectedDepartmentId(v === 'all' ? '' : v)
                                    setPage(0)
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả khoa" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả khoa</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            {d.departmentName || d.departmentCode || d.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[480px] overflow-y-auto">
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

                    {total > 0 && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground">
                                {total} người dùng
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={goPrev}
                                    disabled={page === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground min-w-[80px] text-center">
                                    Trang {page + 1} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={goNext}
                                    disabled={page >= totalPages - 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
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

