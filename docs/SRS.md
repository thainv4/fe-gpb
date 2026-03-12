# Tài liệu SRS – Hệ thống LIS GPB (Bạch Mai)

## 1. Giới thiệu

### 1.1 Mục đích tài liệu
Tài liệu này mô tả yêu cầu phần mềm cho **Hệ thống Thông tin Phòng Xét nghiệm – Giải phẫu bệnh (LIS GPB)** của Bệnh viện Bạch Mai, dùng làm cơ sở cho phát triển, nghiệm thu và bảo trì.

### 1.2 Phạm vi sản phẩm
- **Tên dự án:** Bạch Mai LIS GPB (bach-mai-lis-gpb).
- **Mô tả:** Ứng dụng web quản lý quy trình xét nghiệm Giải phẫu bệnh: từ tiếp nhận chỉ định, bàn giao mẫu, đến nhập/ký duyệt kết quả và in phiếu/PDF. Hệ thống hỗ trợ tích hợp HIS, quản lý người dùng theo phòng/khoa và phân quyền theo vai trò/loại khoa.

### 1.3 Định nghĩa và từ viết tắt
| Thuật ngữ | Giải thích |
|-----------|------------|
| LIS | Laboratory Information System – Hệ thống thông tin phòng xét nghiệm |
| GPB | Giải phẫu bệnh |
| HIS | Hospital Information System – Hệ thống thông tin bệnh viện |
| SRS | Software Requirements Specification |
| Y lệnh / Mã y lệnh | Mã chỉ định xét nghiệm (hisServiceReqCode / serviceReqCode) |
| Barcode / Mã bệnh phẩm | Mã tiếp nhận mẫu (receptionCode) |
| Workflow | Luồng trạng thái mẫu (thu mẫu → bàn giao → … → hoàn thành) |

### 1.4 Tài liệu tham chiếu
- `package.json` – công nghệ và phiên bản.
- Giao diện và route trong `src/app`, `src/components/layout/dashboard-layout.tsx`.

---

## 2. Mô tả tổng quan

### 2.1 Mô tả sản phẩm
Hệ thống là ứng dụng web (front-end) kết nối API backend, cung cấp:

- **Xác thực và phân quyền:** Đăng nhập, đổi mật khẩu, phân quyền theo vai trò (admin/user) và theo loại khoa/phòng (resultFormType/departmentType).
- **Quy trình xét nghiệm:** Chỉ định xét nghiệm → Bàn giao mẫu → Nhập và ký duyệt kết quả.
- **Quản lý danh mục:** Khoa, phòng, loại mẫu, mẫu kết quả, phương pháp nhuộm, v.v.
- **Quản lý người dùng và phân quyền phòng:** User, gán phòng làm việc (user-rooms), lọc theo khoa.
- **Tích hợp:** HIS (token, gọi API), EMR ký số, in mã vạch/QR, xuất PDF kết quả.

### 2.2 Chức năng sản phẩm (tóm tắt)
- Đăng nhập / đăng ký / đổi mật khẩu.
- Trang chủ (Dashboard).
- Chỉ định xét nghiệm: tìm/tạo y lệnh, chọn loại/vị trí bệnh phẩm, sinh barcode, in mã QR.
- Bàn giao mẫu: chọn đơn vị thực hiện, trạng thái chuyển tiếp, ghi chú, phương pháp nhuộm / phương pháp lấy mẫu (tùy loại form).
- Kết quả xét nghiệm: nhập kết quả (form GPB / form Gen), mẫu kết quả, ký số, xuất PDF, đính kèm file.
- Danh mục: Khoa, Phòng, Loại mẫu, Mẫu kết quả, Phương pháp nhuộm.
- Người dùng và Phân quyền phòng: CRUD user, gán phòng, lọc user theo khoa, phân trang.
- Bảo vệ route theo vai trò và theo loại khoa (department type 3 chỉ được dashboard, chỉ định, đổi mật khẩu).

