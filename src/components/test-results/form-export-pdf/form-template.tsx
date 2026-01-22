"use client";

import React, { useMemo } from "react";
import { StoredServiceRequestResponse, StoredService } from "@/lib/api/client";
import { QRCodeSVG } from "qrcode.react";

interface FormTemplateProps {
  data: StoredServiceRequestResponse;
  specificService?: StoredService; // Service cụ thể để hiển thị resultText
  // Ảnh chữ ký (base64, KHÔNG gồm tiền tố data:image/png;base64, ...)
  signatureImageBase64?: string;
}

// Helper function to calculate age from DOB
function calculateAge(dob: number): number {
  const dobStr = dob.toString();
  const year = Number.parseInt(dobStr.substring(0, 4), 10);
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

// Header component to be repeated on every page
function PageHeader({
  data,
  specificService,
}: {
  data: StoredServiceRequestResponse;
  specificService?: StoredService;
}) {
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

  const age = calculateAge(patientDob);

  // Lấy sampleTypeName từ specificService
  const sampleTypeName = specificService?.sampleTypeName || "";

  return (
    <div className="print-header" style={{ breakInside: "avoid" }}>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        {/* Logo and Hospital Info */}
        <div className="flex flex-1 items-center gap-4">
          <img src="/logo-bvbm-wh.png" alt="logo-bvbm" className="w-3/12" />
          <div className="text-sm text-gray-700 leading-tight space-y-1 text-center">
            <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
            <div className="text-xs">TRUNG TÂM GIẢI PHẪU BỆNH</div>
            <div className="text-xs font-semibold">KHOA TẾ BÀO HỌC</div>
          </div>
        </div>

        {/* Patient Code Info */}
        <div className="text-left text-sm leading-tight space-y-2 p-3 rounded">
          {/* QR Code */}
          {serviceReqCode && (
            <div className="flex flex-col items-center mb-2">
              <QRCodeSVG
                value={serviceReqCode}
                size={60}
                level="M"
                includeMargin={false}
              />
            </div>
          )}

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
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        {(() => {
          const title =
            specificService?.resultName || "Phiếu xét nghiệm sinh thiết";
          const lines = title.split("\n");
          return (
            <>
              {lines.map((line, index) => (
                <h1
                  key={index}
                  className={`font-bold ${
                    index === 0 ? "text-2xl" : "text-xl"
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

          {/* <div>
            <span className="text-gray-600">Mã bệnh phẩm:</span>
            <span className="ml-2 font-semibold">
              {specificService?.receptionCode || ""}
            </span>
          </div> */}

          <div className="flex flex-wrap gap-x-16">
            <div>
              <span className="text-gray-600">Vị trí:</span>
              <span className="ml-2">{sampleTypeName || "-"}</span>
            </div>
            <div>
              <span className="text-gray-600">Phương pháp nhuộm:</span>
              <span className="ml-2">{specificService?.stainingMethodName || '-'}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-600">Chẩn đoán lâm sàng:</span>
            <span className="ml-2 font-semibold text-red-700">
              {icdCode} - {icdName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Function to split HTML content into pages
function splitContentIntoPages(htmlContent: string): string[] {
  if (!htmlContent) return [""];

  const tempDiv = document.createElement("div");
  tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        width: 180mm;
        font-size: 14px;
        line-height: 1.5;
    `;
  tempDiv.className = "prose prose-sm max-w-none";
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  const MM_TO_PX = 3.7795275591;
  const CONTENT_HEIGHT_PER_PAGE = 170 * MM_TO_PX; // ~170mm cho content mỗi trang

  // Sử dụng chiều cao cố định để tránh khoảng trống dư thừa
  const firstPageHeight = CONTENT_HEIGHT_PER_PAGE;
  const otherPageHeight = CONTENT_HEIGHT_PER_PAGE;

  const pages: string[] = [];
  const children = Array.from(tempDiv.children) as HTMLElement[];

  let currentPageContent: HTMLElement[] = [];
  let currentPageHeight = 0;
  let pageIndex = 0;

  children.forEach((child) => {
    const childClone = child.cloneNode(true) as HTMLElement;
    const childHeight = child.offsetHeight;

    const maxHeight = pageIndex === 0 ? firstPageHeight : otherPageHeight;

    // Nếu phần tử quá cao, không được cắt - đưa sang trang mới
    if (currentPageHeight + childHeight > maxHeight) {
      if (currentPageContent.length > 0) {
        // Lưu trang hiện tại
        const pageDiv = document.createElement("div");
        currentPageContent.forEach((el) => pageDiv.appendChild(el));
        pages.push(pageDiv.innerHTML);

        // Bắt đầu trang mới
        currentPageContent = [childClone];
        currentPageHeight = childHeight;
        pageIndex++;
      } else {
        // Phần tử đầu tiên quá cao, vẫn phải thêm vào
        currentPageContent.push(childClone);
        currentPageHeight += childHeight;
      }
    } else {
      currentPageContent.push(childClone);
      currentPageHeight += childHeight;
    }
  });

  // Thêm trang cuối cùng
  if (currentPageContent.length > 0) {
    const pageDiv = document.createElement("div");
    currentPageContent.forEach((el) => pageDiv.appendChild(el));
    pages.push(pageDiv.innerHTML);
  }

  tempDiv.remove();

  return pages.length > 0 ? pages : [""];
}

export function FormTemplate({
  data,
  specificService,
  signatureImageBase64,
}: FormTemplateProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentPages, setContentPages] = React.useState<string[]>([""]);

  // Lấy resultComment, resultDescription, resultConclude, resultNote từ specificService theo thứ tự
  // Ưu tiên sử dụng các fields mới, fallback về resultText nếu không có (backward compatibility)
  const resultText = useMemo(() => {
    if (!specificService) return "";
    
    // Ưu tiên sử dụng các fields mới nếu có
    if (specificService.resultComment || specificService.resultDescription || specificService.resultConclude || specificService.resultNote) {
      const parts: string[] = [];
      
      // Nhận xét đại thể (resultComment) hiển thị đầu tiên
      if (specificService.resultComment) {
        parts.push(specificService.resultComment);
      }
      
      // Mô tả vi thể (resultDescription) hiển thị sau nhận xét đại thể
      if (specificService.resultDescription) {
        parts.push(specificService.resultDescription);
      }
      
      if (specificService.resultConclude) {
        parts.push(specificService.resultConclude);
      }
      
      if (specificService.resultNote) {
        parts.push(specificService.resultNote);
      }
      
      return parts.join("");
    }
    
    // Fallback về resultText nếu không có các fields mới
    return specificService.resultText || "";
  }, [specificService]);

  React.useEffect(() => {
    if (!resultText) {
      setContentPages([""]);
      return;
    }

    // Chia nội dung thành các trang
    const pages = splitContentIntoPages(resultText);
    setContentPages(pages);
  }, [resultText]);

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

                @media print {
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        margin: 0;
                        padding: 0;
                    }

                    .pdf-page {
                        width: 210mm !important;
                        min-height: 297mm !important;
                        max-height: 297mm !important;
                        height: 297mm !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        margin: 0 !important;
                        padding: 10mm 15mm !important;
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

                @media screen {
                    .pdf-page {
                        width: 210mm;
                        min-height: 297mm;
                        background: white;
                        box-sizing: border-box;
                        padding: 10mm 15mm;
                        position: relative;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        margin-bottom: 5mm;
                        display: flex;
                        flex-direction: column;
                    }

                    .pdf-page:last-child {
                        margin-bottom: 0;
                    }
                }

                .page-content-area {
                    flex: 1;
                    overflow: visible;
                }
                
                /* Export-specific styles */
                .pdf-exporting .pdf-page {
                    display: flex !important;
                    flex-direction: column !important;
                    width: 210mm !important;
                    height: 297mm !important;
                    padding: 10mm 15mm !important;
                    position: relative !important;
                    overflow: hidden !important;
                }
                
                .pdf-exporting .page-content-area {
                    flex: 1 !important;
                    overflow: visible !important;
                }
                
                .pdf-exporting .signature-section {
                    position: absolute !important;
                    bottom: 20mm !important;
                    right: 15mm !important;
                }

                /* Không cắt đôi các phần tử */
                .prose p, .prose div, .prose h1, .prose h2, .prose h3, .prose h4,
                .prose ul, .prose ol, .prose li, .prose table, .prose blockquote {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                /* Indent nội dung dưới các tiêu đề in đậm */
                .prose p[style*="padding-left: 20px"],
                .prose p[style*="padding-left:20px"] {
                    padding-left: 20px !important;
                    margin-left: 0 !important;
                }

                /* Đảm bảo tiêu đề in đậm không indent */
                .prose p[style*="padding-left: 0"],
                .prose p[style*="padding-left:0"],
                .prose p[style*="margin-left: 0"],
                .prose p[style*="margin-left:0"] {
                    padding-left: 0 !important;
                    margin-left: 0 !important;
                }

                /* Nếu không có style padding-left, mặc định indent cho nội dung không phải tiêu đề */
                .prose p:not([style*="padding-left: 0"]):not([style*="padding-left:0"]):not([style*="margin-left: 0"]):not([style*="margin-left:0"]):not(:has(strong:only-child)) {
                    padding-left: 20px;
                }

                /* Indent tất cả paragraph mặc định, trừ các paragraph chỉ chứa strong (tiêu đề) */
                .prose p:has(strong:only-child) {
                    padding-left: 0 !important;
                    margin-left: 0 !important;
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
              display: "flex",
              flexDirection: "column",
              width: "210mm",
              height: "297mm",
              padding: "10mm 15mm",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Header on EVERY page */}
            <div className="page-header">
              <PageHeader data={data} specificService={specificService} />
            </div>

            {/* Results Section */}
            <div
              className="page-content-area"
              style={{
                flex: "1",
                overflow: "visible",
                paddingBottom: index === contentPages.length - 1 ? "40mm" : "0",
              }}
            >
              {index === 0 && (
                <h2
                  className="text-center font-bold text-lg uppercase py-2 mb-4"
                  style={{ breakInside: "avoid" }}
                >
                  KẾT QUẢ
                </h2>
              )}

              {pageContent ? (
                <div
                  className="prose prose-sm max-w-none leading-relaxed text-[14px]"
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              ) : (
                index === 0 && (
                  <div className="p-8 text-gray-400 italic text-center border-2 border-dashed border-gray-300 rounded">
                    Chưa có kết quả xét nghiệm
                  </div>
                )
              )}
            </div>

            {/* Signature Section - Chỉ trang cuối */}
            {index === contentPages.length - 1 && (
              <div
                className="signature-section mt-auto pb-8 flex justify-end"
                style={{ position: "absolute", bottom: "20mm", right: "15mm" }}
              >
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1 border-t border-gray-400 px-10">
                    Ngày {new Date().getDate()} tháng{" "}
                    {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>

                  <div className="font-bold text-base mb-4">
                    T/L GIÁM ĐỐC TRUNG TÂM
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
