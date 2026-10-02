# KSK LAN Entry System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống Web App chạy mạng LAN (Node.js + SQLite) cho phép nhiều phòng khám nhập liệu đồng thời kết quả khám sức khỏe định kỳ cho bệnh nhân và xuất file Excel chuẩn 100% theo mẫu 108 cột.

**Architecture:** Máy chủ chạy Node.js Express với CSDL SQLite (chế độ WAL). Các máy trạm phòng khám truy cập qua trình duyệt qua IP mạng nội bộ. Dữ liệu được đồng bộ thời gian thực qua Server-Sent Events (SSE). Module ExcelJS xử lý xuất/nhập file Excel bám sát cấu trúc 4 dòng tiêu đề và 108 cột của file phôi mẫu.

**Tech Stack:** Node.js v26, Express.js, better-sqlite3 / sqlite3, ExcelJS, Vanilla HTML5/CSS3/JavaScript (không phụ thuộc bundler cồng kềnh, tải trang tức thì trong mạng LAN).

## Global Constraints
- Hệ điều hành máy chủ: Windows.
- Cổng ứng dụng: Port 3000 (tự động phát hiện IP LAN v4).
- File Excel mẫu nguồn: `D:\WorkSpace\HC\temp\Danh sách khám định kỳ.xlsx`.
- Mã hóa dữ liệu: UTF-8.
- Chế độ SQLite: WAL mode để hỗ trợ đọc/ghi đồng thời không khóa file.

---

### Task 1: Project Scaffolding & Database Schema

**Files:**
- Create: `package.json`
- Create: `src/db/database.js`
- Create: `src/db/initSchema.js`
- Create: `src/db/seedLookups.js`
- Test: `tests/db.test.js`

**Interfaces:**
- Consumes: `Danh sách khám định kỳ.xlsx` (để trích xuất các danh mục Đối tượng KSK, Địa chỉ, Nghề nghiệp).
- Produces: `getDb()` trả về đối tượng kết nối SQLite đã kích hoạt WAL mode và đầy đủ các bảng `patients`, `the_luc`, `kham_lam_sang`, `can_lam_sang`, `ket_luan`, `lookup_data`.

- [ ] **Step 1: Khởi tạo package.json và cài đặt thư viện**
  - Cài đặt `express`, `sqlite3` (hoặc `better-sqlite3`), `exceljs`, `cors`, `multer`.
- [ ] **Step 2: Viết script khởi tạo cấu trúc bảng SQLite (DDL)**
  - Bảng `patients`: id, stt, ho_ten, ngay_sinh, gioi_tinh, cccd, ngay_cap_cccd, noi_cap_cccd, so_the_bhyt, sdt, tinh_tp, xa_phuong, nghe_nghiep, noi_cong_tac, doi_tuong_ksk, dot_kham, trang_thai, created_at.
  - Bảng `the_luc`: patient_id, ngay_do, can_nang, chieu_cao, mach, ha_tam_thu, ha_tam_truong, vong_nguc, phan_loai_the_luc, nguoi_kham, updated_at.
  - Bảng `kham_lam_sang`: toàn bộ các trường Nội khoa (9 phân hệ), Ngoại, Mắt, TMH, RHM, Da liễu, Sản phụ khoa.
  - Bảng `can_lam_sang`: toàn bộ các trường xét nghiệm máu, nước tiểu, CĐHA (Điện tim, Xquang, Siêu âm, khác).
  - Bảng `ket_luan`: phan_loai_suc_khoe, mo_ta_benh_tat, ma_icd10, loi_dan_bac_si, ngay_ket_luan, bac_si_ket_luan, ma_cskcb.
- [ ] **Step 3: Viết script nạp danh mục (seedLookups.js)**
  - Đọc các sheet `DM Mã đối tượng KSK`, `DM Địa chỉ`, `DM Nghề nghiệp` từ file template vào bảng `lookup_data` để làm dữ liệu gợi ý auto-complete.
- [ ] **Step 4: Viết và chạy test kiểm tra Database kết nối & ghi/đọc dữ liệu**
  - Chạy `node tests/db.test.js` kiểm tra tạo hồ sơ mẫu và truy vấn thành công.
