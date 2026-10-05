const express = require('express');
const router = express.Router();
const { run, get } = require('../db/database');
const { broadcast } = require('../services/sseService');

// 1. Cập nhật Khám Thể Lực
router.put('/:id/the-luc', async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      ngay_do,
      can_nang,
      chieu_cao,
      mach,
      ha_tam_thu,
      ha_tam_truong,
      vong_nguc,
      phan_loai_the_luc,
      nguoi_kham
    } = req.body;

    await run(
      `INSERT INTO the_luc (
        patient_id, ngay_do, can_nang, chieu_cao, mach, ha_tam_thu, ha_tam_truong,
        vong_nguc, phan_loai_the_luc, nguoi_kham, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(patient_id) DO UPDATE SET
        ngay_do = excluded.ngay_do,
        can_nang = excluded.can_nang,
        chieu_cao = excluded.chieu_cao,
        mach = excluded.mach,
        ha_tam_thu = excluded.ha_tam_thu,
        ha_tam_truong = excluded.ha_tam_truong,
        vong_nguc = excluded.vong_nguc,
        phan_loai_the_luc = excluded.phan_loai_the_luc,
        nguoi_kham = excluded.nguoi_kham,
        updated_at = CURRENT_TIMESTAMP`,
      [
        patientId,
        ngay_do || new Date().toLocaleDateString('vi-VN'),
        can_nang ? Number(can_nang) : null,
        chieu_cao ? Number(chieu_cao) : null,
        mach ? Number(mach) : null,
        ha_tam_thu ? Number(ha_tam_thu) : null,
        ha_tam_truong ? Number(ha_tam_truong) : null,
        vong_nguc ? Number(vong_nguc) : null,
        phan_loai_the_luc ? Number(phan_loai_the_luc) : 1,
        nguoi_kham || ''
      ]
    );

    broadcast('EXAM_UPDATED', { patientId, room: 'the_luc' });
    res.json({ success: true, message: 'Đã lưu khám thể lực thành công.' });
  } catch (err) {
    console.error('Lỗi lưu khám thể lực:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Cập nhật Khám Lâm Sàng (Cho phép cập nhật từng phần hoặc toàn bộ chuyên khoa)
router.put('/:id/kham-lam-sang', async (req, res) => {
  try {
    const patientId = req.params.id;
    const data = req.body;

    // Đảm bảo đã có bản ghi trong kham_lam_sang
    const existing = await get('SELECT patient_id FROM kham_lam_sang WHERE patient_id = ?', [patientId]);
    if (!existing) {
      await run('INSERT INTO kham_lam_sang (patient_id) VALUES (?)', [patientId]);
    }

    // Xây dựng câu lệnh UPDATE động cho các trường được gửi lên
    const allowedFields = [
      // Noi
      'noi_ngay_kham', 'noi_tuan_hoan', 'noi_pl_tuan_hoan', 'noi_ho_hap', 'noi_pl_ho_hap',
      'noi_tieu_hoa', 'noi_pl_tieu_hoa', 'noi_than_tiet_nieu', 'noi_pl_than_tiet_nieu',
      'noi_noi_tiet', 'noi_pl_noi_tiet', 'noi_co_xuong_khop', 'noi_pl_co_xuong_khop',
      'noi_than_kinh', 'noi_pl_than_kinh', 'noi_tam_than', 'noi_pl_tam_than', 'noi_bac_sy',
      // Ngoai
      'ngoai_ket_qua', 'ngoai_phan_loai', 'ngoai_bac_sy',
      // Mat
      'mat_khong_kinh_phai', 'mat_khong_kinh_trai', 'mat_co_kinh_phai', 'mat_co_kinh_trai',
      'mat_benh', 'mat_phan_loai', 'mat_bac_sy',
      // TMH
      'tmh_tai_trai_thuong', 'tmh_tai_trai_tham', 'tmh_tai_phai_thuong', 'tmh_tai_phai_tham',
      'tmh_benh', 'tmh_phan_loai', 'tmh_bac_sy',
      // RHM
      'rhm_ham_tren', 'rhm_ham_duoi', 'rhm_benh', 'rhm_phan_loai', 'rhm_bac_sy',
      // Da lieu
      'da_lieu_ket_qua', 'da_lieu_phan_loai', 'da_lieu_bac_sy',
      // San
      'san_phu_khoa_ket_qua', 'san_phu_khoa_phan_loai', 'san_phu_khoa_bac_sy'
    ];

    const updates = [];
    const params = [];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(patientId);
      await run(`UPDATE kham_lam_sang SET ${updates.join(', ')} WHERE patient_id = ?`, params);
    }

    broadcast('EXAM_UPDATED', { patientId, room: data._room || 'kham_lam_sang' });
    res.json({ success: true, message: 'Đã lưu khám lâm sàng thành công.' });
  } catch (err) {
    console.error('Lỗi lưu khám lâm sàng:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Cập nhật Cận Lâm Sàng (Xét nghiệm & CĐHA)
router.put('/:id/can-lam-sang', async (req, res) => {
  try {
    const patientId = req.params.id;
    const data = req.body;

    const existing = await get('SELECT patient_id FROM can_lam_sang WHERE patient_id = ?', [patientId]);
    if (!existing) {
      await run('INSERT INTO can_lam_sang (patient_id) VALUES (?)', [patientId]);
    }

    const allowedFields = [
      'cls_hong_cau', 'cls_bach_cau', 'cls_tieu_cau', 'cls_huyet_sac_to',
      'cls_duong_huyet', 'cls_ure', 'cls_creatinin', 'cls_bilirubin_tp',
      'cls_ast', 'cls_alt', 'cls_ggt', 'cls_triglycerid', 'cls_cholesterol_tp',
      'cls_hdl_c', 'cls_ldl_c', 'cls_hba1c',
      'cls_afp', 'cls_cea', 'cls_psa_total', 'cls_hbsag', 'cls_hbsab', 'cls_anti_hcv',
      'cls_axit_uric', 'cls_glucose', 'cls_protein_nieu', 'cls_nuoc_tieu_hong_cau', 'cls_nuoc_tieu_bach_cau',
      'cls_dien_tim', 'cls_xquang', 'cls_sieu_am', 'cls_cdha_khac', 'cls_xet_nghiem_khac', 'cls_bac_sy'
    ];

    const updates = [];
    const params = [];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(patientId);
      await run(`UPDATE can_lam_sang SET ${updates.join(', ')} WHERE patient_id = ?`, params);
    }

    broadcast('EXAM_UPDATED', { patientId, room: 'can_lam_sang' });
    res.json({ success: true, message: 'Đã lưu kết quả cận lâm sàng thành công.' });
  } catch (err) {
    console.error('Lỗi lưu cận lâm sàng:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Cập nhật Kết Luận KSK
router.put('/:id/ket-luan', async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      phan_loai_suc_khoe,
      mo_ta_benh_tat,
      ma_icd10,
      loi_dan_bac_si,
      ngay_ket_luan,
      bac_si_ket_luan,
      ma_cskcb,
      force
    } = req.body;

    // Kiểm tra bắt buộc hoàn thành 7 chuyên khoa cơ bản
    const theLuc = await get('SELECT can_nang, chieu_cao, ha_tam_thu FROM the_luc WHERE patient_id = ?', [patientId]);
    const isTheLucDone = !!(theLuc && (theLuc.can_nang || theLuc.chieu_cao || theLuc.ha_tam_thu));

    const ls = await get('SELECT * FROM kham_lam_sang WHERE patient_id = ?', [patientId]);
    const isNoiDone = !!(ls && (ls.noi_bac_sy || ls.noi_pl_tuan_hoan || ls.noi_tuan_hoan || ls.noi_ngay_kham));
    const isNgoaiDone = !!(ls && (ls.ngoai_phan_loai || ls.ngoai_ket_qua || ls.ngoai_bac_sy));
    const isMatDone = !!(ls && (ls.mat_phan_loai || ls.mat_khong_kinh_phai || ls.mat_benh || ls.mat_bac_sy));
    const isTmhDone = !!(ls && (ls.tmh_phan_loai || ls.tmh_benh || ls.tmh_tai_trai_thuong || ls.tmh_bac_sy));
    const isRhmDone = !!(ls && (ls.rhm_phan_loai || ls.rhm_benh || ls.rhm_ham_tren || ls.rhm_bac_sy));
    const isDaLieuDone = !!(ls && (ls.da_lieu_phan_loai || ls.da_lieu_ket_qua || ls.da_lieu_bac_sy));

    const missingRooms = [];
    if (!isTheLucDone) missingRooms.push('Thể Lực');
    if (!isNoiDone) missingRooms.push('Khám Nội');
    if (!isNgoaiDone) missingRooms.push('Khám Ngoại');
    if (!isMatDone) missingRooms.push('Khám Mắt');
    if (!isTmhDone) missingRooms.push('Khám TMH');
    if (!isRhmDone) missingRooms.push('Khám RHM');
    if (!isDaLieuDone) missingRooms.push('Khám Da Liễu');

    if (missingRooms.length > 0 && !force) {
      return res.status(400).json({
        success: false,
        message: `Bệnh nhân chưa khám đủ 7 phòng bắt buộc: ${missingRooms.join(', ')}. Chưa thể ký và kết luận hồ sơ.`
      });
    }

    await run(
      `INSERT INTO ket_luan (
        patient_id, phan_loai_suc_khoe, mo_ta_benh_tat, ma_icd10,
        loi_dan_bac_si, ngay_ket_luan, bac_si_ket_luan, ma_cskcb, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(patient_id) DO UPDATE SET
        phan_loai_suc_khoe = excluded.phan_loai_suc_khoe,
        mo_ta_benh_tat = excluded.mo_ta_benh_tat,
        ma_icd10 = excluded.ma_icd10,
        loi_dan_bac_si = excluded.loi_dan_bac_si,
        ngay_ket_luan = excluded.ngay_ket_luan,
        bac_si_ket_luan = excluded.bac_si_ket_luan,
        ma_cskcb = excluded.ma_cskcb,
        updated_at = CURRENT_TIMESTAMP`,
      [
        patientId,
        phan_loai_suc_khoe ? Number(phan_loai_suc_khoe) : 1,
        mo_ta_benh_tat || '',
        ma_icd10 || 'Z00.0',
        loi_dan_bac_si || '',
        ngay_ket_luan || new Date().toLocaleDateString('vi-VN'),
        bac_si_ket_luan || '',
        ma_cskcb || ''
      ]
    );

    // Đánh dấu trạng thái bệnh nhân là HOAN_THANH
    await run("UPDATE patients SET trang_thai = 'HOAN_THANH' WHERE id = ?", [patientId]);

    broadcast('EXAM_UPDATED', { patientId, room: 'ket_luan' });
    res.json({ success: true, message: 'Đã lưu kết luận KSK thành công.' });
  } catch (err) {
    console.error('Lỗi lưu kết luận:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
