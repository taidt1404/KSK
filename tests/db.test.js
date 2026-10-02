const assert = require('assert');
const { getDb, run, get, all } = require('../src/db/database');
const { initSchema } = require('../src/db/initSchema');
const { seedLookups } = require('../src/db/seedLookups');

async function testDatabase() {
  console.log('--- Đang chạy kiểm thử Database & Schema ---');

  // 1. Khởi tạo schema
  await initSchema();
  console.log('1. Khởi tạo bảng thành công.');

  // 2. Nạp danh mục
  await seedLookups();
  const lookups = await all('SELECT COUNT(*) as count FROM lookup_data');
  assert(lookups[0].count > 0, 'Phải có dữ liệu danh mục được nạp.');
  console.log(`2. Nạp danh mục thành công (${lookups[0].count} bản ghi).`);

  // 3. Tạo bệnh nhân kiểm thử
  const res = await run(
    `INSERT INTO patients (stt, ho_ten, ngay_sinh, gioi_tinh, cccd, sdt, noi_cong_tac, dot_kham)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, 'Nguyễn Văn Test', '15/05/1990', 1, '001090012345', '0912345678', 'Công ty ABC', 'Đoàn KSK 2026']
  );
  const patientId = res.lastID;
  assert(patientId > 0, 'Phải có ID bệnh nhân.');
  console.log(`3. Thêm bệnh nhân thành công, ID: ${patientId}`);

  // 4. Thêm khám thể lực
  await run(
    `INSERT INTO the_luc (patient_id, ngay_do, can_nang, chieu_cao, mach, ha_tam_thu, ha_tam_truong, phan_loai_the_luc, nguoi_kham)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientId, '02/10/2026', 65.5, 170, 75, 120, 80, 2, 'Y tá Lan']
  );

  // 5. Thêm khám chuyên khoa mắt
  await run(
    `INSERT INTO kham_lam_sang (patient_id, mat_khong_kinh_phai, mat_khong_kinh_trai, mat_phan_loai, mat_bac_sy)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, '10', '10', 1, 'BS. Hoàng']
  );

  // 6. Truy vấn tổng hợp
  const patient = await get(
    `SELECT p.*, t.can_nang, t.chieu_cao, t.mach, t.ha_tam_thu, t.ha_tam_truong, k.mat_khong_kinh_phai, k.mat_bac_sy
     FROM patients p
     LEFT JOIN the_luc t ON p.id = t.patient_id
     LEFT JOIN kham_lam_sang k ON p.id = k.patient_id
     WHERE p.id = ?`,
    [patientId]
  );

  assert.strictEqual(patient.ho_ten, 'Nguyễn Văn Test');
  assert.strictEqual(patient.can_nang, 65.5);
  assert.strictEqual(patient.mat_khong_kinh_phai, '10');
  assert.strictEqual(patient.mat_bac_sy, 'BS. Hoàng');
  console.log('4. Truy vấn liên kết các chuyên khoa khớp chính xác 100%!');

  console.log('✅ TEST DATABASE HOÀN TẤT THÀNH CÔNG!');
  process.exit(0);
}

testDatabase().catch((err) => {
  console.error('❌ Lỗi kiểm thử database:', err);
  process.exit(1);
});