- [ ] **Step 5: Commit**
  - `git add . && git commit -m "feat(db): initialize database schema and lookup seed data"`

---

### Task 2: Backend REST APIs & Real-time Server-Sent Events (SSE)

**Files:**
- Create: `src/server.js`
- Create: `src/routes/patientRoutes.js`
- Create: `src/routes/examRoutes.js`
- Create: `src/routes/lookupRoutes.js`
- Create: `src/services/sseService.js`
- Test: `tests/api.test.js`

**Interfaces:**
- Consumes: `src/db/database.js`.
- Produces: 
  - `GET /api/patients?room=...&date=...&q=...`
  - `POST /api/patients` (Thêm mới bệnh nhân)
  - `GET /api/patients/:id` (Lấy toàn bộ thông tin các chuyên khoa của bệnh nhân)
  - `PUT /api/patients/:id/:module` (Lưu kết quả chuyên khoa: the-luc, noi-khoa, ngoai-khoa, mat, tmh, rhm, da-lieu, san-phu-khoa, can-lam-sang, ket-luan)
  - `GET /api/lookups?type=...`
  - `GET /api/events` (SSE stream phát broadcast sự kiện `PATIENT_ADDED`, `EXAM_UPDATED`)

- [ ] **Step 1: Xây dựng sseService quản lý client SSE**
  - Quản lý danh sách kết nối SSE, hàm `broadcast(event, data)`.
- [ ] **Step 2: Viết CRUD Router cho bệnh nhân (patientRoutes)**
  - Tìm kiếm theo Họ tên, CCCD, STT; lọc theo trạng thái khám của từng phòng.
- [ ] **Step 3: Viết Router cập nhật kết quả từng chuyên khoa (examRoutes)**
  - Sử dụng SQLite `INSERT OR REPLACE` (UPSERT) cho từng bảng chuyên khoa tương ứng với `patient_id`.
  - Tự động phát sự kiện SSE khi lưu kết quả để các màn hình khác cập nhật ngay.
- [ ] **Step 4: Viết Router tra cứu danh mục (lookupRoutes)**
  - Trả về danh sách Tỉnh/TP, Xã/Phường, Nghề nghiệp, Mã đối tượng KSK.
- [ ] **Step 5: Viết và chạy kiểm thử tự động API**
  - Kiểm tra các luồng thêm bệnh nhân, cập nhật khám thể lực, cập nhật khám mắt, phát SSE.
- [ ] **Step 6: Commit**
  - `git add . && git commit -m "feat(api): add REST endpoints and SSE real-time sync"`

---

### Task 3: Excel Engine (ExcelJS) - Clone Chuẩn 108 Cột & Import Đoàn

**Files:**
- Create: `src/services/excelEngine.js`
- Create: `src/routes/excelRoutes.js`
- Test: `tests/excel.test.js`

**Interfaces:**
- Consumes: Template gốc `D:\WorkSpace\HC\temp\Danh sách khám định kỳ.xlsx` và dữ liệu từ Database.
- Produces:
  - `GET /api/excel/export?dot_kham=...` -> stream file `.xlsx` chuẩn 108 cột.
  - `POST /api/excel/import` -> đọc file Excel danh sách nhân viên công ty, thêm hàng loạt vào bảng `patients`.

- [ ] **Step 1: Viết module nạp danh sách công ty (Import Excel)**
  - Đọc file tải lên với các cột: Họ tên, Ngày sinh, Giới tính, CCCD, SĐT, Nơi công tác...
  - Validate định dạng ngày tháng, giới tính.
  - Lưu vào database và broadcast SSE.
