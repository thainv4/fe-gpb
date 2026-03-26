'use client';

import React, { useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient, type StoredService, type StoredServiceRequestResponse } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
    onSuccess: () => {
      toast({
        title: 'Thành công',
        description: 'Đã lưu kết quả PIVKA.',
      });
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

    const parsedAfpf = Number(afpFullResult.trim());
    const parsedAfpL3 = Number(afpL3.trim());
    const parsedPivka = Number(pivkaIiResult.trim());

    // "giá trị dương"
    if (![parsedAfpf, parsedAfpL3, parsedPivka].every((n) => Number.isFinite(n) && n > 0)) {
      toast({
        title: 'Giá trị không hợp lệ',
        description: 'Kết quả phải là số dương (có thể thập phân).',
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end print:hidden">
        <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => handlePrint()}>
          In phiếu
        </Button>
          <Button
            type="button"
            onClick={() => {
              const payload = validateAndBuildPayload();
              if (!payload) return;
              createResultMutation.mutate(payload);
            }}
            disabled={createResultMutation.isPending}
          >
            {createResultMutation.isPending ? 'Đang lưu...' : 'Lưu kết quả'}
          </Button>
        </div>
      </div>

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
                  table-layout: fixed;
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
                  <th className="border border-black px-1 py-1.5 text-left min-w-[200px]">Yêu cầu xét nghiệm</th>
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
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        value={values[row.key] ?? ''}
                        onChange={(e) => patch(row.key, e.target.value)}
                        className={cn(
                          'h-9 rounded-none border-0 shadow-none font-medium',
                          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
                          'bg-transparent print:border-0 print:h-8',
                          getResultTextAlign(values[row.key], row.refNumber)
                        )}
                        placeholder="—"
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
              Kết quả lệch trái: thấp hơn CSBT.
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
  if (services.length <= 1) return null;
  // return (
  //   <div className="mb-4 flex flex-wrap items-center gap-2">
  //     <span className="text-sm font-medium">Dịch vụ / mẫu:</span>
  //     <Select value={value} onValueChange={onChange}>
  //       <SelectTrigger className="w-full max-w-md">
  //         <SelectValue placeholder="Chọn dịch vụ" />
  //       </SelectTrigger>
  //       <SelectContent>
  //         {services.map((s) => (
  //           <SelectItem key={s.id} value={s.id}>
  //             {s.serviceName}
  //             {s.receptionCode ? ` — ${s.receptionCode}` : ''}
  //           </SelectItem>
  //         ))}
  //       </SelectContent>
  //     </Select>
  //   </div>
  // );
}
