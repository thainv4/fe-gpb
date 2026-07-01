"use client";

import React, { useMemo, useCallback, useEffect, useState, useRef } from "react";
import { StoredServiceRequestResponse, StoredService, apiClient, WorkflowActionInfo } from "@/lib/api/client";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "@tanstack/react-query";
import { useServerTime } from "@/hooks/use-server-time";
import {
  formatVietnamSigningDateLineFromIso,
  SERVER_TIME_ERROR_LABEL,
  SERVER_TIME_LOADING_LABEL,
} from "@/lib/server-time";
import {
  getResultFormHospitalName,
  useBranchStore,
} from "@/lib/stores/branch";

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
  SIGNATURE_PAGE_EXTRA_SPACE_MM: 0,
  PADDING_LEFT_MM: 15,
  PADDING_RIGHT_MM: 15,
  HEADER_HEIGHT_MM: 120,
  SIGNATURE_HEIGHT_MM: 40,
  SIGNATURE_BLOCK_BOTTOM_MM: 35,
  CONTENT_MAX_HEIGHT_LAST_PAGE_MM: 120,
  PAGE_SPACING_MM: 30,
  CONTENT_BUFFER_MM: 5,
  MM_TO_PX: 3.7795275591,
} as const;

const CALCULATED_HEIGHTS = {
  CONTENT_HEIGHT_PER_PAGE: 117 * PRINT_CONFIG.MM_TO_PX,
  EFFECTIVE_CONTENT_HEIGHT: (117 - PRINT_CONFIG.CONTENT_BUFFER_MM) * PRINT_CONFIG.MM_TO_PX,
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

// ==================== HELPER: Dotted info row ====================
/** Renders a single label + value pair without dots. */
const DottedField = ({
  label,
  value,
  className = "",
  style,
  multiLine = false,
}: {
  label: string;
  value?: string | number | null;
  className?: string;
  style?: React.CSSProperties;
  /** Allow value to wrap across multiple lines instead of truncating */
  multiLine?: boolean;
}) => (
  <div
    className={`min-w-0 ${multiLine ? "block" : "flex items-baseline"} ${className}`}
    style={{ width: "100%", ...style }}
  >
    <span className="whitespace-nowrap" style={{ fontWeight: 500 }}>{label}</span>
    <span
      className={multiLine ? "" : "flex-1 truncate"}
      style={{
        marginLeft: multiLine ? 4 : 4,
        paddingLeft: 2,
        paddingRight: 2,
        minWidth: 20,
        ...(multiLine ? { whiteSpace: "normal", wordBreak: "break-word", display: "inline" } : {}),
      }}
    >
      {value != null && String(value).trim() !== "" ? value : "\u00A0"}
    </span>
  </div>
);

/**
 * FormRow – 12-column CSS grid row.
 * All children should be FormCell components.
 */
const FormRow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: 8 }}>
    {children}
  </div>
);

/**
 * FormCell – occupies a range of columns inside a FormRow.
 * @param colStart  1-based start column  (default 1)
 * @param colSpan   number of columns to span (default 12)
 */
const FormCell = ({
  children,
  colStart = 1,
  colSpan = 12,
}: {
  children: React.ReactNode;
  colStart?: number;
  colSpan?: number;
}) => (
  <div style={{ gridColumn: `${colStart} / span ${colSpan}`, minWidth: 0 }}>
    {children}
  </div>
);

