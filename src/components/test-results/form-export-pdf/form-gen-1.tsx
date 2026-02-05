"use client";

import React, { useMemo } from "react";
import {
  StoredServiceRequestResponse,
  StoredService,
} from "@/lib/api/client";
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
  } = data;

  const age = calculateAge(patientDob);
  const sampleTypeName = specificService?.sampleTypeName ?? "";
  const receptionCode = specificService?.receptionCode ?? "";
  const resultName = specificService?.resultName ?? "Phiếu kết quả xét nghiệm";

  const resultText = useMemo(() => {
    if (!specificService) return "";
    if (
      specificService.resultComment ||
      specificService.resultDescription ||
      specificService.resultConclude ||
      specificService.resultNote
    ) {
      const parts: string[] = [];
      if (specificService.resultComment) parts.push(specificService.resultComment);
      if (specificService.resultDescription) parts.push(specificService.resultDescription);
      if (specificService.resultConclude) parts.push(specificService.resultConclude);
      if (specificService.resultNote) parts.push(specificService.resultNote);
      return parts.join('<div style="margin-bottom: 1em;"></div>');
    }
    return specificService.resultText ?? "";
  }, [specificService]);

  return (
    <div className="w-[210mm] mx-auto bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: A4; margin: 0; }
            @media print {
              body { margin: 0; padding: 0; }
              .a4-page { width: 210mm; min-height: 297mm; margin: 0; box-shadow: none; page-break-after: always; }
            }
          `,
        }}
      />
      <div className="a4-page w-[210mm] min-h-[297mm] bg-white mx-auto p-5 box-border shadow-sm print:shadow-none">
        {/* Header Table */}
        <table className="w-full mb-4 border-collapse">
          <tbody>
            <tr>
              <td className="w-1/4" />
              <td className="w-1/2" />
              <td className="w-1/4 text-center text-sm align-top">
                <div className="font-bold">BỘ Y TẾ</div>
                <div className="font-bold">BỆNH VIỆN BẠCH MAI</div>
                <div className="font-bold">TRUNG TÂM Y HỌC HẠT NHÂN</div>
              </td>
              <td className="w-1/4 text-center align-top pl-2">
                {serviceReqCode && (
                  <div className="flex flex-col items-center mb-2">
                    <QRCodeSVG
                      value={serviceReqCode}
                      size={64}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                )}
                <div className="text-xs text-left inline-block">
                  <div>PID: {patientCode}</div>
                  <div>SID: {serviceReqCode}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title */}
        <h1 className="text-center text-xl font-bold mb-2">
          PHIẾU KẾT QUẢ XÉT NGHIỆM
        </h1>
        <p className="text-center text-sm mb-6 italic">{resultName}</p>

        {/* 1. Patient Information */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">1. THÔNG TIN NGƯỜI BỆNH:</h2>
          <div className="ml-4 space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-baseline">
              <span className="w-28 shrink-0">Họ và tên:</span>
              <span className="border-b border-dotted border-black flex-1 min-w-0">
                {patientName}
              </span>
              <span className="w-20 shrink-0">Năm sinh:</span>
              <span className="border-b border-dotted border-black w-24">
                {patientDob ? String(patientDob).substring(0, 4) : ""}
              </span>
              <span className="w-16 shrink-0">Giới tính:</span>
              <span className="border-b border-dotted border-black w-20">
                {patientGenderName}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 items-baseline">
              <span className="w-28 shrink-0">Địa chỉ:</span>
              <span className="border-b border-dotted border-black flex-1 min-w-0">
                {patientAddress || "—"}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 items-baseline">
              <span className="w-28 shrink-0">Chẩn đoán:</span>
              <span className="border-b border-dotted border-black flex-1 min-w-0">
                {icdCode} - {icdName}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Doctor / Request info */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">2. THÔNG TIN BÁC SỸ CHỈ ĐỊNH:</h2>
          <div className="ml-4 space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-4 items-baseline">
              <span className="w-32 shrink-0">Đơn vị:</span>
              <span className="border-b border-dotted border-black flex-1 min-w-0">
                {requestDepartmentName} - {requestRoomName}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Sample Information */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">3. THÔNG TIN MẪU BỆNH PHẨM:</h2>
          <div className="ml-4">
            <table className="border border-black border-collapse w-full text-sm">
              <tbody>
                <tr>
                  <td className="border border-black p-2 w-1/2">
                    <span className="font-semibold">Mã bệnh phẩm:</span>
                    <span className="ml-2">{receptionCode || "—"}</span>
                  </td>
                  <td className="border border-black p-2 w-1/2">
                    <span className="font-semibold">Vị trí lấy mẫu:</span>
                    <span className="ml-2">{sampleTypeName || "—"}</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2">
                    <span className="font-semibold">Phương pháp nhuộm:</span>
                    <span className="ml-2">{specificService?.stainingMethodName ?? "—"}</span>
                  </td>
                  <td className="border border-black p-2">
                    <span className="font-semibold">Mã Y lệnh:</span>
                    <span className="ml-2">{serviceReqCode}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Technique */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">4. KỸ THUẬT THỰC HIỆN:</h2>
          <div className="ml-4 text-sm">
            {specificService?.stainingMethodName
              ? `Phương pháp: ${specificService.stainingMethodName}`
              : "—"}
          </div>
        </div>

        {/* 5. Test Results */}
        <div className="mb-4">
          <h2 className="font-bold mb-2">5. KẾT QUẢ XÉT NGHIỆM:</h2>
          <div className="ml-4 text-sm">
            {resultText ? (
              <div
                className="prose prose-sm max-w-none text-[14px]"
                dangerouslySetInnerHTML={{ __html: resultText }}
              />
            ) : (
              <p className="text-gray-500 italic">Chưa có kết quả xét nghiệm</p>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="mt-12">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="w-1/2 align-top" />
                <td className="w-1/2 text-center align-top">
                  <div className="mb-1">
                    Ngày {new Date().getDate()} tháng{" "}
                    {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="text-center align-top pt-4">
                  <div className="font-bold">Người phê duyệt kết quả</div>
                  <div className="h-16" />
                  <div className="border-t border-black mt-2 pt-1">
                    _____________________
                  </div>
                </td>
                <td className="text-center align-top pt-4">
                  <div className="font-bold">Bác sỹ đọc kết quả / Người thực hiện</div>
                  {signatureImageBase64 && (
                    <div className="flex justify-center my-2">
                      <img
                        src={`data:image/png;base64,${signatureImageBase64}`}
                        alt="Chữ ký"
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
                  )}
                  <div className="border-t border-black mt-2 pt-1">
                    _____________________
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
