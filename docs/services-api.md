# 🏥 Services API Documentation

## 📋 Tổng quan
Module Services quản lý thông tin các dịch vụ trong hệ thống bệnh viện, hỗ trợ cấu trúc phân cấp (parent-child), quản lý giá và tích hợp HIS.

## 🏗️ Cấu trúc dữ liệu
```json
{
  "id": "uuid-service-id",
  "serviceCode": "LAB001",
  "serviceName": "Xét nghiệm máu tổng quát",
  "shortName": "XNMTQ",
  "serviceGroupId": "uuid-service-group-id",
  "unitOfMeasureId": "uuid-unit-of-measure-id",
  "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
  "numOrder": 1,
  "currentPrice": 150000,
  "parentServiceId": "uuid-parent-service-id",
  "isActiveFlag": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "serviceGroup": {
    "id": "uuid-service-group-id",
    "serviceGroupCode": "LAB",
    "serviceGroupName": "Xét nghiệm",
    "shortName": "XN"
  },
  "unitOfMeasure": {
    "id": "uuid-unit-of-measure-id",
    "unitOfMeasureCode": "ML",
    "unitOfMeasureName": "Mililit"
  },
  "parentService": {
    "id": "uuid-parent-service-id",
    "serviceCode": "LAB000",
    "serviceName": "Xét nghiệm cơ bản"
  },
  "subServices": [
    {
      "id": "uuid-sub-service-id",
      "serviceCode": "LAB002",
      "serviceName": "Xét nghiệm máu chi tiết"
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

### 1. Tạo dịch vụ mới
```bash
curl -X POST "http://192.168.68.209:3333/api/v1/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "serviceCode": "LAB001",
    "serviceName": "Xét nghiệm máu tổng quát",
    "shortName": "XNMTQ",
    "serviceGroupId": "uuid-service-group-id",
    "unitOfMeasureId": "uuid-unit-of-measure-id",
    "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
    "numOrder": 1,
    "currentPrice": 150000,
    "parentServiceId": "uuid-parent-service-id",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "uuid-service-id",
    "serviceCode": "LAB001",
    "serviceName": "Xét nghiệm máu tổng quát",
    "shortName": "XNMTQ",
    "serviceGroupId": "uuid-service-group-id",
    "unitOfMeasureId": "uuid-unit-of-measure-id",
    "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
    "numOrder": 1,
    "currentPrice": 150000,
    "parentServiceId": "uuid-parent-service-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Lấy danh sách dịch vụ
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Với filters:**
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services?search=Xét%20nghiệm&serviceGroupId=uuid-service-group-id&parentServiceId=uuid-parent-service-id&isActive=true&limit=10&offset=0" \
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
        "id": "uuid-service-id",
        "serviceCode": "LAB001",
        "serviceName": "Xét nghiệm máu tổng quát",
        "shortName": "XNMTQ",
        "serviceGroupId": "uuid-service-group-id",
        "unitOfMeasureId": "uuid-unit-of-measure-id",
        "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
        "numOrder": 1,
        "currentPrice": 150000,
        "parentServiceId": "uuid-parent-service-id",
        "isActiveFlag": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "serviceGroup": {
          "id": "uuid-service-group-id",
          "serviceGroupCode": "LAB",
          "serviceGroupName": "Xét nghiệm",
          "shortName": "XN"
        },
        "unitOfMeasure": {
          "id": "uuid-unit-of-measure-id",
          "unitOfMeasureCode": "ML",
          "unitOfMeasureName": "Mililit"
        }
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 3. Lấy dịch vụ theo ID
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services/uuid-service-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-service-id",
    "serviceCode": "LAB001",
    "serviceName": "Xét nghiệm máu tổng quát",
    "shortName": "XNMTQ",
    "serviceGroupId": "uuid-service-group-id",
    "unitOfMeasureId": "uuid-unit-of-measure-id",
    "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
    "numOrder": 1,
    "currentPrice": 150000,
    "parentServiceId": "uuid-parent-service-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "serviceGroup": {
      "id": "uuid-service-group-id",
      "serviceGroupCode": "LAB",
      "serviceGroupName": "Xét nghiệm",
      "shortName": "XN"
    },
    "unitOfMeasure": {
      "id": "uuid-unit-of-measure-id",
      "unitOfMeasureCode": "ML",
      "unitOfMeasureName": "Mililit"
    },
    "parentService": {
      "id": "uuid-parent-service-id",
      "serviceCode": "LAB000",
      "serviceName": "Xét nghiệm cơ bản"
    },
    "subServices": [
      {
        "id": "uuid-sub-service-id",
        "serviceCode": "LAB002",
        "serviceName": "Xét nghiệm máu chi tiết"
      }
    ]
  }
}
```

### 4. Lấy dịch vụ theo nhóm
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services/group/uuid-service-group-id?limit=10&offset=0" \
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
        "id": "uuid-service-id",
        "serviceCode": "LAB001",
        "serviceName": "Xét nghiệm máu tổng quát",
        "shortName": "XNMTQ",
        "serviceGroupId": "uuid-service-group-id",
        "unitOfMeasureId": "uuid-unit-of-measure-id",
        "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
        "numOrder": 1,
        "currentPrice": 150000,
        "parentServiceId": "uuid-parent-service-id",
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

### 5. Lấy dịch vụ theo dịch vụ cha
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services/parent/uuid-parent-service-id?limit=10&offset=0" \
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
        "id": "uuid-service-id",
        "serviceCode": "LAB001",
        "serviceName": "Xét nghiệm máu tổng quát",
        "shortName": "XNMTQ",
        "serviceGroupId": "uuid-service-group-id",
        "unitOfMeasureId": "uuid-unit-of-measure-id",
        "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
        "numOrder": 1,
        "currentPrice": 150000,
        "parentServiceId": "uuid-parent-service-id",
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

### 6. Lấy cấu trúc phân cấp dịch vụ
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services/hierarchy?serviceGroupId=uuid-service-group-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "hierarchy": [
      {
        "id": "uuid-parent-service-id",
        "serviceCode": "LAB000",
        "serviceName": "Xét nghiệm cơ bản",
        "level": 0,
        "children": [
          {
            "id": "uuid-service-id",
            "serviceCode": "LAB001",
            "serviceName": "Xét nghiệm máu tổng quát",
            "level": 1,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 7. Cập nhật dịch vụ
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/services/uuid-service-id" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "serviceName": "Xét nghiệm máu tổng quát (Cập nhật)",
    "shortName": "XNMTQ-UPD",
    "numOrder": 2,
    "currentPrice": 160000,
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-service-id",
    "serviceCode": "LAB001",
    "serviceName": "Xét nghiệm máu tổng quát (Cập nhật)",
    "shortName": "XNMTQ-UPD",
    "serviceGroupId": "uuid-service-group-id",
    "unitOfMeasureId": "uuid-unit-of-measure-id",
    "mapping": "{\"hisCode\": \"LAB001\", \"hisName\": \"Blood Test\"}",
    "numOrder": 2,
    "currentPrice": 160000,
    "parentServiceId": "uuid-parent-service-id",
    "isActiveFlag": 1,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### 8. Cập nhật giá dịch vụ
```bash
curl -X PUT "http://192.168.68.209:3333/api/v1/services/uuid-service-id/price" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "price": 170000,
    "effectiveFrom": "2024-01-01T00:00:00Z",
    "reason": "Điều chỉnh giá theo quy định mới"
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": "uuid-service-id",
    "serviceCode": "LAB001",
    "serviceName": "Xét nghiệm máu tổng quát",
    "currentPrice": 170000,
    "priceHistory": {
      "id": "uuid-price-history-id",
      "price": 170000,
      "effectiveFrom": "2024-01-01T00:00:00Z",
      "effectiveTo": null,
      "reason": "Điều chỉnh giá theo quy định mới",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

### 9. Lấy lịch sử giá
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services/uuid-service-id/price-history?limit=10&offset=0" \
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
        "id": "uuid-price-history-id",
        "serviceId": "uuid-service-id",
        "price": 170000,
        "effectiveFrom": "2024-01-01T00:00:00Z",
        "effectiveTo": null,
        "reason": "Điều chỉnh giá theo quy định mới",
        "createdAt": "2024-01-01T12:00:00Z"
      },
      {
        "id": "uuid-price-history-id-2",
        "serviceId": "uuid-service-id",
        "price": 150000,
        "effectiveFrom": "2023-01-01T00:00:00Z",
        "effectiveTo": "2023-12-31T23:59:59Z",
        "reason": "Giá ban đầu",
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ],
    "total": 2,
    "limit": 10,
    "offset": 0
  }
}
```

### 10. Lấy giá tại thời điểm cụ thể
```bash
curl -X GET "http://192.168.68.209:3333/api/v1/services/uuid-service-id/price-at-date?date=2024-01-15T00:00:00Z" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "serviceId": "uuid-service-id",
    "serviceCode": "LAB001",
    "serviceName": "Xét nghiệm máu tổng quát",
    "date": "2024-01-15T00:00:00Z",
    "price": 170000,
    "priceHistory": {
      "id": "uuid-price-history-id",
      "price": 170000,
      "effectiveFrom": "2024-01-01T00:00:00Z",
      "effectiveTo": null,
      "reason": "Điều chỉnh giá theo quy định mới"
    }
  }
}
```

### 11. Xóa dịch vụ
```bash
curl -X DELETE "http://192.168.68.209:3333/api/v1/services/uuid-service-id" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Response:**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "message": "Service deleted successfully"
  }
}
```

## 🔍 Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Tìm kiếm theo tên hoặc mã dịch vụ |
| `serviceGroupId` | string | No | Lọc theo ID nhóm dịch vụ |
| `parentServiceId` | string | No | Lọc theo ID dịch vụ cha |
| `isActive` | boolean | No | Lọc theo trạng thái hoạt động |
| `limit` | number | No | Số lượng item trên mỗi trang (default: 10) |
| `offset` | number | No | Số lượng item bỏ qua (default: 0) |

## 🔐 Phân quyền

| Endpoint | Role Required | Description |
|----------|---------------|-------------|
| `POST /services` | admin, manager | Tạo dịch vụ mới |
| `GET /services` | user, admin, manager | Xem danh sách dịch vụ |
| `GET /services/:id` | user, admin, manager | Xem chi tiết dịch vụ |
| `GET /services/group/:serviceGroupId` | user, admin, manager | Xem dịch vụ theo nhóm |
| `GET /services/parent/:parentServiceId` | user, admin, manager | Xem dịch vụ theo dịch vụ cha |
| `GET /services/hierarchy` | user, admin, manager | Xem cấu trúc phân cấp |
| `PUT /services/:id` | admin, manager | Cập nhật dịch vụ |
| `PUT /services/:id/price` | admin, manager | Cập nhật giá dịch vụ |
| `GET /services/:id/price-history` | user, admin, manager | Xem lịch sử giá |
| `GET /services/:id/price-at-date` | user, admin, manager | Xem giá tại thời điểm |
| `DELETE /services/:id` | admin | Xóa dịch vụ |

## 📝 Validation Rules

- `serviceCode`: Bắt buộc, tối đa 20 ký tự, duy nhất
- `serviceName`: Bắt buộc, tối đa 200 ký tự
- `shortName`: Tùy chọn, tối đa 50 ký tự
- `serviceGroupId`: Bắt buộc, UUID, phải tồn tại trong bảng service_groups
- `unitOfMeasureId`: Bắt buộc, UUID, phải tồn tại trong bảng unit_of_measures
- `mapping`: Tùy chọn, tối đa 1000 ký tự, định dạng JSON
- `numOrder`: Tùy chọn, number (default: 0)
- `currentPrice`: Tùy chọn, number (default: 0)
- `parentServiceId`: Tùy chọn, UUID, phải tồn tại trong bảng services
- `isActive`: Tùy chọn, boolean (default: true)

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "status_code": 400,
  "error": {
    "code": "HTTP_400",
    "message": "serviceCode should not be empty, serviceName should not be empty, serviceGroupId should not be empty, unitOfMeasureId should not be empty",
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
    "message": "Service not found",
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
    "message": "Service code already exists",
    "name": "AppError"
  }
}
```

