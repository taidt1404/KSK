const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { all, run, get } = require('../db/database');
const { broadcast } = require('./sseService');

const TEMPLATE_FILE = 'D:\\WorkSpace\\HC\\temp\\Danh sách khám định kỳ.xlsx';

const KSK_CODE_TO_NAME = {
  '58': 'KSK: Khám sức khỏe cho đối tượng chính sách',
  '59': 'KSK: Khám sức khỏe an toàn thực phẩm',
  '60': 'KSK:  Khám sức khỏe khi đi làm việc ở nước ngoài',
  '61': 'KSK: Khám giám định y khoa, khám giám định pháp y, khám giám định pháp y tâm thần',
  '62': 'KSK:  Khám để cấp giấy chứng thương',
  '63': 'KSK: Khám sức khỏe cho người có công với cách mạng',
  '64': 'KSK: Khám sức khỏe định kỳ miễn phí (người từ 18 tuổi trở lên)',
  '65': 'KSK: Khám sức khỏe người điều khiển phương tiện giao thông đường sắt',
  '66': 'KSK: Khám sức khỏe định kỳ cho cán bộ',
  '91': 'KSK: Khám sức khỏe tiền hôn nhân',
  '92': 'KSK: Khám sức khỏe người cao tuổi (trên 60 tuổi)',
  '93': 'KSK: Khám sức khỏe định kỳ trẻ em (dưới 06 tuổi)',
  '94': 'KSK: Khám sức khỏe bà mẹ',
  '95': 'KSK: Khám sức khỏe định kỳ cho thuyền viên',
  '96': 'KSK: Khám sức khỏe định kỳ cho lái xe',
  '97': 'KSK: Khám sức khỏe nghĩa vụ quân sự, nghĩa vụ công an',
  '98': 'KSK: Khám sức khỏe học sinh, sinh viên',
  '99': 'KSK: Khám sức khỏe định kỳ miễn phí (người từ 18 tuổi trở lên)',
  '100': 'KSK: Khám sức khỏe để phân loại sức khỏe để đi học, đi làm việc',
  '101': 'KSK: Khám sàng lọc bệnh không lây nhiễm',
  '102': 'KSK: Khám sức khỏe theo yêu cầu nghề nghiệp, công việc đặc thù',
  '103': 'KSK: Khám phát hiện bệnh nghề nghiệp',
  '104': 'KSK: Khám sức khỏe theo yêu cầu',
  '105': 'KSK: Hình thức khám sức khỏe khác'
};

