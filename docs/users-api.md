# 👥 Users API Documentation

## 📋 Tổng quan
Module Users quản lý thông tin người dùng trong hệ thống, bao gồm thông tin cá nhân, phân quyền và tích hợp HIS.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-user-id",
  "username": "john_doe",
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "phoneNumber": "+84901234567",
  "dateOfBirth": "1990-01-15",
  "address": "123 Main St, Ho Chi Minh City",
  "role": "user",
  "isActiveFlag": 1,
  "lastLoginAt": "2024-01-15T10:30:00Z",
  "hisUsername": "vht2",
  "hisPassword": "t123456",
  "provinceId": "uuid-province-id",
  "wardId": "uuid-ward-id",
  "departmentId": "uuid-department-id",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "province": {
    "id": "uuid-province-id",
    "provinceCode": "01",
    "provinceName": "Hà Nội",
    "shortName": "HN"
  },
  "ward": {
    "id": "uuid-ward-id",
    "wardCode": "001",
    "wardName": "Phường Bến Nghé",
    "shortName": "BN"
  },
  "department": {
    "id": "uuid-department-id",
    "departmentCode": "DEPT001",
    "departmentName": "Khoa Nội",
    "shortName": "KN"
  }
}
```

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints & Curl Examples

### 1. Tạo người dùng mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "username": "john_doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "phoneNumber": "+84901234567",
    "dateOfBirth": "1990-01-15",
    "address": "123 Main St, Ho Chi Minh City",
    "role": "user",
    "isActive": true,
    "hisUsername": "vht2",
    "hisPassword": "t123456",
    "provinceId": "uuid-province-id",
    "wardId": "uuid-ward-id",
    "departmentId": "uuid-department-id"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-user-id",
    "username": "john_doe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+84901234567",
    "dateOfBirth": "1990-01-15",
    "address": "123 Main St, Ho Chi Minh City",
    "role": "user",
    "isActiveFlag": 1,
    "lastLoginAt": null,
    "hisUsername": "vht2",
    "hisPassword": "t123456",
    "provinceId": "uuid-province-id",
    "wardId": "uuid-ward-id",
    "departmentId": "uuid-department-id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách người dùng
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/users" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/users?search=John&role=user&isActive=true&provinceId=uuid-province-id&departmentId=uuid-department-id&limit=10&offset=0" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "users": [
      {
        "id": "uuid-user-id",
        "username": "john_doe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "phoneNumber": "+84901234567",
        "dateOfBirth": "1990-01-15",
        "address": "123 Main St, Ho Chi Minh City",
        "role": "user",
        "isActiveFlag": 1,
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "hisUsername": "vht2",
        "hisPassword": "t123456",
        "provinceId": "uuid-province-id",
        "wardId": "uuid-ward-id",
        "departmentId": "uuid-department-id",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "province": {
          "id": "uuid-province-id",
          "provinceCode": "01",
          "provinceName": "Hà Nội",
          "shortName": "HN"
        },
        "ward": {
          "id": "uuid-ward-id",
          "wardCode": "001",
          "wardName": "Phường Bến Nghé",
          "shortName": "BN"
        },
        "department": {
          "id": "uuid-department-id",
          "departmentCode": "DEPT001",
          "departmentName": "Khoa Nội",
          "shortName": "KN"
        }
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 3. Lấy người dùng theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/users/uuid-user-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-user-id"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo username, email, hoặc fullName |
| `role` | string | No | Lọc theo role (admin, user) |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `provinceId` | string | No | Lọc theo ID tỉnh |
| `wardId` | string | No | Lọc theo ID phường/xã |
| `departmentId` | string | No | Lọc theo ID khoa |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /users` | admin | Tạo người dùng mới |
| `GET /users` | user, admin, manager | Xem danh sách người dùng |
| `GET /users/:id` | user, admin, manager | Xem chi tiết người dùng |

## 📝 Validation Rules

### Create User DTO
- `username`: Bắt buộc, tối đa 50 ký tự, duy nhất
- `email`: Bắt buộc, tối đa 100 ký tự, duy nhất, định dạng email
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Bắt buộc, tối đa 100 ký tự
- `phoneNumber`: Tùy chọn, tối đa 20 ký tự
- `dateOfBirth`: Tùy chọn, định dạng date
- `address`: Tùy chọn, text
- `role`: Tùy chọn, enum ['admin', 'user'] (default: 'user')
- `isActive`: Tùy chọn, boolean (default: true)
- `hisUsername`: Tùy chọn, tối đa 50 ký tự
- `hisPassword`: Tùy chọn, tối đa 100 ký tự
- `provinceId`: Tùy chọn, UUID, phải tồn tại trong bảng provinces
- `wardId`: Tùy chọn, UUID, phải tồn tại trong bảng wards
- `departmentId`: Tùy chọn, UUID, phải tồn tại trong bảng departments

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "username should not be empty, email should not be empty, password should not be empty, fullName should not be empty",
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
    "message": "Access token is invalid or expired",
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

### 409 Conflict
```json
{
  "success": false,
  "status_code": 409,
  "error": {
    "code": "HTTP_409",
    "message": "Username already exists",
    "name": "AppError"
  }
}
```

## 🏥 HIS Integration

### HIS Credentials
Người dùng có thể được cấu hình thông tin đăng nhập HIS:
- `hisUsername`: Tên đăng nhập HIS
- `hisPassword`: Mật khẩu HIS

### Sử dụng HIS Credentials
Khi người dùng có thông tin HIS, hệ thống sẽ tự động sử dụng để:
- Đăng nhập HIS khi cần thiết
- Gọi các API HIS
- Quản lý token HIS

## 🔗 Relationships

### Province Relationship
- `provinceId`: Liên kết với bảng `BMM_PROVINCES`
- `province`: Thông tin chi tiết tỉnh/thành phố

### Ward Relationship
- `wardId`: Liên kết với bảng `BMM_WARDS`
- `ward`: Thông tin chi tiết phường/xã

### Department Relationship
- `departmentId`: Liên kết với bảng `BMM_DEPARTMENTS`
- `department`: Thông tin chi tiết khoa

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Authentication API](./auth-api.md)
- [Provinces API](./provinces-api.md)
- [Wards API](./wards-api.md)
- [Departments API](./departments-api.md)
- [HIS Integration API](./auth-api.md#his-integration-endpoints)
