import * as XLSX from 'xlsx'

export interface ExportExcelItem {
    serviceReqCode: string
    patientName: string
    stateName: string
    createdAt: string
}

export interface ExportExcelOptions {
    data: ExportExcelItem[]
    fileName?: string
    sheetName?: string
    stateName?: string
}

/**
 * Xuất dữ liệu ra file Excel (.xlsx)
 * @param options - Các tùy chọn xuất Excel
 */
export function exportToExcel(options: ExportExcelOptions): void {
    const { data, fileName, sheetName = 'Dữ liệu' } = options

    if (data.length === 0) {
        throw new Error('Không có dữ liệu để xuất')
    }

    // Chuẩn bị dữ liệu cho Excel với format đúng
    const excelData = data.map((item) => ({
        'Mã Y lệnh': item.serviceReqCode,
        'Tên bệnh nhân': item.patientName,
        'Trạng thái': item.stateName,
        'Thời gian': item.createdAt,
    }))

    // Tạo worksheet từ dữ liệu
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Tự động điều chỉnh độ rộng cột
    const colWidths = [
        { wch: 20 }, // Mã Y lệnh
        { wch: 30 }, // Tên bệnh nhân
        { wch: 25 }, // Trạng thái
        { wch: 25 }, // Thời gian
    ]
    ws['!cols'] = colWidths

    // Tạo workbook và thêm worksheet
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Tạo tên file: gpb-YYYY-MM-DD
    let finalFileName = fileName
    if (!finalFileName) {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        finalFileName = `gpb-${year}-${month}-${day}.xlsx`
    }

    // Xuất file
    XLSX.writeFile(wb, finalFileName)
}

/**
 * Format thời gian từ ISO string sang định dạng Việt Nam
 * @param isoString - Chuỗi thời gian ISO
 * @returns Chuỗi thời gian đã format
 */
export function formatDateTimeForExcel(isoString?: string): string {
    if (!isoString) return ''
    
    return new Date(isoString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}
