# Lưu kết quả phiếu GEN — lộ trình 2 giai đoạn

Tài liệu mô tả cách persist dữ liệu nhập trên `GenResultSheet` (kỹ thuật + bảng gene).

## Tổng quan

| Giai đoạn | Kỹ thuật | Bảng gene | Trạng thái |
|-----------|----------|-----------|------------|
| **1** | `TESTING_METHOD_GEN_ID` trên `BML_STORED_SR_SERVICES` | `RESULT_METADATA` JSON (`genResult.geneRow`) | Đã triển khai |
| **2** | Giữ nguyên | Bảng `BML_GEN_SSR_GENE_ROWS` (1 service → N dòng) | Chưa triển khai |

---

## Giai đoạn 1 (hiện tại)

### Dữ liệu lưu

| Trường UI | API field | Cột DB |
|-----------|-----------|--------|
| Kỹ thuật (Select) | `testingMethodGenId` | `BML_STORED_SR_SERVICES.TESTING_METHOD_GEN_ID` |
| Tên Gen, Tình trạng, Vị trí, Thay đổi nucleotid/protein, Phân lớp biến thể | `resultMetadata` (JSON) | `BML_STORED_SR_SERVICES.RESULT_METADATA` |

### Schema `RESULT_METADATA`

```json
{
  "genResult": {
    "version": 1,
    "geneRow": {
      "geneName": "BRCA1",
      "status": "Het",
      "position": "chr17:...",
      "nucleotideChange": "c.123A>G",
      "variantClassification": "Pathogenic"
    }
  }
}
```

### API

- **Lưu:** `PATCH /api/v1/service-requests/stored/services/:serviceId/result`
  - `testingMethodGenId`: string | null
  - `resultMetadata`: string (JSON trên)
- **Tải (chưa ký số):** `GET .../stored/services/:serviceId/result`
- **Tải (đã ký số):** `GET .../result` bị chặn khi có `documentId` → fallback từ `StoredService` trong danh sách dịch vụ phiếu (có `resultMetadata`, `testingMethodGen`)

### File liên quan

| File | Vai trò |
|------|---------|
| `gen-result-types.ts` | Types, `serializeGenResultMetadata`, `parseGenResultMetadata`, `buildGenResultValues` |
| `test-result-form.tsx` | Lưu/tải qua `handleSaveResults` / `handleServiceClick`, auto-load dịch vụ đầu |
| `gen-result-sheet.tsx` | UI nhập; readOnly hiển thị kỹ thuật + bảng gene |
| `lib/api/client.ts` | `saveServiceResult`, `ServiceResult.resultMetadata` |
| `preview/[serviceReqCode]/page.tsx` | Preview read-only từ `buildGenResultValues(specificService)` |

### Giới hạn Giai đoạn 1

- Chỉ **1 dòng gene** / dịch vụ (`geneRow` object, không phải mảng).
- Không query SQL theo tên gen hoặc phân lớp biến thể.
- JSON trong CLOB — không validate cấu trúc ở DB.

### Kiểm thử

1. Mở phiếu `resultFormType = 2`, chọn kỹ thuật, nhập bảng gene.
2. **Lưu kết quả** → F5 → dữ liệu hiển thị lại đúng.
3. **In phiếu** / **Ký số** → bảng gene có trên PDF.
4. Preview read-only (`?formType=2`) → hiển thị kỹ thuật + gene đã lưu.
5. Sau khi ký số → mở lại phiếu → đọc được từ `StoredService` (fallback khi GET result bị chặn).

---

## Giai đoạn 2 — Bảng `BML_GEN_SSR_GENE_ROWS`

### Khi nào triển khai

- UI cho phép **thêm/xóa nhiều dòng** gene (STT 1, 2, 3…).
- Cần **báo cáo/thống kê** theo gene hoặc phân lớp biến thể.
- Cần **audit theo từng dòng**.
- Tích hợp HIS/LIS cần field có cấu trúc, không qua JSON blob.

### DDL đề xuất (Oracle)

