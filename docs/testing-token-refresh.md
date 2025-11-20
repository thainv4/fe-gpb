# Testing Token Refresh Implementation

## Hướng dẫn test cơ chế Automatic Token Refresh

### Prerequisites
1. Đăng nhập vào hệ thống
2. Mở Developer Console (F12)
3. Debug utils đã được load tự động (chỉ trong development mode)

---

## Test Cases

### 1. Test Proactive Token Refresh (Tự động refresh trước khi hết hạn)

**Mục đích**: Kiểm tra hệ thống tự động refresh token khi token sắp hết hạn (< 5 phút)

**Steps**:
```javascript
// 1. Kiểm tra token hiện tại
tokenDebug.getInfo()

// 2. Set token sắp hết hạn (3 phút)
tokenDebug.expireSoon()

// 3. Thực hiện một API request bất kỳ (ví dụ: navigate đến một trang khác)
// hoặc đợi khi hệ thống tự động làm request

// 4. Kiểm tra console logs
// Bạn sẽ thấy:
// - "Refreshing access token..."
// - "Token refreshed successfully"
```

**Expected Result**:
- ✅ Token được refresh tự động
- ✅ Request thành công với token mới
- ✅ Không có lỗi
- ✅ User không bị logout

---

### 2. Test Reactive Token Refresh (Refresh khi nhận 401)

**Mục đích**: Kiểm tra hệ thống xử lý response 401 và tự động refresh

**Steps**:
```javascript
// 1. Xóa access token (simulate expired token)
localStorage.removeItem('auth-token')

// 2. Thực hiện một API request
// Navigate đến một trang hoặc click một button

// 3. Kiểm tra console logs
```

**Expected Result**:
- ✅ Nhận được 401
- ✅ Tự động gọi /auth/refresh
- ✅ Retry request với token mới
- ✅ Request thành công

---

### 3. Test Token Expiration trong 1 phút

**Mục đích**: Test token refresh với thời gian ngắn

**Steps**:
```javascript
// 1. Set token expire trong 1 phút
tokenDebug.expireIn(1)

// 2. Đợi 1 phút hoặc thực hiện request ngay

// 3. Kiểm tra token info
tokenDebug.getInfo()
```

**Expected Result**:
- ✅ Token được refresh tự động khi thực hiện request
- ✅ `minutesUntilExpiry` được cập nhật

---

### 4. Test Concurrent Requests (Nhiều request cùng lúc)

**Mục đích**: Kiểm tra chỉ 1 refresh request được gọi khi có nhiều request đồng thời

**Steps**:
```javascript
// 1. Set token sắp hết hạn
tokenDebug.expireSoon()

// 2. Mở nhiều tab hoặc trigger nhiều API calls cùng lúc
// Ví dụ: Refresh trang nhiều lần liên tiếp

// 3. Kiểm tra Network tab trong DevTools
// Filter by: /auth/refresh
```

**Expected Result**:
- ✅ Chỉ 1 request đến /auth/refresh
- ✅ Tất cả requests khác chờ và dùng token mới
- ✅ Không có duplicate refresh calls

---

### 5. Test Logout on Refresh Failure

**Mục đích**: Kiểm tra user bị logout khi refresh token không hợp lệ

**Steps**:
```javascript
// 1. Set invalid refresh token
tokenDebug.invalidateRefresh()

// 2. Xóa access token
localStorage.removeItem('auth-token')

// 3. Thực hiện một API request
// Navigate hoặc click button

// 4. Kiểm tra console logs
```

**Expected Result**:
- ✅ Refresh token call fails (401/403)
- ✅ User bị logout tự động
- ✅ Redirect về /auth/login
- ✅ Tất cả tokens bị xóa

---

### 6. Test Token Info Display

**Mục đích**: Kiểm tra thông tin token

**Steps**:
```javascript
// Xem thông tin chi tiết token
tokenDebug.getInfo()
```

**Expected Output**:
```
=== Token Info ===
Has Token: true
Has Refresh Token: true
Token Preview: eyJhbGciOiJIUzI1NiI...
Expires At: 2025-11-13T08:30:00.000Z
Current Time: 2025-11-13T07:35:00.000Z
Minutes Until Expiry: 55
Is Expired: false
Will Expire Soon (<5min): false
==================
```

---

### 7. Test Reset Token Expiration

**Mục đích**: Reset về giá trị mặc định

**Steps**:
```javascript
// 1. Set token expire sau 60 phút (1 giờ)
tokenDebug.reset()

// 2. Verify
tokenDebug.getInfo()
```

**Expected Result**:
- ✅ Token expires in 60 minutes
- ✅ `willExpireSoon` = false

---

### 8. Test Clear All Tokens

**Mục đích**: Xóa toàn bộ tokens (simulate logout)

**Steps**:
```javascript
// 1. Clear all
tokenDebug.clearAll()

// 2. Verify
tokenDebug.getInfo()

// 3. Try to make an API request
```

