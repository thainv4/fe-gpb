# 🔐 Authentication API Documentation

## 📋 Tổng quan
Module Authentication cung cấp các chức năng xác thực và quản lý token cho hệ thống, bao gồm JWT authentication, HIS integration và HIS direct login.

## 🏗️ Cấu trúc dữ liệu

### Login Response
```json
{
  "user": {
    "id": "uuid-user-id",
    "username": "john_doe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "role": "admin",
    "isActive": 1,
    "lastLoginAt": "2024-01-01T12:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### HIS Token Response
```json
{
  "tokenCode": "HIS_TOKEN_CODE_123",
  "renewCode": "HIS_RENEW_CODE_456",
  "userLoginName": "admin",
  "userName": "Administrator",
  "userEmail": "admin@hospital.com",
  "userMobile": "0123456789",
  "userGCode": "G001",
  "applicationCode": "HIS_APP",
  "loginTime": "2024-01-01T12:00:00Z",
  "expireTime": "2024-01-01T18:00:00Z"
}
```

## 🔐 Authentication Types

### 1. JWT Authentication
- **Access Token**: Thời hạn 24h (có thể cấu hình)
- **Refresh Token**: Thời hạn 7 ngày (có thể cấu hình)
- **Payload**: `{ sub, email, username, role }`

### 2. HIS Token Authentication
- **Token Code**: Sử dụng để gọi HIS APIs
- **Renew Code**: Sử dụng để gia hạn token
- **Auto-renewal**: Tự động gia hạn khi token sắp hết hạn

### 3. HIS Direct Login Authentication
- **Direct Login**: Đăng nhập trực tiếp với username/password HIS
- **Token Validation**: Xác thực HIS token mà không cần JWT
- **Public Endpoints**: Không yêu cầu authentication trước

## 📡 API Endpoints & Curl Examples

### 1. Đăng nhập hệ thống
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "user": {
      "id": "uuid-user-id",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "Administrator",
      "role": "admin",
      "isActive": 1,
      "lastLoginAt": "2024-01-01T12:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### 2. Làm mới Access Token
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Token refresh not implemented yet"
  }
}
```

### 3. Đăng xuất
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/auth/logout" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Logout successful"
  }
}
```

## 🏥 HIS Integration Endpoints

### 4. Đăng nhập HIS trực tiếp (Direct Login)
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-direct-login/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "message": "Successfully logged in to HIS system",
    "hisToken": {
      "tokenCode": "HIS_TOKEN_CODE_123",
      "userLoginName": "admin",
      "userName": "Administrator",
      "userEmail": "admin@hospital.com",
      "userMobile": "0123456789",
      "userGCode": "G001",
      "applicationCode": "HIS_APP",
      "loginTime": "2024-01-01T12:00:00Z",
      "expireTime": "2024-01-01T18:00:00Z",
      "minutesUntilExpire": 360,
      "roles": [
        {
          "roleCode": "ADMIN",
          "roleName": "Administrator"
        }
      ]
    },
    "accessToken": "HIS_TOKEN_CODE_123",
    "tokenType": "Bearer",
    "expiresIn": 21600
  }
}
```

### 5. Xác thực HIS Token
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-direct-login/validate-token" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "HIS_TOKEN_CODE_123"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "HIS token is valid",
    "user": {
      "loginName": "admin",
      "userName": "Administrator",
      "email": "admin@hospital.com",
      "mobile": "0123456789",
      "gCode": "G001",
      "applicationCode": "HIS_APP",
      "roles": [
        {
          "roleCode": "ADMIN",
          "roleName": "Administrator"
        }
      ]
    },
    "token": {
      "tokenCode": "HIS_TOKEN_CODE_123",
      "loginTime": "2024-01-01T12:00:00Z",
      "expireTime": "2024-01-01T18:00:00Z",
      "minutesUntilExpire": 360,
      "isExpired": false,
      "isExpiringSoon": false
    }
  }
}
```

### 6. Đăng nhập HIS (sử dụng thông tin từ JWT)
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/login" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "tokenCode": "HIS_TOKEN_CODE_123",
    "renewCode": "HIS_RENEW_CODE_456",
    "userLoginName": "admin",
    "userName": "Administrator",
    "userEmail": "admin@hospital.com",
    "userMobile": "0123456789",
    "userGCode": "G001",
    "applicationCode": "HIS_APP",
    "loginTime": "2024-01-01T12:00:00Z",
    "expireTime": "2024-01-01T18:00:00Z"
  }
}
```

