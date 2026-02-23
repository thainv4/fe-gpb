/**
 * Mở cửa sổ in chỉ chứa nội dung QR (HTML của QR đã render).
 * Dùng chung cho test-indications và sample-delivery.
 *
 * @param qrCodeHtml - innerHTML của thẻ chứa QRCodeSVG (barcodeRef.current.innerHTML)
 * @param title - Chuỗi dùng cho title trang in (vd: mã tiếp nhận)
 */
export function printQrCode(qrCodeHtml: string, title: string = 'QR'): void {
    if (!qrCodeHtml?.trim()) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>In mã QR - ${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                @page {
                    size: 50mm 30mm;
                    margin: 0;
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
                    width: 100%;
                    min-height: 100%;
                }
                .qr-half {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 0;
                }
                @media print {
                    html, body {
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 0;
                        overflow: hidden;
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
                    <div class="qr-code">${qrCodeHtml}</div>
                </div>
                <div class="qr-half text-center">
                    <div class="qr-code">${qrCodeHtml}</div>
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