async function exportKskExcel({ dot_kham, date } = {}) {
  if (!fs.existsSync(TEMPLATE_FILE)) {
    throw new Error(`Không tìm thấy file mẫu tại: ${TEMPLATE_FILE}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_FILE);

  const worksheet = workbook.getWorksheet(1); // Sheet 'Ket qua KSKDK'

  // Xóa các dòng mẫu cũ từ dòng 5 trở đi nếu có
  if (worksheet.rowCount >= 5) {
    const rowsToDelete = worksheet.rowCount - 4;
    worksheet.spliceRows(5, rowsToDelete);
  }

  // Truy vấn dữ liệu đầy đủ
  let sql = `
    SELECT 
      p.*,
      t.ngay_do, t.can_nang, t.chieu_cao, t.mach, t.ha_tam_thu, t.ha_tam_truong, t.vong_nguc, t.phan_loai_the_luc, t.nguoi_kham as the_luc_nguoi_kham,
      k.*,
      c.*,
      kl.phan_loai_suc_khoe, kl.mo_ta_benh_tat, kl.ma_icd10, kl.loi_dan_bac_si, kl.ngay_ket_luan, kl.bac_si_ket_luan, kl.ma_cskcb
    FROM patients p
    LEFT JOIN the_luc t ON p.id = t.patient_id
    LEFT JOIN kham_lam_sang k ON p.id = k.patient_id
    LEFT JOIN can_lam_sang c ON p.id = c.patient_id
    LEFT JOIN ket_luan kl ON p.id = kl.patient_id
    WHERE 1=1
  `;
  const params = [];
  if (dot_kham && dot_kham.trim()) {
    sql += ' AND p.dot_kham = ?';
    params.push(dot_kham.trim());
  }

  if (date && date.trim()) {
    const d = date.trim();
    let isoDate = d;
    let vnDate = d;
    let vnDateNoPad = d;
    if (d.includes('-')) {
      const parts = d.split('-');
      if (parts.length === 3) {
        isoDate = d;
        vnDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        vnDateNoPad = `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
      }
    } else if (d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        vnDate = d;
        vnDateNoPad = `${parseInt(parts[0], 10)}/${parseInt(parts[1], 10)}/${parts[2]}`;
      }
    }
    sql += ` AND (
      date(p.created_at, 'localtime') = ?
      OR t.ngay_do = ? OR t.ngay_do = ?
      OR k.noi_ngay_kham = ? OR k.noi_ngay_kham = ?
      OR kl.ngay_ket_luan = ? OR kl.ngay_ket_luan = ?
    )`;
    params.push(isoDate, vnDate, vnDateNoPad, vnDate, vnDateNoPad, vnDate, vnDateNoPad);
  }

  sql += ' ORDER BY p.stt ASC, p.id ASC';

  const rows = await all(sql, params);

  // Điền dữ liệu từ dòng 5
  rows.forEach((p, index) => {
    const rowNum = 5 + index;
    const r = worksheet.getRow(rowNum);

    // I. THÔNG TIN HÀNH CHÍNH (Cột 1-14)
    r.getCell(1).value = p.stt || (index + 1);
    r.getCell(2).value = p.ho_ten || '';
    r.getCell(3).value = p.ngay_sinh || '';
    r.getCell(4).value = p.gioi_tinh ? Number(p.gioi_tinh) : null;
    r.getCell(5).value = p.cccd || '';
    r.getCell(6).value = p.ngay_cap_cccd || '';
    r.getCell(7).value = p.noi_cap_cccd || '';
    r.getCell(8).value = p.so_the_bhyt || '';
    r.getCell(9).value = p.sdt || '';
    r.getCell(10).value = p.tinh_tp || '';
    r.getCell(11).value = p.xa_phuong || '';
    r.getCell(12).value = p.nghe_nghiep || '';
    r.getCell(13).value = p.noi_cong_tac || '';
    r.getCell(14).value = KSK_CODE_TO_NAME[p.doi_tuong_ksk] || p.doi_tuong_ksk || '';

    // II. KHÁM THỂ LỰC (Cột 15-22)
    r.getCell(15).value = p.ngay_do || '';
    r.getCell(16).value = p.can_nang != null ? p.can_nang : '';
    r.getCell(17).value = p.chieu_cao != null ? p.chieu_cao : '';
    r.getCell(18).value = p.mach != null ? p.mach : '';
    r.getCell(19).value = p.ha_tam_thu != null ? p.ha_tam_thu : '';
    r.getCell(20).value = p.ha_tam_truong != null ? p.ha_tam_truong : '';
    r.getCell(21).value = p.vong_nguc != null ? p.vong_nguc : '';
    r.getCell(22).value = p.phan_loai_the_luc != null ? Number(p.phan_loai_the_luc) : '';

    // III. KHÁM LÂM SÀNG (Cột 23-68)
    // Nội khoa (Cột 23-40)
    r.getCell(23).value = p.noi_ngay_kham || '';
    r.getCell(24).value = p.noi_tuan_hoan || '';
    r.getCell(25).value = p.noi_pl_tuan_hoan != null ? Number(p.noi_pl_tuan_hoan) : '';
    r.getCell(26).value = p.noi_ho_hap || '';
    r.getCell(27).value = p.noi_pl_ho_hap != null ? Number(p.noi_pl_ho_hap) : '';
    r.getCell(28).value = p.noi_tieu_hoa || '';
    r.getCell(29).value = p.noi_pl_tieu_hoa != null ? Number(p.noi_pl_tieu_hoa) : '';
    r.getCell(30).value = p.noi_than_tiet_nieu || '';
    r.getCell(31).value = p.noi_pl_than_tiet_nieu != null ? Number(p.noi_pl_than_tiet_nieu) : '';
    r.getCell(32).value = p.noi_noi_tiet || '';
    r.getCell(33).value = p.noi_pl_noi_tiet != null ? Number(p.noi_pl_noi_tiet) : '';
    r.getCell(34).value = p.noi_co_xuong_khop || '';
    r.getCell(35).value = p.noi_pl_co_xuong_khop != null ? Number(p.noi_pl_co_xuong_khop) : '';
    r.getCell(36).value = p.noi_than_kinh || '';
    r.getCell(37).value = p.noi_pl_than_kinh != null ? Number(p.noi_pl_than_kinh) : '';
    r.getCell(38).value = p.noi_tam_than || '';
    r.getCell(39).value = p.noi_pl_tam_than != null ? Number(p.noi_pl_tam_than) : '';
    r.getCell(40).value = p.noi_bac_sy || '';

    // Ngoại khoa (Cột 41-43)
    r.getCell(41).value = p.ngoai_ket_qua || '';
    r.getCell(42).value = p.ngoai_phan_loai != null ? Number(p.ngoai_phan_loai) : '';
    r.getCell(43).value = p.ngoai_bac_sy || '';

    // Mắt (Cột 44-50)
    r.getCell(44).value = p.mat_khong_kinh_phai != null ? String(p.mat_khong_kinh_phai) : '';
    r.getCell(45).value = p.mat_khong_kinh_trai != null ? String(p.mat_khong_kinh_trai) : '';
    r.getCell(46).value = p.mat_co_kinh_phai != null ? String(p.mat_co_kinh_phai) : '';
    r.getCell(47).value = p.mat_co_kinh_trai != null ? String(p.mat_co_kinh_trai) : '';
    r.getCell(48).value = p.mat_benh || '';
    r.getCell(49).value = p.mat_phan_loai != null ? Number(p.mat_phan_loai) : '';
    r.getCell(50).value = p.mat_bac_sy || '';

    // Tai Mũi Họng (Cột 51-57)
    r.getCell(51).value = p.tmh_tai_trai_thuong != null ? String(p.tmh_tai_trai_thuong) : '';
    r.getCell(52).value = p.tmh_tai_trai_tham != null ? String(p.tmh_tai_trai_tham) : '';
    r.getCell(53).value = p.tmh_tai_phai_thuong != null ? String(p.tmh_tai_phai_thuong) : '';
    r.getCell(54).value = p.tmh_tai_phai_tham != null ? String(p.tmh_tai_phai_tham) : '';
    r.getCell(55).value = p.tmh_benh || '';
    r.getCell(56).value = p.tmh_phan_loai != null ? Number(p.tmh_phan_loai) : '';
    r.getCell(57).value = p.tmh_bac_sy || '';

    // Răng Hàm Mặt (Cột 58-62)
    r.getCell(58).value = p.rhm_ham_tren || '';
    r.getCell(59).value = p.rhm_ham_duoi || '';
    r.getCell(60).value = p.rhm_benh || '';
    r.getCell(61).value = p.rhm_phan_loai != null ? Number(p.rhm_phan_loai) : '';
    r.getCell(62).value = p.rhm_bac_sy || '';

    // Da Liễu (Cột 63-65)
    r.getCell(63).value = p.da_lieu_ket_qua || '';
    r.getCell(64).value = p.da_lieu_phan_loai != null ? Number(p.da_lieu_phan_loai) : '';
    r.getCell(65).value = p.da_lieu_bac_sy || '';

    // Sản Phụ Khoa (Cột 66-68)
    r.getCell(66).value = p.gioi_tinh === 2 ? (p.san_phu_khoa_ket_qua || '') : '';
    r.getCell(67).value = p.gioi_tinh === 2 && p.san_phu_khoa_phan_loai != null ? Number(p.san_phu_khoa_phan_loai) : '';
    r.getCell(68).value = p.gioi_tinh === 2 ? (p.san_phu_khoa_bac_sy || '') : '';

    // IV. CẬN LÂM SÀNG (Cột 69-100)
    // Công thức máu
    r.getCell(69).value = p.cls_hong_cau != null ? p.cls_hong_cau : '';
    r.getCell(70).value = p.cls_bach_cau != null ? p.cls_bach_cau : '';
    r.getCell(71).value = p.cls_tieu_cau != null ? p.cls_tieu_cau : '';
    r.getCell(72).value = p.cls_huyet_sac_to != null ? p.cls_huyet_sac_to : '';
    // Đường huyết & chức năng thận
    r.getCell(73).value = p.cls_duong_huyet != null ? p.cls_duong_huyet : '';
    r.getCell(74).value = p.cls_ure != null ? p.cls_ure : '';
    r.getCell(75).value = p.cls_creatinin != null ? p.cls_creatinin : '';
    r.getCell(76).value = p.cls_bilirubin_tp != null ? p.cls_bilirubin_tp : '';
    // Chức năng gan
    r.getCell(77).value = p.cls_ast != null ? p.cls_ast : '';
    r.getCell(78).value = p.cls_alt != null ? p.cls_alt : '';
    r.getCell(79).value = p.cls_ggt != null ? p.cls_ggt : '';
    // Mỡ máu
    r.getCell(80).value = p.cls_triglycerid != null ? p.cls_triglycerid : '';
    r.getCell(81).value = p.cls_cholesterol_tp != null ? p.cls_cholesterol_tp : '';
    r.getCell(82).value = p.cls_hdl_c != null ? p.cls_hdl_c : '';
    r.getCell(83).value = p.cls_ldl_c != null ? p.cls_ldl_c : '';
    r.getCell(84).value = p.cls_hba1c != null ? p.cls_hba1c : '';
    // Miễn dịch
    r.getCell(85).value = p.cls_afp != null ? p.cls_afp : '';
    r.getCell(86).value = p.cls_cea != null ? p.cls_cea : '';
    r.getCell(87).value = p.cls_psa_total != null ? p.cls_psa_total : '';
    r.getCell(88).value = p.cls_hbsag || '';
    r.getCell(89).value = p.cls_hbsab || '';
    r.getCell(90).value = p.cls_anti_hcv || '';
    // Nước tiểu
    r.getCell(91).value = p.cls_axit_uric != null ? p.cls_axit_uric : '';
    r.getCell(92).value = p.cls_glucose || '';
    r.getCell(93).value = p.cls_protein_nieu || '';
    r.getCell(94).value = p.cls_nuoc_tieu_hong_cau || '';
    r.getCell(95).value = p.cls_nuoc_tieu_bach_cau || '';
    // Chẩn đoán hình ảnh
    r.getCell(96).value = p.cls_dien_tim || '';
    r.getCell(97).value = p.cls_xquang || '';
    r.getCell(98).value = p.cls_sieu_am || '';
    r.getCell(99).value = p.cls_cdha_khac || '';
    r.getCell(100).value = p.cls_xet_nghiem_khac || '';

    // V. KẾT LUẬN (Cột 101-107)
    r.getCell(101).value = p.phan_loai_suc_khoe != null ? Number(p.phan_loai_suc_khoe) : '';
    r.getCell(102).value = p.mo_ta_benh_tat || '';
    r.getCell(103).value = p.ma_icd10 || '';
    r.getCell(104).value = p.loi_dan_bac_si || '';
    r.getCell(105).value = p.ngay_ket_luan || '';
    r.getCell(106).value = p.bac_si_ket_luan || '';
    r.getCell(107).value = p.ma_cskcb || '';

    // Áp dụng chuẩn Times New Roman 12, chữ đen #000000, không in nghiêng, viền mỏng
    for (let colIdx = 1; colIdx <= 108; colIdx++) {
      const cell = r.getCell(colIdx);
      cell.font = {
        name: 'Times New Roman',
        size: 12,
        color: { argb: 'FF000000' },
        italic: false,
        bold: false
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
      };

      // Căn giữa các cột mã, ngày, số, phân loại; căn trái các cột văn bản
      if ([1, 3, 4, 6, 17, 23, 25, 27, 29, 31, 33, 35, 37, 39, 42, 49, 56, 61, 64, 67, 101, 103, 105, 107].includes(colIdx)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    }
    r.height = 22;

    r.commit();
  });

  return workbook;
}

