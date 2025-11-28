'use client';

import {useEffect, useState, useRef} from "react";
import {useTabsStore} from "@/lib/stores/tabs";
import {usePathname} from "next/navigation";
import {ServiceRequestsSidebar} from "@/components/service-requests-sidebar/service-requests-sidebar";
import {useQuery} from "@tanstack/react-query";
import {apiClient} from "@/lib/api/client";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {useToast} from "@/hooks/use-toast";
import {CheckCircle2, XCircle} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {FormTemplate} from "@/components/test-results/form-export-pdf/form-template";
import {Button} from "@/components/ui/button";

export default function TestResultForm() {
    const pathname = usePathname()
    const {setTabData, getTabData, activeKey, tabs} = useTabsStore()
    const {toast} = useToast()
    const [selectedServiceReqCode, setSelectedServiceReqCode] = useState<string>('')
    const [storedServiceReqId, setStoredServiceReqId] = useState<string>('')
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
    const [previewServiceId, setPreviewServiceId] = useState<string | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)

    // Single rich text editor state with template
    const defaultTemplate = `
        <h2>1. NHẬN XÉT ĐẠI THỂ:</h2>
        <p></p>
        
        <h2>2. MÔ TẢ VI THỂ:</h2>
        <p></p>
        
        <h2>3. CHẨN ĐOÁN MÔ BỆNH HỌC:</h2>
        <p></p>
        
        <h2>4. BÀN LUẬN:</h2>
        <p></p>
        
        <h2>5. KHUYẾN NGHỊ:</h2>
        <p></p>
        
        <h2>6. HỘI CHẨN:</h2>
        <p></p>
    `
    const [testResult, setTestResult] = useState<string>(defaultTemplate)
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
    const [isSaving, setIsSaving] = useState(false)

    // Restore tab state on mount
    useEffect(() => {
        const savedData = getTabData(pathname)
        if (savedData) {
            if (savedData.selectedServiceReqCode) setSelectedServiceReqCode(savedData.selectedServiceReqCode)
            if (savedData.storedServiceReqId) setStoredServiceReqId(savedData.storedServiceReqId)
        }
    }, [pathname, getTabData])

    // Save tab state whenever data changes
    useEffect(() => {
        setTabData(pathname, {
            selectedServiceReqCode,
            storedServiceReqId
        })
    }, [pathname, setTabData, selectedServiceReqCode, storedServiceReqId])

    // Fetch service request details when selected
    const {data: serviceRequestData, isLoading} = useQuery({
        queryKey: ['service-request', selectedServiceReqCode],
        queryFn: () => apiClient.getServiceRequestByCode(selectedServiceReqCode),
        enabled: !!selectedServiceReqCode,
        staleTime: 5 * 60 * 1000,
    })

    // Fetch stored service request with services
    const {data: storedServiceRequestData} = useQuery({
        queryKey: ['stored-service-request', storedServiceReqId],
        queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId),
        enabled: !!storedServiceReqId,
        staleTime: 5 * 60 * 1000,
    })

    // Fetch specific service for preview
    const {data: previewServiceData} = useQuery({
        queryKey: ['stored-service-detail', previewServiceId],
        queryFn: () => apiClient.getStoredServiceById(previewServiceId!),
        enabled: !!previewServiceId && previewDialogOpen,
    })

    // Lấy thông tin người dùng hiện tại
    const { data: profileData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => apiClient.getProfile(),
        staleTime: 5 * 60 * 1000,
    })

    const serviceRequest = serviceRequestData?.data
    const patient = serviceRequest?.patient
    const storedServiceRequest = storedServiceRequestData?.data
    const services = storedServiceRequest?.services || []

    // Xác định phòng/khoa hiện tại từ tab đang hoạt động
    const currentTab = (tabs as any)?.find?.((t: any) => t?.key === activeKey) ?? (tabs as any)?.[0]
    const currentRoomId = currentTab?.roomId as string | undefined
    const currentDepartmentId = currentTab?.departmentId as string | undefined
    const currentUserId = profileData?.data?.id as string | undefined

    const handleSelect = (serviceReqCode: string, storedServiceReqId?: string) => {
        setSelectedServiceReqCode(serviceReqCode)
        if (storedServiceReqId) {
            setStoredServiceReqId(storedServiceReqId)
        }
    }

    // Handler cho checkbox
    const handleServiceCheck = (serviceId: string, checked: boolean) => {
        setSelectedServices(prev => {
            const newSet = new Set(prev)
            if (checked) {
                newSet.add(serviceId)
            } else {
                newSet.delete(serviceId)
            }
            return newSet
        })
    }

    // Handler Check All
    const handleCheckAll = (checked: boolean) => {
        if (checked) {
            // Select all services
            const allServiceIds = new Set(services.map(s => s.id))
            setSelectedServices(allServiceIds)
        } else {
            // Deselect all
            setSelectedServices(new Set())
        }
    }

    // Check if all services are selected
    const isAllSelected = services.length > 0 && selectedServices.size === services.length

    // Handler mở dialog preview
    const handleOpenPreview = (serviceId: string) => {
        if (!storedServiceReqId) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng chọn một phiếu xét nghiệm"
            })
            return
        }

        setPreviewServiceId(serviceId)
        setPreviewDialogOpen(true)
    }

    const handleDownloadPdf = async () => {
        if (!previewRef.current || !storedServiceRequestData?.data || !previewServiceData?.data) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = previewRef.current;

            // Render với scale cao để đảm bảo chất lượng tốt nhất
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            } as any);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: false
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            const fileName = `Phieu_XN_${storedServiceRequestData.data.patientCode}_${storedServiceRequestData.data.serviceReqCode}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Có lỗi xảy ra khi tải PDF"
            });
        }
    }

    const handlePrintPdf = () => {
        window.print();
    }

    // Handler lưu kết quả
    const handleSaveResults = async () => {
        if (selectedServices.size === 0) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng chọn ít nhất một dịch vụ"
            })
            return
        }

        if (!testResult.trim()) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng nhập kết quả xét nghiệm"
            })
            return
        }

        if (!storedServiceRequest?.id) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không tìm thấy thông tin yêu cầu dịch vụ"
            })
            return
        }

        setIsSaving(true)
        try {
            const promises = Array.from(selectedServices).map(serviceId =>
                apiClient.saveServiceResult(storedServiceRequest.id, serviceId, {
                    resultValue: 12.5,
                    resultValueText: "12.5",
                    resultText: testResult,
                    resultStatus: 'NORMAL'
                })
            )

            await Promise.all(promises)

            // Sau khi lưu kết quả thành công, gọi API chuyển trạng thái workflow
            try {
                await apiClient.transitionWorkflow({
                    storedServiceReqId: storedServiceRequest.id,
                    toStateId: '426df256-bbfe-28d1-e065-9e6b783dd008',
                    actionType: 'COMPLETE',
                    currentUserId: currentUserId,
                    currentDepartmentId: currentDepartmentId,
                    currentRoomId: currentRoomId,
                })
            } catch (err) {
                console.error('Error transitioning workflow:', err)
                // Không chặn luồng lưu kết quả; thông báo cảnh báo cho người dùng
                toast({
                    variant: 'destructive',
                    title: 'Cảnh báo',
                    description: 'Đã lưu kết quả nhưng không thể cập nhật trạng thái quy trình.'
                })
            }
            toast({
                title: "Thành công",
                description: `Đã lưu kết quả cho ${selectedServices.size} dịch vụ`,
                variant: "default"
            })
            setSelectedServices(new Set())
            setTestResult(defaultTemplate)
        } catch (error) {
            console.error('Error saving results:', error)
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Có lỗi xảy ra khi lưu kết quả"
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader className={'border-b border-gray-200'}>
                    <CardTitle className="text-2xl font-bold">Kết quả xét nghiệm sinh thiết</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-full">
                        {/* Sidebar - 1/4 màn hình */}
                        <div className="w-1/4 border-r border-gray-200 bg-gray-50">
                            <ServiceRequestsSidebar
                                onSelect={handleSelect}
                                selectedCode={selectedServiceReqCode}
                            />
                        </div>

                        {/* Main Content - 3/4 màn hình */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {!selectedServiceReqCode && (
                                <div className="text-center text-gray-500 py-12">
                                    Vui lòng chọn một yêu cầu dịch vụ từ danh sách bên trái
                                </div>
                            )}

                            {selectedServiceReqCode && isLoading && (
                                <div className="text-center text-gray-500 py-12">
                                    Đang tải dữ liệu...
                                </div>
                            )}

                            {selectedServiceReqCode && !isLoading && serviceRequest && (
                                <div className="space-y-6">
                                    {/* Patient Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                        <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200">
                                            Thông tin bệnh nhân
                                        </h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-sm text-gray-600">Mã Y lệnh</Label>
                                                <Input value={serviceRequest.serviceReqCode || ''} disabled
                                                       className="mt-1 font-semibold"/>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-600">Mã bệnh nhân</Label>
                                                <Input value={patient?.code || ''} disabled
                                                       className="mt-1 font-semibold"/>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-600">Họ và tên bệnh nhân</Label>
                                                <Input value={patient?.name || ''} disabled
                                                       className="mt-1 font-semibold"/>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-600">Ngày sinh</Label>
                                                <Input
                                                    value={patient?.dob ? `${String(patient.dob).substring(6, 8)}/${String(patient.dob).substring(4, 6)}/${String(patient.dob).substring(0, 4)}` : ''}
                                                    disabled className="mt-1 font-semibold"/>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-600">Giới tính</Label>
                                                <Input value={patient?.genderName || ''} disabled
                                                       className="mt-1 font-semibold"/>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-600">Địa chỉ</Label>
                                                <Input value={patient?.address || ''} disabled
                                                       className="mt-1 font-semibold"/>
                                            </div>
                                            <div className="col-span-3">
                                                <Label className="text-sm text-gray-600">Chẩn đoán</Label>
                                                <Input value={serviceRequest.icdName || ''} disabled
                                                       className="mt-1 font-semibold"/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Services Table */}
                                    {storedServiceReqId && services.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                            <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200">
                                                Chọn danh sách dịch vụ để trả kết quả
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <Input
                                                                type="checkbox"
                                                                checked={isAllSelected}
                                                                onChange={(e) => handleCheckAll(e.target.checked)}
                                                                title="Chọn tất cả"
                                                            />
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            STT
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Mã dịch vụ
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Tên dịch vụ
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Đơn giá
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Mã tiếp nhận
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Trạng thái
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Xem phiếu
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                    {services.map((service, index) => (
                                                        <tr key={service.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                <Input
                                                                    type="checkbox"
                                                                    checked={selectedServices.has(service.id)}
                                                                    onChange={(e) => handleServiceCheck(service.id, e.target.checked)}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {index + 1}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                                {service.serviceCode}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                                {service.serviceName}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                                {service.price.toLocaleString('vi-VN')} đ
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                                {service.receptionCode || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-center">
                                                                {service.resultText ? (
                                                                    <span
                                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <CheckCircle2 className="w-3.5 h-3.5"/>
                                                                        Đã có kết quả
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                                        <XCircle className="w-3.5 h-3.5"/>
                                                                        Chưa có kết quả
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                                <button
                                                                    onClick={() => handleOpenPreview(service.id)}
                                                                    disabled={!storedServiceReqId}
                                                                    className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
                                                                    title="Xem trước kết quả dịch vụ này"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none"
                                                                         stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round"
                                                                              strokeLinejoin="round" strokeWidth={2}
                                                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                        <path strokeLinecap="round"
                                                                              strokeLinejoin="round" strokeWidth={2}
                                                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Test Results */}
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                        <h3 className="text-lg font-semibold mb-4 pb-3 border-b border-gray-200">
                                            Kết quả xét nghiệm
                                        </h3>

                                        <div className="w-full">
                                            <RichTextEditor
                                                value={testResult}
                                                onChange={setTestResult}
                                                placeholder="Nhập kết quả xét nghiệm..."
                                                minHeight="600px"
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveResults}
                                            disabled={isSaving || selectedServices.size === 0}
                                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-[70vw] max-h-[95vh] p-0 gap-0">
                    <DialogHeader className="px-6 py-4 border-b bg-gray-50">
                        <div className="flex items-center justify-between mx-8">
                            <DialogTitle className="text-xl font-semibold">
                                Xem trước kết quả xét nghiệm
                            </DialogTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownloadPdf}
                                    disabled={!storedServiceRequestData?.data || !previewServiceData?.data}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                    </svg>
                                    Tải PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrintPdf}
                                    disabled={!storedServiceRequestData?.data || !previewServiceData?.data}
                                    className="flex items-center gap-2 bg-white hover:bg-gray-50"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                                    </svg>
                                    In PDF
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto p-6 bg-gray-100" style={{maxHeight: 'calc(95vh - 80px)'}}>
                        {storedServiceRequestData?.data && previewServiceData?.data && (
                            <div ref={previewRef} className="mx-auto">
                                <FormTemplate
                                    data={storedServiceRequestData.data}
                                    specificService={previewServiceData.data}
                                />
                            </div>
                        )}

                        {!previewServiceData?.data && previewDialogOpen && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div
                                        className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-6 text-gray-600 text-lg">Đang tải dữ liệu...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