### 2.3 Đặc điểm người dùng
- **Nhân viên phòng xét nghiệm:** Sử dụng chủ yếu các màn Chỉ định, Bàn giao mẫu, Kết quả xét nghiệm.
- **Quản trị viên:** Quản lý danh mục, người dùng, phân quyền phòng.
- **Hệ thống:** Tích hợp với HIS và các dịch vụ backend (REST API).

### 2.4 Ràng buộc chung
- Giao diện web, hỗ trợ trình duyệt hiện đại.
- Backend cung cấp REST API (base URL cấu hình qua biến môi trường).
- Phân quyền và loại form phụ thuộc dữ liệu từ API (user, my-rooms, workflow states).

---

## 3. Use Case

### 3.1 UC-01: Đăng nhập
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Đăng nhập hệ thống |
| **Tác nhân** | Người dùng (chưa xác thực) |
| **Mục tiêu** | Xác thực danh tính và được cấp quyền truy cập ứng dụng |
| **Điều kiện tiên quyết** | Ứng dụng đang chạy, backend API khả dụng |
| **Luồng chính** | 1. User mở trang đăng nhập.<br>2. User nhập username và password.<br>3. User bấm Đăng nhập.<br>4. Hệ thống gọi API login, nhận token và thông tin user.<br>5. Hệ thống lưu token (và refresh token), chuyển hướng đến dashboard (hoặc trang mặc định). |
| **Luồng thay thế** | 4a. Sai thông tin: hệ thống hiển thị lỗi, user có thể nhập lại.<br>4b. Token hết hạn sau đó: hệ thống dùng refresh token để gia hạn; nếu thất bại thì chuyển về trang đăng nhập. |
| **Kết quả** | User đã xác thực, có thể truy cập các chức năng theo vai trò và loại khoa |

### 3.2 UC-02: Chỉ định xét nghiệm (Tiếp nhận & tạo mã bệnh phẩm)
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Chỉ định xét nghiệm – Tìm/tạo y lệnh và mã tiếp nhận |
| **Tác nhân** | Nhân viên phòng xét nghiệm (User hoặc Admin) |
| **Mục tiêu** | Tìm y lệnh có sẵn hoặc tạo mới mã tiếp nhận (barcode) và in mã QR |
| **Điều kiện tiên quyết** | Đã đăng nhập; đã chọn phòng làm việc (trừ khi resultFormType = 3 vẫn dùng phòng ngầm định); có quyền vào /test-indications |
| **Luồng chính** | 1. User vào trang Chỉ định xét nghiệm.<br>2. User nhập mã y lệnh hoặc barcode, nhấn Enter (hoặc tìm) để tìm y lệnh.<br>3. Hệ thống hiển thị thông tin bệnh nhân, chẩn đoán, bác sĩ chỉ định.<br>4. User chọn loại/vị trí bệnh phẩm: chọn tiền tố (T/C/F/S/G) hoặc nhập barcode thủ công (nếu resultFormType ≠ 3).<br>5. User bấm Lưu/Tạo: hệ thống tạo hoặc cập nhật stored service request và mã tiếp nhận.<br>6. User có thể bấm In mã QR để in tem QR (kích thước tem 2cm, QR phù hợp). |
| **Luồng thay thế** | 2a. Không tìm thấy: hiển thị thông báo, user nhập lại hoặc tạo mới.<br>4a. resultFormType = 3: không hiển thị lựa chọn nhập barcode thủ công, chỉ chọn tiền tố.<br>5a. Lỗi API: hiển thị lỗi, user sửa dữ liệu và thử lại. |
| **Kết quả** | Y lệnh được gắn với mã tiếp nhận (barcode); có thể in tem QR và chuyển sang bước bàn giao mẫu |