// Module nạp danh sách công ty từ Excel
async function importCompanyExcel(filePath, dotKhamDefault = 'Đoàn KSK') {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  let headerRowIndex = 1;
  let colMap = {};

  // Tìm dòng tiêu đề chứa các từ khóa cột
  for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    let foundHoten = false;
    row.eachCell((cell, colNumber) => {
      const txt = String(cell.text || cell.value || '').trim().toLowerCase();
      if (txt.includes('họ') && (txt.includes('tên') || txt.includes('và'))) {
        foundHoten = true;
      }
    });

    if (foundHoten) {
      headerRowIndex = r;
      row.eachCell((cell, colNumber) => {
        const txt = String(cell.text || cell.value || '').trim().toLowerCase();
        if (txt.includes('stt') || txt === 'tt') colMap.stt = colNumber;
        else if (txt.includes('họ') && (txt.includes('tên') || txt.includes('và'))) colMap.ho_ten = colNumber;
        else if (txt.includes('sinh') || txt.includes('ngày sinh') || txt.includes('năm sinh')) colMap.ngay_sinh = colNumber;
        else if (txt.includes('giới') || txt.includes('tính') || txt === 'nam/nữ' || txt === 'phái') colMap.gioi_tinh = colNumber;
        else if (txt.includes('cccd') || txt.includes('cmnd') || txt.includes('định danh')) colMap.cccd = colNumber;
        else if (txt.includes('sđt') || txt.includes('điện thoại') || txt.includes('phone')) colMap.sdt = colNumber;
        else if (txt.includes('bhyt')) colMap.so_the_bhyt = colNumber;
        else if (txt.includes('công tác') || txt.includes('đơn vị') || txt.includes('phòng ban') || txt.includes('bộ phận')) colMap.noi_cong_tac = colNumber;
        else if (txt.includes('nghề')) colMap.nghe_nghiep = colNumber;
        else if (txt.includes('tỉnh') || txt.includes('thành phố')) colMap.tinh_tp = colNumber;
        else if (txt.includes('xã') || txt.includes('phường')) colMap.xa_phuong = colNumber;
        else if (txt.includes('đối tượng')) colMap.doi_tuong_ksk = colNumber;
      });
      break;
    }
  }

  if (!colMap.ho_ten) {
    throw new Error('Không tìm thấy cột Họ và tên trong file Excel tải lên.');
  }

  let imported = 0;
  let skipped = 0;

  for (let r = headerRowIndex + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const hoTenVal = colMap.ho_ten ? row.getCell(colMap.ho_ten).text : '';
    if (!hoTenVal || !hoTenVal.trim()) {
      skipped++;
      continue;
    }

    const sttVal = colMap.stt ? parseInt(row.getCell(colMap.stt).text) : null;
    let ngaySinhVal = colMap.ngay_sinh ? row.getCell(colMap.ngay_sinh).text : '';
    if (row.getCell(colMap.ngay_sinh).value instanceof Date) {
      const d = row.getCell(colMap.ngay_sinh).value;
      ngaySinhVal = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    let gioiTinhVal = 1;
    if (colMap.gioi_tinh) {
      const gtTxt = row.getCell(colMap.gioi_tinh).text.trim().toLowerCase();
      if (gtTxt === '2' || gtTxt === 'nữ' || gtTxt === 'nu' || gtTxt === 'f' || gtTxt === 'female') {
        gioiTinhVal = 2;
      }
    }

    const cccdVal = colMap.cccd ? row.getCell(colMap.cccd).text.trim() : '';
    const sdtVal = colMap.sdt ? row.getCell(colMap.sdt).text.trim() : '';
    const bhytVal = colMap.so_the_bhyt ? row.getCell(colMap.so_the_bhyt).text.trim() : '';
    const congTacVal = colMap.noi_cong_tac ? row.getCell(colMap.noi_cong_tac).text.trim() : '';
    const ngheVal = colMap.nghe_nghiep ? row.getCell(colMap.nghe_nghiep).text.trim() : '';
    const tinhVal = colMap.tinh_tp ? row.getCell(colMap.tinh_tp).text.trim() : '';
    const xaVal = colMap.xa_phuong ? row.getCell(colMap.xa_phuong).text.trim() : '';
    const doiTuongVal = colMap.doi_tuong_ksk ? row.getCell(colMap.doi_tuong_ksk).text.trim() : '64';

    await run(
      `INSERT INTO patients (
        stt, ho_ten, ngay_sinh, gioi_tinh, cccd, so_the_bhyt, sdt,
        tinh_tp, xa_phuong, nghe_nghiep, noi_cong_tac, doi_tuong_ksk, dot_kham, trang_thai
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CHO_KHAM')`,
      [
        sttVal || (imported + 1),
        hoTenVal.trim(),
        ngaySinhVal ? ngaySinhVal.trim() : '01/01/1990',
        gioiTinhVal,
        cccdVal,
        bhytVal,
        sdtVal,
        tinhVal,
        xaVal,
        ngheVal,
        congTacVal,
        doiTuongVal,
        dotKhamDefault
      ]
    );

    imported++;
  }

  broadcast('PATIENTS_BATCH_IMPORTED', { count: imported, dot_kham: dotKhamDefault });
  return { imported, skipped };
}

module.exports = {
  exportKskExcel,
  importCompanyExcel
};
