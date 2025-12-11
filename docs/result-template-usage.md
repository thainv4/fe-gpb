# 📝 Hướng dẫn sử dụng Quản lý Mẫu Kết Quả

## 🎯 Tổng quan
Module quản lý mẫu kết quả cho phép bạn tạo, chỉnh sửa, tìm kiếm và xóa các mẫu kết quả xét nghiệm. Các mẫu này có thể được sử dụng lại trong quá trình nhập kết quả xét nghiệm.

## 🚀 Các tính năng chính

### 1. **Tạo mẫu mới**
- Click nút **"Thêm mẫu"** ở góc trên bên phải
- Nhập nội dung mẫu kết quả (tối đa 2000 ký tự)
- Có thể sử dụng placeholder như `{{param1}}`, `{{param2}}` để dễ dàng thay thế sau này
- Click **"Tạo mới"** để lưu

### 2. **Tìm kiếm mẫu**
- Sử dụng ô tìm kiếm để tìm theo nội dung mẫu
- Kết quả sẽ được lọc theo thời gian thực

### 3. **Chỉnh sửa mẫu**
- Click icon **✏️ Edit** trên hàng mẫu muốn chỉnh sửa
- Cập nhật nội dung
- Click **"Cập nhật"** để lưu thay đổi

### 4. **Sao chép mẫu**
- Click icon **📋 Copy** để sao chép nội dung mẫu vào clipboard
- Có thể paste vào bất kỳ đâu

### 5. **Xóa mẫu**
- Click icon **🗑️ Trash** để xóa mẫu
- Xác nhận trong dialog để hoàn tất xóa

## 📋 Các mẫu kết quả gợi ý

### Mẫu 1: Xét nghiệm máu tổng quát
```
KẾT QUẢ XÉT NGHIỆM MÁU TỔNG QUÁT

1. Hồng cầu (RBC): {{rbc}} T/L
2. Bạch cầu (WBC): {{wbc}} G/L
3. Hemoglobin (HGB): {{hgb}} g/L
4. Hematocrit (HCT): {{hct}} %
5. Tiểu cầu (PLT): {{plt}} G/L

KẾT LUẬN:
{{conclusion}}
```

### Mẫu 2: Xét nghiệm sinh hóa
```
KẾT QUẢ XÉT NGHIỆM SINH HÓA

1. Glucose: {{glucose}} mmol/L
2. Cholesterol toàn phần: {{cholesterol}} mmol/L
3. Triglyceride: {{triglyceride}} mmol/L
4. HDL-C: {{hdl}} mmol/L
5. LDL-C: {{ldl}} mmol/L
6. SGOT (AST): {{sgot}} U/L
7. SGPT (ALT): {{sgpt}} U/L
8. Creatinine: {{creatinine}} µmol/L
9. Urea: {{urea}} mmol/L

NHẬN XÉT:
{{comment}}
```

### Mẫu 3: Xét nghiệm nước tiểu
```
KẾT QUẢ XÉT NGHIỆM NƯỚC TIỂU

A. TÍNH CHẤT VẬT LÝ:
- Màu sắc: {{color}}
- Độ trong: {{clarity}}
- pH: {{ph}}
- Tỷ trọng: {{specific_gravity}}

B. HÓA SINH:
- Protein: {{protein}}
- Glucose: {{glucose}}
- Ketone: {{ketone}}
- Bilirubin: {{bilirubin}}
- Urobilinogen: {{urobilinogen}}
- Máu: {{blood}}
- Nitrite: {{nitrite}}

C. TRẦM TÍCH:
- Hồng cầu: {{rbc}} /HPF
- Bạch cầu: {{wbc}} /HPF
- Tế bào biểu mô: {{epithelial}} /HPF
- Vi khuẩn: {{bacteria}}

KẾT LUẬN:
{{conclusion}}
```

### Mẫu 4: Xét nghiệm đông máu
```
KẾT QUẢ XÉT NGHIỆM ĐÔNG MÁU

1. PT (Prothrombin Time): {{pt}} giây
   - INR: {{inr}}
2. APTT: {{aptt}} giây
3. Fibrinogen: {{fibrinogen}} g/L
4. D-Dimer: {{d_dimer}} mg/L

ĐÁNH GIÁ:
{{assessment}}
```

### Mẫu 5: Xét nghiệm Hormone giáp
```
KẾT QUẢ XÉT NGHIỆM HORMONE GIÁP

1. TSH: {{tsh}} mIU/L
2. FT3: {{ft3}} pmol/L
3. FT4: {{ft4}} pmol/L
4. Anti-TPO: {{anti_tpo}} IU/mL
5. Anti-Tg: {{anti_tg}} IU/mL

KẾT LUẬN:
{{conclusion}}
```

### Mẫu 6: Xét nghiệm viêm gan
```
KẾT QUẢ XÉT NGHIỆM VIÊM GAN

A. VIÊM GAN B:
- HBsAg: {{hbsag}}
- Anti-HBs: {{anti_hbs}}
- HBeAg: {{hbeag}}
- Anti-HBe: {{anti_hbe}}
- Anti-HBc: {{anti_hbc}}

B. VIÊM GAN C:
- Anti-HCV: {{anti_hcv}}

KẾT LUẬN:
{{conclusion}}
```

### Mẫu 7: Xét nghiệm Marker ung thư
```
KẾT QUẢ XÉT NGHIỆM MARKER UNG THƯ

1. AFP (Alpha-fetoprotein): {{afp}} ng/mL
2. CEA (Carcinoembryonic Antigen): {{cea}} ng/mL
3. CA 19-9: {{ca_19_9}} U/mL
4. CA 125: {{ca_125}} U/mL
5. PSA (nam): {{psa}} ng/mL

NHẬN XÉT:
{{comment}}
```

### Mẫu 8: Xét nghiệm COVID-19
```
KẾT QUẢ XÉT NGHIỆM COVID-19

Phương pháp: {{method}}
Loại mẫu: {{sample_type}}
Ngày lấy mẫu: {{sample_date}}

KẾT QUẢ:
- SARS-CoV-2: {{result}}

KẾT LUẬN:
{{conclusion}}

Khuyến cáo:
{{recommendation}}
```

## 💡 Mẹo sử dụng

1. **Sử dụng placeholder**: Dùng cú pháp `{{tên_biến}}` để đánh dấu các vị trí cần điền thông tin cụ thể
2. **Đặt tên placeholder rõ ràng**: Sử dụng tên có ý nghĩa như `{{glucose}}`, `{{blood_pressure}}` thay vì `{{param1}}`
3. **Tổ chức mẫu theo nhóm**: Chia nội dung thành các phần rõ ràng (A, B, C hoặc 1, 2, 3)
4. **Bao gồm đơn vị đo**: Luôn ghi rõ đơn vị đo như mmol/L, g/L, U/L
5. **Thêm phần kết luận**: Mỗi mẫu nên có phần kết luận hoặc nhận xét

## 🔄 Cách sử dụng mẫu trong kết quả xét nghiệm

1. Mở trang **Kết quả xét nghiệm**
2. Chọn một mẫu từ danh sách
3. Click **"Sao chép"** để copy nội dung
4. Paste vào ô nhập kết quả
5. Thay thế các placeholder bằng giá trị thực tế
6. Lưu kết quả

## 📞 Hỗ trợ

Nếu gặp vấn đề khi sử dụng module quản lý mẫu kết quả, vui lòng liên hệ với bộ phận IT để được hỗ trợ.