### 3.3 UC-03: Bàn giao mẫu
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Bàn giao mẫu – Xác nhận nhận mẫu và chuyển trạng thái workflow |
| **Tác nhân** | Nhân viên phòng xét nghiệm (User hoặc Admin) |
| **Mục tiêu** | Chọn y lệnh từ danh sách, điền đơn vị thực hiện/người nhận/trạng thái/ghi chú và xác nhận bàn giao |
| **Điều kiện tiên quyết** | Đã đăng nhập; có quyền vào /sample-delivery |
| **Luồng chính** | 1. User vào trang Bàn giao mẫu.<br>2. Sidebar hiển thị danh sách y lệnh theo phòng và trạng thái (API by-room-and-state). User chọn một y lệnh.<br>3. Hệ thống hiển thị form: Đơn vị thực hiện (lấy từ phòng của bản ghi workflow), Người nhận mẫu, Vị trí bệnh phẩm, Trạng thái chuyển tiếp, Thời gian nhận, Ghi chú; tùy resultFormType có thêm Phương pháp nhuộm hoặc Phương pháp lấy mẫu.<br>4. User điền/chọn đầy đủ bắt buộc, bấm Xác nhận bàn giao.<br>5. Hệ thống cập nhật stored service request (flag, staining method nếu có), cập nhật ghi chú kết quả (nếu có), gọi API chuyển trạng thái workflow (transition).<br>6. Thành công: thông báo, làm mới danh sách sidebar. |
| **Luồng thay thế** | 4a. Thiếu thông tin bắt buộc: hệ thống không gửi, hiển thị lỗi validation.<br>5a. API lỗi: hiển thị lỗi, user kiểm tra và thử lại. |
| **Kết quả** | Trạng thái workflow của y lệnh được chuyển; mẫu được ghi nhận đã bàn giao tại đơn vị thực hiện |

### 3.4 UC-04: Nhập và ký kết quả xét nghiệm
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Nhập kết quả xét nghiệm và ký số |
| **Tác nhân** | Nhân viên phòng xét nghiệm / Bác sĩ (User hoặc Admin) |
| **Mục tiêu** | Nhập nội dung kết quả (theo form GPB hoặc Gen), áp dụng mẫu kết quả, lưu và ký số, xuất PDF |
| **Điều kiện tiên quyết** | Đã đăng nhập; đã chọn phòng làm việc; có quyền vào /test-results |
| **Luồng chính** | 1. User vào Kết quả xét nghiệm, chọn/mở y lệnh (tab).<br>2. Hệ thống hiển thị form kết quả theo resultFormType (1 = GPB, 2 = Gen): mô tả, kết luận, ghi chú, khuyến nghị, phương pháp xét nghiệm (type 2), đính kèm PDF (type 2), v.v.<br>3. User có thể chọn mẫu kết quả (result template) để áp dụng nội dung.<br>4. User nhập/chỉnh sửa kết quả, bấm Lưu (nháp) hoặc Lưu và Ký số.<br>5. Khi ký số: hệ thống gọi EMR/HSM để ký; sau khi thành công, cập nhật trạng thái đã ký.<br>6. User có thể xuất PDF kết quả (form GPB hoặc Gen, có merge file đính kèm nếu type 2). |
| **Luồng thay thế** | 4a. Validation lỗi (thiếu trường bắt buộc): hiển thị lỗi, không gửi.<br>5a. Ký số thất bại: hiển thị lỗi, user kiểm tra và thử lại.<br>6a. Xuất PDF lỗi: thông báo lỗi. |
| **Kết quả** | Kết quả xét nghiệm được lưu; có thể đã ký số và xuất PDF cho bệnh nhân/bác sĩ |

