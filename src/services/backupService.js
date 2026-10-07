const fs = require('fs');
const path = require('path');
const { get, all, run, exec } = require('../db/database');
const { broadcast } = require('./sseService');

const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Lấy ngày hiện tại dạng YYYY-MM-DD theo giờ địa phương
function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tạo dữ liệu JSON sao lưu toàn bộ hồ sơ bệnh nhân và các phòng khám
 */
async function generateBackupPayload(reason = 'auto') {
  const patients = await all('SELECT * FROM patients ORDER BY id ASC');
  const backupList = [];

  for (const p of patients) {
    const theLuc = await get('SELECT * FROM the_luc WHERE patient_id = ?', [p.id]);
    const khamLamSang = await get('SELECT * FROM kham_lam_sang WHERE patient_id = ?', [p.id]);
    const canLamSang = await get('SELECT * FROM can_lam_sang WHERE patient_id = ?', [p.id]);
    const ketLuan = await get('SELECT * FROM ket_luan WHERE patient_id = ?', [p.id]);

    backupList.push({
      patient: p,
      the_luc: theLuc || null,
      kham_lam_sang: khamLamSang || null,
      can_lam_sang: canLamSang || null,
      ket_luan: ketLuan || null
    });
  }

  return {
    app: 'KSK_LAN_SYSTEM',
    version: '1.0.0',
    schema_version: 2,
    exported_at: new Date().toISOString(),
    backup_date: getTodayDateStr(),
    reason,
    total_patients: backupList.length,
    data: backupList
  };
}

/**
 * Thực hiện xuất file sao lưu JSON (và snapshot file .db) vào thư mục backups/
 */
async function createFullBackup({ reason = 'auto', customDate } = {}) {
  try {
    const dateStr = customDate || getTodayDateStr();
    const payload = await generateBackupPayload(reason);
    const jsonFilename = `backup_${dateStr}.json`;
    const jsonPath = path.join(BACKUP_DIR, jsonFilename);

    // Ghi file JSON với định dạng đẹp (indent 2 spaces)
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    // Đồng thời tạo snapshot file database SQLite data/ksk.db sang backups/
    const dbSource = process.env.NODE_ENV === 'test'
      ? path.join(__dirname, '../../data/ksk_test.db')
      : path.join(__dirname, '../../data/ksk.db');

    let dbCopied = false;
    const dbFilename = `ksk_backup_${dateStr}.db`;
    const dbDest = path.join(BACKUP_DIR, dbFilename);
    if (fs.existsSync(dbSource)) {
      try {
        fs.copyFileSync(dbSource, dbDest);
        dbCopied = true;
      } catch (cpErr) {
        console.warn('Không thể sao lưu file .db vật lý:', cpErr.message);
      }
    }

    // Dọn dẹp bản sao lưu cũ (giữ lại 30 bản gần nhất)
    cleanOldBackups(30);

    return {
      success: true,
      filename: jsonFilename,
      filePath: jsonPath,
      dbFilename: dbCopied ? dbFilename : null,
      totalPatients: payload.total_patients,
      exportedAt: payload.exported_at
    };
  } catch (err) {
    console.error('Lỗi khi tạo bản sao lưu dữ liệu:', err);
    throw err;
  }
}

/**
 * Dọn dẹp các bản sao lưu cũ hơn N ngày
 */
function cleanOldBackups(maxFiles = 30) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('backup_') || f.startsWith('ksk_backup_'))
      .map((f) => {
        const full = path.join(BACKUP_DIR, f);
        return { name: f, time: fs.statSync(full).mtime.getTime() };
      })
      .sort((a, b) => b.time - a.time);

    if (files.length > maxFiles * 2) {
      const toDelete = files.slice(maxFiles * 2);
      for (const item of toDelete) {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, item.name));
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('Lỗi khi dọn dẹp backup cũ:', err.message);
  }
}

/**
 * Khôi phục / Nạp dữ liệu từ file JSON vào CSDL
 */
