# 🏛️ Provinces API Documentation

## 📋 Tổng quan
Module Provinces quản lý thông tin các tỉnh/thành phố trong hệ thống, hỗ trợ cả JWT và HIS token authentication.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-province-id",
  "provinceCode": "01",
  "provinceName": "Hà Nội",
  "shortName": "HN",
  "isActiveFlag": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🔐 Authentication
- **GET endpoints**: Hỗ trợ cả JWT token và HIS token
- **POST/PUT/DELETE endpoints**: Chỉ hỗ trợ JWT token với role admin

### JWT Token
```bash
Authorization: Bearer <your-jwt-token>
```

### HIS Token
```bash
Authorization: Bearer <your-his-token>
```

## 📡 API Endpoints & Curl Examples

### 1. Lấy danh sách tỉnh/thành phố
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/provinces" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với HIS token:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/provinces" \
  -H "Authorization: Bearer <your-his-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/provinces?search=Hà%20Nội&isActive=true&limit=10&offset=0" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "provinces": [
      {
        "id": "uuid-province-id",
        "provinceCode": "01",
        "provinceName": "Hà Nội",
        "shortName": "HN",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid-province-id-2",
        "provinceCode": "02",
        "provinceName": "Hồ Chí Minh",
        "shortName": "HCM",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

### 2. Lấy tỉnh/thành phố theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/provinces/uuid-province-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-province-id",
    "provinceCode": "01",
    "provinceName": "Hà Nội",
    "shortName": "HN",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Tạo tỉnh/thành phố mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/provinces" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "provinceCode": "03",
    "provinceName": "Đà Nẵng",
    "shortName": "DN",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-province-id-3",
    "provinceCode": "03",
    "provinceName": "Đà Nẵng",
    "shortName": "DN",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Cập nhật tỉnh/thành phố
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/provinces/uuid-province-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "provinceName": "Hà Nội (Cập nhật)",
    "shortName": "HN-UPD",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-province-id",
    "provinceCode": "01",
    "provinceName": "Hà Nội (Cập nhật)",
    "shortName": "HN-UPD",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 5. Xóa tỉnh/thành phố
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/provinces/uuid-province-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Province deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã tỉnh |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Authentication | Role Required | Description |
|----------|----------------|---------------|-------------|
| `GET /provinces` | JWT hoặc HIS | - | Xem danh sách tỉnh |
| `GET /provinces/:id` | JWT hoặc HIS | - | Xem chi tiết tỉnh |
| `POST /provinces` | JWT | admin | Tạo tỉnh mới |
| `PUT /provinces/:id` | JWT | admin | Cập nhật tỉnh |
| `DELETE /provinces/:id` | JWT | admin | Xóa tỉnh |

## 📝 Validation Rules

- `provinceCode`: Bắt buộc, tối đa 10 ký tự, duy nhất
- `provinceName`: Bắt buộc, tối đa 100 ký tự
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `isActive`: Tùy chọn, boolean (default: true)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "provinceCode should not be empty, provinceName should not be empty",
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
    "message": "Province not found",
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
    "message": "Province code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Wards API](./wards-api.md)
- [Branches API](./branches-api.md)
- [Authentication API](./auth-api.md)
