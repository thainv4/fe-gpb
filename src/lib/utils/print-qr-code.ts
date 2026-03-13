function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * Mở cửa sổ in chỉ chứa nội dung QR (HTML của QR đã render).
 * Dùng chung cho test-indications và sample-delivery.
 *
 * @param qrCodeHtml - innerHTML của thẻ chứa QRCodeSVG (barcodeRef.current.innerHTML)
 * @param title - Chuỗi dùng cho title trang in (vd: mã tiếp nhận)
 * @param patientName - Tên bệnh nhân hiển thị dọc bên trái mỗi mã QR (tùy chọn)
 * @param patientBirthYear - Năm sinh bệnh nhân hiển thị phía trên mã QR (tùy chọn)
 */
export function printQrCode(qrCodeHtml: string, title: string = 'QR', patientName?: string, patientBirthYear?: string): void {
    if (!qrCodeHtml?.trim()) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const safeTitle = escapeHtml(title)
    const safePatientName = patientName ? escapeHtml(patientName) : ''
    const safeBirthYear = patientBirthYear ? escapeHtml(String(patientBirthYear)) : ''

    const patientNameBlock = safePatientName
        ? `<div class="patient-name-vertical">${safePatientName}</div>`
        : ''
    const birthYearBlock = safeBirthYear
        ? `<div class="patient-birth-year">${safeBirthYear}</div>`
        : ''

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>In mã QR - ${safeTitle}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @page {
                    size: 66mm 32mm;
                    margin: 1mm;
                    padding: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                .page-two-qr {
                    display: flex;
                    align-items: stretch;
                    justify-content: center;
                    gap: 14mm;
                    width: 100%;
                    min-height: 100%;
                }
                .qr-half {
                    flex: 1;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    min-height: 0;
                    gap: 0.5mm; /* birth year sát QR */
                }
                /* Tên bệnh nhân: nằm ngang, nhiều dòng, căn giữa */
                .patient-name-vertical {
                    font-size: 0.4rem;
                    line-height: 1.1;
                    max-width: 22mm;
                    margin-bottom: 0.5mm;
                    overflow: hidden;
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: break-word;
                    text-align: center;
                }
                .qr-half .qr-code-wrap {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5mm;
                    position: relative; /* làm container cho overlay năm sinh */
                }
                /* Năm sinh: dọc, overlay sát cạnh QR bên trái */
                .patient-birth-year {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translate(-100%, -50%) rotate(180deg);
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    font-size: 0.35rem;
                    line-height: 1.15;
                    max-height: 100%;
                    max-width: 8mm;
                    overflow: hidden;
                    white-space: normal;
                    word-break: break-word;
                    overflow-wrap: break-word;
                    z-index: 1;
                }
                @media print {
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                    }
                    .page-two-qr {
                        gap: 14mm;
                    }
                    .patient-name-vertical {
                        font-size: 9px !important;
                        line-height: 1.2 !important;
                    }
                    .patient-birth-year {
                        font-size: 10px !important;
                    }
                    .print-text-xs {
                        font-size: 0.75rem !important;
                        line-height: 1rem !important;
                    }
                }
            </style>
        </head>
        <body class="min-h-screen bg-white p-2">
            <div class="page-two-qr print-container">
              <div class="qr-half text-center">
              <div class="qr-code-wrap">
                 ${birthYearBlock}
                 ${patientNameBlock}
             <div class="qr-code">${qrCodeHtml}</div>
        </div>
        </div>
         <div class="qr-half text-center">
        <div class="qr-code-wrap">
            ${birthYearBlock}
            ${patientNameBlock}
            <div class="qr-code">${qrCodeHtml}</div>
        </div>
        </div>
         </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                    window.onafterprint = function() {
                        window.close();
                    };
                }
            </script>
        </body>
        </html>
    `)
    printWindow.document.close()
}
