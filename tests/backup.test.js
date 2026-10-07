const assert = require('assert');
const fs = require('fs');
const path = require('path');
process.env.NODE_ENV = 'test';

const { startServer } = require('../src/server');
const { closeDb, run, get } = require('../src/db/database');
const { createFullBackup, generateBackupPayload, restoreFromJson, BACKUP_DIR } = require('../src/services/backupService');

async function testBackup() {
  console.log('--- Đang chạy kiểm thử Sao Lưu & Khôi Phục JSON (Backup & Restore Engine) ---');
  const { server, port } = await startServer(0);
  const baseUrl = `http://localhost:${port}`;

  try {
    // 0. Dọn dẹp dữ liệu kiểm thử cũ nếu có
    await run("DELETE FROM patients WHERE ho_ten = 'TRẦN THỊ BACKUP TEST'");

    // 1. Thêm bệnh nhân mẫu để kiểm thử sao lưu
    await run(`
      INSERT INTO patients (
        stt, ho_ten, ngay_sinh, gioi_tinh, cccd, tinh_tp, xa_phuong, dot_kham, trang_thai
      ) VALUES (99, 'TRẦN THỊ BACKUP TEST', '15/08/1995', 2, '024195000001', 'Thành phố Bắc Ninh', 'Phường Tiền An', 'Đoàn Test Backup', 'DA_KHAM')
    `);
    const pRow = await get("SELECT id FROM patients WHERE ho_ten = 'TRẦN THỊ BACKUP TEST'");
    assert(pRow, 'Bệnh nhân mẫu phải tồn tại');
    const pId = pRow.id;

    // Nhập thể lực
    await run(`
      INSERT INTO the_luc (patient_id, ngay_do, can_nang, chieu_cao, mach, ha_tam_thu, ha_tam_truong, phan_loai_the_luc)
      VALUES (?, '07/10/2026', 55, 160, 72, 115, 75, 1)
    `, [pId]);

    // Nhập khám lâm sàng
    await run(`
      INSERT INTO kham_lam_sang (patient_id, noi_ngay_kham, noi_tuan_hoan, noi_pl_tuan_hoan, noi_bac_sy, mat_phan_loai, mat_bac_sy)
      VALUES (?, '07/10/2026', 'Tim đều', 1, 'BS. Nội', 1, 'BS. Mắt')
    `, [pId]);

    // Nhập kết luận
    await run(`
      INSERT INTO ket_luan (patient_id, phan_loai_suc_khoe, mo_ta_benh_tat, ma_icd10, bac_si_ket_luan)
      VALUES (?, 1, 'Sức khỏe tốt', 'Z00', 'BS. Kết luận')
    `, [pId]);

    console.log('1. Khởi tạo dữ liệu mẫu kiểm thử thành công.');

    // 2. Kiểm thử hàm createFullBackup
    const backupRes = await createFullBackup({ reason: 'unit_test' });
    assert.strictEqual(backupRes.success, true);
    assert(fs.existsSync(backupRes.filePath), 'File sao lưu JSON phải tồn tại');
    const content = JSON.parse(fs.readFileSync(backupRes.filePath, 'utf-8'));
    assert.strictEqual(content.app, 'KSK_LAN_SYSTEM');
    assert(content.data.length >= 1, 'File sao lưu phải chứa ít nhất 1 bệnh nhân');

    const backupItem = content.data.find(d => d.patient.ho_ten === 'TRẦN THỊ BACKUP TEST');
    assert(backupItem, 'Phải tìm thấy bệnh nhân mẫu trong file sao lưu');
    assert.strictEqual(backupItem.the_luc.can_nang, 55);
    assert.strictEqual(backupItem.kham_lam_sang.noi_tuan_hoan, 'Tim đều');
    assert.strictEqual(backupItem.ket_luan.ma_icd10, 'Z00');
    console.log(`2. Tạo bản sao lưu ${backupRes.filename} thành công (${content.data.length} bệnh nhân).`);

    // 3. Kiểm thử API GET /api/backups (danh sách)
    const listRes = await fetch(`${baseUrl}/api/backups`);
    assert.strictEqual(listRes.status, 200);
    const listJson = await listRes.json();
    assert.strictEqual(listJson.success, true);
    assert(Array.isArray(listJson.data));
    assert(listJson.data.some(f => f.filename === backupRes.filename));
    console.log('3. API lấy danh sách file sao lưu hoạt động tốt.');

    // 4. Kiểm thử API GET /api/backups/export-live (tải trực tiếp)
    const exportLiveRes = await fetch(`${baseUrl}/api/backups/export-live`);
    assert.strictEqual(exportLiveRes.status, 200);
    const liveJson = await exportLiveRes.json();
    assert.strictEqual(liveJson.app, 'KSK_LAN_SYSTEM');
    assert(liveJson.data.some(d => d.patient.ho_ten === 'TRẦN THỊ BACKUP TEST'));
    console.log('4. API tải trực tiếp file sao lưu JSON hoạt động tốt.');

    // 5. Kiểm thử xóa bệnh nhân mẫu, sau đó khôi phục lại từ file JSON
    await run('DELETE FROM patients WHERE id = ?', [pId]);
    const checkDeleted = await get('SELECT id FROM patients WHERE id = ?', [pId]);
    assert.strictEqual(checkDeleted, undefined, 'Bệnh nhân đã bị xóa khỏi CSDL');

    // Khôi phục bằng hàm restoreFromJson
    const restoreRes = await restoreFromJson(liveJson);
    assert.strictEqual(restoreRes.success, true);
    assert(restoreRes.imported >= 1 || restoreRes.updated >= 1);

    // Kiểm tra bệnh nhân đã được phục hồi đầy đủ cả thông tin khám
    const restoredRow = await get("SELECT id FROM patients WHERE ho_ten = 'TRẦN THỊ BACKUP TEST'");
    assert(restoredRow, 'Bệnh nhân phải được khôi phục thành công');
    const rId = restoredRow.id;

    const restoredTheLuc = await get('SELECT can_nang FROM the_luc WHERE patient_id = ?', [rId]);
    assert.strictEqual(restoredTheLuc.can_nang, 55, 'Thể lực phải phục hồi chính xác');

    const restoredKham = await get('SELECT noi_tuan_hoan FROM kham_lam_sang WHERE patient_id = ?', [rId]);
    assert.strictEqual(restoredKham.noi_tuan_hoan, 'Tim đều', 'Khám lâm sàng phải phục hồi chính xác');

    const restoredKetLuan = await get('SELECT ma_icd10 FROM ket_luan WHERE patient_id = ?', [rId]);
    assert.strictEqual(restoredKetLuan.ma_icd10, 'Z00', 'Kết luận phải phục hồi chính xác');

    console.log('5. Khôi phục dữ liệu từ file JSON vào CSDL thành công 100%!');

    // 6. Kiểm thử API POST /api/backups/restore với xác thực mã PIN
    const apiRestoreFail = await fetch(`${baseUrl}/api/backups/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin: 'sai-mat-khau', backupData: liveJson })
    });
    assert.strictEqual(apiRestoreFail.status, 403, 'Phải chặn mã PIN sai với 403');

    const apiRestoreSuccess = await fetch(`${baseUrl}/api/backups/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': encodeURIComponent('BVHC@123$%^')
      },
      body: JSON.stringify({ adminPin: 'BVHC@123$%^', backupData: liveJson })
    });
    assert.strictEqual(apiRestoreSuccess.status, 200);
    const apiRestoreSuccessJson = await apiRestoreSuccess.json();
    assert.strictEqual(apiRestoreSuccessJson.success, true);
    console.log('6. API phục hồi qua mạng LAN với mã PIN bảo mật thành công!');

    console.log('✅ TEST SAO LƯU & KHÔI PHỤC JSON HOÀN TẤT THÀNH CÔNG 100%!');
  } finally {
    await closeDb();
    await new Promise((resolve) => server.close(resolve));
  }
}

testBackup().catch((err) => {
  console.error('❌ Lỗi kiểm thử Backup & Restore:', err);
  process.exit(1);
});