### 3.5 UC-05: Quản lý phân quyền phòng
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Quản lý phân quyền phòng (user-rooms) |
| **Tác nhân** | Admin |
| **Mục tiêu** | Gán hoặc gỡ phòng làm việc cho từng user để user chỉ thấy và xử lý y lệnh thuộc phòng được gán |
| **Điều kiện tiên quyết** | Đã đăng nhập với vai trò Admin; có quyền vào /user-rooms |
| **Luồng chính** | 1. Admin vào Phân quyền phòng.<br>2. Admin chọn khoa (dropdown từ API departments), xem danh sách user (API users với departmentId, limit, offset, phân trang).<br>3. Admin chọn một user từ danh sách.<br>4. Hệ thống hiển thị danh sách phòng đã gán cho user đó và nút Thêm phòng.<br>5. Admin bấm Thêm phòng: chọn khoa → chọn phòng (từ API rooms theo department), chọn các phòng cần gán, bấm Gán → hệ thống gọi API assign rooms.<br>6. Admin có thể gỡ phòng: bấm Gỡ trên một phòng đã gán → hệ thống gọi API remove room. |
| **Luồng thay thế** | 5a. Gán thất bại: hiển thị lỗi.<br>6a. Gỡ thất bại: hiển thị lỗi. |
| **Kết quả** | User được gán đúng tập phòng làm việc; khi đăng nhập và chọn phòng, chỉ thấy dữ liệu theo phòng đó |

### 3.6 UC-06: Quản lý danh mục (Khoa, Phòng, Loại mẫu, Mẫu kết quả, Phương pháp nhuộm)
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Quản lý danh mục hệ thống |
| **Tác nhân** | Admin |
| **Mục tiêu** | Thêm/sửa/xóa các danh mục phục vụ quy trình xét nghiệm |
| **Điều kiện tiên quyết** | Đã đăng nhập với vai trò Admin; có quyền vào các route danh mục tương ứng |
| **Luồng chính** | 1. Admin vào một mục danh mục (Khoa, Phòng, Loại mẫu, Mẫu kết quả, Phương pháp nhuộm).<br>2. Hệ thống hiển thị danh sách (có tìm kiếm/ phân trang nếu API hỗ trợ).<br>3. Admin thêm mới: bấm Thêm, điền form, bấm Lưu → gọi API create.<br>4. Admin sửa: chọn bản ghi, sửa form, bấm Lưu → gọi API update.<br>5. Admin xóa: chọn bản ghi, bấm Xóa, xác nhận → gọi API delete. |
| **Luồng thay thế** | 3a–5a. API lỗi hoặc validation: hiển thị lỗi, không đóng form. |
| **Kết quả** | Danh mục được cập nhật; các màn nghiệp vụ (Chỉ định, Bàn giao, Kết quả) dùng dữ liệu mới |

### 3.7 UC-07: Đổi mật khẩu
| Thuộc tính | Mô tả |
|------------|--------|
| **Tên** | Đổi mật khẩu |
| **Tác nhân** | User đã đăng nhập |
| **Mục tiêu** | Thay đổi mật khẩu tài khoản sau khi xác thực mật khẩu hiện tại |
| **Điều kiện tiên quyết** | Đã đăng nhập |
| **Luồng chính** | 1. User vào Đổi mật khẩu (menu hoặc route /change-password).<br>2. User nhập mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới.<br>3. User bấm Đổi mật khẩu.<br>4. Hệ thống gọi API change-password; thành công thì hiển thị thông báo, có thể đăng xuất hoặc tiếp tục dùng. |
| **Luồng thay thế** | 4a. Sai mật khẩu hiện tại hoặc mật khẩu mới không đúng quy định: hiển thị lỗi, user sửa và thử lại. |
| **Kết quả** | Mật khẩu tài khoản được cập nhật |

### 3.8 Bảng tóm tắt Use Case
| Mã | Tên use case | Tác nhân chính |
|----|----------------|----------------|
| UC-01 | Đăng nhập | Người dùng |
| UC-02 | Chỉ định xét nghiệm | Nhân viên PVXN |
| UC-03 | Bàn giao mẫu | Nhân viên PVXN |
| UC-04 | Nhập và ký kết quả xét nghiệm | Nhân viên PVXN / Bác sĩ |
| UC-05 | Quản lý phân quyền phòng | Admin |
| UC-06 | Quản lý danh mục | Admin |
| UC-07 | Đổi mật khẩu | User đã đăng nhập |

---

## 4. Yêu cầu chức năng

