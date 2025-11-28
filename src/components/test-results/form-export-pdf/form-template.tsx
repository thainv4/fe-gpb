'use client';

import React from 'react';
import { StoredServiceRequestResponse, StoredService } from '@/lib/api/client';

interface FormTemplateProps {
    data: StoredServiceRequestResponse;
    specificService?: StoredService; // Service cụ thể để hiển thị resultText
}

// Helper function to calculate age from DOB
function calculateAge(dob: number): number {
    const dobStr = dob.toString();
    const year = Number.parseInt(dobStr.substring(0, 4), 10);
    const currentYear = new Date().getFullYear();
    return currentYear - year;
}

export function FormTemplate({ data, specificService }: FormTemplateProps) {
    const {
        patientCode,
        patientName,
        patientDob,
        patientGenderName,
        patientAddress,
        treatmentCode,
        requestDepartmentName,
        requestRoomName,
        icdCode,
        icdName,
        serviceReqCode
    } = data;

    const age = calculateAge(patientDob);

    // Chỉ lấy resultText từ specificService (API /api/v1/service-requests/stored/services/{serviceId})
    const resultText = specificService?.resultText || '';

    // Use receptionCode from the specific service as the sample code (Mã bệnh phẩm)
    const receptionCode = specificService?.receptionCode || '';

    return (
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg">
            <div className="p-10 text-[15px] text-black">
                {/* HEADER */}
                <div className="flex justify-between items-start mb-4">
                    {/* Logo and Hospital Info */}
                    <div className="flex flex-1 items-center gap-4">
                        <img src='/logo-bvbm-wh.png' alt='logo-bvbm' className='w-2/12'/>
                        <div className="text-sm text-gray-700 leading-tight space-y-1 text-center">
                            <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
                            <div className="text-xs">TRUNG TÂM GIẢI PHẪU BỆNH</div>
                            <div className="text-xs font-semibold">KHOA TẾ BÀO HỌC</div>
                        </div>
                    </div>

                    {/* Patient Code Info */}
                    <div className="text-left text-sm leading-tight space-y-1 p-3 rounded">
                        <div><span className="font-semibold text-gray-700">Mã ID:</span> <span className="font-bold">{serviceReqCode}</span></div>
                        <div><span className="font-semibold text-gray-700">Mã BN:</span> <span className="font-bold">{patientCode}</span></div>
                        <div><span className="font-semibold text-gray-700">Mã ĐT:</span> <span className="font-bold">{treatmentCode}</span></div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-center font-bold text-2xl uppercase mt-6 mb-6">
                     Phiếu xét nghiệm sinh thiết
                </h1>

                {/* Patient Info Section */}
                <div className="mt-6 mb-3 p-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex flex-wrap gap-x-14">
                            <span className="flex-shrink-0">
                                <span className="text-gray-600">Họ và tên:</span>
                                <span className="font-bold ml-2">{patientName}</span>
                            </span>
                            <span>
                                <span className="text-gray-600">Tuổi:</span>
                                <span className="font-semibold ml-2">{age}</span>
                            </span>
                            <span>
                                <span className="text-gray-600">Giới tính:</span>
                                <span className="font-semibold ml-2">{patientGenderName}</span>
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-600">Địa chỉ:</span>
                            <span className="ml-2">{patientAddress}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-16">
                            <span>
                                <span className="text-gray-600">Viện/Khoa:</span>
                                <span className="font-semibold ml-2">{requestDepartmentName}</span>
                            </span>
                            <span>
                                <span className="text-gray-600">Phòng:</span>
                                <span className="font-semibold ml-2">{requestRoomName}</span>
                            </span>
                        </div>

                        <div>
                            <span className="text-gray-600">Mã bệnh phẩm:</span>
                            <span className="ml-2 font-semibold">{receptionCode}</span>

                        </div>

                        <div>
                            <span className="text-gray-600">Chẩn đoán lâm sàng:</span>
                            <span className="ml-2 font-semibold text-red-700">{icdCode} - {icdName}</span>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="mb-2">
                    <h2 className="text-center font-bold text-lg uppercase py-2">
                        KẾT QUẢ
                    </h2>

                    {resultText ? (
                        <div
                            className="mt-4 prose prose-sm max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: resultText }}
                        />
                    ) : (
                        <div className="mt-4 p-8 text-gray-400 italic text-center border-2 border-dashed border-gray-300 rounded">
                            Chưa có kết quả xét nghiệm
                        </div>
                    )}
                </div>

                {/* Signature Section */}
                <div className="mt-16 flex justify-end mr-10">
                    <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1 border-t border-gray-400 px-10">
                            Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                        </div>
                        <div className="font-bold text-base mb-12">Bác sĩ đọc kết quả</div>

                    </div>
                </div>
            </div>
        </div>
    );
}
