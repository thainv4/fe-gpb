# API Tìm Kiếm Loại Mẫu (Sample Type)

## Tổng quan
Đã thêm API endpoint `/api/v1/sample-types/by-type-name/{typeName}` để tìm kiếm loại mẫu theo tên. API này được sử dụng trong:
1. Màn hình quản lý loại mẫu (sample-types)
2. Dropdown chọn bệnh phẩm trong màn hình chỉ định xét nghiệm (test-indications)

## Các thay đổi đã thực hiện

### 1. Thêm method mới vào API Client (`src/lib/api/client.ts`)

```typescript
async getSampleTypeByTypeName(typeName: string): Promise<ApiResponse<SampleType[]>> {
    return this.request<SampleType[]>(`/sample-types/by-type-name/${encodeURIComponent(typeName)}`);
}
```

**Đặc điểm:**
- Nhận tham số `typeName` (string) - tên loại mẫu cần tìm
- Sử dụng `encodeURIComponent()` để encode tên loại mẫu an toàn cho URL
- Trả về một **mảng** `SampleType[]` (có thể chứa nhiều kết quả khớp)
- Endpoint: `GET /api/v1/sample-types/by-type-name/{typeName}`

**Response format:**
```json
{
    "success": true,
    "status_code": 200,
    "data": [
        {
            "id": "f33dd1bd-b18c-403f-5dfc-ea749fe5988e",
            "typeCode": "BP0266",
            "typeName": "U bóng vater",
            "shortName": null,
            "description": null,
            "sortOrder": 0,
            "codePrefix": null,
            "codeWidth": 4,
            "allowDuplicate": 0,
            "resetPeriod": "MONTHLY",
            "displayName": "BP0266 - U bóng vater",
            "codeGenerationInfo": "No prefix configured (4 digits, unique, MONTHLY)",
            "createdAt": "2026-01-09T07:50:37.826Z",
            "updatedAt": "2026-01-09T07:50:37.826Z",
            "createdBy": null,
            "updatedBy": null,
            "version": 1
        }
    ],
    "meta": {
        "timestamp": "2026-01-13T04:54:58.829Z"
    }
}
```

### 2. Cập nhật màn hình quản lý loại mẫu (`src/components/sample-type-management/sample-type-table.tsx`)

#### Thay đổi logic fetch data:
```typescript
const {data: sampleTypes, isLoading, error} = useQuery({
    queryKey: ['sample-types', searchTerm, currentPage, pageSize],
    queryFn: async () => {
        // If there's a search term, use the by-type-name API
        if (searchTerm?.trim()) {
            const response = await apiClient.getSampleTypeByTypeName(searchTerm.trim())
            // API returns array in response.data, convert to expected structure
            return {
                data: {
                    sampleTypes: response.data || [],
                    total: response.data?.length || 0,
                    limit: pageSize,
                    offset: 0,
                }
            }
        }
        // Otherwise use the regular list API with pagination
        return apiClient.getSampleTypes(filters)
    },
})
```

**Đặc điểm:**
- Khi có `searchTerm`, sử dụng API `getSampleTypeByTypeName()`
- Khi không có `searchTerm`, sử dụng API `getSampleTypes()` với pagination
- API trả về mảng trong `response.data`, chuyển đổi thành format chuẩn để tương thích với UI
- Query key bao gồm `searchTerm`, `currentPage`, `pageSize` để tự động refetch khi thay đổi

#### Cập nhật input tìm kiếm:
```typescript
<Input
    placeholder="Tìm kiếm theo tên loại mẫu..."
    value={searchTerm}
    onChange={(e) => {
        setSearchTerm(e.target.value)
        setCurrentPage(0) // Reset to first page when searching
    }}
    className="pl-8"
/>
```

**Đặc điểm:**
- Reset về trang đầu tiên khi người dùng nhập tìm kiếm
- Placeholder được cập nhật để rõ ràng hơn

### 3. Cập nhật dropdown bệnh phẩm trong test-indications (`src/components/test-indications/test-indications-table.tsx`)

#### Thêm query để search sample type:
```typescript
// Fetch sample types based on search
const { data: searchedSampleTypeData } = useQuery({
    queryKey: ['sample-type-search', appliedSearch],
    queryFn: () => apiClient.getSampleTypeByTypeName(appliedSearch),
    enabled: !!appliedSearch && appliedSearch.trim().length > 0,
    retry: false,
})
```

**Đặc điểm:**
- Chỉ gọi API khi có `appliedSearch` (sau khi người dùng nhấn Enter)
- `retry: false` để không retry khi không tìm thấy
- Query key bao gồm `appliedSearch` để refetch khi search term thay đổi

#### Cập nhật logic filter:
```typescript
const filteredSampleTypeItems = useMemo(() => {
    if (appliedSearch && appliedSearch.trim()) {
        // Nếu có search term và có kết quả từ API (response.data là mảng)
        if (searchedSampleTypeData?.data && Array.isArray(searchedSampleTypeData.data)) {
            return searchedSampleTypeData.data
        }
        // Nếu có search term nhưng không có kết quả, trả về mảng rỗng
        return []
    }
    // Nếu không có search term, trả về tất cả
    return sampleTypeItems
}, [appliedSearch, searchedSampleTypeData, sampleTypeItems])
```

**Đặc điểm:**
- Sử dụng `useMemo` để tối ưu performance
- Khi có search term:
  - API trả về mảng trong `response.data`, sử dụng trực tiếp mảng đó
  - Nếu không tìm thấy, hiển thị mảng rỗng
- Khi không có search term: hiển thị tất cả sample types

## Cách sử dụng

### Trong màn hình Sample Types:
1. Người dùng nhập tên loại mẫu vào ô tìm kiếm
2. Hệ thống tự động gọi API search khi có input
3. Kết quả hiển thị ngay lập tức (hoặc không có kết quả nếu không tìm thấy)

### Trong màn hình Test Indications:
1. Người dùng click vào dropdown "Chọn bệnh phẩm"
2. Nhập tên bệnh phẩm vào ô tìm kiếm trong dropdown
3. Nhấn Enter để áp dụng tìm kiếm
4. Danh sách dropdown chỉ hiển thị kết quả tìm được (hoặc rỗng nếu không tìm thấy)

## Lợi ích

1. **Tìm kiếm chính xác**: API tìm theo tên chính xác thay vì filter ở client-side
2. **Performance tốt hơn**: Giảm lượng data truyền tải khi tìm kiếm
3. **UX nhất quán**: Cùng một logic tìm kiếm được dùng ở nhiều màn hình
4. **Backend control**: Backend có thể control logic tìm kiếm (exact match, case-insensitive, etc.)

## Notes

- API endpoint trả về **mảng các SampleType** trong `response.data`
- API có thể trả về nhiều kết quả nếu có nhiều loại mẫu khớp với search term
- Nếu không tìm thấy, API trả về mảng rỗng `[]`
- Frontend xử lý trực tiếp mảng kết quả từ API

