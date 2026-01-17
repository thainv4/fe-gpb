'use client';

import {useEffect, useState, useRef} from "react";
import {useTabsStore} from "@/lib/stores/tabs";
import {usePathname} from "next/navigation";
import {useTabPersistence} from "@/hooks/use-tab-persistence";
import {ServiceRequestsSidebar} from "@/components/service-requests-sidebar/service-requests-sidebar";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {apiClient} from "@/lib/api/client";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {useToast} from "@/hooks/use-toast";
import {CheckCircle2, XCircle, Loader2} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {FormTemplate} from "@/components/test-results/form-export-pdf/form-template";
import {Button} from "@/components/ui/button";
import {useHisStore} from "@/lib/stores/his";
import {downloadPdfFromContainer, pdfBase64FromContainer} from '@/lib/utils/pdf-export';
import {ResultTemplateSelector} from "@/components/result-template/result-template-selector";

export default function TestResultForm() {
    const pathname = usePathname()
    const {setTabData, getTabData, activeKey, tabs} = useTabsStore()
    const {toast} = useToast()
    const {token: hisToken} = useHisStore()
    const queryClient = useQueryClient()
    const [selectedServiceReqCode, setSelectedServiceReqCode] = useState<string>('')
    const [storedServiceReqId, setStoredServiceReqId] = useState<string>('')
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
    const [previewServiceId, setPreviewServiceId] = useState<string | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)

    // Digital signature states
    const [signerInfo, setSignerInfo] = useState({
        signerId: '',
        serialNumber: '',
    })
    const [isSigning, setIsSigning] = useState(false)

    // Template selector dialog state
    const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)

    // Confirmation dialogs state
    const [confirmSignDialogOpen, setConfirmSignDialogOpen] = useState(false)
    const [confirmCancelSignDialogOpen, setConfirmCancelSignDialogOpen] = useState(false)

    // Default templates with HTML format (bold titles and indented content)
    const defaultResultDescription = `<p style="padding-left: 0; margin-left: 0;"><strong>NHẬN XÉT ĐẠI THỂ:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p><p style="padding-left: 20px;"></p>`
    const defaultResultConclude = `<p style="padding-left: 0; margin-left: 0;"><strong>CHẨN ĐOÁN MÔ BỆNH HỌC:</strong></p><p style="padding-left: 20px;"></p>`
    const defaultResultNote = `<p style="padding-left: 0; margin-left: 0;"><strong>BÀN LUẬN:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>KHUYẾN NGHỊ:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>HỘI CHẨN:</strong></p><p style="padding-left: 20px;"></p>`
    
    const [resultDescription, setResultDescription] = useState<string>(defaultResultDescription)
    const [resultConclude, setResultConclude] = useState<string>(defaultResultConclude)
    const [resultNote, setResultNote] = useState<string>(defaultResultNote)
    const [resultName, setResultName] = useState<string>('')
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
    const [isSaving, setIsSaving] = useState(false)
    const [signaturePageTotal, setSignaturePageTotal] = useState(1)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Tab persistence hook
    const { scrollContainerRef } = useTabPersistence(
        {
            selectedServiceReqCode,
            storedServiceReqId,
            resultDescription,
            resultConclude,
            resultNote,
            resultName,
            selectedServices: Array.from(selectedServices), // Convert Set to Array for serialization
        },
        {
            saveScroll: true,
            debounceMs: 500,
            onRestore: (data) => {
                if (data.selectedServiceReqCode) setSelectedServiceReqCode(data.selectedServiceReqCode)
                if (data.storedServiceReqId) setStoredServiceReqId(data.storedServiceReqId)
                if (data.resultDescription) setResultDescription(data.resultDescription)
                if (data.resultConclude) setResultConclude(data.resultConclude)
                if (data.resultNote) setResultNote(data.resultNote)
                if (data.resultName !== undefined) setResultName(data.resultName)
                if (data.selectedServices) setSelectedServices(new Set(data.selectedServices))
            },
        }
    )

    // Fetch service request details when selected
    const {data: serviceRequestData, isLoading, refetch: refetchServiceRequest} = useQuery({
        queryKey: ['service-request', selectedServiceReqCode, refreshTrigger],
        queryFn: () => apiClient.getServiceRequestByCode(selectedServiceReqCode),
        enabled: !!selectedServiceReqCode,
        staleTime: 0, // Disable stale time để luôn fetch fresh data
    })

    // Fetch stored service request with services
    const {data: storedServiceRequestData, refetch: refetchStoredServiceRequest} = useQuery({
        queryKey: ['stored-service-request', storedServiceReqId, refreshTrigger],
        queryFn: () => apiClient.getStoredServiceRequest(storedServiceReqId),
        enabled: !!storedServiceReqId,
        staleTime: 0, // Disable stale time để luôn fetch fresh data
    })

    // useEffect để refresh sidebar khi refreshTrigger thay đổi
    useEffect(() => {
        if (refreshTrigger > 0) {
            // Refetch các queries để cập nhật dữ liệu
            refetchServiceRequest()
            refetchStoredServiceRequest()
        }
    }, [refreshTrigger, refetchServiceRequest, refetchStoredServiceRequest])

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

    // Handler khi chọn mẫu kết quả (backward compatibility - không dùng nữa, dùng onSelectFields)
    const handleTemplateSelect = (_templateContent: string, _templateName: string) => {
        // Không sử dụng nữa, dùng handleTemplateSelectFields thay thế
    }
    
    // Handler khi chọn mẫu kết quả với 3 fields riêng biệt
    const handleTemplateSelectFields = (resultDescription: string, resultConclude: string, resultNote: string, templateName: string) => {
        setResultDescription(resultDescription || defaultResultDescription)
        setResultConclude(resultConclude || defaultResultConclude)
        setResultNote(resultNote || defaultResultNote)
        setResultName(templateName)
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

    // Helper function để extract error message từ API response
    const getErrorMessage = (response: any, defaultMessage: string = "Có lỗi xảy ra"): string => {
        if (response?.message) return String(response.message)
        if (response?.error) {
            if (typeof response.error === 'string') return response.error
            if (typeof response.error === 'object' && response.error !== null && 'message' in response.error) {
                return String(response.error.message)
            }
        }
        return defaultMessage
    }

    // Helper function để format thời gian theo format yyyyMMddHHmmss cho HIS-PACS
    const formatDateTimeForHisPacs = (date: Date = new Date()): number => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return Number.parseInt(`${year}${month}${day}${hours}${minutes}${seconds}`, 10);
    }

    // Helper function để chuyển HTML thành text có format (giữ xuống dòng)
    const htmlToFormattedText = (html: string): string => {
        if (!html) return '';
        
        if (typeof globalThis.window !== 'undefined') {
            // Tạo một DOM element tạm thời để parse HTML
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            
            // Thay thế các block elements và <br> bằng ký tự xuống dòng
            const blockElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'tr', 'td', 'th'];
            
            // Clone node tree để tránh modify DOM trực tiếp
            const walker = document.createTreeWalker(
                tmp,
                NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
                null
            );
            
            const nodesToProcess: Array<{ element: Element; insertBr: boolean }> = [];
            let node;
            
            while ((node = walker.nextNode())) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    const tagName = element.tagName.toLowerCase();
                    
                    if (tagName === 'br') {
                        // Thay thế <br> bằng text node với ký tự xuống dòng
                        nodesToProcess.push({ element, insertBr: true });
                    } else if (blockElements.includes(tagName)) {
                        // Thêm xuống dòng trước và sau block element
                        nodesToProcess.push({ element, insertBr: false });
                    }
                }
            }
            
            // Xử lý ngược lại để tránh ảnh hưởng đến index
            const reversedNodes = [...nodesToProcess].reverse();
            reversedNodes.forEach(({ element, insertBr }) => {
                if (insertBr) {
                    // Thay thế <br> bằng text node
                    const textNode = document.createTextNode('\n');
                    element.parentNode?.replaceChild(textNode, element);
                } else {
                    // Thêm text node với xuống dòng trước và sau block element
                    const brBefore = document.createTextNode('\n');
                    const brAfter = document.createTextNode('\n');
                    element.parentNode?.insertBefore(brBefore, element);
                    element.appendChild(brAfter);
                }
            });
            
            // Lấy textContent để lấy text với các ký tự xuống dòng đã được thêm
            let text = tmp.textContent || '';
            
            // Xử lý HTML entities
            text = text
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&apos;/g, "'");
            
            // Clean up: loại bỏ các xuống dòng và khoảng trắng thừa nhưng giữ format cơ bản
            text = text
                .replace(/\n{3,}/g, '\n\n')        // Tối đa 2 xuống dòng liên tiếp
                .replace(/([ \t]){3,}/g, '  ')     // Tối đa 2 khoảng trắng liên tiếp
                .replace(/^\s+|\s+$/g, '')         // Loại bỏ khoảng trắng đầu cuối
                .replace(/\n\s+\n/g, '\n\n');      // Loại bỏ khoảng trắng giữa các đoạn
            
            return text;
        }
        
        // Fallback cho server-side: dùng regex
        return html
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<h[1-6][^>]*>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<li[^>]*>/gi, '\n• ')
            .replace(/<\/li>/gi, '')
            .replace(/<ul[^>]*>/gi, '\n')
            .replace(/<\/ul>/gi, '\n')
            .replace(/<ol[^>]*>/gi, '\n')
            .replace(/<\/ol>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/\n{3,}/g, '\n\n')
            .replace(/([ \t]){3,}/g, '  ')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\n\s+\n/g, '\n\n');
    }

    // Helper function để lấy Conclude text từ resultConclude state
    const getConcludeText = (): string => {
        if (!resultConclude) return '';
        return htmlToFormattedText(resultConclude);
    }

    // Helper function để strip HTML tags (sử dụng htmlToFormattedText)
    const stripHtml = (html: string | null | undefined): string => {
        if (!html) return '';
        return htmlToFormattedText(html);
    }

    // Handler khi click vào dịch vụ để chọn dịch vụ
    const handleServiceClick = async (serviceId: string) => {
        if (!storedServiceReqId) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng chọn một phiếu xét nghiệm"
            })
            return
        }

        // Chọn dịch vụ
        setSelectedServices(new Set([serviceId]))
        
        // Load kết quả từ API /api/v1/service-requests/stored/services/{serviceId}/result
        try {
            const resultResponse = await apiClient.getServiceResult(serviceId)
            if (resultResponse.success && resultResponse.data) {
                const data = resultResponse.data
                // Set các field từ response, nếu null/empty thì dùng default
                setResultDescription(data.resultDescription || defaultResultDescription)
                setResultConclude(data.resultConclude || defaultResultConclude)
                setResultNote(data.resultNote || defaultResultNote)
                setResultName(data.resultName || '')
            } else {
                // Nếu không có kết quả, reset về default templates
                setResultDescription(defaultResultDescription)
                setResultConclude(defaultResultConclude)
                setResultNote(defaultResultNote)
                setResultName('')
            }
        } catch (error) {
            // Nếu có lỗi, reset về default templates
            setResultDescription(defaultResultDescription)
            setResultConclude(defaultResultConclude)
            setResultNote(defaultResultNote)
            setResultName('')
        }
    }

    const handleDownloadPdf = async () => {
        if (!previewRef.current || !storedServiceRequestData?.data || !previewServiceData?.data) return;

        try {
            const fileName = `Phieu_XN_${storedServiceRequestData.data.patientCode}_${storedServiceRequestData.data.serviceReqCode}.pdf`;
            await downloadPdfFromContainer(previewRef.current, fileName);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Có lỗi xảy ra khi tải PDF"
            });
        }
    };

    const handlePrintPdf = async () => {
        if (!previewRef.current || !storedServiceRequestData?.data) return;
        try {
            await downloadPdfFromContainer(
                previewRef.current,
                `Phieu_XN_${storedServiceRequestData.data.patientCode}_${storedServiceRequestData.data.serviceReqCode}.pdf`
            );
        } catch (error) {
            console.error('Error printing PDF:', error);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Có lỗi xảy ra khi in PDF"
            });
        }
    }

    // Convert PDF to base64
    const convertPdfToBase64 = async (): Promise<string | null> => {
        if (!previewRef.current || !storedServiceRequestData?.data || !previewServiceData?.data) return null;

        try {
            const {base64, pageCount} = await pdfBase64FromContainer(previewRef.current);
            setSignaturePageTotal(pageCount);
            return base64;
        } catch (error) {
            console.error('Error converting PDF to base64:', error);
            return null;
        }
    }

    // Handler ký số trực tiếp - lấy thông tin signer từ API rồi ký luôn
    const handleSignDocument = async () => {
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

        if (!tokenCode) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng đăng nhập để sử dụng tính năng ký điện tử"
            })
            return
        }

        try {
            // Gọi API để lấy thông tin signer
            const response = await apiClient.getEmrSigner(tokenCode, 'EMR', {
                Start: 0,
                Limit: 1
            })

            if (response.success && response.data?.Data && response.data.Data.length > 0) {
                const signerData = response.data.Data[0]
                const signerId = signerData.ID.toString()
                
                // Set state để hiển thị (nếu cần)
                setSignerInfo({
                    signerId: signerId,
                    serialNumber: ''
                })
                
                // Truyền signerId trực tiếp vào hàm ký số
                await handleDigitalSign(signerId)
            } else {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: getErrorMessage(response, "Không tìm thấy thông tin người ký trong hệ thống EMR")
                })
            }
        } catch (error: any) {
            console.error('Error fetching EMR signer:', error)
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error?.message || "Có lỗi xảy ra khi lấy thông tin người ký"
            })
        }
    }

    // Handler ký số - nhận signerId như parameter
    const handleDigitalSign = async (signerIdParam?: string) => {
        // Sử dụng parameter nếu có, nếu không thì dùng state
        const signerIdToUse = signerIdParam || signerInfo.signerId
        
        if (!signerIdToUse) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng nhập mã người ký"
            })
            return
        }

        if (!storedServiceRequestData?.data || !previewServiceData?.data) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không tìm thấy dữ liệu phiếu xét nghiệm"
            })
            return
        }

        // Kiểm tra trạng thái: không cho ký số nếu chưa có kết quả
        const hasResult = previewServiceData?.data?.resultText || 
                         previewServiceData?.data?.resultDescription || 
                         resultDescription.trim()
        if (!hasResult) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể ký số khi chưa có kết quả xét nghiệm"
            })
            return
        }

        if (!previewRef.current) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể tạo PDF để ký"
            })
            return
        }

        setIsSigning(true)
        try {
            // Get HIS token code from sessionStorage (saved during login)
            let tokenCode: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('hisTokenCode') : null;

            // Fallback to HIS store
            if (!tokenCode) {
                tokenCode = hisToken?.tokenCode || null;
            }

            // Fallback to localStorage if not in store
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

            // Check if we have a valid token
            if (!tokenCode) {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: "Vui lòng đăng nhập để sử dụng tính năng ký điện tử"
                })
                return
            }

            // Convert PDF to base64 và lấy số trang - SỬ DỤNG BIẾN LOCAL
            const pdfResult = await pdfBase64FromContainer(previewRef.current);
            if (!pdfResult || !pdfResult.base64) {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: "Không thể tạo file PDF để ký"
                })
                return
            }

            const { base64: pdfBase64, pageCount } = pdfResult;

            // Cập nhật state để hiển thị
            setSignaturePageTotal(pageCount);

            // Tính toạ độ chữ ký theo tỉ lệ cấu hình
            // Format ngày hiện tại thành yyyy-mm-dd
            const now = new Date()
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`
            const serviceReqCode = storedServiceRequestData.data.serviceReqCode

            const signRequest = {
                PointSign: {
                    CoorXRectangle: 460,
                    CoorYRectangle: 45,
                    PageNumber: pageCount,
                    MaxPageNumber: pageCount,
                    WidthRectangle: 150,
                    HeightRectangle: 100,
                    TextPosition: 0,
                    TypeDisplay: 2,
                    SizeFont: 11,
                    FormatRectangleText: "{SIGNTIME}"
                },
                DocumentName: `${dateStr}-${serviceReqCode}_Signed`,
                TreatmentCode: storedServiceRequestData.data.treatmentCode,
                DocumentTypeId: 22,
                DocumentGroupId: 101,
                HisCode: `SERVICE_REQ_CODE:${storedServiceRequestData.data.serviceReqCode}`,
                FileType: 0,
                OriginalVersion: {
                    Base64Data: pdfBase64
                },
                Signs: [
                    {
                        SignerId: Number.parseInt(signerIdToUse, 10), // Sử dụng signerIdToUse thay vì signerInfo.signerId
                        SerialNumber: '', // Gán serialNumber = "" như yêu cầu
                        NumOrder: pageCount,
                        // IsSigned: false
                    }
                ]
            }

            const response = await apiClient.createAndSignHsm(
                signRequest,
                tokenCode,
                'EMR'
            )

            if (response.success && response.data) {
                // Lấy documentId từ response
                const documentId = response.data?.Data?.DocumentId;

                // Nếu có documentId và serviceId, gọi API cập nhật
                if (documentId && previewServiceId) {
                    try {
                        const updateResponse = await apiClient.patchServiceRequestDocumentId(previewServiceId, documentId);
                        
                        if (!updateResponse.success) {
                            console.error('❌ Lỗi cập nhật document ID:', updateResponse);
                            toast({
                                variant: "destructive",
                                title: "Cảnh báo",
                                description: getErrorMessage(updateResponse, "Đã ký số nhưng không thể cập nhật document ID")
                            })
                        } else {
                            // Refresh danh sách services để hiển thị trạng thái "Đã ký"
                            await refetchStoredServiceRequest();

                            // Sau khi cập nhật documentId thành công, gọi API update HIS-PACS result
                            try {
                                // Lấy service data từ previewServiceData hoặc gọi API
                                let serviceData = previewServiceData?.data;
                                if (!serviceData && previewServiceId) {
                                    const serviceResponse = await apiClient.getStoredServiceById(previewServiceId);
                                    if (serviceResponse.success && serviceResponse.data) {
                                        serviceData = serviceResponse.data;
                                    }
                                }

                                // Lấy resultDescription, resultConclude, resultNote từ service data và strip HTML tags
                                const description = stripHtml(serviceData?.resultDescription || serviceData?.resultText || '');
                                const conclude = stripHtml(serviceData?.resultConclude || '');
                                const note = stripHtml(serviceData?.resultNote || '');

                                // Lấy thông tin user hiện tại
                                const executeLoginname = profileData?.data?.username || '';
                                const executeUsername = profileData?.data?.fullName || '';

                                // Lấy serviceReqCode và serviceCode
                                const tdlServiceReqCode = storedServiceRequest?.hisServiceReqCode || storedServiceRequest?.serviceReqCode || '';
                                const tdlServiceCode = serviceData?.serviceCode || previewServiceData?.data?.serviceCode || '';

                                // Chỉ gọi API nếu có đủ thông tin
                                if (tdlServiceReqCode && tdlServiceCode && tokenCode) {
                                    const hisPacsUpdateResponse = await apiClient.updateHisPacsResult(
                                        {
                                            tdlServiceReqCode,
                                            tdlServiceCode,
                                        },
                                        {
                                            ApiData: {
                                                IsCancel: false,
                                                BeginTime: null,
                                                EndTime: formatDateTimeForHisPacs(),
                                                Description: description,
                                                Conclude: conclude,
                                                Note: note,
                                                ExecuteLoginname: executeLoginname,
                                                ExecuteUsername: executeUsername,
                                                TechnicianLoginname: '',
                                                TechnicianUsername: '',
                                                MachineCode: '',
                                                NumberOfFilm: null,
                                            },
                                        },
                                        tokenCode
                                    );

                                    if (!hisPacsUpdateResponse.success) {
                                        console.error('❌ Lỗi cập nhật HIS-PACS result:', hisPacsUpdateResponse);
                                        toast({
                                            variant: 'default',
                                            title: 'Cảnh báo',
                                            description: getErrorMessage(hisPacsUpdateResponse, 'Đã ký số nhưng không thể cập nhật kết quả HIS-PACS.')
                                        });
                                    }
                                } else {
                                    console.warn('⚠️ Thiếu thông tin để gọi API HIS-PACS update:', {
                                        tdlServiceReqCode,
                                        tdlServiceCode,
                                        hasTokenCode: !!tokenCode
                                    });
                                }
                            } catch (hisPacsError: any) {
                                console.error('❌ Lỗi cập nhật HIS-PACS result:', hisPacsError);
                                toast({
                                    variant: 'default',
                                    title: 'Cảnh báo',
                                    description: hisPacsError?.message || 'Đã ký số nhưng không thể cập nhật kết quả HIS-PACS.'
                                });
                            }
                        }
                    } catch (docIdError: any) {
                        console.error('❌ Lỗi cập nhật document ID:', docIdError);
                        toast({
                            variant: "destructive",
                            title: "Cảnh báo",
                            description: docIdError?.message || "Đã ký số nhưng không thể cập nhật document ID"
                        })
                    }
                }

                // Sau khi ký số thành công, gọi API chuyển trạng thái workflow
                if (storedServiceRequest?.id) {
                    try {
                        const workflowResponse = await apiClient.transitionWorkflow({
                            storedServiceReqId: storedServiceRequest.id,
                            toStateId: '426df256-bc00-28d1-e065-9e6b783dd008',
                            actionType: 'COMPLETE',
                            currentUserId: currentUserId,
                            currentDepartmentId: currentDepartmentId,
                            currentRoomId: currentRoomId,
                        })
                        
                        if (workflowResponse.success) {
                            // Refresh sidebar sau khi transition thành công
                            setRefreshTrigger(prev => prev + 1)
                        } else {
                            toast({
                                variant: 'destructive',
                                title: 'Cảnh báo',
                                description: getErrorMessage(workflowResponse, 'Đã ký số nhưng không thể cập nhật trạng thái quy trình.')
                            })
                        }
                    } catch (err: any) {
                        console.error('Error transitioning workflow:', err)
                        toast({
                            variant: 'destructive',
                            title: 'Cảnh báo',
                            description: err?.message || getErrorMessage(err, 'Đã ký số nhưng không thể cập nhật trạng thái quy trình.')
                        })
                    }
                }

                // Hiển thị message từ API nếu có
                const successMessage = response.message || "Đã ký số tài liệu thành công"
                toast({
                    title: "Thành công",
                    description: successMessage,
                    variant: "default"
                })
                setSignerInfo({ signerId: '', serialNumber: '' })
            } else {
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: getErrorMessage(response, "Có lỗi xảy ra khi ký số")
                })
            }
        } catch (error: any) {
            console.error('Error signing document:', error)
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error?.message || "Có lỗi xảy ra khi ký số tài liệu"
            })
        } finally {
            setIsSigning(false)
        }
    }

    // Handler hủy chữ ký số
    const handleCancelDigitalSign = async () => {
        // Lọc các service đã chọn có documentId
        const selectedServicesWithDocumentId = services.filter(
            service => selectedServices.has(service.id) && service.documentId
        )

        if (selectedServicesWithDocumentId.length === 0) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng chọn ít nhất một dịch vụ đã ký số để hủy"
            })
            return
        }

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

        if (!tokenCode) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng đăng nhập để sử dụng tính năng ký điện tử"
            })
            return
        }

        setIsSigning(true)
        try {
            // Gom nhóm các service theo documentId để tránh gọi API nhiều lần cho cùng documentId
            const documentIdMap = new Map<number, string[]>()
            
            selectedServicesWithDocumentId.forEach(service => {
                if (service.documentId) {
                    // Convert documentId sang number
                    const docId = typeof service.documentId === 'string' 
                        ? Number.parseInt(service.documentId, 10) 
                        : Number(service.documentId)
                    
                    if (!Number.isNaN(docId)) {
                        if (!documentIdMap.has(docId)) {
                            documentIdMap.set(docId, [])
                        }
                        documentIdMap.get(docId)!.push(service.id)
                    }
                }
            })

            // Gọi API delete-document một lần cho mỗi documentId duy nhất và cập nhật tất cả services
            const results = await Promise.allSettled(
                Array.from(documentIdMap.entries()).map(async ([documentId, serviceIds]) => {
                    // Gọi API hủy chữ ký số (chỉ một lần cho mỗi documentId) - documentId đã là number
                    const deleteResponse = await apiClient.deleteEmrDocument(documentId, tokenCode!, 'EMR')
                    
                    if (!deleteResponse.success) {
                        throw new Error(getErrorMessage(deleteResponse, `Không thể hủy chữ ký số cho document ${documentId}`))
                    }
                    
                    // Cập nhật documentId = null cho tất cả các service có documentId này
                    const updateResults = await Promise.allSettled(
                        serviceIds.map(async (serviceId) => {
                            const updateResponse = await apiClient.patchServiceRequestDocumentId(serviceId, null)
                            if (!updateResponse.success) {
                                throw new Error(getErrorMessage(updateResponse, `Không thể cập nhật document ID cho service ${serviceId}`))
                            }
                            return { success: true, serviceId }
                        })
                    )
                    
                    // Kiểm tra nếu có lỗi trong việc cập nhật
                    const updateErrors = updateResults.filter(r => r.status === 'rejected')
                    if (updateErrors.length > 0) {
                        const errorMessages = updateErrors.map(r => r.status === 'rejected' ? r.reason?.message || 'Lỗi không xác định' : '').filter(Boolean)
                        throw new Error(`Lỗi cập nhật: ${errorMessages.join(', ')}`)
                    }
                    
                    return { success: true, documentId, serviceIds }
                })
            )

            // Đếm số lượng thành công và thất bại
            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.filter(r => r.status === 'rejected').length

            // Refresh danh sách services
            await refetchStoredServiceRequest()

            if (failed === 0) {
                // Sau khi hủy chữ ký số thành công, gọi API xóa workflow history
                if (storedServiceRequest?.id) {
                    try {
                        const stateId = '426df256-bc00-28d1-e065-9e6b783dd008';
                        const deleteWorkflowHistoryResponse = await apiClient.deleteWorkflowHistoryByStateAndRequest(
                            stateId,
                            storedServiceRequest.id
                        );
                        
                        if (!deleteWorkflowHistoryResponse.success) {
                            console.error('❌ Lỗi xóa workflow history:', deleteWorkflowHistoryResponse);
                            // Không hiển thị toast vì đây không phải lỗi nghiêm trọng
                        }
                    } catch (historyError: any) {
                        console.error('❌ Lỗi xóa workflow history:', historyError);
                        // Không hiển thị toast vì đây không phải lỗi nghiêm trọng
                    }
                }
                
                // Refresh sidebar để cập nhật trạng thái dịch vụ
                setRefreshTrigger(prev => prev + 1)
                
                toast({
                    title: "Thành công",
                    description: `Đã hủy chữ ký số cho ${selectedServicesWithDocumentId.length} dịch vụ`,
                    variant: "default"
                })
            } else {
                const errorMessages = results
                    .filter(r => r.status === 'rejected')
                    .map(r => r.status === 'rejected' ? r.reason?.message || 'Lỗi không xác định' : '')
                    .filter(Boolean)
                
                toast({
                    title: failed === results.length ? "Lỗi" : "Hoàn thành",
                    description: failed === results.length 
                        ? `Không thể hủy chữ ký số: ${errorMessages[0] || 'Lỗi không xác định'}`
                        : `Đã hủy chữ ký số cho ${successful}/${documentIdMap.size} document. ${failed} document gặp lỗi.`,
                    variant: failed === results.length ? "destructive" : "default"
                })
            }
        } catch (error: any) {
            console.error('Error canceling digital sign:', error)
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error?.message || getErrorMessage(error, "Có lỗi xảy ra khi hủy chữ ký số")
            })
        } finally {
            setIsSigning(false)
        }
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

        if (!resultDescription.trim()) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng nhập mô tả kết quả xét nghiệm"
            })
            return
        }
        
        if (!resultConclude.trim()) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng nhập kết luận"
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
            const savePromises = Array.from(selectedServices).map(async (serviceId) => {
                const response = await apiClient.saveServiceResult(serviceId, {
                    resultValue: 12.5,
                    resultValueText: "12.5",
                    resultDescription: resultDescription,
                    resultConclude: resultConclude,
                    resultNote: resultNote,
                    resultStatus: 'NORMAL',
                    resultName: resultName
                })
                
                if (!response.success) {
                    throw new Error(getErrorMessage(response, `Không thể lưu kết quả cho dịch vụ ${serviceId}`))
                }
                
                return response
            })

            const saveResults = await Promise.allSettled(savePromises)
            
            // Kiểm tra kết quả lưu
            const saveSuccessful = saveResults.filter(r => r.status === 'fulfilled').length
            const saveFailed = saveResults.filter(r => r.status === 'rejected').length
            
            if (saveFailed > 0) {
                const errorMessages = saveResults
                    .filter(r => r.status === 'rejected')
                    .map(r => {
                        if (r.status === 'rejected') {
                            return r.reason?.message || 'Lỗi không xác định'
                        }
                        return ''
                    })
                    .filter(Boolean)
                
                toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: `Không thể lưu kết quả cho ${saveFailed}/${selectedServices.size} dịch vụ: ${errorMessages[0] || 'Lỗi không xác định'}`
                })
                
                // Nếu tất cả đều lỗi, dừng lại
                if (saveFailed === selectedServices.size) {
                    return
                }
            }

            // Sau khi có ít nhất một service lưu kết quả thành công, gọi API chuyển trạng thái workflow
            if (saveSuccessful > 0) {
                try {
                    const workflowResponse = await apiClient.transitionWorkflow({
                        storedServiceReqId: storedServiceRequest.id,
                        toStateId: '426df256-bbfe-28d1-e065-9e6b783dd008',
                        actionType: 'COMPLETE',
                        currentUserId: currentUserId,
                        currentDepartmentId: currentDepartmentId,
                        currentRoomId: currentRoomId,
                    })
                    
                    if (workflowResponse.success) {
                        // Refresh sidebar sau khi transition thành công
                        setRefreshTrigger(prev => prev + 1)
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Cảnh báo',
                            description: getErrorMessage(workflowResponse, 'Đã lưu kết quả nhưng không thể cập nhật trạng thái quy trình.')
                        })
                    }
                } catch (err: any) {
                    console.error('Error transitioning workflow:', err)
                    toast({
                        variant: 'destructive',
                        title: 'Cảnh báo',
                        description: err?.message || getErrorMessage(err, 'Đã lưu kết quả nhưng không thể cập nhật trạng thái quy trình.')
                    })
                }
            }
            
            // Hiển thị thông báo thành công
            if (saveSuccessful > 0) {
                toast({
                    title: "Thành công",
                    description: saveFailed > 0 
                        ? `Đã lưu kết quả cho ${saveSuccessful}/${selectedServices.size} dịch vụ`
                        : `Đã lưu kết quả cho ${selectedServices.size} dịch vụ`,
                    variant: "default"
                })
                
                // Invalidate và refetch để cập nhật danh sách dịch vụ
                await queryClient.invalidateQueries({ 
                    queryKey: ['stored-service-request', storedServiceRequest.id] 
                })
                await queryClient.invalidateQueries({ 
                    queryKey: ['stored-service-detail'] 
                })
                
                // Refresh ngay lập tức để cập nhật bảng dịch vụ
                await refetchStoredServiceRequest()
            }
            
            // Trigger refresh để cập nhật trạng thái dịch vụ (cho sidebar và các components khác)
            setRefreshTrigger(prev => prev + 1)
            
            setSelectedServices(new Set())
            setResultDescription(defaultResultDescription)
            setResultConclude(defaultResultConclude)
            setResultNote(defaultResultNote)
        } catch (error: any) {
            console.error('Error saving results:', error)
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error?.message || getErrorMessage(error, "Có lỗi xảy ra khi lưu kết quả")
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader className={'border-b border-gray-200'}>
                    <CardTitle className="text-2xl font-bold">Trả kết quả xét nghiệm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div ref={scrollContainerRef as React.RefObject<HTMLDivElement>} className="flex h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        {/* Sidebar - 1/4 màn hình */}
                        <div className="w-1/4 border-r border-gray-200 bg-gray-50">
                            <ServiceRequestsSidebar
                                onSelect={handleSelect}
                                refreshTrigger={refreshTrigger}
                                selectedCode={selectedServiceReqCode}
                                defaultStateId="426df256-bbfb-28d1-e065-9e6b783dd008"
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
                                            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                                                <h3 className="text-lg font-semibold">
                                                    Chọn danh sách dịch vụ để trả kết quả
                                                </h3>
                                                <Button 
                                                    onClick={() => setConfirmCancelSignDialogOpen(true)}
                                                    disabled={isSigning || selectedServices.size === 0}
                                                    variant="destructive"
                                                >
                                                    {isSigning ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Đang xử lý...
                                                        </>
                                                    ) : (
                                                        'Hủy chữ ký số'
                                                    )}
                                                </Button>
                                            </div>
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
                                                            Trạng thái ký
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Xem phiếu
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                    {services.map((service, index) => (
                                                        <tr 
                                                            key={service.id} 
                                                            className="hover:bg-gray-50 cursor-pointer"
                                                            onClick={() => handleServiceClick(service.id)}
                                                        >
                                                            <td className="px-4 py-3 text-sm text-gray-900" onClick={(e) => e.stopPropagation()}>
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
                                                                {service.resultConclude ? (
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
                                                            <td className="px-4 py-3 text-sm text-center">
                                                                {service.documentId ? (
                                                                    <span
                                                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        <CheckCircle2 className="w-3.5 h-3.5"/>
                                                                        Đã ký
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">
                                                                        Chưa ký
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-900 text-center" onClick={(e) => e.stopPropagation()}>
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
                                        <div className="flex justify-between mb-4 pb-3 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold">Kết quả xét nghiệm</h3>
                                            <Button onClick={() => setTemplateSelectorOpen(true)}>
                                                Chọn mẫu kết quả có sẵn
                                            </Button>
                                        </div>

                                        <div className="mb-4">
                                            <Label className="text-sm font-medium mb-2 block">Tên phiếu kết quả</Label>
                                            <Textarea 
                                                value={resultName}
                                                onChange={(e) => setResultName(e.target.value)}
                                                placeholder="Nhập tên phiếu kết quả..." 
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            {/* Mô tả kết quả */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Mô tả kết quả *</Label>
                                                <div className="border rounded-md">
                                                    <RichTextEditor
                                                        value={resultDescription}
                                                        onChange={setResultDescription}
                                                        placeholder="Nhập mô tả chi tiết về kết quả xét nghiệm..."
                                                        minHeight="150px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Kết luận */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Kết luận *</Label>
                                                <div className="border rounded-md">
                                                    <RichTextEditor
                                                        value={resultConclude}
                                                        onChange={setResultConclude}
                                                        placeholder="Nhập kết luận về kết quả xét nghiệm..."
                                                        minHeight="120px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Ghi chú */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Ghi chú</Label>
                                                <div className="border rounded-md">
                                                    <RichTextEditor
                                                        value={resultNote}
                                                        onChange={setResultNote}
                                                        placeholder="Nhập ghi chú về kết quả xét nghiệm (tùy chọn)..."
                                                        minHeight="150px"
                                                    />
                                                </div>
                                            </div>
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
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => setConfirmSignDialogOpen(true)}
                                    disabled={!storedServiceRequestData?.data || !previewServiceData?.data || isSigning}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                    </svg>
                                    Ký số
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


            {/* Result Template Selector Dialog */}
            <ResultTemplateSelector
                open={templateSelectorOpen}
                onOpenChange={setTemplateSelectorOpen}
                onSelect={handleTemplateSelect}
                onSelectFields={handleTemplateSelectFields}
            />

            {/* Dialog xác nhận ký số */}
            <Dialog open={confirmSignDialogOpen} onOpenChange={setConfirmSignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận ký số</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn ký số cho tài liệu này? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmSignDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmSignDialogOpen(false)
                                handleSignDocument()
                            }}
                            disabled={isSigning}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isSigning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận ký số'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog xác nhận hủy chữ ký số */}
            <Dialog open={confirmCancelSignDialogOpen} onOpenChange={setConfirmCancelSignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận hủy chữ ký số</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn hủy chữ ký số cho {selectedServices.size} dịch vụ đã chọn? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmCancelSignDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={() => {
                                setConfirmCancelSignDialogOpen(false)
                                handleCancelDigitalSign()
                            }}
                            disabled={isSigning}
                            variant="destructive"
                        >
                            {isSigning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận hủy'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

