const { run, closeDb, all } = require('../src/db/database');

async function cleanDb() {
  await run('DELETE FROM patients');
  await run('DELETE FROM the_luc');
  await run('DELETE FROM kham_lam_sang');
  await run('DELETE FROM can_lam_sang');
  await run('DELETE FROM ket_luan');
  await run("DELETE FROM sqlite_sequence WHERE name = 'patients'");
  await run('VACUUM');

  const pCount = await all('SELECT COUNT(*) as c FROM patients');
  const lookupCount = await all('SELECT COUNT(*) as c FROM lookup_data');
  console.log(`✅ Đã xóa toàn bộ bệnh nhân (Còn: ${pCount[0].c} bệnh nhân).`);
  console.log(`✅ Giữ nguyên ${lookupCount[0].c} danh mục địa chỉ, nghề nghiệp, ICD-10.`);
  await closeDb();
}

cleanDb().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
