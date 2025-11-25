'use client';

import {useEffect, useState} from "react";
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

export default function TestResultForm() {
    const pathname = usePathname()
    const {setTabData, getTabData} = useTabsStore()
    const {toast} = useToast()
    const [selectedServiceReqCode, setSelectedServiceReqCode] = useState<string>('')
    const [storedServiceReqId, setStoredServiceReqId] = useState<string>('')

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

    const serviceRequest = serviceRequestData?.data
    const patient = serviceRequest?.patient
    const storedServiceRequest = storedServiceRequestData?.data
    const services = storedServiceRequest?.services || []

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

    // Handler xuất PDF - Mở trang preview
    const handleExportPdf = () => {
        if (!storedServiceReqId) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng chọn một phiếu xét nghiệm"
            })
            return
        }

        // Mở trang preview trong tab mới
        const previewUrl = `/test-results/preview/${storedServiceReqId}`;
        window.open(previewUrl, '_blank');
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
                                            <Input value={patient?.code || ''} disabled className="mt-1 font-semibold"/>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-gray-600">Họ và tên bệnh nhân</Label>
                                            <Input value={patient?.name || ''} disabled className="mt-1 font-semibold"/>
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
                                            Danh sách dịch vụ
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
                                                            Thao tác
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
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                                <button
                                                                    onClick={() => handleExportPdf()}
                                                                    disabled={!storedServiceReqId}
                                                                    className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
                                                                    title="Xem trước phiếu xét nghiệm"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

    )
}

