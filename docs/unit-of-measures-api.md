# 📏 Unit of Measures API Documentation

## 📋 Tổng quan
Module Unit of Measures quản lý thông tin các đơn vị tính trong hệ thống, hỗ trợ mapping với hệ thống HIS.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-unit-of-measure-id",
  "unitOfMeasureCode": "ML",
  "unitOfMeasureName": "Mililit",
  "description": "Đơn vị đo thể tích",
  "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter\"}",
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

### 1. Tạo đơn vị tính mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/unit-of-measures" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "unitOfMeasureCode": "ML",
    "unitOfMeasureName": "Mililit",
    "description": "Đơn vị đo thể tích",
    "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter\"}",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-unit-of-measure-id",
    "unitOfMeasureCode": "ML",
    "unitOfMeasureName": "Mililit",
    "description": "Đơn vị đo thể tích",
    "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter\"}",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách đơn vị tính
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/unit-of-measures" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/unit-of-measures?search=Mililit&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-unit-of-measure-id",
        "unitOfMeasureCode": "ML",
        "unitOfMeasureName": "Mililit",
        "description": "Đơn vị đo thể tích",
        "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter\"}",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "uuid-unit-of-measure-id-2",
        "unitOfMeasureCode": "MG",
        "unitOfMeasureName": "Miligam",
        "description": "Đơn vị đo khối lượng",
        "mapping": "{\"hisCode\": \"MG\", \"hisName\": \"Milligram\"}",
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

### 3. Lấy đơn vị tính theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/unit-of-measures/uuid-unit-of-measure-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-unit-of-measure-id",
    "unitOfMeasureCode": "ML",
    "unitOfMeasureName": "Mililit",
    "description": "Đơn vị đo thể tích",
    "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter\"}",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Cập nhật đơn vị tính
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/unit-of-measures/uuid-unit-of-measure-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "unitOfMeasureName": "Mililit (Cập nhật)",
    "description": "Đơn vị đo thể tích - Cập nhật",
    "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter Updated\"}",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-unit-of-measure-id",
    "unitOfMeasureCode": "ML",
    "unitOfMeasureName": "Mililit (Cập nhật)",
    "description": "Đơn vị đo thể tích - Cập nhật",
    "mapping": "{\"hisCode\": \"ML\", \"hisName\": \"Milliliter Updated\"}",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 5. Xóa đơn vị tính
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/unit-of-measures/uuid-unit-of-measure-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Unit of measure deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã đơn vị tính |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /unit-of-measures` | admin, manager | Tạo đơn vị tính mới |
| `GET /unit-of-measures` | user, admin, manager | Xem danh sách đơn vị tính |
| `GET /unit-of-measures/:id` | user, admin, manager | Xem chi tiết đơn vị tính |
| `PUT /unit-of-measures/:id` | admin, manager | Cập nhật đơn vị tính |
| `DELETE /unit-of-measures/:id` | admin | Xóa đơn vị tính |

## 📝 Validation Rules

- `unitOfMeasureCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `unitOfMeasureName`: Bắt buộc, tối đa 200 ký tự
- `description`: Tùy chọn, tối đa 500 ký tự
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
    "message": "unitOfMeasureCode should not be empty, unitOfMeasureName should not be empty",
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
    "message": "Unit of measure not found",
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
    "message": "Unit of measure code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Services API](./services-api.md)
- [Service Groups API](./service-groups-api.md)
- [Authentication API](./auth-api.md)
