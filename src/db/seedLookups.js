const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { run, all } = require('./database');

const TEMPLATE_FILE = 'D:\\WorkSpace\\HC\\temp\\Danh sách khám định kỳ.xlsx';

async function seedLookups() {
  const existing = await all('SELECT COUNT(*) as count FROM lookup_data');
  if (existing && existing[0] && existing[0].count > 50) {
    console.log('ℹ️ Dữ liệu danh mục đã có sẵn, bỏ qua seed.');
    return;
  }

  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.warn(`⚠️ Không tìm thấy file template tại: ${TEMPLATE_FILE}, nạp danh mục mặc định cơ bản.`);
    await seedFallbackLookups();
    return;
  }

  console.log('Đang đọc danh mục từ file Excel template...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_FILE);

  // 1. Seed DM Mã đối tượng KSK
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

  // 2. Seed DM Nghề nghiệp
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

  // 3. Seed DM Địa chỉ (Tỉnh/Thành phố & Xã/Phường)
  const sheetDiaChi = workbook.getWorksheet('DM Địa chỉ');
  if (sheetDiaChi) {
    const tinhMap = new Set();
    const xaList = [];
    for (let r = 2; r <= Math.min(sheetDiaChi.rowCount, 1000); r++) {
      const row = sheetDiaChi.getRow(r);
      const tinh = row.getCell(1).text ? row.getCell(1).text.trim() : '';
      const xa = row.getCell(4).text ? row.getCell(4).text.trim() : '';
      if (tinh) tinhMap.add(tinh);
      if (xa) xaList.push(xa);
    }
    for (const tinh of tinhMap) {
      await run(
        'INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)',
        ['TINH_TP', '', tinh]
      );
    }
    for (const xa of Array.from(new Set(xaList))) {
      await run(
        'INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)',
        ['XA_PHUONG', '', xa]
      );
    }
  }

  // 4. Seed một số mã ICD-10 phổ biến trong KSK
  const commonIcd10 = [
    { code: 'Z00.0', name: 'Z00.0 - Khám sức khỏe định kỳ (Bình thường)' },
    { code: 'Z01.0', name: 'Z01.0 - Khám mắt và thị lực' },
    { code: 'Z01.1', name: 'Z01.1 - Khám tai và thính lực' },
    { code: 'Z01.2', name: 'Z01.2 - Khám răng hàm mặt' },
    { code: 'I10', name: 'I10 - Bệnh tăng huyết áp vô căn (nguyên phát)' },
    { code: 'E11', name: 'E11 - Bệnh đái tháo đường týp 2' },
    { code: 'E78', name: 'E78 - Rối loạn chuyển hóa lipoprotein và tình trạng tăng lipid máu khác' },
    { code: 'H52.1', name: 'H52.1 - Cận thị' },
    { code: 'H52.2', name: 'H52.2 - Loạn thị' },
    { code: 'H52.0', name: 'H52.0 - Viễn thị' },
    { code: 'K29', name: 'K29 - Viêm dạ dày và tá tràng' },
    { code: 'K02', name: 'K02 - Sâu răng' },
    { code: 'K05', name: 'K05 - Viêm lợi và bệnh nha chu' },
    { code: 'J00', name: 'J00 - Viêm mũi họng cấp [cảm thường]' },
    { code: 'J30', name: 'J30 - Viêm mũi vận mạch và dị ứng' },
    { code: 'B18.1', name: 'B18.1 - Viêm gan virus B mạn không có tác nhân delta' },
    { code: 'K76.0', name: 'K76.0 - Gan thoái hóa mỡ, không phân loại ở nơi khác' }
  ];

  for (const item of commonIcd10) {
    await run(
      'INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)',
      ['ICD10', item.code, item.name]
    );
  }

  console.log('✅ Đã nạp thành công các danh mục KSK vào CSDL.');
}

async function seedFallbackLookups() {
  const lookups = [
    { cat: 'DOI_TUONG_KSK', code: '58', name: '58 - KSK cho đối tượng chính sách' },
    { cat: 'DOI_TUONG_KSK', code: '59', name: '59 - KSK an toàn thực phẩm' },
    { cat: 'DOI_TUONG_KSK', code: '60', name: '60 - KSK đi làm việc nước ngoài' },
    { cat: 'DOI_TUONG_KSK', code: '64', name: '64 - KSK định kỳ cho người lao động' },
    { cat: 'NGHE_NGHIEP', code: '04', name: '04 - Công nhân' },
    { cat: 'NGHE_NGHIEP', code: '08', name: '08 - Hành chính, sự nghiệp' },
    { cat: 'NGHE_NGHIEP', code: '10', name: '10 - Dịch vụ' },
    { cat: 'NGHE_NGHIEP', code: '99', name: '99 - Khác' },
    { cat: 'TINH_TP', code: '', name: 'Thành phố Hà Nội' },
    { cat: 'TINH_TP', code: '', name: 'Thành phố Hồ Chí Minh' },
    { cat: 'TINH_TP', code: '', name: 'Tỉnh Đồng Nai' },
    { cat: 'TINH_TP', code: '', name: 'Thành phố Cần Thơ' }
  ];
  for (const l of lookups) {
    await run('INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)', [l.cat, l.code, l.name]);
  }
}

module.exports = { seedLookups };

if (require.main === module) {
  seedLookups()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
