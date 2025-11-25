import React, {useEffect, useRef, useState} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useQuery, useMutation} from "@tanstack/react-query";
import {apiClient, ServiceRequestService, SampleType} from "@/lib/api/client";
import {formatDobFromHis} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {useTabsStore} from "@/lib/stores/tabs";
import {usePathname} from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ServiceRequestsSidebar } from "@/components/service-requests-sidebar/service-requests-sidebar";

export default function TestIndicationsTable() {

    const { toast } = useToast()
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

    const sidInputRef = useRef<HTMLInputElement>(null)
    const sampleTriggerRef = useRef<HTMLButtonElement>(null)

    // Restore tab state on mount
    useEffect(() => {
        const savedData = getTabData(tabKey)
        if (savedData) {
            setServiceReqCode(savedData.serviceReqCode || '')
            setSearchCode(savedData.searchCode || '')
            setSelectedSampleType(savedData.selectedSampleType || '')
            setSampleCode(savedData.sampleCode || '')
        }
    }, [tabKey, getTabData])

    useEffect(() => {
        setTabData(tabKey, {
            serviceReqCode,
            searchCode,
            selectedSampleType,
            sampleCode,
        })
    }, [tabKey, serviceReqCode, searchCode, selectedSampleType, sampleCode, setTabData])

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

    const handleSelectFromList = (code: string) => {
        setServiceReqCode(code)
        setSearchCode(code)
    }

    const clearAll = () => {
        setServiceReqCode('')
        setSearchCode('')
        setSelectedSampleType('')
        setSampleCode('')
        sidInputRef.current?.focus()
    }

    const errorMessage = error ? error.message : ''

    const sampleTypeItems: SampleType[] = (sampleTypesData?.data?.sampleTypes ?? []) as SampleType[]

    // Helper function để format ngày hiện tại theo định dạng YYYY-MM-DD
    function getCurrentDate(): string {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Mutation để generate mã bệnh phẩm
    const generateSampleCodeMutation = useMutation({
        mutationFn: ({ sampleTypeCode, date }: { sampleTypeCode: string; date: string }) =>
            apiClient.generateSampleReceptionCode(sampleTypeCode, date),
        onSuccess: (response) => {
            const receptionCode = response.data?.receptionCode
            if (receptionCode) {
                setSampleCode(receptionCode)
            }
        },
        onError: (error) => {
            console.error('Error generating sample code:', error)
            setSampleCode('')
        }
    })

    const { data: profileData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => apiClient.getProfile(),
        staleTime: 5 * 60 * 1000,
    })
    const currentUserId = profileData?.data?.id

    // Mutation để tạo mã tiếp nhận
    const createSampleReceptionMutation = useMutation({
        mutationFn: (sampleTypeCode: string) =>
            apiClient.createSampleReception({ sampleTypeCode }),
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
            sampleCollectionTime: string;
            collectedByUserId: string;
            saveRawJson: boolean;
        }) => apiClient.storeServiceRequest(body),
        onSuccess: () => {
            console.log('✅ Lưu chỉ định xét nghiệm thành công!')
            toast({
                title: "Thành công",
                description: "✅ Lưu chỉ định xét nghiệm thành công!",
                variant: "default",
            })
            // Reset form after successful save
            setTimeout(() => {
                clearAll()
            }, 500)
        },
        onError: (error) => {
            console.error('❌ Lỗi khi lưu chỉ định:', error)
            toast({
                title: "Lỗi",
                description: `❌ Lỗi khi lưu chỉ định: ${error instanceof Error ? error.message : 'Không xác định'}`,
                variant: "destructive",
            })
        }
    })

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
            // Bước 1: Tạo mã tiếp nhận
            console.log("📝 Đang tạo mã tiếp nhận...");
            const receptionResponse = await createSampleReceptionMutation.mutateAsync(
                selectedType.typeCode
            );

            if (!receptionResponse.success || !receptionResponse.data?.receptionCode) {
                toast({
                    title: "Lỗi",
                    description: "❌ Không tạo được mã tiếp nhận",
                    variant: "destructive",
                })
                return;
            }

            const receptionCode = receptionResponse.data.receptionCode;
            console.log("✅ Đã tạo mã tiếp nhận:", receptionCode);

            // Bước 2: Lưu chỉ định xét nghiệm
            console.log("💾 Đang lưu chỉ định...");
            const body = {
                serviceReqCode: serviceCodeToSave,
                currentRoomId: tabRoomId,
                currentDepartmentId: tabDepartmentId,
                receptionCode: receptionCode,
                sampleCollectionTime: new Date().toISOString(),
                collectedByUserId: currentUserId,
                saveRawJson: false,
            };

            await storeServiceRequestMutation.mutateAsync(body);
            console.log("✅ Lưu thành công!");

            // Hiển thị thông báo thành công
            toast({
                title: "Thành công",
                description: "✅ Đã lưu chỉ định xét nghiệm thành công!",
            });

            // Bước 3: Reset form
            clearAll();

            // Bước 4: Reload trang để cập nhật dữ liệu
            setTimeout(() => {
                window.location.reload();
            }, 1000); // Delay 1s để user thấy toast trước khi reload
        } catch (error) {
            console.error("❌ Lỗi:", error);
            toast({
                title: "Lỗi",
                description: `❌ Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Không xác định'}`,
                variant: "destructive",
            })
        }
    }

    // Tự động gọi API khi chọn sample type và có service request
    useEffect(() => {
        if (selectedSampleType && serviceRequest) {
            const selectedType = sampleTypeItems.find(item => item.id === selectedSampleType)
            if (selectedType?.typeCode) {
                const currentDate = getCurrentDate()
                generateSampleCodeMutation.mutate({
                    sampleTypeCode: selectedType.typeCode,
                    date: currentDate
                })
            }
        } else {
            setSampleCode('')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSampleType, serviceRequest, sampleTypeItems])

    return (
        <div className="flex h-full">
            {/* Sidebar - 1/4 màn hình */}
            <div className="w-1/4 border-r border-gray-200 bg-gray-50">
                <ServiceRequestsSidebar
                    onSelect={handleSelectFromList}
                    selectedCode={searchCode || serviceReqCode}
                />
            </div>

            {/* Main Content - 3/4 màn hình */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
                {!tabRoomId && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-sm font-medium text-yellow-900">
                            ⚠️ Chưa chọn phòng làm việc. Vui lòng chọn phòng trước khi lưu.
                        </div>
                    </div>
                )}

                {/* Controls area: keep SID and specimen select isolated from patient inputs */}
                <div className="controls sticky top-0 z-20 flex flex-col md:flex-row md:items-end gap-3 md:gap-4 mb-4 pt-4 pb-4 bg-white border-b border-gray-300">
                    <div className="w-full md:w-1/3 flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">Bước 1: Mã y lệnh</Label>
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
                    <Label className="text-sm font-medium">Bước 2: Chọn bệnh phẩm</Label>
                    <Select value={selectedSampleType} onValueChange={setSelectedSampleType} open={selectOpen} onOpenChange={setSelectOpen}>
                        <SelectTrigger ref={sampleTriggerRef}>
                            <SelectValue placeholder="Chọn bệnh phẩm" />
                        </SelectTrigger>
                        <SelectContent>
                            {sampleTypeItems?.length
                                ? sampleTypeItems.map((sampleType) => (
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
                    <Label className="text-sm font-medium">Mã bệnh phẩm</Label>
                    <Input value={sampleCode} disabled/>
                    {generateSampleCodeMutation.isPending && (
                        <span className="text-xs text-gray-500">Đang tạo mã bệnh phẩm...</span>
                    )}
                    {generateSampleCodeMutation.isError && (
                        <span className="text-xs text-red-600">
                            Lỗi: {generateSampleCodeMutation.error instanceof Error ? generateSampleCodeMutation.error.message : 'Không thể tạo mã bệnh phẩm'}
                        </span>
                    )}
                </div>
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
                            onClick={handleSave}
                            disabled={
                                !selectedSampleType ||
                                !tabRoomId ||
                                !tabDepartmentId ||
                                !(searchCode || serviceReqCode) ||
                                !currentUserId ||
                                createSampleReceptionMutation.isPending ||
                                storeServiceRequestMutation.isPending
                            }
                        >
                            {createSampleReceptionMutation.isPending || storeServiceRequestMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {createSampleReceptionMutation.isPending
                                        ? 'Đang tạo mã tiếp nhận...'
                                        : 'Đang lưu...'}
                                </>
                            ) : (
                                'Lưu'
                            )}
                        </Button>
                        <Button variant={'destructive'} onClick={clearAll}>Hủy</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
