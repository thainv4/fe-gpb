'use client';

import React, { useMemo, useRef, useState, type RefObject } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { apiClient, type StoredService, type StoredServiceRequestResponse } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useServerTime } from '@/hooks/use-server-time';
import { QRCodeSVG } from 'qrcode.react';

dayjs.extend(utc);
dayjs.extend(timezone);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GEN_TABLE_COLUMNS,
  type GenGeneRowKey,
  type GenResultValues,
} from '@/components/test-results/gen-result-types';

function emptyDisplay(value?: string) {
  return value?.trim() ?? '';
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m} ${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

function calculateAge(dob: number): number {
  const dobStr = dob.toString();
  const year = Number.parseInt(dobStr.substring(0, 4), 10);
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

/** Lấy phần text chữ thường từ resultConclude HTML (bỏ thẻ, bỏ tiêu đề CHẨN ĐOÁN MÔ BỆNH HỌC / CHẨN ĐOÁN TẾ BÀO HỌC). */
function getResultConcludePlainText(html: string): string {
  if (!html?.trim()) return '';
  const headerMôBệnhHọc = /chẩn\s*đoán\s*mô\s*bệnh\s*học\s*:?\s*/i;
  const headerTếBàoHọc = /chẩn\s*đoán\s*tế\s*bào\s*học\s*:?\s*/i;
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    let text = (div.textContent ?? div.innerText ?? '').replace(/\s+/g, ' ').trim();
    text = text.replace(headerMôBệnhHọc, '').replace(headerTếBàoHọc, '').trim();
    return text;
  }
  const stripped = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.replace(headerMôBệnhHọc, '').replace(headerTếBàoHọc, '').trim();
}

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
};

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="gen-form-row grid grid-cols-12 gap-x-2 gap-y-1 items-baseline w-full">
      {children}
    </div>
  );
}

function FormCell({
  label,
  value,
  colStart,
  colSpan,
}: {
  label: string;
  value?: string;
  colStart: number;
  colSpan: number;
}) {
  return (
    <div
      className={cn('flex items-baseline gap-1 min-w-0', COL_SPAN_CLASS[colSpan])}
      style={{ gridColumn: `${colStart} / span ${colSpan}` }}
    >
      <span className="font-semibold shrink-0 whitespace-nowrap">{label}</span>
      <span className="flex-1 min-w-0 pb-px min-h-[1.1em]">
        {emptyDisplay(value)}
      </span>
    </div>
  );
}



export interface GenResultSheetProps {
  stored: StoredServiceRequestResponse;
  service: StoredService;
  values: GenResultValues;
  onChange: (v: GenResultValues) => void;
  readOnly?: boolean;
  /** Container DOM cho xuất PDF / đo vị trí chữ ký EMR ([data-sign-anchor]). */
  pdfRef?: RefObject<HTMLDivElement | null>;
  onSave?: () => void;
  onSign?: () => void;
  onViewSigned?: () => void;
  onCancelSign?: () => void;
  isSaving?: boolean;
  isSigning?: boolean;
  canSign?: boolean;
  signDisabledTitle?: string;
  canViewSigned?: boolean;
  canCancelSign?: boolean;
}

