'use client';
import {useEffect, useMemo, useState} from 'react'
import {useQuery, useQueryClient} from '@tanstack/react-query'
import {apiClient, type UserRoom} from '@/lib/api/client'
import {useCurrentRoomStore} from '@/lib/stores/current-room'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Table, TableBody, TableHead, TableHeader, TableRow, TableCell} from '@/components/ui/table'

interface RoomPickerDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function RoomPickerDialog({open: openProp, onOpenChange}: RoomPickerDialogProps) {
    const {currentRoomId, setRoom} = useCurrentRoomStore()
    const queryClient = useQueryClient()
    const isControlled = typeof openProp === 'boolean'
    const [internalOpen, setInternalOpen] = useState(false)
    const open = isControlled ? (openProp as boolean) : internalOpen
    const [selectedId, setSelectedId] = useState<string>('')

    const {data, isLoading} = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyRooms(),
        staleTime: 5 * 60 * 1000,
    })

    const rooms: UserRoom[] = useMemo(() => {
        const raw = (data?.data as unknown) ?? []
        return Array.isArray(raw) ? (raw as UserRoom[]) : []
    }, [data])

    useEffect(() => {
        // Auto open only when uncontrolled
        if (!isControlled && !currentRoomId) setInternalOpen(true)
    }, [currentRoomId, isControlled])

    useEffect(() => {
        // Preselect nếu chỉ có 1 room
        if (!selectedId && rooms.length === 1) {
            setSelectedId(rooms[0].roomId)
        }
    }, [rooms, selectedId])

    const handleConfirm = () => {
        const r = rooms.find(r => r.roomId === selectedId)
        if (!r) return
        
        // Lưu roomId cũ để so sánh
        const oldRoomId = currentRoomId
        
        setRoom({
            roomId: r.roomId,
            departmentId: r.departmentId,
            roomName: r.roomName,
            roomCode: r.roomCode,
            departmentCode: r.departmentCode,
            departmentName: r.departmentName,
        })
        
        // Nếu đổi phòng (roomId khác), invalidate tất cả queries để làm mới các tab đang mở
        if (oldRoomId && oldRoomId !== r.roomId) {
            queryClient.invalidateQueries()
        }
        
        if (isControlled) {
            onOpenChange?.(false)
        } else {
            setInternalOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => (isControlled ? onOpenChange?.(val) : setInternalOpen(val))}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chọn phòng làm việc</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="text-sm text-muted-foreground">Đang tải danh sách phòng...</div>
                ) : rooms.length === 0 ? (
                    <div className="text-sm text-red-600">Tài khoản chưa được gán phòng.</div>
                ) : (
                    <div className="space-y-3">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã phòng</TableHead>
                                        <TableHead>Tên phòng</TableHead>
                                        <TableHead>Khoa</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(Array.isArray(rooms) ? rooms : []).map((r) => {
                                        const isSelected = selectedId === r.roomId
                                        return (
                                            <TableRow
                                                key={r.roomId}
                                                className={isSelected ? 'bg-zinc-300' : ''}
                                                onClick={() => setSelectedId(r.roomId)}
                                                onDoubleClick={handleConfirm}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault()
                                                        setSelectedId(r.roomId)
                                                    }
                                                }}
                                            >
                                                <TableCell className="font-medium">{r.roomCode}</TableCell>
                                                <TableCell>{r.roomName}</TableCell>
                                                <TableCell>{r.departmentName}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button onClick={handleConfirm} disabled={!selectedId}>Xác nhận</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}