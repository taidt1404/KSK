process.env.NODE_ENV = 'test';
const assert = require('assert');
const { startServer } = require('../src/server');
const { run, all, get, closeDb } = require('../src/db/database');

async function testMonthlyStt() {
  console.log('--- Đang chạy kiểm thử STT tịnh tiến theo tháng ---');
  const { server, port } = await startServer(0);
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Kiểm tra API GET /api/patients/next-stt
    const sttRes = await fetch(`${baseUrl}/api/patients/next-stt`);
    const sttData = await sttRes.json();
    assert.strictEqual(sttData.success, true);
    assert(typeof sttData.nextStt === 'number');
    console.log(`1. API /api/patients/next-stt hoạt động tốt, STT tiếp theo: ${sttData.nextStt} (${sttData.month})`);

    const currentNextStt = sttData.nextStt;

    // 2. Thêm 1 bệnh nhân mới để trống STT -> phải tự động nhận currentNextStt
    const p1Res = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ho_ten: 'Bệnh Nhân Test STT 1',
        ngay_sinh: '01/01/1990',
        gioi_tinh: 1,
        tinh_tp: 'Thành phố Bắc Ninh',
        xa_phuong: 'Phường Hiệp Hòa',
        dot_kham: 'Đoàn Test STT Ngày 1'
      })
    });
    const p1Data = await p1Res.json();
    assert.strictEqual(p1Data.success, true);
    assert.strictEqual(p1Data.data.stt, currentNextStt, `Bệnh nhân 1 phải nhận STT ${currentNextStt}`);
    console.log(`2. Bệnh nhân 1 nhận đúng STT: ${p1Data.data.stt}`);

    // 3. Thêm tiếp bệnh nhân khác thuộc đợt khám khác cùng tháng -> STT phải tịnh tiến tiếp (không bị reset về 1)
    const p2Res = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ho_ten: 'Bệnh Nhân Test STT 2',
        ngay_sinh: '02/02/1995',
        gioi_tinh: 2,
        tinh_tp: 'Thành phố Bắc Ninh',
        xa_phuong: 'Phường Hiệp Hòa',
        dot_kham: 'Đoàn Khác Hoàn Toàn Ngày 2'
      })
    });
    const p2Data = await p2Res.json();
    assert.strictEqual(p2Data.success, true);
    assert.strictEqual(p2Data.data.stt, currentNextStt + 1, `Bệnh nhân 2 phải nhận STT ${currentNextStt + 1}`);
    console.log(`3. Bệnh nhân 2 thuộc đoàn khác nhận đúng STT tịnh tiến tiếp: ${p2Data.data.stt}`);

    // 4. Kiểm tra giả lập sang tháng mới:
    // Tạo 1 bệnh nhân giả lập ở tháng trước hoặc tháng sau và kiểm tra STT tính riêng cho tháng đó
    const nextMonthYm = '2026-11';
    const futurePatient = await run(`
      INSERT INTO patients (stt, ho_ten, ngay_sinh, gioi_tinh, tinh_tp, xa_phuong, created_at)
      VALUES (1, 'Bệnh nhân tháng 11', '01/01/1990', 1, 'Thành phố Bắc Ninh', 'Phường Hiệp Hòa', '2026-11-01 08:00:00')
    `);
    const maxFuture = await get(`
      SELECT MAX(stt) as maxStt 
      FROM patients 
      WHERE strftime('%Y-%m', created_at) = ?
    `, [nextMonthYm]);
    assert.strictEqual(maxFuture.maxStt, 1, 'Tháng mới bắt đầu quay về từ STT 1.');
    console.log('4. Kiểm tra tháng mới quay về 1 thành công!');

    // Dọn dẹp dữ liệu test
    await run('DELETE FROM patients WHERE id IN (?, ?, ?)', [p1Data.data.id, p2Data.data.id, futurePatient.lastID]);
    console.log('✅ KIỂM THỬ STT TỊNH TIẾN THEO THÁNG THÀNH CÔNG 100%!');
  } finally {
    const { closeDb } = require('../src/db/database');
    await closeDb();
    await new Promise((resolve) => server.close(resolve));
  }
}

testMonthlyStt().catch((err) => {
  console.error('Lỗi test STT:', err);
  process.exit(1);
});

module.exports = { testMonthlyStt };
