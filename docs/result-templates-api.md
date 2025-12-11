# 📝 Result Templates API Documentation

## 📋 Tổng quan
Module Result Templates quản lý các mẫu kết quả xét nghiệm trong hệ thống, cho phép tạo, cập nhật, tìm kiếm và xóa các mẫu kết quả.

## 🏗️ Cấu trúc dữ liệu
```typescript
interface ResultTemplate {
    id: string;
    RESULT_TEXT_TEMPLATE: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
}

interface ResultTemplateRequest {
    RESULT_TEXT_TEMPLATE: string;
}

interface ResultTemplateFilters {
    keyword?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
```

## 🔐 Authentication
Tất cả endpoints yêu cầu JWT token trong header:
```bash
Authorization: Bearer <your-jwt-token>
```

## 📡 API Endpoints

### 1. Lấy danh sách mẫu kết quả
**Method:** `GET /api/v1/result-templates`

**Query Parameters:**
- `limit`: Số lượng bản ghi trên mỗi trang (default: 10)
- `offset`: Số bản ghi bỏ qua (default: 0)
- `sortBy`: Trường để sắp xếp (default: createdAt)
- `sortOrder`: Thứ tự sắp xếp ASC/DESC (default: DESC)

**Response:**
```json
{
    "success": true,
    "status_code": 200,
    "data": {
        "data": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm tổng quát: {{param1}}, {{param2}}",
                "createdAt": "2025-12-09T10:00:00.000Z",
                "updatedAt": "2025-12-09T10:00:00.000Z",
                "createdBy": "user123",
                "updatedBy": "user123"
            }
        ],
        "total": 100,
        "limit": 10,
        "offset": 0
    }
}
```

**Client Usage:**
```typescript
const response = await apiClient.getResultTemplates({
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'DESC'
});
```

---

### 2. Lấy thông tin mẫu kết quả theo ID
**Method:** `GET /api/v1/result-templates/:id`

**Response:**
```json
{
    "success": true,
    "status_code": 200,
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm tổng quát: {{param1}}, {{param2}}",
        "createdAt": "2025-12-09T10:00:00.000Z",
        "updatedAt": "2025-12-09T10:00:00.000Z",
        "createdBy": "user123",
        "updatedBy": "user123"
    }
}
```

**Client Usage:**
```typescript
const response = await apiClient.getResultTemplate('550e8400-e29b-41d4-a716-446655440000');
```

---

### 3. Tạo mẫu kết quả mới
**Method:** `POST /api/v1/result-templates`

**Request Body:**
```json
{
    "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm tổng quát: {{param1}}, {{param2}}"
}
```

**Response:**
```json
{
    "success": true,
    "status_code": 201,
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm tổng quát: {{param1}}, {{param2}}",
        "createdAt": "2025-12-09T10:00:00.000Z",
        "updatedAt": "2025-12-09T10:00:00.000Z",
        "createdBy": "user123"
    }
}
```

**Client Usage:**
```typescript
const response = await apiClient.createResultTemplate({
    RESULT_TEXT_TEMPLATE: "Kết quả xét nghiệm tổng quát: {{param1}}, {{param2}}"
});
```

---

### 4. Cập nhật mẫu kết quả
**Method:** `PUT /api/v1/result-templates/:id`

**Request Body:**
```json
{
    "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm cập nhật: {{param1}}, {{param2}}, {{param3}}"
}
```

**Response:**
```json
{
    "success": true,
    "status_code": 200,
    "data": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm cập nhật: {{param1}}, {{param2}}, {{param3}}",
        "createdAt": "2025-12-09T10:00:00.000Z",
        "updatedAt": "2025-12-09T11:00:00.000Z",
        "createdBy": "user123",
        "updatedBy": "user456"
    }
}
```

**Client Usage:**
```typescript
const response = await apiClient.updateResultTemplate(
    '550e8400-e29b-41d4-a716-446655440000',
    {
        RESULT_TEXT_TEMPLATE: "Kết quả xét nghiệm cập nhật: {{param1}}, {{param2}}, {{param3}}"
    }
);
```

---

### 5. Xóa mẫu kết quả
**Method:** `DELETE /api/v1/result-templates/:id`

**Response:**
```json
{
    "success": true,
    "status_code": 200,
    "message": "Mẫu kết quả đã được xóa thành công"
}
```

**Client Usage:**
```typescript
const response = await apiClient.deleteResultTemplate('550e8400-e29b-41d4-a716-446655440000');
```

---

### 6. Tìm kiếm mẫu kết quả
**Method:** `GET /api/v1/result-templates/search/keyword`

**Query Parameters:**
- `keyword`: Từ khóa tìm kiếm trong mẫu văn bản
- `limit`: Số lượng bản ghi trên mỗi trang (default: 10)
- `offset`: Số bản ghi bỏ qua (default: 0)
- `sortBy`: Trường để sắp xếp (default: createdAt)
- `sortOrder`: Thứ tự sắp xếp ASC/DESC (default: DESC)

**Response:**
```json
{
    "success": true,
    "status_code": 200,
    "data": {
        "data": [
            {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "RESULT_TEXT_TEMPLATE": "Kết quả xét nghiệm tổng quát: {{param1}}, {{param2}}",
                "createdAt": "2025-12-09T10:00:00.000Z",
                "updatedAt": "2025-12-09T10:00:00.000Z",
                "createdBy": "user123",
                "updatedBy": "user123"
            }
        ],
        "total": 5,
        "limit": 10,
        "offset": 0
    }
}
```

**Client Usage:**
```typescript
const response = await apiClient.searchResultTemplates({
    keyword: 'xét nghiệm',
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'DESC'
});
```

---

## 💡 Ví dụ sử dụng trong Component

### Lấy và hiển thị danh sách mẫu
```typescript
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { ResultTemplate } from '@/lib/api/client';

function ResultTemplateList() {
    const [templates, setTemplates] = useState<ResultTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getResultTemplates({
                limit: 20,
                offset: 0,
                sortBy: 'createdAt',
                sortOrder: 'DESC'
            });
            if (response.data) {
                setTemplates(response.data.data);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <ul>
                    {templates.map(template => (
                        <li key={template.id}>
                            {template.RESULT_TEXT_TEMPLATE}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
```

### Tạo mẫu mới
```typescript
const createTemplate = async (templateText: string) => {
    try {
        const response = await apiClient.createResultTemplate({
            RESULT_TEXT_TEMPLATE: templateText
        });
        if (response.success) {
            console.log('Template created:', response.data);
            // Reload templates
            await loadTemplates();
        }
    } catch (error) {
        console.error('Error creating template:', error);
    }
};
```

### Tìm kiếm mẫu
```typescript
const searchTemplates = async (keyword: string) => {
    try {
        const response = await apiClient.searchResultTemplates({
            keyword: keyword,
            limit: 10,
            offset: 0
        });
        if (response.data) {
            setTemplates(response.data.data);
        }
    } catch (error) {
        console.error('Error searching templates:', error);
    }
};
```

---

## 🔍 Ghi chú
- Tất cả API đều yêu cầu authentication
- `RESULT_TEXT_TEMPLATE` là unique, không được trùng lặp
- Độ dài tối đa của `RESULT_TEXT_TEMPLATE` là 2000 ký tự
- Có thể sử dụng placeholder như `{{param1}}`, `{{param2}}` trong template
- Xóa là soft delete (đánh dấu không active)

