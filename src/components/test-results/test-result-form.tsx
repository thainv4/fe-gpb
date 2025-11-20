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

export default function TestResultForm() {
    const pathname = usePathname()
    const {setTabData, getTabData} = useTabsStore()
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

    const serviceRequest = serviceRequestData?.data
    const patient = serviceRequest?.patient

    const handleSelect = (serviceReqCode: string, reqId?: string) => {
        setSelectedServiceReqCode(serviceReqCode)
        if (reqId) {
            setStoredServiceReqId(reqId)
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
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Lưu kết quả
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

