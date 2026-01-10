import { ServiceRequestsSidebar } from "@/components/service-requests-sidebar/service-requests-sidebar";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTabsStore } from "@/lib/stores/tabs";
import { useTabPersistence } from "@/hooks/use-tab-persistence";
import { useCurrentRoomStore } from "@/lib/stores/current-room";
import { Package, Printer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from 'qrcode.react';

dayjs.extend(utc)
dayjs.extend(timezone)

// Function to get current time in Vietnam timezone for datetime-local input
const getVietnamTime = () => {
    return dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm')
}

export default function SampleDeliveryTable() {
    const [selectedServiceReqCode, setSelectedServiceReqCode] = useState<string>('')
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Lấy thông tin phòng hiện tại từ store (phòng đã chọn ở sidebar)
    const { currentRoomId, currentDepartmentId } = useCurrentRoomStore()

    // Get current user info
    const { data: profileData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => apiClient.getProfile(),
        staleTime: 5 * 60 * 1000,
    })
    const currentUserId = profileData?.data?.id
    const currentUserName = profileData?.data?.username || profileData?.data?.email || ''

    // Query user's assigned rooms
    const { data: userRoomsData, isLoading: isLoadingUserRooms } = useQuery({
        queryKey: ['user-rooms', currentUserId],
        queryFn: () => apiClient.getUserRoomsByUserId(currentUserId!),
        enabled: !!currentUserId,
    })

    // State để control việc mở Select "Đơn vị thực hiện"
    const [executeRoomSelectOpen, setExecuteRoomSelectOpen] = useState(false)

    // Query rooms từ API /api/v1/rooms khi mở Select "Đơn vị thực hiện"
    const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['rooms', { isActive: true, limit: 100 }],
        queryFn: () => apiClient.getRooms({
            isActive: true,
            limit: 100,
            offset: 0,
        }),
        enabled: executeRoomSelectOpen, // Chỉ gọi API khi mở Select
        staleTime: 5 * 60 * 1000,
    })

    // Map rooms từ API response thành format availableRooms
    const availableRoomsFromAPI = useMemo(() => {
        if (!roomsData?.data?.rooms) return []
        
        return roomsData.data.rooms.map((room: any) => ({
            key: room.id,
            roomId: room.id,
            departmentId: room.departmentId,
            roomName: room.roomName,
            departmentName: room.department?.departmentName || '',
            roomCode: room.roomCode,
            departmentCode: room.department?.departmentCode || '',
        }))
    }, [roomsData])

    // Kết hợp availableRooms từ user-rooms và rooms từ API
    // Ưu tiên rooms từ API nếu có
    const availableRooms = useMemo(() => {
        if (availableRoomsFromAPI.length > 0) {
            return availableRoomsFromAPI
        }
        // Fallback về user rooms nếu API chưa load
        if (!userRoomsData?.data) return []
        return userRoomsData.data
            .filter((ur: any) => ur.isActive === 1 || ur.isActive === true)
            .map((ur: any) => ({
                key: ur.id,
                roomId: ur.roomId,
                departmentId: ur.departmentId,
                roomName: ur.roomName,
                departmentName: ur.departmentName,
                roomCode: ur.roomCode,
                departmentCode: ur.departmentCode,
            }))
    }, [availableRoomsFromAPI, userRoomsData])

    // Query workflow states to get "Bàn giao mẫu" state ID
    const { data: statesData } = useQuery({
        queryKey: ['workflow-states', { limit: 100, offset: 0, isActive: 1, IsSelected: 1, order: 'ASC', orderBy: 'stateOrder' }],
        queryFn: () => apiClient.getWorkflowStates({
            limit: 100,
            offset: 0,
            isActive: 1,
            IsSelected: 1,
            order: 'ASC',
            orderBy: 'stateOrder'
        }),
    })
    const handoverState = statesData?.data?.items?.find(
        (state: { stateCode?: string }) => state.stateCode === 'SAMPLE_HANDOVER'
    )
    const handoverStateId = handoverState?.id

    // State for receiver info
    const [receiveDateTime, setReceiveDateTime] = useState<string>(
        getVietnamTime()
    )
    const [selectedStateId, setSelectedStateId] = useState<string>('')

    // 👉 storedServiceReqId bây giờ sẽ đến từ sidebar (API by-room-and-state)
    const [storedServiceReqId, setStoredServiceReqId] = useState<string | undefined>(undefined)
    // Thêm state cho ghi chú bàn giao
    const [handoverNote, setHandoverNote] = useState<string>('')
    // Thêm state cho receptionCode
    const [receptionCode, setReceptionCode] = useState<string>('')
    // State cho flag (ST, PT, HC)
    const [selectedFlag, setSelectedFlag] = useState<string>('')

    // Tab persistence
    const pathname = usePathname()
    const { activeKey } = useTabsStore()
    const tabKey = activeKey ?? pathname ?? 'default'
    const { scrollContainerRef } = useTabPersistence(
        {
            selectedServiceReqCode,
            storedServiceReqId,
            receiveDateTime,
            selectedStateId,
            handoverNote,
            receptionCode,
            selectedFlag,
        },
        {
            saveScroll: true,
            debounceMs: 500,
            onRestore: (data) => {
                if (data.selectedServiceReqCode) setSelectedServiceReqCode(data.selectedServiceReqCode)
                if (data.storedServiceReqId) setStoredServiceReqId(data.storedServiceReqId)
                if (data.receiveDateTime) setReceiveDateTime(data.receiveDateTime)
                if (data.selectedStateId) setSelectedStateId(data.selectedStateId)
                if (data.handoverNote !== undefined) setHandoverNote(data.handoverNote)
                if (data.receptionCode) setReceptionCode(data.receptionCode)
                if (data.selectedFlag) setSelectedFlag(data.selectedFlag)
            },
        }
    )

    // Fetch storedServiceRequest để lấy receptionCode
    const { data: storedServiceRequestData } = useQuery({
        queryKey: ['stored-service-request', storedServiceReqId],
        queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId!),
        enabled: !!storedServiceReqId,
        staleTime: 5 * 60 * 1000,
    })

    // Lấy receptionCode từ storedServiceRequest
    const receptionCodeFromStored = useMemo(() => {
        if (!storedServiceRequestData?.data?.services || storedServiceRequestData.data.services.length === 0) {
            return receptionCode // Fallback về receptionCode từ sidebar nếu không có
        }
        // Lấy receptionCode từ service đầu tiên (hoặc có thể lấy từ tất cả services)
        return storedServiceRequestData.data.services[0]?.receptionCode || receptionCode
    }, [storedServiceRequestData, receptionCode])

    // Ref cho phần barcode để in
    const barcodeRef = useRef<HTMLDivElement>(null)

    // Function để in QR code - chỉ in QR code và ngày giờ
    const handlePrintBarcode = () => {
        if (!barcodeRef.current || !receptionCodeFromStored) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const qrCodeHtml = barcodeRef.current.innerHTML

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>In mã QR - ${receptionCodeFromStored}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    @page {
                        size: auto;
                        margin: 5mm;
                    }
                    @media print {
                        html, body {
                            width: 100%;
                            height: 100%;
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                        }
                        .print-container {
                            page-break-after: avoid;
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body class="min-h-screen flex items-center justify-center bg-white p-4">
                <div class="print-container text-center">
                    <div class="flex flex-col justify-center items-center mb-2">
                        ${qrCodeHtml}
                    </div>
                    <div class="text-sm text-gray-700">
                        <p>Ngày in: ${new Date().toLocaleString('vi-VN')}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                        window.onafterprint = function() {
                            window.close();
                        }
                    }
                </script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    // Lưu lựa chọn phòng nhận mẫu
    const [selectedReceiverRoomKey, setSelectedReceiverRoomKey] = useState<string | undefined>(undefined)

    const selectedReceiverRoom = useMemo(() => {
        return availableRooms.find(r => r.key === selectedReceiverRoomKey) ?? availableRooms[0]
    }, [availableRooms, selectedReceiverRoomKey])

    const receiverRoomId = selectedReceiverRoom?.roomId
    const receiverDepartmentId = selectedReceiverRoom?.departmentId
    const receiverRoomName = selectedReceiverRoom?.roomName
    const receiverDepartmentName = selectedReceiverRoom?.departmentName

    // Auto-select handover state when loaded
    useEffect(() => {
        if (handoverStateId && !selectedStateId) {
            setSelectedStateId(handoverStateId)
        }
    }, [handoverStateId, selectedStateId])

    // Auto-select phòng hiện tại khi availableRooms đã load và có currentRoomId
    useEffect(() => {
        if (currentRoomId && availableRooms.length > 0 && !selectedReceiverRoomKey) {
            // Tìm phòng trong availableRooms có roomId khớp với currentRoomId
            const matchingRoom = availableRooms.find(r => r.roomId === currentRoomId)
            if (matchingRoom) {
                setSelectedReceiverRoomKey(matchingRoom.key)
            }
        }
    }, [currentRoomId, availableRooms, selectedReceiverRoomKey])

    // Mutation for workflow transition
    const transitionMutation = useMutation({
        mutationFn: async (params: {
            storedServiceReqId: string;
            toStateId: string;
            currentUserId: string;
            currentDepartmentId: string;
            currentRoomId: string;
            selectedFlag: string;
        }) => {
            const response = await apiClient.transitionWorkflow({
                storedServiceReqId: params.storedServiceReqId,
                toStateId: params.toStateId,
                actionType: 'COMPLETE',
                currentUserId: params.currentUserId,
                currentDepartmentId: params.currentDepartmentId,
                currentRoomId: params.currentRoomId,
                notes: handoverNote || undefined,
            })
            // Nếu API trả về success: false, throw error để trigger onError
            if (!response.success) {
                throw new Error(response.error || response.message || 'Không thể xác nhận bàn giao mẫu')
            }
            return response
        },
        onSuccess: async (_data, variables) => {
            // Gọi API flag với storedServiceReqId từ mutation variables
            if (variables.storedServiceReqId && variables.selectedFlag) {
                try {
                    const flagResponse = await apiClient.updateStoredServiceRequestFlag(
                        variables.storedServiceReqId,
                        variables.selectedFlag
                    )
                    if (!flagResponse.success) {
                        toast({
                            title: 'Cảnh báo',
                            description: flagResponse.message || 'Đã xác nhận bàn giao nhưng không thể cập nhật flag',
                            variant: 'default',
                        })
                    }
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
                    toast({
                        title: 'Cảnh báo',
                        description: `Đã xác nhận bàn giao nhưng không thể cập nhật flag: ${errorMessage}`,
                        variant: 'default',
                    })
                }
            }

            toast({
                title: 'Thành công',
                description: 'Đã xác nhận bàn giao mẫu',
            })
            // Không reset ghi chú để người dùng có thể tiếp tục
            queryClient.invalidateQueries({ queryKey: ['workflow-history'] })
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
            toast({
                title: 'Lỗi',
                description: `Không thể xác nhận bàn giao: ${errorMessage}`,
                variant: 'destructive',
            })
        },
    })

    const handleConfirmHandover = () => {
        if (!storedServiceReqId) {
            toast({
                title: 'Lỗi',
                description: 'Không tìm thấy thông tin yêu cầu xét nghiệm',
                variant: 'destructive',
            })
            return
        }
        if (!selectedStateId) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn trạng thái chuyển tiếp',
                variant: 'destructive',
            })
            return
        }
        if (!currentUserId || !receiverRoomId || !receiverDepartmentId) {
            toast({
                title: 'Lỗi',
                description: 'Chưa chọn phòng/khoa nhận mẫu',
                variant: 'destructive',
            })
            return
        }
        if (!selectedFlag) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn cờ để đánh dấu',
                variant: 'destructive',
            })
            return
        }

        transitionMutation.mutate({
            storedServiceReqId,
            toStateId: selectedStateId,
            currentUserId,
            currentDepartmentId: receiverDepartmentId,
            currentRoomId: receiverRoomId,
            selectedFlag,
        })
    }

    // Handle selection from sidebar
    const handleSelectServiceRequest = (code: string, storedId?: string, receptionCode?: string) => {
        setSelectedServiceReqCode(code)
        setStoredServiceReqId(storedId)
        setReceptionCode(receptionCode || '')
        setReceiveDateTime(getVietnamTime())
        
        // Tự động chọn phòng hiện tại khi chọn service request từ sidebar
        if (currentRoomId && availableRooms.length > 0) {
            const matchingRoom = availableRooms.find(r => r.roomId === currentRoomId)
            if (matchingRoom) {
                setSelectedReceiverRoomKey(matchingRoom.key)
            }
        }
    }

    // Reset form whenever selectedServiceReqCode changes (as a safety measure)
    useEffect(() => {
        if (selectedServiceReqCode) {
            setReceiveDateTime(getVietnamTime())
        }
    }, [selectedServiceReqCode])

    return (
        <div ref={scrollContainerRef as React.RefObject<HTMLDivElement>} className="flex h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {/* Sidebar - 1/4 màn hình */}
            <div className="w-1/4 border-r border-gray-200 bg-gray-50">
                <ServiceRequestsSidebar
                    onSelect={handleSelectServiceRequest}
                    selectedCode={selectedServiceReqCode}
                />
            </div>

            {/* Main content - 3/4 màn hình */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                {selectedServiceReqCode ? (
                    <div className="space-y-6">
                        {/* Header with selected service request code */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-blue-600 font-medium">Mã Y lệnh đang xử lý</p>
                                        <p className="text-xl font-bold text-blue-900">{selectedServiceReqCode}</p>
                                    </div>
                                    {receptionCodeFromStored && (
                                        <div>
                                            <div className="flex items-center gap-6 mb-2">
                                                <p className="text-sm text-blue-600 font-medium">Mã bệnh phẩm</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handlePrintBarcode}
                                                    className="h-7"
                                                >
                                                    <Printer className="h-4 w-4 mr-1" />
                                                    In mã QR
                                                </Button>
                                            </div>
                                            <div ref={barcodeRef} className="flex flex-col items-start">
                                                <QRCodeSVG
                                                    key={receptionCodeFromStored} // Force re-render khi receptionCodeFromStored thay đổi
                                                    value={receptionCodeFromStored}
                                                    size={80}
                                                    level="M"
                                                    includeMargin={false}
                                                />
                                                <div className="mt-2 text-sm font-medium text-gray-700">
                                                    {receptionCodeFromStored}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedServiceReqCode('')}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>

                        {/* Phần 2: Đơn vị nhận mẫu */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200">
                                Nhận bệnh phẩm
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Đơn vị thực hiện</Label>
                                    <Select
                                        value={selectedReceiverRoomKey ?? ''}
                                        onValueChange={(v) => setSelectedReceiverRoomKey(v)}
                                        open={executeRoomSelectOpen}
                                        onOpenChange={setExecuteRoomSelectOpen}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn đơn vị thực hiện" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(() => {
                                                if (isLoadingRooms) {
                                                    return (
                                                        <SelectItem value="_loading" disabled>
                                                            Đang tải danh sách phòng...
                                                        </SelectItem>
                                                    )
                                                }
                                                
                                                if (availableRooms.length === 0) {
                                                    return (
                                                        <SelectItem value="_empty" disabled>
                                                            Không có phòng nào
                                                        </SelectItem>
                                                    )
                                                }
                                                
                                                return availableRooms.map(room => (
                                                    <SelectItem key={room.key} value={room.key}>
                                                        {(room.roomName || 'Phòng') + ' - ' + (room.departmentName || 'Khoa')}
                                                    </SelectItem>
                                                ))
                                            })()}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Người nhận mẫu</Label>
                                    <Input type="text" value={currentUserName} disabled className="font-semibold" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Trạng thái chuyển tiếp</Label>
                                    <Select value={selectedStateId} onValueChange={setSelectedStateId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn trạng thái..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statesData?.data?.items?.map((state: { id: string; stateCode: string; stateName: string }) => (
                                                <SelectItem key={state.id} value={state.id}>{state.stateName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Thời gian nhận mẫu</Label>
                                    <Input type="datetime-local" value={receiveDateTime} onChange={(e) => setReceiveDateTime(e.target.value)} />
                                </div>
                                <div className="flex gap-2 my-2">
                                    <Label>Chọn cờ để đánh dấu: </Label>
                                    <RadioGroup value={selectedFlag} onValueChange={setSelectedFlag} className="flex gap-6">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="ST" id="flag-st" />
                                            <Label htmlFor="flag-st" className="cursor-pointer">ST</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="PT" id="flag-pt" />
                                            <Label htmlFor="flag-pt" className="cursor-pointer">PT</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="HC" id="flag-hc" />
                                            <Label htmlFor="flag-hc" className="cursor-pointer">HC</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <Label>Ghi chú</Label>
                                    <Textarea
                                        placeholder="Nhập ghi chú . . . ."
                                        value={handoverNote}
                                        onChange={(e) => setHandoverNote(e.target.value)}
                                        className="resize-y min-h-[80px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-center gap-3 mt-6">
                            <Button onClick={handleConfirmHandover} disabled={transitionMutation.isPending || !storedServiceReqId || !selectedStateId || !receiverRoomId || !receiverDepartmentId || !selectedFlag}>
                                {transitionMutation.isPending ? 'Đang xử lý...' : 'Xác nhận bàn giao'}
                            </Button>
                            <Button variant="secondary" onClick={() => setReceiveDateTime(getVietnamTime())} disabled={transitionMutation.isPending}>
                                Làm mới
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            Chưa chọn yêu cầu
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Vui lòng chọn một yêu cầu từ danh sách bên trái để bắt đầu bàn giao mẫu
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
