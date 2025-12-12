import { ServiceRequestsSidebar } from "@/components/service-requests-sidebar/service-requests-sidebar";
import { useState, useEffect, useMemo, useRef } from "react";
import { Package, Printer } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTabsStore } from "@/lib/stores/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { Textarea } from "@/components/ui/textarea";
import Barcode from 'react-barcode';

dayjs.extend(utc)
dayjs.extend(timezone)

// Function to get current time in Vietnam timezone for datetime-local input
const getVietnamTime = () => {
    return dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm')
}

export default function SampleDeliveryTable() {
    const [selectedServiceReqCode, setSelectedServiceReqCode] = useState<string>('')
    const { activeKey, tabs, setTabData, getTabData } = useTabsStore()
    const queryClient = useQueryClient()
    const { toast } = useToast()

    // Get current user info
    const { data: profileData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => apiClient.getProfile(),
        staleTime: 5 * 60 * 1000,
    })
    const currentUserId = profileData?.data?.id
    const currentUserName = profileData?.data?.username || profileData?.data?.email || ''

    // Query workflow states to get "Bàn giao mẫu" state ID
    const { data: statesData } = useQuery({
        queryKey: ['workflow-states'],
        queryFn: () => apiClient.getWorkflowStates({
            limit: 100,
            offset: 0,
            isActive: 1,
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

    // Ref cho phần barcode để in
    const barcodeRef = useRef<HTMLDivElement>(null)

    // Function để in barcode - chỉ in barcode và ngày giờ
    const handlePrintBarcode = () => {
        if (!barcodeRef.current) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const barcodeHtml = barcodeRef.current.innerHTML

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>In mã vạch - ${receptionCode}</title>
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
                    <div class="flex justify-center items-center mb-2">
                        ${barcodeHtml}
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

    // Tạo danh sách phòng/khoa từ các tab hiện có để chọn làm đơn vị nhận mẫu
    const availableRooms = useMemo(
        () => tabs
            .filter(t => t.roomId && t.departmentId)
            .map(t => ({
                key: t.key,
                roomId: t.roomId!,
                departmentId: t.departmentId!,
                roomName: t.roomName,
                departmentName: t.departmentName,
            })),
        [tabs]
    )

    // Lưu lựa chọn phòng nhận mẫu (mặc định là phòng của tab hiện tại nếu có)
    const [selectedReceiverRoomKey, setSelectedReceiverRoomKey] = useState<string | undefined>(activeKey || undefined)

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

    // Mutation for workflow transition
    const transitionMutation = useMutation({
        mutationFn: (params: {
            storedServiceReqId: string;
            toStateId: string;
            currentUserId: string;
            currentDepartmentId: string;
            currentRoomId: string;
        }) => apiClient.transitionWorkflow({
            storedServiceReqId: params.storedServiceReqId,
            toStateId: params.toStateId,
            actionType: 'COMPLETE',
            currentUserId: params.currentUserId,
            currentDepartmentId: params.currentDepartmentId,
            currentRoomId: params.currentRoomId,
            notes: handoverNote || undefined,
        }),
        onSuccess: () => {
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

        transitionMutation.mutate({
            storedServiceReqId,
            toStateId: selectedStateId,
            currentUserId,
            currentDepartmentId: receiverDepartmentId,
            currentRoomId: receiverRoomId,
        })
    }

    // Handle selection from sidebar
    const handleSelectServiceRequest = (code: string, storedId?: string, receptionCode?: string) => {
        setSelectedServiceReqCode(code)
        setStoredServiceReqId(storedId)
        setReceptionCode(receptionCode || '')
        setReceiveDateTime(getVietnamTime())
    }

    // Reset form whenever selectedServiceReqCode changes (as a safety measure)
    useEffect(() => {
        if (selectedServiceReqCode) {
            setReceiveDateTime(getVietnamTime())
        }
    }, [selectedServiceReqCode])

    return (
        <div className="flex h-full">
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
                                    {receptionCode && (
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
                                                    In mã vạch
                                                </Button>
                                            </div>
                                            <div ref={barcodeRef}>
                                                <Barcode
                                                    value={receptionCode}
                                                    format="CODE128"
                                                    width={2}
                                                    height={60}
                                                    displayValue={true}
                                                    fontSize={14}
                                                    margin={0}
                                                />
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
                                Đơn vị thực hiện
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Đơn vị thực hiện</Label>
                                    <Select
                                        value={selectedReceiverRoomKey ?? ''}
                                        onValueChange={(v) => setSelectedReceiverRoomKey(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={receiverRoomName && receiverDepartmentName ? `${receiverRoomName} - ${receiverDepartmentName}` : 'Chọn phòng nhận mẫu'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRooms.map(room => (
                                                <SelectItem key={room.key} value={room.key}>
                                                    {(room.roomName || 'Phòng') + ' - ' + (room.departmentName || 'Khoa')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Người thực hiện</Label>
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
                                    <Label>Ngày giờ thực hiện</Label>
                                    <Input type="datetime-local" value={receiveDateTime} onChange={(e) => setReceiveDateTime(e.target.value)} />
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
                            <Button onClick={handleConfirmHandover} disabled={transitionMutation.isPending || !storedServiceReqId || !selectedStateId || !receiverRoomId || !receiverDepartmentId}>
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
