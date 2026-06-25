import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Key bền vững (KHÔNG xóa khi logout) để ghi nhớ cơ sở đã chọn lần trước. */
export const LAST_HIS_BRANCH_ID_KEY = 'last-his-branch-id'

export interface HisBranch {
    id: number
    branchCode: string
    branchName: string
}

interface BranchState {
    /** Cơ sở đang chọn của phiên hiện tại (HIS_BRANCH.ID). */
    selectedHisBranchId: number | null
    branchCode: string | null
    branchName: string | null
    setBranch: (branch: HisBranch) => void
    clearBranch: () => void
}

/** HIS_BRANCH.ID của cơ sở Ninh Bình (cơ sở 2), khớp với BE (NINH_BINH_HIS_BRANCH_ID).
 * Dùng để preview prefix barcode thực (vd S -> S2). Barcode cuối cùng do BE sinh. */
const NINH_BINH_HIS_BRANCH_ID = (() => {
    const raw = process.env.NEXT_PUBLIC_NINH_BINH_HIS_BRANCH_ID
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
})()

/** Cơ sở Ninh Bình thêm '2' vào sau prefix barcode. */
export function isNinhBinhBranch(hisBranchId: number | null | undefined): boolean {
    if (hisBranchId == null || NINH_BINH_HIS_BRANCH_ID == null) return false
    return Number(hisBranchId) === NINH_BINH_HIS_BRANCH_ID
}

const RESULT_FORM_HOSPITAL_NAME_HANOI = 'BỆNH VIỆN BẠCH MAI CƠ SỞ HÀ NỘI'
const RESULT_FORM_HOSPITAL_NAME_NINH_BINH = 'BỆNH VIỆN BẠCH MAI CƠ SỞ NINH BÌNH'
const GEN_FORM_HOSPITAL_ADDRESS_HANOI = 'Tầng 16 nhà Q, 78 - Giải Phóng - Kim Liên - Hà Nội'
const GEN_FORM_HOSPITAL_ADDRESS_NINH_BINH = 'Liêm Tuyền, Ninh Bình'

/** Tên bệnh viện trên header form kết quả (theo cơ sở đăng nhập). */
export function getResultFormHospitalName(hisBranchId: number | null | undefined): string {
    return isNinhBinhBranch(hisBranchId)
        ? RESULT_FORM_HOSPITAL_NAME_NINH_BINH
        : RESULT_FORM_HOSPITAL_NAME_HANOI
}

/** Địa chỉ bệnh viện trên form kết quả GEN (theo cơ sở đăng nhập). */
export function getGenFormHospitalAddress(hisBranchId: number | null | undefined): string {
    return isNinhBinhBranch(hisBranchId)
        ? GEN_FORM_HOSPITAL_ADDRESS_NINH_BINH
        : GEN_FORM_HOSPITAL_ADDRESS_HANOI
}

/** Đọc cơ sở lần trước từ localStorage (dùng để pre-select dropdown login). */
export function getLastHisBranchId(): number | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LAST_HIS_BRANCH_ID_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
}

/** Ghi nhớ cơ sở đã chọn (bền vững, không xóa khi logout). */
export function persistLastHisBranchId(hisBranchId: number): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LAST_HIS_BRANCH_ID_KEY, String(hisBranchId))
}

export const useBranchStore = create<BranchState>()(
    persist(
        (set) => ({
            selectedHisBranchId: null,
            branchCode: null,
            branchName: null,

            setBranch: (branch: HisBranch) => {
                set({
                    selectedHisBranchId: branch.id,
                    branchCode: branch.branchCode,
                    branchName: branch.branchName,
                })
                persistLastHisBranchId(branch.id)
            },

            clearBranch: () => {
                set({ selectedHisBranchId: null, branchCode: null, branchName: null })
            },
        }),
        {
            name: 'branch-storage',
        }
    )
)
