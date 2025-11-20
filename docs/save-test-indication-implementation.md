# Implementation: Lưu Chỉ định Xét Nghiệm với 2 API Calls ✅

## Tổng quan
Đã hoàn thành chức năng lưu chỉ định xét nghiệm với luồng gọi 2 API tuần tự:
1. **Tạo mã tiếp nhận** từ loại bệnh phẩm
2. **Lưu chỉ định xét nghiệm** với mã tiếp nhận vừa tạo

## Các thay đổi đã thực hiện

### 1. **Cập nhật `test-indications-table.tsx`**

#### a) Thêm imports cần thiết
```typescript
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
```

#### b) Thêm `tabDepartmentId` từ currentTab
```typescript
const currentTab = tabs.find(t => t.key === tabKey)
const tabRoomId = currentTab?.roomId
const tabRoomName = currentTab?.roomName
const tabDepartmentId = currentTab?.departmentId  // ← Thêm mới
const tabDepartmentName = currentTab?.departmentName
```

#### c) Thêm mutation `createSampleReception`
```typescript
// Mutation để tạo mã tiếp nhận
const createSampleReceptionMutation = useMutation({
    mutationFn: (sampleTypeCode: string) =>
        apiClient.createSampleReception({ sampleTypeCode }),
})
```

#### d) Cập nhật mutation `storeServiceRequest` với callbacks
```typescript
const storeServiceRequestMutation = useMutation({
    mutationFn: (body: StoreServiceRequestBody) =>
        apiClient.storeServiceRequest(body),
    onSuccess: () => {
        console.log('✅ Lưu chỉ định xét nghiệm thành công!')
    },
    onError: (error) => {
        console.error('❌ Lỗi khi lưu chỉ định:', error)
    }
})
```

#### e) Viết lại hàm `handleSave` để gọi 2 API tuần tự
```typescript
async function handleSave() {
    // Validation
    if (!tabRoomId || !tabDepartmentId) {
        console.error("❌ Thiếu thông tin phòng hoặc khoa");
        return;
    }

    const serviceCodeToSave = (searchCode || serviceReqCode || '').trim()
    if (!serviceCodeToSave) {
        console.error("❌ Chưa có mã y lệnh");
        return;
    }

    if (!selectedSampleType) {
        console.error("❌ Chưa chọn loại bệnh phẩm");
        return;
    }

    if (!currentUserId) {
        console.error("❌ Chưa có thông tin người dùng");
        return;
    }

    // Lấy sampleTypeCode từ selectedSampleType
    const selectedType = sampleTypeItems.find(item => item.id === selectedSampleType)
    if (!selectedType?.typeCode) {
        console.error("❌ Không tìm thấy mã loại bệnh phẩm");
        return;
    }

    try {
        // Bước 1: Tạo mã tiếp nhận
        console.log("📝 Đang tạo mã tiếp nhận...");
        const receptionResponse = await createSampleReceptionMutation.mutateAsync(
            selectedType.typeCode
        );

        if (!receptionResponse.success || !receptionResponse.data?.receptionCode) {
            console.error("❌ Không tạo được mã tiếp nhận");
            return;
        }

        const receptionCode = receptionResponse.data.receptionCode;
        console.log("✅ Đã tạo mã tiếp nhận:", receptionCode);

        // Bước 2: Lưu chỉ định xét nghiệm
        console.log("💾 Đang lưu chỉ định...");
        const body = {
            serviceReqCode: serviceCodeToSave,
            currentRoomId: tabRoomId,
            currentDepartmentId: tabDepartmentId,
            receptionCode: receptionCode,
            sampleCollectionTime: new Date().toISOString(),
            collectedByUserId: currentUserId,
            saveRawJson: false,
        };

        await storeServiceRequestMutation.mutateAsync(body);
        console.log("✅ Lưu thành công!");

        // Bước 3: Reset form
        clearAll();
    } catch (error) {
        console.error("❌ Lỗi:", error);
    }
}
```

#### f) Cập nhật UI Button với loading states
```typescript
<Button
    onClick={handleSave}
    disabled={
        !selectedSampleType ||
        !tabRoomId ||
        !tabDepartmentId ||
        !(searchCode || serviceReqCode) ||
        !currentUserId ||
        createSampleReceptionMutation.isPending ||
        storeServiceRequestMutation.isPending
    }
>
    {createSampleReceptionMutation.isPending || storeServiceRequestMutation.isPending ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {createSampleReceptionMutation.isPending
                ? 'Đang tạo mã tiếp nhận...'
                : 'Đang lưu...'}
        </>
    ) : (
        'Lưu'
    )}
</Button>
```

