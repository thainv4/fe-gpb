/**
 * Một nguồn duy nhất cho TokenCode HIS dùng với API (header TokenCode) — đọc từ persisted HIS store.
 * Mọi chỗ cần mã: gọi getHisTokenCode(); không lưu song song key phẳng khác.
 */
const PERSISTED_HIS_STORE = 'his-storage'

function readFromPersistedZustand(): string | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(PERSISTED_HIS_STORE)
    if (!raw) return null
    try {
        const p = JSON.parse(raw) as { state?: { token?: { tokenCode?: string } } }
        const tc = p.state?.token?.tokenCode
        if (typeof tc === 'string' && tc.trim()) return tc.trim()
    } catch {
        /* ignore */
    }
    return null
}

/**
 * Đọc TokenCode trực tiếp từ his-storage (zustand persist).
 */
export function getHisTokenCode(): string | null {
    if (typeof window === 'undefined') return null
    return readFromPersistedZustand()
}