- [ ] **Step 2: Viết module xuất dữ liệu (Export Excel 108 cột)**
  - Mở file workbook phôi mẫu `Danh sách khám định kỳ.xlsx`.
  - Lấy sheet đầu tiên `Ket qua KSKDK`.
  - Giữ nguyên vẹn 4 dòng đầu tiên (dòng 1: Tiêu đề lớn, dòng 2: Nhóm, dòng 3: Chuyên khoa con, dòng 4: Tên cột).
  - Điền từng dòng dữ liệu từ dòng 5 trở đi theo đúng thứ tự 108 cột.
  - Map chuẩn xác dữ liệu:
    + Giới tính: 1 - Nam, 2 - Nữ
    + Phân loại các chuyên khoa: số nguyên từ 1 đến 5
    + Ngày tháng: `DD/MM/YYYY`
    + Thị lực: số nguyên (ví dụ 10)
    + Mã ICD-10 và mô tả bệnh.
- [ ] **Step 3: Viết test tự động xuất file Excel và kiểm tra tính toàn vẹn**
  - Xuất ra file test trong thư mục tạm, mở lại file kiểm tra số cột = 108, số dòng hợp lệ, các ô dữ liệu không bị lệch.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "feat(excel): implement 108-column template export and batch import engine"`

---

### Task 4: Web UI Frontend - Khung Giao Diện & Điều Hướng Phòng Khám

**Files:**
- Create: `public/index.html`
- Create: `public/css/style.css`
- Create: `public/js/app.js`
- Create: `public/js/sse.js`
- Create: `public/js/roomManager.js`

**Interfaces:**
- Consumes: `/api/events` (SSE), `/api/patients`.
- Produces: Khung giao diện Web Responsive, cơ chế chọn/đổi phòng khám và lưu trạng thái vào `localStorage`.

- [ ] **Step 1: Thiết kế giao diện CSS chuyên nghiệp (Medical Theme)**
  - Tông màu y tế hiện đại (Cyan/Blue #0284c7, Emerald #059669, Slate dark mode/light mode).
  - Thanh header hiển thị: Tên phòng khám hiện tại, Địa chỉ IP máy chủ LAN, Trạng thái kết nối SSE (Xanh/Đỏ), Nút đổi phòng.
- [ ] **Step 2: Xây dựng màn hình chọn phòng làm việc (Room Switcher Modal)**
  - Hiển thị danh sách 11 phòng khám trực quan dạng Card to rõ:
    1. Tiếp đón & Hành chính
    2. Khám Thể lực
    3. Khám Nội khoa
    4. Khám Ngoại khoa
    5. Khám Mắt
    6. Khám Tai Mũi Họng
    7. Khám Răng Hàm Mặt
    8. Khám Da Liễu
    9. Khám Sản Phụ Khoa
    10. Cận lâm sàng (Xét nghiệm & CĐHA)
    11. Phòng Kết luận & Quản trị
- [ ] **Step 3: Viết module sse.js duy trì kết nối thời gian thực**
  - Tự động kết nối lại khi mất mạng (auto-reconnect).
  - Kích hoạt sự kiện tải lại danh sách khi nhận thông báo.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "feat(ui): add core layout, medical theme and workstation room manager"`

---

### Task 5: Web UI Frontend - Module Tiếp Đón & Hành Chính

**Files:**
- Create: `public/js/modules/reception.js`
- Modify: `public/index.html`
- Modify: `public/css/style.css`

**Interfaces:**
- Consumes: `/api/patients`, `/api/lookups`, `/api/excel/import`.
- Produces: Form nhập hồ sơ hành chính lẻ và Modal import đoàn Excel.

- [ ] **Step 1: Xây dựng Form nhập hành chính lẻ**
  - Các ô: Họ tên, Ngày sinh (có tự động format DD/MM/YYYY), Giới tính, Số CCCD, Ngày cấp, Nơi cấp, Mã thẻ BHYT, SĐT, Nơi công tác, Đợt khám.
  - Auto-complete danh mục: Tỉnh/TP, Xã/Phường, Nghề nghiệp, Đối tượng KSK.
  - Phím Enter chuyển tiếp giữa các ô.
- [ ] **Step 2: Xây dựng tính năng Import danh sách đoàn KSK từ Excel**
  - Nút "Nạp file Excel danh sách công ty".
  - Xem trước dữ liệu (Preview 5 dòng đầu) trước khi xác nhận lưu.
