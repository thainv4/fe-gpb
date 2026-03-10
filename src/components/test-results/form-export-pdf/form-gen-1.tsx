"use client";

import React, { useMemo } from "react";
import {
  StoredServiceRequestResponse,
  StoredService,
  apiClient,
} from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

export interface FormGen1Props {
  data: StoredServiceRequestResponse;
  specificService?: StoredService;
  signatureImageBase64?: string;
}

function calculateAge(dob: number): number {
  const dobStr = dob.toString();
  const year = Number.parseInt(dobStr.substring(0, 4), 10);
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m} ${day}/${month}/${year}`;
  } catch {
    return "-";
  }
}

/** Lấy phần text chữ thường từ resultConclude HTML (bỏ thẻ, bỏ tiêu đề CHẨN ĐOÁN MÔ BỆNH HỌC). */
function getResultConcludePlainText(html: string): string {
  if (!html?.trim()) return "";
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.innerHTML = html;
    let text = (div.textContent ?? div.innerText ?? "").replace(/\s+/g, " ").trim();
    const header = /chẩn\s*đoán\s*mô\s*bệnh\s*học\s*:?\s*/i;
    text = text.replace(header, "").trim();
    return text;
  }
  const stripped = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped.replace(/chẩn\s*đoán\s*mô\s*bệnh\s*học\s*:?\s*/i, "").trim();
}

/** Chỉ re-render khi `html` thay đổi (so sánh reference), tránh set lại innerHTML mỗi lần parent re-render → giữ được bôi đen. */
const StaticHtmlContent = React.memo(({ html, className }: { html: string; className?: string }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
));
StaticHtmlContent.displayName = "StaticHtmlContent";

export function FormGen1({
  data,
  specificService,
  signatureImageBase64,
}: FormGen1Props) {
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
    serviceReqCode,
    requestUsername,
    requestLoginname,
  } = data;

  const age = calculateAge(patientDob);
  const sampleTypeName = specificService?.sampleTypeName ?? "";
  const receptionCode = specificService?.receptionCode ?? "";
  const resultName = specificService?.resultName ?? "Phiếu kết quả xét nghiệm";
  const barcodeMapGenGpb = specificService?.barcodeMapGenGpb ?? data?.services?.[0]?.barcodeMapGenGpb ?? "";
  const flag = data?.flag ?? "";

  const { data: resultConcludeData } = useQuery({
    queryKey: ["stored-services-result-conclude", barcodeMapGenGpb],
    queryFn: () => apiClient.getStoredServicesResultConclude(barcodeMapGenGpb),
    enabled: !!barcodeMapGenGpb?.trim(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: workflowActionsData } = useQuery({
    queryKey: ["workflow-action-info", data.id],
    queryFn: () => apiClient.getWorkflowActionInfo(data.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!data.id,
  });
  const sampleCollectorInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 1),
    [workflowActionsData]
  );
  const sampleReceiverInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 2),
    [workflowActionsData]
  );
  const performerInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 5),
    [workflowActionsData]
  );

  const resultConcludePlainText = useMemo(() => {
    const raw = resultConcludeData?.data?.resultConclude;
    return raw ? getResultConcludePlainText(raw) : "";
  }, [resultConcludeData?.data?.resultConclude]);
  const diagnosisDisplay = resultConcludePlainText || `${icdCode} - ${icdName}`;

  /** Nội dung mục 5 trang 1: không gộp resultNote (ghi chú đưa sang trang 2) */
  const resultText = useMemo(() => {
    if (!specificService) return "";
    if (
      specificService.resultComment ||
      specificService.resultDescription ||
      specificService.resultConclude
    ) {
      const parts: string[] = [];
      if (specificService.resultComment) parts.push(specificService.resultComment);
      if (specificService.resultDescription) parts.push(specificService.resultDescription);
      if (specificService.resultConclude) parts.push(specificService.resultConclude);
      return parts.join('<div style="margin-bottom: 1em;"></div>');
    }
    return specificService.resultText ?? "";
  }, [
    specificService?.resultText,
    specificService?.resultComment,
    specificService?.resultDescription,
    specificService?.resultConclude,
  ]);

  /** Ghi chú có nội dung thì hiển thị trang 2 */
  const hasResultNote = useMemo(() => {
    const raw = specificService?.resultNote ?? "";
    const stripped = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return stripped.length > 0;
  }, [specificService?.resultNote]);

  return (
    <div className="w-[210mm] mx-auto bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
      @page {
        size: A4;
        margin: 20mm 15mm 20mm 15mm;
      }

      /* Font chữ Cambria cho toàn bộ form */
      .a4-page {
        font-family: Cambria, 'Hoefler Text', serif;
        line-height: 1.2;
        font-size: 16px;
      }

      @media print {
        body {
          margin: 0;
          padding: 0;
        }

        .a4-page {
        line-height: 1.2;
          width: 210mm;
          min-height: 297mm;
          box-shadow: none;
          margin: 0;
          padding: 0;
          page-break-after: always;
          font-family: Cambria, 'Hoefler Text', serif;
        }

      .a4-page h1 {
        font-size: 16px !important;   /* thay vì text-xl ~20px */
        line-height: 1.2;
      }

  /* Tất cả chữ text-sm */
  .a4-page .text-sm {
    font-size: 16px !important;   /* hoặc 12px */
  }

  /* Phần kết quả (prose) */
  .a4-page .prose,
  .a4-page .prose p {
    font-size: 16px !important;   /* hoặc 12px */
  }

        .a4-page:last-child {
          page-break-after: auto;
        }

        /* Ngăn các phần tử quan trọng bị tách giữa các trang */
        .avoid-break {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Header lặp lại trên mỗi trang */
        .page-header {
          display: block;
        }

        /* Ẩn header trên trang đầu tiên */
        .first-page .repeat-header {
          display: none;
        }
      }

      /* Các phần tử không nên bị tách giữa các trang */
      .avoid-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      `,
        }}
      />

      {/* Trang đầu tiên */}
      <div className="a4-page first-page w-[210mm] h-[297mm] bg-white mx-auto box-border shadow-sm print:shadow-none
                pt-[20mm] pb-[20mm] pl-[15mm] pr-[15mm] flex flex-col">

        {/* Phần nội dung chính - tự động mở rộng */}
        <div className="flex-grow flex flex-col">
          {/* Header - chỉ hiển thị trên trang đầu */}
          <div className="w-full mb-4 grid grid-cols-4 items-start avoid-break">
            {/* Logo */}
            <div className="flex gap-2 items-center">
              <img
                src="/logo-bvbm-wh.png"
                alt="Logo Bệnh viện Bạch Mai"
                className="w-1/2"
              />
              <img
                src="/logo-yhhnub.jpg"
                alt="Logo Y học hạt nhân và ung bướu"
                className="w-1/2 mt-1"
              />
            </div>

            {/* Thông tin bệnh viện - CHÍNH GIỮA */}
            <div className="col-span-2 flex justify-center">
              <div className="text-center text-sm leading-tight">
                <div className="font-bold">BỘ Y TẾ</div>
                <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
                <div className="font-bold">TRUNG TÂM Y HỌC HẠT NHÂN VÀ UNG BƯỚU</div>
                <div className="font-bold">ĐƠN VỊ GEN TRỊ LIỆU</div>
              </div>
            </div>

            {/* QR + mã */}
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
                <div>PID: {patientCode}</div>
                <div>SID: {serviceReqCode}</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="avoid-break">
            <h1 className="text-center text-xl font-bold mb-2">
              PHIẾU KẾT QUẢ XÉT NGHIỆM
            </h1>
            <p className="text-center text-sm mb-6 italic">{resultName}</p>
          </div>

          {/* 1. Patient Information */}
          <div className="mb-2 avoid-break">
            <h2 className="font-bold mb-2">1. THÔNG TIN NGƯỜI BỆNH:</h2>
            <div className="ml-4 space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
                <span className="w-20 shrink-0">Họ và tên:</span>
                <span className="flex-1 min-w-0">
                  {patientName}
                </span>
                <span className="shrink-0">Năm sinh:</span>
                <span className="w-20">
                  {patientDob ? String(patientDob).substring(0, 4) : ""}
                </span>
                <span className="shrink-0">Giới tính:</span>
                <span className="w-20">
                  {patientGenderName}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 items-baseline">
                <span className="w-20 shrink-0">Địa chỉ:</span>
                <span className="flex-1 min-w-0">
                  {patientAddress || "—"}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 items-baseline">
                <span className="w-20 shrink-0">Chẩn đoán:</span>
                <span className="flex-1 min-w-0">
                  {icdCode} - {icdName}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Doctor / Request info */}
          <div className="mb-2 avoid-break">
            <h2 className="font-bold mb-2">2. THÔNG TIN BÁC SỸ CHỈ ĐỊNH:</h2>
            <div className="ml-4 space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-4 items-baseline">
                <span className="shrink-0">Bác sĩ chỉ định:</span>
                <span className="flex-1 min-w-0">
                  {requestUsername && requestLoginname
                    ? `${requestUsername} (${requestLoginname})`
                    : (requestUsername ?? requestLoginname ?? "")}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 items-baseline">
                <span className="shrink-0">Đơn vị:</span>
                <span className="flex-1 min-w-0">
                  {requestDepartmentName} - {requestRoomName}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Sample Information */}
          <div className="mb-2 avoid-break">
            <h2 className="font-bold mb-2">3. THÔNG TIN MẪU BỆNH PHẨM:</h2>
            <div className="ml-4 w-full text-sm">
              <div className="grid grid-cols-2 gap-y-2">
                {/* Hàng 1 */}
                <div className="flex">
                  <span className="font-semibold">Người lấy mẫu:</span>
                  <span className="ml-2">{sampleCollectorInfo?.actionUserFullName ?? "-"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold">Thời gian lấy mẫu:</span>
                  <span className="ml-2">{formatDateTime(sampleCollectorInfo?.createdAt)}</span>
                </div>

                {/* Hàng 2 */}
                <div className="flex">
                  <span className="font-semibold">Người nhận mẫu:</span>
                  <span className="ml-2">{sampleReceiverInfo?.actionUserFullName ?? "-"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold">Thời gian nhận mẫu:</span>
                  <span className="ml-2">{formatDateTime(sampleReceiverInfo?.createdAt)}</span>
                </div>

                <div className="flex">
                  <span className="font-semibold">Loại mẫu:</span>
                  <span className="ml-2">{sampleTypeName}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold">Tình trạng mẫu:</span>
                  <span className="ml-2">Đạt</span>
                </div>

                {/* Hàng 3 */}
                {/* <div className="flex col-span-2">
                  <span className="font-semibold">Mã bệnh phẩm:</span>
                  <span className="ml-2">{receptionCode}</span>
                </div> */}

                <div className="flex">
                  <span className="font-semibold">Vị trí lấy mẫu:</span>
                  <span className="ml-2"></span>
                </div>

                {/* Hàng 4 */}
                <div className="flex">
                  <span className="font-semibold">Phương pháp lấy mẫu:</span>
                  <span className="ml-2">{flag || "—"}</span>
                </div>

                <div className="flex">
                  <span className="font-semibold">Mã Giải phẫu bệnh:</span>
                  <span className="ml-2">{barcodeMapGenGpb}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="font-semibold">Chẩn đoán mô bệnh học:</span>
                <span className="ml-2">{diagnosisDisplay}</span>
              </div>
            </div>
          </div>

          {/* 4. Technique */}
          <div className="mb-2 avoid-break">
            <h2 className="font-bold mb-2">4. KỸ THUẬT THỰC HIỆN:</h2>
            <div className="ml-4 text-sm">
              {specificService?.testingMethodGen?.methodName
                ? `Phương pháp: ${specificService.testingMethodGen.methodName}`
                : flag
                  ? `Phương pháp: ${flag}`
                  : "—"}
            </div>
            <div className="ml-4 text-sm">
              Người thực hiện: {performerInfo?.actionUserFullName ?? "—"}
            </div>
          </div>

          {/* 5. Test Results */}
          <div className="mb-4">
            <h2 className="font-bold mb-2">5. KẾT QUẢ XÉT NGHIỆM:</h2>
            <div className="text-sm">
              {resultText ? (
                <StaticHtmlContent
                  html={resultText}
                  className="ml-4 max-w-none text-[14px]"
                />
              ) : (
                <p className="text-gray-500 italic">Chưa có kết quả xét nghiệm</p>
              )}
            </div>
          </div>

          {/* Khuyến cáo - trang 1 */}
          {specificService?.resultRecomment?.trim() && (
            <div className="mb-4 ml-4">
              <h2 className="font-bold mb-2">Khuyến cáo:</h2>
              <div className="text-sm">
                <StaticHtmlContent
                  html={specificService.resultRecomment}
                  className="prose prose-sm max-w-none text-[14px] ml-4"
                />
              </div>
            </div>
          )}
        </div>

        {/* Signature - cố định ở cuối trang */}
        <div className="avoid-break flex flex-col items-center mb-16 ml-80">
          <div className="text-center align-top">
            Ngày {new Date().getDate()} tháng{" "}
            {new Date().getMonth() + 1} năm {new Date().getFullYear()}
          </div>
          <div className="font-bold">
            Người phê duyệt kết quả
          </div>
          {signatureImageBase64 && (
            <div className="flex justify-center my-2">
              <img
                src={`data:image/png;base64,${signatureImageBase64}`}
                alt="Chữ ký"
                className="max-h-16 w-auto object-contain"
              />
            </div>
          )}
        </div>

      </div>

      {/* Trang 2 - Ghi chú (chỉ khi có nội dung) */}
      {hasResultNote && specificService?.resultNote && (
        <div className="a4-page w-[210mm] min-h-[297mm] bg-white mx-auto box-border shadow-sm print:shadow-none pt-[20mm] pb-[20mm] pl-[15mm] pr-[15mm] flex flex-col mt-4 print:mt-0">
          <div className="flex-grow flex flex-col">
            <h2 className="font-bold mb-4 text-base">Ghi chú</h2>
            <div className="text-sm section-result-content">
              <StaticHtmlContent
                html={specificService.resultNote}
                className="prose prose-sm max-w-none text-[14px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}