**Expected Result**:
- ✅ All tokens removed
- ✅ `hasToken` = false
- ✅ API requests fail with unauthorized

---

### 9. Test Watch Token Refresh Events

**Mục đích**: Monitor các sự kiện refresh token

**Steps**:
```javascript
// 1. Enable watching
tokenDebug.watch()

// 2. Trigger token refresh
tokenDebug.expireSoon()

// 3. Make an API request

// 4. Kiểm tra console - sẽ thấy 🔄 prefix cho refresh events
```

**Expected Result**:
- ✅ Refresh events có prefix 🔄
- ✅ Dễ dàng spot trong console logs

---

## Debug Commands Reference

### Available Commands

```javascript
// Get token information
tokenDebug.getInfo()

// Set token to expire in X minutes
tokenDebug.expireIn(30)  // 30 minutes

// Set token to expire now
tokenDebug.expireNow()

// Set token to expire soon (< 5 min)
tokenDebug.expireSoon()

// Reset to default (1 hour)
tokenDebug.reset()

// Clear all tokens (force logout)
tokenDebug.clearAll()

// Set invalid refresh token (test failure)
tokenDebug.invalidateRefresh()

// Watch for refresh events
tokenDebug.watch()
```

---

## Network Tab Monitoring

### Endpoints to watch

1. **Refresh Token Endpoint**
   - URL: `http://localhost:8000/api/v1/auth/refresh`
   - Method: POST
   - Look for: 200 OK response

2. **Original Request Retry**
   - Look for duplicate requests with same URL
   - Second request should have new Authorization token

### How to Monitor

1. Open DevTools → Network Tab
2. Filter by: `auth` or `refresh`
3. Perform test case
4. Check:
   - Request headers (Authorization)
   - Response data
   - Timing

---

## Console Log Patterns

### Successful Refresh
```
API Request: /auth/refresh
Refreshing access token...
Token refreshed successfully
API Request: /original-endpoint (retry)
```

### Failed Refresh (Logout)
```
API Request: /auth/refresh
Refresh token invalid, logging out user...
```

### 401 Handling
```
API Response: status: 401
Received 401, attempting to refresh token...
Refreshing access token...
Token refreshed successfully
Retrying request with new token...
API Request: /original-endpoint (retry)
```

---

## Common Issues & Solutions

### Issue 1: Token not refreshing
**Solution**: 
```javascript
// Check if refresh token exists
tokenDebug.getInfo()
// Should show hasRefreshToken: true
```

### Issue 2: Infinite refresh loop
**Cause**: Refresh endpoint might be failing
**Solution**: Check network tab for /auth/refresh response

### Issue 3: Token refresh but still getting 401
**Cause**: New token not being used
**Solution**: Check if `setToken()` is being called after refresh

### Issue 4: Multiple refresh calls
**Cause**: Race condition
**Solution**: Implementation already handles this with `isRefreshing` flag

---

## Manual Testing Checklist

- [ ] Token refreshes automatically when < 5 min to expiry
- [ ] Token refreshes on 401 response
- [ ] Only 1 refresh call for concurrent requests
- [ ] User logged out when refresh token invalid
- [ ] Original request retried after successful refresh
- [ ] Token expiration timestamp updated after refresh
- [ ] Auth store updated with new tokens
- [ ] LocalStorage updated with new tokens
- [ ] No infinite refresh loops
- [ ] Debug utils work correctly

---

## Automated Testing (Future)

```typescript
// Example Jest test
describe('Token Refresh', () => {
  it('should refresh token when expired', async () => {
    // Mock token expiration
    // Mock refresh API
    // Perform request
    // Verify refresh called
    // Verify request retried
  })
})
```

---

## Performance Monitoring

### Metrics to track

1. **Refresh Latency**: Time taken to refresh token
2. **Request Retry Time**: Additional time for retry after refresh
3. **Refresh Frequency**: How often tokens are refreshed
4. **Failure Rate**: How often refresh fails

### How to measure

```javascript
// Before refresh
const startTime = performance.now()

// After refresh
const endTime = performance.now()
console.log(`Refresh took ${endTime - startTime}ms`)
```

---

## Security Testing

### Test Cases

1. **Test with expired refresh token**
2. **Test with malformed refresh token**
3. **Test with stolen token (if backend supports token invalidation)**
4. **Test token refresh rate limiting (if implemented)**
5. **Test concurrent requests from different tabs**

---

## Support

Nếu gặp vấn đề:
1. Check console logs
2. Check network tab
3. Run `tokenDebug.getInfo()` để xem token state
4. Check localStorage keys
5. Verify backend /auth/refresh endpoint is working

## Notes

- Token refresh chỉ hoạt động khi có refreshToken
- Token được coi là "sắp hết hạn" khi < 5 phút
- Refresh token cũng có expiration (thường 7-30 ngày)
- Backend cần implement /auth/refresh endpoint đúng format