// ==================== HELPER: Result section ====================
const ResultSection = ({
  title,
  content,
  emptyLines = 2,
  children,
}: {
  title: string;
  content?: string | null;
  emptyLines?: number;
  children?: React.ReactNode;
}) => {
  const hasContent = content && content.trim() !== "";
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      {hasContent ? (
        <div
          className="prose prose-sm max-w-none"
          style={{ paddingLeft: 16, fontSize: 14, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <div style={{ paddingLeft: 16, marginTop: 4 }}>
          {Array.from({ length: emptyLines }).map((_, idx) => (
            <div
              key={idx}
              style={{
                height: 20,
                width: "100%",
              }}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
};

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
    requestUsername,
    icdCode,
    icdName,
    serviceReqCode,
  } = data;

  const age = useMemo(() => calculateAge(patientDob), [patientDob]);
  const sampleTypeName = specificService?.sampleTypeName || "";
  const selectedHisBranchId = useBranchStore((s) => s.selectedHisBranchId);
  const hospitalName = useMemo(
    () => getResultFormHospitalName(selectedHisBranchId),
    [selectedHisBranchId],
  );

  const yearOfBirth = patientDob ? patientDob.toString().substring(0, 4) : "";

  return (
    <div className="print-header" style={{ breakInside: "avoid", fontFamily: "'Times New Roman', serif" }}>
      {/* ===== HEADER ROW ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        {/* Left: Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 160 }}>
          <img
            src="/logo-bvbm-wh.png"
            alt="Logo BV Bach Mai"
            style={{ width: 60, height: 60, objectFit: "contain" }}
          />
        </div>

        {/* Center: Hospital info */}
        <div style={{ flex: 1, textAlign: "center", lineHeight: 1.4 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{"BỘ Y TẾ"}</div>
          <div style={{ fontSize: 15, fontWeight: 700, textTransform: "uppercase" }}>
            {hospitalName || "BỆNH VIỆN BẠCH MAI"}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>
            {"VIỆN XÉT NGHIỆM Y HỌC"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase" }}>
            {"TRUNG TÂM GIẢI PHẪU BỆNH - TẾ BÀO HỌC"}
          </div>
          <div style={{ fontSize: 10, color: "#555", fontStyle: "italic", marginTop: 2 }}>
            {"Tầng 16, Nhà Q, 78 - Giải Phóng - Kim Liên - Hà Nội"}
          </div>
        </div>

        {/* Right: QR Code + SID info */}
        <div style={{ width: 160, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {specificService?.receptionCode ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <QRCodeSVG
                value={specificService.receptionCode}
                size={60}
              />
            </div>
          ) : (
            <div style={{
              height: 60, width: 60,
              border: "1px dashed #999",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, color: "#999",
              textAlign: "center",
            }}>
              Mã QR
            </div>
          )}
          <div style={{ width: "100%", marginTop: 4, fontSize: 12, lineHeight: 1.6 }}>
            <DottedField label="SID:" value={specificService?.receptionCode} />
            <DottedField label="Mã y lệnh:" value={serviceReqCode} />
            <DottedField label="Mã bệnh nhân:" value={patientCode} />
          </div>
        </div>
      </div>

      {/* ===== TITLE ===== */}
      <div style={{ textAlign: "center", marginTop: 12, marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>
          {"PHIẾU KẾT QUẢ XÉT NGHIỆM"}
        </h1>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 4, fontSize: 13.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, border: "1px solid #000" }} />
            {" Thường"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, border: "1px solid #000" }} />
            {" Cấp cứu"}
          </span>
        </div>
      </div>

      {/* ===== PATIENT INFO (9 rows) ===== */}
      <div style={{ fontSize: 14, lineHeight: 1.8, marginTop: 8 }}>
        {/* Row 1: Họ tên(1-5) | Năm sinh(6-8) | Tuổi(9-10) | Giới(11-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={6}><DottedField label="Họ tên:" value={patientName} /></FormCell>
          <FormCell colStart={7} colSpan={2}><DottedField label="Năm sinh:" value={yearOfBirth} /></FormCell>
          <FormCell colStart={9} colSpan={2}><DottedField label="Tuổi:" value={age} /></FormCell>
          <FormCell colStart={11} colSpan={2}><DottedField label="Giới:" value={patientGenderName} /></FormCell>
        </FormRow>

        {/* Row 2: Đối tượng(1-5) | Giường(6-8) | Số BHYT(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={5}><DottedField label="Đối tượng:" value={treatmentCode} /></FormCell>
          <FormCell colStart={6} colSpan={3}><DottedField label="Giường:" value="" /></FormCell>
          <FormCell colStart={9} colSpan={4}><DottedField label="Số BHYT:" value="" /></FormCell>
        </FormRow>

        {/* Row 3: Địa chỉ(1-8) | Số điện thoại(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={8}><DottedField label="Địa chỉ:" value={patientAddress} /></FormCell>
          <FormCell colStart={9} colSpan={4}><DottedField label="Số điện thoại:" value={data.patientMobile || data.patientPhone} /></FormCell>
        </FormRow>

        {/* Row 4: Chẩn đoán (full 12 cols) */}
        <FormRow>
          <FormCell colStart={1} colSpan={12}>
            <DottedField
              label="Chẩn đoán:"
              value={icdCode || icdName ? `${icdCode ? icdCode + " - " : ""}${icdName || ""}` : ""}
              multiLine
            />
          </FormCell>
        </FormRow>

        {/* Row 5: Nơi chỉ định(1-8) | BS chỉ định(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={8}>
            <DottedField
              label="Nơi chỉ định:"
              value={[requestDepartmentName, requestRoomName].filter(Boolean).join(" - ")}
              multiLine
            />
          </FormCell>
          <FormCell colStart={9} colSpan={4}><DottedField label="BS chỉ định:" value={requestUsername} /></FormCell>
        </FormRow>

        {/* Row 6: Vị trí lấy mẫu(1-8) | Loại dung dịch cố định(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={8}><DottedField label="Vị trí lấy mẫu:" value={sampleTypeName} /></FormCell>
          <FormCell colStart={9} colSpan={4}><DottedField label="Loại dung dịch cố định:" value="" /></FormCell>
        </FormRow>

        {/* Row 7: Người lấy mẫu(1-4) | Người nhận mẫu(5-8) | Người duyệt KQ(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={4}><DottedField label="Người lấy mẫu:" value={sampleCollectorInfo?.actionUserFullName} /></FormCell>
          <FormCell colStart={5} colSpan={4}><DottedField label="Người nhận mẫu:" value={sampleReceiverInfo?.actionUserFullName} /></FormCell>
          <FormCell colStart={9} colSpan={4}><DottedField label="Người duyệt KQ:" value="" /></FormCell>
        </FormRow>

        {/* Row 8: Loại mẫu(1-4) | Chất lượng mẫu(5-8) | Tình trạng mẫu(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={4}><DottedField label="Loại mẫu:" value={sampleTypeName} /></FormCell>
          <FormCell colStart={5} colSpan={4}><DottedField label="Chất lượng mẫu:" value="" /></FormCell>
          <FormCell colStart={9} colSpan={4}><DottedField label="Tình trạng mẫu:" value="" /></FormCell>
        </FormRow>

        {/* Row 9: T/G lấy mẫu(1-4) | T/G nhận mẫu(5-8) | T/G duyệt KQ(9-12) */}
        <FormRow>
          <FormCell colStart={1} colSpan={4}>
            <DottedField label="T/G lấy mẫu:" value={sampleCollectorInfo?.createdAt ? formatDateTime(sampleCollectorInfo.createdAt) : ""} />
          </FormCell>
          <FormCell colStart={5} colSpan={4}>
            <DottedField label="T/G nhận mẫu:" value={sampleReceiverInfo?.createdAt ? formatDateTime(sampleReceiverInfo.createdAt) : ""} />
          </FormCell>
          <FormCell colStart={9} colSpan={4}>
            <DottedField label="T/G duyệt KQ:" value={specificService?.resultApprovedAt ? formatDateTime(specificService.resultApprovedAt) : ""} />
          </FormCell>
        </FormRow>
      </div>
    </div>
  );
});

PageHeader.displayName = "PageHeader";

/** Chi re-render khi html thay doi */
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

  const { data: workflowActionsData } = useQuery({
    queryKey: ['workflow-action-info', data.id],
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

  const { data: serverTimeIso, isError: serverTimeError } = useServerTime();
  const signingDateLine =
    serverTimeIso != null
      ? formatVietnamSigningDateLineFromIso(serverTimeIso)
      : serverTimeError
        ? SERVER_TIME_ERROR_LABEL
        : SERVER_TIME_LOADING_LABEL;

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
              font-family: 'Times New Roman', serif;
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

            .page-footer {
              position: absolute !important;
              bottom: ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm !important;
              left: ${PRINT_CONFIG.PADDING_LEFT_MM}mm !important;
              right: ${PRINT_CONFIG.PADDING_RIGHT_MM}mm !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              font-size: 10px !important;
              font-family: 'Times New Roman', serif !important;
              color: #000 !important;
              border-top: 1px solid #000 !important;
              padding-top: 4px !important;
              z-index: 10 !important;
            }

            .signature-section {
              position: absolute !important;
              bottom: ${PRINT_CONFIG.SIGNATURE_BLOCK_BOTTOM_MM}mm !important;
              right: 35mm !important;
            }

            @media print {
              .page-footer {
                position: absolute !important;
                bottom: ${PRINT_CONFIG.PADDING_BOTTOM_MM}mm !important;
                left: ${PRINT_CONFIG.PADDING_LEFT_MM}mm !important;
                right: ${PRINT_CONFIG.PADDING_RIGHT_MM}mm !important;
              }

              .signature-section {
                position: absolute !important;
                bottom: ${PRINT_CONFIG.SIGNATURE_BLOCK_BOTTOM_MM}mm !important;
                right: 35mm !important;
              }
            }

            /* Avoid cutting elements across pages */
            .prose p, .prose div, .prose h1, .prose h2, .prose h3, .prose h4,
            .prose ul, .prose ol, .prose li, .prose table, .prose blockquote {
              page-break-inside: avoid;
              break-inside: avoid;
            }

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
                <div style={{ flex: 1, fontFamily: "'Times New Roman', serif", color: "#000" }}>
                  <ResultSection
                    title="Yêu cầu xét nghiệm:"
                    content={specificService?.serviceName}
                    emptyLines={1}
                  />
                  <ResultSection
                    title="Nhận xét đại thể:"
                    content={specificService?.resultComment}
                    emptyLines={3}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 16, marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                      <DottedField label="BS Phẫu tích:" value="" className="w-[45%]" />
                      <DottedField label="KTV Phẫu tích:" value="" className="w-[45%]" />
                    </div>
                  </ResultSection>
                  <ResultSection
                    title="Nhận xét vi thể:"
                    content={specificService?.resultDescription}
                    emptyLines={5}
                  />
                  <ResultSection
                    title="Kết luận:"
                    content={specificService?.resultConclude}
                    emptyLines={3}
                  />
                  <ResultSection
                    title="Bàn luận và kiến nghị:"
                    content={specificService?.resultRecomment}
                    emptyLines={2}
                  />
                  <div style={{ display: "flex", gap: 8, fontSize: 14 }}>
                    <DottedField
                      label="Ghi chú:"
                      value={specificService?.resultNotes || specificService?.resultNote || ""}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Page Footer */}
            <div className="page-footer">
              <span>BM01.QL16</span>
              <span>Trang {index + 1} / {contentPages.length}</span>
            </div>

            {/* Signature Section - Last page only */}
            {index === contentPages.length - 1 && (
              <div className="signature-section">
                <div style={{ textAlign: "center", fontFamily: "'Times New Roman', serif", fontSize: 13.5, lineHeight: 1.5, color: "#000" }}>
                  <div style={{ fontStyle: "italic" }}>
                    {"00:00 Ngày ... tháng ... năm 20 ..."}
                  </div>
                  <div style={{ fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>
                    {"T/L VIỆN TRƯỞNG/"}
                    <br />
                    {"GIÁM ĐỐC TRUNG TÂM"}
                  </div>
                  {/* Anchor for digital signature position measurement */}
                  <span data-sign-anchor aria-hidden="true" style={{ display: "inline-block", height: 0, width: 0 }} />
                  <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {signatureImageBase64 && (
                      <img
                        src={`data:image/png;base64,${signatureImageBase64}`}
                        alt="Chữ ký bác sĩ"
                        style={{ maxHeight: 50, width: "auto", objectFit: "contain" }}
                      />
                    )}
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {"Họ tên: "}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}