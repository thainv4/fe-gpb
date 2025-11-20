# Hướng dẫn sử dụng Tab State Management

## Giới thiệu

Hệ thống tabs đã được nâng cấp để **lưu trữ nội dung của mỗi tab khi chuyển đổi giữa các tab**. Điều này giúp người dùng không bị mất dữ liệu đã nhập khi chuyển sang tab khác.

## Cách hoạt động

### 1. Tabs Store (`src/lib/stores/tabs.ts`)

Store đã được cải tiến với các tính năng mới:

```typescript
interface TabsState {
  tabs: TabItem[]
  activeKey: string | null
  tabData: Record<string, any> // Lưu trữ data cho mỗi tab theo path
  openTab: (tab: TabItem) => void
  closeTab: (key: string) => void
  setActive: (key: string) => void
  setTabData: (key: string, data: any) => void  // Lưu data cho tab
  getTabData: (key: string) => any              // Lấy data của tab
  reset: () => void
}
```

**Đặc điểm:**
- ✅ Không lưu vào localStorage (chỉ tồn tại trong memory)
- ✅ Tự động xóa khi logout
- ✅ Tự động xóa khi đóng tab
- ✅ Mỗi tab có thể lưu bất kỳ data nào

### 2. Cách sử dụng trong Component

#### Ví dụ 1: Test Indications Form

```typescript
export default function TestIndicationsTable() {
    const pathname = usePathname()
    const { setTabData, getTabData } = useTabsStore()

    const [serviceReqCode, setServiceReqCode] = useState<string>('')
    const [searchCode, setSearchCode] = useState<string>('')
    const [selectedSampleType, setSelectedSampleType] = useState<string>('')
    const [sampleCode, setSampleCode] = useState<string>('')

    // Khôi phục state khi mount component
    useEffect(() => {
        const savedData = getTabData(pathname)
        if (savedData) {
            setServiceReqCode(savedData.serviceReqCode || '')
            setSearchCode(savedData.searchCode || '')
            setSelectedSampleType(savedData.selectedSampleType || '')
            setSampleCode(savedData.sampleCode || '')
        }
    }, [pathname, getTabData])

    // Lưu state mỗi khi có thay đổi
    useEffect(() => {
        setTabData(pathname, {
            serviceReqCode,
            searchCode,
            selectedSampleType,
            sampleCode,
        })
    }, [pathname, serviceReqCode, searchCode, selectedSampleType, sampleCode, setTabData])

    // ...rest of component
}
```

#### Ví dụ 2: Test Results Form

```typescript
export default function TestResultTable() {
    const pathname = usePathname()
    const { setTabData, getTabData } = useTabsStore()

    const [dateRange, setDateRange] = useState<DateRange>({startDate: null, endDate: null})
    const [searchText, setSearchText] = useState<string>('')

    // Khôi phục state
    useEffect(() => {
        const savedData = getTabData(pathname)
        if (savedData) {
            setDateRange(savedData.dateRange || {startDate: null, endDate: null})
            setSearchText(savedData.searchText || '')
        }
    }, [pathname, getTabData])

    // Lưu state
    useEffect(() => {
        setTabData(pathname, {
            dateRange,
            searchText,
        })
    }, [pathname, dateRange, searchText, setTabData])

    // ...rest of component
}
```

## Quy trình thêm Tab State cho Component mới

### Bước 1: Import các dependencies cần thiết

```typescript
import { useTabsStore } from "@/lib/stores/tabs"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
```

### Bước 2: Khởi tạo hooks

```typescript
const pathname = usePathname()
const { setTabData, getTabData } = useTabsStore()
```

### Bước 3: Thêm logic khôi phục state

```typescript
useEffect(() => {
    const savedData = getTabData(pathname)
    if (savedData) {
        // Khôi phục các state của bạn
        setState1(savedData.state1 || defaultValue1)
        setState2(savedData.state2 || defaultValue2)
        // ...
    }
}, [pathname, getTabData])
```

### Bước 4: Thêm logic lưu state