```sql
-- plan/sql/GEN3_01_ddl_gen_ssr_gene_rows.sql
CREATE TABLE BML_GEN_SSR_GENE_ROWS (
    ID                     VARCHAR2(36)   NOT NULL,
    STORED_SR_SERVICE_ID   VARCHAR2(36)   NOT NULL,
    ROW_ORDER              NUMBER(5)      NOT NULL,
    GENE_NAME              NVARCHAR2(200),
    STATUS                 NVARCHAR2(200),
    POSITION               NVARCHAR2(500),
    NUCLEOTIDE_CHANGE      NVARCHAR2(1000),
    VARIANT_CLASSIFICATION NVARCHAR2(500),
    CREATED_AT             TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    UPDATED_AT             TIMESTAMP,
    CREATED_BY             VARCHAR2(36),
    UPDATED_BY             VARCHAR2(36),
    CONSTRAINT PK_GEN_SSR_GENE_ROWS PRIMARY KEY (ID),
    CONSTRAINT FK_GEN_SSR_GENE_SVC FOREIGN KEY (STORED_SR_SERVICE_ID)
        REFERENCES BML_STORED_SR_SERVICES (ID) ON DELETE CASCADE
);

CREATE INDEX IDX_GEN_SSR_GENE_SVC ON BML_GEN_SSR_GENE_ROWS (STORED_SR_SERVICE_ID);
CREATE UNIQUE INDEX UQ_GEN_SSR_GENE_ORDER ON BML_GEN_SSR_GENE_ROWS (STORED_SR_SERVICE_ID, ROW_ORDER);
```

### Backend (NestJS)

1. Entity `GenSsrGeneRow` → `BML_GEN_SSR_GENE_ROWS`
2. Repository + module `gen-ssr-gene-row`
3. Mở rộng `EnterResultDto`:

   ```typescript
   geneRows?: Array<{
     rowOrder: number;
     geneName?: string;
     status?: string;
     position?: string;
     nucleotideChange?: string;
     variantClassification?: string;
   }>;
   ```

4. `enterResult`: replace-all rows cho `serviceId` (transaction).
5. `getResult` / map stored service: trả `geneRows[]`.
6. Audit log: snapshot `geneRows` trong `buildResultSaveSnapshot`.

### Backfill từ Giai đoạn 1

```sql
-- plan/sql/GEN3_02_backfill_from_result_metadata.sql
-- Parse RESULT_METADATA.genResult.geneRow → insert ROW_ORDER = 1
-- Chỉ khi chưa có dòng trong BML_GEN_SSR_GENE_ROWS cho service đó
```

### Frontend

1. `GenResultValues.geneRow` → `geneRows: GenGeneRow[]`
2. `GenResultSheet`: nút thêm/xóa dòng, STT động
3. API: gửi `geneRows` thay vì (hoặc song song) `resultMetadata`
4. **Tương thích ngược:** đọc `geneRows` từ API trước; không có thì fallback `parseGenResultMetadata(resultMetadata)`

### Giai đoạn chuyển tiếp (khuyến nghị)

```
Tuần 1–2: DDL + API ghi/đọc geneRows; FE vẫn dual-write resultMetadata
Tuần 3:   FE chuyển sang geneRows; chạy backfill DB
Tuần 4:   Bỏ ghi resultMetadata.genResult; giữ đọc fallback 6 tháng
```

### Checklist triển khai Giai đoạn 2

- [ ] DDL idempotent (`plan/sql/GEN3_01_...`)
- [ ] Entity, repository, service
- [ ] Mở rộng `enterResult` / `getResult`
- [ ] Backfill + verify (`GEN3_03_verify.sql`)
- [ ] FE: mảng `geneRows`, UI nhiều dòng
- [ ] Cập nhật `gen-digital-sign-implementation.md` nếu layout bảng thay đổi
- [ ] Kiểm thử: lưu nhiều dòng, ký số PDF, preview, báo cáo (nếu có)

### Không làm ở Giai đoạn 2

- Không thêm 5 cột gene vào `BML_STORED_SR_SERVICES` (dead-end khi cần N dòng).
- Không xóa `RESULT_METADATA` ngay — dùng fallback và audit.

---

## Liên quan

- Ký số EMR: `fe-gpb/docs/gen-digital-sign-implementation.md`
- Migration kỹ thuật GEN2: `plan/sql/GEN2_01_ddl_testing_method_gen_service.sql`
