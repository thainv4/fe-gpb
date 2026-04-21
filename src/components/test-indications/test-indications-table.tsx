import React, { useEffect, useRef, useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ServiceRequestService, SampleType, CreateSampleReceptionByPrefixRequest, type UserRoom } from "@/lib/api/client";
import { formatDobDisplay } from "@/lib/utils";
import {
    PatientInfoReadRow,
    PatientInfoSectionLabel,
    PatientInfoPanel,
} from "@/components/patient-info/patient-info-read-row";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Printer, Plus } from "lucide-react";
import { useTabsStore } from "@/lib/stores/tabs";
import { useCurrentRoomStore } from "@/lib/stores/current-room";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTabPersistence } from "@/hooks/use-tab-persistence";
import { ServiceRequestsSidebar } from "@/components/service-requests-sidebar/service-requests-sidebar";
import { QRCodeSVG } from 'qrcode.react';
import { useHisStore } from "@/lib/stores/his";
import { printQrCode } from '@/lib/utils/print-qr-code';
import { SampleTypeForm } from "@/components/sample-type-management/sample-type-form";
import { SampleTypeRequest } from "@/lib/api/client";
import { logFrontendApiStatus } from "@/lib/logging/frontend-api-logger";

/** Các giá trị tiền tố có trong dropdown chọn tiền tố */
const PREFIX_OPTIONS = ['T', 'C', 'F', 'S'];

