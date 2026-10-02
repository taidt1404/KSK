const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exportKskExcel, importCompanyExcel } = require('../services/excelEngine');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// 1. Tải về file Excel kết quả KSK (108 cột chuẩn 100%)
router.get('/export', async (req, res) => {
  try {
    const { dot_kham } = req.query;
    console.log(`Bắt đầu xuất Excel KSK (Đợt khám: ${dot_kham || 'Tất cả'})...`);

    const workbook = await exportKskExcel({ dot_kham });

    const safeName = (dot_kham || 'Tong_hop').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Ket_qua_KSK_${safeName}_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Lỗi xuất file Excel:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Nạp file Excel danh sách nhân viên công ty (Import)
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file Excel để tải lên.' });
    }

    const dotKham = req.body.dot_kham || 'Đoàn KSK ' + new Date().toLocaleDateString('vi-VN');
    const result = await importCompanyExcel(req.file.path, dotKham);

    // Xóa file tạm
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      message: `Đã nạp thành công ${result.imported} nhân viên vào danh sách chờ khám.`,
      data: result
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Lỗi import file Excel:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
