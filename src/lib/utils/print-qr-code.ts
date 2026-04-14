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
        ? `<div class="patient-name">${safePatientName}</div>`
        : ''
    const birthYearBlock = safeBirthYear
        ? `<div class="birth-year">${safeBirthYear}</div>`
        : ''

    const qrBlock = `
        <div class="qr-half">
            ${patientNameBlock}
            <div class="qr-row">
                ${birthYearBlock}
                <div class="qr-code">${qrCodeHtml}</div>
            </div>
        </div>`

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>In mã QR - ${safeTitle}</title>
            <style>
                @page {
                    size: 90mm 44mm;
                    margin: 1mm;
                    padding: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                html, body {
                    width: 100%;
                    height: 100%;
                    font-family: Arial, Helvetica, sans-serif;
                }
                .page-two-qr {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 20mm;
                    width: 100%;
                    height: 100%;
                }
                .qr-half {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 35mm;
                }
                .patient-name {
                    font-size: 3.5mm;
                    font-weight: 700;
                    line-height: 1.25;
                    text-align: center;
                    max-width: 35mm;
                    overflow: hidden;
                    word-break: break-word;
                    margin-bottom: 0.5mm;
                }
                .qr-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    gap: 1mm;
                }
                .birth-year {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    font-size: 4.2mm;
                    font-weight: 700;
                    line-height: 1;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .qr-code {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .qr-code svg {
                    display: block;
                }
                .print-text-xs {
                    font-size: 5mm;
                    font-weight: 700;
                    line-height: 1.3;
                    margin-top: 0.5mm;
                }
                @media print {
                    html, body {
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
                    }
                }
            </style>
        </head>
        <body>
            <div class="page-two-qr">
                ${qrBlock}
                ${qrBlock}
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