```typescript
useEffect(() => {
    setTabData(pathname, {
        state1,
        state2,
        // ... tất cả state cần lưu
    })
}, [pathname, state1, state2, setTabData])
```

## Các trường hợp sử dụng

### 1. Form với nhiều input fields
✅ Lưu tất cả giá trị input
✅ Người dùng có thể chuyển tab và quay lại mà không mất dữ liệu

### 2. Bộ lọc và tìm kiếm
✅ Lưu các điều kiện lọc
✅ Lưu text tìm kiếm
✅ Lưu khoảng ngày đã chọn

### 3. Trạng thái UI
✅ Lưu tab đang active (nếu component có sub-tabs)
✅ Lưu trạng thái mở/đóng của các section
✅ Lưu vị trí scroll

### 4. Dữ liệu đã tải từ API
✅ Có thể lưu response để tránh gọi lại API
✅ Lưu các selection của người dùng

## Lưu ý quan trọng

### ⚠️ Dữ liệu chỉ tồn tại trong session hiện tại
- Khi refresh trang: **Mất tất cả**
- Khi logout: **Tự động xóa**
- Khi đóng tab: **Tự động xóa tab data đó**

### ⚠️ Performance
- Không lưu quá nhiều dữ liệu nặng (hình ảnh, file lớn)
- Chỉ lưu những state cần thiết
- Cân nhắc sử dụng debounce cho các state thay đổi liên tục

### ⚠️ Dependency Array
- Phải include đầy đủ dependencies trong useEffect
- Pathname luôn phải có trong dependency array
- setTabData và getTabData cũng nên được include

## Ví dụ nâng cao

### Lưu với debounce (cho search text)

```typescript
import { useEffect, useState, useCallback } from "react"
import debounce from "lodash/debounce"

const [searchText, setSearchText] = useState('')

// Debounce save operation
const debouncedSave = useCallback(
    debounce((data) => {
        setTabData(pathname, data)
    }, 500),
    [pathname, setTabData]
)

useEffect(() => {
    debouncedSave({ searchText })
}, [searchText, debouncedSave])
```

### Lưu với điều kiện

```typescript
useEffect(() => {
    // Chỉ lưu khi có dữ liệu hợp lệ
    if (serviceReqCode && selectedSampleType) {
        setTabData(pathname, {
            serviceReqCode,
            selectedSampleType,
            sampleCode,
        })
    }
}, [pathname, serviceReqCode, selectedSampleType, sampleCode, setTabData])
```

### Merge với data cũ

```typescript
useEffect(() => {
    const currentData = getTabData(pathname) || {}
    setTabData(pathname, {
        ...currentData,
        newField: newValue,
    })
}, [pathname, newValue, getTabData, setTabData])
```

## Testing

Để test tính năng:

1. **Mở tab "Chỉ định xét nghiệm"**
   - Nhập mã y lệnh
   - Chọn bệnh phẩm
   
2. **Chuyển sang tab khác** (ví dụ: Dashboard, Users, etc.)

3. **Quay lại tab "Chỉ định xét nghiệm"**
   - ✅ Mã y lệnh vẫn còn
   - ✅ Thông tin bệnh nhân vẫn hiển thị
   - ✅ Bệnh phẩm đã chọn vẫn được giữ
   - ✅ Mã bệnh phẩm vẫn còn

4. **Đóng tab và mở lại**
   - ❌ Dữ liệu sẽ bị xóa (đây là hành vi mong muốn)

## Kết luận

Hệ thống Tab State Management giúp:
- ✅ Cải thiện UX - người dùng không mất dữ liệu khi chuyển tab
- ✅ Tăng hiệu suất làm việc - không cần nhập lại
- ✅ Linh hoạt - dễ dàng áp dụng cho các component mới
- ✅ An toàn - tự động cleanup khi logout hoặc đóng tab

**Ghi nhớ:** Chỉ lưu những gì cần thiết, và luôn cung cấp giá trị mặc định hợp lý khi khôi phục state!

