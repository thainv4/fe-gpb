# 🏥 Branches API Documentation

## 📋 Tổng quan
Module Branches quản lý thông tin các chi nhánh/cơ sở của bệnh viện, bao gồm thông tin địa chỉ, liên hệ, cấp bậc bệnh viện và mã BHYT.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-branch-id",
  "branchCode": "HN001",
  "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội",
  "shortName": "BM-HN",
  "provinceId": "uuid-province-id",
  "wardId": "uuid-ward-id", 
  "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
  "phoneNumber": "024-3869-3731",
  "hospitalLevel": "Hạng I",
  "representative": "Nguyễn Văn A",
  "bhytCode": "BHYT001",
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

### 1. Tạo chi nhánh mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/branches" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "branchCode": "HN001",
    "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội",
    "shortName": "BM-HN",
    "provinceId": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
    "wardId": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
    "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
    "phoneNumber": "024-3869-3731",
    "hospitalLevel": "Hạng I",
    "representative": "Nguyễn Văn A",
    "bhytCode": "BHYT001"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-branch-id",
    "branchCode": "HN001",
    "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội",
    "shortName": "BM-HN",
    "provinceId": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
    "wardId": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
    "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
    "phoneNumber": "024-3869-3731",
    "hospitalLevel": "Hạng I",
    "representative": "Nguyễn Văn A",
    "bhytCode": "BHYT001",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách chi nhánh
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/branches" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/branches?search=Bạch%20Mai&provinceId=uuid-province-id&hospitalLevel=Hạng%20I&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-branch-id",
        "branchCode": "HN001",
        "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội",
        "shortName": "BM-HN",
        "provinceId": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
        "wardId": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
        "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
        "phoneNumber": "024-3869-3731",
        "hospitalLevel": "Hạng I",
        "representative": "Nguyễn Văn A",
        "bhytCode": "BHYT001",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "province": {
          "id": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
          "provinceCode": "01",
          "provinceName": "Hà Nội",
          "shortName": "HN"
        },
        "ward": {
          "id": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
          "wardCode": "001",
          "wardName": "Phường Phương Mai",
          "shortName": "PM"
        }
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 3. Lấy chi nhánh theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/branches/uuid-branch-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-branch-id",
    "branchCode": "HN001",
    "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội",
    "shortName": "BM-HN",
    "provinceId": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
    "wardId": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
    "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
    "phoneNumber": "024-3869-3731",
    "hospitalLevel": "Hạng I",
    "representative": "Nguyễn Văn A",
    "bhytCode": "BHYT001",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "province": {
      "id": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
      "provinceCode": "01",
      "provinceName": "Hà Nội",
      "shortName": "HN"
    },
    "ward": {
      "id": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
      "wardCode": "001",
      "wardName": "Phường Phương Mai",
      "shortName": "PM"
    }
  }
}
```

### 4. Lấy chi nhánh theo tỉnh
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/provinces/uuid-province-id/branches?limit=10&offset=0" \
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
        "id": "uuid-branch-id",
        "branchCode": "HN001",
        "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội",
        "shortName": "BM-HN",
        "provinceId": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
        "wardId": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
        "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
        "phoneNumber": "024-3869-3731",
        "hospitalLevel": "Hạng I",
        "representative": "Nguyễn Văn A",
        "bhytCode": "BHYT001",
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

### 5. Cập nhật chi nhánh
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/branches/uuid-branch-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội (Cập nhật)",
    "phoneNumber": "024-3869-3732",
    "representative": "Nguyễn Văn B",
    "hospitalLevel": "Hạng Đặc biệt"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-branch-id",
    "branchCode": "HN001",
    "branchName": "Bệnh viện Bạch Mai - Cơ sở Hà Nội (Cập nhật)",
    "shortName": "BM-HN",
    "provinceId": "f1b42d3b-eccf-40f2-8305-4ee4cac61525",
    "wardId": "f1b42d3b-eccf-40f2-8305-4ee4cac61526",
    "address": "78 Giải Phóng, Phường Phương Mai, Quận Đống Đa",
    "phoneNumber": "024-3869-3732",
    "hospitalLevel": "Hạng Đặc biệt",
    "representative": "Nguyễn Văn B",
    "bhytCode": "BHYT001",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6. Xóa chi nhánh
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/branches/uuid-branch-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Branch deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã chi nhánh |
| `provinceId` | string | No | Lọc theo ID tỉnh |
| `wardId` | string | No | Lọc theo ID phường/xã |
| `hospitalLevel` | string | No | Lọc theo cấp bậc bệnh viện |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /branches` | admin, manager | Tạo chi nhánh mới |
| `GET /branches` | user, admin, manager | Xem danh sách chi nhánh |
| `GET /branches/:id` | user, admin, manager | Xem chi tiết chi nhánh |
| `GET /provinces/:id/branches` | user, admin, manager | Xem chi nhánh theo tỉnh |
| `PUT /branches/:id` | admin, manager | Cập nhật chi nhánh |
| `DELETE /branches/:id` | admin | Xóa chi nhánh |

## 📝 Validation Rules

- `branchCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `branchName`: Bắt buộc, tối đa 200 ký tự
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `provinceId`: Bắt buộc, phải tồn tại trong bảng provinces
- `wardId`: Bắt buộc, phải tồn tại trong bảng wards
- `address`: Bắt buộc, tối đa 500 ký tự
- `phoneNumber`: Tùy chọn, tối đa 20 ký tự
- `hospitalLevel`: Tùy chọn, tối đa 50 ký tự
- `representative`: Tùy chọn, tối đa 100 ký tự
- `bhytCode`: Tùy chọn, tối đa 20 ký tự

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "branchCode should not be empty, branchName should not be empty",
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
    "message": "Branch not found",
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
    "message": "Branch code already exists",
    "name": "AppError"
  }
}
```

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Provinces API](./provinces-api.md)
- [Wards API](./wards-api.md)
- [Authentication API](./auth-api.md)
