const express = require('express');
const router = express.Router();
const { all, get } = require('../db/database');

// 1. Lấy danh sách Tỉnh/Thành phố
router.get('/provinces', async (req, res) => {
  try {
    const rows = await all("SELECT DISTINCT name FROM lookup_data WHERE category = 'TINH_TP' ORDER BY name COLLATE NOCASE ASC");
    res.json({ success: true, data: rows.map((r) => r.name) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Lấy danh sách Xã/Phường theo Tỉnh/Thành phố
router.get('/wards', async (req, res) => {
  try {
    const { province, q } = req.query;
    let sql = "SELECT DISTINCT name FROM lookup_data WHERE category = 'XA_PHUONG'";
    const params = [];

    if (province && province.trim()) {
      sql += ' AND (parent_code = ? OR parent_code LIKE ?)';
      params.push(province.trim(), `%${province.trim()}%`);
    }

    if (q && q.trim()) {
      sql += ' AND name LIKE ?';
      params.push(`%${q.trim()}%`);
    }

    sql += ' ORDER BY name COLLATE NOCASE ASC LIMIT 300';
    const rows = await all(sql, params);
    res.json({ success: true, data: rows.map((r) => r.name) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Lấy danh sách Nghề nghiệp
router.get('/jobs', async (req, res) => {
  try {
    const rows = await all("SELECT code, name FROM lookup_data WHERE category = 'NGHE_NGHIEP' ORDER BY code ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy danh mục theo category chung
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    let sql = 'SELECT * FROM lookup_data WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (category === 'ICD10') {
      if (q && q.trim()) {
        const term = q.trim();
        sql += ' AND (code LIKE ? OR name LIKE ?)';
        params.push(`%${term}%`, `%${term}%`);
        sql += ` ORDER BY 
          CASE 
            WHEN UPPER(code) = UPPER(?) THEN 1
            WHEN UPPER(code) LIKE UPPER(?) THEN 2
            WHEN code LIKE 'Z%' THEN 3
            WHEN UPPER(name) LIKE UPPER(?) THEN 4
            ELSE 5
          END ASC, code ASC LIMIT 100`;
        params.push(term, `${term}%`, `%${term}%`);
      } else {
        // Mặc định ưu tiên các mã Khám sức khỏe & các bệnh thường gặp
        sql += ` ORDER BY 
          CASE 
            WHEN code = 'Z00.0' THEN 1
            WHEN code = 'Z10' THEN 2
            WHEN code = 'Z02.1' THEN 3
            WHEN code = 'Z02.4' THEN 4
            WHEN code = 'Z02.3' THEN 5
            WHEN code = 'Z00.1' THEN 6
            WHEN code = 'Z00.129' THEN 7
            WHEN code LIKE 'Z02%' THEN 8
            WHEN code LIKE 'Z00%' THEN 9
            WHEN code LIKE 'Z01%' THEN 10
            WHEN code LIKE 'H52%' THEN 11
            WHEN code LIKE 'I10%' THEN 12
            WHEN code LIKE 'E11%' THEN 13
            WHEN code LIKE 'E78%' THEN 14
            WHEN code LIKE 'K02%' THEN 15
            WHEN code LIKE 'Z%' THEN 16
            ELSE 17
          END ASC, code ASC LIMIT 100`;
      }
    } else {
      if (q && q.trim()) {
        sql += ' AND (name LIKE ? OR code LIKE ?)';
        params.push(`%${q.trim()}%`, `%${q.trim()}%`);
      }
      sql += ' ORDER BY id ASC LIMIT 200';
    }

    const rows = await all(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Lỗi lấy danh mục:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy danh sách các đợt khám (đoàn) hiện có
router.get('/dot-kham', async (req, res) => {
  try {
    const rows = await all('SELECT DISTINCT dot_kham FROM patients WHERE dot_kham IS NOT NULL AND dot_kham != ""');
    res.json({ success: true, data: rows.map((r) => r.dot_kham) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Thống kê tổng hợp số lượng khám
router.get('/stats', async (req, res) => {
  try {
    const { dot_kham } = req.query;
    let filter = '';
    const params = [];
    if (dot_kham) {
      filter = ' WHERE dot_kham = ?';
      params.push(dot_kham);
    }

    const total = await get(`SELECT COUNT(*) as count FROM patients${filter}`, params);
    const completed = await get(
      `SELECT COUNT(*) as count FROM patients p JOIN ket_luan kl ON p.id = kl.patient_id${filter ? filter.replace('WHERE', 'WHERE p.') : ''}`,
      params
    );
    const theLuc = await get(
      `SELECT COUNT(*) as count FROM patients p JOIN the_luc t ON p.id = t.patient_id${filter ? filter.replace('WHERE', 'WHERE p.') : ''}`,
      params
    );

    res.json({
      success: true,
      data: {
        total: total ? total.count : 0,
        completed: completed ? completed.count : 0,
        the_luc: theLuc ? theLuc.count : 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
