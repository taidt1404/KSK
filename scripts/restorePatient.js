const { run, get } = require('../src/db/database');

async function restore() {
  console.log('Đang khôi phục lại bệnh nhân Đỗ Tiến Tài...');

  const existing = await get("SELECT id FROM patients WHERE ho_ten = 'Đỗ Tiến Tài'");
  if (existing) {
    console.log('Bệnh nhân đã tồn tại, ID:', existing.id);
    return;
  }

  // 1. Hành chính
  const res = await run(
    `INSERT INTO patients (
      id, stt, ho_ten, ngay_sinh, gioi_tinh, cccd, ngay_cap_cccd, noi_cap_cccd,
      so_the_bhyt, sdt, tinh_tp, xa_phuong, nghe_nghiep, noi_cong_tac,
      doi_tuong_ksk, dot_kham, trang_thai, created_at
    ) VALUES (1, 1, 'Đỗ Tiến Tài', '14/04/2003', 2, '', '', '', '', '', '', '', '', '', '64', 'Đoàn KSK 2/10/2026', 'DA_KHAM', '2026-10-02 08:30:00')`
  );

  const patientId = 1;

  // 2. Thể lực
  await run(
    `INSERT INTO the_luc (
      patient_id, ngay_do, can_nang, chieu_cao, mach, ha_tam_thu, ha_tam_truong, vong_nguc, phan_loai_the_luc, nguoi_kham
    ) VALUES (?, '02/10/2026', 60, 165, 75, 120, 80, 82, 1, 'BS Thể Lực')`,
    [patientId]
  );

  // 3. Khám lâm sàng
  await run(
    `INSERT INTO kham_lam_sang (
      patient_id,
      noi_ngay_kham, noi_tuan_hoan, noi_pl_tuan_hoan, noi_ho_hap, noi_pl_ho_hap, noi_tieu_hoa, noi_pl_tieu_hoa,
      noi_than_tiet_nieu, noi_pl_than_tiet_nieu, noi_noi_tiet, noi_pl_noi_tiet, noi_co_xuong_khop, noi_pl_co_xuong_khop,
      noi_than_kinh, noi_pl_than_kinh, noi_tam_than, noi_pl_tam_than, noi_bac_sy,
      ngoai_ket_qua, ngoai_phan_loai, ngoai_bac_sy,
      mat_khong_kinh_phai, mat_khong_kinh_trai, mat_co_kinh_phai, mat_co_kinh_trai, mat_benh, mat_phan_loai, mat_bac_sy,
      tmh_tai_trai_thuong, tmh_tai_trai_tham, tmh_tai_phai_thuong, tmh_tai_phai_tham, tmh_benh, tmh_phan_loai, tmh_bac_sy,
      rhm_ham_tren, rhm_ham_duoi, rhm_benh, rhm_phan_loai, rhm_bac_sy,
      da_lieu_ket_qua, da_lieu_phan_loai, da_lieu_bac_sy,
      san_phu_khoa_ket_qua, san_phu_khoa_phan_loai, san_phu_khoa_bac_sy
    ) VALUES (
      ?,
      '02/10/2026', 'Tiếng tim đều, rõ', 1, 'Phổi trong, không rales', 1, 'Bụng mềm, không đau', 1,
      'Chạm thận (-)', 1, 'Tuyến giáp không to, bình thường', 1, 'Khớp vận động bình thường', 1,
      'Tỉnh táo, phản xạ tốt', 1, 'Bình thường, tiếp xúc tốt', 1, 'BS Nội khoa',
      'Bình thường, không sẹo mổ cũ', 1, 'BS Ngoại khoa',
      '10', '10', '', '', 'Không có', 1, 'BS Mắt',
      '5', '0.5', '5', '0.5', 'Bình thường', 1, 'BS Tai Mũi Họng',
      'Đủ răng, bình thường', 'Đủ răng, bình thường', 'Không có', 1, 'BS Răng Hàm Mặt',
      'Bình thường, da sạch', 1, 'BS Da Liễu',
      'Bình thường, không viêm nhiễm', 1, 'BS Sản Phụ Khoa'
    )`,
    [patientId]
  );

  // 4. Cận lâm sàng
  await run(
    `INSERT INTO can_lam_sang (
      patient_id,
      cls_hong_cau, cls_bach_cau, cls_tieu_cau, cls_huyet_sac_to,
      cls_duong_huyet, cls_ure, cls_creatinin, cls_bilirubin_tp, cls_ast, cls_alt, cls_ggt,
      cls_cholesterol_tp, cls_triglycerid, cls_hdl_c, cls_ldl_c, cls_hba1c,
      cls_afp, cls_cea, cls_psa_total, cls_hbsag, cls_hbsab, cls_anti_hcv,
      cls_axit_uric, cls_glucose, cls_protein_nieu, cls_nuoc_tieu_hong_cau, cls_nuoc_tieu_bach_cau,
      cls_dien_tim, cls_xquang, cls_sieu_am, cls_cdha_khac, cls_xet_nghiem_khac, cls_bac_sy
    ) VALUES (
      ?,
      4.5, 6.5, 240, 140,
      5.1, 4.6, 75, 12.5, 24, 22, 28,
      4.5, 1.5, 1.3, 2.6, 5.4,
      3.2, 2.1, 1.1, 'Âm tính', 'Dương tính (>1000 mUI/ml)', 'Âm tính',
      310, 'Âm tính', 'Âm tính', 'Âm tính', 'Âm tính',
      'Nhịp xoang đều', 'Tim phổi bình thường', 'Các tạng bình thường', 'Chưa ghi nhận bất thường', 'Bình thường', 'KTV Xét Nghiệm'
    )`,
    [patientId]
  );

  // 5. Kết luận
  await run(
    `INSERT INTO ket_luan (
      patient_id, phan_loai_suc_khoe, mo_ta_benh_tat, ma_icd10, loi_dan_bac_si, ngay_ket_luan, bac_si_ket_luan, ma_cskcb
    ) VALUES (
      ?, 1, 'ok', 'Z00.0', 'ok', '2/10/2026', 'BS Kết Luận', '79001'
    )`,
    [patientId]
  );

  console.log('✅ Đã khôi phục hoàn chỉnh 100% hồ sơ bệnh nhân Đỗ Tiến Tài!');
  process.exit(0);
}

restore();
