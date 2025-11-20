# 🏥 Service Groups API Documentation

## 📋 Tổng quan
Module Service Groups quản lý thông tin các nhóm dịch vụ trong hệ thống bệnh viện, hỗ trợ mapping với hệ thống HIS.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-service-group-id",
  "serviceGroupCode": "LAB",
  "serviceGroupName": "Xét nghiệm",
  "shortName": "XN",
  "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory\"}",
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

### 1. Tạo nhóm dịch vụ mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/service-groups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "serviceGroupCode": "LAB",
    "serviceGroupName": "Xét nghiệm",
    "shortName": "XN",
    "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory\"}",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-service-group-id",
    "serviceGroupCode": "LAB",
    "serviceGroupName": "Xét nghiệm",
    "shortName": "XN",
    "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory\"}",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách nhóm dịch vụ
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/service-groups" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/service-groups?search=Xét%20nghiệm&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-service-group-id",
        "serviceGroupCode": "LAB",
        "serviceGroupName": "Xét nghiệm",
        "shortName": "XN",
        "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory\"}",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid-service-group-id-2",
        "serviceGroupCode": "IMG",
        "serviceGroupName": "Chẩn đoán hình ảnh",
        "shortName": "CDHA",
        "mapping": "{\"hisCode\": \"IMG\", \"hisName\": \"Imaging\"}",
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

### 3. Lấy nhóm dịch vụ theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/service-groups/uuid-service-group-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-service-group-id",
    "serviceGroupCode": "LAB",
    "serviceGroupName": "Xét nghiệm",
    "shortName": "XN",
    "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory\"}",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Cập nhật nhóm dịch vụ
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/service-groups/uuid-service-group-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "serviceGroupName": "Xét nghiệm (Cập nhật)",
    "shortName": "XN-UPD",
    "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory Updated\"}",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-service-group-id",
    "serviceGroupCode": "LAB",
    "serviceGroupName": "Xét nghiệm (Cập nhật)",
    "shortName": "XN-UPD",
    "mapping": "{\"hisCode\": \"LAB\", \"hisName\": \"Laboratory Updated\"}",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 5. Xóa nhóm dịch vụ
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/service-groups/uuid-service-group-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Service group deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã nhóm dịch vụ |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /service-groups` | admin, manager | Tạo nhóm dịch vụ mới |
| `GET /service-groups` | user, admin, manager | Xem danh sách nhóm dịch vụ |
| `GET /service-groups/:id` | user, admin, manager | Xem chi tiết nhóm dịch vụ |
| `PUT /service-groups/:id` | admin, manager | Cập nhật nhóm dịch vụ |
| `DELETE /service-groups/:id` | admin | Xóa nhóm dịch vụ |

## 📝 Validation Rules

- `serviceGroupCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `serviceGroupName`: Bắt buộc, tối đa 200 ký tự
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `mapping`: Tùy chọn, tối đa 1000 ký tự, định dạng JSON
- `isActive`: Tùy chọn, boolean (default: true)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "serviceGroupCode should not be empty, serviceGroupName should not be empty",
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
    "message": "Service group not found",
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
    "message": "Service group code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Services API](./services-api.md)
- [Unit of Measures API](./unit-of-measures-api.md)
- [Authentication API](./auth-api.md)
