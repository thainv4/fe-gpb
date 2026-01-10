import React, {useEffect, useRef, useState, useMemo} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {apiClient, ServiceRequestService, SampleType, CreateSampleReceptionByPrefixRequest} from "@/lib/api/client";
import {formatDobFromHis} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Printer } from "lucide-react";
import {useTabsStore} from "@/lib/stores/tabs";
import {usePathname} from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {useTabPersistence} from "@/hooks/use-tab-persistence";
import { ServiceRequestsSidebar } from "@/components/service-requests-sidebar/service-requests-sidebar";
import { QRCodeSVG } from 'qrcode.react';

export default function TestIndicationsTable() {

    const { toast } = useToast()
    const queryClient = useQueryClient()
    const { activeKey, tabs } = useTabsStore()
    const pathname = usePathname()
    const tabKey = activeKey ?? pathname ?? 'default' // Use pathname as fallback
    const { setTabData, getTabData } = useTabsStore()

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
    const [sampleTypeSearch, setSampleTypeSearch] = useState<string>('') // Từ khóa đang gõ
    const [appliedSearch, setAppliedSearch] = useState<string>('') // Từ khóa đã apply (sau khi nhấn Enter)
    const [storedServiceReqId, setStoredServiceReqId] = useState<string | undefined>()
    const [selectedPrefix, setSelectedPrefix] = useState<string>('') // Prefix chưa được chọn
    const [manualBarcode, setManualBarcode] = useState<string>('') // Barcode nhập thủ công
    const [isManualInput, setIsManualInput] = useState<boolean>(false) // Checkbox "Nhập thủ công"
    const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false)

    const sidInputRef = useRef<HTMLInputElement>(null)
    const sampleTriggerRef = useRef<HTMLButtonElement>(null)
    const barcodeRef = useRef<HTMLDivElement>(null)

    // Tab persistence hook
    const { scrollContainerRef } = useTabPersistence(
        {
            serviceReqCode,
            searchCode,
            selectedSampleType,
            sampleCode,
            sampleTypeSearch,
            appliedSearch,
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
                if (data.appliedSearch) setAppliedSearch(data.appliedSearch)
                if (data.selectedPrefix) setSelectedPrefix(data.selectedPrefix)
                if (data.manualBarcode) setManualBarcode(data.manualBarcode)
                if (data.isManualInput !== undefined) setIsManualInput(data.isManualInput)
            },
        }
    )

    const {data: serviceRequestData, isLoading, isError, error} = useQuery({
        queryKey: ['service-request', searchCode],
        queryFn: () => apiClient.getServiceRequestByCode(searchCode),
        enabled: !!searchCode, // Chỉ gọi API khi có searchCode
        retry: 1,
    })

    // Gọi API để lấy danh sách bệnh phẩm
    const {data: sampleTypesData} = useQuery({
        queryKey: ['sample-types'],
        queryFn: () => apiClient.getSampleTypes(),
        staleTime: 5 * 60 * 1000,
    })

    const serviceRequest = serviceRequestData?.data
    const patient = serviceRequest?.patient

    // Autofocus SID on mount
    useEffect(() => {
        sidInputRef.current?.focus()
    }, [])

    // Restore last selected sample type
    useEffect(() => {
        try {
            const last = localStorage.getItem('lastSampleTypeId')
            if (last) setSelectedSampleType(last)
        } catch {}
    }, [])

    // Persist last selected sample type
    useEffect(() => {
        try {
            if (selectedSampleType) localStorage.setItem('lastSampleTypeId', selectedSampleType)
        } catch {}
    }, [selectedSampleType])

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

    const handleSampleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setAppliedSearch(sampleTypeSearch)
        }
    }

    // Handler khi nhấn Enter trong input nhập barcode thủ công
    const handleManualBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && isManualInput && manualBarcode.trim()) {
            const receptionCode = manualBarcode.trim()
            try {
                const response = await apiClient.querySampleTypeByReceptionCode(receptionCode)
                
                if (response.success && response.data?.sampleTypeId) {
                    // Set sampleTypeId vào dropdown
                    setSelectedSampleType(response.data.sampleTypeId)
                    toast({
                        title: "Thành công",
                        description: "Đã tìm thấy bệnh phẩm tương ứng với mã tiếp nhận",
                        variant: "default"
                    })
                } else {
                    // Hiển thị lỗi từ API
                    const errorMessage = response.error || response.message || "Không tìm thấy bệnh phẩm tương ứng"
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
        // Không reset selectedSampleType để giữ lại giá trị đã chọn
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

    const sampleTypeItems: SampleType[] = (sampleTypesData?.data?.sampleTypes ?? []) as SampleType[]

    // Lọc danh sách bệnh phẩm theo từ khóa đã apply (sau khi nhấn Enter)
    const filteredSampleTypeItems = sampleTypeItems.filter(item =>
        item.typeName.toLowerCase().includes(appliedSearch.toLowerCase())
    )


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

    // Tự động set selectedSampleType từ sampleTypeId khi có storedServiceRequestData
    useEffect(() => {
        if (storedServiceRequestData?.data?.services && storedServiceRequestData.data.services.length > 0) {
            const firstService = storedServiceRequestData.data.services[0]
            if (firstService?.sampleTypeId) {
                setSelectedSampleType(firstService.sampleTypeId)
            }
        }
    }, [storedServiceRequestData])

    // Function để in QR code - chỉ in QR code và ngày giờ
    const handlePrintBarcode = () => {
        if (!barcodeRef.current || !currentReceptionCode) return

        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        const qrCodeHtml = barcodeRef.current.innerHTML

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>In mã QR - ${currentReceptionCode}</title>
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

        // Lấy sampleTypeCode từ selectedSampleType
        const selectedType = sampleTypeItems.find(item => item.id === selectedSampleType)
        if (!selectedType?.typeCode) {
            toast({
                title: "Lỗi",
                description: "❌ Không tìm thấy mã loại bệnh phẩm",
                variant: "destructive",
            })
            return;
        }

        try {
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
                    const receptionResponse = await createSampleReceptionMutation.mutateAsync({
                        prefix: selectedPrefix,
                        sampleTypeId: selectedSampleType
                    });
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
                const updatePromises = services.map(service => 
                    updateReceptionCodeMutation.mutateAsync({
                        serviceId: service.id,
                        receptionCode: receptionCode,
                        sampleTypeName: selectedType?.typeName
                    })
                )
                await Promise.all(updatePromises)
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
                const receptionResponse = await createSampleReceptionMutation.mutateAsync({
                    prefix: selectedPrefix,
                    sampleTypeId: selectedSampleType || undefined
                });

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

            // Bước 3: Chưa có stored service request -> Tạo mới như cũ
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

            const storeResponse = await storeServiceRequestMutation.mutateAsync(body);

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

            // Hiển thị thông báo thành công
            toast({
                title: "Thành công",
                description: "✅ Đã lưu chỉ định xét nghiệm thành công!",
            });

            // Bước 4: Reset các trường liên quan đến bệnh phẩm
            clearSampleFields();
        } catch (error) {
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
                />
            </div>

            {/* Main Content - 3/4 màn hình */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">{/* ...existing code... */}
                {!tabRoomId && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-sm font-medium text-yellow-900">
                            ⚠️ Chưa chọn phòng làm việc. Vui lòng chọn phòng trước khi lưu.
                        </div>
                    </div>
                )}

                {/* Controls area: keep SID and specimen select isolated from patient inputs */}
                <div className="controls sticky top-0 z-20 flex flex-col md:flex-row md:items-end gap-3 md:gap-6 mb-4 pt-4 pb-4 bg-white border-b border-gray-300">
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
                        <Button type="button" variant="secondary" onClick={clearAll}>
                            Xóa
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
                    <Label className="text-sm font-medium">Chọn bệnh phẩm</Label>
                    <Select value={selectedSampleType} onValueChange={setSelectedSampleType} open={selectOpen} onOpenChange={setSelectOpen}>
                        <SelectTrigger ref={sampleTriggerRef}>
                            <SelectValue placeholder="Chọn bệnh phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Ô tìm kiếm bệnh phẩm */}
                            <div className="px-2 py-1">
                                <Input
                                    placeholder="Tìm kiếm bệnh phẩm (nhấn Enter)..."
                                    value={sampleTypeSearch}
                                    onChange={e => setSampleTypeSearch(e.target.value)}
                                    onKeyDown={handleSampleSearchKeyDown}
                                    className="text-sm mb-2"
                                />
                            </div>
                            {filteredSampleTypeItems.length
                                ? filteredSampleTypeItems.map((sampleType) => (
                                    <SelectItem key={sampleType.id} value={sampleType.id}>
                                        {sampleType.typeName}
                                    </SelectItem>
                                  ))
                                : <div className="px-2 py-1 text-sm text-muted-foreground">Không có dữ liệu</div>
                            }
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 mb-1">
                        <Label className="text-sm font-medium">Chọn tiền tố sinh barcode</Label>
                        <div className="flex items-center gap-2 ml-4">
                            <Checkbox
                                id="manual-input"
                                checked={isManualInput}
                                onCheckedChange={(checked) => {
                                    setIsManualInput(checked === true)
                                    if (checked) {
                                        // Khi bật checkbox, clear prefix và focus vào input
                                        setSelectedPrefix('')
                                    } else {
                                        // Khi tắt checkbox, clear manual barcode
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
                    </div>
                    {isManualInput ? (
                        <Input
                            type="text"
                            placeholder="Nhấn Enter để tìm bệnh phẩm"
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
                                <SelectItem value="T">T</SelectItem>
                                <SelectItem value="C">C</SelectItem>
                                <SelectItem value="F">F</SelectItem>
                                <SelectItem value="S">S</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {storedServiceReqId && currentReceptionCode && (
                    <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-6 mb-2">
                            <Label className="text-sm font-medium text-blue-600">Mã bệnh phẩm</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrintBarcode}
                                className="h-7"
                            >
                                <Printer className="h-4 w-4 mr-1"/>
                                In mã QR
                            </Button>
                        </div>
                        <div ref={barcodeRef} className="flex flex-col items-center">
                            <QRCodeSVG
                                key={currentReceptionCode} // Force re-render khi currentReceptionCode thay đổi
                                value={currentReceptionCode}
                                size={80}
                                level="M"
                                includeMargin={false}
                            />
                            <div className="mt-2 text-sm font-medium text-gray-700">
                                {currentReceptionCode}
                            </div>
                        </div>
                    </div>
                )}
            </div>

                <h3 className="text-lg font-semibold my-2">Thông tin bệnh nhân</h3>
                <div className="patient-info grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 pt-3 pb-4 border-b border-gray-300">

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <Label>Họ và tên</Label>
                            <Input type="text" value={patient?.name ?? ''} disabled/>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Số điện thoại</Label>
                            <Input type="text" value={patient?.mobile ?? ''} disabled/>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>CMND/CCCD</Label>
                            <Input type='text' value={patient?.cmndNumber ?? ''} disabled/>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <Label>Mã bệnh nhân (PID)</Label>
                            <Input type='text' value={patient?.code ?? ''} disabled/>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Ngày sinh</Label>
                            <Input type='date' value={patient?.dob ? formatDobFromHis(patient.dob) : ''} disabled/>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Nơi chỉ định</Label>
                            {/* Safely combine department and room names. If both exist show "Department - Room", otherwise show whichever is available. */}
                            <Textarea
                                value={
                                    (() => {
                                        const dept = serviceRequest?.requestDepartment?.name ?? '';
                                        const room = serviceRequest?.requestRoom?.name ?? '';
                                        if (dept && room) return `${room} - ${dept}`;
                                        return dept || room || '';
                                    })()
                                }
                                disabled
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <Label>Giới tính</Label>
                            <Input
                                type="text"
                                value={patient?.genderName ?? ''}
                                disabled
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Địa chỉ</Label>
                            <Input type='text' value={patient?.address ?? ''} disabled/>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Chẩn đoán</Label>
                            <Textarea value={serviceRequest?.icdName ?? ''} disabled/>
                        </div>
                    </div>
                </div>

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
                                                    <td className="px-4 py-2 text-sm">{typeof testPrice === 'number' ? testPrice.toLocaleString() : testPrice}</td>
                                                </tr>
                                            )
                                        })}
                                    </React.Fragment>
                                )
                            })}
                            {!isLoading && !isError && (!serviceRequest?.services || serviceRequest.services.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
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
        </div>
    )
}
