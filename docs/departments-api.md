# 🏥 Departments API Documentation

## 📋 Tổng quan
Module Departments quản lý thông tin các khoa trong hệ thống bệnh viện, hỗ trợ cấu trúc phân cấp (parent-child) và liên kết với chi nhánh.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-department-id",
  "departmentCode": "MED001",
  "departmentName": "Khoa Tim Mạch",
  "branchId": "uuid-branch-id",
  "headOfDepartment": "BS. Nguyễn Văn A",
  "headNurse": "ĐD. Trần Thị B",
  "parentDepartmentId": "uuid-parent-department-id",
  "shortName": "TM",
  "departmentTypeId": "uuid-department-type-id",
  "isActiveFlag": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "branch": {
    "id": "uuid-branch-id",
    "branchCode": "BR001",
    "branchName": "Bệnh viện Chợ Rẫy",
    "shortName": "CR"
  },
  "departmentType": {
    "id": "uuid-department-type-id",
    "typeCode": "MED",
    "typeName": "Khoa Nội"
  },
  "parentDepartment": {
    "id": "uuid-parent-department-id",
    "departmentCode": "MED000",
    "departmentName": "Khoa Nội Tổng Hợp"
  },
  "subDepartments": [
    {
      "id": "uuid-sub-department-id",
      "departmentCode": "MED002",
      "departmentName": "Khoa Tim Mạch Can Thiệp"
    }
  ]
}
```

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints & Curl Examples

### 1. Tạo khoa mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/departments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "departmentCode": "MED001",
    "departmentName": "Khoa Tim Mạch",
    "branchId": "uuid-branch-id",
    "headOfDepartment": "BS. Nguyễn Văn A",
    "headNurse": "ĐD. Trần Thị B",
    "parentDepartmentId": "uuid-parent-department-id",
    "shortName": "TM",
    "departmentTypeId": "uuid-department-type-id",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-department-id",
    "departmentCode": "MED001",
    "departmentName": "Khoa Tim Mạch",
    "branchId": "uuid-branch-id",
    "headOfDepartment": "BS. Nguyễn Văn A",
    "headNurse": "ĐD. Trần Thị B",
    "parentDepartmentId": "uuid-parent-department-id",
    "shortName": "TM",
    "departmentTypeId": "uuid-department-type-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách khoa
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/departments" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/departments?search=Tim%20Mạch&branchId=uuid-branch-id&departmentTypeId=uuid-department-type-id&parentOnly=true&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-department-id",
        "departmentCode": "MED001",
        "departmentName": "Khoa Tim Mạch",
        "branchId": "uuid-branch-id",
        "headOfDepartment": "BS. Nguyễn Văn A",
        "headNurse": "ĐD. Trần Thị B",
        "parentDepartmentId": "uuid-parent-department-id",
        "shortName": "TM",
        "departmentTypeId": "uuid-department-type-id",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "branch": {
          "id": "uuid-branch-id",
          "branchCode": "BR001",
          "branchName": "Bệnh viện Chợ Rẫy",
          "shortName": "CR"
        },
        "departmentType": {
          "id": "uuid-department-type-id",
          "typeCode": "MED",
          "typeName": "Khoa Nội"
        }
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 3. Lấy khoa theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/departments/uuid-department-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-department-id",
    "departmentCode": "MED001",
    "departmentName": "Khoa Tim Mạch",
    "branchId": "uuid-branch-id",
    "headOfDepartment": "BS. Nguyễn Văn A",
    "headNurse": "ĐD. Trần Thị B",
    "parentDepartmentId": "uuid-parent-department-id",
    "shortName": "TM",
    "departmentTypeId": "uuid-department-type-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "branch": {
      "id": "uuid-branch-id",
      "branchCode": "BR001",
      "branchName": "Bệnh viện Chợ Rẫy",
      "shortName": "CR"
    },
    "departmentType": {
      "id": "uuid-department-type-id",
      "typeCode": "MED",
      "typeName": "Khoa Nội"
    },
    "parentDepartment": {
      "id": "uuid-parent-department-id",
      "departmentCode": "MED000",
      "departmentName": "Khoa Nội Tổng Hợp"
    },
    "subDepartments": [
      {
        "id": "uuid-sub-department-id",
        "departmentCode": "MED002",
        "departmentName": "Khoa Tim Mạch Can Thiệp"
      }
    ]
  }
}
```

