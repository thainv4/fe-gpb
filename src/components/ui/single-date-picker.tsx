'use client'

import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

dayjs.locale('vi')

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i),
    label: dayjs().month(i).format('MMMM'),
}))

export function isValidDateStr(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && dayjs(dateStr, 'YYYY-MM-DD', true).isValid()
}

export function formatDateStrDisplay(dateStr: string): string {
    if (!isValidDateStr(dateStr)) return 'Chọn ngày'
    return dayjs(dateStr, 'YYYY-MM-DD').format('DD/MM/YYYY')
}

type SingleDatePickerProps = {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    className?: string
    id?: string
    /** Năm nhỏ nhất trong dropdown (mặc định: năm hiện tại − 20) */
    fromYear?: number
    /** Năm lớn nhất trong dropdown (mặc định: năm hiện tại) */
    toYear?: number
    /** Không cho chọn ngày sau mốc này (mặc định: không giới hạn) */
    maxDate?: string
    /** Không cho chọn ngày trước mốc này */
    minDate?: string
}

function buildYearList(fromYear: number, toYear: number): number[] {
    const years: number[] = []
    for (let y = toYear; y >= fromYear; y--) {
        years.push(y)
    }
    return years
}

export function SingleDatePicker({
    value,
    onChange,
    disabled,
    className,
    id,
    fromYear: fromYearProp,
    toYear: toYearProp,
    maxDate,
    minDate,
}: SingleDatePickerProps) {
    const currentYear = dayjs().year()
    const fromYear = fromYearProp ?? currentYear - 20
    const toYear = toYearProp ?? currentYear
    const years = useMemo(() => buildYearList(fromYear, toYear), [fromYear, toYear])

    const [open, setOpen] = useState(false)
    const anchor = isValidDateStr(value) ? dayjs(value, 'YYYY-MM-DD') : dayjs()
    const [viewMonth, setViewMonth] = useState(anchor.startOf('month'))

    const selected = isValidDateStr(value) ? dayjs(value, 'YYYY-MM-DD') : null
    const maxDay = maxDate && isValidDateStr(maxDate) ? dayjs(maxDate, 'YYYY-MM-DD') : null
    const minDay = minDate && isValidDateStr(minDate) ? dayjs(minDate, 'YYYY-MM-DD') : null

    useEffect(() => {
        if (open) {
            setViewMonth((isValidDateStr(value) ? dayjs(value, 'YYYY-MM-DD') : dayjs()).startOf('month'))
        }
    }, [open, value])

    const calendarDays = useMemo(() => {
        const start = viewMonth.startOf('month')
        const end = viewMonth.endOf('month')
        const startPad = (start.day() + 6) % 7
        const daysInMonth = end.date()
        const cells: Array<{ date: dayjs.Dayjs; inMonth: boolean }> = []

        for (let i = 0; i < startPad; i++) {
            const d = start.subtract(startPad - i, 'day')
            cells.push({ date: d, inMonth: false })
        }
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ date: start.date(d), inMonth: true })
        }
        while (cells.length % 7 !== 0) {
            const last = cells[cells.length - 1].date
            cells.push({ date: last.add(1, 'day'), inMonth: false })
        }
        return cells
    }, [viewMonth])

    function isDayDisabled(d: dayjs.Dayjs): boolean {
        if (maxDay && d.isAfter(maxDay, 'day')) return true
        if (minDay && d.isBefore(minDay, 'day')) return true
        return false
    }

    function setViewYearMonth(year: number, monthIndex: number) {
        const clampedYear = Math.min(toYear, Math.max(fromYear, year))
        setViewMonth(dayjs().year(clampedYear).month(monthIndex).startOf('month'))
    }

    function pickDate(d: dayjs.Dayjs) {
        if (isDayDisabled(d)) return
        onChange(d.format('YYYY-MM-DD'))
        setOpen(false)
    }

    function goToday() {
        const today = dayjs()
        if (isDayDisabled(today)) return
        onChange(today.format('YYYY-MM-DD'))
        setViewMonth(today.startOf('month'))
        setOpen(false)
    }

    const viewYear = viewMonth.year()
    const viewMonthIndex = viewMonth.month()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'h-10 w-full justify-start px-3 font-normal',
                        !isValidDateStr(value) && 'text-muted-foreground',
                        className,
                    )}
                >
                    <CalendarDays className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    {formatDateStrDisplay(value)}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-3" align="start">
                <div className="mb-2 flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}
                        disabled={viewYear === fromYear && viewMonthIndex === 0}
                        aria-label="Tháng trước"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex min-w-0 flex-1 gap-1">
                        <Select
                            value={String(viewMonthIndex)}
                            onValueChange={(v) => setViewYearMonth(viewYear, Number(v))}
                        >
                            <SelectTrigger
                                className="h-8 flex-1 text-xs capitalize"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                className="max-h-56"
                                onPointerDownOutside={(e) => e.preventDefault()}
                            >
                                {MONTH_OPTIONS.map((m) => (
                                    <SelectItem key={m.value} value={m.value} className="capitalize">
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={String(viewYear)}
                            onValueChange={(v) => setViewYearMonth(Number(v), viewMonthIndex)}
                        >
                            <SelectTrigger
                                className="h-8 w-[5.5rem] shrink-0 text-xs"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                className="max-h-56"
                                onPointerDownOutside={(e) => e.preventDefault()}
                            >
                                {years.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setViewMonth((m) => m.add(1, 'month'))}
                        disabled={viewYear === toYear && viewMonthIndex === 11}
                        aria-label="Tháng sau"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-xs text-muted-foreground">
                    {WEEKDAYS.map((w) => (
                        <div key={w} className="py-1 font-medium">
                            {w}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map(({ date, inMonth }) => {
                        const isSelected = selected?.isSame(date, 'day')
                        const isToday = date.isSame(dayjs(), 'day')
                        const dayDisabled = !inMonth || isDayDisabled(date)
                        return (
                            <button
                                key={date.format('YYYY-MM-DD')}
                                type="button"
                                disabled={dayDisabled}
                                onClick={() => inMonth && pickDate(date)}
                                className={cn(
                                    'h-8 w-full rounded-md text-sm transition-colors',
                                    inMonth &&
                                        !dayDisabled &&
                                        'hover:bg-accent hover:text-accent-foreground',
                                    !inMonth && 'cursor-default text-transparent',
                                    dayDisabled &&
                                        inMonth &&
                                        'cursor-not-allowed text-muted-foreground opacity-40',
                                    isSelected &&
                                        inMonth &&
                                        !dayDisabled &&
                                        'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                                    isToday &&
                                        !isSelected &&
                                        inMonth &&
                                        !dayDisabled &&
                                        'border border-primary/40',
                                )}
                            >
                                {inMonth ? date.date() : ''}
                            </button>
                        )
                    })}
                </div>
                <div className="mt-3 flex justify-end border-t pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={goToday}>
                        Hôm nay
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