- [ ] **Step 3: Danh sách tiếp đón trong ngày**
  - Bảng tổng hợp số lượng bệnh nhân đã tiếp đón, nút In phiếu tiếp đón.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "feat(ui): implement reception and batch excel import module"`

---

### Task 6: Web UI Frontend - Màn Hình Nhập Liệu Chuyên Khoa

**Files:**
- Create: `public/js/modules/clinicExam.js`
- Modify: `public/index.html`
- Modify: `public/css/style.css`

**Interfaces:**
- Consumes: `/api/patients/:id`, `/api/patients/:id/:module`.
- Produces: Màn hình khám chuyên biệt theo từng phòng: Cột trái (Hàng đợi chờ khám) + Cột phải (Form nhập liệu chuyên khoa).

- [ ] **Step 1: Cột danh sách hàng đợi (Queue Sidebar)**
  - Hiển thị danh sách bệnh nhân chờ khám trong ngày.
  - Ô tìm kiếm gõ lọc tức thì (Họ tên, CCCD, STT).
  - Bộ lọc: "Tất cả", "Chờ phòng mình khám", "Đã khám xong".
- [ ] **Step 2: Form nhập liệu chuyên khoa tương ứng**
  - *Thể lực*: Cân nặng, Chiều cao, Tự động tính BMI tham khảo, Mạch, Huyết áp tâm thu/trương, Vòng ngực, Phân loại (1-5).
  - *Mắt*: Thị lực không kính/có kính (Mắt phải, Mắt trái), Các bệnh về mắt, Phân loại (1-5), Bác sĩ.
  - *Tai Mũi Họng*: Thính lực thường/thầm 2 bên, Bệnh TMH, Phân loại (1-5), Bác sĩ.
  - *Răng Hàm Mặt*: Hàm trên, Hàm dưới, Bệnh RHM, Phân loại, Bác sĩ.
  - *Nội khoa*: Tuần hoàn, Hô hấp, Tiêu hóa, Thận tiết niệu, Nội tiết, Cơ xương khớp, Thần kinh, Tâm thần.
  - *Ngoại, Da Liễu, Sản Phụ Khoa* (tự ẩn nếu bệnh nhân Nam).
  - *Cận lâm sàng*: Nhập chỉ số máu, sinh hóa, nước tiểu, kết quả X-quang, Siêu âm, Điện tim.
- [ ] **Step 3: Tính năng trợ lý nhập nhanh cho Bác sĩ**
  - Nút bấm **"Điền nhanh: Bình thường"** (tự động điền kết quả chuẩn cho người khỏe mạnh).
  - Tự động ghi nhớ Tên Bác sĩ khám vào `localStorage` của máy đó.
  - Phím tắt **Ctrl + S** hoặc bấm **"Lưu & Tiếp tục ca sau"**: Lưu dữ liệu và tự động chọn bệnh nhân tiếp theo trong hàng đợi.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "feat(ui): implement fast clinic exam forms with auto-fill and hotkeys"`

---

### Task 7: Web UI Frontend - Phòng Kết Luận & Xuất Excel 108 Cột

**Files:**
- Create: `public/js/modules/conclusion.js`
- Modify: `public/index.html`
- Modify: `public/css/style.css`

**Interfaces:**
- Consumes: `/api/patients/:id/summary`, `/api/patients/:id/ket-luan`, `/api/excel/export`.
- Produces: Màn hình tổng hợp kết quả toàn diện, chẩn đoán ICD-10, ký kết luận và nút xuất Excel 108 cột.

- [ ] **Step 1: Bảng tổng quan tiến độ khám của bệnh nhân**
  - Hiển thị lưới trạng thái: Thể lực, Nội, Ngoại, Mắt, TMH, RHM, Da liễu, Phụ khoa, Cận lâm sàng.
  - Cảnh báo rõ ràng nếu bệnh nhân chưa khám đủ các phòng.
  - Xem nhanh chi tiết kết quả từng phòng khi bấm vào từng mục.
