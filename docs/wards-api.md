# 🏘️ Wards API Documentation

## 📋 Tổng quan
Module Wards quản lý thông tin các phường/xã/thị trấn trong hệ thống, có mối quan hệ với Provinces.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-ward-id",
  "wardCode": "001",
  "wardName": "Phường Bến Nghé",
  "shortName": "BN",
  "provinceId": "uuid-province-id",
  "isActiveFlag": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "province": {
    "id": "uuid-province-id",
    "provinceCode": "01",
    "provinceName": "Hà Nội",
    "shortName": "HN"
  }
}
```

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints & Curl Examples

### 1. Lấy danh sách phường/xã
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/wards" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/wards?search=Bến%20Nghé&provinceId=uuid-province-id&isActive=true&limit=10&offset=0" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "wards": [
      {
        "id": "uuid-ward-id",
        "wardCode": "001",
        "wardName": "Phường Bến Nghé",
        "shortName": "BN",
        "provinceId": "uuid-province-id",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "province": {
          "id": "uuid-province-id",
          "provinceCode": "01",
          "provinceName": "Hà Nội",
          "shortName": "HN"
        }
      },
      {
        "id": "uuid-ward-id-2",
        "wardCode": "002",
        "wardName": "Phường Đa Kao",
        "shortName": "DK",
        "provinceId": "uuid-province-id",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "province": {
          "id": "uuid-province-id",
          "provinceCode": "01",
          "provinceName": "Hà Nội",
          "shortName": "HN"
        }
      }
    ],
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

### 2. Lấy phường/xã theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/wards/uuid-ward-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-ward-id",
    "wardCode": "001",
    "wardName": "Phường Bến Nghé",
    "shortName": "BN",
    "provinceId": "uuid-province-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "province": {
      "id": "uuid-province-id",
      "provinceCode": "01",
      "provinceName": "Hà Nội",
      "shortName": "HN"
    }
  }
}
```

### 3. Lấy phường/xã theo tỉnh
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/wards/province/uuid-province-id?limit=10&offset=0" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "wards": [
      {
        "id": "uuid-ward-id",
        "wardCode": "001",
        "wardName": "Phường Bến Nghé",
        "shortName": "BN",
        "provinceId": "uuid-province-id",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid-ward-id-2",
        "wardCode": "002",
        "wardName": "Phường Đa Kao",
        "shortName": "DK",
        "provinceId": "uuid-province-id",
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

### 4. Tạo phường/xã mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/wards" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "wardCode": "003",
    "wardName": "Phường Nguyễn Thái Bình",
    "shortName": "NTB",
    "provinceId": "uuid-province-id",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-ward-id-3",
    "wardCode": "003",
    "wardName": "Phường Nguyễn Thái Bình",
    "shortName": "NTB",
    "provinceId": "uuid-province-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 5. Cập nhật phường/xã
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/wards/uuid-ward-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "wardName": "Phường Bến Nghé (Cập nhật)",
    "shortName": "BN-UPD",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-ward-id",
    "wardCode": "001",
    "wardName": "Phường Bến Nghé (Cập nhật)",
    "shortName": "BN-UPD",
    "provinceId": "uuid-province-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6. Xóa phường/xã
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/wards/uuid-ward-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Ward deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã phường/xã |
| `provinceId` | string | No | Lọc theo ID tỉnh |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `GET /wards` | user, admin, manager | Xem danh sách phường/xã |
| `GET /wards/:id` | user, admin, manager | Xem chi tiết phường/xã |
| `GET /wards/province/:provinceId` | user, admin, manager | Xem phường/xã theo tỉnh |
| `POST /wards` | - | Tạo phường/xã mới (không yêu cầu role) |
| `PUT /wards/:id` | admin | Cập nhật phường/xã |
| `DELETE /wards/:id` | admin | Xóa phường/xã |

## 📝 Validation Rules

- `wardCode`: Bắt buộc, tối đa 10 ký tự, duy nhất
- `wardName`: Bắt buộc, tối đa 100 ký tự
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `provinceId`: Bắt buộc, phải tồn tại trong bảng provinces
- `isActive`: Tùy chọn, boolean (default: true)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "wardCode should not be empty, wardName should not be empty, provinceId should not be empty",
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
    "message": "Ward not found",
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
    "message": "Ward code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Provinces API](./provinces-api.md)
- [Branches API](./branches-api.md)
- [Authentication API](./auth-api.md)
