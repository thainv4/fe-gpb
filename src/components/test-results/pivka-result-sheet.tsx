'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, type StoredService, type StoredServiceRequestResponse } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/stores/auth';
import { useHisStore } from '@/lib/stores/his';
import { useCurrentRoomStore } from '@/lib/stores/current-room';
import { pdfBase64FromContainerWithPuppeteer } from '@/lib/utils/pdf-export';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} ${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

function formatInstructionTime(n?: number): string {
  if (n === undefined || n === null || n === 0) return '—';
  const s = String(n);
  if (s.length < 14) return s;
  const y = s.slice(0, 4);
  const mo = s.slice(4, 6);
  const d = s.slice(6, 8);
  const h = s.slice(8, 10);
  const mi = s.slice(10, 12);
  return `${h}:${mi} ${d}/${mo}/${y}`;
}

/** yyyyMMddHHmmss (number) cho HIS UpdateResult */
function formatHisYyyyMMddHHmmss(d: Date): number {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return Number.parseInt(`${y}${mo}${day}${h}${mi}${s}`, 10);
}

const HIS_UPDATE_RESULT_URL =
  process.env.NEXT_PUBLIC_HIS_UPDATE_RESULT_URL ||
  'http://192.168.7.200:1499/api/HisTestServiceReq/UpdateResult';

export interface PivkaResultValues {
  afpTotal: string;
  afpL3: string;
  pivkaIi: string;
}

type PivkaKey = keyof PivkaResultValues;

const TABLE_ROWS: Array<{
  key: PivkaKey;
  label: string;
  unit: string;
  refLabel: string;
  refNumber: number;
  machine: string;
}> = [
    { key: 'afpTotal', label: 'Định lượng AFP toàn phần', unit: 'ng/mL', refLabel: '<10', refNumber: 10, machine: 'μTaswako i30' },
    { key: 'afpL3', label: 'Định lượng AFP-L3', unit: '%', refLabel: '<10', refNumber: 10, machine: 'μTaswako i30' },
    { key: 'pivkaIi', label: 'Định lượng PIVKA-II', unit: 'mAU/mL', refLabel: '<40', refNumber: 40, machine: 'μTaswako i30' },
  ];

interface PivkaResultSheetProps {
  stored: StoredServiceRequestResponse;
  selectedService: StoredService;
  values: PivkaResultValues;
  onChange: (values: PivkaResultValues) => void;
}

function getResultTextAlign(rawValue: string | undefined | null, refNumber: number) {
  const trimmed = rawValue?.trim() ?? '';
  if (trimmed === '') return 'text-center';

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return 'text-center';

  // "bằng/ lớn hơn" => căn phải; "bé hơn" => căn giữa
  return parsed < refNumber ? 'text-center' : 'text-right';
}

export function PivkaResultSheet({
  stored,
  selectedService,
  values,
  onChange,
}: PivkaResultSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const { token: hisToken } = useHisStore();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentRoomId: storeCurrentRoomId, currentDepartmentId: storeCurrentDepartmentId } =
    useCurrentRoomStore();
  const [confirmSignDialogOpen, setConfirmSignDialogOpen] = useState(false);
  const [confirmCancelSignDialogOpen, setConfirmCancelSignDialogOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const { data: workflowActionsData, isLoading: workflowLoading } = useQuery({
    queryKey: ['workflow-action-info', stored.id],
    queryFn: () => apiClient.getWorkflowActionInfo(stored.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!stored.id,
  });

  const sampleReceiverInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 2),
    [workflowActionsData]
  );
  const performerInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 5),
    [workflowActionsData]
  );

  const receptionCode = selectedService.receptionCode?.trim() ?? '';
  const referringDoctor =
    stored.requestUsername && stored.requestLoginname
      ? `${stored.requestUsername} (${stored.requestLoginname})`
      : (stored.requestUsername ?? stored.requestLoginname ?? '—');
  const departmentUnit =
    [stored.requestDepartmentName, stored.requestRoomName].filter(Boolean).join(' - ') || '-';
  const yearOfBirth = stored.patientDob ? String(stored.patientDob).slice(0, 4) : '—';
  const orderCode = stored.serviceReqCode || stored.hisServiceReqCode || '—';

  const now = new Date();
  const approvalDateLine = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Phieu_PIVKA_${orderCode}_${receptionCode || 'SID'}`,
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const { toast } = useToast();

  const createResultMutation = useMutation({
    mutationFn: async (body: {
      storedSrServicesId: string;
      pivkaIiResult?: string;
      afpFullResult?: string;
      afpL3?: string;
    }) => apiClient.createPivkaIiResult(body),
    onSuccess: async () => {
      toast({
        title: 'Thành công',
        description: 'Đã lưu kết quả PIVKA.',
      });

      queryClient.invalidateQueries({
        queryKey: ['pivka-ii-result', 'by-stored-sr-service', selectedService.id],
      });

      // Sau khi lưu kết quả thành công, chuyển trạng thái workflow (giống các form khác)
      try {
        // Tương tự form-gpb: xóa workflow history cũ ở toState.sortOrder = 5
        if (stored.id) {
          const cached = queryClient.getQueriesData<{
            data?: { items?: Array<{ id?: string; storedServiceReqId?: string; toState?: { sortOrder?: number } }> };
          }>({ queryKey: ['workflow-history'] });

          for (const [, cachedData] of cached) {
            const items = cachedData?.data?.items ?? [];
            const item = items.find(
              (i) => i.storedServiceReqId === stored.id && i.toState?.sortOrder === 5 && i.id
            );
            if (item?.id) {
              await apiClient.deleteWorkflowHistory(item.id);
              queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
              break;
            }
          }
        }

        const workflowResponse = await apiClient.transitionWorkflow({
          storedServiceReqId: stored.id,
          toStateId: '426df256-bbfe-28d1-e065-9e6b783dd008',
          actionType: 'COMPLETE',
          currentUserId: user?.id,
          currentDepartmentId: storeCurrentDepartmentId,
          currentRoomId: storeCurrentRoomId,
        });

        if (!workflowResponse.success) {
          toast({
            title: 'Cảnh báo',
            description:
              workflowResponse.message || workflowResponse.error || 'Đã lưu nhưng không thể cập nhật trạng thái quy trình.',
            variant: 'destructive',
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái quy trình.';
        toast({
          title: 'Cảnh báo',
          description: message,
          variant: 'destructive',
        });
      }
    },
    onError: (err) => {
      toast({
        title: 'Không thể lưu',
        description: err instanceof Error ? err.message : 'Lỗi không xác định',
        variant: 'destructive',
      });
    },
  });

  function patch(key: keyof PivkaResultValues, raw: string) {
    onChange({ ...values, [key]: raw });
  }

  function validateAndBuildPayload() {
    const afpFullResult = values.afpTotal ?? '';
    const afpL3 = values.afpL3 ?? '';
    const pivkaIiResult = values.pivkaIi ?? '';

    const missing = [afpFullResult, afpL3, pivkaIiResult].some((v) => v.trim() === '');
    if (missing) {
      toast({
        title: 'Thiếu dữ liệu',
        description: 'Bạn cần nhập đầy đủ 3 ô kết quả trước khi lưu.',
        variant: 'destructive',
      });
      return null;
    }

    return {
      storedSrServicesId: selectedService.id,
      pivkaIiResult,
      afpFullResult,
      afpL3,
    };
  }

  async function getHisTokenCode(): Promise<string | null> {
    let tokenCode: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('hisTokenCode') : null;
    if (!tokenCode) tokenCode = hisToken?.tokenCode || null;
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
    return tokenCode;
  }

  async function handleSignDocument() {
    if (!printRef.current) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tạo PDF để ký.',
        variant: 'destructive',
      });
      return;
    }

    const pivkaPayload = validateAndBuildPayload();
    if (!pivkaPayload) return;

    const tokenCode = await getHisTokenCode();
    if (!tokenCode) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng đăng nhập để sử dụng tính năng ký điện tử.',
        variant: 'destructive',
      });
      return;
    }

    setIsSigning(true);
    try {
      const signerResponse = await apiClient.getEmrSigner(tokenCode, 'EMR', { Start: 0, Limit: 1 });
      const signerData = signerResponse.data?.Data?.[0];
      const signerId = signerData?.ID;
      if (!signerResponse.success || !signerId) {
        throw new Error('Không tìm thấy thông tin người ký trong hệ thống EMR');
      }

      const pdfResult = await pdfBase64FromContainerWithPuppeteer(printRef.current);
      if (!pdfResult?.base64) {
        throw new Error('Không thể tạo file PDF để ký');
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const pageCount = pdfResult.pageCount;
      const signRequest = {
        PointSign: {
          CoorXRectangle: 405,
          CoorYRectangle: 65,
          PageNumber: pageCount,
          MaxPageNumber: pageCount,
          WidthRectangle: 150,
          HeightRectangle: 100,
          TextPosition: 0,
          TypeDisplay: 2,
          SizeFont: 14,
          FormatRectangleText: '{SIGNTIME}',
        },
        DocumentName: `${dateStr}-${stored.serviceReqCode}_PIVKA_Signed`,
        TreatmentCode: stored.treatmentCode,
        DocumentTypeId: 22,
        DocumentGroupId: 121,
        HisCode: `SERVICE_REQ_CODE:${stored.serviceReqCode}`,
        FileType: 0,
        OriginalVersion: {
          Base64Data: pdfResult.base64,
        },
        Signs: [
          {
            SignerId: Number(signerId),
            SerialNumber: '',
            NumOrder: pageCount,
          },
        ],
      };

      const signResponse = await apiClient.createAndSignHsm(signRequest, tokenCode, 'EMR');
      const emrResponse = signResponse.data as any;
      if (!signResponse.success || !signResponse.data || emrResponse?.Success !== true) {
        throw new Error('Ký số thất bại');
      }

      const finishTime = formatHisYyyyMMddHHmmss(new Date());

      const documentId = signResponse.data?.Data?.DocumentId;
      const signedDocumentBase64 = signResponse.data?.Data?.Signs?.[0]?.Version?.Base64Data;

      if (!documentId) {
        throw new Error('Không nhận được documentId từ hệ thống ký số');
      }

      if (!signedDocumentBase64) {
        throw new Error('Không nhận được nội dung tài liệu đã ký');
      }

      const storeSignedResponse = await apiClient.storeSignedDocuments({
        storedServiceReqId: stored.id,
        hisServiceReqCode: stored.hisServiceReqCode || stored.serviceReqCode || '',
        documentId: Number(documentId),
        signedDocumentBase64,
      });
      if (!storeSignedResponse.success) {
        throw new Error(storeSignedResponse.message || 'Không thể lưu tài liệu đã ký');
      }

      const patchResponse = await apiClient.patchServiceRequestDocumentId(selectedService.id, Number(documentId));
      if (!patchResponse.success) {
        throw new Error(patchResponse.message || 'Không thể cập nhật documentId cho dịch vụ');
      }

      const serviceReqCodeForHis = stored.barcodeXn?.trim() || '';
      if (!serviceReqCodeForHis) {
        throw new Error('Thiếu barcodeXn (ServiceReqCode) trên y lệnh đã lưu');
      }

      const codeRes = await apiClient.getServiceRequestByCode(stored.serviceReqCode);
      const svcDetail = codeRes.data;
      const matchedSvc =
        svcDetail?.services?.find((s) => s.serviceCode === selectedService.serviceCode) ??
        svcDetail?.services?.[0];
      const rawTestIndex = matchedSvc?.testIndexCodes?.trim() || stored.testIndexCode?.trim() || '';
      const testIndexCode = rawTestIndex.split(',')[0]?.trim() || '';
      if (!testIndexCode) {
        throw new Error('Không tìm thấy TestIndexCode (testIndexCodes) cho dịch vụ');
      }

      const updateBody = {
        ApiData: {
          ServiceReqCode: serviceReqCodeForHis,
          ApproverLoginname: signerData.LOGINNAME || '',
          ApproverUsername: signerData.USERNAME || '',
          FinishTime: finishTime,
          IsCancel: null as null,
          TestIndexDatas: [
            {
              TestIndexCode: testIndexCode,
              Value: String(pivkaPayload.pivkaIiResult ?? '').trim(),
              Description: '<40',
              ResultCode: 0,
              ResultDescription: 'KQ',
              MayXetNghiemID: String(selectedService.testId ?? ''),
            },
          ],
        },
      };

      const hisUpdateRes = await fetch(HIS_UPDATE_RESULT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          TokenCode: tokenCode,
        },
        body: JSON.stringify(updateBody),
      });
      if (!hisUpdateRes.ok) {
        const errText = await hisUpdateRes.text().catch(() => '');
        throw new Error(`HisTestServiceReq/UpdateResult: ${hisUpdateRes.status} ${errText}`.trim());
      }

      // Sau khi ký số thành công, chuyển trạng thái workflow (giống form GPB)
      try {
        const workflowResponse = await apiClient.transitionWorkflow({
          storedServiceReqId: stored.id,
          toStateId: '426df256-bc00-28d1-e065-9e6b783dd008',
          actionType: 'COMPLETE',
          currentUserId: user?.id,
          currentDepartmentId: storeCurrentDepartmentId,
          currentRoomId: storeCurrentRoomId,
        })

        if (!workflowResponse.success) {
          toast({
            title: 'Cảnh báo',
            description: workflowResponse.message || workflowResponse.error || 'Không thể cập nhật trạng thái quy trình.',
            variant: 'destructive',
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái quy trình.';
        toast({
          title: 'Cảnh báo',
          description: message,
          variant: 'destructive',
        });
      }

      toast({
        title: 'Thành công',
        description: 'Đã ký số, lưu tài liệu đã ký, cập nhật documentId và gửi UpdateResult.',
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Ký số thất bại',
        variant: 'destructive',
      });
    } finally {
      setIsSigning(false);
    }
  }

  async function handleCancelDigitalSign() {
    const rawDocumentId = selectedService.documentId;
    if (rawDocumentId === undefined || rawDocumentId === null || String(rawDocumentId).trim() === '') {
      toast({
        title: 'Lỗi',
        description: 'Không có chữ ký số để hủy.',
        variant: 'destructive',
      });
      return;
    }

    const tokenCode = await getHisTokenCode();
    if (!tokenCode) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng đăng nhập để sử dụng tính năng ký điện tử.',
        variant: 'destructive',
      });
      return;
    }

    setIsCanceling(true);
    try {
      const numericDocumentId =
        typeof rawDocumentId === 'string' ? Number.parseInt(rawDocumentId, 10) : Number(rawDocumentId);
      if (!Number.isFinite(numericDocumentId)) {
        throw new Error('documentId không hợp lệ');
      }

      // 1) Hủy chữ ký số trên EMR
      const deleteResponse = await apiClient.deleteEmrDocument(numericDocumentId, tokenCode, 'EMR');
      const emrResponse = deleteResponse.data as any;
      if (!deleteResponse.success || !emrResponse?.Success) {
        const emrMessage =
          emrResponse?.Param?.Messages?.join(', ') ||
          emrResponse?.Param?.MessageCodes?.join(', ') ||
          deleteResponse.message ||
          deleteResponse.error ||
          'Không thể hủy chữ ký số';
        throw new Error(emrMessage);
      }

      // 2) Trả documentId về null cho service
      const patchResponse = await apiClient.patchServiceRequestDocumentId(selectedService.id, null);
      if (!patchResponse.success) {
        throw new Error(patchResponse.message || patchResponse.error || 'Không thể cập nhật documentId cho dịch vụ');
      }

      // 3) Xóa workflow history ở state hoàn tất
      const stateId = '426df256-bc00-28d1-e065-9e6b783dd008';
      const deleteWorkflowHistoryResponse = await apiClient.deleteWorkflowHistoryByStateAndRequest(stateId, stored.id);
      if (!deleteWorkflowHistoryResponse.success) {
        toast({
          title: 'Cảnh báo',
          description:
            deleteWorkflowHistoryResponse.message ||
            deleteWorkflowHistoryResponse.error ||
            'Đã hủy chữ ký nhưng không thể xóa workflow history.',
          variant: 'destructive',
        });
      }

      // Refresh UI
      queryClient.invalidateQueries({ queryKey: ['workflow-history'] });
      // Parent PIVKA queryKey: ['stored-service-request', storedServiceReqId, refreshTrigger] với refreshTrigger = 0
      queryClient.invalidateQueries({ queryKey: ['stored-service-request', stored.id, 0] });

      toast({
        title: 'Thành công',
        description: 'Đã hủy chữ ký số.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể hủy chữ ký số';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCanceling(false);
    }
  }

  // Handler xem văn bản đã ký (stream PDF theo hisServiceReqCode/serviceReqCode)
  async function handleViewSignedDocument() {
    const hisCode = stored.hisServiceReqCode || stored.serviceReqCode;
    if (!hisCode) {
      toast({
        title: 'Lỗi',
        description: 'Không có mã yêu cầu dịch vụ HIS',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = await apiClient.getSignedDocumentByHisCode(hisCode);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e: any) {
      toast({
        title: 'Lỗi',
        description: e?.message || 'Không tải được văn bản đã ký',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end print:hidden">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => handlePrint()}>
            In phiếu
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const payload = validateAndBuildPayload();
              if (!payload) return;
              createResultMutation.mutate(payload);
            }}
            disabled={createResultMutation.isPending}
          >
            {createResultMutation.isPending ? 'Đang lưu...' : 'Lưu kết quả'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmSignDialogOpen(true)}
            disabled={isSigning || isCanceling}
          >
            {isSigning ? 'Đang ký số...' : 'Ký số'}
          </Button>

          {selectedService.documentId !== undefined &&
            selectedService.documentId !== null &&
            String(selectedService.documentId).trim() !== '' && (
              <Button type="button" variant="outline" onClick={handleViewSignedDocument} disabled={isSigning || isCanceling}>
                Xem văn bản đã ký
              </Button>
            )}

          {selectedService.documentId !== undefined &&
            selectedService.documentId !== null &&
            String(selectedService.documentId).trim() !== '' && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmCancelSignDialogOpen(true)}
                disabled={isSigning || isCanceling}
              >
                {isCanceling ? 'Đang hủy...' : 'Hủy chữ ký số'}
              </Button>
            )}
        </div>
      </div>

      <Dialog open={confirmSignDialogOpen} onOpenChange={setConfirmSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận ký số</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn ký số cho phiếu này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSignDialogOpen(false)}
              disabled={isSigning || isCanceling}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                setConfirmSignDialogOpen(false);
                handleSignDocument();
              }}
              disabled={isSigning || isCanceling}
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

      <Dialog open={confirmCancelSignDialogOpen} onOpenChange={setConfirmCancelSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy chữ ký số</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy chữ ký số? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmCancelSignDialogOpen(false)}
              disabled={isSigning || isCanceling}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                setConfirmCancelSignDialogOpen(false);
                handleCancelDigitalSign();
              }}
              disabled={isSigning || isCanceling}
              variant="destructive"
            >
              {isCanceling ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        ref={printRef}
        className="pivka-print-root w-full max-w-[210mm] mx-auto bg-white text-black rounded-lg border border-gray-200 shadow-sm print:shadow-none print:border-0 print:rounded-none print:max-w-none print:w-full print:mx-0"
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @page { size: A4; margin: 0; }
              .pivka-a4 {
                font-family: Cambria, "Times New Roman", serif;
                line-height: 1.25;
                font-size: 15px;
                box-sizing: border-box;
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 20mm 15mm 20mm 15mm;
                box-shadow: none;
              }
              @media print {
                .pivka-print-root {
                  max-width: none !important;
                  width: 100% !important;
                  margin: 0 !important;
                }
                .pivka-a4 {
                  width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto;
                  padding: 20mm 15mm 20mm 15mm !important;
                  box-shadow: none;
                }
                .pivka-a4 table.pivka-table {
                  width: 100%;
                }
                .avoid-break { page-break-inside: avoid; break-inside: avoid; }
              }
              .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            `,
          }}
        />

        <div className="pivka-a4 box-border">
          <div className="w-full mb-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-start avoid-break">
            <div className="flex gap-2 items-center sm:col-span-1">
              <img src="/logo-bvbm-wh.png" alt="Logo BVBM" className="w-[50%]  object-contain" />
              <img src="/logo-yhhnub.jpg" alt="Logo TT" className="w-[50%]  object-contain" />
            </div>
            <div className="sm:col-span-2 text-center text-[13px] sm:text-sm leading-tight">
              <div className="font-bold">BỘ Y TẾ</div>
              <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
              <div className="font-bold">TRUNG TÂM Y HỌC HẠT NHÂN VÀ UNG BƯỚU</div>
              <div className="font-bold">ĐƠN VỊ GEN TRỊ LIỆU</div>
            </div>
            {/* Cụm QR + PID/SID — giống form-gen-1 (mã = receptionCode) */}
            <div className="text-center pl-2">
              {receptionCode ? (
                <div className="flex flex-col items-center mb-2">
                  <QRCodeSVG
                    value={receptionCode}
                    size={64}
                    level="M"
                    includeMargin={false}
                    aria-label={`Mã QR barcode ${receptionCode}`}
                  />
                </div>
              ) : null}
              <div className="text-sm text-left inline-block">
                <div>PID: {stored.patientCode}</div>
                <div>SID: {orderCode || '—'}</div>
              </div>
            </div>
            <div className="col-span-full text-center text-[13px] sm:text-sm -mt-1 relative top-[-28px]">
              Tầng 16 nhà Q, 78 – Giải Phóng – Kim Liên – Hà Nội
            </div>
          </div>

          <div className="avoid-break text-center mb-4 relative top-[-14px]">
            <h1 className="text-lg sm:text-xl font-bold">PHIẾU KẾT QUẢ XÉT NGHIỆM</h1>
          </div>

          <div className="avoid-break mb-3 text-[13px] sm:text-sm space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-3 gap-y-1 items-baseline">
              <span className="sm:col-span-2 font-semibold shrink-0">Họ tên:</span>
              <span className="sm:col-span-4">{stored.patientName}</span>
              <span className="font-semibold text-nowrap">Năm sinh:</span>
              <span className='ml-2'>{yearOfBirth}</span>
              <span className="font-semibold text-nowrap">Giới tính:</span>
              <span className='ml-2'>{stored.patientGenderName}</span>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <span className="font-semibold shrink-0">Địa chỉ:</span>
              <span>{stored.patientAddress}</span>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <span className="font-semibold shrink-0">Chẩn đoán:</span>
              <span>{stored.icdName || '—'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">Bác sĩ chỉ định:</span>{' '}
                <span>{referringDoctor}</span>
              </div>
              <div>
                <span className="font-semibold">Thời gian chỉ định:</span>{' '}
                <span>{formatInstructionTime(stored.instructionTime)}</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">Đơn vị:</span> <span>{departmentUnit}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">Người nhận mẫu:</span>{' '}
                <span>{sampleReceiverInfo?.actionUserFullName ?? '—'}</span>
              </div>
              <div>
                <span className="font-semibold">Thời gian nhận mẫu:</span>{' '}
                <span>{formatDateTime(sampleReceiverInfo?.createdAt)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-semibold">Loại mẫu:</span>{' '}
                <span>{selectedService.sampleTypeName ?? '—'}</span>
              </div>
              <div>
                <span className="font-semibold">Tình trạng mẫu:</span> <span>Đạt</span>
              </div>
            </div>
            <div>
              <span className="font-semibold">Người thực hiện:</span>{' '}
              <span>
                {workflowLoading ? 'Đang tải…' : (performerInfo?.actionUserFullName ?? '—')}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto avoid-break mb-4">
            <table className="pivka-table w-full border-collapse border border-black text-[12px] sm:text-[13px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black px-1 py-1.5 w-8">STT</th>
                  <th className="border border-black px-1 py-1.5 text-left min-w-[170px]">Yêu cầu xét nghiệm</th>
                  <th className="border border-black px-1 py-1.5 min-w-[88px] bg-amber-50/80">Kết quả</th>
                  <th className="border border-black px-1 py-1.5">Đơn vị</th>
                  <th className="border border-black px-1 py-1.5">Khoảng tham chiếu</th>
                  <th className="border border-black px-1 py-1.5">Máy XN/PPXN</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row, idx) => (
                  <tr key={row.key}>
                    <td className="border border-black px-1 py-1 text-center">{idx + 1}</td>
                    <td className="border border-black px-1 py-1">{row.label}</td>
                    <td className="border border-black p-0 bg-amber-50/40 print:p-1">
                      <Input
                        type="text"
                        value={values[row.key] ?? ''}
                        onChange={(e) => {
                          patch(row.key, e.target.value);
                        }}
                        className={cn(
                          'h-9 rounded-none border-0 shadow-none font-medium',
                          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
                          'bg-transparent print:border-0 print:h-8',
                          getResultTextAlign(values[row.key], row.refNumber)
                        )}
                        
                      />
                    </td>
                    <td className="border border-black px-1 py-1 text-center">{row.unit}</td>
                    <td className="border border-black px-1 py-1 text-center">{row.refLabel}</td>
                    <td className="border border-black px-1 py-1 text-center">{row.machine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="avoid-break mb-6 text-[12px] sm:text-[13px] p-3 rounded-sm">
            <p className="font-semibold mb-1">Ghi chú:</p>
            <div>
              Kết quả lệch phải: cao hơn CSBT.
            </div>
            <div>
              Kết quả nằm giữa: Bình thường.
            </div>
          </div>

          <div className="avoid-break border-t border-black pt-4 text-center text-[13px] sm:text-sm w-1/3 ml-auto mr-20">
            <div className="mb-1">
              {approvalDateLine}
            </div>
            <div className="font-bold">Người phê duyệt kết quả</div>
            <div className="h-16 mt-2" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PivkaServicePickerProps {
  services: StoredService[];
  value: string;
  onChange: (serviceId: string) => void;
}

export function PivkaServicePicker({ services, value, onChange }: PivkaServicePickerProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Dịch vụ / mẫu:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Chọn dịch vụ" />
        </SelectTrigger>
        <SelectContent>
          {services.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.serviceName}
              {s.receptionCode ? ` — ${s.receptionCode}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