### 4.1 Đăng nhập / Xác thực (Auth)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-AUTH-01 | Hệ thống cho phép đăng nhập bằng username và password. | Cao |
| FR-AUTH-02 | Hệ thống hỗ trợ đăng ký tài khoản (register). | Trung bình |
| FR-AUTH-03 | Sau đăng nhập, lưu token và thông tin user; chuyển hướng đến dashboard hoặc trang phù hợp. | Cao |
| FR-AUTH-04 | Có chức năng đổi mật khẩu (change-password) cho user đã đăng nhập. | Cao |
| FR-AUTH-05 | Route public (login, register, trang chủ) không yêu cầu đăng nhập; các route còn lại yêu cầu đã xác thực. | Cao |

### 4.2 Phân quyền và bảo vệ route

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-ROLE-01 | Phân quyền theo vai trò: **Admin** truy cập Danh mục + Người dùng (departments, rooms, sample-types, result-templates, staining-methods, users, user-rooms, settings). | Cao |
| FR-ROLE-02 | **User** chỉ truy cập: Dashboard, Chỉ định xét nghiệm, Bàn giao mẫu, Kết quả xét nghiệm, Đổi mật khẩu. | Cao |
| FR-ROLE-03 | Phân quyền theo **loại khoa (departmentType/resultFormType)**: Khi resultFormType = 3, user chỉ được vào Dashboard, Chỉ định xét nghiệm và Đổi mật khẩu; chuyển hướng nếu truy cập route khác. | Cao |
| FR-ROLE-04 | User chọn **phòng làm việc** (current room); dữ liệu theo phòng (my-rooms, workflow, v.v.) phụ thuộc phòng đã chọn. | Cao |

### 4.3 Trang chủ (Dashboard)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-DASH-01 | Hiển thị trang chủ với lời chào và tên user. | Cao |
| FR-DASH-02 | Hiển thị thông tin hệ thống (phiên bản, trạng thái, user hiện tại). | Trung bình |

### 4.4 Chỉ định xét nghiệm (Test Indications)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-TI-01 | Tìm kiếm y lệnh theo mã y lệnh hoặc barcode; hiển thị danh sách từ API workflow-history (by-room-and-state). | Cao |
| FR-TI-02 | Chọn loại bệnh phẩm (sample type); hỗ trợ chọn theo tiền tố (prefix) hoặc nhập barcode thủ công (khi resultFormType ≠ 3). | Cao |
| FR-TI-03 | Khi resultFormType = 3: ẩn chức năng nhập barcode thủ công, chỉ dùng chọn tiền tố. | Cao |
| FR-TI-04 | Tạo/cập nhật mã tiếp nhận (reception code); in mã QR (tem 2cm, kích thước QR phù hợp). | Cao |
| FR-TI-05 | Hiển thị thông tin bệnh nhân, bác sĩ chỉ định, chẩn đoán liên quan đến y lệnh. | Cao |
| FR-TI-06 | Khóa tiền tố theo phòng (selectPrefix) khi phòng có cấu hình. | Trung bình |

### 4.5 Bàn giao mẫu (Sample Delivery)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-SD-01 | Sidebar hiển thị danh sách y lệnh theo phòng/trạng thái (workflow-history by-room-and-state); chọn một y lệnh để xử lý. | Cao |
| FR-SD-02 | Khi chọn y lệnh, **Đơn vị thực hiện** lấy từ phòng (currentRoomId) của bản ghi workflow (API by-room-and-state), không lấy từ phòng làm việc user. | Cao |
| FR-SD-03 | Chọn trạng thái chuyển tiếp (workflow state), đơn vị nhận, người nhận, thời gian nhận mẫu. | Cao |
| FR-SD-04 | Nhập ghi chú bàn giao; chọn phương pháp nhuộm (khi resultFormType ≠ 2) hoặc phương pháp lấy mẫu (khi resultFormType = 2). | Cao |
| FR-SD-05 | Xác nhận bàn giao: cập nhật stored service request (flag, staining method), ghi chú kết quả (nếu có), gọi transition workflow. | Cao |
| FR-SD-06 | Hiển thị stateId của bước có stateOrder lớn nhất (từ API workflow action-info) tại khu vực Đơn vị thực hiện (theo thiết kế hiện tại). | Trung bình |

