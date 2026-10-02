const assert = require('assert');
const ExcelJS = require('exceljs');
const { startServer } = require('../src/server');
const { closeDb } = require('../src/db/database');

async function testE2E() {
  console.log('--- Đang chạy kiểm thử tích hợp toàn diện (E2E Integration Test) ---');
  const { server, port } = await startServer(0);
  const baseUrl = `http://localhost:${port}`;

  try {
    const dotKham = 'Đoàn KSK Alpha 2026';

    // 1. Tiếp đón 3 bệnh nhân
    console.log('1. Tiếp đón 3 bệnh nhân...');
    const patients = [
      { ho_ten: 'Lê Văn Nam', ngay_sinh: '12/03/1985', gioi_tinh: 1, cccd: '001085001111', sdt: '0912111222', dot_kham: dotKham, noi_cong_tac: 'Công ty Alpha' },
      { ho_ten: 'Nguyễn Thị Hoa', ngay_sinh: '25/08/1992', gioi_tinh: 2, cccd: '001092002222', sdt: '0912333444', dot_kham: dotKham, noi_cong_tac: 'Công ty Alpha' },
      { ho_ten: 'Phạm Minh Đức', ngay_sinh: '04/11/1990', gioi_tinh: 1, cccd: '001090003333', sdt: '0912555666', dot_kham: dotKham, noi_cong_tac: 'Công ty Alpha' }
    ];

    const pIds = [];
    for (const p of patients) {
      const res = await fetch(`${baseUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const json = await res.json();
      assert.strictEqual(json.success, true);
      pIds.push(json.data.id);
    }
    console.log(`Đã tiếp đón 3 bệnh nhân với IDs: ${pIds.join(', ')}`);

    // 2. Khám Thể Lực (Phòng 1)
    console.log('2. Nhập Khám Thể Lực cho cả 3 bệnh nhân...');
    await fetch(`${baseUrl}/api/patients/${pIds[0]}/the-luc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngay_do: '02/10/2026', can_nang: 68, chieu_cao: 172, mach: 76, ha_tam_thu: 120, ha_tam_truong: 80, vong_nguc: 88, phan_loai_the_luc: 1, nguoi_kham: 'Y tá Hạnh' })
    });
    await fetch(`${baseUrl}/api/patients/${pIds[1]}/the-luc`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ngay_do: '02/10/2026', can_nang: 50, chieu_cao: 158, mach: 80, ha_tam_thu: 110, ha_tam_truong: 70, vong_nguc: 78, phan_loai_the_luc: 1, nguoi_kham: 'Y tá Hạnh' })
    });

    // 3. Khám Mắt (Phòng 2)
    console.log('3. Nhập Khám Mắt...');
    await fetch(`${baseUrl}/api/patients/${pIds[0]}/kham-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mat_khong_kinh_phai: '10', mat_khong_kinh_trai: '10', mat_benh: 'Không', mat_phan_loai: 1, mat_bac_sy: 'BS. Mắt Tâm' })
    });
    await fetch(`${baseUrl}/api/patients/${pIds[1]}/kham-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mat_khong_kinh_phai: '5', mat_khong_kinh_trai: '6', mat_co_kinh_phai: '10', mat_co_kinh_trai: '10', mat_benh: 'Cận thị 2 mắt', mat_phan_loai: 2, mat_bac_sy: 'BS. Mắt Tâm' })
    });

    // 4. Khám Răng Hàm Mặt, TMH, Nội, Ngoại, Phụ Khoa
    console.log('4. Nhập các chuyên khoa lâm sàng...');
    await fetch(`${baseUrl}/api/patients/${pIds[0]}/kham-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noi_ngay_kham: '02/10/2026',
        noi_tuan_hoan: 'Đều, rõ',
        noi_pl_tuan_hoan: 1,
        noi_ho_hap: 'Phổi trong',
        noi_pl_ho_hap: 1,
        noi_bac_sy: 'BS. Nội Khoa',
        tmh_tai_trai_thuong: '5',
        tmh_tai_phai_thuong: '5',
        tmh_phan_loai: 1,
        tmh_bac_sy: 'BS. TMH',
        rhm_ham_tren: 'Đủ răng',
        rhm_ham_duoi: 'Đủ răng',
        rhm_phan_loai: 1,
        rhm_bac_sy: 'BS. RHM'
      })
    });
    // Bệnh nhân 2 là nữ: có khám phụ khoa
    await fetch(`${baseUrl}/api/patients/${pIds[1]}/kham-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noi_ngay_kham: '02/10/2026',
        noi_tuan_hoan: 'Đều, rõ',
        noi_pl_tuan_hoan: 1,
        noi_bac_sy: 'BS. Nội Khoa',
        san_phu_khoa_ket_qua: 'Bình thường, không viêm',
        san_phu_khoa_phan_loai: 1,
        san_phu_khoa_bac_sy: 'BS. Phụ Khoa Ánh'
      })
    });

    // 5. Cận lâm sàng
    console.log('5. Nhập Cận Lâm Sàng...');
    await fetch(`${baseUrl}/api/patients/${pIds[0]}/can-lam-sang`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cls_hong_cau: 4.8, cls_bach_cau: 6.2, cls_tieu_cau: 230, cls_duong_huyet: 5.0,
        cls_xquang: 'Tim phổi bình thường', cls_sieu_am: 'Bình thường', cls_bac_sy: 'BS. CĐHA Tuấn'
      })
    });

    // 6. Phòng Kết Luận
    console.log('6. Hoàn tất kết luận KSK...');
    await fetch(`${baseUrl}/api/patients/${pIds[0]}/ket-luan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phan_loai_suc_khoe: 1,
        mo_ta_benh_tat: 'Hiện tại chưa phát hiện bệnh lý',
        ma_icd10: 'Z00.0',
        loi_dan_bac_si: 'Duy trì chế độ sinh hoạt lành mạnh',
        ngay_ket_luan: '02/10/2026',
        bac_si_ket_luan: 'BS. Trưởng Đoàn Vũ',
        ma_cskcb: '79001'
      })
    });

    await fetch(`${baseUrl}/api/patients/${pIds[1]}/ket-luan`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phan_loai_suc_khoe: 2,
        mo_ta_benh_tat: 'Tật khúc xạ cận thị hai mắt',
        ma_icd10: 'H52.1',
        loi_dan_bac_si: 'Đeo kính đúng độ, khám mắt định kỳ',
        ngay_ket_luan: '02/10/2026',
        bac_si_ket_luan: 'BS. Trưởng Đoàn Vũ',
        ma_cskcb: '79001'
      })
    });

    // 7. Xuất file Excel từ API
    console.log('7. Tải file Excel báo cáo kết quả qua API xuất 108 cột...');
    const exportRes = await fetch(`${baseUrl}/api/excel/export?dot_kham=${encodeURIComponent(dotKham)}`);
    assert.strictEqual(exportRes.status, 200);
    const excelBuffer = Buffer.from(await exportRes.arrayBuffer());

    assert(excelBuffer.length > 50000, 'File Excel xuất ra phải có dung lượng đầy đủ (> 50KB).');

    // 8. Đọc lại file Excel để kiểm tra tính toàn vẹn 108 cột
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer);

    const ws = workbook.getWorksheet(1);
    assert.strictEqual(ws.name, 'Ket qua KSKDK');

    // Kiểm tra dòng tiêu đề
    assert(ws.getRow(1).getCell(1).text.includes('DANH SÁCH KẾT QUẢ KHÁM SỨC KHỎE ĐỊNH KỲ'));
    assert(ws.getRow(4).getCell(2).text.includes('Họ và tên'));
    assert(ws.columnCount >= 107, 'Phải có đầy đủ các cột chuẩn.');

    // Kiểm tra dòng 5 (Bệnh nhân Lê Văn Nam)
    const row5 = ws.getRow(5);
    assert.strictEqual(row5.getCell(2).text, 'Lê Văn Nam');
    assert.strictEqual(row5.getCell(4).value, 1); // Nam = 1
    assert.strictEqual(row5.getCell(16).value, 68); // Cân nặng
    assert.strictEqual(row5.getCell(44).value, '10'); // Mắt phải 10/10
    assert.strictEqual(row5.getCell(101).value, 1); // Phân loại sức khỏe loại 1
    assert.strictEqual(row5.getCell(103).value, 'Z00.0'); // Mã ICD10

    // Kiểm tra dòng 6 (Bệnh nhân Nguyễn Thị Hoa - Nữ)
    const row6 = ws.getRow(6);
    assert.strictEqual(row6.getCell(2).text, 'Nguyễn Thị Hoa');
    assert.strictEqual(row6.getCell(4).value, 2); // Nữ = 2
    assert.strictEqual(row6.getCell(16).value, 50); // Cân nặng
    assert.strictEqual(row6.getCell(66).value, 'Bình thường, không viêm'); // Sản phụ khoa
    assert.strictEqual(row6.getCell(68).value, 'BS. Phụ Khoa Ánh');
    assert.strictEqual(row6.getCell(101).value, 2); // Phân loại sức khỏe loại 2
    assert.strictEqual(row6.getCell(103).value, 'H52.1'); // Tật cận thị

    // Kiểm tra các sheet danh mục còn nguyên vẹn
    assert(workbook.getWorksheet('DM Mã đối tượng KSK'), 'Sheet DM đối tượng phải có.');
    assert(workbook.getWorksheet('DM Địa chỉ'), 'Sheet DM địa chỉ phải có.');
    assert(workbook.getWorksheet('DM Nghề nghiệp'), 'Sheet DM nghề nghiệp phải có.');

    console.log('8. Dữ liệu đối chiếu file Excel chính xác 100%!');
    console.log('🎉 KIỂM THỬ TOÀN DIỆN E2E THÀNH CÔNG VƯỢT TRỘI!');
  } finally {
    await closeDb();
    await new Promise((resolve) => server.close(resolve));
  }
}

testE2E()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Lỗi kiểm thử E2E:', err);
    process.exit(1);
  });