export function GenResultSheet({
  stored,
  service,
  values,
  onChange,
  readOnly = false,
  pdfRef,
  onSave,
  onSign,
  onViewSigned,
  onCancelSign,
  isSaving = false,
  isSigning = false,
  canSign = true,
  signDisabledTitle,
  canViewSigned = false,
  canCancelSign = false,
}: GenResultSheetProps) {
  const internalPrintRef = useRef<HTMLDivElement>(null);
  const printRef = pdfRef ?? internalPrintRef;
  const [methodSelectOpen, setMethodSelectOpen] = useState(false);

  // Workflow action info — lấy người nhận mẫu, người thực hiện
  const { data: workflowActionsData } = useQuery({
    queryKey: ['workflow-action-info', stored.id],
    queryFn: () => apiClient.getWorkflowActionInfo(stored.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!stored.id,
  });

  const sampleReceiverInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 2),
    [workflowActionsData],
  );
  const performerInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 5),
    [workflowActionsData],
  );

  const orderCode = stored.serviceReqCode || stored.hisServiceReqCode || '';

  // API y lệnh gốc từ HIS để lấy thông tin chi tiết (BS chỉ định, ...)
  const { data: serviceRequestData } = useQuery({
    queryKey: ['service-request-by-code', orderCode],
    queryFn: () => apiClient.getServiceRequestByCode(orderCode),
    enabled: !!orderCode,
    staleTime: 5 * 60 * 1000,
  });
  const serviceRequest = serviceRequestData?.data;

  // Computed values từ stored / service
  const yearOfBirth = stored.patientDob ? String(stored.patientDob).slice(0, 4) : '';
  const age = stored.patientDob ? String(calculateAge(stored.patientDob)) : '';
  const referringDoctor = useMemo(() => {
    const username = (serviceRequest?.requestUsername || stored.requestUsername)?.trim();
    const loginname = (serviceRequest?.requestLoginname || stored.requestLoginname)?.trim();
    if (username && loginname) {
      return `${username} (${loginname})`;
    }
    return username || loginname || '';
  }, [serviceRequest?.requestUsername, serviceRequest?.requestLoginname, stored.requestUsername, stored.requestLoginname]);
  const departmentUnit = useMemo(
    () => [stored.requestDepartmentName, stored.requestRoomName].filter(Boolean).join(' - '),
    [stored.requestDepartmentName, stored.requestRoomName],
  );
  const phoneNumber = stored.patientMobile ?? stored.patientPhone ?? '';
  const receptionCode = service.receptionCode?.trim() ?? '';

  const barcodeGenGpb = useMemo(
    () =>
      service.barcodeGenGpb?.trim() ||
      stored.barcodeGenGpb?.trim() ||
      '',
    [service.barcodeGenGpb, stored.barcodeGenGpb],
  );

  const { data: resultConcludeData } = useQuery({
    queryKey: ['stored-services-result-conclude', barcodeGenGpb],
    queryFn: () => apiClient.getStoredServicesResultConclude(barcodeGenGpb),
    enabled: !!barcodeGenGpb,
    staleTime: 2 * 60 * 1000,
  });

  const resultConcludePlainText = useMemo(() => {
    const raw = resultConcludeData?.data?.resultConclude;
    return raw ? getResultConcludePlainText(raw) : '';
  }, [resultConcludeData?.data?.resultConclude]);

  const diagnosisDisplay = useMemo(() => {
    const headerResultConclude =
      service.resultConcludeGenGpb?.trim() ||
      stored.resultConcludeGenGpb?.trim() ||
      '';
    return headerResultConclude || resultConcludePlainText;
  }, [
    service.resultConcludeGenGpb,
    stored.resultConcludeGenGpb,
    resultConcludePlainText,
  ]);

  const sampleTypeDisplay = useMemo(() => {
    const headerSampleTypeName =
      service.sampleTypeNameGenGpb?.trim() ||
      stored.sampleTypeNameGenGpb?.trim() ||
      '';
    return (
      headerSampleTypeName ||
      resultConcludeData?.data?.sampleTypeName?.trim() ||
      ''
    );
  }, [
    service.sampleTypeNameGenGpb,
    stored.sampleTypeNameGenGpb,
    resultConcludeData?.data?.sampleTypeName,
  ]);

  const shouldShowGpbInfo = Boolean(
    barcodeGenGpb || sampleTypeDisplay || diagnosisDisplay,
  );

  // API thời gian server
  const { data: serverTimeIso } = useServerTime();

  const signatureTimeLine = useMemo(() => {
    if (!serverTimeIso) return '00:00 Ngày ... tháng ... năm 20...';
    const d = dayjs(serverTimeIso).tz('Asia/Ho_Chi_Minh');
    if (!d.isValid()) return '00:00 Ngày ... tháng ... năm 20...';
    const timeStr = d.format('HH:mm');
    return `${timeStr} Ngày ${d.date()} tháng ${d.month() + 1} năm ${d.year()}`;
  }, [serverTimeIso]);

  const { data: allMethodsData } = useQuery({
    queryKey: ['testing-methods-gen', 'all-for-gen-sheet'],
    queryFn: () => apiClient.getTestingMethodsGen({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const methodOptions = useMemo(() => {
    const fromAll = allMethodsData?.data?.testingMethodsGen;
    return Array.isArray(fromAll)
      ? (fromAll as Array<{ id: string; methodName: string }>)
      : [];
  }, [allMethodsData]);

  const readOnlyMethodLabel = useMemo(() => {
    if (values.testingMethodGenId) {
      const fromOptions = methodOptions.find((m) => m.id === values.testingMethodGenId);
      if (fromOptions?.methodName) return fromOptions.methodName;
    }
    return service.testingMethodGen?.methodName ?? '';
  }, [values.testingMethodGenId, methodOptions, service.testingMethodGen?.methodName]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Phieu_KQXN_GEN',
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  function patchGeneRow(key: GenGeneRowKey, raw: string) {
    onChange({
      ...values,
      geneRow: { ...values.geneRow, [key]: raw },
    });
  }

  function patchTestingMethod(id: string) {
    onChange({ ...values, testingMethodGenId: id });
  }

  const hasActions = !readOnly && (onSave || onSign || onViewSigned || onCancelSign);

  return (
    <div className="space-y-4">
      {hasActions && (
        <div className="flex flex-wrap gap-2 justify-end print:hidden">
          <Button type="button" variant="outline" onClick={() => handlePrint()}>
            In phiếu
          </Button>
          {onSave && (
            <Button type="button" variant="outline" onClick={onSave} disabled={isSaving || isSigning}>
              {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
            </Button>
          )}
          {onSign && (
            <Button
              type="button"
              variant="outline"
              onClick={onSign}
              disabled={isSigning || isSaving || !canSign}
              title={signDisabledTitle}
            >
              {isSigning ? 'Đang ký số...' : 'Ký số'}
            </Button>
          )}
          {onViewSigned && (
            <Button
              type="button"
              variant="outline"
              onClick={onViewSigned}
              disabled={!canViewSigned || isSigning}
            >
              Xem văn bản đã ký
            </Button>
          )}
          {onCancelSign && (
            <Button
              type="button"
              variant="destructive"
              onClick={onCancelSign}
              disabled={!canCancelSign || isSigning}
            >
              Hủy chữ ký số
            </Button>
          )}
        </div>
      )}

      {!hasActions && !readOnly && (
        <div className="flex flex-wrap gap-2 justify-end print:hidden">
          <Button type="button" variant="outline" onClick={() => handlePrint()}>
            In phiếu
          </Button>
        </div>
      )}

      <div
        ref={printRef}
        className="gen-print-root mx-auto max-w-[210mm] bg-white text-[13px] leading-snug"
        style={{ fontFamily: "Cambria, 'Hoefler Text', serif" }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .gen-a4 {
                font-family: Cambria, 'Hoefler Text', serif;
                font-size: 13px;
                line-height: 1.35;
                box-sizing: border-box;
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 20mm 15mm;
              }
              @media print {
                .gen-print-root { max-width: none !important; width: 100% !important; margin: 0 !important; }
                .gen-a4 {
                  width: 210mm;
                  min-height: 297mm;
                  margin: 0 auto;
                  padding: 20mm 15mm !important;
                  box-shadow: none;
                }
                .gen-a4 table.gen-table { width: 100%; }
                .gen-table textarea {
                  overflow: visible !important;
                  height: auto !important;
                  white-space: pre-wrap;
                  word-break: break-word;
                }
                .avoid-break { page-break-inside: avoid; break-inside: avoid; }
              }
              .avoid-break { page-break-inside: avoid; break-inside: avoid; }
              .gen-form-row { width: 100%; }
              .gen-table textarea {
                white-space: pre-wrap;
                word-break: break-word;
              }
            `,
          }}
        />

        <div className="gen-a4 box-border shadow-sm print:shadow-none flex flex-col">
          {/* Header */}
          <div className="w-full mb-2 grid grid-cols-1 sm:grid-cols-4 gap-2 items-start avoid-break">
            <div className="flex gap-2 items-center sm:col-span-1">
              <img src="/logo-bvbm-wh.png" alt="Logo BVBM" className="w-[50%] object-contain" />
              <img src="/logo-yhhnub.jpg" alt="Logo TT" className="w-[50%] object-contain" />
            </div>
             <div className="sm:col-span-2 text-center text-[12px] sm:text-[13px] leading-tight">
              <div className="font-bold">BỘ Y TẾ</div>
              <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
              <div className='w-[300px] mx-auto'>VIỆN XÉT NGHIỆM Y HỌC - VIỆN Y HỌC HẠT NHÂN VÀ UNG BƯỚU BẠCH MAI</div>
              <div>TRUNG TÂM GEN TRỊ LIỆU VÀ Y HỌC CHÍNH XÁC</div>
              <div className="text-[11px] sm:text-[12px] font-normal mt-0.5">
                Tầng 16 Nhà Q, 78 - Giải Phóng - Kim Liên - Hà Nội
              </div>
            </div>
            <div className="text-left text-xs sm:pl-2">
              {receptionCode ? (
                <div className="flex justify-center mb-1 bg-white p-0.5">
                  <QRCodeSVG
                    value={receptionCode}
                    size={56}
                    level="M"
                    includeMargin={false}
                    aria-label={`Mã QR barcode ${receptionCode}`}
                  />
                </div>
              ) : (
                <div
                  className="h-14 w-full border border-black mb-1 flex items-center justify-center text-[10px] text-muted-foreground"
                  aria-hidden
                >
                  BARCODE
                </div>
              )}
              <div>SID: {receptionCode}</div>
              <div>Mã y lệnh: {orderCode}</div>
              <div>Mã bệnh nhân: {stored.patientCode}</div>
            </div>
          </div>

          {/* Title */}
          <div className="avoid-break text-center mb-3">
            <h1 className="text-base sm:text-lg font-bold">PHIẾU KẾT QUẢ XÉT NGHIỆM</h1>
            <div className="mt-1 text-sm sm:text-base font-bold uppercase">
              {service.serviceName}
            </div>
            <div className="mt-1 flex justify-center gap-6 text-sm font-normal">
              <span>□ Thường</span>
              <span>□ Cấp cứu</span>
            </div>
          </div>

          {/* Patient / sample info */}
          <div className="space-y-1.5 avoid-break mb-3 w-full">
            <FormRow>
              <FormCell label="Họ tên:" colStart={1} colSpan={5} value={stored.patientName} />
              <FormCell label="Năm sinh:" colStart={6} colSpan={2} value={yearOfBirth} />
              <FormCell label="Tuổi:" colStart={8} colSpan={2} value={age} />
              <FormCell label="Giới:" colStart={10} colSpan={3} value={stored.patientGenderName} />
            </FormRow>
            <FormRow>
              <FormCell label="Đối tượng:" colStart={1} colSpan={4} />
              <FormCell label="Giường:" colStart={6} colSpan={2} />
              <FormCell label="Số BHYT:" colStart={8} colSpan={6} />
            </FormRow>
            <FormRow>
              <FormCell label="Địa chỉ:" colStart={1} colSpan={6} value={stored.patientAddress} />
              <FormCell label="Số điện thoại:" colStart={8} colSpan={6} value={phoneNumber} />
            </FormRow>
            <FormRow>
              <FormCell label="Chẩn đoán:" colStart={1} colSpan={12} value={stored.icdName} />
            </FormRow>
            <FormRow>
              <FormCell label="Nơi chỉ định:" colStart={1} colSpan={6} value={departmentUnit} />
              <FormCell label="BS chỉ định:" colStart={8} colSpan={6} value={referringDoctor} />
            </FormRow>
            <FormRow>
              <FormCell label="Loại mẫu:" colStart={1} colSpan={6} value={service.sampleTypeName ?? undefined} />
              <FormCell label="Chất lượng mẫu:" colStart={8} colSpan={6} />
            </FormRow>
            {shouldShowGpbInfo && (
              <>
                <FormRow>
                  <FormCell label="Vị trí lấy mẫu:" colStart={1} colSpan={5} value={sampleTypeDisplay || '-'} />
                  <FormCell label="Mã Giải phẫu bệnh:" colStart={6} colSpan={9} value={barcodeGenGpb || '-'} />
                </FormRow>
                <FormRow>
                  <FormCell label="Chẩn đoán mô bệnh học:" colStart={1} colSpan={12} value={diagnosisDisplay || '-'} />
                </FormRow>
              </>
            )}
            <FormRow>
              <FormCell label="Người lấy mẫu (chỉ áp dụng với mẫu máu):" colStart={1} colSpan={6} />
              <FormCell label="Người nhận mẫu:" colStart={8} colSpan={6} value={sampleReceiverInfo?.actionUserFullName} />
            </FormRow>
            <FormRow>
              <FormCell label="T/G lấy mẫu (chỉ áp dụng với mẫu máu):" colStart={1} colSpan={6} />
              <FormCell label="T/G nhận mẫu:" colStart={8} colSpan={6} value={formatDateTime(sampleReceiverInfo?.createdAt)} />
            </FormRow>

            {/* Kỹ thuật — editable, full width */}
            <FormRow>
              <div className={cn('flex items-center gap-2 min-w-0', COL_SPAN_CLASS[12])}>
                <span className="font-semibold shrink-0 whitespace-nowrap">Kỹ thuật:</span>
                {readOnly ? (
                  <span className="flex-1 min-w-0 pb-px min-h-[1.1em]">
                    {readOnlyMethodLabel}
                  </span>
                ) : (
                  <div className="flex-1 min-w-0">
                    <Select
                      value={values.testingMethodGenId || undefined}
                      onValueChange={patchTestingMethod}
                      open={methodSelectOpen}
                      onOpenChange={setMethodSelectOpen}
                    >
                      <SelectTrigger className="h-8 w-full text-[13px]">
                        <SelectValue placeholder="Chọn phương pháp thực hiện..." />
                      </SelectTrigger>
                    <SelectContent>
                      {methodOptions.length ? (
                        methodOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-[13px]">
                            {m.methodName}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-sm text-muted-foreground">Không có dữ liệu</div>
                      )}
                    </SelectContent>
                  </Select>
                  </div>
                )}
              </div>
            </FormRow>

            <FormRow>
              <FormCell label="Người thực hiện:" colStart={1} colSpan={12} value={performerInfo?.actionUserFullName} />
            </FormRow>
          </div>

          {/* Gene table — 1 editable row */}
          <div className="overflow-x-auto avoid-break mb-2">
            <table className="gen-table w-full border-collapse border border-black text-[11px] sm:text-[12px]">
              <thead>
                <tr className="bg-gray-50">
                  {GEN_TABLE_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        'border border-black px-1 py-1 text-center font-bold',
                        col.key === 'geneName' && 'min-w-[72px]',
                        col.key === 'nucleotideChange' && 'min-w-[120px]',
                      )}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {GEN_TABLE_COLUMNS.map((col) => {
                    if (col.key === 'stt') {
                      return (
                        <td key={col.key} className="border border-black px-1 py-1 text-center">
                          1
                        </td>
                      );
                    }
                    const cellKey = col.key as GenGeneRowKey;
                    return (
                      <td
                        key={col.key}
                        className="border border-black p-0 bg-amber-50/40 print:p-1"
                      >
                        {readOnly ? (
                          <span className="block px-1 py-1 min-h-[2rem] whitespace-pre-wrap break-words">
                            {values.geneRow[cellKey] ?? ''}
                          </span>
                        ) : (
                          <Textarea
                            ref={resizeTextarea}
                            value={values.geneRow[cellKey] ?? ''}
                            onChange={(e) => {
                              patchGeneRow(cellKey, e.target.value);
                              resizeTextarea(e.target);
                            }}
                            rows={1}
                            wrap="soft"
                            className={cn(
                              'min-h-9 rounded-none border-0 shadow-none text-[12px] resize-none overflow-hidden py-1 px-1',
                              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
                              'bg-transparent print:border-0 print:min-h-0 print:h-auto',
                              '[field-sizing:content]',
                            )}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[11px] italic mb-4">
            Thông tin xét nghiệm được đính kèm theo kết quả này
          </p>

          {/* Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 avoid-break mt-2 flex-grow">
            <div className="text-[11px] sm:text-[12px]">
              <p className="font-bold mb-1">Ghi chú</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Kết quả xét nghiệm gen chỉ có giá trị khi được áp dụng trong bối cảnh lâm sàng.
                </li>
                <li>Bệnh nhân cần được tư vấn di truyền khi có kết quả bất thường.</li>
              </ul>
            </div>
            <div className="text-center text-[12px] sm:text-[13px]">
              <div>{signatureTimeLine}</div>
              <div className="font-bold mt-4">T/L GIÁM ĐỐC TRUNG TÂM</div>
              <span
                data-sign-anchor
                aria-hidden="true"
                style={{ display: 'inline-block', height: 0, width: 0 }}
              />
              <div className="mt-10">Họ tên: ................................................</div>
            </div>
          </div>

          <div className="flex justify-between text-[11px] mt-6 pt-2">
            <span className="text-red-600 font-semibold">BM01.QL16</span>
            <span>Trang 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
