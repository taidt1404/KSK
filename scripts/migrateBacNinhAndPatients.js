const { all, run } = require('../src/db/database');

const NEW_WARDS_MAPPING = {
  'Xã Hiệp Hoà': 'Phường Hiệp Hòa',
  'Xã Hiệp Hòa': 'Phường Hiệp Hòa',
  'Xã Yên Phong': 'Phường Yên Phong',
  'Xã Tiên Du': 'Phường Tiên Du',
  'Xã Chi Lăng': 'Phường Chi Lăng',
  'Xã Phù Lãng': 'Phường Phù Lãng',
  'Xã Lương Tài': 'Phường Lương Tài',
  'Xã Gia Bình': 'Phường Gia Bình',
  'Xã Nhân Thắng': 'Phường Nhân Thắng',
  'Xã Bố Hạ': 'Phường Bố Hạ',
  'Xã Lạng Giang': 'Phường Lạng Giang',
  'Xã Kép': 'Phường Kép',
  'Xã Lục Nam': 'Phường Lục Nam'
};

async function migrateBacNinh() {
  console.log('--- Bắt đầu nâng cấp danh mục Bắc Ninh và Bệnh nhân ---');

  // 1. Thêm 'Thành phố Bắc Ninh' vào danh mục TINH_TP nếu chưa có
  const existingTpBn = await all("SELECT * FROM lookup_data WHERE category = 'TINH_TP' AND name = 'Thành phố Bắc Ninh'");
  if (!existingTpBn || existingTpBn.length === 0) {
    await run("INSERT INTO lookup_data (category, code, name, parent_code) VALUES ('TINH_TP', '', 'Thành phố Bắc Ninh', null)");
    console.log('✅ Đã thêm Thành phố Bắc Ninh vào danh mục Tỉnh/Thành phố.');
  }

  // Đảm bảo 'Tỉnh Bắc Ninh' vẫn còn để tương thích
  const existingTinhBn = await all("SELECT * FROM lookup_data WHERE category = 'TINH_TP' AND name = 'Tỉnh Bắc Ninh'");
  if (!existingTinhBn || existingTinhBn.length === 0) {
    await run("INSERT INTO lookup_data (category, code, name, parent_code) VALUES ('TINH_TP', '', 'Tỉnh Bắc Ninh', null)");
    console.log('✅ Đã đảm bảo Tỉnh Bắc Ninh có trong danh mục.');
  }

  // 2. Cập nhật 12 xã lên phường mới nhất theo Nghị quyết Quốc hội
  for (const [oldName, newName] of Object.entries(NEW_WARDS_MAPPING)) {
    const updated = await run(
      "UPDATE lookup_data SET name = ? WHERE category = 'XA_PHUONG' AND name = ?",
      [newName, oldName]
    );
    if (updated.changes > 0) {
      console.log(`✅ Đã cập nhật ${oldName} -> ${newName} (${updated.changes} bản ghi)`);
    }
  }

  // 3. Đồng bộ toàn bộ Xã/Phường Bắc Ninh cho cả 2 parent_code: 'Thành phố Bắc Ninh' và 'Tỉnh Bắc Ninh'
  const currentWards = await all(
    "SELECT DISTINCT name FROM lookup_data WHERE category = 'XA_PHUONG' AND (parent_code = 'Tỉnh Bắc Ninh' OR parent_code = 'Thành phố Bắc Ninh')"
  );

  for (const w of currentWards) {
    // Đảm bảo có liên kết với Thành phố Bắc Ninh
    const hasTp = await all(
      "SELECT id FROM lookup_data WHERE category = 'XA_PHUONG' AND name = ? AND parent_code = 'Thành phố Bắc Ninh'",
      [w.name]
    );
    if (!hasTp || hasTp.length === 0) {
      await run(
        "INSERT INTO lookup_data (category, code, name, parent_code) VALUES ('XA_PHUONG', '', ?, 'Thành phố Bắc Ninh')",
        [w.name]
      );
    }

    // Đảm bảo có liên kết với Tỉnh Bắc Ninh
    const hasTinh = await all(
      "SELECT id FROM lookup_data WHERE category = 'XA_PHUONG' AND name = ? AND parent_code = 'Tỉnh Bắc Ninh'",
      [w.name]
    );
    if (!hasTinh || hasTinh.length === 0) {
      await run(
        "INSERT INTO lookup_data (category, code, name, parent_code) VALUES ('XA_PHUONG', '', ?, 'Tỉnh Bắc Ninh')",
        [w.name]
      );
    }
  }
  console.log(`✅ Đã đồng bộ ${currentWards.length} xã/phường cho cả 'Thành phố Bắc Ninh' và 'Tỉnh Bắc Ninh'.`);

  // 4. Cập nhật Họ tên tất cả bệnh nhân thành IN HOA và chuẩn hóa xã/phường
  const patients = await all("SELECT id, ho_ten, tinh_tp, xa_phuong FROM patients");
  for (const p of patients) {
    let newHoTen = p.ho_ten ? p.ho_ten.trim().toUpperCase() : p.ho_ten;
    let newXaPhuong = p.xa_phuong;
    let newTinhTp = p.tinh_tp;

    if (newXaPhuong && NEW_WARDS_MAPPING[newXaPhuong]) {
      newXaPhuong = NEW_WARDS_MAPPING[newXaPhuong];
    }
    if (newTinhTp === 'Tỉnh Bắc Ninh') {
      newTinhTp = 'Thành phố Bắc Ninh';
    }

    if (newHoTen !== p.ho_ten || newXaPhuong !== p.xa_phuong || newTinhTp !== p.tinh_tp) {
      await run(
        "UPDATE patients SET ho_ten = ?, tinh_tp = ?, xa_phuong = ? WHERE id = ?",
        [newHoTen, newTinhTp, newXaPhuong, p.id]
      );
      console.log(`✅ Đã cập nhật bệnh nhân #${p.id}: ${newHoTen} | ${newTinhTp} | ${newXaPhuong}`);
    }
  }

  console.log('--- Hoàn tất nâng cấp! ---');
}

module.exports = { migrateBacNinh, NEW_WARDS_MAPPING };

if (require.main === module) {
  migrateBacNinh()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Lỗi migrate:', err);
      process.exit(1);
    });
}
