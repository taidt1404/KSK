# 🏥 HỆ THỐNG NHẬP LIỆU KHÁM SỨC KHỎE ĐỊNH KỲ (LAN KSK SYSTEM)

Hệ thống Web App chạy trên mạng nội bộ (LAN) phục vụ công tác khám sức khỏe định kỳ đa phòng khám. Cho phép các phòng khám (Tiếp đón, Thể lực, Nội, Ngoại, Mắt, Tai Mũi Họng, Răng Hàm Mặt, Da liễu, Sản phụ khoa, Cận lâm sàng, Kết luận) cùng nhập dữ liệu đồng thời cho bệnh nhân và **xuất báo cáo Excel chuẩn 100% mẫu gốc 108 cột**.

---

## 🚀 HƯỚNG DẪN SỬ DỤNG NHANH

### 1. Khởi động tại Máy chủ (Máy tiếp đón hoặc máy chủ cơ sở y tế)
* **Cách 1**: Bấm đúp vào biểu tượng **`Hệ Thống KSK LAN`** ngoài màn hình Desktop.
* **Cách 2**: Bấm đúp vào file `Chay_He_Thong_KSK.bat` trong thư mục dự án `D:\WorkSpace\Projects\KSK`.

Màn hình màu đen (CMD) sẽ tự động bật lên và hiển thị:
```
========================================================================
       🏥 HỆ THỐNG NHẬP LIỆU KHÁM SỨC KHỎE ĐỊNH KỲ (MẠNG LAN)
========================================================================
  Máy chủ tại chỗ (máy này): http://localhost:3000

  CÁC PHÒNG KHÁM KHÁC (Mắt, TMH, Thể Lực...) MỞ TRÌNH DUYỆT GÕ ĐỊA CHỈ:
  👉  http://192.168.110.143:3000   (Ethernet)
========================================================================
```
*Trình duyệt trên máy chủ sẽ tự động mở trang web. Giữ cửa sổ màu đen này mở trong suốt buổi khám.*

---

### 2. Truy cập từ các Phòng khám khác (Mắt, TMH, Thể lực, Răng...)
* Trên máy tính của mỗi phòng khám, mở trình duyệt bất kỳ (**Google Chrome**, **Microsoft Edge**, **Cốc Cốc**).
* Gõ địa chỉ IP hiển thị ở bước 1, ví dụ:  
  👉 **`http://192.168.110.143:3000`** *(Lưu vào Bookmark để dùng hàng ngày)*.
* Bấm nút **"🔄 Đổi Phòng Khám"** trên thanh tiêu đề và chọn đúng phòng của mình:
  * 🏢 **Tiếp Đón & Hành Chính**
  * ⚖️ **Khám Thể Lực** (Cao, nặng, mạch, huyết áp...)
  * 🩺 **Khám Nội Khoa** (Tuần hoàn, hô hấp, tiêu hóa...)
  * 🩹 **Khám Ngoại Khoa**
  * 👁️ **Khám Mắt** (Đo thị lực có/không kính...)
  * 👂 **Khám Tai Mũi Họng**
  * 🦷 **Khám Răng Hàm Mặt**
  * 🧴 **Khám Da Liễu**
  * 🌸 **Khám Sản Phụ Khoa** (Tự động ẩn với bệnh nhân Nam)
  * 🧪 **Cận Lâm Sàng** (Xét nghiệm máu, nước tiểu, X-quang, Siêu âm...)
  * 📋 **Kết Luận & Xuất Báo Cáo**
* Trình duyệt sẽ tự động **ghi nhớ phòng khám này**, lần sau mở lại không cần chọn lại.

---

### 3. Quy trình Thao tác

#### A. Tiếp đón & Đăng ký bệnh nhân
* **Nhập từng người**: Điền thông tin vào form hành chính và nhấn **Enter**.
* **Nạp theo đoàn từ Excel**: Bấm **"📥 Nạp Danh Sách Đoàn KSK từ Excel"** -> chọn file danh sách công ty -> bấm **"Bắt Đầu Nạp Dữ Liệu"**. Toàn bộ nhân viên sẽ được nạp vào danh sách chờ khám tức thì.

#### B. Thao tác tại các Phòng Khám chuyên khoa
1. Nhìn cột danh sách bên trái: chọn bệnh nhân cần khám (hoặc gõ tên/CCCD vào ô tìm kiếm 🔍).
2. Nhập các chỉ số chuyên môn:
   * Có nút **"Điền nhanh"** (ví dụ mắt 10/10, bình thường...) giúp tiết kiệm thời gian gõ cho người khỏe mạnh.
   * Hệ thống tự động ghi nhớ **Tên Bác sĩ khám** của máy đó.
3. Bấm **"💾 Lưu & Chuyển Ca Sau"** hoặc nhấn phím tắt **`Ctrl + S`**: Hệ thống sẽ lưu dữ liệu ngay lập tức và tự động nhảy sang bệnh nhân tiếp theo trong hàng đợi.

#### C. Tổng kết & Xuất file Excel 108 cột
* Bác sĩ phòng Kết luận mở module **"Kết Luận & Xuất Báo Cáo"**:
  * Xem nhanh tiến độ khám của tất cả các chuyên khoa.
  * Chọn phân loại sức khỏe chung (Loại 1 đến 5), nhập mã ICD-10 và lời dặn bác sĩ.
* Bấm nút **"📊 Xuất Excel 108 Cột"** ở góc trên bên phải màn hình:
  * Trình duyệt sẽ tải về file `.xlsx` được bảo toàn **100% định dạng file gốc**, bao gồm 4 dòng tiêu đề, 108 cột và các sheet danh mục phụ lục.

---

### 4. Sao lưu (Backup) & An toàn dữ liệu
* Toàn bộ dữ liệu của hệ thống nằm trong thư mục `data/` (file `data/ksk.db`).
* Định kỳ cuối ngày hoặc sau mỗi đợt khám, chỉ cần copy file `ksk.db` ra USB hoặc ổ cứng khác để lưu trữ.
