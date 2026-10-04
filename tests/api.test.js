process.env.NODE_ENV = 'test';
const assert = require('assert');
const { startServer } = require('../src/server');

async function testApi() {
  console.log('--- Đang chạy kiểm thử Backend REST APIs ---');
  const { server, port } = await startServer(0);
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Thêm bệnh nhân mới
    const addRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ho_ten: 'Trần Thị Thu Thảo',
        ngay_sinh: '20/11/1995',
        gioi_tinh: 2,
        cccd: '079195000111',
        sdt: '0909123456',
        doi_tuong_ksk: '64',
        dot_kham: 'Đoàn Test API'
      })
    });
    const addJson = await addRes.json();
    assert.strictEqual(addJson.success, true);
    const pId = addJson.data.id;
    console.log(`1. Thêm bệnh nhân thành công, ID: ${pId}`);

    // 2. Nhập Khám Thể Lực
    const theLucRes = await fetch(`${baseUrl}/api/patients/${pId}/the-luc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ngay_do: '02/10/2026',
        can_nang: 52,
        chieu_cao: 160,
        mach: 78,
        ha_tam_thu: 110,
        ha_tam_truong: 70,
        vong_nguc: 82,
        phan_loai_the_luc: 1,
        nguoi_kham: 'BS. Tiếp'
      })
    });
    const theLucJson = await theLucRes.json();
    assert.strictEqual(theLucJson.success, true);
    console.log('2. Nhập khám thể lực thành công.');

    // 3. Nhập Khám Mắt & Răng Hàm Mặt
    const lamSangRes = await fetch(`${baseUrl}/api/patients/${pId}/kham-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mat_khong_kinh_phai: '10',
        mat_khong_kinh_trai: '9',
        mat_phan_loai: 1,
        mat_bac_sy: 'BS. Nhãn',
        rhm_ham_tren: 'Bình thường',
        rhm_ham_duoi: 'Sâu răng số 7',
        rhm_phan_loai: 2,
        rhm_bac_sy: 'BS. Nha'
      })
    });
    const lamSangJson = await lamSangRes.json();
    assert.strictEqual(lamSangJson.success, true);
    console.log('3. Nhập khám lâm sàng (mắt, răng) thành công.');

    // 4. Nhập Kết Luận
    const ketLuanRes = await fetch(`${baseUrl}/api/patients/${pId}/ket-luan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phan_loai_suc_khoe: 2,
        mo_ta_benh_tat: 'Sâu răng số 7 hàm dưới',
        ma_icd10: 'K02',
        loi_dan_bac_si: 'Đi hàn răng số 7',
        ngay_ket_luan: '02/10/2026',
        bac_si_ket_luan: 'Nguyễn Văn Làn',
        ma_cskcb: '24275'
      })
    });
    const ketLuanJson = await ketLuanRes.json();
    assert.strictEqual(ketLuanJson.success, true);
    console.log('4. Nhập kết luận KSK thành công.');

    // 5. Kiểm tra lấy toàn bộ hồ sơ
    const detailRes = await fetch(`${baseUrl}/api/patients/${pId}`);
    const detailJson = await detailRes.json();
    assert.strictEqual(detailJson.success, true);
    assert.strictEqual(detailJson.data.the_luc.can_nang, 52);
    assert.strictEqual(detailJson.data.kham_lam_sang.mat_bac_sy, 'BS. Nhãn');
    assert.strictEqual(detailJson.data.ket_luan.ma_icd10, 'K02');
    assert.strictEqual(detailJson.data.patient.trang_thai, 'HOAN_THANH');
    console.log('5. Truy vấn kiểm tra chi tiết hồ sơ hoàn tất thành công!');

    // 6. Kiểm tra xóa bệnh nhân với mật khẩu sai (111 / 222abc) -> phải trả về 403
    const delFailRes = await fetch(`${baseUrl}/api/patients/${pId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': encodeURIComponent('111')
      },
      body: JSON.stringify({ adminPin: '222 222abc' })
    });
    assert.strictEqual(delFailRes.status, 403);
    const delFailJson = await delFailRes.json();
    assert.strictEqual(delFailJson.success, false);
    console.log('6. Kiểm tra chặn mật khẩu sai (403) thành công!');

    // 7. Kiểm tra xóa bệnh nhân với mật khẩu đúng (BVHC@123$%^) -> phải thành công 200
    const delSuccessRes = await fetch(`${baseUrl}/api/patients/${pId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': encodeURIComponent('BVHC@123$%^')
      },
      body: JSON.stringify({ adminPin: 'BVHC@123$%^' })
    });
    assert.strictEqual(delSuccessRes.status, 200);
    const delSuccessJson = await delSuccessRes.json();
    assert.strictEqual(delSuccessJson.success, true);

    // Kiểm tra bệnh nhân đã biến mất hoàn toàn
    const checkDeletedRes = await fetch(`${baseUrl}/api/patients/${pId}`);
    assert.strictEqual(checkDeletedRes.status, 404);
    console.log('7. Xóa thành công bằng mật khẩu BVHC@123$%^ và kiểm tra sạch dữ liệu thành công!');

    console.log('✅ TEST REST APIs HOÀN TẤT THÀNH CÔNG!');
  } finally {
    const { closeDb } = require('../src/db/database');
    await closeDb();
    await new Promise((resolve) => server.close(resolve));
  }
}

testApi().catch((err) => {
  console.error('❌ Lỗi kiểm thử API:', err);
  process.exit(1);
});
