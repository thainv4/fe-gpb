import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount)
}

export function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '')
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9)
}

/**
 * Format date of birth from HIS format (yyyyMMddHHmmss) to yyyy-MM-dd
  * @param dob - Date string or number in format yyyyMMddHHmmss (e.g., "19850515000000" or 19850515000000)
 * @returns Date string in format yyyy-MM-dd (e.g., "1985-05-15")
 */
export function formatDobFromHis(dob: string | number): string {
    if (!dob) return ''

    const dobStr = String(dob)
    if (dobStr.length < 8) return ''

    const year = dobStr.substring(0, 4)
    const month = dobStr.substring(4, 6)
    const day = dobStr.substring(6, 8)

    return `${year}-${month}-${day}`
}

/**
 * Format date of birth to display format (dd/MM/yyyy)
 * @param dob - Date string or number in format yyyyMMddHHmmss
 * @returns Date string in format dd/MM/yyyy
 */
export function formatDobDisplay(dob: string | number): string {
    if (!dob) return ''

    const dobStr = String(dob)
    if (dobStr.length < 8) return ''

    const year = dobStr.substring(0, 4)
    const month = dobStr.substring(4, 6)
    const day = dobStr.substring(6, 8)

    return `${day}/${month}/${year}`
}

