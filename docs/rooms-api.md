# 🏠 Rooms API Documentation

## 📋 Tổng quan
Module Rooms quản lý thông tin các phòng trong hệ thống bệnh viện, liên kết với khoa.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-room-id",
  "roomCode": "R001",
  "roomName": "Phòng Khám Tim Mạch 1",
  "roomAddress": "Tầng 2, Khu A, Khoa Tim Mạch",
  "departmentId": "uuid-department-id",
  "description": "Phòng khám chuyên khoa tim mạch",
  "isActiveFlag": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "department": {
    "id": "uuid-department-id",
    "departmentCode": "MED001",
    "departmentName": "Khoa Tim Mạch",
    "shortName": "TM"
  }
}
```

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints & Curl Examples

### 1. Tạo phòng mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "roomCode": "R001",
    "roomName": "Phòng Khám Tim Mạch 1",
    "roomAddress": "Tầng 2, Khu A, Khoa Tim Mạch",
    "departmentId": "uuid-department-id",
    "description": "Phòng khám chuyên khoa tim mạch",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-room-id",
    "roomCode": "R001",
    "roomName": "Phòng Khám Tim Mạch 1",
    "roomAddress": "Tầng 2, Khu A, Khoa Tim Mạch",
    "departmentId": "uuid-department-id",
    "description": "Phòng khám chuyên khoa tim mạch",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách phòng
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/rooms" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/rooms?search=Tim%20Mạch&departmentId=uuid-department-id&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-room-id",
        "roomCode": "R001",
        "roomName": "Phòng Khám Tim Mạch 1",
        "roomAddress": "Tầng 2, Khu A, Khoa Tim Mạch",
        "departmentId": "uuid-department-id",
        "description": "Phòng khám chuyên khoa tim mạch",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "department": {
          "id": "uuid-department-id",
          "departmentCode": "MED001",
          "departmentName": "Khoa Tim Mạch",
          "shortName": "TM"
        }
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 3. Lấy phòng theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/rooms/uuid-room-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-room-id",
    "roomCode": "R001",
    "roomName": "Phòng Khám Tim Mạch 1",
    "roomAddress": "Tầng 2, Khu A, Khoa Tim Mạch",
    "departmentId": "uuid-department-id",
    "description": "Phòng khám chuyên khoa tim mạch",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "department": {
      "id": "uuid-department-id",
      "departmentCode": "MED001",
      "departmentName": "Khoa Tim Mạch",
      "shortName": "TM"
    }
  }
}
```

### 4. Lấy phòng theo khoa
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/rooms/department/uuid-department-id?limit=10&offset=0" \
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
        "id": "uuid-room-id",
        "roomCode": "R001",
        "roomName": "Phòng Khám Tim Mạch 1",
        "roomAddress": "Tầng 2, Khu A, Khoa Tim Mạch",
        "departmentId": "uuid-department-id",
        "description": "Phòng khám chuyên khoa tim mạch",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 5. Cập nhật phòng
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/rooms/uuid-room-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "roomName": "Phòng Khám Tim Mạch 1 (Cập nhật)",
    "roomAddress": "Tầng 3, Khu B, Khoa Tim Mạch",
    "description": "Phòng khám chuyên khoa tim mạch - Cập nhật",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-room-id",
    "roomCode": "R001",
    "roomName": "Phòng Khám Tim Mạch 1 (Cập nhật)",
    "roomAddress": "Tầng 3, Khu B, Khoa Tim Mạch",
    "departmentId": "uuid-department-id",
    "description": "Phòng khám chuyên khoa tim mạch - Cập nhật",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6. Xóa phòng
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/rooms/uuid-room-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Room deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã phòng |
| `departmentId` | string | No | Lọc theo ID khoa |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /rooms` | admin, manager | Tạo phòng mới |
| `GET /rooms` | user, admin, manager | Xem danh sách phòng |
| `GET /rooms/:id` | user, admin, manager | Xem chi tiết phòng |
| `GET /rooms/department/:departmentId` | user, admin, manager | Xem phòng theo khoa |
| `PUT /rooms/:id` | admin, manager | Cập nhật phòng |
| `DELETE /rooms/:id` | admin | Xóa phòng |

## 📝 Validation Rules

- `roomCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `roomName`: Bắt buộc, tối đa 200 ký tự
- `roomAddress`: Bắt buộc, tối đa 500 ký tự
- `departmentId`: Bắt buộc, UUID, phải tồn tại trong bảng departments
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
    "message": "roomCode should not be empty, roomName should not be empty, roomAddress should not be empty, departmentId should not be empty",
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
    "message": "Room not found",
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
    "message": "Room code already exists",
    "name": "AppError"
  }
}
```

## 🔗 Relationships

### Department Relationship
- `departmentId`: Liên kết với bảng `BMM_DEPARTMENTS`
- `department`: Thông tin chi tiết khoa

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Departments API](./departments-api.md)
- [Users API](./users-api.md)
- [Authentication API](./auth-api.md)
