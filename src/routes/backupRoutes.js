const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  BACKUP_DIR,
  createFullBackup,
  generateBackupPayload,
  restoreFromJson,
  listBackups
} = require('../services/backupService');

const ADMIN_PIN = process.env.ADMIN_PIN || 'BVHC@123$%^';

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

function verifyAdminPin(req, res, next) {
  let pin = req.body?.adminPin;
  if (!pin && req.headers['x-admin-pin']) {
    try {
      pin = decodeURIComponent(req.headers['x-admin-pin']);
    } catch (e) {
      pin = req.headers['x-admin-pin'];
    }
  }

  if (!pin || pin !== ADMIN_PIN) {
    return res.status(403).json({
      success: false,
      message: 'Mật khẩu Quản trị viên không chính xác. Bạn không có quyền thực hiện thao tác này.'
    });
  }
  next();
}

// 1. Lấy danh sách các bản sao lưu đã có trên máy chủ
router.get('/', (req, res) => {
  try {
    const list = listBackups();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('Lỗi lấy danh sách bản sao lưu:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Tải về trực tiếp bản sao lưu JSON trực tiếp từ CSDL hiện tại
router.get('/export-live', async (req, res) => {
  try {
    const payload = await generateBackupPayload('manual_download');
    const nowStr = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const filename = `KSK_Backup_${nowStr}.json`;

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('Lỗi tải trực tiếp file sao lưu JSON:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Tải về file sao lưu cụ thể từ thư mục backups/
router.get('/download/:filename', (req, res) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy file sao lưu trên máy chủ.' });
    }

    res.download(filePath, safeFilename);
  } catch (err) {
    console.error('Lỗi tải file sao lưu:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Tạo thủ công bản sao lưu mới ngay lập tức
router.post('/create', verifyAdminPin, async (req, res) => {
  try {
    const result = await createFullBackup({ reason: 'manual_admin' });
    res.json({
      success: true,
      message: `Đã tạo bản sao lưu ${result.filename} thành công (${result.totalPatients} hồ sơ bệnh nhân)!`,
      data: result
    });
  } catch (err) {
    console.error('Lỗi tạo bản sao lưu thủ công:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Khôi phục dữ liệu từ file JSON (Upload file hoặc gửi JSON payload)
router.post('/restore', upload.single('backupFile'), async (req, res) => {
  let uploadedFilePath = null;
  try {
    let pin = req.body?.adminPin;
    if (!pin && req.headers['x-admin-pin']) {
      try {
        pin = decodeURIComponent(req.headers['x-admin-pin']);
      } catch (e) {
        pin = req.headers['x-admin-pin'];
      }
    }

    if (!pin || pin !== ADMIN_PIN) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(403).json({
        success: false,
        message: 'Mật khẩu Quản trị viên không chính xác. Chỉ Quản trị viên mới có quyền khôi phục dữ liệu.'
      });
    }

    let backupData = null;

    if (req.file) {
      uploadedFilePath = req.file.path;
      const fileContent = fs.readFileSync(uploadedFilePath, 'utf-8');
      backupData = JSON.parse(fileContent);
    } else if (req.body?.backupData) {
      backupData = typeof req.body.backupData === 'string'
        ? JSON.parse(req.body.backupData)
        : req.body.backupData;
    } else if (req.body?.data) {
      backupData = req.body;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file JSON sao lưu (.json) để tải lên khôi phục.'
      });
    }

    const restoreResult = await restoreFromJson(backupData);

    res.json({
      success: true,
      message: `Khôi phục thành công! Đã nạp ${restoreResult.imported} hồ sơ mới, cập nhật ${restoreResult.updated} hồ sơ hiện có.`,
      data: restoreResult
    });
  } catch (err) {
    console.error('Lỗi khôi phục từ file JSON:', err);
    res.status(500).json({
      success: false,
      message: 'Không thể khôi phục dữ liệu: ' + err.message
    });
  } finally {
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlink(uploadedFilePath, () => {});
    }
  }
});

module.exports = router;
