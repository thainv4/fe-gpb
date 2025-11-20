# 🏥 Department Types API Documentation

## 📋 Tổng quan
Module Department Types quản lý thông tin các loại khoa trong hệ thống bệnh viện.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-department-type-id",
  "typeCode": "MED",
  "typeName": "Khoa Nội",
  "description": "Khoa điều trị nội khoa",
  "isActiveFlag": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints & Curl Examples

### 1. Tạo loại khoa mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/department-types" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "typeCode": "MED",
    "typeName": "Khoa Nội",
    "description": "Khoa điều trị nội khoa",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-department-type-id",
    "typeCode": "MED",
    "typeName": "Khoa Nội",
    "description": "Khoa điều trị nội khoa",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách loại khoa
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/department-types" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/department-types?search=Nội&isActive=true&limit=10&offset=0" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "items": [
      {
        "id": "uuid-department-type-id",
        "typeCode": "MED",
        "typeName": "Khoa Nội",
        "description": "Khoa điều trị nội khoa",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid-department-type-id-2",
        "typeCode": "SUR",
        "typeName": "Khoa Ngoại",
        "description": "Khoa điều trị ngoại khoa",
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

### 3. Lấy loại khoa theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/department-types/uuid-department-type-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-department-type-id",
    "typeCode": "MED",
    "typeName": "Khoa Nội",
    "description": "Khoa điều trị nội khoa",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Cập nhật loại khoa
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/department-types/uuid-department-type-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "typeName": "Khoa Nội (Cập nhật)",
    "description": "Khoa điều trị nội khoa - Cập nhật",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-department-type-id",
    "typeCode": "MED",
    "typeName": "Khoa Nội (Cập nhật)",
    "description": "Khoa điều trị nội khoa - Cập nhật",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 5. Xóa loại khoa
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/department-types/uuid-department-type-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Department type deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã loại khoa |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /department-types` | admin, manager | Tạo loại khoa mới |
| `GET /department-types` | user, admin, manager | Xem danh sách loại khoa |
| `GET /department-types/:id` | user, admin, manager | Xem chi tiết loại khoa |
| `PUT /department-types/:id` | admin, manager | Cập nhật loại khoa |
| `DELETE /department-types/:id` | admin | Xóa loại khoa |

## 📝 Validation Rules

- `typeCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `typeName`: Bắt buộc, tối đa 200 ký tự
- `description`: Tùy chọn, tối đa 500 ký tự
- `isActive`: Tùy chọn, boolean (default: true)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "typeCode should not be empty, typeName should not be empty",
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
    "message": "Department type not found",
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
    "message": "Department type code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Departments API](./departments-api.md)
- [Users API](./users-api.md)
- [Authentication API](./auth-api.md)