### 4.6 Kết quả xét nghiệm (Test Results)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-TR-01 | Mở phiếu kết quả theo y lệnh (service request); hỗ trợ nhiều tab theo từng y lệnh. | Cao |
| FR-TR-02 | Hai dạng form kết quả theo **resultFormType**: Form GPB (type 1) và Form Gen (type 2); nội dung và trường nhập khác nhau. | Cao |
| FR-TR-03 | Nhập kết quả: mô tả đại thể/vi thể, kết luận, ghi chú, khuyến nghị (tùy form); chọn phương pháp thực hiện xét nghiệm (khi type 2). | Cao |
| FR-TR-04 | Đính kèm file PDF (type 2); merge với nội dung form khi xuất PDF. | Trung bình |
| FR-TR-05 | Chọn mẫu kết quả (result template); áp dụng nội dung mẫu. | Cao |
| FR-TR-06 | Lưu nháp / Lưu và ký số; tích hợp EMR ký số (HSM). | Cao |
| FR-TR-07 | Xuất PDF kết quả (form GPB / form Gen) với layout và logo theo cấu hình. | Cao |

### 4.7 Workflow và trạng thái mẫu

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-WF-01 | Các trạng thái workflow gồm: Thu mẫu (SAMPLE_COLLECTION), Bàn giao mẫu (SAMPLE_HANDOVER), Tách mẫu (SAMPLE_SEPARATION), Chạy máy (MACHINE_RUNNING), Đánh giá kết quả (RESULT_EVALUATION), Duyệt kết quả (RESULT_APPROVAL), Hoàn thành (COMPLETED). | Cao |
| FR-WF-02 | Lọc danh sách y lệnh theo phòng, trạng thái, cờ, mã, tên bệnh nhân (API workflow-history). | Cao |
| FR-WF-03 | Chuyển trạng thái (transition) khi bàn giao mẫu hoặc khi lưu kết quả; ghi nhận người thực hiện và phòng. | Cao |

### 4.8 Danh mục (Master Data)

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-MD-01 | Quản lý **Khoa** (departments): danh sách, tìm kiếm, CRUD. | Cao |
| FR-MD-02 | Quản lý **Phòng** (rooms): theo khoa, CRUD. | Cao |
| FR-MD-03 | Quản lý **Loại mẫu** (sample types). | Cao |
| FR-MD-04 | Quản lý **Mẫu kết quả xét nghiệm** (result templates). | Cao |
| FR-MD-05 | Quản lý **Phương pháp nhuộm** (staining methods). | Cao |

### 4.9 Người dùng và phân quyền phòng

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-UR-01 | Quản lý **Người dùng** (users): danh sách có phân trang, lọc theo khoa (departmentId), tìm kiếm, limit/offset. | Cao |
| FR-UR-02 | **Phân quyền phòng** (user-rooms): chọn user, xem danh sách phòng đã gán; gán/thêm bớt phòng cho user. | Cao |
| FR-UR-03 | Gọi API departments để hiển thị dropdown khoa; gọi API users với tham số limit, offset, departmentId. | Cao |

### 4.10 Tích hợp và tiện ích

| Mã | Mô tả | Ưu tiên |
|----|--------|---------|
| FR-INT-01 | Tích hợp HIS: đăng nhập HIS, lấy token, gọi API HIS (nếu backend hỗ trợ). | Trung bình |
| FR-INT-02 | Ký số EMR (tạo và ký tài liệu HSM). | Trung bình |
| FR-INT-03 | In mã QR/Barcode cho mã tiếp nhận; kích thước và layout tem in phù hợp (ví dụ chiều cao tem 2cm). | Cao |

---

## 5. Yêu cầu phi chức năng

