const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { run, all } = require('./database');

const TEMPLATE_FILE = 'D:\\WorkSpace\\HC\\temp\\Danh sách khám định kỳ.xlsx';

// Danh sách đầy đủ 63 Tỉnh/Thành phố Việt Nam
const VIETNAM_63_PROVINCES = [
  'Thành phố Hà Nội', 'Thành phố Hồ Chí Minh', 'Thành phố Hải Phòng', 'Thành phố Đà Nẵng', 'Thành phố Cần Thơ', 'Thành phố Huế',
  'Tỉnh An Giang', 'Tỉnh Bà Rịa - Vũng Tàu', 'Tỉnh Bắc Giang', 'Tỉnh Bắc Kạn', 'Tỉnh Bạc Liêu', 'Tỉnh Bắc Ninh',
  'Tỉnh Bến Tre', 'Tỉnh Bình Định', 'Tỉnh Bình Dương', 'Tỉnh Bình Phước', 'Tỉnh Bình Thuận', 'Tỉnh Cà Mau',
  'Tỉnh Cao Bằng', 'Tỉnh Đắk Lắk', 'Tỉnh Đắk Nông', 'Tỉnh Điện Biên', 'Tỉnh Đồng Nai', 'Tỉnh Đồng Tháp',
  'Tỉnh Gia Lai', 'Tỉnh Hà Giang', 'Tỉnh Hà Nam', 'Tỉnh Hà Tĩnh', 'Tỉnh Hải Dương', 'Tỉnh Hậu Giang',
  'Tỉnh Hòa Bình', 'Tỉnh Hưng Yên', 'Tỉnh Khánh Hòa', 'Tỉnh Kiên Giang', 'Tỉnh Kon Tum', 'Tỉnh Lai Châu',
  'Tỉnh Lâm Đồng', 'Tỉnh Lạng Sơn', 'Tỉnh Lào Cai', 'Tỉnh Long An', 'Tỉnh Nam Định', 'Tỉnh Nghệ An',
  'Tỉnh Ninh Bình', 'Tỉnh Ninh Thuận', 'Tỉnh Phú Thọ', 'Tỉnh Phú Yên', 'Tỉnh Quảng Bình', 'Tỉnh Quảng Nam',
  'Tỉnh Quảng Ngãi', 'Tỉnh Quảng Ninh', 'Tỉnh Quảng Trị', 'Tỉnh Sóc Trăng', 'Tỉnh Sơn La', 'Tỉnh Tây Ninh',
  'Tỉnh Thái Bình', 'Tỉnh Thái Nguyên', 'Tỉnh Thanh Hóa', 'Tỉnh Thừa Thiên Huế', 'Tỉnh Tiền Giang', 'Tỉnh Trà Vinh',
  'Tỉnh Tuyên Quang', 'Tỉnh Vĩnh Long', 'Tỉnh Vĩnh Phúc', 'Tỉnh Yên Bái'
];

