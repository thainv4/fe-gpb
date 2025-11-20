/**
 * Utility function to clear all session data
 * Used during logout to ensure clean state
 */
export function clearAllSessionData() {
    if (typeof window === 'undefined') return

    // Clear all localStorage items
    const keysToRemove = [
        'auth-storage',
        'auth-token',
        'auth-refresh-token',
        'auth-user',
        'auth-token-expires-at',
        'tab-storage',
        'current-room-storage',
    ]

    keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
    })

    // Clear sessionStorage
    sessionStorage.clear()

    // Clear any cookies (if needed in the future)
    // document.cookie.split(";").forEach((c) => {
    //     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    // });
}

/**
 * Force a full page reload to /auth/login
 * This ensures all state is cleared and fresh
 */
export function forceLogoutRedirect() {
    clearAllSessionData()
    window.location.href = '/auth/login'
}

