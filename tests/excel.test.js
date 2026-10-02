const assert = require('assert');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { exportKskExcel, importCompanyExcel } = require('../src/services/excelEngine');
const { initSchema } = require('../src/db/initSchema');
const { get, all, run, closeDb } = require('../src/db/database');

async function testExcel() {
  console.log('--- Đang chạy kiểm thử Excel Engine (108 cột & Import đoàn) ---');
  await initSchema();

  // Đảm bảo có ít nhất 1 bệnh nhân hoàn chỉnh để xuất
  const testPatient = await get("SELECT id FROM patients WHERE ho_ten = 'Trần Thị Thu Thảo'");
  assert(testPatient, 'Phải có bệnh nhân mẫu từ Task 2.');

  // 1. Kiểm thử Xuất Excel
  console.log('1. Đang xuất file Excel từ cơ sở dữ liệu...');
  const workbook = await exportKskExcel();

  const ws = workbook.getWorksheet(1);
  assert.strictEqual(ws.name, 'Ket qua KSKDK');

  // Kiểm tra 4 dòng tiêu đề
  const r1 = ws.getRow(1).getCell(1).text;
  assert(r1.includes('DANH SÁCH KẾT QUẢ KHÁM SỨC KHỎE ĐỊNH KỲ'), 'Dòng 1 tiêu đề phải nguyên vẹn.');

  const r2 = ws.getRow(2).getCell(1).text;
  assert(r2.includes('THÔNG TIN HÀNH CHÍNH'), 'Dòng 2 nhóm chuyên khoa phải nguyên vẹn.');

  // Kiểm tra dòng dữ liệu thứ 5
  assert(ws.rowCount >= 5, 'Phải có dòng dữ liệu từ dòng 5 trở đi.');
  const r5_name = ws.getRow(5).getCell(2).text;
  console.log(`Dòng 5 bệnh nhân: ${r5_name}`);
  assert(r5_name.length > 0, 'Phải có họ tên bệnh nhân.');

  // Kiểm tra số cột
  console.log(`Tổng số cột trong worksheet: ${ws.columnCount}`);
  assert(ws.columnCount >= 107, 'Phải có đủ các cột chuẩn của mẫu KSK.');

  // Kiểm tra các sheet phụ lục
  const sheetDoiTuong = workbook.getWorksheet('DM Mã đối tượng KSK');
  assert(sheetDoiTuong, 'Phải giữ nguyên sheet DM Mã đối tượng KSK');
  const sheetDiaChi = workbook.getWorksheet('DM Địa chỉ');
  assert(sheetDiaChi, 'Phải giữ nguyên sheet DM Địa chỉ');

  const testOutputPath = path.join(__dirname, 'output_test.xlsx');
  await workbook.xlsx.writeFile(testOutputPath);
  assert(fs.existsSync(testOutputPath), 'File test phải được tạo thành công.');
  console.log(`Đã xuất file kiểm thử thành công tại: ${testOutputPath} (${fs.statSync(testOutputPath).size} bytes)`);

  // 2. Kiểm thử Nạp danh sách (Import)
  console.log('2. Đang tạo file Excel danh sách nhân viên công ty để kiểm thử import...');
  const importWb = new ExcelJS.Workbook();
  const importWs = importWb.addWorksheet('DanhSach');
  importWs.addRow(['STT', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Số CCCD', 'Số điện thoại', 'Đơn vị công tác']);
  importWs.addRow([1, 'Hoàng Văn Import 1', '10/10/1988', 'Nam', '001088000111', '0988111222', 'Phòng Kỹ thuật']);
  importWs.addRow([2, 'Lê Thị Import 2', '05/05/1992', 'Nữ', '001092000222', '0988222333', 'Phòng Kế toán']);

  const testImportPath = path.join(__dirname, 'input_import_test.xlsx');
  await importWb.xlsx.writeFile(testImportPath);

  const importResult = await importCompanyExcel(testImportPath, 'Đoàn Test Import 2026');
  console.log('Kết quả import:', importResult);
  assert.strictEqual(importResult.imported, 2, 'Phải nạp đúng 2 nhân viên.');

  const importedPatients = await all("SELECT * FROM patients WHERE dot_kham = 'Đoàn Test Import 2026'");
  assert.strictEqual(importedPatients.length, 2);
  assert.strictEqual(importedPatients[0].ho_ten, 'Hoàng Văn Import 1');
  assert.strictEqual(importedPatients[0].gioi_tinh, 1);
  assert.strictEqual(importedPatients[1].ho_ten, 'Lê Thị Import 2');
  assert.strictEqual(importedPatients[1].gioi_tinh, 2);

  console.log('3. Kiểm tra dữ liệu nạp vào SQLite chính xác 100%!');

  // Dọn dẹp file test
  if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);
  if (fs.existsSync(testImportPath)) fs.unlinkSync(testImportPath);

  await closeDb();
  console.log('✅ TEST EXCEL ENGINE HOÀN TẤT THÀNH CÔNG!');
}

testExcel().catch((err) => {
  console.error('❌ Lỗi kiểm thử Excel:', err);
  process.exit(1);
});
