const { run, all } = require('../src/db/database');

async function deleteTestPatients() {
  console.log('Đang xóa các bệnh nhân kiểm thử...');

  const deleted = await run(
    "DELETE FROM patients WHERE ho_ten IN ('Nguyễn Văn Test', 'Trần Thị Thu Thảo', 'Hoàng Văn Import 1', 'Lê Thị Import 2') OR dot_kham LIKE '%Test%'"
  );

  console.log(`Đã xóa ${deleted.changes} bản ghi bệnh nhân test.`);

  const remaining = await all('SELECT id, stt, ho_ten, dot_kham, trang_thai, created_at FROM patients ORDER BY id ASC');
  console.log('Danh sách bệnh nhân còn lại trong hệ thống:');
  console.table(remaining);
}

deleteTestPatients()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi khi xóa:', err);
    process.exit(1);
  });
