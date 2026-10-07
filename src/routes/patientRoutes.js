const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const { broadcast } = require('../services/sseService');

// Lấy danh sách bệnh nhân kèm trạng thái khám từng phòng
router.get('/', async (req, res) => {
  try {
    const { q, dot_kham, room, status, date } = req.query;
    let sql = `
      SELECT 
        p.*,
        CASE WHEN t.patient_id IS NOT NULL THEN 1 ELSE 0 END AS da_kham_the_luc,
        CASE WHEN k.noi_ngay_kham IS NOT NULL OR k.noi_bac_sy IS NOT NULL THEN 1 ELSE 0 END AS da_kham_noi,
        CASE WHEN k.ngoai_phan_loai IS NOT NULL THEN 1 ELSE 0 END AS da_kham_ngoai,
        CASE WHEN k.mat_phan_loai IS NOT NULL THEN 1 ELSE 0 END AS da_kham_mat,
        CASE WHEN k.tmh_phan_loai IS NOT NULL THEN 1 ELSE 0 END AS da_kham_tmh,
        CASE WHEN k.rhm_phan_loai IS NOT NULL THEN 1 ELSE 0 END AS da_kham_rhm,
        CASE WHEN k.da_lieu_phan_loai IS NOT NULL THEN 1 ELSE 0 END AS da_kham_da_lieu,
        CASE WHEN k.san_phu_khoa_phan_loai IS NOT NULL THEN 1 ELSE 0 END AS da_kham_san,
        CASE WHEN c.patient_id IS NOT NULL THEN 1 ELSE 0 END AS da_kham_cls,
        CASE WHEN kl.phan_loai_suc_khoe IS NOT NULL THEN 1 ELSE 0 END AS da_ket_luan
      FROM patients p
      LEFT JOIN the_luc t ON p.id = t.patient_id
      LEFT JOIN kham_lam_sang k ON p.id = k.patient_id
      LEFT JOIN can_lam_sang c ON p.id = c.patient_id
      LEFT JOIN ket_luan kl ON p.id = kl.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      sql += ` AND (p.ho_ten LIKE ? OR p.cccd LIKE ? OR p.sdt LIKE ? OR CAST(p.stt AS TEXT) LIKE ?)`;
      params.push(term, term, term, term);
    }

    if (dot_kham && dot_kham.trim()) {
      sql += ` AND p.dot_kham = ?`;
      params.push(dot_kham.trim());
    }

    if (date && date.trim()) {
      const d = date.trim();
      let isoDate = d;
      let vnDate = d;
      let vnDateNoPad = d;
      if (d.includes('-')) {
        const parts = d.split('-');
        if (parts.length === 3) {
          isoDate = d;
          vnDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
          vnDateNoPad = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
        }
      } else if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          vnDate = d;
          vnDateNoPad = `${parseInt(parts[0], 10)}/${parseInt(parts[1], 10)}/${parts[2]}`;
        }
      }
      sql += ` AND (
        date(p.created_at, 'localtime') = ?
        OR t.ngay_do = ? OR t.ngay_do = ?
        OR k.noi_ngay_kham = ? OR k.noi_ngay_kham = ?
        OR kl.ngay_ket_luan = ? OR kl.ngay_ket_luan = ?
      )`;
      params.push(isoDate, vnDate, vnDateNoPad, vnDate, vnDateNoPad, vnDate, vnDateNoPad);
    }

    sql += ` ORDER BY p.id DESC`;

    let rows = await all(sql, params);

    // Lọc theo phòng nếu client yêu cầu
    if (room && status) {
      if (room === 'the_luc') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_the_luc : !r.da_kham_the_luc));
      } else if (room === 'mat') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_mat : !r.da_kham_mat));
      } else if (room === 'tmh') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_tmh : !r.da_kham_tmh));
      } else if (room === 'rhm') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_rhm : !r.da_kham_rhm));
      } else if (room === 'noi') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_noi : !r.da_kham_noi));
      } else if (room === 'ngoai') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_ngoai : !r.da_kham_ngoai));
      } else if (room === 'da_lieu') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_da_lieu : !r.da_kham_da_lieu));
      } else if (room === 'san') {
        rows = rows.filter((r) => r.gioi_tinh === 2 && (status === 'done' ? r.da_kham_san : !r.da_kham_san));
      } else if (room === 'cls') {
        rows = rows.filter((r) => (status === 'done' ? r.da_kham_cls : !r.da_kham_cls));
      } else if (room === 'ket_luan') {
        rows = rows.filter((r) => (status === 'done' ? r.da_ket_luan : !r.da_ket_luan));
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi lấy danh sách bệnh nhân:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: Lấy STT tiếp theo trong tháng (tịnh tiến từ 1 đến hết tháng, sang tháng mới quay về 1)
async function getNextSttForMonth(targetDate) {
  const d = targetDate ? new Date(targetDate) : new Date();
  const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  
  const maxSttRow = await get(`
    SELECT MAX(stt) as maxStt 
    FROM patients 
    WHERE strftime('%Y-%m', created_at, 'localtime') = ?
       OR strftime('%Y-%m', created_at) = ?
  `, [yearMonth, yearMonth]);

  return (maxSttRow && maxSttRow.maxStt ? Number(maxSttRow.maxStt) : 0) + 1;
}

// API: Lấy STT tiếp theo gợi ý của tháng hiện tại
router.get('/next-stt', async (req, res) => {
  try {
    const now = new Date();
    const monthDisplay = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const nextStt = await getNextSttForMonth(now);
    res.json({ success: true, nextStt, month: monthDisplay });
  } catch (err) {
    console.error('Lỗi lấy STT tiếp theo:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thêm mới 1 bệnh nhân lẻ tại Tiếp đón
router.post('/', async (req, res) => {
  try {
    const {
      stt,
      ho_ten,
      ngay_sinh,
      gioi_tinh,
      cccd,
      ngay_cap_cccd,
      noi_cap_cccd,
      so_the_bhyt,
      sdt,
      tinh_tp,
      xa_phuong,
      nghe_nghiep,
      noi_cong_tac,
      doi_tuong_ksk,
      dot_kham
    } = req.body;

    if (!ho_ten || !ngay_sinh || !gioi_tinh) {
      return res.status(400).json({ success: false, message: 'Họ tên, ngày sinh và giới tính là bắt buộc.' });
    }

    // Tự động tính STT nếu chưa có (tịnh tiến theo tháng: đầu tháng là 1, tịnh tiến đến hết tháng, sang tháng mới quay về 1)
    let nextStt = stt ? Number(stt) : null;
    if (!nextStt) {
      nextStt = await getNextSttForMonth();
    }

    const result = await run(
      `INSERT INTO patients (
        stt, ho_ten, ngay_sinh, gioi_tinh, cccd, ngay_cap_cccd, noi_cap_cccd,
        so_the_bhyt, sdt, tinh_tp, xa_phuong, nghe_nghiep, noi_cong_tac,
        doi_tuong_ksk, dot_kham, trang_thai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CHO_KHAM')`,
      [
        nextStt,
        ho_ten.trim().toUpperCase(),
        ngay_sinh.trim(),
        Number(gioi_tinh),
        cccd ? cccd.trim() : '',
        ngay_cap_cccd ? ngay_cap_cccd.trim() : '',
        noi_cap_cccd ? noi_cap_cccd.trim() : '',
        so_the_bhyt ? so_the_bhyt.trim() : '',
        sdt ? sdt.trim() : '',
        tinh_tp ? tinh_tp.trim() : '',
        xa_phuong ? xa_phuong.trim() : '',
        nghe_nghiep ? nghe_nghiep.trim() : '',
        noi_cong_tac ? noi_cong_tac.trim() : '',
        doi_tuong_ksk ? doi_tuong_ksk.trim() : '64',
        dot_kham ? dot_kham.trim() : 'Mặc định'
      ]
    );

    const newPatient = await get('SELECT * FROM patients WHERE id = ?', [result.lastID]);
    broadcast('PATIENT_ADDED', newPatient);

    res.json({ success: true, data: newPatient });
  } catch (err) {
    console.error('Lỗi thêm bệnh nhân:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cập nhật thông tin hành chính của bệnh nhân
router.put('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const {
      stt,
      ho_ten,
      ngay_sinh,
      gioi_tinh,
      cccd,
      ngay_cap_cccd,
      noi_cap_cccd,
      so_the_bhyt,
      sdt,
      tinh_tp,
      xa_phuong,
      nghe_nghiep,
      noi_cong_tac,
      doi_tuong_ksk,
      dot_kham
    } = req.body;

    if (!ho_ten || !ngay_sinh || !gioi_tinh) {
      return res.status(400).json({ success: false, message: 'Họ tên, ngày sinh và giới tính là bắt buộc.' });
    }

    let updateStt = stt ? Number(stt) : null;
    if (!updateStt) {
      const existingPatient = await get('SELECT stt FROM patients WHERE id = ?', [req.params.id]);
      if (existingPatient) {
        updateStt = existingPatient.stt;
      }
    }

    await run(
      `UPDATE patients SET
        stt = ?,
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
        dot_kham = ?
      WHERE id = ?`,
      [
        updateStt,
        ho_ten.trim().toUpperCase(),
        ngay_sinh.trim(),
        Number(gioi_tinh),
        cccd ? cccd.trim() : '',
        ngay_cap_cccd ? ngay_cap_cccd.trim() : '',
        noi_cap_cccd ? noi_cap_cccd.trim() : '',
        so_the_bhyt ? so_the_bhyt.trim() : '',
        sdt ? sdt.trim() : '',
        tinh_tp ? tinh_tp.trim() : '',
        xa_phuong ? xa_phuong.trim() : '',
        nghe_nghiep ? nghe_nghiep.trim() : '',
        noi_cong_tac ? noi_cong_tac.trim() : '',
        doi_tuong_ksk ? doi_tuong_ksk.trim() : '64',
        dot_kham ? dot_kham.trim() : 'Mặc định',
        patientId
      ]
    );

    const updated = await get('SELECT * FROM patients WHERE id = ?', [patientId]);
    broadcast('PATIENT_UPDATED', updated);

    res.json({ success: true, message: 'Đã cập nhật thông tin hành chính thành công.', data: updated });
  } catch (err) {
    console.error('Lỗi cập nhật bệnh nhân:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy đầy đủ hồ sơ bệnh nhân kèm tất cả kết quả khám các chuyên khoa
router.get('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await get('SELECT * FROM patients WHERE id = ?', [patientId]);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh nhân.' });
    }

    const theLuc = (await get('SELECT * FROM the_luc WHERE patient_id = ?', [patientId])) || {};
    const khamLamSang = (await get('SELECT * FROM kham_lam_sang WHERE patient_id = ?', [patientId])) || {};
    const canLamSang = (await get('SELECT * FROM can_lam_sang WHERE patient_id = ?', [patientId])) || {};
    const ketLuan = (await get('SELECT * FROM ket_luan WHERE patient_id = ?', [patientId])) || {};

    res.json({
      success: true,
      data: {
        patient,
        the_luc: theLuc,
        kham_lam_sang: khamLamSang,
        can_lam_sang: canLamSang,
        ket_luan: ketLuan
      }
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết bệnh nhân:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Xóa bệnh nhân (Chỉ Quản trị viên có mật khẩu bảo mật)
const ADMIN_PIN = process.env.ADMIN_PIN || 'BVHC@123$%^';

router.delete('/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    let providedPin = req.body?.adminPin;
    if (!providedPin && req.headers['x-admin-pin']) {
      try {
        providedPin = decodeURIComponent(req.headers['x-admin-pin']);
      } catch (e) {
        providedPin = req.headers['x-admin-pin'];
      }
    }

    if (!providedPin || providedPin !== ADMIN_PIN) {
      return res.status(403).json({
        success: false,
        message: 'Mật khẩu Quản trị viên không chính xác. Chỉ Quản trị viên mới có quyền xóa bệnh nhân.'
      });
    }

    await run('DELETE FROM patients WHERE id = ?', [patientId]);
    broadcast('PATIENT_DELETED', { id: patientId });
    res.json({ success: true, message: 'Đã xóa bệnh nhân thành công.' });
  } catch (err) {
    console.error('Lỗi xóa bệnh nhân:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