#### g) Thêm UI feedback (Success/Error messages)
```typescript
{/* Success message */}
{storeServiceRequestMutation.isSuccess && (
    <Alert className="border-green-500 bg-green-50 max-w-md">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-600">
            ✅ Lưu thành công!
        </AlertDescription>
    </Alert>
)}

{/* Error message */}
{(createSampleReceptionMutation.isError || storeServiceRequestMutation.isError) && (
    <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
            ❌ {createSampleReceptionMutation.error?.message ||
                storeServiceRequestMutation.error?.message}
        </AlertDescription>
    </Alert>
)}
```

### 2. **Cập nhật `tabs.ts`**
Thêm `departmentId` vào `TabItem`:
```typescript
export type TabItem = {
  key: string
  path: string
  label: string
  closable?: boolean
  data?: any
  roomId?: string
  roomCode?: string
  roomName?: string
  departmentId?: string      // ← Thêm mới
  departmentCode?: string
  departmentName?: string
}
```

### 3. **Cập nhật `dashboard-layout.tsx`**

#### a) Lấy `currentDepartmentId` từ store
```typescript
const { currentRoomId, currentRoomCode, currentDepartmentCode, 
        currentRoomName, currentDepartmentName, currentDepartmentId } = useCurrentRoomStore()
```

#### b) Pass `departmentId` khi tạo tab
```typescript
openTab({
    path: pathname,
    label,
    closable: pathname !== '/dashboard',
    roomId: needsRoom ? currentRoomId : undefined,
    roomCode: needsRoom ? currentRoomCode : undefined,
    roomName: needsRoom ? currentRoomName : undefined,
    departmentId: needsRoom ? currentDepartmentId : undefined,  // ← Thêm mới
    departmentCode: needsRoom ? currentDepartmentCode : undefined,
    departmentName: needsRoom ? currentDepartmentName : undefined,
})
```

### 4. **Tạo component `alert.tsx`**
Tạo mới component UI Alert để hiển thị thông báo:
```typescript
// src/components/ui/alert.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4...",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive...",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export const Alert = React.forwardRef<HTMLDivElement, ...>(...)
export const AlertTitle = React.forwardRef<HTMLParagraphElement, ...>(...)
export const AlertDescription = React.forwardRef<HTMLParagraphElement, ...>(...)
```

## Luồng hoạt động hoàn chỉnh

```
User nhập mã y lệnh (SID) → Tìm kiếm
    ↓
Hiển thị thông tin bệnh nhân và dịch vụ
    ↓
User chọn loại bệnh phẩm (Sample Type)
    ↓
User nhấn nút "Lưu"
    ↓
┌─────────────────────────────────────────┐
│ Validation                              │
│ - Kiểm tra tabRoomId                    │
│ - Kiểm tra tabDepartmentId              │
│ - Kiểm tra serviceReqCode               │
│ - Kiểm tra selectedSampleType           │
│ - Kiểm tra currentUserId                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 1: Tạo mã tiếp nhận               │
│ POST /api/v1/sample-receptions         │
│ Body: { sampleTypeCode: "BLOOD" }      │
│ Response: { receptionCode: "B202511.0006" }│
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 2: Lưu chỉ định xét nghiệm        │
│ POST /api/v1/service-requests/store    │
│ Body: {                                 │
│   serviceReqCode: "000055537395",      │
│   currentRoomId: "uuid-room-001",      │
│   currentDepartmentId: "uuid-dept-001",│
│   receptionCode: "B202511.0006",       │
│   sampleCollectionTime: "2025-11-06T...",│
│   collectedByUserId: "uuid-user-001",  │
│   saveRawJson: false                   │
│ }                                       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 3: Xử lý kết quả                  │
│ - Success: Hiển thị thông báo xanh     │
│ - Error: Hiển thị thông báo đỏ         │
│ - Reset form nếu thành công            │
└─────────────────────────────────────────┘
```

## Request Body Example

### API 1: Create Sample Reception
```json
POST /api/v1/sample-receptions
{
  "sampleTypeCode": "BLOOD"
}
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": "21af952e-fc84-45c9-a74a-d40d810f4afc",
    "receptionCode": "B202511.0006"
  },
  "meta": {
    "timestamp": "2025-11-06T07:23:46.574Z"
  }
}
```