### 5. Gia hạn HIS Token
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/renew-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "renewCode": "HIS_RENEW_CODE_456"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "tokenCode": "HIS_TOKEN_CODE_NEW_789",
    "renewCode": "HIS_RENEW_CODE_NEW_012",
    "userLoginName": "admin",
    "userName": "Administrator",
    "userEmail": "admin@hospital.com",
    "userMobile": "0123456789",
    "userGCode": "G001",
    "applicationCode": "HIS_APP",
    "loginTime": "2024-01-01T12:00:00Z",
    "expireTime": "2024-01-01T18:00:00Z"
  }
}
```

### 6. Lấy HIS Token hợp lệ
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/his-integration/token" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với username cụ thể:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/his-integration/token?username=admin" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "tokenCode": "HIS_TOKEN_CODE_123",
    "renewCode": "HIS_RENEW_CODE_456",
    "userLoginName": "admin",
    "userName": "Administrator",
    "userEmail": "admin@hospital.com",
    "userMobile": "0123456789",
    "userGCode": "G001",
    "applicationCode": "HIS_APP",
    "loginTime": "2024-01-01T12:00:00Z",
    "expireTime": "2024-01-01T18:00:00Z"
  }
}
```

### 7. Làm mới HIS Token (nếu cần)
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/refresh-token" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với username cụ thể:**
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/refresh-token?username=admin" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 8. Gọi HIS API
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/call-api" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "endpoint": "/api/patients",
    "method": "GET",
    "data": {
      "patientId": "12345"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "patientId": "12345",
    "patientName": "Nguyễn Văn A",
    "age": 30,
    "gender": "Male"
  }
}
```

### 9. Lấy thông tin người dùng HIS
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/his-integration/user-info/admin" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "loginName": "admin",
    "userName": "Administrator",
    "email": "admin@hospital.com",
    "mobile": "0123456789",
    "gCode": "G001",
    "applicationCode": "HIS_APP",
    "roles": [
      {
        "roleCode": "ADMIN",
        "roleName": "Administrator"
      }
    ],
    "loginTime": "2024-01-01T12:00:00Z",
    "expireTime": "2024-01-01T18:00:00Z",
    "minutesUntilExpire": 360
  }
}
```

### 10. Đăng xuất HIS
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/logout/admin" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Successfully logged out from HIS"
  }
}
```

### 11. Kiểm tra trạng thái HIS Token
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/his-integration/token-status" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với username cụ thể:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/his-integration/token-status?username=admin" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "isValid": true,
    "isExpired": false,
    "isExpiringSoon": false,
    "minutesUntilExpire": 360,
    "userLoginName": "admin",
    "userName": "Administrator",
    "loginTime": "2024-01-01T12:00:00Z",
    "expireTime": "2024-01-01T18:00:00Z"
  }
}
```

