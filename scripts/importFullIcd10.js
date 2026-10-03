const fs = require('fs');
const path = require('path');
const { getDb, run, all } = require('../src/db/database');

async function importFullIcd10() {
  console.log('--- Bắt đầu nạp FULL danh mục ICD-10 (~20.000 mã) ---');
  
  const rawPath = 'C:/Users/MAYTINH THANHBINH/.gemini/antigravity-ide/brain/3b433a8b-2ed4-4c58-a4ce-3322f5d3cb1b/.system_generated/steps/1141/output.txt';
  const targetJsonPath = path.join(__dirname, '../data/icd10.json');

  if (!fs.existsSync(rawPath)) {
    console.error('Không tìm thấy file trích xuất raw:', rawPath);
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`Đã đọc ${rawData.length} mã ICD-10 từ hệ thống.`);

  // Bổ sung & chuẩn hóa các mã đặc thù khám sức khỏe (theo yêu cầu người dùng)
  const specialOverrides = {
    'Z00.0': 'Khám sức khoẻ tổng quát (Bao gồm KSK định kỳ lâm sàng, cận lâm sàng không phát hiện bất thường)',
    'Z10': 'Kiểm tra sức khỏe tổng quát định kỳ cho nhóm dân cư xác định (Cơ quan / Doanh nghiệp / Công ty)',
    'Z02': 'Khám và tiếp xúc vì các mục đích hành chính',
    'Z02.1': 'Khám sức khỏe trước khi vào làm việc (Đi làm / Tuyển dụng)',
    'Z02.3': 'Khám sức khỏe để tuyển dụng vào lực lượng vũ trang (Tuyển quân)',
    'Z02.4': 'Khám sức khỏe để cấp giấy phép lái xe',
    'Z00.1': 'Kiểm tra sức khoẻ trẻ em thường quy',
    'Z00.129': 'Khám sức khỏe định kỳ cho trẻ em không phát hiện bất thường'
  };

  const codeMap = new Map();

  for (const item of rawData) {
    if (!item.icd_code) continue;
    const code = item.icd_code.trim().toUpperCase();
    let name = (item.name || '').trim();
    if (specialOverrides[code]) {
      name = specialOverrides[code];
    }
    codeMap.set(code, {
      code,
      name: `${code} - ${name}`
    });
  }

  // Đảm bảo các mã bắt buộc phải có
  for (const [code, desc] of Object.entries(specialOverrides)) {
    if (!codeMap.has(code)) {
      codeMap.set(code, {
        code,
        name: `${code} - ${desc}`
      });
    }
  }

  const cleanList = Array.from(codeMap.values());
  console.log(`Tổng số mã hợp lệ sau khi làm sạch: ${cleanList.length}`);

  // Lưu file JSON vĩnh viễn trong data/
  fs.writeFileSync(targetJsonPath, JSON.stringify(cleanList, null, 2), 'utf8');
  console.log(`Đã lưu ${cleanList.length} mã ICD-10 vào ${targetJsonPath}`);

  // Xóa danh mục ICD10 cũ và nạp lại vào SQLite theo transaction
  const db = getDb();
  await run("DELETE FROM lookup_data WHERE category = 'ICD10'");

  console.log('Đang nạp vào cơ sở dữ liệu SQLite...');
  await new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION;');
      const stmt = db.prepare('INSERT INTO lookup_data (category, code, name) VALUES (?, ?, ?)');
      for (const item of cleanList) {
        stmt.run('ICD10', item.code, item.name);
      }
      stmt.finalize((err) => {
        if (err) return reject(err);
      });
      db.run('COMMIT;', (commitErr) => {
        if (commitErr) return reject(commitErr);
        resolve();
      });
    });
  });

  const countRow = await all("SELECT COUNT(*) as c FROM lookup_data WHERE category = 'ICD10'");
  console.log(`✅ Nạp thành công ${countRow[0].c} bản ghi ICD-10 vào bảng lookup_data!`);
}

importFullIcd10()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Lỗi nạp ICD-10:', err);
    process.exit(1);
  });
