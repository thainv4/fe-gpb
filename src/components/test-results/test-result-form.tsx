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
import {LoadingSpinner} from "@/components/ui/loading";
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
import {downloadPdfFromContainer, pdfBase64FromContainer, downloadPdfFromContainerWithPuppeteer, pdfBase64FromContainerWithPuppeteer} from '@/lib/utils/pdf-export';
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
    const defaultMacroscopicComment = `<p style="padding-left: 0; margin-left: 0;"><strong>NHẬN XÉT ĐẠI THỂ:</strong></p><p style="padding-left: 20px;"></p>`
    const defaultMicroscopicDescription = `<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p><p style="padding-left: 20px;"></p>`
    const defaultResultDescription = `<p style="padding-left: 0; margin-left: 0;"><strong>NHẬN XÉT ĐẠI THỂ:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p><p style="padding-left: 20px;"></p>`
    const defaultResultConclude = `<p style="padding-left: 0; margin-left: 0;"><strong>CHẨN ĐOÁN MÔ BỆNH HỌC:</strong></p><p style="padding-left: 20px;"></p>`
    const defaultResultNote = `<p style="padding-left: 0; margin-left: 0;"><strong>BÀN LUẬN:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>KHUYẾN NGHỊ:</strong></p><p style="padding-left: 20px;"></p><p style="padding-left: 0; margin-left: 0;"><strong>HỘI CHẨN:</strong></p><p style="padding-left: 20px;"></p>`
    
    // Helper function to parse resultDescription into macroscopic and microscopic parts
    const parseResultDescription = (description: string) => {
        // Tìm phần NHẬN XÉT ĐẠI THỂ (bao gồm cả tiêu đề)
        // Dùng [\s\S] thay vì . với flag s để tương thích ES5
        const macroscopicMatch = description.match(/(<p style="padding-left: 0; margin-left: 0;"><strong>NHẬN XÉT ĐẠI THỂ:<\/strong><\/p>[\s\S]*?)(?=<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:<\/strong><\/p>|$)/);
        // Tìm phần MÔ TẢ VI THỂ (bao gồm cả tiêu đề)
        const microscopicMatch = description.match(/<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:<\/strong><\/p>([\s\S]*?)$/);
        
        let macroscopic = defaultMacroscopicComment;
        let microscopic = defaultMicroscopicDescription;
        
        if (macroscopicMatch) {
            macroscopic = macroscopicMatch[1].trim();
            // Đảm bảo có tiêu đề
            if (!macroscopic.includes('NHẬN XÉT ĐẠI THỂ')) {
                macroscopic = defaultMacroscopicComment;
            }
        }
        
        if (microscopicMatch) {
            const content = microscopicMatch[1].trim();
            // Thêm lại tiêu đề nếu chưa có
            microscopic = `<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p>${content}`;
        }
        
        return { macroscopic, microscopic };
    };

    // Helper function to combine macroscopic and microscopic into resultDescription
    const combineResultDescription = (macroscopic: string, microscopic: string) => {
        // Đảm bảo mỗi phần đã có tiêu đề, nếu chưa thì thêm vào
        let macro = macroscopic;
        let micro = microscopic;
        
        if (!macro.includes('NHẬN XÉT ĐẠI THỂ')) {
            macro = defaultMacroscopicComment;
        }
        
        if (!micro.includes('MÔ TẢ VI THỂ')) {
            micro = defaultMicroscopicDescription;
        }
        
        return `${macro}${micro}`;
    };
    
    const [macroscopicComment, setMacroscopicComment] = useState<string>(defaultMacroscopicComment)
    const [microscopicDescription, setMicroscopicDescription] = useState<string>(defaultMicroscopicDescription)
    
    // Helper function to sync resultDescription with macroscopic and microscopic states
    const syncResultDescription = (description: string) => {
        // Chỉ gán resultDescription vào Mô tả vi thể, không gán vào Nhận xét đại thể
        // Nếu description có chứa "MÔ TẢ VI THỂ", extract phần đó
        // Dùng [\s\S] thay vì . với flag s để tương thích ES5
        const microscopicMatch = description.match(/<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:<\/strong><\/p>([\s\S]*?)$/);
        
        if (microscopicMatch) {
            const content = microscopicMatch[1].trim();
            setMicroscopicDescription(`<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p>${content}`);
        } else {
            // Nếu không tìm thấy phần "MÔ TẢ VI THỂ", gán toàn bộ description vào Mô tả vi thể
            // Đảm bảo có tiêu đề
            if (description.includes('MÔ TẢ VI THỂ')) {
                setMicroscopicDescription(description);
            } else {
                setMicroscopicDescription(`<p style="padding-left: 0; margin-left: 0;"><strong>MÔ TẢ VI THỂ:</strong></p>${description}`);
            }
        }
        
        // Giữ Nhận xét đại thể ở giá trị mặc định (rỗng)
        setMacroscopicComment(defaultMacroscopicComment)
    }
    
    // Helper function to get combined resultDescription
    const getResultDescription = () => {
        return combineResultDescription(macroscopicComment, microscopicDescription)
    }
    
    const [resultDescription, setResultDescription] = useState<string>(defaultResultDescription)
    const [resultConclude, setResultConclude] = useState<string>(defaultResultConclude)
    const [resultNote, setResultNote] = useState<string>(defaultResultNote)
    
    // Sync when macroscopic or microscopic changes
    useEffect(() => {
        const combined = combineResultDescription(macroscopicComment, microscopicDescription)
        setResultDescription(combined)
    }, [macroscopicComment, microscopicDescription])
    const [resultName, setResultName] = useState<string>('')
    const [numOfBlock, setNumOfBlock] = useState<string>('')
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
            numOfBlock,
        },
        {
            saveScroll: true,
            debounceMs: 500,
            onRestore: (data) => {
                if (data.selectedServiceReqCode) setSelectedServiceReqCode(data.selectedServiceReqCode)
                if (data.storedServiceReqId) setStoredServiceReqId(data.storedServiceReqId)
                if (data.resultDescription) {
                    setResultDescription(data.resultDescription)
                    syncResultDescription(data.resultDescription)
                }
                if (data.resultConclude) setResultConclude(data.resultConclude)
                if (data.resultNote) setResultNote(data.resultNote)
                if (data.resultName !== undefined) setResultName(data.resultName)
                if (data.numOfBlock !== undefined) setNumOfBlock(data.numOfBlock)
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
        // Lưu giá trị hiện tại của nhận xét đại thể trước khi chọn mẫu để giữ nguyên
        const currentMacroscopicComment = macroscopicComment
        
        const desc = resultDescription || defaultResultDescription
        setResultDescription(desc)
        syncResultDescription(desc)
        
        // Luôn giữ nguyên giá trị nhận xét đại thể sau khi chọn mẫu
        setMacroscopicComment(currentMacroscopicComment)
        
        setResultConclude(resultConclude || defaultResultConclude)
        setResultNote(resultNote || defaultResultNote)
        setResultName(templateName)
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

    // Helper function để strip HTML cho Description (giữ line breaks)
    const stripHtmlForDescription = (html: string | null | undefined): string => {
        if (!html) return '';
        // Giữ line breaks bằng cách thay thế <p> và <br> trước khi strip HTML
        let text = html
            .replace(/<p[^>]*>/gi, '\n')
            .replace(/<\/p>/gi, '')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<div[^>]*>/gi, '\n')
            .replace(/<\/div>/gi, '');
        // Sau đó strip các HTML tags còn lại
        text = htmlToFormattedText(text);
        // Loại bỏ các dòng trống thừa
        return text.replace(/\n{3,}/g, '\n\n').trim();
    }

    // Helper function để gọi API updateHisPacsResult cho một dịch vụ
    const updateHisPacsResultForService = async (service: any, tokenCode: string) => {
        try {
            // Lấy resultComment và resultDescription, kết hợp lại để tạo Description
            const resultCommentText = stripHtmlForDescription(service?.resultComment || '');
            const resultDescriptionText = stripHtmlForDescription(service?.resultDescription || service?.resultText || '');
            
            // Kết hợp resultComment và resultDescription để tạo Description
            const descriptionParts: string[] = [];
            if (resultCommentText) {
                descriptionParts.push(resultCommentText);
            }
            if (resultDescriptionText) {
                descriptionParts.push(resultDescriptionText);
            }
            const description = descriptionParts.join('\n\n');
            
            const conclude = stripHtml(service?.resultConclude || '');
            const note = stripHtml(service?.resultNote || '');

            // Lấy thông tin user hiện tại
            const executeLoginname = profileData?.data?.username || '';
            const executeUsername = profileData?.data?.fullName || '';

            // Lấy serviceReqCode và serviceCode
            const tdlServiceReqCode = storedServiceRequest?.hisServiceReqCode || storedServiceRequest?.serviceReqCode || '';
            const tdlServiceCode = service?.serviceCode || '';

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
                    console.error(`❌ Lỗi cập nhật HIS-PACS result cho dịch vụ ${tdlServiceCode}:`, hisPacsUpdateResponse);
                    return {
                        success: false,
                        serviceCode: tdlServiceCode,
                        error: getErrorMessage(hisPacsUpdateResponse, 'Không thể cập nhật kết quả HIS-PACS.')
                    };
                }
                return { success: true, serviceCode: tdlServiceCode };
            } else {
                console.warn(`⚠️ Thiếu thông tin để gọi API HIS-PACS update cho dịch vụ ${service?.serviceCode}:`, {
                    tdlServiceReqCode,
                    tdlServiceCode,
                    hasTokenCode: !!tokenCode
                });
                return { success: false, serviceCode: service?.serviceCode || '', error: 'Thiếu thông tin cần thiết' };
            }
        } catch (error: any) {
            console.error(`❌ Lỗi cập nhật HIS-PACS result cho dịch vụ ${service?.serviceCode}:`, error);
            return {
                success: false,
                serviceCode: service?.serviceCode || '',
                error: error?.message || 'Lỗi không xác định'
            };
        }
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

        // Load kết quả từ API /api/v1/service-requests/stored/services/{serviceId}/result
        try {
            const resultResponse = await apiClient.getServiceResult(serviceId)
            if (resultResponse.success && resultResponse.data) {
                const data = resultResponse.data
                // Set các field từ response, nếu null/empty thì dùng default
                const desc = data.resultDescription || defaultResultDescription
                setResultDescription(desc)
                syncResultDescription(desc)
                setResultConclude(data.resultConclude || defaultResultConclude)
                setResultNote(data.resultNote || defaultResultNote)
                setResultName(data.resultName || '')
                
                // Gán resultComment vào input Nhận xét đại thể
                if (data.resultComment) {
                    setMacroscopicComment(data.resultComment)
                } else {
                    setMacroscopicComment(defaultMacroscopicComment)
                }
            } else {
                // Nếu không có kết quả, reset về default templates
                setResultDescription(defaultResultDescription)
                syncResultDescription(defaultResultDescription)
                setResultConclude(defaultResultConclude)
                setResultNote(defaultResultNote)
                setResultName('')
                setMacroscopicComment(defaultMacroscopicComment)
            }
        } catch (error) {
            // Nếu có lỗi, reset về default templates
            setResultDescription(defaultResultDescription)
            syncResultDescription(defaultResultDescription)
            setResultConclude(defaultResultConclude)
            setResultNote(defaultResultNote)
            setResultName('')
            setMacroscopicComment(defaultMacroscopicComment)
        }
    }

    const handleDownloadPdf = async () => {
        if (!previewRef.current || !storedServiceRequestData?.data || !previewServiceData?.data) return;

        try {
            const fileName = `Phieu_XN_${storedServiceRequestData.data.patientCode}_${storedServiceRequestData.data.serviceReqCode}.pdf`;
            await downloadPdfFromContainerWithPuppeteer(previewRef.current, fileName);
            
        } catch (error: any) {
            console.error('Error downloading PDF:', error);
            
            // Extract error message
            let errorMessage = "Có lỗi xảy ra khi tải PDF";
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: errorMessage
            });
        }
    };

    const handlePrintPdf = async () => {
        if (!previewRef.current || !storedServiceRequestData?.data) return;
        try {
            await downloadPdfFromContainerWithPuppeteer(
                previewRef.current,
                `Phieu_XN_${storedServiceRequestData.data.patientCode}_${storedServiceRequestData.data.serviceReqCode}.pdf`
            );

        } catch (error: any) {
            console.error('Error printing PDF:', error);
            
            // Extract error message
            let errorMessage = "Có lỗi xảy ra khi in PDF";
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: errorMessage
            });
        }
    }

    // Convert PDF to base64
    const convertPdfToBase64 = async (): Promise<string | null> => {
        if (!previewRef.current || !storedServiceRequestData?.data || !previewServiceData?.data) return null;

        try {
            const {base64, pageCount} = await pdfBase64FromContainerWithPuppeteer(previewRef.current);
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
            const pdfResult = await pdfBase64FromContainerWithPuppeteer(previewRef.current);
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
                    SizeFont: 14,
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

                // Nếu có documentId, cập nhật cho tất cả dịch vụ
                if (documentId && services.length > 0) {
                    try {
                        // Cập nhật documentId cho tất cả dịch vụ
                        const updatePromises = services.map(async (service) => {
                            const updateResponse = await apiClient.patchServiceRequestDocumentId(service.id, documentId);
                            if (!updateResponse.success) {
                                throw new Error(getErrorMessage(updateResponse, `Không thể cập nhật document ID cho service ${service.id}`));
                            }
                            return { success: true, serviceId: service.id };
                        });

                        const updateResults = await Promise.allSettled(updatePromises);
                        
                        // Kiểm tra kết quả cập nhật
                        const updateSuccessful = updateResults.filter(r => r.status === 'fulfilled').length;
                        const updateFailed = updateResults.filter(r => r.status === 'rejected').length;

                        if (updateFailed > 0) {
                            const errorMessages = updateResults
                                .filter(r => r.status === 'rejected')
                                .map(r => r.status === 'rejected' ? r.reason?.message || 'Lỗi không xác định' : '')
                                .filter(Boolean);
                            
                            toast({
                                variant: "destructive",
                                title: "Cảnh báo",
                                description: `Đã ký số nhưng không thể cập nhật document ID cho ${updateFailed}/${services.length} dịch vụ: ${errorMessages[0] || 'Lỗi không xác định'}`
                            });
                        }

                        // Refresh danh sách services để hiển thị trạng thái "Đã ký"
                        await refetchStoredServiceRequest();

                        // Sau khi cập nhật documentId thành công, gọi API update HIS-PACS result cho tất cả dịch vụ
                        try {
                            // Refresh lại danh sách dịch vụ để có dữ liệu mới nhất
                            const refreshedData = await refetchStoredServiceRequest();
                            const refreshedServices = refreshedData.data?.data?.services || services;

                            // Gọi API updateHisPacsResult cho tất cả dịch vụ
                            const hisPacsPromises = refreshedServices.map((service: any) => 
                                updateHisPacsResultForService(service, tokenCode!)
                            );

                            const hisPacsResults = await Promise.allSettled(hisPacsPromises);
                            
                            const hisPacsSuccessful = hisPacsResults.filter(r => 
                                r.status === 'fulfilled' && r.value.success
                            ).length;
                            const hisPacsFailed = hisPacsResults.length - hisPacsSuccessful;

                            if (hisPacsFailed > 0) {
                                console.warn(`⚠️ Không thể cập nhật HIS-PACS cho ${hisPacsFailed}/${refreshedServices.length} dịch vụ`);
                                toast({
                                    variant: 'default',
                                    title: 'Cảnh báo',
                                    description: `Đã ký số nhưng không thể cập nhật kết quả HIS-PACS cho ${hisPacsFailed}/${refreshedServices.length} dịch vụ.`
                                });
                            }
                        } catch (hisPacsError: any) {
                            console.error('❌ Lỗi cập nhật HIS-PACS result cho tất cả dịch vụ:', hisPacsError);
                            toast({
                                variant: 'default',
                                title: 'Cảnh báo',
                                description: hisPacsError?.message || 'Đã ký số nhưng không thể cập nhật kết quả HIS-PACS.'
                            });
                        }
                    } catch (docIdError: any) {
                        console.error('❌ Lỗi cập nhật document ID cho tất cả dịch vụ:', docIdError);
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
        // Lấy tất cả dịch vụ đã ký số
        const servicesWithDocumentId = services.filter(
            (service: any) => service.documentId
        )

        if (servicesWithDocumentId.length === 0) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không có dịch vụ nào đã được ký số"
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
            
            servicesWithDocumentId.forEach((service: any) => {
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
                    
                    // Kiểm tra response.success (wrapper) và response.data?.Success (EMR API response)
                    if (!deleteResponse.success) {
                        throw new Error(getErrorMessage(deleteResponse, `Không thể hủy chữ ký số cho document ${documentId}`))
                    }
                    
                    // Kiểm tra Success field trong response.data (EMR API response structure)
                    const emrResponse = deleteResponse.data as any
                    if (!emrResponse?.Success) {
                        const errorMessage = emrResponse?.Param?.Messages?.join(', ') || 
                                           emrResponse?.Param?.MessageCodes?.join(', ') ||
                                           `Không thể hủy chữ ký số cho document ${documentId}`
                        throw new Error(errorMessage)
                    }
                    
                    // Chỉ chạy các API tiếp theo nếu Success = true
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
                    description: `Đã hủy chữ ký số cho ${servicesWithDocumentId.length} dịch vụ`,
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
        if (services.length === 0) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không có dịch vụ nào để lưu kết quả"
            })
            return
        }

        const combinedDescription = combineResultDescription(macroscopicComment, microscopicDescription)
        if (!combinedDescription.trim() || (!macroscopicComment.trim() && !microscopicDescription.trim())) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Vui lòng nhập nhận xét đại thể hoặc mô tả vi thể"
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
            // resultDescription chỉ lấy từ microscopicDescription (Mô tả vi thể), không bao gồm macroscopicComment (Nhận xét đại thể)
            // Đảm bảo có tiêu đề "MÔ TẢ VI THỂ"
            let templateResultDescription = microscopicDescription || defaultMicroscopicDescription
            if (!templateResultDescription.includes('MÔ TẢ VI THỂ')) {
                templateResultDescription = defaultMicroscopicDescription
            }
            
            // Lưu kết quả cho tất cả dịch vụ
            const savePromises = services.map(async (service) => {
                const serviceId = service.id
                const response = await apiClient.saveServiceResult(serviceId, {
                    resultValue: 12.5,
                    resultValueText: "12.5",
                    resultDescription: templateResultDescription,
                    resultConclude: resultConclude,
                    resultNote: resultNote,
                    resultComment: macroscopicComment || '',
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
                    description: `Không thể lưu kết quả cho ${saveFailed}/${services.length} dịch vụ: ${errorMessages[0] || 'Lỗi không xác định'}`
                })
                
                // Nếu tất cả đều lỗi, dừng lại
                if (saveFailed === services.length) {
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

            // Gọi API num-of-block nếu có giá trị (khác null hoặc rỗng)
            if (saveSuccessful > 0 && storedServiceRequest?.id && numOfBlock !== null && numOfBlock !== undefined && numOfBlock.trim() !== '') {
                try {
                    const numOfBlockValue = numOfBlock.trim()
                    console.log('📦 Gọi API num-of-block:', {
                        storedServiceReqId: storedServiceRequest.id,
                        numOfBlock: numOfBlockValue
                    })
                    const numOfBlockResponse = await apiClient.updateStoredServiceRequestNumOfBlock(
                        storedServiceRequest.id,
                        numOfBlockValue
                    )
                    if (!numOfBlockResponse.success) {
                        console.error('❌ Lỗi cập nhật số lượng block:', numOfBlockResponse)
                        toast({
                            title: 'Cảnh báo',
                            description: numOfBlockResponse.message || 'Đã lưu kết quả nhưng không thể cập nhật số lượng block',
                            variant: 'default',
                        })
                    } else {
                        console.log('✅ Cập nhật số lượng block thành công')
                    }
                } catch (error: unknown) {
                    console.error('❌ Lỗi khi gọi API num-of-block:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định'
                    toast({
                        title: 'Cảnh báo',
                        description: `Đã lưu kết quả nhưng không thể cập nhật số lượng block: ${errorMessage}`,
                        variant: 'default',
                    })
                }
            }
            
            // Hiển thị thông báo thành công
            if (saveSuccessful > 0) {
                toast({
                    title: "Thành công",
                    description: saveFailed > 0 
                        ? `Đã lưu kết quả cho ${saveSuccessful}/${services.length} dịch vụ`
                        : `Đã lưu kết quả cho ${services.length} dịch vụ`,
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

                // Không gọi API updateHisPacsResult ở đây nữa
                // API updateHisPacsResult chỉ được gọi sau khi ký số thành công (trong handleDigitalSign)
            }
            
            // Trigger refresh để cập nhật trạng thái dịch vụ (cho sidebar và các components khác)
            setRefreshTrigger(prev => prev + 1)
            
            setResultDescription(defaultResultDescription)
            syncResultDescription(defaultResultDescription)
            setResultConclude(defaultResultConclude)
            setResultNote(defaultResultNote)
            setResultName('')
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
                                                <div className="flex gap-2">
                                                    <Button 
                                                        onClick={() => {
                                                            // Mở preview với dịch vụ đầu tiên có kết quả, hoặc dịch vụ đầu tiên
                                                            const firstServiceWithResult = services.find(s => s.resultConclude) || services[0]
                                                            if (firstServiceWithResult) {
                                                                setPreviewServiceId(firstServiceWithResult.id)
                                                                setPreviewDialogOpen(true)
                                                            }
                                                        }}
                                                        disabled={services.length === 0 || !storedServiceReqId}
                                                        variant="outline"
                                                    >
                                                        Xem kết quả
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setConfirmCancelSignDialogOpen(true)}
                                                        disabled={isSigning || services.length === 0}
                                                        variant="destructive"
                                                    >
                                                        {isSigning ? (
                                                            <>
                                                                <LoadingSpinner size="small" className="mr-2" />
                                                                Đang xử lý...
                                                            </>
                                                        ) : (
                                                            'Hủy chữ ký số'
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                    <tr>
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
                                                    </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                    {services.map((service, index) => {
                                                        // Tính trạng thái dựa trên tất cả dịch vụ - lấy từ dịch vụ đầu tiên làm chuẩn
                                                        const firstService = services[0]
                                                        const hasResult = firstService?.resultConclude ? true : false
                                                        const hasSignature = firstService?.documentId ? true : false
                                                        
                                                        return (
                                                            <tr 
                                                                key={service.id} 
                                                                className="hover:bg-gray-50 cursor-pointer"
                                                                onClick={() => handleServiceClick(service.id)}
                                                            >
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
                                                                    {hasResult ? (
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
                                                                    {hasSignature ? (
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
                                                            </tr>
                                                        )
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Số block và Phương pháp nhuộm */}
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="mb-4">
                                                <Label className="text-sm font-medium mb-2 block">Số block</Label>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Nhập số block..." 
                                                    value={numOfBlock}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Chỉ cho phép số
                                                        if (value === '' || /^\d+$/.test(value)) {
                                                            setNumOfBlock(value);
                                                        }
                                                    }}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <Label className="text-sm font-medium mb-2 block">Phương pháp nhuộm</Label>
                                                <Input 
                                                    type="text" 
                                                    value={storedServiceRequest?.stainingMethodName || ''}
                                                    disabled
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                            {/* Nhận xét đại thể */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Nhận xét đại thể *</Label>
                                                <div className="border rounded-md">
                                                    <RichTextEditor
                                                        value={macroscopicComment}
                                                        onChange={setMacroscopicComment}
                                                        placeholder="Nhập nhận xét đại thể..."
                                                        minHeight="120px"
                                                    />
                                                </div>
                                            </div>

                                            {/* Mô tả vi thể */}
                                            <div>
                                                <Label className="text-sm font-medium mb-2 block">Mô tả vi thể *</Label>
                                                <div className="border rounded-md">
                                                    <RichTextEditor
                                                        value={microscopicDescription}
                                                        onChange={setMicroscopicDescription}
                                                        placeholder="Nhập mô tả vi thể..."
                                                        minHeight="120px"
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
                                            disabled={isSaving || services.length === 0}
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
                                    {isSigning ? (
                                        <>
                                            <LoadingSpinner size="small" className="text-white" />
                                            Đang ký số...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                            </svg>
                                            Ký số
                                        </>
                                    )}
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
                                    <LoadingSpinner size="small" className="mr-2" />
                                    Đang ký số...
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
                            Bạn có chắc chắn muốn hủy chữ ký số cho tất cả {services.length} dịch vụ? Hành động này không thể hoàn tác.
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
                                    <LoadingSpinner size="small" className="mr-2" />
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

