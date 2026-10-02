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

    if (q) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    sql += ' ORDER BY id ASC LIMIT 200';
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
