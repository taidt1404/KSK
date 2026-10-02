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

  // 3. Seed ICD-10
  const commonIcd10 = [
    { code: 'Z00.0', name: 'Z00.0 - Khám sức khỏe định kỳ (Bình thường)' },
    { code: 'Z01.0', name: 'Z01.0 - Khám mắt và thị lực' },
    { code: 'Z01.1', name: 'Z01.1 - Khám tai và thính lực' },
    { code: 'Z01.2', name: 'Z01.2 - Khám răng hàm mặt' },
    { code: 'I10', name: 'I10 - Bệnh tăng huyết áp vô căn (nguyên phát)' },
    { code: 'E11', name: 'E11 - Bệnh đái tháo đường týp 2' },
    { code: 'E78', name: 'E78 - Rối loạn chuyển hóa lipoprotein và tăng lipid máu' },
    { code: 'H52.1', name: 'H52.1 - Cận thị' },
    { code: 'H52.2', name: 'H52.2 - Loạn thị' },
    { code: 'H52.0', name: 'H52.0 - Viễn thị' },
    { code: 'K29', name: 'K29 - Viêm dạ dày và tá tràng' },
    { code: 'K02', name: 'K02 - Sâu răng' },
    { code: 'K05', name: 'K05 - Viêm lợi và bệnh nha chu' },
    { code: 'J00', name: 'J00 - Viêm mũi họng cấp' },
    { code: 'J30', name: 'J30 - Viêm mũi vận mạch và dị ứng' },
    { code: 'B18.1', name: 'B18.1 - Viêm gan virus B mạn' },
    { code: 'K76.0', name: 'K76.0 - Gan thoái hóa mỡ' }
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
