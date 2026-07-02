'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ResultForm, RESULT_FORM_TYPE_GPB, RESULT_FORM_TYPE_GEN1 } from '@/components/test-results/form-export-pdf';
import { GenResultSheet } from '@/components/test-results/gen-result-sheet';
import { buildGenResultValues, EMPTY_GEN_RESULT_VALUES } from '@/components/test-results/gen-result-types';
import { useMemo, useRef } from 'react';
import type { StoredService } from '@/lib/api/client';
import { useReactToPrint } from 'react-to-print';

export default function PreviewPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const storedServiceReqId = params.serviceReqCode as string;
    const serviceIdParam = searchParams.get('serviceId');
    const formTypeParam = searchParams.get('formType');
    const formType = formTypeParam ? Number(formTypeParam) : RESULT_FORM_TYPE_GPB;
    const isGenPreview = formType === RESULT_FORM_TYPE_GEN1;
    const componentRef = useRef<HTMLDivElement>(null);

    const { data: storedServiceRequestData, isLoading: isLoadingRequest } = useQuery({
        queryKey: ['stored-service-request-preview', storedServiceReqId],
        queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId),
        enabled: !!storedServiceReqId,
    });

    const serviceIdFromList = useMemo(() => {
        const services = storedServiceRequestData?.data?.services;
        if (!services?.length) return null;
        if (serviceIdParam && services.some((s) => s.id === serviceIdParam)) {
            return serviceIdParam;
        }
        if (isGenPreview && services.length >= 1) {
            return services[0].id;
        }
        return serviceIdParam;
    }, [storedServiceRequestData?.data?.services, serviceIdParam, isGenPreview]);

    const serviceFromList = useMemo((): StoredService | undefined => {
        const services = storedServiceRequestData?.data?.services;
        if (!services?.length || !serviceIdFromList) return undefined;
        return services.find((s) => s.id === serviceIdFromList);
    }, [storedServiceRequestData?.data?.services, serviceIdFromList]);

    const { data: serviceData, isLoading: isLoadingService } = useQuery({
        queryKey: ['stored-service-detail', serviceIdFromList],
        queryFn: () => apiClient.getStoredServiceById(serviceIdFromList!),
        enabled: !!serviceIdFromList,
    });

    const specificService = serviceData?.data ?? serviceFromList;

    const genPreviewValues = useMemo(
        () => (specificService ? buildGenResultValues(specificService) : EMPTY_GEN_RESULT_VALUES),
        [specificService],
    );

    const isLoading =
        isLoadingRequest || (!!serviceIdFromList && isLoadingService && !serviceFromList);

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

            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            } as Parameters<typeof html2canvas>[1]);

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: false,
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

            const fileName = `Phieu_XN_${storedServiceRequestData?.data?.patientCode}_${storedServiceRequestData?.data?.serviceReqCode}.pdf`;
            pdf.save(fileName);
        } catch {
            alert('Có lỗi xảy ra khi tải PDF');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-6 flex justify-end print:hidden bg-white rounded-lg shadow-md p-4">
                    <div className="flex gap-3">
                        {!isGenPreview && (
                            <button
                                onClick={handleDownloadPdf}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-md"
                            >
                                Tải PDF
                            </button>
                        )}
                        <button
                            onClick={() => handlePrint()}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md"
                        >
                            In
                        </button>
                    </div>
                </div>

                <div ref={componentRef}>
                    {isGenPreview && specificService ? (
                        <GenResultSheet
                            stored={storedServiceRequestData.data}
                            service={specificService}
                            values={genPreviewValues}
                            onChange={() => {}}
                            readOnly
                        />
                    ) : (
                        <ResultForm
                            data={storedServiceRequestData.data}
                            specificService={specificService}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
