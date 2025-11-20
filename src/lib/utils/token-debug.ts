/**
 * Token Refresh Debug Utilities
 *
 * Các hàm hỗ trợ debug và test token refresh mechanism
 */

/**
 * Lấy thông tin về token hiện tại
 */
export function getTokenInfo() {
    if (typeof window === 'undefined') {
        console.log('Not in browser environment');
        return null;
    }

    const token = localStorage.getItem('auth-token');
    const refreshToken = localStorage.getItem('auth-refresh-token');
    const expiresAt = localStorage.getItem('auth-token-expires-at');

    const info = {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        expiresAt: expiresAt ? new Date(Number.parseInt(expiresAt, 10)).toISOString() : null,
        expiresAtTimestamp: expiresAt ? Number.parseInt(expiresAt, 10) : null,
        now: new Date().toISOString(),
        nowTimestamp: Date.now(),
        timeUntilExpiry: expiresAt
            ? Number.parseInt(expiresAt, 10) - Date.now()
            : null,
        minutesUntilExpiry: expiresAt
            ? Math.floor((Number.parseInt(expiresAt, 10) - Date.now()) / 60000)
            : null,
        isExpired: expiresAt
            ? Number.parseInt(expiresAt, 10) < Date.now()
            : null,
        willExpireSoon: expiresAt
            ? Number.parseInt(expiresAt, 10) - Date.now() < 5 * 60 * 1000
            : null,
    };

    console.log('=== Token Info ===');
    console.log('Has Token:', info.hasToken);
    console.log('Has Refresh Token:', info.hasRefreshToken);
    console.log('Token Preview:', info.tokenPreview);
    console.log('Expires At:', info.expiresAt);
    console.log('Current Time:', info.now);
    console.log('Minutes Until Expiry:', info.minutesUntilExpiry);
    console.log('Is Expired:', info.isExpired);
    console.log('Will Expire Soon (<5min):', info.willExpireSoon);
    console.log('==================');

    return info;
}

/**
 * Set token để expire sau X phút (for testing)
 */
export function setTokenToExpireInMinutes(minutes: number) {
    if (typeof window === 'undefined') {
        console.log('Not in browser environment');
        return;
    }

    const expiresAt = Date.now() + (minutes * 60 * 1000);
    localStorage.setItem('auth-token-expires-at', expiresAt.toString());

    console.log(`Token set to expire in ${minutes} minutes`);
    console.log('Expires at:', new Date(expiresAt).toISOString());

    getTokenInfo();
}

/**
 * Set token để expire ngay (for testing refresh)
 */
export function setTokenToExpireNow() {
    setTokenToExpireInMinutes(0);
}

/**
 * Set token để expire trong < 5 phút (trigger proactive refresh)
 */
export function setTokenToExpireSoon() {
    setTokenToExpireInMinutes(3); // 3 minutes - less than 5 minute buffer
}

/**
 * Reset token expiration về giá trị mặc định (1 giờ)
 */
export function resetTokenExpiration() {
    setTokenToExpireInMinutes(60);
}

/**
 * Xóa tất cả token data (force logout)
 */
export function clearAllTokens() {
    if (typeof window === 'undefined') {
        console.log('Not in browser environment');
        return;
    }

    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-refresh-token');
    localStorage.removeItem('auth-token-expires-at');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-storage');

    console.log('All tokens cleared');
}

/**
 * Simulate invalid refresh token (for testing logout on refresh failure)
 */
export function setInvalidRefreshToken() {
    if (typeof window === 'undefined') {
        console.log('Not in browser environment');
        return;
    }

    localStorage.setItem('auth-refresh-token', 'invalid-token-for-testing');
    console.log('Refresh token set to invalid value');
    console.log('Next token refresh will fail and trigger logout');
}

/**
 * Watch token refresh events
 */
export function watchTokenRefresh() {
    if (typeof window === 'undefined') {
        console.log('Not in browser environment');
        return;
    }

    // Override console.log to catch refresh events
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
        const message = args.join(' ');
        if (message.includes('Refreshing access token') ||
            message.includes('Token refreshed') ||
            message.includes('Received 401')) {
            originalLog('🔄 [TOKEN REFRESH EVENT]', ...args);
        } else {
            originalLog(...args);
        }
    };

    console.log('👀 Watching for token refresh events...');
    console.log('Look for 🔄 prefix in console logs');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    (window as unknown as {tokenDebug: unknown}).tokenDebug = {
        getInfo: getTokenInfo,
        expireIn: setTokenToExpireInMinutes,
        expireNow: setTokenToExpireNow,
        expireSoon: setTokenToExpireSoon,
        reset: resetTokenExpiration,
        clearAll: clearAllTokens,
        invalidateRefresh: setInvalidRefreshToken,
        watch: watchTokenRefresh,
    };

    console.log('💡 Token Debug Utils loaded!');
    console.log('Available in console: window.tokenDebug');
    console.log('Commands:');
    console.log('  tokenDebug.getInfo()           - Show token info');
    console.log('  tokenDebug.expireIn(minutes)   - Set token to expire in X minutes');
    console.log('  tokenDebug.expireNow()         - Set token to expire now');
    console.log('  tokenDebug.expireSoon()        - Set token to expire in 3 min (trigger refresh)');
    console.log('  tokenDebug.reset()             - Reset expiration to 1 hour');
    console.log('  tokenDebug.clearAll()          - Clear all tokens');
    console.log('  tokenDebug.invalidateRefresh() - Set invalid refresh token');
    console.log('  tokenDebug.watch()             - Watch for refresh events');
}

