import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

function formatDate(d: dayjs.Dayjs): string {
    return d.format('DD/MM/YYYY')
}

/**
 * Thứ Hai đầu tuần ISO thứ `isoWeek` của năm tuần ISO `isoYear`.
 * Tuần ISO 1 là tuần chứa ngày 04/01 (Thứ Hai có thể sang năm dương lịch trước).
 */
function startOfIsoWeekMonday(isoYear: number, isoWeek: number): dayjs.Dayjs | null {
    if (isoWeek < 1 || isoWeek > 53) return null
    const jan4 = dayjs(`${isoYear}-01-04`, 'YYYY-MM-DD', true)
    if (!jan4.isValid()) return null
    // ISO: Thứ Hai .. Chủ nhật; dayjs: 0=CN .. 6=Thứ 7
    const dow = jan4.day()
    const isoDow = dow === 0 ? 7 : dow
    const mondayWeek1 = jan4.subtract(isoDow - 1, 'day').startOf('day')
    return mondayWeek1.add(isoWeek - 1, 'week')
}

/**
 * Nhãn tooltip cho cột biểu đồ khối lượng ca.
 * - day: period = YYYY-MM-DD (Oracle YYYY-MM-DD)
 * - month: period = YYYY-MM
 * - week: period = IYYY-IW (vd 2026-14) — tuần ISO (Thứ Hai → Chủ nhật)
 */
export function getCaseVolumeColumnTooltip(
    period: string,
    granularity: 'day' | 'week' | 'month',
    count: number,
): string {
    const countPart = `${count} ca`

    if (granularity === 'day') {
        const d = dayjs(period, 'YYYY-MM-DD', true)
        if (!d.isValid()) {
            return `${period} · ${countPart}`
        }
        const start = d.startOf('day')
        const end = d.endOf('day')
        return `Từ ${formatDate(start)} đến ${formatDate(end)} · ${countPart}`
    }

    if (granularity === 'month') {
        const m = dayjs(`${period}-01`, 'YYYY-MM-DD', true)
        if (!m.isValid()) {
            return `${period} · ${countPart}`
        }
        const start = m.startOf('month')
        const end = m.endOf('month')
        return `Từ ${formatDate(start)} đến ${formatDate(end)} · ${countPart}`
    }

    const trimmed = period.trim()
    const match = /^(\d{4})-(\d{1,2})$/.exec(trimmed)
    if (!match) {
        return `${period} · ${countPart}`
    }
    const year = Number(match[1])
    const week = Number(match[2])
    const start = startOfIsoWeekMonday(year, week)
    if (!start) {
        return `${period} · ${countPart}`
    }
    const end = start.add(6, 'day').endOf('day')
    return `Từ ${formatDate(start)} đến ${formatDate(end)} · ${countPart}`
}