- [ ] **Step 2: Form nhập kết luận sức khỏe**
  - Phân loại sức khỏe chung (Loại 1 đến Loại 5).
  - Mô tả bệnh tật.
  - Ô tra cứu gợi ý mã bệnh ICD-10.
  - Lời dặn của bác sĩ.
  - Bác sĩ kết luận & Mã cơ sở KCB.
- [ ] **Step 3: Nút tải file Excel kết quả KSK**
  - Lọc theo Đợt khám / Ngày khám.
  - Bấm nút "Xuất file Excel báo cáo": Trình duyệt tải về file `.xlsx` chuẩn 108 cột tức thì.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "feat(ui): implement conclusion module and one-click excel export"`

---

### Task 8: Windows 1-Click Launcher & Tự Động Nhận Diện IP Mạng LAN

**Files:**
- Create: `scripts/getLanIp.js`
- Create: `Chay_He_Thong_KSK.bat`
- Create: `scripts/createDesktopShortcut.vbs`

**Interfaces:**
- Consumes: Network interfaces của máy chủ Windows.
- Produces: File khởi động 1 chạm `Chay_He_Thong_KSK.bat` hiển thị IP LAN và tự mở trình duyệt.

- [ ] **Step 1: Viết script Node.js / PowerShell dò tìm IP LAN chính xác**
  - Bỏ qua loopback (127.0.0.1) và IP ảo (VirtualBox/VMware/APIPA 169.254.x.x).
  - Tìm ra địa chỉ IPv4 nội bộ (ví dụ: `192.168.1.15`).
- [ ] **Step 2: Tạo file thực thi `Chay_He_Thong_KSK.bat`**
  - Tự động chạy `npm start` ngầm.
  - Tự động mở Google Chrome hoặc Microsoft Edge tại `http://localhost:3000`.
  - Màn hình Console hiển thị thông tin to rõ:
    ```
    ===============================================================
       HỆ THỐNG NHẬP LIỆU KHÁM SỨC KHỎE ĐỊNH KỲ (MẠNG LAN)
    ===============================================================
       Máy chủ đang chạy tại: http://localhost:3000
       
       CÁC PHÒNG KHÁM KHÁC MỞ TRÌNH DUYỆT TRUY CẬP ĐỊA CHỈ:
       👉  http://192.168.1.15:3000
    ===============================================================
    ```
- [ ] **Step 3: Kiểm tra khởi động thử nghiệm script bat**
  - Xác nhận server bật và IP hiển thị chuẩn xác.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "feat(launcher): add one-click windows launcher with auto lan ip detection"`

---

### Task 9: Kiểm Thử Toàn Diện (End-to-End Test) & Bàn Giao

**Files:**
- Create: `tests/e2e.test.js`
- Modify: `README.md`

**Interfaces:**
- Consumes: Toàn bộ hệ thống từ Tiếp đón -> Các phòng khám -> Kết luận -> Xuất Excel.
- Produces: File kết quả Excel xuất ra khớp 100% với file template `Danh sách khám định kỳ.xlsx`.

- [ ] **Step 1: Chạy kịch bản nhập liệu giả lập cho 3 bệnh nhân**
  - Bệnh nhân 1: Nam, khám đầy đủ tất cả các phòng, kết luận Loại 1.
  - Bệnh nhân 2: Nữ, khám có bệnh về mắt và răng, kết luận Loại 2.
  - Bệnh nhân 3: Mới tiếp đón và khám thể lực, chưa kết luận.
- [ ] **Step 2: Xuất file Excel và kiểm tra đối chiếu**
  - Mở file vừa xuất bằng thư viện kiểm thử:
    + Đảm bảo 4 dòng tiêu đề nguyên vẹn.
    + Đảm bảo đủ 108 cột.
    + Đảm bảo các sheet danh mục còn nguyên vẹn.
- [ ] **Step 3: Viết tài liệu hướng dẫn sử dụng nhanh trong `README.md`**
  - Hướng dẫn máy chủ: nhấp đúp file bat.
  - Hướng dẫn các phòng khám: mở link IP và chọn phòng.
  - Hướng dẫn phím tắt và xuất Excel.
- [ ] **Step 4: Commit**
  - `git add . && git commit -m "docs: finalize user manual and e2e verification tests"`