### 12. Dọn dẹp token hết hạn
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/his-integration/cleanup-expired-tokens" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Expired tokens cleaned up successfully"
  }
}
```

## 🔐 Phân quyền

| Endpoint | Authentication | Role Required | Description |
|----------|----------------|---------------|-------------|
| `POST /auth/login` | - | - | Đăng nhập hệ thống (public) |
| `POST /auth/refresh` | JWT | - | Làm mới access token |
| `POST /auth/logout` | JWT | - | Đăng xuất |
| `POST /his-direct-login/login` | - | - | Đăng nhập HIS trực tiếp (public) |
| `POST /his-direct-login/validate-token` | - | - | Xác thực HIS token (public) |
| `POST /his-integration/login` | JWT | user, admin, manager | Đăng nhập HIS |
| `POST /his-integration/renew-token` | JWT | admin, manager | Gia hạn HIS token |
| `GET /his-integration/token` | JWT | user, admin, manager | Lấy HIS token |
| `POST /his-integration/refresh-token` | JWT | admin, manager | Làm mới HIS token |
| `POST /his-integration/call-api` | JWT | user, admin, manager | Gọi HIS API |
| `GET /his-integration/user-info/:username` | JWT | user, admin, manager | Thông tin user HIS |
| `POST /his-integration/logout/:username` | JWT | admin, manager | Đăng xuất HIS |
| `GET /his-integration/token-status` | JWT | admin, manager | Trạng thái token |
| `POST /his-integration/cleanup-expired-tokens` | JWT | admin | Dọn dẹp token |

## 📝 Validation Rules

### Login DTO
- `usernameOrEmail`: Bắt buộc, string, tối thiểu 1 ký tự
- `password`: Bắt buộc, string, tối thiểu 1 ký tự

### HIS Direct Login DTO
- `username`: Bắt buộc, string, tên đăng nhập HIS
- `password`: Bắt buộc, string, mật khẩu HIS

### HIS Token Validation DTO
- `token`: Bắt buộc, string, HIS token cần xác thực

### HIS API Call DTO
- `endpoint`: Bắt buộc, string, endpoint HIS API
- `method`: Tùy chọn, string, HTTP method (default: GET)
- `data`: Tùy chọn, object, dữ liệu gửi kèm
- `username`: Tùy chọn, string, username HIS (nếu không có sẽ dùng từ JWT)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "usernameOrEmail should not be empty, password should not be empty",
    "name": "AppError"
  }
}
```

**HIS Direct Login Bad Request:**
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "Username and password are required",
    "name": "AppError"
  }
}
```

**HIS Token Validation Bad Request:**
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "Token is required",
    "name": "AppError"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "status_code": 401,
  "error": {
    "code": "HTTP_401",
    "message": "Invalid credentials",
    "name": "AppError"
  }
}
```

**HIS Direct Login Unauthorized:**
```json
{
  "success": false,
  "status_code": 401,
  "error": {
    "code": "HTTP_401",
    "message": "HIS login failed: Invalid credentials",
    "name": "AppError"
  }
}
```

**HIS Token Validation Unauthorized:**
```json
{
  "success": false,
  "status_code": 401,
  "error": {
    "code": "HTTP_401",
    "message": "Token validation failed: Invalid HIS token",
    "name": "AppError"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "status_code": 403,
  "error": {
    "code": "HTTP_403",
    "message": "Insufficient permissions",
    "name": "AppError"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "status_code": 404,
  "error": {
    "code": "HTTP_404",
    "message": "User not found",
    "name": "AppError"
  }
}
```

## 🔧 Cấu hình JWT

### Environment Variables
```bash
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d
```

### Token Payload
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "username": "username",
  "role": "admin",
  "iat": 1640995200,
  "exp": 1641081600
}
```

## 🔄 Token Management

### JWT Token Lifecycle
1. **Login**: Tạo access token (24h) và refresh token (7d)
2. **API Calls**: Sử dụng access token trong header `Authorization: Bearer <token>`
3. **Token Expiry**: Khi access token hết hạn, sử dụng refresh token để tạo token mới
4. **Logout**: Vô hiệu hóa token (blacklist)

### HIS Token Lifecycle
1. **Login**: Đăng nhập HIS và lưu token + renew code
2. **Auto-renewal**: Tự động gia hạn khi token sắp hết hạn
3. **API Calls**: Sử dụng token code để gọi HIS APIs
4. **Logout**: Đăng xuất và xóa token

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Users API](./users-api.md)
- [Provinces API](./provinces-api.md)
- [Wards API](./wards-api.md)
- [Branches API](./branches-api.md)
