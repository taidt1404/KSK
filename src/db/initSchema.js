const { exec, all } = require('./database');

async function initSchema() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stt INTEGER,
      ho_ten TEXT NOT NULL,
      ngay_sinh TEXT NOT NULL,
      gioi_tinh INTEGER NOT NULL, -- 1: Nam, 2: Nu
      cccd TEXT,
      ngay_cap_cccd TEXT,
      noi_cap_cccd TEXT,
      so_the_bhyt TEXT,
      sdt TEXT,
      tinh_tp TEXT,
      xa_phuong TEXT,
      nghe_nghiep TEXT,
      noi_cong_tac TEXT,
      doi_tuong_ksk TEXT,
      dot_kham TEXT,
      trang_thai TEXT DEFAULT 'CHO_KHAM',
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS the_luc (
      patient_id INTEGER PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
      ngay_do TEXT,
      can_nang REAL,
      chieu_cao REAL,
      mach INTEGER,
      ha_tam_thu INTEGER,
      ha_tam_truong INTEGER,
      vong_nguc REAL,
      phan_loai_the_luc INTEGER,
      nguoi_kham TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kham_lam_sang (
      patient_id INTEGER PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
      -- Noi khoa
      noi_ngay_kham TEXT,
      noi_tuan_hoan TEXT,
      noi_pl_tuan_hoan INTEGER,
      noi_ho_hap TEXT,
      noi_pl_ho_hap INTEGER,
      noi_tieu_hoa TEXT,
      noi_pl_tieu_hoa INTEGER,
      noi_than_tiet_nieu TEXT,
      noi_pl_than_tiet_nieu INTEGER,
      noi_noi_tiet TEXT,
      noi_pl_noi_tiet INTEGER,
      noi_co_xuong_khop TEXT,
      noi_pl_co_xuong_khop INTEGER,
      noi_than_kinh TEXT,
      noi_pl_than_kinh INTEGER,
      noi_tam_than TEXT,
      noi_pl_tam_than INTEGER,
      noi_bac_sy TEXT,
      -- Ngoai khoa
      ngoai_ket_qua TEXT,
      ngoai_phan_loai INTEGER,
      ngoai_bac_sy TEXT,
      -- Mat
      mat_khong_kinh_phai TEXT,
      mat_khong_kinh_trai TEXT,
      mat_co_kinh_phai TEXT,
      mat_co_kinh_trai TEXT,
      mat_benh TEXT,
      mat_phan_loai INTEGER,
      mat_bac_sy TEXT,
      -- Tai mui hong
      tmh_tai_trai_thuong TEXT,
      tmh_tai_trai_tham TEXT,
      tmh_tai_phai_thuong TEXT,
      tmh_tai_phai_tham TEXT,
      tmh_benh TEXT,
      tmh_phan_loai INTEGER,
      tmh_bac_sy TEXT,
      -- Rang ham mat
      rhm_ham_tren TEXT,
      rhm_ham_duoi TEXT,
      rhm_benh TEXT,
      rhm_phan_loai INTEGER,
      rhm_bac_sy TEXT,
      -- Da lieu
      da_lieu_ket_qua TEXT,
      da_lieu_phan_loai INTEGER,
      da_lieu_bac_sy TEXT,
      -- San phu khoa
      san_phu_khoa_ket_qua TEXT,
      san_phu_khoa_phan_loai INTEGER,
      san_phu_khoa_bac_sy TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS can_lam_sang (
      patient_id INTEGER PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
      -- Cong thuc mau
      cls_hong_cau REAL,
      cls_bach_cau REAL,
      cls_tieu_cau REAL,
      cls_huyet_sac_to REAL,
      -- Sinh hoa & chuc nang
      cls_duong_huyet REAL,
      cls_ure REAL,
      cls_creatinin REAL,
      cls_bilirubin_tp REAL,
      cls_ast REAL,
      cls_alt REAL,
      cls_ggt REAL,
      cls_triglycerid REAL,
      cls_cholesterol_tp REAL,
      cls_hdl_c REAL,
      cls_ldl_c REAL,
      cls_hba1c REAL,
      -- Mien dich
      cls_afp REAL,
      cls_cea REAL,
      cls_psa_total REAL,
      cls_hbsag TEXT,
      cls_hbsab TEXT,
      cls_anti_hcv TEXT,
      -- Nuoc tieu
      cls_axit_uric REAL,
      cls_glucose TEXT,
      cls_protein_nieu TEXT,
      cls_nuoc_tieu_hong_cau TEXT,
      cls_nuoc_tieu_bach_cau TEXT,
      -- Chan doan hinh anh
      cls_dien_tim TEXT,
      cls_xquang TEXT,
      cls_sieu_am TEXT,
      cls_cdha_khac TEXT,
      cls_xet_nghiem_khac TEXT,
      cls_bac_sy TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ket_luan (
      patient_id INTEGER PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
      phan_loai_suc_khoe INTEGER,
      mo_ta_benh_tat TEXT,
      ma_icd10 TEXT,
      loi_dan_bac_si TEXT,
      ngay_ket_luan TEXT,
      bac_si_ket_luan TEXT,
      ma_cskcb TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lookup_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL, -- 'DOI_TUONG_KSK', 'TINH_TP', 'XA_PHUONG', 'NGHE_NGHIEP', 'ICD10'
      code TEXT,
      name TEXT NOT NULL,
      parent_code TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_patients_cccd ON patients(cccd);
    CREATE INDEX IF NOT EXISTS idx_patients_ho_ten ON patients(ho_ten);
    CREATE INDEX IF NOT EXISTS idx_lookup_category ON lookup_data(category);
  `;

  await exec(schemaSql);

  // Tự động migration bổ sung cột is_deleted và deleted_at nếu database cũ chưa có
  try {
    const tableInfo = await all(`PRAGMA table_info(patients)`);
    const colNames = tableInfo.map((c) => c.name);
    if (!colNames.includes('is_deleted')) {
      await exec(`ALTER TABLE patients ADD COLUMN is_deleted INTEGER DEFAULT 0;`);
    }
    if (!colNames.includes('deleted_at')) {
      await exec(`ALTER TABLE patients ADD COLUMN deleted_at DATETIME;`);
    }
    await exec(`CREATE INDEX IF NOT EXISTS idx_patients_is_deleted ON patients(is_deleted);`);
  } catch (mErr) {
    console.warn('Lưu ý migration cột is_deleted/deleted_at:', mErr.message);
  }

  console.log('✅ SQLite database schema initialized successfully.');
}

module.exports = { initSchema };

if (require.main === module) {
  initSchema()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Lỗi khởi tạo schema:', err);
      process.exit(1);
    });
}
