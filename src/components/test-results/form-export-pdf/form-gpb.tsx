"use client";

import React, { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { StoredServiceRequestResponse, StoredService, apiClient, WorkflowActionInfo } from "@/lib/api/client";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";

// ==================== TYPES ====================
interface FormTemplateProps {
  data: StoredServiceRequestResponse;
  specificService?: StoredService;
  signatureImageBase64?: string;
}

interface ExtendedStoredService extends StoredService {
  receivedByName?: string;
  receivedAt?: string;
  resultApprovedByName?: string;
}

// ==================== CONSTANTS ====================
const PRINT_CONFIG = {
  PAGE_WIDTH_MM: 210,
  PAGE_HEIGHT_MM: 297,
  PADDING_TOP_MM: 10,
  PADDING_BOTTOM_MM: 10,
  /** Khoảng trống giữa phần nội dung và khối "Bác sĩ đọc kết quả" trên trang cuối */
  SIGNATURE_PAGE_EXTRA_SPACE_MM: 0,
  PADDING_LEFT_MM: 15,
  PADDING_RIGHT_MM: 15,
  HEADER_HEIGHT_MM: 120,
  SIGNATURE_HEIGHT_MM: 40,
  /** Khoảng cách từ mép dưới trang đến đáy khối "Bác sĩ đọc kết quả" — tăng để chừa không gian cho chữ ký số bên dưới */
  SIGNATURE_BLOCK_BOTTOM_MM: 35,
  /** Chiều cao tối đa vùng nội dung trang cuối (= 297 - padding - header - SIGNATURE_BLOCK_BOTTOM - SIGNATURE_HEIGHT) */
  CONTENT_MAX_HEIGHT_LAST_PAGE_MM: 89,
  PAGE_SPACING_MM: 30,
  CONTENT_BUFFER_MM: 5,
  MM_TO_PX: 3.7795275591,
} as const;

const CALCULATED_HEIGHTS = {
  // Chiều cao khả dụng cho nội dung (các trang không phải trang cuối)
  CONTENT_HEIGHT_PER_PAGE: 117 * PRINT_CONFIG.MM_TO_PX,
  EFFECTIVE_CONTENT_HEIGHT: (117 - PRINT_CONFIG.CONTENT_BUFFER_MM) * PRINT_CONFIG.MM_TO_PX,
  // Trang cuối: vùng prose tối đa (trừ spacer SIGNATURE_PAGE_EXTRA_SPACE_MM) để không tràn xuống "Bác sĩ đọc kết quả"
  EFFECTIVE_CONTENT_HEIGHT_LAST_PAGE:
    (PRINT_CONFIG.CONTENT_MAX_HEIGHT_LAST_PAGE_MM -
      PRINT_CONFIG.SIGNATURE_PAGE_EXTRA_SPACE_MM) *
    PRINT_CONFIG.MM_TO_PX,
} as const;

// ==================== UTILITY FUNCTIONS ====================
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

// ==================== COMPONENTS ====================
const PageHeader = React.memo(({
  data,
  specificService,
  sampleCollectorInfo,
  sampleReceiverInfo,
}: {
  data: StoredServiceRequestResponse;
  specificService?: StoredService;
  sampleCollectorInfo?: WorkflowActionInfo;
  sampleReceiverInfo?: WorkflowActionInfo;
}) => {
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
  } = data;

  const age = useMemo(() => calculateAge(patientDob), [patientDob]);
  const sampleTypeName = specificService?.sampleTypeName || "";
  const extendedService = specificService as ExtendedStoredService;

  return (
    <div className="print-header" style={{ breakInside: "avoid" }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        {/* Logo and Hospital Info */}
        <div className="flex flex-1 items-center gap-4">
          <img
            src="/logo-bvbm-wh.png"
            alt="Logo Bệnh viện Bạch Mai"
            className="w-3/12"
          />
          <div className="text-sm text-gray-700 leading-tight space-y-1 text-center">
            <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
            <div className="text-xs font-semibold">VIỆN XÉT NGHIỆM Y HỌC</div>
            <div className="text-xs font-semibold">TRUNG TÂM GIẢI PHẪU BỆNH</div>
            <div className="text-xs font-semibold">TẾ BÀO HỌC</div>
          </div>
        </div>

        {/* Patient Code Info */}
        <div className="text-left text-sm leading-tight space-y-2 p-3 rounded">


          <div>
            <span className="font-semibold text-gray-700">Barcode: </span>
            <span className="font-bold">
              {specificService?.receptionCode || ""}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Mã Y lệnh:</span>{" "}
            <span className="font-bold">{serviceReqCode}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Mã BN:</span>{" "}
            <span className="font-bold">{patientCode}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Mã ĐT:</span>{" "}
            <span className="font-bold">{treatmentCode}</span>
          </div>
        </div>
        {/* QR Code */}
        {serviceReqCode && (
          <div className="flex flex-col items-center mb-2">
            <QRCodeSVG
              value={serviceReqCode}
              size={60}
              level="M"
              includeMargin={false}
              aria-label={`Mã QR cho y lệnh ${serviceReqCode}`}
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="text-center px-10">
        {(() => {
          const title =
            specificService?.resultName || "";
          const lines = title.split("\n");
          return (
            <>
              {lines.map((line, index) => (
                <h1
                  key={index}
                  className={`font-bold ${index === 0 ? "text-2xl" : "text-xl"
                    }`}
                >
                  {line}
                </h1>
              ))}
            </>
          );
        })()}
      </div>

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
              <span className="font-semibold ml-2">
                {requestDepartmentName}
              </span>
            </span>
            <span>
              <span className="text-gray-600">Phòng:</span>
              <span className="font-semibold ml-2">{requestRoomName}</span>
            </span>
          </div>

          <div>
            <span className="text-gray-600">Chẩn đoán lâm sàng:</span>
            <span className="ml-2 font-semibold text-red-700">
              {icdCode} - {icdName}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-16">
            <div>
              <span className="text-gray-600">Vị trí bệnh phẩm:</span>
              <span className="ml-2">{sampleTypeName || "-"}</span>
            </div>
            <div>
              <span className="text-gray-600">Phương pháp nhuộm:</span>
              <span className="ml-2">
                {specificService?.stainingMethodName || "-"}
              </span>
            </div>
          </div>

          {/* Result notes */}
          {specificService?.resultNotes && (
            <div className="mt-2">
              <span className="text-gray-600">Ghi chú:</span>
              <span className="ml-2">{specificService.resultNotes}</span>
            </div>
          )}

          {/* Sample collection and approval info */}
          <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2">
            {/* Hàng 1 */}
            <div className="flex gap-2">
              <span className="text-gray-600">Người lấy mẫu:</span>
              <span>{sampleCollectorInfo?.actionUserFullName ?? "-"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Thời gian lấy mẫu:</span>
              <span>{formatDateTime(sampleCollectorInfo?.createdAt)}</span>
            </div>

            {/* Hàng 2 */}
            <div className="flex gap-2">
              <span className="text-gray-600">Người nhận mẫu:</span>
              <span>{sampleReceiverInfo?.actionUserFullName ?? "-"}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Thời gian nhận mẫu:</span>
              <span>{formatDateTime(sampleReceiverInfo?.createdAt)}</span>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
});

PageHeader.displayName = "PageHeader";

/** Chỉ re-render khi `html` thay đổi (so sánh reference), tránh set lại innerHTML mỗi lần parent re-render → giữ được bôi đen. */
const StaticHtmlContent = React.memo(({ html, className }: { html: string; className?: string }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
));
StaticHtmlContent.displayName = "StaticHtmlContent";

// ==================== CUSTOM HOOKS ====================
function useSplitContent(htmlContent: string) {
  const [contentPages, setContentPages] = useState<string[]>([""]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!htmlContent) {
      setContentPages([""]);
      return;
    }

    setIsCalculating(true);

    const createMeasureDiv = (content: string) => {
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: ${PRINT_CONFIG.PAGE_WIDTH_MM - PRINT_CONFIG.PADDING_LEFT_MM - PRINT_CONFIG.PADDING_RIGHT_MM}mm;
        font-size: 14px;
        line-height: 1.5;
      `;
      tempDiv.className = "prose prose-sm max-w-none";
      tempDiv.innerHTML = content;
      document.body.appendChild(tempDiv);
      return tempDiv;
    };

    const splitWithMaxHeight = (content: string, effectiveMaxHeightPx: number): string[] => {
      const tempDiv = createMeasureDiv(content);
      try {
        const pages: string[] = [];
        const children = Array.from(tempDiv.children) as HTMLElement[];

        let currentPageContent: HTMLElement[] = [];
        let currentPageHeight = 0;

        children.forEach((child) => {
          const childClone = child.cloneNode(true) as HTMLElement;
          const childHeight = child.offsetHeight;

          if (currentPageHeight + childHeight > effectiveMaxHeightPx) {
            if (currentPageContent.length > 0) {
              const pageDiv = document.createElement("div");
              currentPageContent.forEach((el) => pageDiv.appendChild(el));
              pages.push(pageDiv.innerHTML);

              currentPageContent = [childClone];
              currentPageHeight = childHeight;
            } else {
              currentPageContent.push(childClone);
              currentPageHeight += childHeight;
            }
          } else {
            currentPageContent.push(childClone);
            currentPageHeight += childHeight;
          }
        });

        if (currentPageContent.length > 0) {
          const pageDiv = document.createElement("div");
          currentPageContent.forEach((el) => pageDiv.appendChild(el));
          pages.push(pageDiv.innerHTML);
        }

        return pages.length > 0 ? pages : [""];
      } finally {
        tempDiv.remove();
      }
    };

    const splitContentIntoPages = (content: string): string[] => {
      const tempDiv = createMeasureDiv(content);

      try {
        const pages: string[] = [];
        const children = Array.from(tempDiv.children) as HTMLElement[];

        let currentPageContent: HTMLElement[] = [];
        let currentPageHeight = 0;
        let pageIndex = 0;

        const buffer = PRINT_CONFIG.CONTENT_BUFFER_MM * PRINT_CONFIG.MM_TO_PX;
        const effectiveMaxHeight = CALCULATED_HEIGHTS.EFFECTIVE_CONTENT_HEIGHT - buffer;

        children.forEach((child) => {
          const childClone = child.cloneNode(true) as HTMLElement;
          const childHeight = child.offsetHeight;

          if (currentPageHeight + childHeight > effectiveMaxHeight) {
            if (currentPageContent.length > 0) {
              const pageDiv = document.createElement("div");
              currentPageContent.forEach((el) => pageDiv.appendChild(el));
              pages.push(pageDiv.innerHTML);

              currentPageContent = [childClone];
              currentPageHeight = childHeight;
              pageIndex++;
            } else {
              currentPageContent.push(childClone);
              currentPageHeight += childHeight;
            }
          } else {
            currentPageContent.push(childClone);
            currentPageHeight += childHeight;
          }
        });

        if (currentPageContent.length > 0) {
          const pageDiv = document.createElement("div");
          currentPageContent.forEach((el) => pageDiv.appendChild(el));
          pages.push(pageDiv.innerHTML);
        }

        // Trang cuối: re-split nếu nội dung vượt quá vùng dành cho chữ ký, đẩy phần thừa sang trang mới
        let finalPages = pages;
        if (pages.length > 0 && pages[pages.length - 1]) {
          const lastPageResplit = splitWithMaxHeight(
            pages[pages.length - 1],
            CALCULATED_HEIGHTS.EFFECTIVE_CONTENT_HEIGHT_LAST_PAGE
          );
          if (lastPageResplit.length > 1) {
            finalPages = [...pages.slice(0, -1), ...lastPageResplit];
          }
        }

        // Thêm spacing vào cuối mỗi trang (trừ trang cuối)
        const pagesWithSpacing = finalPages.map((pageContent, index) => {
          if (index < finalPages.length - 1 && pageContent) {
            return (
              pageContent
              + `<div style="height: ${PRINT_CONFIG.PAGE_SPACING_MM}mm; min-height: ${PRINT_CONFIG.PAGE_SPACING_MM}mm; width: 100%; display: block;"></div>`
            );
          }
          return pageContent;
        });

        return pagesWithSpacing.length > 0 ? pagesWithSpacing : [""];
      } finally {
        tempDiv.remove();
        setIsCalculating(false);
      }
    };

    const pages = splitContentIntoPages(htmlContent);
    setContentPages(pages);
  }, [htmlContent]);

  return { contentPages, isCalculating };
}

// ==================== MAIN COMPONENT ====================
export function FormTemplate({
  data,
  specificService,
  signatureImageBase64,
}: FormTemplateProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch workflow actions để lấy thông tin người lấy mẫu và người nhận mẫu
  const { data: workflowActionsData } = useQuery({
    queryKey: ['workflow-action-info', data.id],
    queryFn: () => apiClient.getWorkflowActionInfo(data.id),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    enabled: !!data.id,
  });

  // Lọc người lấy mẫu (stateOrder = 1) và người nhận mẫu (stateOrder = 2)
  const sampleCollectorInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 1),
    [workflowActionsData]
  );

  const sampleReceiverInfo = useMemo(
    () => workflowActionsData?.data?.find((action) => action.stateOrder === 2),
    [workflowActionsData]
  );

  const resultText = useMemo(() => {
    if (!specificService) return "";

    if (
      specificService.resultComment ||
      specificService.resultDescription ||
      specificService.resultConclude ||
      specificService.resultNote
    ) {
      const parts: string[] = [];

      if (specificService.resultComment) {
        parts.push(specificService.resultComment);
      }

      if (specificService.resultDescription) {
        parts.push(specificService.resultDescription);
      }

      if (specificService.resultConclude) {
        parts.push(specificService.resultConclude);
      }

      if (specificService.resultNote) {
        parts.push(specificService.resultNote);
      }

      return parts.join('<div style="margin-bottom: 1em;"></div>');
    }

    return specificService.resultText || "";
  }, [specificService]);

  const { contentPages, isCalculating } = useSplitContent(resultText);

  if (isCalculating) {
    return (
      <div className="w-[210mm] mx-auto bg-white p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[210mm] mx-auto bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4 portrait;
              margin: 0;
            }

            .pdf-page {
              width: ${PRINT_CONFIG.PAGE_WIDTH_MM}mm;
              min-height: ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm;
              background: white;
              box-sizing: border-box;
              padding: ${PRINT_CONFIG.PADDING_TOP_MM}mm ${PRINT_CONFIG.PADDING_LEFT_MM}mm ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm ${PRINT_CONFIG.PADDING_RIGHT_MM}mm;
              position: relative;
              display: flex;
              flex-direction: column;
            }

            @media screen {
              .pdf-page {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin-bottom: 5mm;
              }

              .pdf-page:last-child {
                margin-bottom: 0;
              }
            }

            @media print {
              html, body {
                width: ${PRINT_CONFIG.PAGE_WIDTH_MM}mm;
                height: ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm;
                margin: 0;
                padding: 0;
              }

              .pdf-page {
                width: ${PRINT_CONFIG.PAGE_WIDTH_MM}mm !important;
                min-height: ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm !important;
                max-height: ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm !important;
                height: ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                margin: 0 !important;
                padding: ${PRINT_CONFIG.PADDING_TOP_MM}mm ${PRINT_CONFIG.PADDING_LEFT_MM}mm ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm ${PRINT_CONFIG.PADDING_RIGHT_MM}mm !important;
                box-shadow: none !important;
                position: relative !important;
                overflow: hidden !important;
              }

              .pdf-page:last-child {
                page-break-after: auto !important;
              }

              .print-header {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }

            .page-content-area {
              flex: 1;
              overflow: visible;
              display: flex;
              flex-direction: column;
              min-height: 0;
            }

            .page-number {
              position: absolute !important;
              bottom: ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm !important;
              right: ${PRINT_CONFIG.PADDING_RIGHT_MM}mm !important;
              font-size: 12px !important;
              color: #666 !important;
              z-index: 10 !important;
            }

            .signature-section {
              position: absolute !important;
              bottom: ${PRINT_CONFIG.SIGNATURE_BLOCK_BOTTOM_MM}mm !important;
              right: ${PRINT_CONFIG.PADDING_RIGHT_MM + 10}mm !important;
            }

            @media print {
              .page-number {
                position: absolute !important;
                bottom: ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm !important;
                right: ${PRINT_CONFIG.PADDING_RIGHT_MM}mm !important;
              }

              .signature-section {
                position: absolute !important;
                bottom: ${PRINT_CONFIG.SIGNATURE_BLOCK_BOTTOM_MM}mm !important;
                right: ${PRINT_CONFIG.PADDING_RIGHT_MM + 10}mm !important;
              }

            }

            /* Tránh cắt đôi các phần tử */
            .prose p, .prose div, .prose h1, .prose h2, .prose h3, .prose h4,
            .prose ul, .prose ol, .prose li, .prose table, .prose blockquote {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Indent nội dung */
            .prose p:has(strong:only-child) {
              padding-left: 0 !important;
              margin-left: 0 !important;
            }

            .prose p:not(:has(strong:only-child)) {
              padding-left: 20px;
            }

            /* Export-specific styles */
            .pdf-exporting .pdf-page {
              display: flex !important;
              flex-direction: column !important;
              width: ${PRINT_CONFIG.PAGE_WIDTH_MM}mm !important;
              height: ${PRINT_CONFIG.PAGE_HEIGHT_MM}mm !important;
              padding: ${PRINT_CONFIG.PADDING_TOP_MM}mm ${PRINT_CONFIG.PADDING_LEFT_MM}mm ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm ${PRINT_CONFIG.PADDING_RIGHT_MM}mm !important;
              position: relative !important;
              overflow: hidden !important;
            }


            .pdf-exporting .page-content-area {
              flex: 1 !important;
              overflow: visible !important;
            }
          `,
        }}
      />

      <div ref={contentRef}>
        {contentPages.map((pageContent, index) => (
          <div
            key={`page-${index + 1}`}
            className="pdf-page"
            style={{
              pageBreakAfter:
                index < contentPages.length - 1 ? "always" : "auto",
            }}
          >
            {/* Header on EVERY page */}
            <div className="page-header">
              <PageHeader
                data={data}
                specificService={specificService}
                sampleCollectorInfo={sampleCollectorInfo}
                sampleReceiverInfo={sampleReceiverInfo}
              />
            </div>

            {/* Results Section */}
            <div className="page-content-area">
              {index === 0 && (
                <h2
                  className="text-center font-bold text-lg uppercase py-2 mb-4"
                  style={{ breakInside: "avoid", flexShrink: 0 }}
                >
                  KẾT QUẢ
                </h2>
              )}

              <div
                style={{
                  flex: "1",
                  minHeight: 0,
                  maxHeight:
                    index < contentPages.length - 1
                      ? "147mm"
                      : `${PRINT_CONFIG.CONTENT_MAX_HEIGHT_LAST_PAGE_MM}mm`,
                  overflow:
                    index === contentPages.length - 1 ? "hidden" : "visible",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: "1",
                    minHeight: 0,
                    maxHeight:
                      index < contentPages.length - 1
                        ? "107mm"
                        : `${PRINT_CONFIG.CONTENT_MAX_HEIGHT_LAST_PAGE_MM - PRINT_CONFIG.SIGNATURE_PAGE_EXTRA_SPACE_MM}mm`,
                    overflow:
                      index === contentPages.length - 1 ? "hidden" : "visible",
                  }}
                >
                  {pageContent ? (
                    <StaticHtmlContent
                      html={pageContent}
                      className="prose prose-sm max-w-none leading-relaxed text-[14px]"
                    />
                  ) : (
                    index === 0 && (
                      <div className="p-8 text-gray-400 italic text-center border-2 border-dashed border-gray-300 rounded">
                        Chưa có kết quả xét nghiệm
                      </div>
                    )
                  )}
                </div>

                {/* Spacing ở cuối mỗi trang (trừ trang cuối) */}
                {index < contentPages.length - 1 && (
                  <div
                    style={{
                      height: `${PRINT_CONFIG.PAGE_SPACING_MM}mm`,
                      minHeight: `${PRINT_CONFIG.PAGE_SPACING_MM}mm`,
                      width: "100%",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                )}
                {/* Khoảng trống cho chữ ký số - chỉ trang cuối, không đổi vị trí số trang */}
                {index === contentPages.length - 1 && (
                  <div
                    style={{
                      height: `${PRINT_CONFIG.SIGNATURE_PAGE_EXTRA_SPACE_MM}mm`,
                      minHeight: `${PRINT_CONFIG.SIGNATURE_PAGE_EXTRA_SPACE_MM}mm`,
                      width: "100%",
                      display: "block",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Page Number */}
            <div className="page-number">
              Trang {index + 1} / {contentPages.length}
            </div>

            {/* Signature Section - Chỉ trang cuối */}
            {index === contentPages.length - 1 && (
              <div className="signature-section">
                <div className="text-center">
                  <div className="text-sm text-gray-600 border-t border-gray-400 px-10">
                    Ngày {new Date().getDate()} tháng{" "}
                    {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>

                  <div className="font-bold text-base mb-4">
                    BÁC SĨ ĐỌC KẾT QUẢ
                  </div>

                  {signatureImageBase64 && (
                    <div className="flex justify-center mb-2">
                      <img
                        src={`data:image/png;base64,${signatureImageBase64}`}
                        alt="Chữ ký bác sĩ"
                        className="max-h-20 w-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}