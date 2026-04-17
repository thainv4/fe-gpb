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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from 'qrcode.react';
import { printQrCode } from '@/lib/utils/print-qr-code';

dayjs.extend(utc)
dayjs.extend(timezone)

// Function to get current time in Vietnam timezone for datetime-local input
const getVietnamTime = () => {
    return dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm')
}

// Giá trị dropdown "PHƯƠNG PHÁP LẤY MẪU" khi resultFormType === 2
const SAMPLING_METHOD_TYPE_OPTIONS = [
    { value: 'SINH THIẾT', label: 'SINH THIẾT' },
    { value: 'PHẪU THUẬT', label: 'PHẪU THUẬT' },
    { value: 'CHỌC DÒ DỊCH', label: 'CHỌC DÒ DỊCH' },
    { value: 'MẪU MÁU CHỐNG ĐÔNG BẰNG EDTA', label: 'MẪU MÁU CHỐNG ĐÔNG BẰNG EDTA' },
    { value: 'CHƯA RÕ THÔNG TIN', label: 'CHƯA RÕ THÔNG TIN' },
] as const

export default function SampleDeliveryTable() {
    const [selectedServiceReqCode, setSelectedServiceReqCode] = useState<string>('')
    const queryClient = useQueryClient()
    const { toast } = useToast()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

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

    // Danh sách phòng my-rooms để lấy resultFormType (giống trang test-result)
    const { data: myRoomsData } = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyUserRooms(),
        staleTime: 5 * 60 * 1000,
    })

    // State để control việc mở Select "Đơn vị thực hiện"
    const [executeRoomSelectOpen, setExecuteRoomSelectOpen] = useState(false)

    // Query rooms từ API /api/v1/rooms - luôn load để có thể auto-select phòng hiện tại
    const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['rooms', { isActive: true, limit: 100 }],
        queryFn: () => apiClient.getRooms({
            isActive: true,
            limit: 100,
            offset: 0,
        }),
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

    const myRooms = useMemo(() => myRoomsData?.data?.rooms ?? [], [myRoomsData])

    // resultFormType từ response my-rooms (data.resultFormType): 1 = form-gpb, 2 = form-gen-1
    const resultFormType = useMemo(() => {
        const raw = myRoomsData?.data?.resultFormType
        return raw !== undefined && raw !== null && Number(raw) === 2 ? 2 : 1
    }, [myRoomsData])

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
    // State cho phương pháp nhuộm
    const [selectedStainingMethod, setSelectedStainingMethod] = useState<string>('')
    const [barcodeGenGpb, setBarcodeGenGpb] = useState<string>('')
    const [gpbResultConclude, setGpbResultConclude] = useState<string>('') // Kết quả từ API result-conclude (khi nhấn Enter ở Mã bệnh phẩm GPB)
    const [gpbSampleTypeName, setGpbSampleTypeName] = useState<string>('') // Vị trí lấy mẫu GPB từ API result-conclude
    const [showGpbInputs, setShowGpbInputs] = useState(true)
    const [stainingMethodSearch, setStainingMethodSearch] = useState<string>('') // Từ khóa đang gõ
    const [appliedStainingMethodSearch, setAppliedStainingMethodSearch] = useState<string>('') // Từ khóa đã apply (sau khi nhấn Enter)
    const [stainingMethodSelectOpen, setStainingMethodSelectOpen] = useState(false)
    // State cho "PHƯƠNG PHÁP LẤY MẪU" khi resultFormType === 2 (SINH THIẾT, PHẪU THUẬT, ...)
    const [samplingMethodType, setSamplingMethodType] = useState<string>('')

    // Tab persistence
    const { scrollContainerRef } = useTabPersistence(
        {
            selectedServiceReqCode,
            storedServiceReqId,
            receiveDateTime,
            selectedStateId,
            handoverNote,
            receptionCode,
            selectedFlag,
            samplingMethodType,
            selectedStainingMethod,
            barcodeGenGpb,
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
                if (data.samplingMethodType) setSamplingMethodType(data.samplingMethodType)
                if (data.selectedStainingMethod) setSelectedStainingMethod(data.selectedStainingMethod)
                if (data.barcodeGenGpb !== undefined) setBarcodeGenGpb(data.barcodeGenGpb)
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

    // Query staining methods - danh sách đầy đủ
    const { data: stainingMethodsData } = useQuery({
        queryKey: ['staining-methods', { limit: 100, offset: 0 }],
        queryFn: () => apiClient.getStainingMethods({ limit: 100, offset: 0 }),
        staleTime: 5 * 60 * 1000,
    })

    // Query staining methods với search
    const { data: searchedStainingMethodsData } = useQuery({
        queryKey: ['staining-methods-search', appliedStainingMethodSearch],
        queryFn: () => apiClient.getStainingMethods({
            limit: 10,
            offset: 0,
            search: appliedStainingMethodSearch
        }),
        enabled: !!appliedStainingMethodSearch && appliedStainingMethodSearch.trim().length > 0,
        retry: false,
    })

    const allStainingMethods = useMemo(() => stainingMethodsData?.data?.stainingMethods ?? [], [stainingMethodsData])

    // Nếu có search và có kết quả từ API search, dùng kết quả đó. Nếu không có search, dùng danh sách đầy đủ
    const filteredStainingMethods = useMemo(() => {
        if (appliedStainingMethodSearch && appliedStainingMethodSearch.trim()) {
            // Nếu có search term và có kết quả từ API
            if (searchedStainingMethodsData?.data?.stainingMethods && Array.isArray(searchedStainingMethodsData.data.stainingMethods)) {
                return searchedStainingMethodsData.data.stainingMethods
            }
            // Nếu có search term nhưng không có kết quả, trả về mảng rỗng
            return []
        }
        // Nếu không có search term, trả về tất cả
        return allStainingMethods
    }, [appliedStainingMethodSearch, searchedStainingMethodsData, allStainingMethods])

    // Lấy receptionCode từ storedServiceRequest
    const receptionCodeFromStored = useMemo(() => {
        if (!storedServiceRequestData?.data?.services || storedServiceRequestData.data.services.length === 0) {
            return receptionCode // Fallback về receptionCode từ sidebar nếu không có
        }
        // Lấy receptionCode từ service đầu tiên (hoặc có thể lấy từ tất cả services)
        return storedServiceRequestData.data.services[0]?.receptionCode || receptionCode
    }, [storedServiceRequestData, receptionCode])

    // Lấy sampleTypeName từ storedServiceRequest
    const sampleTypeNameFromStored = useMemo(() => {
        if (!storedServiceRequestData?.data?.services || storedServiceRequestData.data.services.length === 0) {
            return ''
        }
        // Lấy sampleTypeName từ service đầu tiên
        return storedServiceRequestData.data.services[0]?.sampleTypeName || ''
    }, [storedServiceRequestData])

    // Ref cho phần barcode để in
    const barcodeRef = useRef<HTMLDivElement>(null)

    const handlePrintBarcode = () => {
        if (!barcodeRef.current || !receptionCodeFromStored) return
        const dob = storedServiceRequestData?.data?.patientDob
        const birthYear = dob && String(dob).length >= 4 ? String(dob).substring(0, 4) : undefined
        printQrCode(barcodeRef.current.innerHTML, receptionCodeFromStored, storedServiceRequestData?.data?.patientName, birthYear)
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
            selectedStainingMethod: string;
            barcodeGenGpb: string;
            resultConcludeGenGpb: string;
            sampleTypeNameGenGpb: string;
        }) => {
            // Bước 1: Gọi API tổng hợp để cập nhật flag và staining method cùng lúc (nếu có) - PHẢI thành công
            if (params.storedServiceReqId && (params.selectedStainingMethod || params.selectedFlag)) {
                const updateData: {
                    stainingMethodId?: string;
                    flag?: string;
                } = {};

                if (params.selectedStainingMethod) {
                    updateData.stainingMethodId = params.selectedStainingMethod;
                }
                if (params.selectedFlag) {
                    updateData.flag = params.selectedFlag;
                }

                const response = await apiClient.updateStoredServiceRequest(
                    params.storedServiceReqId,
                    updateData
                )
                if (!response.success) {
                    throw new Error(response.message || response.error || 'Không thể cập nhật thông tin bàn giao mẫu')
                }
            }

            // Bước 2: Gọi API cập nhật resultNote cho tất cả services (nếu có handoverNote) - PHẢI thành công
            if (params.storedServiceReqId && handoverNote) {
                // Lấy danh sách services từ storedServiceRequestData
                const services = storedServiceRequestData?.data?.services || []

                if (services.length > 0) {
                    // Gọi API cho tất cả services
                    const resultNotePromises = services.map((service: any) =>
                        apiClient.saveServiceResult(service.id, {
                            resultNotes: handoverNote,
                            resultStatus: 'NORMAL'
                        })
                    )

                    const resultNoteResults = await Promise.allSettled(resultNotePromises)

                    // Kiểm tra tất cả phải thành công
                    const failedResults = resultNoteResults.filter(r =>
                        r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
                    )

                    if (failedResults.length > 0) {
                        const errorMessages = failedResults.map(r => {
                            if (r.status === 'rejected') {
                                return r.reason?.message || 'Lỗi không xác định'
                            }
                            return r.value.message || r.value.error || 'Lỗi không xác định'
                        }).join(', ')
                        throw new Error(`Không thể cập nhật ghi chú cho ${failedResults.length}/${services.length} dịch vụ: ${errorMessages}`)
                    }
                }
            }

            // Bước 4: Gọi API transitionWorkflow CUỐI CÙNG sau khi các API khác đã chạy
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
                throw new Error(response.error || response.message || 'Không thể bàn giao mẫu')
            }

            // Bước 5: PATCH gpb-fields (barcodeGenGpb, resultConcludeGenGpb, sampleTypeNameGenGpb)
            const gpbResponse = await apiClient.updateStoredServiceRequestGpbFields(
                params.storedServiceReqId,
                {
                    barcodeGenGpb: params.barcodeGenGpb,
                    resultConcludeGenGpb: params.resultConcludeGenGpb,
                    sampleTypeNameGenGpb: params.sampleTypeNameGenGpb,
                }
            )
            if (!gpbResponse.success) {
                throw new Error(gpbResponse.message || gpbResponse.error || 'Không thể cập nhật gpb-fields')
            }

            return response
        },
        onSuccess: async (_data, variables) => {
            toast({
                title: 'Thành công',
                description: 'Đã xác nhận bàn giao mẫu',
            })
            // Không reset ghi chú để người dùng có thể tiếp tục
            queryClient.invalidateQueries({ queryKey: ['workflow-history'] })
            // Refresh sidebar sau khi transition thành công
            setRefreshTrigger(prev => prev + 1)
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
            toast({
                title: 'Lỗi',
                description: `Không thể bàn giao mẫu: ${errorMessage}`,
                variant: 'destructive',
            })
        },
    })

    // Gọi API result-conclude cho Mã bệnh phẩm GPB (khi resultFormType === 2)
    const resultConcludeMutation = useMutation({
        mutationFn: async (receptionCode: string) => {
            const res = await apiClient.getStoredServicesResultConclude(receptionCode.trim())
            if (!res.success) {
                throw new Error(res.message || res.error || 'Không lấy được kết quả resultConclude')
            }
            const html = res.data?.resultConclude || ''
            const sampleTypeName = res.data?.sampleTypeName || ''
            let text: string
            if (typeof document !== 'undefined') {
                const div = document.createElement('div')
                div.innerHTML = html
                text = (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
            } else {
                text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            }
            // Chỉ lấy phần chữ thường: bỏ tiêu đề "CHẨN ĐOÁN MÔ BỆNH HỌC:"
            const header = /chẩn\s*đoán\s*mô\s*bệnh\s*học\s*:?\s*/i
            return {
                plainText: text.replace(header, '').trim(),
                sampleTypeName,
            }
        },
        onSuccess: ({ plainText, sampleTypeName }) => {
            setGpbResultConclude(plainText)
            setGpbSampleTypeName(sampleTypeName)
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message : 'Lỗi không xác định'
            setGpbResultConclude('')
            setGpbSampleTypeName('')
            toast({
                title: 'Lỗi',
                description: `Không lấy được kết quả resultConclude: ${msg}`,
                variant: 'destructive',
            })
        },
    })

    // Tự động gọi API result-conclude khi barcodeGenGpb thay đổi (không cần Enter)
    useEffect(() => {
        if (resultFormType !== 2) return
        const code = barcodeGenGpb.trim()
        if (!code) {
            setGpbResultConclude('')
            setGpbSampleTypeName('')
            return
        }
        resultConcludeMutation.mutate(code)
    }, [barcodeGenGpb, resultFormType])

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
        if (resultFormType !== 2 && !selectedStainingMethod) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn phương pháp nhuộm',
                variant: 'destructive',
            })
            return
        }
        if (resultFormType === 2 && !samplingMethodType) {
            toast({
                title: 'Lỗi',
                description: 'Vui lòng chọn phương pháp lấy mẫu',
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

        // Kiểm tra nếu mã barcode có tiền tố "S" thì bắt buộc phải chọn cờ (chỉ khi resultFormType !== 2)
        if (resultFormType !== 2 && receptionCodeFromStored && receptionCodeFromStored.trim().toUpperCase().startsWith('S')) {
            if (!selectedFlag || selectedFlag.trim() === '') {
                toast({
                    title: 'Lỗi',
                    description: 'Mã barcode có tiền tố "S" bắt buộc phải chọn cờ',
                    variant: 'destructive',
                })
                return
            }
        }

        transitionMutation.mutate({
            storedServiceReqId,
            toStateId: selectedStateId,
            currentUserId,
            currentDepartmentId: receiverDepartmentId,
            currentRoomId: receiverRoomId,
            selectedFlag: resultFormType === 2 ? samplingMethodType : selectedFlag,
            selectedStainingMethod: resultFormType === 2 ? '' : selectedStainingMethod,
            barcodeGenGpb: barcodeGenGpb ?? '',
            resultConcludeGenGpb: gpbResultConclude ?? '',
            sampleTypeNameGenGpb: gpbSampleTypeName ?? '',
        })
    }

    // Handle selection from sidebar
    const handleSelectServiceRequest = (
        code: string,
        storedId?: string,
        receptionCode?: string,
        roomIdFromWorkflow?: string,
    ) => {
        // Reset tất cả các trường trong form "Nhận bệnh phẩm"
        setSelectedServiceReqCode(code)
        setStoredServiceReqId(storedId)
        setReceptionCode(receptionCode || '')
        setReceiveDateTime(getVietnamTime())
        setHandoverNote('')
        setSelectedFlag('')
        setSamplingMethodType('')
        setSelectedStainingMethod('')
        setStainingMethodSearch('')
        setAppliedStainingMethodSearch('')
        setGpbResultConclude('')

        // Reset trạng thái chuyển tiếp về trạng thái mặc định (SAMPLE_HANDOVER)
        if (handoverStateId) {
            setSelectedStateId(handoverStateId)
        }

        // Tự động chọn phòng từ workflow-history (API by-room-and-state)
        if (roomIdFromWorkflow && availableRooms.length > 0) {
            const matchingRoom = availableRooms.find(r => r.roomId === roomIdFromWorkflow)
            if (matchingRoom) {
                setSelectedReceiverRoomKey(matchingRoom.key)
                return
            }
        }

        // Nếu không lấy được phòng từ workflow-history, không auto-select nữa
        setSelectedReceiverRoomKey(undefined)
    }

    // Reset form whenever selectedServiceReqCode changes (as a safety measure)
    useEffect(() => {
        if (selectedServiceReqCode) {
            setReceiveDateTime(getVietnamTime())
        }
    }, [selectedServiceReqCode])

    // Reset state khi đổi phòng để làm mới trang
    useEffect(() => {
        setSelectedServiceReqCode('')
        setRefreshTrigger(prev => prev + 1)
    }, [currentRoomId])

    return (
        <div ref={scrollContainerRef as React.RefObject<HTMLDivElement>} className="flex h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {/* Sidebar - 1/4 màn hình */}
            <div className="w-1/4 border-r border-gray-200 bg-gray-50">
                <ServiceRequestsSidebar
                    onSelect={handleSelectServiceRequest}
                    selectedCode={selectedServiceReqCode}
                    defaultStateId="426df256-bbfa-28d1-e065-9e6b783dd008"
                    refreshTrigger={refreshTrigger}
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
                                                <p className="text-sm text-blue-600 font-medium">Mã Barcode</p>
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
                                                <div className="mt-1 text-base font-medium text-gray-700 print-text-xs">
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

                        {/* Thông tin bệnh nhân */}
                        {storedServiceRequestData?.data && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200">
                                    Thông tin bệnh nhân
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <Label className="text-sm text-gray-600">Mã bệnh nhân</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientCode || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-600">Họ và tên bệnh nhân</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientName || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-600">Ngày sinh</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientDob
                                                ? `${String(storedServiceRequestData.data.patientDob).substring(6, 8)}/${String(storedServiceRequestData.data.patientDob).substring(4, 6)}/${String(storedServiceRequestData.data.patientDob).substring(0, 4)}`
                                                : ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-600">Giới tính</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientGenderName || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-600">Số điện thoại</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientMobile || storedServiceRequestData.data.patientPhone || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm text-gray-600">CMND/CCCD</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientCmndNumber || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Label className="text-sm text-gray-600">Địa chỉ</Label>
                                        <Input
                                            value={storedServiceRequestData.data.patientAddress || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Label className="text-sm text-gray-600">Chẩn đoán</Label>
                                        <Input
                                            value={storedServiceRequestData.data.icdName || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <Label className="text-sm text-gray-600">Bác sĩ chỉ định</Label>
                                        <Input
                                            value={`${storedServiceRequestData.data.requestUsername} (${storedServiceRequestData.data.requestLoginname})` || ''}
                                            disabled
                                            className="mt-1 font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

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
                                    <Label>Vị trí bệnh phẩm</Label>
                                    <Input
                                        type="text"
                                        value={sampleTypeNameFromStored}
                                        disabled
                                        className="font-semibold"
                                        placeholder="Chưa có thông tin loại mẫu"
                                    />
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
                                {resultFormType !== 2 && (
                                    <div className="flex flex-col gap-2">
                                        <Label>Phương pháp nhuộm</Label>
                                        <Select
                                            value={selectedStainingMethod}
                                            onValueChange={setSelectedStainingMethod}
                                            open={stainingMethodSelectOpen}
                                            onOpenChange={setStainingMethodSelectOpen}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn phương pháp nhuộm..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div
                                                    className="sticky top-0 z-10 px-2 py-2 bg-white border-b"
                                                    role="none"
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                >
                                                    <Input
                                                        placeholder="Tìm kiếm phương pháp nhuộm..."
                                                        value={stainingMethodSearch}
                                                        onChange={(e) => setStainingMethodSearch(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                setAppliedStainingMethodSearch(stainingMethodSearch)
                                                                return
                                                            }
                                                            if (e.key === 'Escape') return
                                                            e.stopPropagation()
                                                        }}
                                                        className="text-sm"
                                                        autoComplete="off"
                                                    />
                                                </div>
                                                {filteredStainingMethods.length
                                                    ? filteredStainingMethods.map((method: { id: string; methodName: string }) => (
                                                        <SelectItem key={method.id} value={method.id}>
                                                            {method.methodName}
                                                        </SelectItem>
                                                    ))
                                                    : <div className="px-2 py-1 text-sm text-muted-foreground">Không có dữ liệu</div>
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {resultFormType !== 2 && (
                                    <div className="flex flex-col gap-2">
                                        <Label>Phân loại bệnh phẩm</Label>
                                        <Select value={selectedFlag} onValueChange={setSelectedFlag}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn cờ..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ST">ST</SelectItem>
                                                <SelectItem value="PT">PT</SelectItem>
                                                <SelectItem value="HMMD">HMMD</SelectItem>
                                                <SelectItem value="CL">CL</SelectItem>
                                                <SelectItem value="HC">HC</SelectItem>
                                                <SelectItem value="DB">DB</SelectItem>
                                                <SelectItem value="HQMD">HQMD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {resultFormType === 2 && (
                                    <div className="flex flex-col gap-2">
                                        <Label>PHƯƠNG PHÁP LẤY MẪU</Label>
                                        <Select value={samplingMethodType} onValueChange={setSamplingMethodType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn phương pháp lấy mẫu..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SAMPLING_METHOD_TYPE_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {resultFormType === 2 && (
                                    <>
                                        <div className="md:col-span-2 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowGpbInputs((prev) => {
                                                    const next = !prev
                                                    if (!next) {
                                                        setBarcodeGenGpb('')
                                                        setGpbSampleTypeName('')
                                                        setGpbResultConclude('')
                                                    }
                                                    return next
                                                })}
                                            >
                                                {showGpbInputs ? 'Ẩn thông tin GPB' : 'Hiện thông tin GPB'}
                                            </Button>
                                        </div>

                                        {showGpbInputs && (
                                            <>
                                                <div className="flex flex-col gap-2 md:col-span-2">
                                                    <Label>Mã bệnh phẩm GPB</Label>
                                                    <Input
                                                        type="text"
                                                        className="font-semibold"
                                                        value={barcodeGenGpb}
                                                        onChange={(e) => setBarcodeGenGpb(e.target.value)}
                                                        placeholder="Nhập mã bệnh phẩm GPB"
                                                    />
                                                    {resultConcludeMutation.isPending && (
                                                        <span className="text-xs text-muted-foreground">Đang tải kết luận mô bệnh học...</span>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label>Vị trí lấy mẫu GPB</Label>
                                                    <Input
                                                        type="text"
                                                        value={gpbSampleTypeName}
                                                        onChange={(e) => setGpbSampleTypeName(e.target.value)}
                                                        placeholder="Chưa có vị trí lấy mẫu GPB"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1 md:col-span-2">
                                                    <Label className="text-sm font-medium">Chẩn đoán mô bệnh học</Label>
                                                    <Textarea
                                                        value={gpbResultConclude}
                                                        onChange={(e) => setGpbResultConclude(e.target.value)}
                                                        className="resize-y min-h-[40px] text-sm bg-muted/30"
                                                        placeholder="Kết luận mô bệnh học sẽ được lấy tự động từ hệ thống, bạn có thể nhập thủ công tại đây..."
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

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
                            <Button onClick={handleConfirmHandover} disabled={transitionMutation.isPending || !storedServiceReqId || !selectedStateId || !receiverRoomId || !receiverDepartmentId || (resultFormType !== 2 && !selectedStainingMethod) || (resultFormType === 2 && !samplingMethodType)}>
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