export default function TestIndicationsTable() {

    const { toast } = useToast()
    const queryClient = useQueryClient()
    const { activeKey, tabs } = useTabsStore()
    const pathname = usePathname()
    const tabKey = activeKey ?? pathname ?? 'default' // Use pathname as fallback
    const { setTabData, getTabData } = useTabsStore()
    const { token: hisToken } = useHisStore()
    const { currentRoomId } = useCurrentRoomStore()

    // Get current tab's room info
    const currentTab = tabs.find(t => t.key === tabKey)
    const tabRoomId = currentTab?.roomId
    const tabRoomName = currentTab?.roomName
    const tabDepartmentId = currentTab?.departmentId
    const tabDepartmentName = currentTab?.departmentName


    const [serviceReqCode, setServiceReqCode] = useState<string>('')
    const [searchCode, setSearchCode] = useState<string>('') // State để trigger API call
    const [selectedSampleType, setSelectedSampleType] = useState<string>('')
    const [selectOpen, setSelectOpen] = useState<boolean>(false)
    const [sampleCode, setSampleCode] = useState<string>('') // Mã bệnh phẩm từ API response
    const [sampleTypeSearch, setSampleTypeSearch] = useState<string>('') // Từ khóa tìm kiếm bệnh phẩm
    const [storedServiceReqId, setStoredServiceReqId] = useState<string | undefined>()
    const [selectedPrefix, setSelectedPrefix] = useState<string>('') // Prefix chưa được chọn
    const [manualBarcode, setManualBarcode] = useState<string>('') // Barcode nhập thủ công
    const [isManualInput, setIsManualInput] = useState<boolean>(false) // Checkbox "Nhập thủ công"
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [isCreateSampleTypeDialogOpen, setIsCreateSampleTypeDialogOpen] = useState(false)

    const sidInputRef = useRef<HTMLInputElement>(null)
    const sampleTriggerRef = useRef<HTMLButtonElement>(null)
    const barcodeRef = useRef<HTMLDivElement>(null)
    const autoSelectedByInstructionRef = useRef<string>('')

    // Tab persistence hook
    const { scrollContainerRef } = useTabPersistence(
        {
            serviceReqCode,
            searchCode,
            selectedSampleType,
            sampleCode,
            sampleTypeSearch,
            selectedPrefix,
            manualBarcode,
            isManualInput,
        },
        {
            saveScroll: true,
            debounceMs: 500,
            onRestore: (data) => {
                if (data.serviceReqCode) setServiceReqCode(data.serviceReqCode)
                if (data.searchCode) setSearchCode(data.searchCode)
                if (data.selectedSampleType) setSelectedSampleType(data.selectedSampleType)
                if (data.sampleCode) setSampleCode(data.sampleCode)
                if (data.sampleTypeSearch) setSampleTypeSearch(data.sampleTypeSearch)
                if (data.selectedPrefix) setSelectedPrefix(data.selectedPrefix)
                if (data.manualBarcode) setManualBarcode(data.manualBarcode)
                if (data.isManualInput !== undefined) setIsManualInput(data.isManualInput)
            },
        }
    )

    const { data: serviceRequestData, isLoading, isError, error } = useQuery({
        queryKey: ['service-request', searchCode],
        queryFn: () => apiClient.getServiceRequestByCode(searchCode),
        enabled: !!searchCode, // Chỉ gọi API khi có searchCode
        retry: 1,
    })

    // Gọi API để lấy danh sách bệnh phẩm
    const { data: sampleTypesData } = useQuery({
        queryKey: ['sample-types'],
        queryFn: () => apiClient.getSampleTypes(),
        staleTime: 5 * 60 * 1000,
    })

    // Danh sách phòng của user (my-rooms) để lấy select_prefix của phòng đang chọn
    const { data: myRoomsData } = useQuery({
        queryKey: ['my-rooms'],
        queryFn: () => apiClient.getMyUserRooms(),
        staleTime: 5 * 60 * 1000,
    })

    const myRooms = useMemo((): UserRoom[] => {
        const raw = myRoomsData?.data?.rooms ?? []
        return Array.isArray(raw) ? (raw as UserRoom[]) : []
    }, [myRoomsData])

    // Tiền tố bị khóa theo phòng: nếu phòng có selectPrefix trùng dropdown thì chỉ được chọn giá trị đó
    const lockedRoomPrefix = useMemo(() => {
        const roomId = currentRoomId ?? tabRoomId
        if (!roomId || !myRooms.length) return undefined
        const room = myRooms.find((r) => r.roomId === roomId)
        const prefix = (room?.selectPrefix ?? (room as { select_prefix?: string })?.select_prefix)?.trim?.()
        return prefix && PREFIX_OPTIONS.includes(prefix) ? prefix : undefined
    }, [currentRoomId, tabRoomId, myRooms])

    // resultFormType từ response my-rooms: 1 = form-gpb, 2 = form-gen-1, 3 = ẩn nhập barcode thủ công
    const resultFormType = useMemo(() => {
        const raw = myRoomsData?.data?.resultFormType
        if (raw === undefined || raw === null) return 1
        const n = Number(raw)
        return n === 2 ? 2 : n === 3 ? 3 : 1
    }, [myRoomsData])

    // Khi resultFormType = 3 thì tắt nhập thủ công và xóa manual barcode
    useEffect(() => {
        if (resultFormType === 3) {
            setIsManualInput(false)
            setManualBarcode('')
        }
    }, [resultFormType])

    const serviceRequest = serviceRequestData?.data
    const patient = serviceRequest?.patient

    const normalizeText = (value: string) =>
        value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')

    // Lấy instructionNote đầu tiên khác rỗng từ danh sách dịch vụ.
    const firstInstructionNote = useMemo(() => {
        const services = serviceRequest?.services ?? []
        const serviceWithNote = services.find((service) => typeof service?.instructionNote === 'string' && service.instructionNote.trim())
        return serviceWithNote?.instructionNote?.trim() ?? ''
    }, [serviceRequest])

    // Autofocus SID on mount
    useEffect(() => {
        sidInputRef.current?.focus()
    }, [])

    // Restore last selected sample type
    useEffect(() => {
        try {
            const last = localStorage.getItem('lastSampleTypeId')
            if (last) setSelectedSampleType(last)
        } catch { }
    }, [])

    // Persist last selected sample type
    useEffect(() => {
        try {
            if (selectedSampleType) localStorage.setItem('lastSampleTypeId', selectedSampleType)
        } catch { }
    }, [selectedSampleType])

    // Tự động chọn tiền tố theo select_prefix của phòng làm việc (nếu trùng với dropdown).
    // Dùng currentRoomId (cập nhật ngay khi đổi phòng) để dropdown đổi theo không cần reload.
    useEffect(() => {
        const roomId = currentRoomId ?? tabRoomId
        if (!roomId || !myRooms.length || isManualInput) return
        const room = myRooms.find((r) => r.roomId === roomId)
        const prefix = (room?.selectPrefix ?? (room as { select_prefix?: string })?.select_prefix)?.trim?.()
        if (prefix && PREFIX_OPTIONS.includes(prefix)) {
            setSelectedPrefix(prefix)
        }
    }, [currentRoomId, tabRoomId, myRooms, isManualInput])

    const triggerSearch = () => {
        if (!serviceReqCode?.trim()) return
        setSearchCode(serviceReqCode.trim()) // Trigger API call
        setStoredServiceReqId(undefined) // Reset storedServiceReqId khi user nhập mã mới
        // After triggering, open and focus the sample type select for quick flow
        setTimeout(() => {
            setSelectOpen(true)
            sampleTriggerRef.current?.focus()
            sampleTriggerRef.current?.click()
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            triggerSearch()
        }
    }

    // Handler khi nhấn Enter trong input nhập barcode thủ công
    const handleManualBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && isManualInput && manualBarcode.trim()) {
            const receptionCode = manualBarcode.trim()
            try {
                const response = await apiClient.querySampleTypeByReceptionCode(receptionCode)

                if (response.success && response.data?.sampleTypeId) {
                    // Xóa search để dropdown hiển thị full list, giúp Select tìm thấy option tương ứng
                    setSampleTypeSearch('')
                    // Set sampleTypeId vào dropdown
                    setSelectedSampleType(response.data.sampleTypeId)
                    toast({
                        title: "Thành công",
                        description: "Đã tìm thấy bệnh phẩm tương ứng với Barcode",
                        variant: "default"
                    })
                } else {
                    // Hiển thị lỗi từ API
                    const errorMessage = response.error || response.message || "Không tìm thấy bệnh phẩm tương ứng với Barcode"
                    toast({
                        title: "Lỗi",
                        description: errorMessage,
                        variant: "destructive"
                    })
                }
            } catch (error: any) {
                console.error('Error querying sample type:', error)
                toast({
                    title: "Lỗi",
                    description: error?.message || "Có lỗi xảy ra khi tìm kiếm bệnh phẩm",
                    variant: "destructive"
                })
            }
        }
    }

    const handleSelectFromList = (code: string, storedId?: string, receptionCode?: string) => {
        setServiceReqCode(code)
        setSearchCode(code)
        setStoredServiceReqId(storedId) // Lưu storedServiceReqId
        setSelectedPrefix('') // Reset prefix về giá trị mặc định
        setManualBarcode('') // Reset manual barcode về giá trị mặc định
        setIsManualInput(false) // Reset checkbox về mặc định
    }

    const clearSampleFields = () => {
        setSelectedSampleType('')
        setSelectedPrefix('')
        setManualBarcode('')
        setIsManualInput(false)
        setSampleCode('')
    }

    const clearAll = () => {
        setServiceReqCode('')
        setSearchCode('')
        setSelectedSampleType('')
        setSelectedPrefix('')
        setManualBarcode('')
        setIsManualInput(false)
        setSampleCode('')
        setStoredServiceReqId(undefined) // Reset storedServiceReqId
        sidInputRef.current?.focus()
    }

    const errorMessage = error ? error.message : ''

    const normalizedSampleTypeSearch = sampleTypeSearch.trim()

    // Fetch sample types based on search
    const {
        data: searchedSampleTypeData,
        isError: isSampleTypeSearchError,
        error: sampleTypeSearchError,
        isFetching: isSearchingSampleType,
    } = useQuery({
        queryKey: ['sample-type-search', normalizedSampleTypeSearch],
        queryFn: () => apiClient.getSampleTypes({
            search: normalizedSampleTypeSearch,
            limit: 100,
            offset: 0,
        }),
        enabled: normalizedSampleTypeSearch.length > 0,
        placeholderData: (previousData) => previousData,
        retry: false,
    })

    const sampleTypeItems: SampleType[] = (sampleTypesData?.data?.sampleTypes ?? []) as SampleType[]

    const matchedSampleTypeIdByInstruction = useMemo(() => {
        if (!firstInstructionNote || !sampleTypeItems.length) return undefined
        const normalizedInstruction = normalizeText(firstInstructionNote)
        const matched = sampleTypeItems.find((sampleType) => normalizeText(sampleType.typeName ?? '') === normalizedInstruction)
        return matched?.id
    }, [firstInstructionNote, sampleTypeItems])

    // Mỗi mã y lệnh chỉ auto chọn một lần để tránh ghi đè thao tác người dùng.
    useEffect(() => {
        autoSelectedByInstructionRef.current = ''
    }, [searchCode])

    useEffect(() => {
        const currentSearchCode = searchCode.trim()
        if (!currentSearchCode || !matchedSampleTypeIdByInstruction) return
        if (storedServiceReqId) return
        if (autoSelectedByInstructionRef.current === currentSearchCode) return

        setSelectedSampleType(matchedSampleTypeIdByInstruction)
        setSelectOpen(true)
        autoSelectedByInstructionRef.current = currentSearchCode
    }, [searchCode, matchedSampleTypeIdByInstruction, storedServiceReqId])

    // Mutation để tạo loại mẫu mới
    const createSampleTypeMutation = useMutation({
        mutationFn: async (newSampleType: SampleTypeRequest) => {
            const response = await apiClient.createSampleType(newSampleType)
            if (!response.success) {
                const errorMessage = typeof response.error === 'string'
                    ? response.error
                    : (response.error as any)?.message || response.message || 'Không thể tạo loại mẫu'
                throw new Error(errorMessage)
            }
            return response
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['sample-types'] })
            queryClient.invalidateQueries({ queryKey: ['sample-type-search'] })
            toast({
                title: 'Thành công',
                description: response.message || 'Loại mẫu đã được tạo thành công',
            })
            setIsCreateSampleTypeDialogOpen(false)
        },
        onError: (error: Error) => {
            toast({
                title: 'Lỗi',
                description: error.message || 'Không thể tạo loại mẫu',
                variant: 'destructive',
            })
        },
    })

    const handleCreateSampleType = (data: SampleTypeRequest) => {
        createSampleTypeMutation.mutate(data)
    }

    // Nếu có search và có kết quả từ API search, dùng kết quả đó. Nếu không có search, dùng danh sách đầy đủ.
    // Luôn đảm bảo item đang chọn (selectedSampleType) có trong list để Select hiển thị đúng sau khi tra barcode.
    const filteredSampleTypeItems = useMemo(() => {
        let list: SampleType[]
        if (normalizedSampleTypeSearch) {
            if (searchedSampleTypeData?.data?.sampleTypes && Array.isArray(searchedSampleTypeData.data.sampleTypes)) {
                list = searchedSampleTypeData.data.sampleTypes
            } else {
                list = []
            }
        } else {
            list = sampleTypeItems
        }
        // Nếu có selectedSampleType mà không nằm trong list (vd: vừa tra barcode), thêm từ sampleTypeItems để Select hiển thị
        if (selectedSampleType && !list.some((s) => s.id === selectedSampleType)) {
            const selected = sampleTypeItems.find((s) => s.id === selectedSampleType)
            if (selected) list = [selected, ...list]
        }
        return list
    }, [normalizedSampleTypeSearch, searchedSampleTypeData, sampleTypeItems, selectedSampleType])


    const { data: profileData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => apiClient.getProfile(),
        staleTime: 5 * 60 * 1000,
    })
    const currentUserId = profileData?.data?.id

    // Query stored service request nếu có storedServiceReqId
    const { data: storedServiceRequestData, refetch: refetchStoredServiceRequest } = useQuery({
        queryKey: ['stored-service-request', storedServiceReqId],
        queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId!),
        enabled: !!storedServiceReqId,
        staleTime: 0,
    })

    // Lấy receptionCode từ storedServiceRequest (chỉ khi có storedServiceReqId)
    const currentReceptionCode = useMemo(() => {
        if (!storedServiceReqId || !storedServiceRequestData?.data?.services || storedServiceRequestData.data.services.length === 0) {
            return ''
        }
        // Lấy receptionCode từ service đầu tiên
        return storedServiceRequestData.data.services[0]?.receptionCode || ''
    }, [storedServiceReqId, storedServiceRequestData])

    /** Chẩn đoán phụ từ GET /service-requests/stored/{id} (icdText hoặc icd_text). */
    const storedIcdTextDisplay = useMemo(() => {
        const d = storedServiceRequestData?.data
        if (!d) return ''
        const raw = d.icdText ?? (d as { icd_text?: string | null }).icd_text
        return typeof raw === 'string' ? raw.trim() : ''
    }, [storedServiceRequestData])

    const requestDoctorDisplay = useMemo(() => {
        if (!serviceRequest) return ''
        if (serviceRequest.requestUsername && serviceRequest.requestLoginname) {
            return `${serviceRequest.requestUsername} (${serviceRequest.requestLoginname})`
        }
        return serviceRequest.requestUsername ?? serviceRequest.requestLoginname ?? ''
    }, [serviceRequest])

    const requestLocationDisplay = useMemo(() => {
        if (!serviceRequest) return ''
        const dept = serviceRequest.requestDepartment?.name ?? ''
        const room = serviceRequest.requestRoom?.name ?? ''
        if (dept && room) return `${room} - ${dept}`
        return dept || room
    }, [serviceRequest])

    // Tự động set selectedSampleType từ sampleTypeId khi có storedServiceRequestData
    useEffect(() => {
        if (storedServiceRequestData?.data?.services && storedServiceRequestData.data.services.length > 0) {
            const firstService = storedServiceRequestData.data.services[0]
            if (firstService?.sampleTypeId) {
                setSelectedSampleType(firstService.sampleTypeId)
            }
        }
    }, [storedServiceRequestData])

    const handlePrintBarcode = () => {
        if (!barcodeRef.current || !currentReceptionCode) return
        const birthYear = patient?.dob && String(patient.dob).length >= 4 ? String(patient.dob).substring(0, 4) : undefined
        printQrCode(barcodeRef.current.innerHTML, currentReceptionCode, patient?.name, birthYear)
    }

    // Mutation để tạo mã tiếp nhận
    const createSampleReceptionMutation = useMutation({
        mutationFn: async ({ prefix, sampleTypeId }: { prefix: string; sampleTypeId?: string }) => {
            const requestBody: CreateSampleReceptionByPrefixRequest = {
                prefix: prefix,
                codeWidth: 4,
                resetPeriod: 'MONTHLY',
                allowDuplicate: false,
            }
            // Chỉ thêm sampleTypeId nếu có giá trị (lấy từ dropdown chọn bệnh phẩm)
            if (sampleTypeId) {
                requestBody.sampleTypeId = sampleTypeId
            }
            const response = await apiClient.createSampleReceptionByPrefix(requestBody)
            // Kiểm tra response.success và throw error nếu không thành công
            if (!response.success) {
                throw new Error(response.error || response.message || 'Không thể tạo mã tiếp nhận')
            }
            return response
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: `❌ Lỗi khi tạo mã tiếp nhận: ${error instanceof Error ? error.message : 'Không xác định'}`,
                variant: "destructive",
            })
        }
    })

    // Mutation để lưu chỉ định xét nghiệm
    const storeServiceRequestMutation = useMutation({
        mutationFn: (body: {
            serviceReqCode: string;
            currentRoomId: string;
            currentDepartmentId: string;
            receptionCode: string;
            sampleTypeName?: string;
            sampleCollectionTime: string;
            collectedByUserId: string;
            saveRawJson: boolean;
        }) => apiClient.storeServiceRequest(body),
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: `❌ Lỗi khi lưu chỉ định: ${error instanceof Error ? error.message : 'Không xác định'}`,
                variant: "destructive",
            })
        }
    })

    // Mutation để update receptionCode
    const updateReceptionCodeMutation = useMutation({
        mutationFn: ({ serviceId, receptionCode, sampleTypeName }: {
            serviceId: string;
            receptionCode?: string;
            sampleTypeName?: string;
        }) =>
            apiClient.updateServiceReceptionCode(serviceId, receptionCode, sampleTypeName),
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: `❌ Lỗi khi cập nhật mã tiếp nhận: ${error instanceof Error ? error.message : 'Không xác định'}`,
                variant: "destructive",
            })
        }
    })

    const handleConfirmSave = () => {
        setConfirmDialogOpen(true)
    }

    async function handleSave() {
        // Validation
        if (!tabRoomId || !tabDepartmentId) {
            toast({
                title: "Lỗi",
                description: "❌ Thiếu thông tin phòng hoặc khoa",
                variant: "destructive",
            })
            return;
        }

        const serviceCodeToSave = (searchCode || serviceReqCode || '').trim()
        if (!serviceCodeToSave) {
            toast({
                title: "Lỗi",
                description: "❌ Chưa có mã y lệnh",
                variant: "destructive",
            })
            return;
        }

        if (!selectedSampleType) {
            toast({
                title: "Lỗi",
                description: "❌ Chưa chọn loại bệnh phẩm",
                variant: "destructive",
            })
            return;
        }

        if (!currentUserId) {
            toast({
                title: "Lỗi",
                description: "❌ Chưa có thông tin người dùng",
                variant: "destructive",
            })
            return;
        }

        // Lấy sampleTypeCode từ selectedSampleType - tìm trong filteredSampleTypeItems (có thể từ search hoặc full list)
        const selectedType = filteredSampleTypeItems.find(item => item.id === selectedSampleType)
        if (!selectedType?.typeName) {
            toast({
                title: "Lỗi",
                description: "❌ Không tìm thấy thông tin loại bệnh phẩm",
                variant: "destructive",
            })
            return;
        }

        try {
            const commonLogPayload = {
                serviceReqCode: serviceCodeToSave,
                storedServiceReqId,
            }

            // Bước 1: Kiểm tra xem đã có stored service request chưa
            if (storedServiceReqId && storedServiceRequestData?.data) {
                const services = storedServiceRequestData.data.services || []

                if (services.length === 0) {
                    toast({
                        title: "Lỗi",
                        description: "❌ Không tìm thấy dịch vụ để cập nhật",
                        variant: "destructive",
                    })
                    return
                }

                // Khi update yêu cầu đã có sẵn, cần chọn cả bệnh phẩm và (prefix hoặc barcode thủ công)
                if (!selectedSampleType || (!isManualInput && !selectedPrefix) || (isManualInput && !manualBarcode.trim())) {
                    toast({
                        title: "Lỗi",
                        description: isManualInput
                            ? "❌ Vui lòng chọn cả bệnh phẩm và nhập barcode thủ công để cập nhật"
                            : "❌ Vui lòng chọn cả bệnh phẩm và prefix để cập nhật",
                        variant: "destructive",
                    })
                    return
                }

                // Sử dụng barcode thủ công nếu checkbox được chọn, nếu không thì tạo từ prefix
                let receptionCode: string;

                if (isManualInput) {
                    // Sử dụng barcode nhập thủ công - KHÔNG gọi API
                    receptionCode = manualBarcode.trim();
                } else if (selectedSampleType && selectedPrefix) {
                    // Tạo receptionCode mới từ prefix - GỌI API
                    void logFrontendApiStatus({
                        ...commonLogPayload,
                        step: 'create-reception',
                        status: 'start',
                        method: 'POST',
                        endpoint: '/sample-receptions/by-prefix',
                    })
                    const receptionResponse = await createSampleReceptionMutation.mutateAsync({
                        prefix: selectedPrefix,
                        sampleTypeId: selectedSampleType
                    });
                    void logFrontendApiStatus({
                        ...commonLogPayload,
                        step: 'create-reception',
                        status: receptionResponse.success ? 'success' : 'error',
                        statusCode: receptionResponse.status,
                        method: 'POST',
                        endpoint: '/sample-receptions/by-prefix',
                        receptionCode: receptionResponse.data?.receptionCode,
                        error: receptionResponse.success ? undefined : (receptionResponse.error || receptionResponse.message),
                    })
                    if (!receptionResponse.success || !receptionResponse.data?.receptionCode) {
                        toast({
                            title: "Lỗi",
                            description: "❌ Không tạo được mã tiếp nhận",
                            variant: "destructive",
                        })
                        return;
                    }
                    receptionCode = receptionResponse.data.receptionCode;
                } else {
                    toast({
                        title: "Lỗi",
                        description: "❌ Vui lòng chọn prefix hoặc nhập barcode thủ công",
                        variant: "destructive",
                    })
                    return;
                }

                // Update cả receptionCode và sampleTypeName
                void logFrontendApiStatus({
                    ...commonLogPayload,
                    step: 'update-reception-code',
                    status: 'start',
                    method: 'PATCH',
                    endpoint: '/service-requests/stored/services/{serviceId}/reception-code',
                    receptionCode,
                })
                const updatePromises = services.map(service =>
                    updateReceptionCodeMutation.mutateAsync({
                        serviceId: service.id,
                        receptionCode: receptionCode,
                        sampleTypeName: selectedType?.typeName
                    })
                )
                await Promise.all(updatePromises)
                void logFrontendApiStatus({
                    ...commonLogPayload,
                    step: 'update-reception-code',
                    status: 'success',
                    statusCode: 200,
                    method: 'PATCH',
                    endpoint: '/service-requests/stored/services/{serviceId}/reception-code',
                    receptionCode,
                })
                // Refetch lại nội dung của yêu cầu để cập nhật barcode
                await queryClient.invalidateQueries({ queryKey: ['stored-service-request', storedServiceReqId] })
                await refetchStoredServiceRequest() // Refetch ngay lập tức để cập nhật barcode
                toast({
                    title: "Thành công",
                    description: `✅ Đã cập nhật mã tiếp nhận và bệnh phẩm cho ${services.length} dịch vụ!`,
                })
                clearSampleFields()
                return
            }

            // Bước 2: Chưa có stored service request -> Tạo mới (cần prefix hoặc barcode thủ công)
            if ((!isManualInput && !selectedPrefix) || (isManualInput && !manualBarcode.trim())) {
                toast({
                    title: "Lỗi",
                    description: isManualInput
                        ? "❌ Vui lòng nhập barcode thủ công để tạo mã tiếp nhận mới"
                        : "❌ Vui lòng chọn prefix để tạo mã tiếp nhận mới",
                    variant: "destructive",
                })
                return;
            }

            // Sử dụng barcode thủ công nếu checkbox được chọn, nếu không thì tạo từ prefix
            let receptionCode: string;

            if (isManualInput) {
                // Sử dụng barcode nhập thủ công - KHÔNG gọi API
                receptionCode = manualBarcode.trim();
            } else {
                // Tạo mã tiếp nhận mới từ prefix - GỌI API
                void logFrontendApiStatus({
                    ...commonLogPayload,
                    step: 'create-reception',
                    status: 'start',
                    method: 'POST',
                    endpoint: '/sample-receptions/by-prefix',
                })
                const receptionResponse = await createSampleReceptionMutation.mutateAsync({
                    prefix: selectedPrefix,
                    sampleTypeId: selectedSampleType || undefined
                });
                void logFrontendApiStatus({
                    ...commonLogPayload,
                    step: 'create-reception',
                    status: receptionResponse.success ? 'success' : 'error',
                    statusCode: receptionResponse.status,
                    method: 'POST',
                    endpoint: '/sample-receptions/by-prefix',
                    receptionCode: receptionResponse.data?.receptionCode,
                    error: receptionResponse.success ? undefined : (receptionResponse.error || receptionResponse.message),
                })

                if (!receptionResponse.success || !receptionResponse.data?.receptionCode) {
                    toast({
                        title: "Lỗi",
                        description: "❌ Không tạo được mã tiếp nhận",
                        variant: "destructive",
                    })
                    return;
                }

                receptionCode = receptionResponse.data.receptionCode;
            }

            const body = {
                serviceReqCode: serviceCodeToSave,
                currentRoomId: tabRoomId,
                currentDepartmentId: tabDepartmentId,
                receptionCode: receptionCode,
                sampleTypeName: selectedType?.typeName,
                sampleCollectionTime: new Date().toISOString(),
                collectedByUserId: currentUserId,
                saveRawJson: false,
            };

            void logFrontendApiStatus({
                ...commonLogPayload,
                step: 'store-service-request',
                status: 'start',
                method: 'POST',
                endpoint: '/service-requests/store',
                receptionCode,
            })
            const storeResponse = await storeServiceRequestMutation.mutateAsync(body);
            void logFrontendApiStatus({
                ...commonLogPayload,
                step: 'store-service-request',
                status: storeResponse.success ? 'success' : 'error',
                statusCode: storeResponse.status,
                method: 'POST',
                endpoint: '/service-requests/store',
                receptionCode,
                error: storeResponse.success ? undefined : (storeResponse.error || storeResponse.message),
            })

            // Kiểm tra response từ API
            if (!storeResponse.success) {
                toast({
                    title: "Lỗi",
                    description: storeResponse.message || "Không thể lưu chỉ định xét nghiệm do y lệnh đã được lưu trước đây",
                    variant: "destructive",
                });
                return;
            }

            console.log("✅ Lưu thành công!");

            // Sau khi tạo mới thành công, cần set storedServiceReqId và refetch để hiển thị barcode
            const newStoredServiceReqId = (storeResponse.data as any)?.id;
            if (newStoredServiceReqId) {
                setStoredServiceReqId(newStoredServiceReqId);
                // Refetch để hiển thị barcode mới
                await queryClient.invalidateQueries({ queryKey: ['stored-service-request', newStoredServiceReqId] });
            }

            // Sau khi store thành công, gọi API HIS-PACS start
            try {
                // Lấy HIS token code
                let tokenCode: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('hisTokenCode') : null;
                if (!tokenCode) {
                    tokenCode = hisToken?.tokenCode || null;
                }
                if (!tokenCode) {
                    const hisStorage = localStorage.getItem('his-storage');
                    if (hisStorage) {
                        try {
                            const parsed = JSON.parse(hisStorage);
                            tokenCode = parsed.state?.token?.tokenCode || null;
                        } catch (e) {
                            console.error('Error parsing HIS storage:', e);
                        }
                    }
                }

                if (tokenCode) {
                    void logFrontendApiStatus({
                        ...commonLogPayload,
                        step: 'start-his-pacs',
                        status: 'start',
                        method: 'POST',
                        endpoint: '/his-pacs/start',
                    })
                    const startHisPacsResponse = await apiClient.startHisPacs(
                        serviceCodeToSave,
                        tokenCode
                    );
                    void logFrontendApiStatus({
                        ...commonLogPayload,
                        step: 'start-his-pacs',
                        status: startHisPacsResponse.success ? 'success' : 'error',
                        statusCode: startHisPacsResponse.status,
                        method: 'POST',
                        endpoint: '/his-pacs/start',
                        error: startHisPacsResponse.success ? undefined : (startHisPacsResponse.error || startHisPacsResponse.message),
                    })

                    if (!startHisPacsResponse.success) {
                        console.error('❌ Lỗi gọi API HIS-PACS start:', startHisPacsResponse);
                        // Không hiển thị toast vì đây không phải lỗi nghiêm trọng
                    }
                } else {
                    console.warn('⚠️ Không có TokenCode để gọi API HIS-PACS start');
                }
            } catch (startError: any) {
                console.error('❌ Lỗi gọi API HIS-PACS start:', startError);
                // Không hiển thị toast vì đây không phải lỗi nghiêm trọng
            }

            // Hiển thị thông báo thành công
            toast({
                title: "Thành công",
                description: "Đã lưu chỉ định xét nghiệm thành công!",
            });

            // Refresh sidebar sau khi lưu thành công
            setRefreshTrigger(prev => prev + 1)

            // Bước 4: Reset các trường liên quan đến bệnh phẩm
            clearSampleFields();
        } catch (error) {
            void logFrontendApiStatus({
                serviceReqCode: serviceCodeToSave,
                storedServiceReqId,
                step: storedServiceReqId ? 'update-reception-code' : 'store-service-request',
                status: 'error',
                statusCode: 500,
                error: error instanceof Error ? error.message : 'Không xác định',
            })
            console.error("Lỗi:", error);
            toast({
                title: "Lỗi",
                description: `Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Không xác định'}`,
                variant: "destructive",
            })
        }
    }


    return (
        <div ref={scrollContainerRef as React.RefObject<HTMLDivElement>} className="flex h-screen overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {/* Sidebar - 1/4 màn hình với scroll */}
            <div className="w-1/4 border-r border-gray-200 bg-gray-50 overflow-hidden flex flex-col">
                <ServiceRequestsSidebar
                    onSelect={handleSelectFromList}
                    selectedCode={searchCode || serviceReqCode}
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {/* Main Content - 3/4 màn hình */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 bg-white">{/* ...existing code... */}
                {/* {!tabRoomId && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-sm font-medium text-yellow-900">
                            ⚠️ Chưa chọn phòng làm việc. Vui lòng chọn phòng trước khi lưu.
                        </div>
                    </div>
                )} */}

                {/* Controls area: keep SID and specimen select isolated from patient inputs */}
                <div className="controls sticky top-0 z-20 flex flex-col md:flex-row md:items-start gap-3 md:gap-8 mb-4 pt-4 pb-4 bg-white border-b border-gray-300">
                    <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                        <Label className="text-sm font-medium">Nhập mã y lệnh</Label>
                        <div className="flex gap-2">
                            <Input
                                ref={sidInputRef}
                                type="text"
                                value={serviceReqCode}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceReqCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập mã y lệnh và nhấn Enter"
                            />
                            <Button type="button" onClick={triggerSearch} disabled={!serviceReqCode?.trim()}>
                                Tìm
                            </Button>
                        </div>
                        {isLoading && <span className="text-xs text-gray-500">Đang tải...</span>}
                        {isError && (
                            <div className="text-xs space-y-1">
                                <div className="text-red-600">Không tìm thấy hoặc lỗi: {errorMessage}</div>
                                <div className="text-gray-500">Endpoint: /service-requests/code/{searchCode}</div>
                            </div>
                        )}
                        {!isLoading && !isError && serviceRequestData && !serviceRequest && (
                            <span className="text-xs text-orange-600">API trả về nhưng không có serviceRequest</span>
                        )}
                    </div>

                    <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">
                                {resultFormType === 2 ? 'Chọn loại bệnh phẩm' : 'Chọn vị trí bệnh phẩm'}
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsCreateSampleTypeDialogOpen(true)}
                                title="Tạo mẫu bệnh phẩm mới"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Select value={selectedSampleType} onValueChange={setSelectedSampleType} open={selectOpen} onOpenChange={setSelectOpen}>
                            <SelectTrigger ref={sampleTriggerRef}>
                                <SelectValue placeholder="Chọn bệnh phẩm" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Ô tìm kiếm bệnh phẩm - sticky at top */}
                                <div
                                    className="sticky top-0 z-10 px-2 py-2 bg-white border-b"
                                    role="none"
                                    onKeyDownCapture={(e) => {
                                        // Ngăn tất cả keyboard events lan truyền ra ngoài container
                                        e.stopPropagation()
                                    }}
                                >
                                    <Input
                                        placeholder="Tìm kiếm bệnh phẩm..."
                                        value={sampleTypeSearch}
                                        onChange={e => setSampleTypeSearch(e.target.value)}
                                        onKeyDownCapture={(e) => e.stopPropagation()}
                                        className="text-sm"
                                        autoComplete="off"
                                    />
                                </div>
                                {isSampleTypeSearchError ? (
                                    <div className="px-2 py-1 text-sm text-red-600">
                                        Lỗi tìm kiếm: {sampleTypeSearchError instanceof Error ? sampleTypeSearchError.message : 'Không thể tải dữ liệu bệnh phẩm'}
                                    </div>
                                ) : null}
                                {filteredSampleTypeItems.length
                                    ? filteredSampleTypeItems.map((sampleType) => (
                                        <SelectItem key={sampleType.id} value={sampleType.id}>
                                            {sampleType.typeName}
                                        </SelectItem>
                                    ))
                                    : !isSearchingSampleType && (
                                        <div className="px-2 py-1 text-sm text-muted-foreground">Không có dữ liệu</div>
                                    )}
                                {isSearchingSampleType && (
                                    <div className="px-2 py-1 text-sm text-muted-foreground">Đang tìm kiếm...</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 mb-1">
                            <Label className="text-sm font-medium">Chọn tiền tố sinh barcode</Label>
                            {resultFormType !== 3 && (
                                <div className="flex items-center gap-2 ml-4">
                                    <Checkbox
                                        id="manual-input"
                                        checked={isManualInput}
                                        onCheckedChange={(checked) => {
                                            setIsManualInput(checked === true)
                                            if (checked) {
                                                setSelectedPrefix('')
                                            } else {
                                                setManualBarcode('')
                                            }
                                        }}
                                    />
                                    <Label
                                        htmlFor="manual-input"
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        Nhập thủ công
                                    </Label>
                                </div>
                            )}
                        </div>
                        {resultFormType === 3 ? (
                            <Select
                                value={selectedPrefix}
                                onValueChange={setSelectedPrefix}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tiền tố" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lockedRoomPrefix ? (
                                        <SelectItem value={lockedRoomPrefix}>{lockedRoomPrefix}</SelectItem>
                                    ) : (
                                        <>
                                            <SelectItem value="T">T</SelectItem>
                                            <SelectItem value="C">C</SelectItem>
                                            <SelectItem value="F">F</SelectItem>
                                            <SelectItem value="S">S</SelectItem>
                                            <SelectItem value="G">G</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        ) : isManualInput ? (
                            <Input
                                type="text"
                                placeholder="Nhập Barcode cũ và nhấn Enter để tìm bệnh phẩm"
                                value={manualBarcode}
                                onChange={(e) => setManualBarcode(e.target.value)}
                                onKeyDown={handleManualBarcodeKeyDown}
                                className="text-sm"
                            />
                        ) : (
                            <Select
                                value={selectedPrefix}
                                onValueChange={setSelectedPrefix}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tiền tố" />
                                </SelectTrigger>
                                <SelectContent>
                                    {lockedRoomPrefix ? (
                                        <SelectItem value={lockedRoomPrefix}>{lockedRoomPrefix}</SelectItem>
                                    ) : (
                                        <>
                                            <SelectItem value="T">T</SelectItem>
                                            <SelectItem value="C">C</SelectItem>
                                            <SelectItem value="F">F</SelectItem>
                                            <SelectItem value="S">S</SelectItem>
                                            <SelectItem value="G">G</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {storedServiceReqId && currentReceptionCode && (
                        <div className="w-full md:w-1/3 flex gap-1.5">
                            <div ref={barcodeRef} className="flex flex-col items-start">
                                <QRCodeSVG
                                    key={currentReceptionCode} // Force re-render khi currentReceptionCode thay đổi
                                    value={currentReceptionCode}
                                    size={50}
                                    level="M"
                                    includeMargin={false}
                                />
                                <div className="mt-1 text-base font-medium text-gray-700 print-text-xs">
                                    {currentReceptionCode}
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mb-2">
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
                        </div>
                    )}
                </div>

                <PatientInfoPanel>
                    <h3 className="mb-2 border-b border-border pb-1.5 text-base font-semibold leading-tight text-foreground">
                        Thông tin bệnh nhân
                    </h3>
                    <PatientInfoSectionLabel>Bệnh nhân</PatientInfoSectionLabel>
                    <div className="ml-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
                        <PatientInfoReadRow label="Họ và tên" multiline emphasize className="min-w-0">
                            {patient?.name ?? ''}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="Ngày sinh" className="min-w-0">
                            {patient?.dob ? formatDobDisplay(patient.dob) : ''}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="Giới tính" className="min-w-0">
                            {patient?.genderName ?? ''}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="Số điện thoại" className="min-w-0">
                            {patient?.mobile ?? patient?.phone ?? ''}
                        </PatientInfoReadRow>
                        <div className="col-span-full border-t border-border/50" aria-hidden />
                        <PatientInfoReadRow label="Mã bệnh nhân (PID)" className="min-w-0 pb-0">
                            {patient?.code ?? ''}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="CMND/CCCD" className="min-w-0">
                            {patient?.cmndNumber ?? ''}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow
                            label="Địa chỉ"
                            multiline
                            className="min-w-0 sm:col-span-2 lg:col-span-2"
                        >
                            {patient?.address ?? ''}
                        </PatientInfoReadRow>
                    </div>
                    <div className="mt-2">
                        <PatientInfoSectionLabel>Chỉ định</PatientInfoSectionLabel>
                    </div>
                    <div className="flex flex-col divide-y divide-border/50 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
                        <PatientInfoReadRow label="Bác sĩ chỉ định" multiline twoColumnGrid className="px-2">
                            {requestDoctorDisplay}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="Nơi chỉ định" multiline twoColumnGrid className="px-2">
                            {requestLocationDisplay}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="Chẩn đoán" multiline twoColumnGrid className="px-2">
                            {serviceRequest?.icdName ?? ''}
                        </PatientInfoReadRow>
                        <PatientInfoReadRow label="Chẩn đoán phụ" multiline twoColumnGrid className="px-2">
                            {storedIcdTextDisplay}
                        </PatientInfoReadRow>
                    </div>
                </PatientInfoPanel>

                {/* Test Indications */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200">
                        Chỉ định xét nghiệm
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold border-r">STT</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold border-r">Mã dịch vụ</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold border-r">Tên dịch vụ</th>
                                    <th className="w-[32%] min-w-[320px] px-4 py-3 text-left text-sm font-semibold border-r">Ghi chú</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceRequest?.services?.map((service: ServiceRequestService, serviceIndex: number) => {
                                    const currentPrice: number | string = service?.lisService?.currentPrice ?? service?.price ?? '-'
                                    const rowKey = service.hisSereServId ?? service.serviceId ?? service.lisService?.id ?? service.serviceCode ?? service.serviceName ?? serviceIndex

                                    return (
                                        <React.Fragment key={rowKey}>
                                            {/* Parent Service Row */}
                                            <tr className="border-t bg-blue-50">
                                                <td className="px-4 py-2 text-sm border-r font-semibold">{serviceIndex + 1}</td>
                                                <td className="px-4 py-2 text-sm border-r font-semibold">{service?.serviceCode || '-'}</td>
                                                <td className="px-4 py-2 text-sm border-r font-semibold">{service?.serviceName || '-'}</td>
                                                <td className="w-[32%] min-w-[320px] px-4 py-2 text-sm border-r font-semibold">{service?.instructionNote?.trim() || '-'}</td>
                                                <td className="px-4 py-2 text-sm font-semibold">{typeof currentPrice === 'number' ? currentPrice.toLocaleString() : currentPrice}</td>
                                            </tr>

                                            {/* Child ServiceTests Rows */}
                                            {service?.serviceTests?.map((test, testIndex) => {
                                                const testPrice: number | string = test?.price ?? '-'
                                                const testKey = `${rowKey}-test-${test.id || testIndex}`
                                                return (
                                                    <tr key={testKey} className="border-t hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm border-r"></td>
                                                        <td className="px-4 py-2 text-sm border-r pl-8">{test?.testCode || '-'}</td>
                                                        <td className="px-4 py-2 text-sm border-r">{test?.testName || '-'}</td>
                                                        <td className="w-[32%] min-w-[320px] px-4 py-2 text-sm border-r">-</td>
                                                        <td className="px-4 py-2 text-sm">{typeof testPrice === 'number' ? testPrice.toLocaleString() : testPrice}</td>
                                                    </tr>
                                                )
                                            })}
                                        </React.Fragment>
                                    )
                                })}
                                {!isLoading && !isError && (!serviceRequest?.services || serviceRequest.services.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                                            Không có dịch vụ nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={'flex flex-col items-center gap-3 mt-6'}>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleConfirmSave}
                            disabled={
                                // Cần cả bệnh phẩm và (prefix hoặc barcode thủ công) (cho cả update và tạo mới)
                                !selectedSampleType ||
                                (!isManualInput && !selectedPrefix) ||
                                (isManualInput && !manualBarcode.trim()) ||
                                !tabRoomId ||
                                !tabDepartmentId ||
                                !(searchCode || serviceReqCode) ||
                                !currentUserId ||
                                (!isManualInput && createSampleReceptionMutation.isPending) ||
                                storeServiceRequestMutation.isPending ||
                                updateReceptionCodeMutation.isPending
                            }
                        >
                            {(createSampleReceptionMutation.isPending ||
                                storeServiceRequestMutation.isPending ||
                                updateReceptionCodeMutation.isPending) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                </>
                            ) : (
                                'Lưu'
                            )}
                        </Button>
                        <Button variant={'destructive'} onClick={clearAll}>Hủy</Button>
                    </div>
                </div>
            </div>

            {/* Dialog xác nhận lưu */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận lưu</DialogTitle>
                        <DialogDescription>
                            {storedServiceReqId
                                ? 'Bạn có chắc chắn muốn cập nhật chỉ định xét nghiệm này?'
                                : 'Bạn có chắc chắn muốn lưu chỉ định xét nghiệm này?'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmDialogOpen(false)
                                handleSave()
                            }}
                            disabled={
                                createSampleReceptionMutation.isPending ||
                                storeServiceRequestMutation.isPending ||
                                updateReceptionCodeMutation.isPending
                            }
                        >
                            {(createSampleReceptionMutation.isPending ||
                                storeServiceRequestMutation.isPending ||
                                updateReceptionCodeMutation.isPending) ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog tạo loại mẫu mới */}
            <Dialog open={isCreateSampleTypeDialogOpen} onOpenChange={setIsCreateSampleTypeDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Tạo mẫu bệnh phẩm mới</DialogTitle>
                    </DialogHeader>
                    <SampleTypeForm
                        onSubmit={handleCreateSampleType}
                        isLoading={createSampleTypeMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
