# Triển khai ký số EMR cho phiếu kết quả GEN

Tài liệu mô tả cách đặt chữ ký số EMR trên form GEN (`GenResultSheet`) và luồng ký số trong `test-result-form.tsx`.

## Tổng quan

| | Form GPB | Form GEN |
|---|----------|----------|
| Component | `form-gpb.tsx` (preview dialog) | `gen-result-sheet.tsx` (WYSIWYG inline) |
| Container PDF | `previewRef` | `genPdfRef` → `.gen-print-root` |
| Class trang DOM | `.pdf-page` | `.gen-a4` |
| Vị trí khối ký | `position: absolute; bottom: 35mm` (cố định trang cuối) | Document flow — **đi theo** dòng "T/L GIÁM ĐỐC TRUNG TÂM" |
| Phạm vi ký | Một văn bản cho cả phiếu | **Theo từng dịch vụ** (`StoredSrServiceId`) |
| Offset ngang | `GPB_SIGN_OFFSET_X = 1` | `GEN1_SIGN_OFFSET_X = 20` |

Cả hai form dùng chung cơ chế: marker DOM `[data-sign-anchor]` → `getSignPointFromDom()` → `PointSign` gửi EMR.

## Vị trí marker trên phiếu GEN

Marker là `<span data-sign-anchor />` vô hình (0×0 px), đặt **ngay dưới** tiêu đề **"T/L GIÁM ĐỐC TRUNG TÂM"** và **trên** dòng "Họ tên: ...".

```
[Thời gian ký]
T/L GIÁM ĐỐC TRUNG TÂM
[data-sign-anchor]          ← mốc đo
     ↓
(khối chữ ký EMR 150×100 pt)
     ↓
Họ tên: ....................
```

File: `fe-gpb/src/components/test-results/gen-result-sheet.tsx`

Khi nội dung phía trên dài hơn (bảng gene, textarea xuống dòng), footer chứa tiêu đề và marker **cùng tụt xuống**. Lúc ký, toạ độ được **đo lại** từ vị trí marker thực tế — chữ ký EMR bám theo dòng "T/L GIÁM ĐỐC TRUNG TÂM".

## Cách tính toạ độ EMR

Hàm: `getSignPointFromDom()` trong `test-result-form.tsx`.

1. Tìm `[data-sign-anchor]` trong container PDF.
2. Tìm trang gần nhất qua selector `.pdf-page, .a4-page, .gen-a4`.
3. Tính tỉ lệ `fracX`, `fracY` của marker trong trang.
4. Quy đổi sang hệ tọa độ PDF (gốc dưới-trái, A4 = 595.28 × 841.89 pt):

```
signAnchor.x = fracX × 595.28
signAnchor.y = 841.89 - fracY × 841.89 - GPB_SIGN_OFFSET_Y   // GPB_SIGN_OFFSET_Y = 20
```

5. Gửi EMR (`PointSign`):

```
CoorXRectangle = max(0, signAnchor.x - signOffsetX)   // GEN: signOffsetX = 20
CoorYRectangle = signAnchor.y
WidthRectangle = 150
HeightRectangle = 100
PageNumber     = index trang .gen-a4 (+ 1)
```

**Lưu ý:** Chữ ký không đè đúng lên marker mà là khối hình chữ nhật **ngay dưới / quanh** marker (offset dọc 20 pt, offset ngang để canh giữa khối 150 pt).

Nếu không tìm được marker → fallback `DEFAULT_POINT_SIGN` (405, 65).

## Luồng ký số

```
Người dùng → GenResultSheet "Ký số"
           → test-result-form requestSign() → dialog xác nhận
           → handleSignDocument() → handleDigitalSign()
           → pdfBase64FromContainerWithPuppeteer(genPdfRef)
           → getSignPointFromDom(genPdfRef)
           → apiClient.createAndSignHsm(PointSign, StoredSrServiceId)
           → storeSignedDocuments, patch documentId, HIS-PACS, workflow
```

### Container PDF

`genPdfRef` gắn vào `.gen-print-root` trong `GenResultSheet` (prop `pdfRef`). Puppeteer serialize HTML từ container này — cùng nội dung người dùng thấy trên màn hình.