### 5.1 Công nghệ
- **Front-end:** Next.js 14 (App Router), React 18, TypeScript.
- **UI:** Tailwind CSS, Radix UI / shadcn-ui, Lucide icons.
- **State & Data:** Zustand (auth, current room, tabs), TanStack React Query (API, cache).
- **Form:** React Hook Form, Zod.
- **PDF / In:** jsPDF, pdf-lib, html2canvas, react-to-print, qrcode.react; API generate/merge PDF (Puppeteer) nếu có.

### 5.2 Hiệu năng và khả năng sử dụng
- Tải danh sách (users, workflow, danh mục) trong thời gian chấp nhận được; dùng phân trang khi danh sách lớn.
- Giao diện phản hồi nhanh (loading, disable nút khi đang gửi).
- Cache hợp lý (staleTime) cho API danh mục và my-rooms.

### 5.3 Bảo mật
- Token (JWT) lưu an toàn; gửi kèm header cho API.
- Route được bảo vệ theo đăng nhập và vai trò/loại khoa.
- Không lộ mật khẩu, token trong log phía client.

### 5.4 Khả năng bảo trì
- Cấu trúc thư mục rõ ràng (app, components, lib, hooks, stores).
- API tập trung trong `apiClient`; type/interface cho request/response.
- Có thể tắt lint trong bước build (ignoreDuringBuilds) để ưu tiên build ổn định; lint có thể chạy riêng.

---

## 6. Giao diện hệ thống (tóm tắt)

| Chức năng | Route |
|-----------|--------|
| Đăng nhập | `/auth/login` |
| Đăng ký | `/auth/register` |
| Đổi mật khẩu | `/change-password` |
| Trang chủ | `/dashboard` |
| Chỉ định xét nghiệm | `/test-indications` |
| Bàn giao mẫu | `/sample-delivery` |
| Kết quả xét nghiệm | `/test-results`, `/test-results/preview/[serviceReqCode]` |
| Danh mục | `/departments`, `/rooms`, `/sample-types`, `/result-templates`, `/staining-methods` |
| Người dùng | `/users`, `/user-rooms` |
| Cài đặt | `/settings` |

---

## 7. Thuộc tính hệ thống (System Attributes)

- **Khả năng mở rộng:** Thêm trạng thái workflow, thêm trường form kết quả, thêm danh mục thông qua API và cấu hình.
- **Tích hợp:** Backend REST API; HIS và EMR thông qua backend hoặc proxy.
- **Độ sẵn sàng:** Phụ thuộc backend và hạ tầng; front-end stateless, refresh token khi hết hạn.

---

## 8. Phụ lục

### 8.1 API chính (tham chiếu từ client)
- Auth: login, register, profile, changePassword, refresh.
- Users: getUsers (limit, offset, departmentId, search), getUser, createUser, updateUser, deleteUser.
- Departments: getDepartments, getDepartment, create/update/delete.
- Rooms: getRooms, getRoomsByDepartment, CRUD.
- User-rooms: getMyUserRooms (data: resultFormType, rooms), getUserRoomsByUserId, assignRoomsToUser, removeRoomFromUser.
- Workflow: getWorkflowHistory (by-room-and-state), getWorkflowActionInfo, transitionWorkflow.
- Service request / Stored service request: getServiceRequestByCode, getStoredServiceRequest, updateStoredServiceRequest, …
- Sample types, Result templates, Staining methods, Workflow states: get list/detail, CRUD (theo từng module).
- HIS, EMR, PDF: theo endpoint backend hiện có.

### 8.2 Loại form kết quả (resultFormType)
- **1 – Form GPB:** Form Giải phẫu bệnh chuẩn (mô tả, kết luận, ghi chú, phương pháp nhuộm, …).
- **2 – Form Gen:** Form Gen (khuyến nghị, phương pháp thực hiện xét nghiệm, đính kèm PDF, …).
- **3:** Loại khoa chỉ được truy cập Dashboard, Chỉ định xét nghiệm, Đổi mật khẩu; ẩn nhập barcode thủ công tại Chỉ định.
