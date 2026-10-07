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

    // 3. Nhập một phần Khám Lâm Sàng (mắt, răng)
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

    // 4. Kiểm tra chặn ký kết luận khi chưa đủ 7 phòng bắt buộc
    const blockRes = await fetch(`${baseUrl}/api/patients/${pId}/ket-luan`, {
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
    const blockJson = await blockRes.json();
    assert.strictEqual(blockRes.status, 400);
    assert(blockJson.message.includes('chưa khám đủ 7 phòng bắt buộc'));
    console.log('4. Kiểm tra chặn ký kết luận khi thiếu phòng bắt buộc thành công!');

    // Hoàn thành nốt các phòng bắt buộc: Nội, Ngoại, TMH, Da Liễu
    await fetch(`${baseUrl}/api/patients/${pId}/kham-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noi_bac_sy: 'BS. Nội',
        ngoai_bac_sy: 'BS. Ngoại',
        tmh_bac_sy: 'BS. TMH',
        da_lieu_bac_sy: 'BS. Da Liễu'
      })
    });

    // Ký kết luận sau khi đã đủ 7 phòng
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
    console.log('5. Nhập kết luận KSK sau khi đủ 7 phòng thành công.');

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

    // 7. Kiểm tra Soft Delete với mật khẩu đúng (BVHC@123$%^) -> chuyển vào thùng rác
    const softDelRes = await fetch(`${baseUrl}/api/patients/${pId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': encodeURIComponent('BVHC@123$%^')
      },
      body: JSON.stringify({ adminPin: 'BVHC@123$%^' })
    });
    assert.strictEqual(softDelRes.status, 200);
    const softDelJson = await softDelRes.json();
    assert.strictEqual(softDelJson.success, true);

    // Kiểm tra bệnh nhân không còn ở danh sách hoạt động
    const listActiveRes = await fetch(`${baseUrl}/api/patients`);
    const listActiveJson = await listActiveRes.json();
    assert.strictEqual(listActiveJson.data.some((p) => p.id === pId), false);

    // Kiểm tra bệnh nhân xuất hiện trong Thùng rác
    const listTrashRes = await fetch(`${baseUrl}/api/patients?trash=true`);
    const listTrashJson = await listTrashRes.json();
    assert.strictEqual(listTrashJson.data.some((p) => p.id === pId), true);
    console.log('7. Xóa tạm thời (Soft Delete) vào Thùng rác thành công!');

    // 8. Kiểm tra Khôi phục (Restore) từ Thùng rác
    const restoreRes = await fetch(`${baseUrl}/api/patients/${pId}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': encodeURIComponent('BVHC@123$%^')
      },
      body: JSON.stringify({ adminPin: 'BVHC@123$%^' })
    });
    assert.strictEqual(restoreRes.status, 200);
    const restoreJson = await restoreRes.json();
    assert.strictEqual(restoreJson.success, true);

    // Bệnh nhân quay lại danh sách hoạt động
    const listRestoredRes = await fetch(`${baseUrl}/api/patients`);
    const listRestoredJson = await listRestoredRes.json();
    assert.strictEqual(listRestoredJson.data.some((p) => p.id === pId), true);
    console.log('8. Khôi phục hồ sơ bệnh nhân từ Thùng rác thành công 100%!');

    // 9. Kiểm tra Xóa vĩnh viễn (Permanent Delete)
    const permDelRes = await fetch(`${baseUrl}/api/patients/${pId}?permanent=true`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': encodeURIComponent('BVHC@123$%^')
      },
      body: JSON.stringify({ adminPin: 'BVHC@123$%^' })
    });
    assert.strictEqual(permDelRes.status, 200);

    const checkPermanentlyDeletedRes = await fetch(`${baseUrl}/api/patients/${pId}`);
    assert.strictEqual(checkPermanentlyDeletedRes.status, 404);
    console.log('9. Xóa vĩnh viễn (Permanent Delete) hoàn toàn sạch dữ liệu thành công!');

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