## 🔗 Relationships

### Service Group Relationship
- `serviceGroupId`: Liên kết với bảng `BMM_SERVICE_GROUPS`
- `serviceGroup`: Thông tin chi tiết nhóm dịch vụ

### Unit of Measure Relationship
- `unitOfMeasureId`: Liên kết với bảng `BMM_UNIT_OF_MEASURES`
- `unitOfMeasure`: Thông tin chi tiết đơn vị tính

### Parent-Child Relationship
- `parentServiceId`: Liên kết với bảng `BMM_SERVICES` (self-reference)
- `parentService`: Thông tin dịch vụ cha
- `subServices`: Danh sách dịch vụ con

## 💰 Price Management

### Price History
- Lưu trữ lịch sử thay đổi giá với `effectiveFrom` và `effectiveTo`
- Hỗ trợ truy vấn giá tại thời điểm cụ thể
- Theo dõi lý do thay đổi giá

### Price Update
- Cập nhật giá mới với thời gian hiệu lực
- Tự động cập nhật `currentPrice` trong bảng services
- Lưu trữ lịch sử trong bảng `BMM_SERVICE_PRICE_HISTORY`

## 📚 Swagger Documentation
Truy cập: `http://192.168.68.209:3333/api/docs` để xem tài liệu API chi tiết với Swagger UI.

## 🔗 Related APIs
- [Service Groups API](./service-groups-api.md)
- [Unit of Measures API](./unit-of-measures-api.md)
- [Sample Types API](./sample-types-api.md)
- [Authentication API](./auth-api.md)