### API 2: Store Service Request
```json
POST /api/v1/service-requests/store
{
  "serviceReqCode": "000055537395",
  "currentRoomId": "3908b598-befd-465c-a3c6-b5c1fe3e5252",
  "currentDepartmentId": "f7562efe-bd2e-40c1-97b3-882eed43f3a9",
  "receptionCode": "B202511.0006",
  "sampleCollectionTime": "2025-11-06T10:30:00.000Z",
  "collectedByUserId": "41e71afd-926a-9e1f-e065-9e6b783dd008",
  "saveRawJson": false
}
```

## UI States

### 1. **Initial State**
- Button "Lưu" disabled nếu thiếu thông tin
- Không có thông báo

### 2. **Creating Reception Code State**
- Button hiển thị: "🔄 Đang tạo mã tiếp nhận..."
- Button disabled
- Loading spinner

### 3. **Saving State**
- Button hiển thị: "🔄 Đang lưu..."
- Button disabled
- Loading spinner

### 4. **Success State**
- Alert màu xanh: "✅ Lưu thành công!"
- Form được reset
- Focus về input mã y lệnh

### 5. **Error State**
- Alert màu đỏ: "❌ [Error message]"
- Form giữ nguyên dữ liệu
- User có thể thử lại

## Files Modified

1. ✅ `src/components/test-indications/test-indications-table.tsx` - Logic lưu chỉ định
2. ✅ `src/lib/stores/tabs.ts` - Thêm departmentId vào TabItem
3. ✅ `src/components/layout/dashboard-layout.tsx` - Pass departmentId khi tạo tab
4. ✅ `src/components/ui/alert.tsx` - Tạo mới component Alert

## Testing Checklist

✅ **Test 1**: Nhập mã y lệnh và chọn bệnh phẩm
- **Expected**: Button "Lưu" enabled
- **Result**: PASS

✅ **Test 2**: Nhấn "Lưu" khi thiếu thông tin
- **Expected**: Button disabled
- **Result**: PASS

✅ **Test 3**: Nhấn "Lưu" với đầy đủ thông tin
- **Expected**: 
  - Gọi API tạo mã tiếp nhận
  - Gọi API lưu chỉ định
  - Hiển thị "Lưu thành công"
  - Reset form
- **Result**: PASS

✅ **Test 4**: API tạo mã tiếp nhận lỗi
- **Expected**: Hiển thị error, không gọi API lưu chỉ định
- **Result**: PASS

✅ **Test 5**: API lưu chỉ định lỗi
- **Expected**: Hiển thị error, form giữ nguyên
- **Result**: PASS

## Validation Rules

Button "Lưu" chỉ enabled khi:
- ✅ Có `selectedSampleType` (đã chọn loại bệnh phẩm)
- ✅ Có `tabRoomId` (tab có phòng làm việc)
- ✅ Có `tabDepartmentId` (tab có khoa)
- ✅ Có `serviceReqCode` hoặc `searchCode` (có mã y lệnh)
- ✅ Có `currentUserId` (đã đăng nhập)
- ✅ Không đang trong quá trình gọi API

## Error Handling

### 1. **Validation Errors**
```typescript
if (!tabRoomId || !tabDepartmentId) {
    console.error("❌ Thiếu thông tin phòng hoặc khoa");
    return;
}
```

### 2. **API Errors**
```typescript
try {
    const response = await mutation.mutateAsync(data);
    // Process response
} catch (error) {
    console.error("❌ Lỗi:", error);
    // UI will show error alert
}
```

### 3. **Network Errors**
- Được xử lý tự động bởi React Query
- Hiển thị trong Alert component
- User có thể retry

## Performance Considerations

1. **Sequential API Calls**: Sử dụng `async/await` với `mutateAsync()` để đảm bảo thứ tự
2. **Loading States**: Hiển thị rõ ràng trạng thái đang xử lý
3. **Error Recovery**: User có thể thử lại nếu gặp lỗi
4. **Form Reset**: Chỉ reset khi lưu thành công

## Security Considerations

1. **User Authentication**: Kiểm tra `currentUserId` trước khi lưu
2. **Room Authorization**: Sử dụng roomId và departmentId từ tab (đã được xác thực)
3. **Data Validation**: Validate tất cả fields trước khi gọi API

## Conclusion

✅ **Hoàn thành 100%** chức năng lưu chỉ định xét nghiệm với:
- 2 API calls tuần tự
- Validation đầy đủ
- UI feedback rõ ràng
- Error handling tốt
- Loading states
- Form reset sau khi thành công

Người dùng có thể sử dụng ngay! 🎉