GPB dùng `previewRef` trong dialog xem trước; GEN ký **trực tiếp** từ sheet đang nhập, không qua preview dialog.

### Quyền ký số GEN

File: `fe-gpb/src/lib/gen-digital-sign-policy.ts`

- Chỉ username trong whitelist mới ký được (mặc định: `ntl32`, `bbm`, `admin`).
- Cấu hình: `NEXT_PUBLIC_GEN_DIGITAL_SIGN_ALLOWED_USERNAMES` (danh sách cách nhau bởi dấu phẩy).

### Phạm vi theo dịch vụ

- GEN gửi thêm `StoredSrServiceId` trong `EmrSignRequest` (giống PIVKA).
- Mỗi dịch vụ có `documentId` riêng; ký lại phải hủy chữ ký dịch vụ đó trước.
- `getSignTargetService()` lấy dịch vụ từ `selectedServiceId` (mặc định dịch vụ đầu tiên).

## File liên quan

| File | Vai trò |
|------|---------|
| `gen-result-sheet.tsx` | UI phiếu, marker, nút Lưu/Ký/Xem/Hủy, `pdfRef` |
| `gen-result-persistence.md` | Lưu kết quả GEN (giai đoạn 1 + kế hoạch giai đoạn 2) |
| `test-result-form.tsx` | `genPdfRef`, `handleDigitalSign`, `getSignPointFromDom`, dialog xác nhận |
| `gen-digital-sign-policy.ts` | Whitelist user ký GEN |
| `lib/utils/pdf-export.ts` | `pdfBase64FromContainerWithPuppeteer` |
| `lib/api/client.ts` | `createAndSignHsm`, `EmrSignPointSign` |

## Giới hạn đã biết

### Phiếu dài hơn 1 trang A4

`.gen-a4` có `min-height: 297mm` nhưng có thể cao hơn khi nội dung tràn. Puppeteer có thể xuất nhiều trang PDF, trong khi `getSignPointFromDom` coi **một** phần tử `.gen-a4` là một trang DOM. Với phiếu GEN tiêu chuẩn (vừa 1 trang) thì ổn. Nếu sau này nội dung thường tràn trang, cần:

- Tách thành nhiều `.gen-a4` / `.pdf-page`, hoặc
- Cải thiện `getSignPointFromDom` để map đúng số trang PDF thực tế.

### Dữ liệu bảng gene (`geneRow`)

**Giai đoạn 1 (đã triển khai):** Kỹ thuật lưu `testingMethodGenId` → cột `TESTING_METHOD_GEN_ID`; bảng gene (1 dòng) lưu trong `RESULT_METADATA` JSON (`genResult.geneRow`). Chi tiết: `fe-gpb/docs/gen-result-persistence.md`.

**Giai đoạn 2 (chưa triển khai):** Bảng `BML_GEN_SSR_GENE_ROWS` cho nhiều dòng gene / báo cáo — xem tài liệu trên.

## Tinh chỉnh vị trí chữ ký

Nếu chữ ký EMR lệch so với mong muốn:

| Hằng số | Tác dụng |
|---------|----------|
| `GPB_SIGN_OFFSET_Y` (20) | Tăng → khối ký xuống thêm (xa tiêu đề hơn) |
| `GEN1_SIGN_OFFSET_X` (20) | Tăng → khối ký sang trái (canh giữa khối 150 pt) |
| `WidthRectangle` / `HeightRectangle` | Kích thước vùng chữ ký EMR |

Log debug: `[SIGN_DEBUG] DOM sign anchor measured` và `[SIGN_DEBUG] sign placement inputs` trong console khi ký.

## Kiểm thử nhanh

1. Đăng nhập user trong whitelist GEN.
2. Mở phiếu `resultFormType = 2`, nhập kết quả trên `GenResultSheet`.
3. Bấm **Lưu kết quả** → **Ký số** → xác nhận.
4. Kiểm tra chữ ký nằm dưới "T/L GIÁM ĐỐC TRUNG TÂM" trên PDF đã ký.
5. Thử nhập nội dung dài ở bảng gene → ký lại → chữ ký phải tụt theo tiêu đề.
6. **Xem văn bản đã ký** / **Hủy chữ ký số** trên toolbar phiếu.
