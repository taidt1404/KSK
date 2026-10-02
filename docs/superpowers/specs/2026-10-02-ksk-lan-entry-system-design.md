# Thiết Kế Hệ Thống Nhập Liệu Khám Sức Khỏe Định Kỳ Mạng Nội Bộ (LAN KSK System)

- **Ngày tạo**: 02/10/2026
- **Dự án**: KSK - Hệ thống nhập liệu khám sức khỏe định kỳ đa phòng khám
- **Trạng thái**: Đã phê duyệt (Approved)

---

## 1. Mục Tiêu & Bối Cảnh

### 1.1. Thực trạng & Vấn đề
- Hiện tại thông tin khám sức khỏe (KSK) được ghi thủ công trên giấy tại từng phòng khám, sau đó cuối ngày phải nhập lại bằng tay vào file Excel mẫu 108 cột.
- Quy trình thủ công này tốn nhiều thời gian, dễ nhầm lẫn dữ liệu và gây chậm trễ trong việc tổng hợp, nộp báo cáo kết quả KSK.

### 1.2. Mục tiêu hệ thống
- Xây dựng phần mềm Web App chạy trên mạng nội bộ (LAN) tại cơ sở khám chữa bệnh.
- Hỗ trợ nhiều phòng khám (Tiếp nhận, Thể lực, Nội, Ngoại, Mắt, Tai Mũi Họng, Răng Hàm Mặt, Da liễu, Sản phụ khoa, Xét nghiệm, Kết luận) cùng nhập dữ liệu đồng thời cho bệnh nhân theo từng phân đoạn chuyên môn.
- Hỗ trợ tìm kiếm nhanh theo CCCD / Họ tên / Mã số và danh sách hàng đợi chờ khám trong ngày.
- Nạp danh sách đoàn KSK trước đợt khám từ file Excel (Import).
- Xuất dữ liệu ra file Excel chuẩn 100% theo mẫu gốc 108 cột ([Danh sách khám định kỳ.xlsx](file:///D:/WorkSpace/HC/temp/Danh%20sách%20khám%20định%20kỳ.xlsx)), giữ nguyên 4 dòng tiêu đề, định dạng ô và các sheet danh mục.
- Khởi động 1 chạm qua file `.bat` trên Windows, không yêu cầu cài đặt phần mềm CSDL phức tạp.

---

## 2. Kiến Trúc Kỹ Thuật

```
[Các máy tính Phòng Khám (Chrome / Edge)]
        │ 
        │ (HTTP qua LAN: http://192.168.x.x:3000)
        ▼
┌────────────────────────────────────────────────────────┐
│                   MÁY CHỦ TIẾP ĐÓN                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Express Server (Node.js v26)                     │  │
│  │  - REST API & Real-time Server-Sent Events (SSE) │  │
│  │  - ExcelJS Engine (Import / Export 108 cột)      │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ SQLite Database (data/ksk.db - WAL Mode)         │  │
│  │  - Bảng Patients (Hành chính)                    │  │
│  │  - Bảng TheLuc, LamSang, CanLamSang, KetLuan     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

- **Môi trường**: Windows OS, Node.js v26.5.1
- **Backend**: Node.js + Express.js + better-sqlite3 / sqlite3
- **Database**: SQLite lưu tại `data/ksk.db` với chế độ WAL (Write-Ahead Logging) hỗ trợ ghi đồng thời từ nhiều phòng khám.
- **Frontend**: HTML5, Vanilla CSS / Tailwind (hoặc hệ thống CSS chuyên nghiệp không phụ thuộc build phức tạp), JavaScript hiện đại.
- **Thời gian thực**: Server-Sent Events (SSE) để tự động cập nhật danh sách chờ khi có bệnh nhân mới hoặc hoàn thành phòng khám.

---

## 3. Mô Hình Dữ Liệu (Database Schema)

### 3.1. Bảng `patients` (Thông tin hành chính - Cột 1 đến 14)
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `stt` INTEGER
- `ho_ten` TEXT NOT NULL
- `ngay_sinh` TEXT NOT NULL (DD/MM/YYYY)
- `gioi_tinh` INTEGER NOT NULL (1: Nam, 2: Nữ)
- `cccd` TEXT (Mã định danh / CCCD)
- `ngay_cap_cccd` TEXT
- `noi_cap_cccd` TEXT
- `so_the_bhyt` TEXT
- `sdt` TEXT
- `tinh_tp` TEXT (Tên Tỉnh/Thành phố)
- `xa_phuong` TEXT (Tên Xã/Phường)
- `nghe_nghiep` TEXT (Tham chiếu danh mục Nghề nghiệp)
- `noi_cong_tac` TEXT (Công ty / Đơn vị)
- `doi_tuong_ksk` TEXT (Tham chiếu Phụ lục DM Đối tượng KSK)
- `dot_kham` TEXT (Tên đợt khám / Tên công ty)
- `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- `trang_thai` TEXT DEFAULT 'CHO_KHAM' ('CHO_KHAM', 'DANG_KHAM', 'HOAN_THANH')

### 3.2. Bảng `the_luc` (Cột 15 đến 22)
- `patient_id` INTEGER UNIQUE REFERENCES patients(id)
- `ngay_do` TEXT (DD/MM/YYYY)
- `can_nang` REAL (kg)
- `chieu_cao` REAL (cm)
- `mach` INTEGER (lần/phút)
- `ha_tam_thu` INTEGER (mmHg)
- `ha_tam_truong` INTEGER (mmHg)
- `vong_nguc` REAL (cm)
- `phan_loai_the_luc` INTEGER (1: Rất khỏe, 2: Khỏe, 3: TB, 4: Yếu, 5: Rất yếu)
- `nguoi_kham` TEXT
- `updated_at` DATETIME

### 3.3. Bảng `kham_lam_sang` (Cột 23 đến 68)
- `patient_id` INTEGER UNIQUE REFERENCES patients(id)
- **Nội khoa**:
  - `noi_ngay_kham` TEXT, `noi_tuan_hoan` TEXT, `noi_pl_tuan_hoan` INTEGER
  - `noi_ho_hap` TEXT, `noi_pl_ho_hap` INTEGER
  - `noi_tieu_hoa` TEXT, `noi_pl_tieu_hoa` INTEGER
  - `noi_than_tiet_nieu` TEXT, `noi_pl_than_tiet_nieu` INTEGER
  - `noi_noi_tiet` TEXT, `noi_pl_noi_tiet` INTEGER
  - `noi_co_xuong_khop` TEXT, `noi_pl_co_xuong_khop` INTEGER
  - `noi_than_kinh` TEXT, `noi_pl_than_kinh` INTEGER
  - `noi_tam_than` TEXT, `noi_pl_tam_than` INTEGER
  - `noi_bac_sy` TEXT
- **Ngoại khoa**:
  - `ngoai_ket_qua` TEXT, `ngoai_phan_loai` INTEGER, `ngoai_bac_sy` TEXT
- **Mắt**:
  - `mat_khong_kinh_phai` TEXT, `mat_khong_kinh_trai` TEXT
  - `mat_co_kinh_phai` TEXT, `mat_co_kinh_trai` TEXT
  - `mat_benh` TEXT, `mat_phan_loai` INTEGER, `mat_bac_sy` TEXT
- **Tai Mũi Họng**:
  - `tmh_tai_trai_thuong` TEXT, `tmh_tai_trai_tham` TEXT
  - `tmh_tai_phai_thuong` TEXT, `tmh_tai_phai_tham` TEXT
  - `tmh_benh` TEXT, `tmh_phan_loai` INTEGER, `tmh_bac_sy` TEXT
- **Răng Hàm Mặt**:
  - `rhm_ham_tren` TEXT, `rhm_ham_duoi` TEXT, `rhm_benh` TEXT, `rhm_phan_loai` INTEGER, `rhm_bac_sy` TEXT
- **Da Liễu**:
  - `da_lieu_ket_qua` TEXT, `da_lieu_phan_loai` INTEGER, `da_lieu_bac_sy` TEXT
- **Sản Phụ Khoa** (Dành cho Nữ):
  - `san_phu_khoa_ket_qua` TEXT, `san_phu_khoa_phan_loai` INTEGER, `san_phu_khoa_bac_sy` TEXT

### 3.4. Bảng `can_lam_sang` (Cột 69 đến 100)
- `patient_id` INTEGER UNIQUE REFERENCES patients(id)
- **Công thức máu**: `cls_hong_cau`, `cls_bach_cau`, `cls_tieu_cau`, `cls_huyet_sac_to`
- **Sinh hóa**: `cls_duong_huyet`, `cls_ure`, `cls_creatinin`, `cls_bilirubin_tp`, `cls_ast`, `cls_alt`, `cls_ggt`, `cls_triglycerid`, `cls_cholesterol_tp`, `cls_hdl_c`, `cls_ldl_c`, `cls_hba1c`
- **Miễn dịch**: `cls_afp`, `cls_cea`, `cls_psa_total`, `cls_hbsag`, `cls_hbsab`, `cls_anti_hcv`
- **Nước tiểu**: `cls_axit_uric`, `cls_glucose`, `cls_protein_nieu`, `cls_nuoc_tieu_hong_cau`, `cls_nuoc_tieu_bach_cau`
- **Chẩn đoán hình ảnh**: `cls_dien_tim`, `cls_xquang`, `cls_sieu_am`, `cls_cdha_khac`, `cls_xet_nghiem_khac`
- `cls_bac_sy` TEXT

### 3.5. Bảng `ket_luan` (Cột 101 đến 107)
- `patient_id` INTEGER UNIQUE REFERENCES patients(id)
- `phan_loai_suc_khoe` INTEGER NOT NULL (1 đến 5)
- `mo_ta_benh_tat` TEXT
- `ma_icd10` TEXT NOT NULL
- `loi_dan_bac_si` TEXT
- `ngay_ket_luan` TEXT NOT NULL (DD/MM/YYYY)
- `bac_si_ket_luan` TEXT NOT NULL
- `ma_cskcb` TEXT NOT NULL

---

## 4. Danh Sách Phân Hệ & Giao Diện Phòng Khám

1. **Chọn phòng làm việc**: Trình duyệt lưu `localStorage.currentRoom`. Có thể chuyển phòng bất cứ lúc nào.
2. **Phòng Tiếp đón**:
   - Form nhập lẻ: Họ tên, Ngày sinh, Giới tính, CCCD, SĐT, Địa chỉ, Đối tượng KSK.
   - Nút Nạp Excel (Import danh sách công ty).
   - In phiếu chỉ định / mã tiếp đón (nếu cần).
3. **Các phòng khám chuyên khoa (Thể lực, Nội, Ngoại, Mắt, TMH, RHM, Da Liễu, Phụ khoa, Xét nghiệm)**:
   - Danh sách hàng đợi chia tab: "Đang chờ khám" và "Đã khám xong".
   - Ô tìm kiếm nhanh: Lọc ngay khi gõ tên, CCCD hoặc STT.
   - Form nhập chuyên khoa:
     - Nút "Điền nhanh bình thường".
     - Lưu lại tên Bác sĩ khám cho các ca tiếp theo.
     - Phím tắt Enter / Ctrl+S để lưu và tự động nhảy sang ca tiếp theo.
4. **Phòng Kết luận & Thống kê**:
   - Bảng tổng hợp tiến độ của tất cả các chuyên khoa.
   - Nhập chẩn đoán cuối cùng, tra cứu nhanh mã ICD-10.
   - Nút "Xuất Excel kết quả KSK" (108 cột chuẩn).

---

## 5. Động Cơ Xử Lý Excel (Excel Engine)

- Sử dụng thư viện `exceljs`.
- File phôi mẫu: [Danh sách khám định kỳ.xlsx](file:///D:/WorkSpace/HC/temp/Danh%20sách%20khám%20định%20kỳ.xlsx).
- Giữ nguyên 100% cấu trúc 4 dòng tiêu đề, hợp nhất ô, màu sắc, font chữ và các sheet phụ lục (`DM Mã đối tượng KSK`, `DM Địa chỉ`, `DM Nghề nghiệp`).
- Điền dữ liệu từ dòng 5: Chuyển đổi đúng định dạng cột:
  - Giới tính: 1 - Nam, 2 - Nữ
  - Phân loại: 1, 2, 3, 4, 5
  - Ngày tháng: DD/MM/YYYY
  - Thị lực: Số nguyên (ví dụ 10/10 -> 10)

---

## 6. Triển Khai & Khởi Động Mạng LAN

- File khởi động: `Chay_He_Thong_KSK.bat` đặt tại thư mục dự án (và shortcut Desktop).
- Tự động lấy IP máy tính chủ (PowerShell: `(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.*' }).IPAddress`).
- Mở server Node.js cổng `3000`.
- Tự động mở trình duyệt `http://localhost:3000`.
- Hiển thị hướng dẫn địa chỉ IP kết nối cho các máy phòng khám khác.