### 4. Lấy khoa theo chi nhánh
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/branches/uuid-branch-id/departments?limit=10&offset=0" \
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
        "id": "uuid-department-id",
        "departmentCode": "MED001",
        "departmentName": "Khoa Tim Mạch",
        "branchId": "uuid-branch-id",
        "headOfDepartment": "BS. Nguyễn Văn A",
        "headNurse": "ĐD. Trần Thị B",
        "parentDepartmentId": "uuid-parent-department-id",
        "shortName": "TM",
        "departmentTypeId": "uuid-department-type-id",
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

### 5. Cập nhật khoa
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/departments/uuid-department-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "departmentName": "Khoa Tim Mạch (Cập nhật)",
    "headOfDepartment": "BS. Nguyễn Văn B",
    "headNurse": "ĐD. Trần Thị C",
    "shortName": "TM-UPD",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-department-id",
    "departmentCode": "MED001",
    "departmentName": "Khoa Tim Mạch (Cập nhật)",
    "branchId": "uuid-branch-id",
    "headOfDepartment": "BS. Nguyễn Văn B",
    "headNurse": "ĐD. Trần Thị C",
    "parentDepartmentId": "uuid-parent-department-id",
    "shortName": "TM-UPD",
    "departmentTypeId": "uuid-department-type-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 6. Xóa khoa
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/departments/uuid-department-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Department deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã khoa |
| `branchId` | string | No | Lọc theo ID chi nhánh |
| `departmentTypeId` | string | No | Lọc theo ID loại khoa |
| `parentDepartmentId` | string | No | Lọc theo ID khoa cha |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `parentOnly` | boolean | No | Chỉ hiển thị khoa cha |
| `subOnly` | boolean | No | Chỉ hiển thị khoa con |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /departments` | admin, manager | Tạo khoa mới |
| `GET /departments` | user, admin, manager | Xem danh sách khoa |
| `GET /departments/:id` | user, admin, manager | Xem chi tiết khoa |
| `GET /branches/:branchId/departments` | user, admin, manager | Xem khoa theo chi nhánh |
| `PUT /departments/:id` | admin, manager | Cập nhật khoa |
| `DELETE /departments/:id` | admin | Xóa khoa |

## 📝 Validation Rules

- `departmentCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `departmentName`: Bắt buộc, tối đa 200 ký tự
- `branchId`: Bắt buộc, UUID, phải tồn tại trong bảng branches
- `headOfDepartment`: Tùy chọn, tối đa 100 ký tự
- `headNurse`: Tùy chọn, tối đa 100 ký tự
- `parentDepartmentId`: Tùy chọn, UUID, phải tồn tại trong bảng departments
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `departmentTypeId`: Bắt buộc, UUID, phải tồn tại trong bảng department_types
- `isActive`: Tùy chọn, boolean (default: true)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "departmentCode should not be empty, departmentName should not be empty, branchId should not be empty, departmentTypeId should not be empty",
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
    "message": "Department not found",
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
    "message": "Department code already exists",
    "name": "AppError"
  }
}
```

## 🔗 Relationships

### Branch Relationship
- `branchId`: Liên kết với bảng `BMM_BRANCHES`
- `branch`: Thông tin chi tiết chi nhánh

### Department Type Relationship
- `departmentTypeId`: Liên kết với bảng `BMM_DEPARTMENT_TYPES`
- `departmentType`: Thông tin chi tiết loại khoa

### Parent-Child Relationship
- `parentDepartmentId`: Liên kết với bảng `BMM_DEPARTMENTS` (self-reference)
- `parentDepartment`: Thông tin khoa cha
- `subDepartments`: Danh sách khoa con

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Department Types API](./department-types-api.md)
- [Branches API](./branches-api.md)
- [Users API](./users-api.md)
- [Rooms API](./rooms-api.md)
- [Authentication API](./auth-api.md)