async function restoreFromJson(backupData) {
  if (!backupData || (!Array.isArray(backupData.data) && !Array.isArray(backupData.patients))) {
    throw new Error('Định dạng file sao lưu JSON không hợp lệ. Không tìm thấy mảng dữ liệu bệnh nhân.');
  }

  const patientRecords = Array.isArray(backupData.data) ? backupData.data : backupData.patients;
  let importedCount = 0;
  let updatedCount = 0;

  for (const item of patientRecords) {
    const p = item.patient || item;
    if (!p || !p.ho_ten || !p.ngay_sinh) continue;

    // 1. Kiểm tra xem bệnh nhân đã tồn tại trong CSDL chưa
    let existingPatient = null;
    if (p.cccd && p.cccd.trim()) {
      existingPatient = await get('SELECT id FROM patients WHERE cccd = ?', [p.cccd.trim()]);
    }
    if (!existingPatient && p.ho_ten && p.ngay_sinh) {
      existingPatient = await get(
        'SELECT id FROM patients WHERE ho_ten = ? AND ngay_sinh = ? AND (dot_kham = ? OR (dot_kham IS NULL AND ? IS NULL))',
        [p.ho_ten, p.ngay_sinh, p.dot_kham || null, p.dot_kham || null]
      );
    }
    if (!existingPatient && p.id) {
      existingPatient = await get('SELECT id FROM patients WHERE id = ?', [p.id]);
    }

    let targetPatientId = null;

    if (existingPatient) {
      // Cập nhật thông tin hành chính
      targetPatientId = existingPatient.id;
      await run(`
        UPDATE patients SET
          stt = COALESCE(?, stt),
          ho_ten = ?,
          ngay_sinh = ?,
          gioi_tinh = ?,
          cccd = ?,
          ngay_cap_cccd = ?,
          noi_cap_cccd = ?,
          so_the_bhyt = ?,
          sdt = ?,
          tinh_tp = ?,
          xa_phuong = ?,
          nghe_nghiep = ?,
          noi_cong_tac = ?,
          doi_tuong_ksk = ?,
          dot_kham = ?,
          trang_thai = COALESCE(?, trang_thai),
          is_deleted = COALESCE(?, is_deleted),
          deleted_at = ?
        WHERE id = ?
      `, [
        p.stt || null,
        (p.ho_ten || '').toUpperCase(),
        p.ngay_sinh,
        p.gioi_tinh || 1,
        p.cccd || '',
        p.ngay_cap_cccd || '',
        p.noi_cap_cccd || '',
        p.so_the_bhyt || '',
        p.sdt || '',
        p.tinh_tp || '',
        p.xa_phuong || '',
        p.nghe_nghiep || '',
        p.noi_cong_tac || '',
        p.doi_tuong_ksk || '',
        p.dot_kham || '',
        p.trang_thai || 'CHO_KHAM',
        p.is_deleted !== undefined ? p.is_deleted : 0,
        p.deleted_at || null,
        targetPatientId
      ]);
      updatedCount++;
    } else {
      // Thêm mới bệnh nhân
      const insertRes = await run(`
        INSERT INTO patients (
          stt, ho_ten, ngay_sinh, gioi_tinh, cccd, ngay_cap_cccd, noi_cap_cccd,
          so_the_bhyt, sdt, tinh_tp, xa_phuong, nghe_nghiep, noi_cong_tac,
          doi_tuong_ksk, dot_kham, trang_thai, is_deleted, deleted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
      `, [
        p.stt || null,
        (p.ho_ten || '').toUpperCase(),
        p.ngay_sinh,
        p.gioi_tinh || 1,
        p.cccd || '',
        p.ngay_cap_cccd || '',
        p.noi_cap_cccd || '',
        p.so_the_bhyt || '',
        p.sdt || '',
        p.tinh_tp || '',
        p.xa_phuong || '',
        p.nghe_nghiep || '',
        p.noi_cong_tac || '',
        p.doi_tuong_ksk || '',
        p.dot_kham || '',
        p.trang_thai || 'CHO_KHAM',
        p.is_deleted || 0,
        p.deleted_at || null,
        p.created_at || null
      ]);
      targetPatientId = insertRes.lastID;
      importedCount++;
    }

    // 2. Nạp Thể lực nếu có
    if (item.the_luc && Object.keys(item.the_luc).length > 0) {
      const tl = item.the_luc;
      const existTl = await get('SELECT patient_id FROM the_luc WHERE patient_id = ?', [targetPatientId]);
      if (existTl) {
        await run(`
          UPDATE the_luc SET
            ngay_do = ?, can_nang = ?, chieu_cao = ?, mach = ?, ha_tam_thu = ?,
            ha_tam_truong = ?, vong_nguc = ?, phan_loai_the_luc = ?, nguoi_kham = ?
          WHERE patient_id = ?
        `, [
          tl.ngay_do || null, tl.can_nang || null, tl.chieu_cao || null, tl.mach || null,
          tl.ha_tam_thu || null, tl.ha_tam_truong || null, tl.vong_nguc || null,
          tl.phan_loai_the_luc || null, tl.nguoi_kham || null, targetPatientId
        ]);
      } else {
        await run(`
          INSERT INTO the_luc (
            patient_id, ngay_do, can_nang, chieu_cao, mach, ha_tam_thu, ha_tam_truong, vong_nguc, phan_loai_the_luc, nguoi_kham
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          targetPatientId, tl.ngay_do || null, tl.can_nang || null, tl.chieu_cao || null,
          tl.mach || null, tl.ha_tam_thu || null, tl.ha_tam_truong || null,
          tl.vong_nguc || null, tl.phan_loai_the_luc || null, tl.nguoi_kham || null
        ]);
      }
    }

    // 3. Nạp Khám lâm sàng nếu có
    if (item.kham_lam_sang && Object.keys(item.kham_lam_sang).length > 0) {
      const k = item.kham_lam_sang;
      const existK = await get('SELECT patient_id FROM kham_lam_sang WHERE patient_id = ?', [targetPatientId]);
      if (existK) {
        await run(`
          UPDATE kham_lam_sang SET
            noi_ngay_kham = ?, noi_tuan_hoan = ?, noi_pl_tuan_hoan = ?, noi_ho_hap = ?, noi_pl_ho_hap = ?,
            noi_tieu_hoa = ?, noi_pl_tieu_hoa = ?, noi_than_tiet_nieu = ?, noi_pl_than_tiet_nieu = ?,
            noi_noi_tiet = ?, noi_pl_noi_tiet = ?, noi_co_xuong_khop = ?, noi_pl_co_xuong_khop = ?,
            noi_than_kinh = ?, noi_pl_than_kinh = ?, noi_tam_than = ?, noi_pl_tam_than = ?, noi_bac_sy = ?,
            ngoai_ket_qua = ?, ngoai_phan_loai = ?, ngoai_bac_sy = ?,
            mat_khong_kinh_phai = ?, mat_khong_kinh_trai = ?, mat_co_kinh_phai = ?, mat_co_kinh_trai = ?,
            mat_benh = ?, mat_phan_loai = ?, mat_bac_sy = ?,
            tmh_tai_trai_thuong = ?, tmh_tai_trai_tham = ?, tmh_tai_phai_thuong = ?, tmh_tai_phai_tham = ?,
            tmh_benh = ?, tmh_phan_loai = ?, tmh_bac_sy = ?,
            rhm_ham_tren = ?, rhm_ham_duoi = ?, rhm_benh = ?, rhm_phan_loai = ?, rhm_bac_sy = ?,
            da_lieu_ket_qua = ?, da_lieu_phan_loai = ?, da_lieu_bac_sy = ?,
            san_phu_khoa_ket_qua = ?, san_phu_khoa_phan_loai = ?, san_phu_khoa_bac_sy = ?
          WHERE patient_id = ?
        `, [
          k.noi_ngay_kham || null, k.noi_tuan_hoan || null, k.noi_pl_tuan_hoan || null, k.noi_ho_hap || null, k.noi_pl_ho_hap || null,
          k.noi_tieu_hoa || null, k.noi_pl_tieu_hoa || null, k.noi_than_tiet_nieu || null, k.noi_pl_than_tiet_nieu || null,
          k.noi_noi_tiet || null, k.noi_pl_noi_tiet || null, k.noi_co_xuong_khop || null, k.noi_pl_co_xuong_khop || null,
          k.noi_than_kinh || null, k.noi_pl_than_kinh || null, k.noi_tam_than || null, k.noi_pl_tam_than || null, k.noi_bac_sy || null,
          k.ngoai_ket_qua || null, k.ngoai_phan_loai || null, k.ngoai_bac_sy || null,
          k.mat_khong_kinh_phai || null, k.mat_khong_kinh_trai || null, k.mat_co_kinh_phai || null, k.mat_co_kinh_trai || null,
          k.mat_benh || null, k.mat_phan_loai || null, k.mat_bac_sy || null,
          k.tmh_tai_trai_thuong || null, k.tmh_tai_trai_tham || null, k.tmh_tai_phai_thuong || null, k.tmh_tai_phai_tham || null,
          k.tmh_benh || null, k.tmh_phan_loai || null, k.tmh_bac_sy || null,
          k.rhm_ham_tren || null, k.rhm_ham_duoi || null, k.rhm_benh || null, k.rhm_phan_loai || null, k.rhm_bac_sy || null,
          k.da_lieu_ket_qua || null, k.da_lieu_phan_loai || null, k.da_lieu_bac_sy || null,
          k.san_phu_khoa_ket_qua || null, k.san_phu_khoa_phan_loai || null, k.san_phu_khoa_bac_sy || null,
          targetPatientId
        ]);
      } else {
        await run(`
          INSERT INTO kham_lam_sang (
            patient_id, noi_ngay_kham, noi_tuan_hoan, noi_pl_tuan_hoan, noi_ho_hap, noi_pl_ho_hap,
            noi_tieu_hoa, noi_pl_tieu_hoa, noi_than_tiet_nieu, noi_pl_than_tiet_nieu,
            noi_noi_tiet, noi_pl_noi_tiet, noi_co_xuong_khop, noi_pl_co_xuong_khop,
            noi_than_kinh, noi_pl_than_kinh, noi_tam_than, noi_pl_tam_than, noi_bac_sy,
            ngoai_ket_qua, ngoai_phan_loai, ngoai_bac_sy,
            mat_khong_kinh_phai, mat_khong_kinh_trai, mat_co_kinh_phai, mat_co_kinh_trai,
            mat_benh, mat_phan_loai, mat_bac_sy,
            tmh_tai_trai_thuong, tmh_tai_trai_tham, tmh_tai_phai_thuong, tmh_tai_phai_tham,
            tmh_benh, tmh_phan_loai, tmh_bac_sy,
            rhm_ham_tren, rhm_ham_duoi, rhm_benh, rhm_phan_loai, rhm_bac_sy,
            da_lieu_ket_qua, da_lieu_phan_loai, da_lieu_bac_sy,
            san_phu_khoa_ket_qua, san_phu_khoa_phan_loai, san_phu_khoa_bac_sy
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `, [
          targetPatientId,
          k.noi_ngay_kham || null, k.noi_tuan_hoan || null, k.noi_pl_tuan_hoan || null, k.noi_ho_hap || null, k.noi_pl_ho_hap || null,
          k.noi_tieu_hoa || null, k.noi_pl_tieu_hoa || null, k.noi_than_tiet_nieu || null, k.noi_pl_than_tiet_nieu || null,
          k.noi_noi_tiet || null, k.noi_pl_noi_tiet || null, k.noi_co_xuong_khop || null, k.noi_pl_co_xuong_khop || null,
          k.noi_than_kinh || null, k.noi_pl_than_kinh || null, k.noi_tam_than || null, k.noi_pl_tam_than || null, k.noi_bac_sy || null,
          k.ngoai_ket_qua || null, k.ngoai_phan_loai || null, k.ngoai_bac_sy || null,
          k.mat_khong_kinh_phai || null, k.mat_khong_kinh_trai || null, k.mat_co_kinh_phai || null, k.mat_co_kinh_trai || null,
          k.mat_benh || null, k.mat_phan_loai || null, k.mat_bac_sy || null,
          k.tmh_tai_trai_thuong || null, k.tmh_tai_trai_tham || null, k.tmh_tai_phai_thuong || null, k.tmh_tai_phai_tham || null,
          k.tmh_benh || null, k.tmh_phan_loai || null, k.tmh_bac_sy || null,
          k.rhm_ham_tren || null, k.rhm_ham_duoi || null, k.rhm_benh || null, k.rhm_phan_loai || null, k.rhm_bac_sy || null,
          k.da_lieu_ket_qua || null, k.da_lieu_phan_loai || null, k.da_lieu_bac_sy || null,
          k.san_phu_khoa_ket_qua || null, k.san_phu_khoa_phan_loai || null, k.san_phu_khoa_bac_sy || null
        ]);
      }
    }

    // 4. Nạp Cận lâm sàng nếu có
    if (item.can_lam_sang && Object.keys(item.can_lam_sang).length > 0) {
      const c = item.can_lam_sang;
      const existC = await get('SELECT patient_id FROM can_lam_sang WHERE patient_id = ?', [targetPatientId]);
      if (existC) {
        await run(`
          UPDATE can_lam_sang SET
            cls_hong_cau = ?, cls_bach_cau = ?, cls_tieu_cau = ?, cls_huyet_sac_to = ?,
            cls_duong_huyet = ?, cls_ure = ?, cls_creatinin = ?, cls_bilirubin_tp = ?,
            cls_ast = ?, cls_alt = ?, cls_ggt = ?, cls_triglycerid = ?, cls_cholesterol_tp = ?,
            cls_hdl_c = ?, cls_ldl_c = ?, cls_hba1c = ?,
            cls_afp = ?, cls_cea = ?, cls_psa_total = ?, cls_hbsag = ?, cls_hbsab = ?, cls_anti_hcv = ?,
            cls_axit_uric = ?, cls_glucose = ?, cls_protein_nieu = ?, cls_nuoc_tieu_hong_cau = ?, cls_nuoc_tieu_bach_cau = ?,
            cls_dien_tim = ?, cls_xquang = ?, cls_sieu_am = ?, cls_cdha_khac = ?, cls_xet_nghiem_khac = ?, cls_bac_sy = ?
          WHERE patient_id = ?
        `, [
          c.cls_hong_cau || null, c.cls_bach_cau || null, c.cls_tieu_cau || null, c.cls_huyet_sac_to || null,
          c.cls_duong_huyet || null, c.cls_ure || null, c.cls_creatinin || null, c.cls_bilirubin_tp || null,
          c.cls_ast || null, c.cls_alt || null, c.cls_ggt || null, c.cls_triglycerid || null, c.cls_cholesterol_tp || null,
          c.cls_hdl_c || null, c.cls_ldl_c || null, c.cls_hba1c || null,
          c.cls_afp || null, c.cls_cea || null, c.cls_psa_total || null, c.cls_hbsag || null, c.cls_hbsab || null, c.cls_anti_hcv || null,
          c.cls_axit_uric || null, c.cls_glucose || null, c.cls_protein_nieu || null, c.cls_nuoc_tieu_hong_cau || null, c.cls_nuoc_tieu_bach_cau || null,
          c.cls_dien_tim || null, c.cls_xquang || null, c.cls_sieu_am || null, c.cls_cdha_khac || null, c.cls_xet_nghiem_khac || null, c.cls_bac_sy || null,
          targetPatientId
        ]);
      } else {
        await run(`
          INSERT INTO can_lam_sang (
            patient_id,
            cls_hong_cau, cls_bach_cau, cls_tieu_cau, cls_huyet_sac_to,
            cls_duong_huyet, cls_ure, cls_creatinin, cls_bilirubin_tp,
            cls_ast, cls_alt, cls_ggt, cls_triglycerid, cls_cholesterol_tp,
            cls_hdl_c, cls_ldl_c, cls_hba1c,
            cls_afp, cls_cea, cls_psa_total, cls_hbsag, cls_hbsab, cls_anti_hcv,
            cls_axit_uric, cls_glucose, cls_protein_nieu, cls_nuoc_tieu_hong_cau, cls_nuoc_tieu_bach_cau,
            cls_dien_tim, cls_xquang, cls_sieu_am, cls_cdha_khac, cls_xet_nghiem_khac, cls_bac_sy
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `, [
          targetPatientId,
          c.cls_hong_cau || null, c.cls_bach_cau || null, c.cls_tieu_cau || null, c.cls_huyet_sac_to || null,
          c.cls_duong_huyet || null, c.cls_ure || null, c.cls_creatinin || null, c.cls_bilirubin_tp || null,
          c.cls_ast || null, c.cls_alt || null, c.cls_ggt || null, c.cls_triglycerid || null, c.cls_cholesterol_tp || null,
          c.cls_hdl_c || null, c.cls_ldl_c || null, c.cls_hba1c || null,
          c.cls_afp || null, c.cls_cea || null, c.cls_psa_total || null, c.cls_hbsag || null, c.cls_hbsab || null, c.cls_anti_hcv || null,
          c.cls_axit_uric || null, c.cls_glucose || null, c.cls_protein_nieu || null, c.cls_nuoc_tieu_hong_cau || null, c.cls_nuoc_tieu_bach_cau || null,
          c.cls_dien_tim || null, c.cls_xquang || null, c.cls_sieu_am || null, c.cls_cdha_khac || null, c.cls_xet_nghiem_khac || null, c.cls_bac_sy || null
        ]);
      }
    }

    // 5. Nạp Kết luận nếu có
    if (item.ket_luan && Object.keys(item.ket_luan).length > 0) {
      const kl = item.ket_luan;
      const existKl = await get('SELECT patient_id FROM ket_luan WHERE patient_id = ?', [targetPatientId]);
      if (existKl) {
        await run(`
          UPDATE ket_luan SET
            phan_loai_suc_khoe = ?, mo_ta_benh_tat = ?, ma_icd10 = ?,
            loi_dan_bac_si = ?, ngay_ket_luan = ?, bac_si_ket_luan = ?, ma_cskcb = ?
          WHERE patient_id = ?
        `, [
          kl.phan_loai_suc_khoe || null, kl.mo_ta_benh_tat || null, kl.ma_icd10 || null,
          kl.loi_dan_bac_si || null, kl.ngay_ket_luan || null, kl.bac_si_ket_luan || null,
          kl.ma_cskcb || null, targetPatientId
        ]);
      } else {
        await run(`
          INSERT INTO ket_luan (
            patient_id, phan_loai_suc_khoe, mo_ta_benh_tat, ma_icd10,
            loi_dan_bac_si, ngay_ket_luan, bac_si_ket_luan, ma_cskcb
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          targetPatientId, kl.phan_loai_suc_khoe || null, kl.mo_ta_benh_tat || null,
          kl.ma_icd10 || null, kl.loi_dan_bac_si || null, kl.ngay_ket_luan || null,
          kl.bac_si_ket_luan || null, kl.ma_cskcb || null
        ]);
      }
    }
  }

  // Phát tín hiệu SSE thông báo toàn bộ hệ thống cập nhật danh sách
  broadcast('PATIENTS_BATCH_IMPORTED', { count: importedCount + updatedCount });

  return {
    success: true,
    imported: importedCount,
    updated: updatedCount,
    total: patientRecords.length
  };
}

/**
 * Lấy danh sách các bản sao lưu hiện có trong thư mục backups/
 */
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.json') || f.endsWith('.db'))
    .map((filename) => {
      const fullPath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(fullPath);
      return {
        filename,
        sizeBytes: stat.size,
        sizeKb: (stat.size / 1024).toFixed(1) + ' KB',
        createdAt: stat.mtime.toISOString(),
        type: filename.endsWith('.json') ? 'json' : 'db'
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return files;
}

/**
 * Khởi động tiến trình tự động sao lưu định kỳ
 */
function initAutoBackup() {
  // 1. Chạy sao lưu ngay khi khởi động máy chủ nếu hôm nay chưa có bản sao lưu
  const today = getTodayDateStr();
  const todayFile = path.join(BACKUP_DIR, `backup_${today}.json`);
  if (!fs.existsSync(todayFile)) {
    createFullBackup({ reason: 'daily_auto_startup' })
      .then((res) => {
        console.log(`💾 Đã tự động tạo bản sao lưu dữ liệu cho ngày hôm nay (${today}): ${res.totalPatients} bệnh nhân.`);
      })
      .catch((err) => {
        console.warn('Lưu ý tự động sao lưu lúc khởi động:', err.message);
      });
  }

  // 2. Chạy sao lưu định kỳ mỗi 4 tiếng để luôn giữ bản sao lưu mới nhất
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const timer = setInterval(() => {
    createFullBackup({ reason: 'periodic_auto' })
      .then((res) => {
        console.log(`💾 Tự động đồng bộ bản sao lưu ngày (${getTodayDateStr()}): ${res.totalPatients} bệnh nhân.`);
      })
      .catch((err) => {
        console.warn('Lưu ý đồng bộ sao lưu định kỳ:', err.message);
      });
  }, FOUR_HOURS);
  if (timer && timer.unref) {
    timer.unref();
  }
}

module.exports = {
  BACKUP_DIR,
  createFullBackup,
  generateBackupPayload,
  restoreFromJson,
  listBackups,
  initAutoBackup
};
