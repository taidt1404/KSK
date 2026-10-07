const path = require('path');
const fs = require('fs');

const TEMPLATE_NAME = 'Danh sách khám định kỳ.xlsx';

// Thứ tự tìm file mẫu:
// 1. Biến môi trường KSK_TEMPLATE_FILE (nếu có)
// 2. Thư mục templates/ nằm trong thư mục ứng dụng (khuyên dùng khi chạy trên server)
// 3. Đường dẫn cũ trên máy phát triển
const CANDIDATES = [
  process.env.KSK_TEMPLATE_FILE,
  path.join(__dirname, '../../templates', TEMPLATE_NAME),
  path.join('D:\\WorkSpace\\HC\\temp', TEMPLATE_NAME)
].filter(Boolean);

function resolveTemplateFile() {
  return CANDIDATES.find((p) => fs.existsSync(p)) || CANDIDATES[CANDIDATES.length > 1 ? 1 : 0];
}

module.exports = { resolveTemplateFile, TEMPLATE_CANDIDATES: CANDIDATES };
