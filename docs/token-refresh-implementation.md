# Token Refresh Implementation

## Tổng quan

Dự án đã được implement cơ chế **tự động refresh token** khi accessToken hết hạn hoặc sắp hết hạn.

## Các tính năng chính

### 1. Token Expiration Tracking
- Lưu thời gian hết hạn của token trong `localStorage` với key `auth-token-expires-at`
- Tự động tính toán thời gian hết hạn dựa trên `expiresIn` (seconds) từ API response
- Kiểm tra token có hết hạn trong vòng 5 phút tới không

### 2. Automatic Token Refresh
- **Proactive Refresh**: Tự động làm mới token TRƯỚC khi thực hiện request nếu token sắp hết hạn
- **Reactive Refresh**: Tự động làm mới token khi nhận response 401 Unauthorized
- **Retry Mechanism**: Tự động retry request ban đầu sau khi refresh token thành công

### 3. Concurrent Request Handling
- Sử dụng **subscriber pattern** để xử lý nhiều request đồng thời
- Khi có request đang refresh token, các request khác sẽ chờ và dùng token mới
- Tránh việc gọi refresh API nhiều lần không cần thiết

### 4. Automatic Logout
- Tự động logout user khi refresh token thất bại (401/403)
- Redirect về trang login
- Xóa toàn bộ token và user data khỏi localStorage

## Flow hoạt động

### Login Flow
```
User Login 
  → API returns { accessToken, refreshToken, expiresIn }
  → ApiClient stores:
      - accessToken
      - refreshToken  
      - tokenExpiresAt = now + expiresIn
  → Save to localStorage & AuthStore
```

### Request Flow (Proactive Refresh)
```
User makes API request
  → Check if token expires in < 5 minutes
  → If yes:
      → Call /auth/refresh with refreshToken
      → Get new accessToken & refreshToken
      → Update ApiClient & AuthStore
      → Proceed with original request using new token
  → If no:
      → Proceed with original request
```

### Request Flow (Reactive Refresh)
```
User makes API request
  → Server returns 401 Unauthorized
  → If not a retry:
      → Call /auth/refresh with refreshToken
      → If refresh success:
          → Retry original request with new token
      → If refresh fails:
          → Logout user & redirect to login
  → If already a retry:
      → Logout user & redirect to login
```

## API Methods Updated

### `ApiClient.setToken(token, expiresIn?)`
```typescript
// Old
apiClient.setToken(token);

// New - với expiration tracking
apiClient.setToken(token, 3600); // 3600 seconds = 1 hour
```

### `ApiClient.login(credentials)`
```typescript
// Tự động set token với expiration time
const result = await apiClient.login({ username, password });
// Token, refreshToken, và expiresAt được set tự động
```

### `ApiClient.request<T>(endpoint, options)`
```typescript
// Tự động xử lý token refresh
const data = await apiClient.request('/some-endpoint');
// Không cần xử lý gì thêm, token refresh tự động nếu cần
```

## Private Methods (Internal)

### `isTokenExpired(): boolean`
Kiểm tra token có hết hạn trong < 5 phút không

### `ensureValidToken(): Promise<boolean>`
Đảm bảo token còn valid trước khi request

### `performTokenRefresh(): Promise<string | null>`
Thực hiện refresh token bằng cách gọi `/auth/refresh`

### `handleLogout(): Promise<void>`
Xử lý logout khi refresh token thất bại

### Subscriber Pattern
```typescript
subscribeTokenRefresh(callback)  // Subscribe để nhận token mới
onTokenRefreshed(token)          // Notify tất cả subscribers
```

## Configuration

### Token Expiration Buffer
```typescript
const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
```
Token được coi là "sắp hết hạn" nếu còn < 5 phút.

### Retry Logic
- Chỉ retry 1 lần sau khi refresh token
- Sử dụng parameter `isRetry` để tránh infinite loop

### Excluded Endpoints
Token refresh KHÔNG áp dụng cho:
- `/auth/refresh` (tránh infinite loop)
- `/auth/login` (không cần token)
- Các endpoint `/auth/*` khác

## Testing

### Test Proactive Refresh
1. Login vào hệ thống
2. Set `localStorage.setItem('auth-token-expires-at', Date.now() + 60000)` (1 phút)
3. Chờ hoặc thực hiện request sau 1 phút
4. Kiểm tra console log: "Refreshing access token..."

### Test Reactive Refresh (401 handling)
1. Login vào hệ thống
2. Xóa token: `localStorage.removeItem('auth-token')`
3. Thực hiện bất kỳ API request nào
4. Hệ thống sẽ tự động refresh và retry

### Test Logout on Refresh Failure
1. Login vào hệ thống
2. Set refresh token không hợp lệ: `localStorage.setItem('auth-refresh-token', 'invalid-token')`
3. Xóa token: `localStorage.removeItem('auth-token')`
4. Thực hiện API request
5. User sẽ bị logout và redirect về `/auth/login`

## Storage Keys

### LocalStorage Keys Used
```typescript
'auth-storage'              // Zustand persist store (includes token, refreshToken)
'auth-token'                // Backup accessToken
'auth-refresh-token'        // Backup refreshToken  
'auth-user'                 // User data
'auth-token-expires-at'     // Token expiration timestamp (NEW)
```

## Error Handling

### Network Errors
```typescript
{
  success: false,
  error: "Network error",
  status: undefined
}
```

### Token Expired
```typescript
{
  success: false,
  error: "Session expired. Please login again.",
  status: 401
}
```

### Refresh Token Failed
```typescript
// User automatically logged out
// Redirected to /auth/login
```

## Security Considerations

1. **Token Storage**: Tokens được lưu trong localStorage (có thể upgrade lên httpOnly cookies trong tương lai)
2. **Expiration Buffer**: 5 phút buffer giúp đảm bảo token không hết hạn giữa chừng request
3. **Single Refresh**: Chỉ 1 refresh request tại 1 thời điểm (tránh race condition)
4. **Automatic Cleanup**: Tự động xóa token khi refresh thất bại

## Future Improvements

1. [ ] Sử dụng httpOnly cookies thay vì localStorage
2. [ ] Implement token rotation (invalidate old refresh token)
3. [ ] Add refresh token blacklist checking
4. [ ] Implement silent refresh trước khi token hết hạn
5. [ ] Add telemetry/monitoring cho refresh events
6. [ ] Implement sliding session (extend session on activity)

## Console Logs

Khi debug, bạn sẽ thấy các log sau:

```
API Request: { url, method, headers, body }
API Response: { status, statusText, data }
Refreshing access token...
Token refreshed successfully
Received 401, attempting to refresh token...
Retrying request with new token...
Refresh token invalid, logging out user...
```

## Compatibility

- ✅ Compatible với existing code
- ✅ Backward compatible (API không thay đổi signature)
- ✅ Works với Zustand auth store
- ✅ Works với React Query/TanStack Query
- ✅ SSR-safe (kiểm tra `window !== undefined`)

## Conclusion

Implementation này cung cấp một cơ chế refresh token **robust**, **automatic**, và **transparent** cho user. User không cần biết token đã được refresh - mọi thứ hoạt động seamlessly.

