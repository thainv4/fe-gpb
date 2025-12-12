'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, User, UserRoom, Room, Department } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Building2, MapPin } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface UserRoomListProps {
    user: User
}

export function UserRoomList({ user }: UserRoomListProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('')
    const [searchDepartment, setSearchDepartment] = useState('')
    const [searchRoom, setSearchRoom] = useState('')
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Fetch danh sách phòng của user
    const { data: userRoomsData, isLoading: isLoadingUserRooms } = useQuery({
        queryKey: ['user-rooms', user.id],
        queryFn: () => apiClient.getUserRoomsByUserId(user.id),
        enabled: !!user.id,
    })

    const userRooms = userRoomsData?.data || []

    // Fetch danh sách departments
    const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
        queryKey: ['departments', { search: searchDepartment }],
        queryFn: () => apiClient.getDepartments({ search: searchDepartment, limit: 100 }),
        enabled: isDialogOpen,
    })

    const departments = departmentsData?.data?.departments || []

    // Fetch phòng theo department được chọn
    const { data: roomsResponse, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['rooms-by-department', selectedDepartmentId, { search: searchRoom }],
        queryFn: () => apiClient.getRoomsByDepartment(selectedDepartmentId, {
            limit: 100,
            offset: 0,
            isActive: true
        }),
        enabled: isDialogOpen && !!selectedDepartmentId,
    })

    const allRooms = roomsResponse?.data?.rooms || []
    const assignedRoomIds = userRooms.map((ur: UserRoom) => ur.roomId)

    // Filter rooms by search term and exclude already assigned rooms
    const availableRooms = allRooms.filter((room: Room) => {
        const matchesSearch = !searchRoom ||
            room.roomCode.toLowerCase().includes(searchRoom.toLowerCase()) ||
            room.roomName.toLowerCase().includes(searchRoom.toLowerCase()) ||
            room.roomAddress?.toLowerCase().includes(searchRoom.toLowerCase())
        const notAssigned = !assignedRoomIds.includes(room.id)
        return matchesSearch && notAssigned
    })

    // Mutation gán phòng
    const assignMutation = useMutation({
        mutationFn: (roomIds: string[]) =>
            apiClient.assignRoomsToUser(user.id, { roomIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-rooms', user.id] })
            toast({
                title: 'Thành công',
                description: 'Đã gán phòng cho người dùng',
            })
            setIsDialogOpen(false)
            setSelectedRoomIds([])
            setSelectedDepartmentId('')
            setSearchDepartment('')
            setSearchRoom('')
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể gán phòng',
                variant: 'destructive',
            })
        },
    })

    // Mutation gỡ phòng
    const removeMutation = useMutation({
        mutationFn: (roomId: string) =>
            apiClient.removeRoomFromUser(user.id, roomId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-rooms', user.id] })
            toast({
                title: 'Thành công',
                description: 'Đã gỡ phòng khỏi người dùng',
            })
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể gỡ phòng',
                variant: 'destructive',
            })
        },
    })

    const handleAssignRooms = () => {
        if (selectedRoomIds.length === 0) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn ít nhất một phòng',
                variant: 'destructive',
            })
            return
        }
        assignMutation.mutate(selectedRoomIds)
    }

    const handleRemoveRoom = (roomId: string) => {
        if (confirm('Bạn có chắc chắn muốn gỡ phòng này?')) {
            removeMutation.mutate(roomId)
        }
    }

    const toggleRoomSelection = (roomId: string) => {
        setSelectedRoomIds((prev) =>
            prev.includes(roomId)
                ? prev.filter((id) => id !== roomId)
                : [...prev, roomId]
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Phòng được phân quyền</CardTitle>
                        <CardDescription>
                            Quản lý phòng cho {user.fullName}
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="medical-gradient">
                                <Plus className="h-4 w-4 mr-2" />
                                Gán phòng
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Gán phòng cho {user.fullName}</DialogTitle>
                                <DialogDescription>
                                    Chọn khoa trước, sau đó chọn phòng bạn muốn gán cho người dùng này
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Bước 1: Chọn Department */}
                                <div>
                                    <Label className="text-base font-semibold">
                                        Bước 1: Chọn Khoa
                                    </Label>
                                    <Input
                                        placeholder="Tìm kiếm khoa..."
                                        value={searchDepartment}
                                        onChange={(e) => setSearchDepartment(e.target.value)}
                                        className="mt-2"
                                    />
                                </div>

                                <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                                    {isLoadingDepartments ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Đang tải khoa...
                                        </p>
                                    ) : departments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            Không tìm thấy khoa nào
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {departments.map((dept: Department) => (
                                                <div
                                                    key={dept.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        setSelectedDepartmentId(dept.id)
                                                        setSearchRoom('')
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            setSelectedDepartmentId(dept.id)
                                                            setSearchRoom('')
                                                        }
                                                    }}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                                        selectedDepartmentId === dept.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="font-medium text-sm">
                                                        {dept.departmentCode} - {dept.departmentName}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bước 2: Chọn Rooms (chỉ hiển thị khi đã chọn department) */}
                                {selectedDepartmentId && (
                                    <>
                                        <div>
                                            <Label className="text-base font-semibold">
                                                Bước 2: Chọn Phòng
                                            </Label>
                                            <Input
                                                placeholder="Tìm kiếm phòng..."
                                                value={searchRoom}
                                                onChange={(e) => setSearchRoom(e.target.value)}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                            {isLoadingRooms ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Đang tải phòng...
                                                </p>
                                            ) : availableRooms.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Không còn phòng nào để gán trong khoa này
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {availableRooms.map((room: Room) => (
                                                        <div
                                                            key={room.id}
                                                            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50"
                                                        >
                                                            <Checkbox
                                                                id={`room-${room.id}`}
                                                                checked={selectedRoomIds.includes(room.id)}
                                                                onCheckedChange={() =>
                                                                    toggleRoomSelection(room.id)
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={`room-${room.id}`}
                                                                className="flex-1 cursor-pointer"
                                                            >
                                                                <div className="font-medium">
                                                                    {room.roomCode} - {room.roomName}
                                                                </div>
                                                                {room.roomAddress && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {room.roomAddress}
                                                                    </div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">
                                        Đã chọn: {selectedRoomIds.length} phòng
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsDialogOpen(false)
                                                setSelectedDepartmentId('')
                                                setSelectedRoomIds([])
                                                setSearchDepartment('')
                                                setSearchRoom('')
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            onClick={handleAssignRooms}
                                            disabled={
                                                assignMutation.isPending ||
                                                selectedRoomIds.length === 0
                                            }
                                        >
                                            Gán phòng
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingUserRooms ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Đang tải...
                    </p>
                ) : userRooms.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Người dùng chưa được gán phòng nào</p>
                        <p className="text-sm">Nhấn &quot;Gán phòng&quot; để thêm</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userRooms.map((userRoom: UserRoom) => (
                            <div
                                key={userRoom.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">
                                            {userRoom.roomCode} - {userRoom.roomName}
                                        </h4>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Building2 className="h-3 w-3" />
                                            {userRoom.departmentName}
                                        </div>
                                        {userRoom.roomAddress && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {userRoom.roomAddress}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveRoom(userRoom.roomId)}
                                        disabled={removeMutation.isPending}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                    <span className="text-xs text-muted-foreground">
                                        {userRoom.branchName}
                                    </span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            userRoom.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {userRoom.isActive ? 'Hoạt động' : 'Không hoạt động'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

