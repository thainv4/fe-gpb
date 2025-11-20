# 🧪 Sample Types API Documentation

## 📋 Tổng quan
Module Sample Types quản lý thông tin các loại mẫu trong hệ thống xét nghiệm, hỗ trợ quy tắc sinh mã tự động.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-sample-type-id",
  "typeCode": "BLD",
  "typeName": "Mẫu máu",
  "shortName": "Máu",
  "codeGenerationRule": "{\"prefix\": \"BLD\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
  "description": "Mẫu máu để xét nghiệm",
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

### 1. Tạo loại mẫu mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/sample-types" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "typeCode": "BLD",
    "typeName": "Mẫu máu",
    "shortName": "Máu",
    "codeGenerationRule": "{\"prefix\": \"BLD\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
    "description": "Mẫu máu để xét nghiệm",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-sample-type-id",
    "typeCode": "BLD",
    "typeName": "Mẫu máu",
    "shortName": "Máu",
    "codeGenerationRule": "{\"prefix\": \"BLD\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
    "description": "Mẫu máu để xét nghiệm",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách loại mẫu
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/sample-types" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/sample-types?search=Máu&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-sample-type-id",
        "typeCode": "BLD",
        "typeName": "Mẫu máu",
        "shortName": "Máu",
        "codeGenerationRule": "{\"prefix\": \"BLD\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
        "description": "Mẫu máu để xét nghiệm",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid-sample-type-id-2",
        "typeCode": "URN",
        "typeName": "Mẫu nước tiểu",
        "shortName": "Nước tiểu",
        "codeGenerationRule": "{\"prefix\": \"URN\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
        "description": "Mẫu nước tiểu để xét nghiệm",
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

### 3. Lấy loại mẫu theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/sample-types/uuid-sample-type-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-sample-type-id",
    "typeCode": "BLD",
    "typeName": "Mẫu máu",
    "shortName": "Máu",
    "codeGenerationRule": "{\"prefix\": \"BLD\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
    "description": "Mẫu máu để xét nghiệm",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Sinh mã mẫu
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/sample-types/generate-code/BLD/1" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "typeCode": "BLD",
    "sequence": 1,
    "generatedCode": "BLD-0001",
    "rule": {
      "prefix": "BLD",
      "sequence": "0001",
      "format": "{PREFIX}-{SEQUENCE}"
    }
  }
}
```

### 5. Cập nhật loại mẫu
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/sample-types/uuid-sample-type-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "typeName": "Mẫu máu (Cập nhật)",
    "shortName": "Máu-UPD",
    "description": "Mẫu máu để xét nghiệm - Cập nhật",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-sample-type-id",
    "typeCode": "BLD",
    "typeName": "Mẫu máu (Cập nhật)",
    "shortName": "Máu-UPD",
    "codeGenerationRule": "{\"prefix\": \"BLD\", \"sequence\": \"0001\", \"format\": \"{PREFIX}-{SEQUENCE}\"}",
    "description": "Mẫu máu để xét nghiệm - Cập nhật",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6. Xóa loại mẫu
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/sample-types/uuid-sample-type-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Sample type deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã loại mẫu |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /sample-types` | admin, manager | Tạo loại mẫu mới |
| `GET /sample-types` | user, admin, manager | Xem danh sách loại mẫu |
| `GET /sample-types/:id` | user, admin, manager | Xem chi tiết loại mẫu |
| `GET /sample-types/generate-code/:typeCode/:sequence` | user, admin, manager | Sinh mã mẫu |
| `PUT /sample-types/:id` | admin, manager | Cập nhật loại mẫu |
| `DELETE /sample-types/:id` | admin | Xóa loại mẫu |

## 📝 Validation Rules

- `typeCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `typeName`: Bắt buộc, tối đa 200 ký tự
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `codeGenerationRule`: Tùy chọn, tối đa 500 ký tự, định dạng JSON
- `description`: Tùy chọn, tối đa 500 ký tự
- `isActive`: Tùy chọn, boolean (default: true)

## 🔧 Code Generation Rules

### Format JSON
```json
{
  "prefix": "BLD",
  "sequence": "0001",
  "format": "{PREFIX}-{SEQUENCE}"
}
```

### Supported Variables
- `{PREFIX}`: Tiền tố từ rule hoặc typeCode
- `{SEQUENCE}`: Số thứ tự được pad với số 0

### Examples
- **Format**: `{PREFIX}-{SEQUENCE}` → `BLD-0001`
- **Format**: `{PREFIX}{SEQUENCE}` → `BLD0001`
- **Format**: `SAMPLE-{PREFIX}-{SEQUENCE}` → `SAMPLE-BLD-0001`

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
    "message": "Sample type not found",
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
    "message": "Sample type code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Services API](./services-api.md)
- [Authentication API](./auth-api.md)
