/** Form Gen (form-gen-1) — khớp resultFormType từ my-rooms / department. */
export const RESULT_FORM_TYPE_GEN = 2;

export const GEN_DIGITAL_SIGN_FORBIDDEN_MESSAGE =
    'Chỉ tài khoản được phép mới ký số phiếu kết quả Gen. Vui lòng liên hệ quản trị.';

const DEFAULT_ALLOWED_USERNAMES = ['ntl32', 'bbm'];

function parseAllowedUsernames(): ReadonlySet<string> {
    const raw =
        process.env.NEXT_PUBLIC_GEN_DIGITAL_SIGN_ALLOWED_USERNAMES?.trim() ||
        DEFAULT_ALLOWED_USERNAMES.join(',');
    const set = new Set<string>();
    for (const part of raw.split(',')) {
        const u = part.trim().toLowerCase();
        if (u) set.add(u);
    }
    return set;
}

const ALLOWED_USERNAMES = parseAllowedUsernames();

/**
 * Trả về message chặn ký số Gen, hoặc null nếu được phép / không phải form Gen.
 */
export function getGenDigitalSignBlockMessage(
    resultFormType: number,
    username: string | undefined,
): string | null {
    if (resultFormType !== RESULT_FORM_TYPE_GEN) return null;
    const u = username?.trim().toLowerCase();
    if (u && ALLOWED_USERNAMES.has(u)) return null;
    return GEN_DIGITAL_SIGN_FORBIDDEN_MESSAGE;
}

/** true = được phép ký số (GPB luôn true; Gen chỉ khi username trong whitelist). */
export function canPerformGenDigitalSign(
    resultFormType: number,
    username: string | undefined,
): boolean {
    return getGenDigitalSignBlockMessage(resultFormType, username) === null;
}
