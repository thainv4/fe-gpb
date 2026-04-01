# Workflow history — Action info API

## Tổng quan

API trả về **danh sách các hành động đã ghi nhận** trên quy trình (workflow) cho một **phiếu lưu trữ** (`stored service request`), được dùng trên màn hình trả kết quả để hiển thị **người lấy mẫu**, **thời gian lấy mẫu**, **người nhận mẫu**, **thời gian nhận mẫu** (và có thể tái sử dụng cho phiếu in PDF).

Base URL mặc định của frontend: `{NEXT_PUBLIC_BACKEND_API_URL}` (ví dụ `http://localhost:8000/api/v1`).

---

## Authentication

Yêu cầu JWT:

```http
Authorization: Bearer <access_token>
```

---

## GET `/workflow-history/action-info/:storedServiceReqId`

### Mô tả

- **Method:** `GET`
- **Path parameter:** `storedServiceReqId` — UUID (hoặc định danh) của bản ghi **stored service request** (phiếu đã lưu trong hệ thống GPB), trùng với id dùng khi gọi `GET /stored-service-requests/:id` (hoặc tương đương trong backend).

### Ví dụ curl

```bash
curl -X GET "${API_BASE_URL}/workflow-history/action-info/<storedServiceReqId>" \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Response thành công (chuẩn `ApiResponse`)

Body JSON theo pattern chung của backend (có thể kèm `status_code` tùy phiên bản API):

```json
{
  "success": true,
  "data": [
    {
      "actionUsername": "user01",
      "actionUserFullName": "Nguyễn Văn A",
      "stateName": "Đã lấy mẫu",
      "stateOrder": 1,
      "createdAt": "2025-04-01T08:30:00.000Z"
    },
    {
      "actionUsername": "user02",
      "actionUserFullName": "Trần Thị B",
      "stateName": "Đã nhận mẫu",
      "stateOrder": 2,
      "createdAt": "2025-04-01T09:15:00.000Z"
    }
  ]
}
```

### Cấu trúc phần tử `data[]` (`WorkflowActionInfo`)

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `actionUsername` | string | Tên đăng nhập người thực hiện hành động |
| `actionUserFullName` | string | Họ tên đầy đủ |
| `stateName` | string | Tên trạng thái workflow tại thời điểm ghi nhận |
| `stateOrder` | number | Thứ tự bước trong quy trình (xem quy ước bên dưới) |
| `createdAt` | string (ISO 8601) | Thời điểm ghi nhận hành động |

### Quy ước `stateOrder` trên frontend

Ứng dụng **fe-gpb** map như sau (đồng bộ với `FormGen1` và màn hình trả kết quả):

| `stateOrder` | Ý nghĩa hiển thị | Nguồn thời gian |
|--------------|------------------|-----------------|
| `1` | Lấy mẫu | `createdAt` của bản ghi `stateOrder === 1` |
| `2` | Nhận mẫu | `createdAt` của bản ghi `stateOrder === 2` |

Nếu backend thêm bước khác, cần cập nhật map ở frontend và tài liệu này.

### Response lỗi (ví dụ)

```json
{
  "success": false,
  "message": "Không tìm thấy phiếu",
  "error": "NOT_FOUND"
}
```

Mã HTTP phụ thuộc backend (404 nếu không có phiếu, 401 nếu chưa đăng nhập, v.v.).

---

## Client TypeScript (dự án)

- Interface: `WorkflowActionInfo` trong `src/lib/api/client.ts`
- Hàm gọi: `apiClient.getWorkflowActionInfo(storedServiceReqId)`
- React Query (màn trả kết quả): `queryKey: ['workflow-action-info', storedServiceReqId, refreshTrigger]`

---

## Ghi chú tích hợp

- Khi chưa có `storedServiceReqId` (chưa chọn phiếu lưu trữ), không nên gọi API.
- Danh sách có thể **rỗng** hoặc **thiếu** một trong hai bước (1 hoặc 2): UI nên hiển thị placeholder (ví dụ `—`).
- Khi `refreshTrigger` tăng (làm mới sau lưu/sidebar), query nên được refetch để đồng bộ nếu workflow thay đổi.