async function seedLookups(force = false) {
  if (!force) {
    const existing = await all("SELECT COUNT(*) as count FROM lookup_data WHERE category = 'XA_PHUONG' AND parent_code IS NOT NULL");
    if (existing && existing[0] && existing[0].count > 500) {
      console.log('ℹ️ Dữ liệu địa chỉ phân cấp đã có sẵn, bỏ qua seed.');
      return;
    }
  }

  // Xóa dữ liệu cũ nếu force
  if (force) {
    await run('DELETE FROM lookup_data');
  }

  // 1. Nạp đầy đủ 63 Tỉnh/Thành phố
  console.log('1. Đang nạp danh mục 63 Tỉnh/Thành phố...');
  for (const tinh of VIETNAM_63_PROVINCES) {
    await run(
      'INSERT INTO lookup_data (category, code, name, parent_code) VALUES (?, ?, ?, ?)',
      ['TINH_TP', '', tinh, null]
    );
  }

  // 2. Đọc file Excel template
  if (fs.existsSync(TEMPLATE_FILE)) {
    console.log('2. Đang đọc danh mục địa chỉ và đối tượng từ file Excel template...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_FILE);

    // Seed DM Đối tượng KSK
    const sheetDoiTuong = workbook.getWorksheet('DM Mã đối tượng KSK');
    if (sheetDoiTuong) {
      for (let r = 5; r <= sheetDoiTuong.rowCount; r++) {
        const row = sheetDoiTuong.getRow(r);
        const code = row.getCell(2).text ? row.getCell(2).text.trim() : '';
        const name = row.getCell(3).text ? row.getCell(3).text.trim() : '';
        if (code && name) {
          await run(
            'INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)',
            ['DOI_TUONG_KSK', code, `${code} - ${name}`]
          );
        }
      }
    }

    // Seed DM Nghề nghiệp
    const sheetNgheNghiep = workbook.getWorksheet('DM Nghề nghiệp');
    if (sheetNgheNghiep) {
      for (let r = 2; r <= sheetNgheNghiep.rowCount; r++) {
        const row = sheetNgheNghiep.getRow(r);
        const name = row.getCell(1).text ? row.getCell(1).text.trim() : '';
        const code = row.getCell(2).text ? row.getCell(2).text.trim() : '';
        if (name) {
          await run(
            'INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)',
            ['NGHE_NGHIEP', code, name]
          );
        }
      }
    }

    // Seed DM Địa chỉ theo cấp Tỉnh -> Huyện/Xã
    const sheetDiaChi = workbook.getWorksheet('DM Địa chỉ');
    if (sheetDiaChi) {
      const addedPairs = new Set();
      for (let r = 2; r <= sheetDiaChi.rowCount; r++) {
        const row = sheetDiaChi.getRow(r);
        const tinhName = row.getCell(3).text ? row.getCell(3).text.trim() : (row.getCell(1).text ? row.getCell(1).text.trim() : '');
        const xaName = row.getCell(4).text ? row.getCell(4).text.trim() : '';

        if (tinhName && xaName) {
          const key = `${tinhName}__${xaName}`;
          if (!addedPairs.has(key)) {
            addedPairs.add(key);
            await run(
              'INSERT INTO lookup_data (category, code, name, parent_code) VALUES (?, ?, ?, ?)',
              ['XA_PHUONG', '', xaName, tinhName]
            );
          }
        }
      }
      console.log(`Đã nạp ${addedPairs.size} xã/phường có liên kết với Tỉnh.`);
    }
  }

  // 3. Seed ICD-10 (Các mã thường gặp nhất trong Khám sức khỏe định kỳ & Danh mục Bộ Y Tế)
  const commonIcd10 = [
    // Khám sức khỏe & Thể lực chung
    { code: 'Z00.0', name: 'Z00.0 - Khám sức khỏe định kỳ (Đủ sức khỏe / Bình thường)' },
    { code: 'Z01.0', name: 'Z01.0 - Khám mắt và thị lực' },
    { code: 'Z01.1', name: 'Z01.1 - Khám tai và thính lực' },
    { code: 'Z01.2', name: 'Z01.2 - Khám răng hàm mặt' },
    { code: 'Z02.1', name: 'Z02.1 - Khám tuyển dụng / xin việc' },
    { code: 'Z02.4', name: 'Z02.4 - Khám sức khỏe lái xe' },

    // Mắt & Khúc xạ
    { code: 'H52.1', name: 'H52.1 - Cận thị (hai mắt / một mắt)' },
    { code: 'H52.2', name: 'H52.2 - Loạn thị' },
    { code: 'H52.0', name: 'H52.0 - Viễn thị' },
    { code: 'H52.4', name: 'H52.4 - Lão thị' },
    { code: 'H10', name: 'H10 - Viêm kết mạc' },
    { code: 'H25', name: 'H25 - Đục thể thủy tinh tuổi già' },
    { code: 'H00', name: 'H00 - Lẹo và chắp' },

    // Tim mạch & Huyết áp
    { code: 'I10', name: 'I10 - Bệnh tăng huyết áp vô căn (nguyên phát)' },
    { code: 'I15', name: 'I15 - Tăng huyết áp thứ phát' },
    { code: 'I20', name: 'I20 - Cơn đau thắt ngực' },
    { code: 'I25', name: 'I25 - Bệnh tim thiếu máu cục bộ mạn tính' },
    { code: 'I49', name: 'I49 - Loạn nhịp tim' },
    { code: 'I83', name: 'I83 - Giãn tĩnh mạch chi dưới' },
    { code: 'I95', name: 'I95 - Tụt huyết áp / Huyết áp thấp' },

    // Nội tiết & Chuyển hóa
    { code: 'E11', name: 'E11 - Bệnh đái tháo đường týp 2' },
    { code: 'E10', name: 'E10 - Bệnh đái tháo đường týp 1' },
    { code: 'E78', name: 'E78 - Rối loạn chuyển hóa lipoprotein và tăng lipid máu (Mỡ máu)' },
    { code: 'E78.0', name: 'E78.0 - Tăng cholesterol máu thuần túy' },
    { code: 'E78.1', name: 'E78.1 - Tăng triglycerid máu thuần túy' },
    { code: 'E78.2', name: 'E78.2 - Tăng lipid máu hỗn hợp' },
    { code: 'E66', name: 'E66 - Thừa cân / Béo phì' },
    { code: 'E04', name: 'E04 - Bướu giáp nhân lành tính / Đơn thuần' },
    { code: 'E05', name: 'E05 - Cường giáp / Nhiễm độc giáp' },
    { code: 'M10', name: 'M10 - Bệnh Gút (Gout)' },
    { code: 'E79', name: 'E79 - Rối loạn chuyển hóa purin / Tăng acid uric' },

    // Tiêu hóa & Gan mật
    { code: 'K29', name: 'K29 - Viêm dạ dày và tá tràng' },
    { code: 'K21', name: 'K21 - Bệnh trào ngược dạ dày - thực quản (GERD)' },
    { code: 'K76.0', name: 'K76.0 - Gan thoái hóa mỡ (Gan nhiễm mỡ)' },
    { code: 'B18.1', name: 'B18.1 - Viêm gan virus B mạn' },
    { code: 'B18.2', name: 'B18.2 - Viêm gan virus C mạn' },
    { code: 'K80', name: 'K80 - Sỏi mật' },
    { code: 'K82', name: 'K82 - Polyp túi mật / Bệnh túi mật khác' },
    { code: 'K64', name: 'K64 - Bệnh trĩ (nội / ngoại)' },

    // Tai Mũi Họng & Hô hấp
    { code: 'J00', name: 'J00 - Viêm mũi họng cấp' },
    { code: 'J30', name: 'J30 - Viêm mũi vận mạch và dị ứng' },
    { code: 'J31', name: 'J31 - Viêm mũi / Viêm xoang mạn' },
    { code: 'J32', name: 'J32 - Viêm xoang mạn tính' },
    { code: 'J35', name: 'J35 - Viêm amidan mạn tính' },
    { code: 'J45', name: 'J45 - Hen phế quản (Suyễn)' },
    { code: 'J20', name: 'J20 - Viêm phế quản cấp' },
    { code: 'H60', name: 'H60 - Viêm tai ngoài' },
    { code: 'H65', name: 'H65 - Viêm tai giữa' },
    { code: 'H90', name: 'H90 - Giảm sức nghe / Điếc dẫn truyền và tiếp nhận' },

    // Răng Hàm Mặt
    { code: 'K02', name: 'K02 - Sâu răng' },
    { code: 'K05', name: 'K05 - Viêm lợi và bệnh nha chu (Viêm nướu)' },
    { code: 'K03', name: 'K03 - Mòn men răng / Tổn thương ngà răng' },
    { code: 'K07', name: 'K07 - Lệch lạc khớp cắn / Răng khôn mọc lệch' },

    // Cơ Xương Khớp & Cột sống
    { code: 'M47', name: 'M47 - Thoái hóa cột sống (cổ / lưng)' },
    { code: 'M54', name: 'M54 - Đau lưng / Đau thần kinh tọa' },
    { code: 'M17', name: 'M17 - Thoái hóa khớp gối' },
    { code: 'M19', name: 'M19 - Thoái hóa khớp khác' },
    { code: 'M41', name: 'M41 - Vẹo cột sống' },

    // Tiết niệu - Sinh dục - Phụ khoa
    { code: 'N20', name: 'N20 - Sỏi thận và sỏi niệu quản' },
    { code: 'N28.1', name: 'N28.1 - Nang thận' },
    { code: 'N40', name: 'N40 - Phì đại lành tính tuyến tiền liệt' },
    { code: 'N72', name: 'N72 - Viêm cổ tử cung' },
    { code: 'N76', name: 'N76 - Viêm âm đạo / âm hộ' },
    { code: 'D25', name: 'D25 - U xơ tử cung' },
    { code: 'D27', name: 'D27 - U buồng trứng lành tính / Nang buồng trứng' },

    // Da liễu & Khác
    { code: 'L20', name: 'L20 - Viêm da cơ địa / Eczema' },
    { code: 'L70', name: 'L70 - Mụn trứng cá' },
    { code: 'B35', name: 'B35 - Bệnh nấm da (hắc lào, lang ben)' },
    { code: 'L50', name: 'L50 - Mày đay' },
    { code: 'D50', name: 'D50 - Thiếu máu thiếu sắt' },
    { code: 'R73', name: 'R73 - Tăng glucose máu (Tiền đái tháo đường)' },
    { code: 'R74', name: 'R74 - Tăng men gan (ALT/AST)' }
  ];

  for (const item of commonIcd10) {
    await run(
      'INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)',
      ['ICD10', item.code, item.name]
    );
  }

  console.log('✅ Đã nạp thành công đầy đủ danh mục địa phương và KSK.');
}

module.exports = { seedLookups };

if (require.main === module) {
  seedLookups(true)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
