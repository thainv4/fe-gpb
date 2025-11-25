'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { FormTemplate } from '@/components/test-results/form-export-pdf/form-template';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export default function PreviewPage() {
    const params = useParams();
    const storedServiceReqId = params.serviceReqCode as string;
    const componentRef = useRef<HTMLDivElement>(null);

    const { data: storedServiceRequestData, isLoading } = useQuery({
        queryKey: ['stored-service-request-preview', storedServiceReqId],
        queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId),
        enabled: !!storedServiceReqId,
    });

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Phieu_xet_nghiem_${storedServiceRequestData?.data?.serviceReqCode || storedServiceReqId}`,
        pageStyle: `
            @page {
                size: A4;
                margin: 0;
            }
            @media print {
                body {
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!storedServiceRequestData?.data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600">Không tìm thấy dữ liệu</p>
                </div>
            </div>
        );
    }

    const handleDownloadPdf = async () => {
        if (!componentRef.current) return;

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = componentRef.current;

            // Render với scale cao để đảm bảo chất lượng tốt nhất
            const canvas = await html2canvas(element, {
                scale: 3, // Scale x3 cho chất lượng cao
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            } as any);

            // Sử dụng JPEG với quality cao để giảm kích thước file
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: false // Không compress để giữ chất lượng
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Thêm trang đầu tiên
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;

            // Nếu nội dung dài hơn 1 trang, thêm các trang tiếp theo
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
                heightLeft -= pageHeight;
            }

            const fileName = `Phieu_XN_${storedServiceRequestData?.data?.patientCode}_${storedServiceRequestData?.data?.serviceReqCode}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Có lỗi xảy ra khi tải PDF');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Action Bar */}
                <div className="mb-6 flex justify-end print:hidden bg-white rounded-lg shadow-md p-4">
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Tải PDF
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            In PDF
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div ref={componentRef}>
                    <FormTemplate data={storedServiceRequestData.data} />
                </div>
            </div>
        </div>
    );
}

