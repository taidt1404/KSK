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
    const { dot_kham, date } = req.query;
    console.log(`Bắt đầu xuất Excel KSK (Đợt khám: ${dot_kham || 'Tất cả'}, Ngày: ${date || 'Tất cả'})...`);

    const workbook = await exportKskExcel({ dot_kham, date });

    // Loại bỏ dấu tiếng Việt để tạo tên file ASCII an toàn cho HTTP Header
    const asciiDotKham = (dot_kham || 'Tong_hop')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9_]/g, '_');
    const safeDate = date ? date.replace(/[^0-9]/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Ket_qua_KSK_${asciiDotKham}_${safeDate}.xlsx`;
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

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
