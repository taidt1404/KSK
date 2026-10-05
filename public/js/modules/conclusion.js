function renderConclusionView(container, patientData) {
  if (!patientData || !patientData.patient) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px; color: var(--text-muted);">
        <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
        <h3>Vui lòng chọn một bệnh nhân từ danh sách để xem tổng hợp và kết luận</h3>
      </div>
    `;
    return;
  }

  const p = patientData.patient;
  const theLuc = patientData.the_luc || {};
  const lamSang = patientData.kham_lam_sang || {};
  const cls = patientData.can_lam_sang || {};
  const ketLuan = patientData.ket_luan || {};

  const savedDoctor = window.RoomManager.getSavedDoctor('ket_luan');
  const todayStr = window.getTodayDMY ? window.getTodayDMY() : new Date().toLocaleDateString('vi-VN');

  const DOCTOR_OPTIONS = [
    'Nguyễn Văn Làn',
    'Nguyễn Văn Thiện',
    'Nguyễn Hữu Chức'
  ];
  let selectedDoctor = ketLuan.bac_si_ket_luan || savedDoctor || DOCTOR_OPTIONS[0];
  if (!DOCTOR_OPTIONS.includes(selectedDoctor)) {
    selectedDoctor = (savedDoctor && DOCTOR_OPTIONS.includes(savedDoctor)) ? savedDoctor : DOCTOR_OPTIONS[0];
  }
  const cskcbVal = (ketLuan.ma_cskcb && ketLuan.ma_cskcb !== '79001') ? ketLuan.ma_cskcb : '24275';

  // 1. Phân tích kết quả chuyên khoa Nội
  const organsNoi = [
    { name: 'Tuần hoàn', val: lamSang.noi_tuan_hoan, pl: lamSang.noi_pl_tuan_hoan },
    { name: 'Hô hấp', val: lamSang.noi_ho_hap, pl: lamSang.noi_pl_ho_hap },
    { name: 'Tiêu hóa', val: lamSang.noi_tieu_hoa, pl: lamSang.noi_pl_tieu_hoa },
    { name: 'Thận - Tiết niệu', val: lamSang.noi_than_tiet_nieu, pl: lamSang.noi_pl_than_tiet_nieu },
    { name: 'Nội tiết', val: lamSang.noi_noi_tiet, pl: lamSang.noi_pl_noi_tiet },
    { name: 'Cơ xương khớp', val: lamSang.noi_co_xuong_khop, pl: lamSang.noi_pl_co_xuong_khop },
    { name: 'Thần kinh', val: lamSang.noi_than_kinh, pl: lamSang.noi_pl_than_kinh },
    { name: 'Tâm thần', val: lamSang.noi_tam_than, pl: lamSang.noi_pl_tam_than }
  ];

  let noiMaxPl = 1;
  const noiAbnormal = [];
  organsNoi.forEach(o => {
    if (o.pl && o.pl > noiMaxPl) noiMaxPl = o.pl;
    if (o.val) {
      const low = o.val.trim().toLowerCase();
      if (low && low !== 'bình thường' && low !== 'bt' && low !== 'không' && low !== 'không có') {
        noiAbnormal.push(`${o.name}: ${o.val}`);
      }
    }
  });
  const isNoiDone = !!(lamSang.noi_bac_sy || lamSang.noi_pl_tuan_hoan || lamSang.noi_tuan_hoan || lamSang.noi_ngay_kham);
  const noiShort = noiAbnormal.length > 0 ? noiAbnormal[0] : 'Bình thường';
  const noiFull = noiAbnormal.length > 0
    ? noiAbnormal.join('; ')
    : 'Tuần hoàn, Hô hấp, Tiêu hóa, Thận - Tiết niệu, Nội tiết, Cơ xương khớp, Thần kinh, Tâm thần: Bình thường';

  // 2. Phân tích kết quả Cận Lâm Sàng
  const cdha = [];
  const clsAbnormal = [];
  if (cls.cls_xquang) cdha.push(`X-Quang: ${cls.cls_xquang}`);
  if (cls.cls_sieu_am) cdha.push(`Siêu âm: ${cls.cls_sieu_am}`);
  if (cls.cls_dien_tim) cdha.push(`Điện tim: ${cls.cls_dien_tim}`);

  const bloodTests = [];
  if (cls.cls_hong_cau) bloodTests.push(`HC: ${cls.cls_hong_cau} T/L`);
  if (cls.cls_bach_cau) bloodTests.push(`BC: ${cls.cls_bach_cau} G/L`);
  if (cls.cls_tieu_cau) bloodTests.push(`TC: ${cls.cls_tieu_cau} G/L`);
  if (cls.cls_huyet_sac_to) bloodTests.push(`HST: ${cls.cls_huyet_sac_to} g/L`);

  const bioTests = [];
  if (cls.cls_duong_huyet) bioTests.push(`Đường huyết: ${cls.cls_duong_huyet} mmol/l`);
  if (cls.cls_ure) bioTests.push(`Ure: ${cls.cls_ure} mmol/l`);
  if (cls.cls_creatinin) bioTests.push(`Creatinin: ${cls.cls_creatinin} µmol/l`);
  if (cls.cls_ast || cls.cls_alt) bioTests.push(`AST/ALT: ${cls.cls_ast || '-'}/${cls.cls_alt || '-'} U/l`);
  if (cls.cls_cholesterol_tp) bioTests.push(`Cholesterol: ${cls.cls_cholesterol_tp} mmol/l`);

  [
    { name: 'X-Quang', val: cls.cls_xquang },
    { name: 'Siêu âm', val: cls.cls_sieu_am },
    { name: 'Điện tim', val: cls.cls_dien_tim }
  ].forEach(cd => {
    if (cd.val) {
      const low = cd.val.toLowerCase();
      if (!low.includes('bình thường') && !low.includes('nhịp xoang') && !low.includes('chưa phát hiện')) {
        clsAbnormal.push(`${cd.name}: ${cd.val}`);
      }
    }
  });

  const isClsDone = !!(cls.cls_hong_cau || cls.cls_duong_huyet || cls.cls_xquang || cls.cls_sieu_am || cls.cls_dien_tim || cls.cls_bac_sy || cls.cls_ast);
  let clsShort = 'Đã có KQ';
  if (clsAbnormal.length > 0) {
    clsShort = clsAbnormal.join(', ');
  } else if (cdha.length > 0) {
    clsShort = 'XQ, SA, ECG: Bình thường';
  } else if (bloodTests.length > 0 || bioTests.length > 0) {
    clsShort = 'Xét nghiệm: Bình thường';
  }

  const clsFullItems = [];
  if (cdha.length > 0) clsFullItems.push(`<strong>Chẩn đoán hình ảnh:</strong> ${cdha.join(' | ')}`);
  if (bloodTests.length > 0) clsFullItems.push(`<strong>Huyết học:</strong> ${bloodTests.join(', ')}`);
  if (bioTests.length > 0) clsFullItems.push(`<strong>Sinh hóa:</strong> ${bioTests.join(', ')}`);
  if (cls.cls_hbsag) clsFullItems.push(`<strong>HBsAg:</strong> ${cls.cls_hbsag}`);
  if (cls.cls_protein_nieu) clsFullItems.push(`<strong>Protein niệu:</strong> ${cls.cls_protein_nieu}`);
  const clsFull = clsFullItems.length > 0 ? clsFullItems.join('<br>') : 'Đã thực hiện cận lâm sàng';

  const isTheLucDone = !!(theLuc.can_nang || theLuc.chieu_cao || theLuc.ha_tam_thu);
  const isNgoaiDone = !!(lamSang.ngoai_phan_loai || lamSang.ngoai_ket_qua || lamSang.ngoai_bac_sy);
  const isMatDone = !!(lamSang.mat_phan_loai || lamSang.mat_khong_kinh_phai || lamSang.mat_benh || lamSang.mat_bac_sy);
  const isTmhDone = !!(lamSang.tmh_phan_loai || lamSang.tmh_benh || lamSang.tmh_tai_trai_thuong || lamSang.tmh_bac_sy);
  const isRhmDone = !!(lamSang.rhm_phan_loai || lamSang.rhm_benh || lamSang.rhm_ham_tren || lamSang.rhm_bac_sy);
  const isDaLieuDone = !!(lamSang.da_lieu_phan_loai || lamSang.da_lieu_ket_qua || lamSang.da_lieu_bac_sy);

  // Đánh giá tình trạng hoàn thành các phòng và hiển thị kết quả trực tiếp
  const checks = [
    {
      roomId: 'the_luc',
      name: 'Thể Lực',
      done: isTheLucDone,
      val: isTheLucDone
        ? `${theLuc.can_nang || '-'}kg / ${theLuc.chieu_cao || '-'}cm${theLuc.ha_tam_thu ? ` (HA: ${theLuc.ha_tam_thu}/${theLuc.ha_tam_truong || '-'})` : ''} (PL ${theLuc.phan_loai_the_luc || 1})`
        : 'Chưa đo'
    },
    {
      roomId: 'noi',
      name: 'Khám Nội',
      done: isNoiDone,
      val: isNoiDone ? `${noiShort} (PL ${noiMaxPl})` : 'Chưa khám'
    },
    {
      roomId: 'ngoai',
      name: 'Khám Ngoại',
      done: isNgoaiDone,
      val: isNgoaiDone ? `${lamSang.ngoai_ket_qua || 'Bình thường'} (PL ${lamSang.ngoai_phan_loai || 1})` : 'Chưa khám'
    },
    {
      roomId: 'mat',
      name: 'Khám Mắt',
      done: isMatDone,
      val: isMatDone
        ? `${(lamSang.mat_benh && lamSang.mat_benh !== 'Không có' && lamSang.mat_benh !== 'Bình thường') ? lamSang.mat_benh : 'Thị lực ' + (lamSang.mat_khong_kinh_phai || '10') + '/10'} (PL ${lamSang.mat_phan_loai || 1})`
        : 'Chưa khám'
    },
    {
      roomId: 'tmh',
      name: 'Khám TMH',
      done: isTmhDone,
      val: isTmhDone ? `${lamSang.tmh_benh || 'Bình thường'} (PL ${lamSang.tmh_phan_loai || 1})` : 'Chưa khám'
    },
    {
      roomId: 'rhm',
      name: 'Khám RHM',
      done: isRhmDone,
      val: isRhmDone
        ? `${(lamSang.rhm_benh && lamSang.rhm_benh !== 'Không có') ? lamSang.rhm_benh : (lamSang.rhm_ham_tren || 'Bình thường')} (PL ${lamSang.rhm_phan_loai || 1})`
        : 'Chưa khám'
    },
    {
      roomId: 'da_lieu',
      name: 'Khám Da Liễu',
      done: isDaLieuDone,
      val: isDaLieuDone ? `${lamSang.da_lieu_ket_qua || 'Bình thường'} (PL ${lamSang.da_lieu_phan_loai || 1})` : 'Chưa khám'
    },
    {
      roomId: 'cls',
      name: 'Cận Lâm Sàng',
      done: isClsDone,
      val: isClsDone ? clsShort : 'Chưa có'
    }
  ];

  if (p.gioi_tinh === 2) {
    const isSanDone = !!(lamSang.san_phu_khoa_phan_loai || lamSang.san_phu_khoa_ket_qua || lamSang.san_phu_khoa_bac_sy);
    checks.push({
      roomId: 'san',
      name: 'Sản Phụ Khoa',
      done: isSanDone,
      val: isSanDone ? `${lamSang.san_phu_khoa_ket_qua || 'Bình thường'} (PL ${lamSang.san_phu_khoa_phan_loai || 1})` : 'Chưa khám'
    });
  }

  // Danh sách chi tiết kết quả cho bảng tổng hợp
  const detailedResults = [];

  if (isTheLucDone) {
    detailedResults.push({
      roomId: 'the_luc',
      name: '⚖️ Khám Thể Lực',
      doctor: theLuc.nguoi_kham || savedDoctor || 'BS/ĐD Thể lực',
      pl: `Loại ${theLuc.phan_loai_the_luc || 1}`,
      content: `Chiều cao: <strong>${theLuc.chieu_cao || '-'} cm</strong>, Cân nặng: <strong>${theLuc.can_nang || '-'} kg</strong>${theLuc.can_nang && theLuc.chieu_cao ? ` (BMI: ${(theLuc.can_nang / ((theLuc.chieu_cao/100)*(theLuc.chieu_cao/100))).toFixed(1)})` : ''}, Huyết áp: <strong>${theLuc.ha_tam_thu || '-'}/${theLuc.ha_tam_truong || '-'} mmHg</strong>, Mạch: <strong>${theLuc.mach || '-'} ck/phút</strong>${theLuc.vong_nguc ? `, Vòng ngực: <strong>${theLuc.vong_nguc} cm</strong>` : ''}`
    });
  }

  if (isNoiDone) {
    detailedResults.push({
      roomId: 'noi',
      name: '🩺 Khám Nội Khoa',
      doctor: lamSang.noi_bac_sy || '-',
      pl: `Loại ${noiMaxPl}`,
      content: noiFull
    });
  }

  if (isNgoaiDone) {
    detailedResults.push({
      roomId: 'ngoai',
      name: '🩹 Khám Ngoại Khoa',
      doctor: lamSang.ngoai_bac_sy || '-',
      pl: `Loại ${lamSang.ngoai_phan_loai || 1}`,
      content: `Kết quả khám Ngoại: <strong>${lamSang.ngoai_ket_qua || 'Bình thường'}</strong>`
    });
  }

  if (isMatDone) {
    let matContent = `Thị lực không kính: MP <strong>${lamSang.mat_khong_kinh_phai || '10'}/10</strong> - MT <strong>${lamSang.mat_khong_kinh_trai || '10'}/10</strong>`;
    if (lamSang.mat_co_kinh_phai || lamSang.mat_co_kinh_trai) {
      matContent += `, Có kính: MP ${lamSang.mat_co_kinh_phai || '-'}/10 - MT ${lamSang.mat_co_kinh_trai || '-'}/10`;
    }
    matContent += `. Bệnh về mắt: <strong>${lamSang.mat_benh || 'Không có'}</strong>`;
    detailedResults.push({
      roomId: 'mat',
      name: '👁️ Khám Mắt',
      doctor: lamSang.mat_bac_sy || '-',
      pl: `Loại ${lamSang.mat_phan_loai || 1}`,
      content: matContent
    });
  }

  if (isTmhDone) {
    detailedResults.push({
      roomId: 'tmh',
      name: '👂 Khám Tai Mũi Họng',
      doctor: lamSang.tmh_bac_sy || '-',
      pl: `Loại ${lamSang.tmh_phan_loai || 1}`,
      content: `Tai trái: thường <strong>${lamSang.tmh_tai_trai_thuong || '5'}m</strong>/thầm <strong>${lamSang.tmh_tai_trai_tham || '0.5'}m</strong>; Tai phải: thường <strong>${lamSang.tmh_tai_phai_thuong || '5'}m</strong>/thầm <strong>${lamSang.tmh_tai_phai_tham || '0.5'}m</strong>. Bệnh TMH: <strong>${lamSang.tmh_benh || 'Bình thường'}</strong>`
    });
  }

  if (isRhmDone) {
    detailedResults.push({
      roomId: 'rhm',
      name: '🦷 Khám Răng Hàm Mặt',
      doctor: lamSang.rhm_bac_sy || '-',
      pl: `Loại ${lamSang.rhm_phan_loai || 1}`,
      content: `Hàm trên: <strong>${lamSang.rhm_ham_tren || 'Bình thường'}</strong>, Hàm dưới: <strong>${lamSang.rhm_ham_duoi || 'Bình thường'}</strong>. Bệnh RHM: <strong>${lamSang.rhm_benh || 'Không có'}</strong>`
    });
  }

  if (isDaLieuDone) {
    detailedResults.push({
      roomId: 'da_lieu',
      name: '🧴 Khám Da Liễu',
      doctor: lamSang.da_lieu_bac_sy || '-',
      pl: `Loại ${lamSang.da_lieu_phan_loai || 1}`,
      content: `Kết quả khám Da liễu: <strong>${lamSang.da_lieu_ket_qua || 'Bình thường'}</strong>`
    });
  }

  if (isClsDone) {
    detailedResults.push({
      roomId: 'cls',
      name: '🧪 Cận Lâm Sàng',
      doctor: cls.cls_bac_sy || '-',
      pl: 'Đã có KQ',
      content: clsFull
    });
  }

  if (p.gioi_tinh === 2) {
    const isSanDone = !!(lamSang.san_phu_khoa_phan_loai || lamSang.san_phu_khoa_ket_qua || lamSang.san_phu_khoa_bac_sy);
    if (isSanDone) {
      detailedResults.push({
        roomId: 'san',
        name: '🌸 Khám Sản Phụ Khoa',
        doctor: lamSang.san_phu_khoa_bac_sy || '-',
        pl: `Loại ${lamSang.san_phu_khoa_phan_loai || 1}`,
        content: `Kết quả khám Phụ khoa: <strong>${lamSang.san_phu_khoa_ket_qua || 'Bình thường'}</strong>`
      });
    }
  }

  const MANDATORY_ROOMS = [
    { roomId: 'the_luc', name: 'Thể Lực', done: isTheLucDone },
    { roomId: 'noi', name: 'Khám Nội', done: isNoiDone },
    { roomId: 'ngoai', name: 'Khám Ngoại', done: isNgoaiDone },
    { roomId: 'mat', name: 'Khám Mắt', done: isMatDone },
    { roomId: 'tmh', name: 'Khám TMH', done: isTmhDone },
    { roomId: 'rhm', name: 'Khám RHM', done: isRhmDone },
    { roomId: 'da_lieu', name: 'Khám Da Liễu', done: isDaLieuDone }
  ];
  const missingMandatory = MANDATORY_ROOMS.filter(r => !r.done);
  const canConclude = missingMandatory.length === 0;
  const missingRooms = checks.filter((c) => !c.done);

  container.innerHTML = `
    <!-- TIẾN ĐỘ KHÁM CÁC PHÒNG -->
    <div class="card">
      <div class="card-title">
        <span>📊 Tiến Độ & Kết Quả Các Chuyên Khoa Đã Khám</span>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 13px; font-weight: normal; color: var(--text-muted);">
            ${checks.length - missingRooms.length}/${checks.length} chuyên khoa đã hoàn thành
          </span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-conclusion-progress">
            🔄 Đồng Bộ Dữ Liệu
          </button>
        </div>
      </div>

      <div class="progress-grid">
        ${checks.map((c) => `
          <div class="prog-chip ${c.done ? 'done' : 'waiting'}" data-room="${c.roomId}" title="Bấm để chuyển tới phòng khám này" style="cursor: pointer;">
            <div>${c.done ? '✅' : '⏳'} ${c.name}</div>
            <div style="font-size: 11px; margin-top: 3px; opacity: 0.9; font-weight: 500;">${c.val}</div>
          </div>
        `).join('')}
      </div>

      ${!canConclude ? `
        <div style="background: #fef2f2; border: 1.5px solid #f87171; color: #991b1b; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px; line-height: 1;">⛔</span>
          <div>
            <strong style="font-size: 13.5px;">CHƯA ĐỦ ĐIỀU KIỆN KÝ & KẾT LUẬN HỒ SƠ:</strong>
            <div style="margin-top: 3px; line-height: 1.4;">
              Bệnh nhân bắt buộc phải hoàn thành <strong>7 chuyên khoa cơ bản</strong>. Hiện tại còn thiếu: <strong style="color: #b91c1c; text-decoration: underline;">${missingMandatory.map(m => m.name).join(', ')}</strong>.
              <br>Hệ thống đang <strong>khóa nút Ký kết luận</strong> cho đến khi bệnh nhân hoàn tất các phòng trên.
            </div>
          </div>
        </div>
      ` : missingRooms.length > 0 ? `
        <div style="background: var(--warning-light); color: #92400e; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 14px;">
          ⚠️ <strong>Lưu ý:</strong> Bệnh nhân đã hoàn thành đủ 7 phòng bắt buộc (Đã đủ điều kiện ký). Còn phòng chưa khám: <strong>${missingRooms.map((m) => m.name).join(', ')}</strong>.
        </div>
      ` : `
        <div style="background: var(--success-light); color: #065f46; padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-bottom: 14px;">
          ✅ Bệnh nhân đã khám đầy đủ tất cả các chuyên khoa. Bác sĩ sẵn sàng tổng kết và phân loại sức khỏe.
        </div>
      `}

      <!-- BẢNG CHI TIẾT KẾT QUẢ KHÁM TỪNG KHOA PHÒNG -->
      ${detailedResults.length > 0 ? `
        <div style="margin-top: 14px; border-top: 1px solid var(--border); padding-top: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
              <span>📑</span> Chi Tiết Kết Quả Khám Các Chuyên Khoa (${detailedResults.length}/${checks.length})
            </h4>
            <span style="font-size: 11px; color: var(--text-muted); font-style: italic;">Bấm vào chip hoặc nút "Sửa" để chuyển nhanh tới phòng khám</span>
          </div>
          <div style="overflow-x: auto; background: white; border: 1px solid var(--border); border-radius: 8px;">
            <table style="width: 100%; min-width: 620px; border-collapse: collapse; font-size: 13px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid var(--border);">
                  <th style="padding: 10px 14px; font-weight: 600; color: var(--text-muted); width: 170px;">Chuyên khoa</th>
                  <th style="padding: 10px 14px; font-weight: 600; color: var(--text-muted); width: 160px;">Bác sĩ khám</th>
                  <th style="padding: 10px 14px; font-weight: 600; color: var(--text-muted); width: 110px;">Phân loại</th>
                  <th style="padding: 10px 14px; font-weight: 600; color: var(--text-muted);">Kết quả khám chi tiết</th>
                  <th style="padding: 10px 14px; font-weight: 600; color: var(--text-muted); width: 70px; text-align: center;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                ${detailedResults.map((item, idx) => `
                  <tr style="border-bottom: 1px solid var(--border); background: ${idx % 2 === 0 ? '#ffffff' : '#fcfcfd'};">
                    <td style="padding: 10px 14px; font-weight: 600; color: var(--text-main); white-space: nowrap;">
                      ${item.name}
                    </td>
                    <td style="padding: 10px 14px; color: var(--text-main);">
                      ${item.doctor}
                    </td>
                    <td style="padding: 10px 14px;">
                      <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
                        ${item.pl}
                      </span>
                    </td>
                    <td style="padding: 10px 14px; color: var(--text-main); line-height: 1.5;">
                      ${item.content}
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                      <button type="button" class="btn btn-secondary btn-sm btn-jump-room" data-room="${item.roomId}" style="padding: 3px 8px; font-size: 11px;" title="Chuyển đến phòng khám này">
                        ✏️ Sửa
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- FORM KẾT LUẬN -->
    <div class="card">
      <div class="card-title">
        <span>📋 Kết Luận & Đánh Giá Phân Loại Sức Khỏe Chung</span>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal-conclusion">Điền Nhanh: Đủ Sức Khỏe (Loại 1)</button>
      </div>

      <form id="form-conclusion">
        <div class="form-grid-3">
          <div class="form-group">
            <label>Phân loại sức khỏe chung <span class="req">*</span></label>
            <select id="kl-phan_loai_suc_khoe" class="form-control" required>
              <option value="1" ${ketLuan.phan_loai_suc_khoe === 1 ? 'selected' : ''}>Loại 1 - Rất khỏe</option>
              <option value="2" ${ketLuan.phan_loai_suc_khoe === 2 ? 'selected' : ''}>Loại 2 - Khỏe</option>
              <option value="3" ${ketLuan.phan_loai_suc_khoe === 3 ? 'selected' : ''}>Loại 3 - Trung bình</option>
              <option value="4" ${ketLuan.phan_loai_suc_khoe === 4 ? 'selected' : ''}>Loại 4 - Yếu</option>
              <option value="5" ${ketLuan.phan_loai_suc_khoe === 5 ? 'selected' : ''}>Loại 5 - Rất yếu</option>
            </select>
          </div>
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="margin-bottom: 0;">Mã bệnh ICD-10 (nhiều mã cách nhau dấu ;) <span class="req">*</span></label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-open-icd-modal" style="padding: 2px 8px; font-size: 11px;">
                🔍 Tra cứu & Chọn nhiều mã (~20.000 mã)
              </button>
            </div>
            <input type="text" id="kl-ma_icd10" list="list-icd10" class="form-control" value="${ketLuan.ma_icd10 || 'Z00.0'}" placeholder="Chọn hoặc gõ các mã, cách nhau dấu ; (VD: H52.1; K29; I10)" autocomplete="off" required>
            <datalist id="list-icd10"></datalist>
            <div id="icd-tags-container" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;"></div>
          </div>
          <div class="form-group">
            <label>Ngày kết luận <span class="req">*</span></label>
            <div class="date-picker-wrapper">
              <input type="text" id="kl-ngay_ket_luan" class="form-control date-input-mask" value="${ketLuan.ngay_ket_luan || todayStr}" placeholder="DD/MM/YYYY" maxlength="10" required>
              <button type="button" class="btn-picker-cal" tabindex="-1" title="Chọn ngày từ lịch">📅</button>
              <input type="date" tabindex="-1" class="native-picker-input">
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-top: 14px;">
          <label>Mô tả các bệnh tật (nếu có)</label>
          <textarea id="kl-mo_ta_benh_tat" class="form-control" placeholder="Nếu không có bệnh thì ghi: Đủ sức khỏe làm việc / Hiện tại chưa phát hiện bệnh lý">${ketLuan.mo_ta_benh_tat || ''}</textarea>
        </div>

        <div class="form-group" style="margin-top: 14px;">
          <label>Lời dặn của Bác sĩ</label>
          <textarea id="kl-loi_dan_bac_si" class="form-control" placeholder="Ví dụ: Chế độ ăn giảm muối, tăng cường vận động thể lực, khám định kỳ hàng năm">${ketLuan.loi_dan_bac_si || ''}</textarea>
        </div>

        <div class="form-grid-2" style="margin-top: 14px;">
          <div class="form-group">
            <label>Bác sĩ kết luận <span class="req">*</span></label>
            <select id="kl-bac_si_ket_luan" class="form-control" required>
              ${DOCTOR_OPTIONS.map(doc => `<option value="${doc}" ${selectedDoctor === doc ? 'selected' : ''}>${doc}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Mã cơ sở KCB thực hiện khám</label>
            <input type="text" id="kl-ma_cskcb" class="form-control" value="${cskcbVal}" placeholder="Mã 5 chữ số CS KCB">
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: flex-end; align-items: center; gap: 12px; flex-wrap: wrap;">
          ${!canConclude ? `
            <span style="font-size: 12.5px; color: #dc2626; font-weight: 600;">
              🔒 Đang khóa nút ký do thiếu: ${missingMandatory.map(m => m.name).join(', ')}
            </span>
          ` : ''}
          <button type="submit" class="btn ${canConclude ? 'btn-primary' : 'btn-secondary'}" id="btn-save-conclusion" ${!canConclude ? 'disabled style="opacity: 0.6; cursor: not-allowed; background: #94a3b8;"' : ''}>
            ${canConclude ? '💾 Ký & Hoàn Thành Hồ Sơ KSK' : '🔒 Chưa Thể Ký (Thiếu Phòng Khám Bắt Buộc)'}
          </button>
        </div>
      </form>
    </div>
  `;

  // Gắn sự kiện điền nhanh kết luận
  // Helper: Hiển thị danh sách badge tag các mã ICD đã chọn
  function renderIcdTags() {
    const container = document.getElementById('icd-tags-container');
    const input = document.getElementById('kl-ma_icd10');
    if (!container || !input) return;

    const raw = input.value.trim();
    if (!raw) {
      container.innerHTML = '';
      return;
    }

    const codes = [];
    raw.split(/[;,]/).forEach(c => {
      const trimmed = c.trim().toUpperCase();
      if (trimmed && !codes.includes(trimmed)) codes.push(trimmed);
    });

    container.innerHTML = codes.map(code => {
      const isZ00 = code === 'Z00.0';
      const bg = isZ00 ? '#ecfdf5' : '#e0f2fe';
      const text = isZ00 ? '#065f46' : '#0369a1';
      return `
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: ${bg}; color: ${text}; border-radius: 12px; font-size: 12px; font-family: monospace; font-weight: 700; border: 1px solid rgba(0,0,0,0.06);">
          ${code}
          <span class="btn-remove-icd-tag" data-code="${code}" style="cursor: pointer; font-size: 14px; font-weight: bold; margin-left: 3px; opacity: 0.8;" title="Xóa mã ${code}">&times;</span>
        </span>
      `;
    }).join('');

    container.querySelectorAll('.btn-remove-icd-tag').forEach(btn => {
      btn.onclick = () => {
        const targetCode = btn.dataset.code;
        const currentCodes = input.value.split(/[;,]/).map(c => c.trim().toUpperCase()).filter(Boolean);
        const remaining = currentCodes.filter(c => c !== targetCode);
        input.value = remaining.length > 0 ? remaining.join('; ') : 'Z00.0';
        renderIcdTags();
        if (input.value === 'Z00.0') {
          const descInput = document.getElementById('kl-mo_ta_benh_tat');
          if (descInput) descInput.value = 'Hiện tại chưa phát hiện bệnh lý. Đủ sức khỏe làm việc.';
          const plInput = document.getElementById('kl-phan_loai_suc_khoe');
          if (plInput) plInput.value = '1';
        }
      };
    });
  }

  // Khởi tạo hiển thị tags ban đầu
  renderIcdTags();

  // Gắn sự kiện điền nhanh kết luận
  const btnFillNormalKl = document.getElementById('btn-fill-normal-conclusion');
  if (btnFillNormalKl) {
    btnFillNormalKl.onclick = () => {
      if (!canConclude) {
        window.showToast('Không thể kết luận! Bệnh nhân chưa khám đủ 7 phòng bắt buộc (' + missingMandatory.map(m => m.name).join(', ') + ')', 'error');
        return;
      }
      document.getElementById('kl-phan_loai_suc_khoe').value = '1';
      document.getElementById('kl-ma_icd10').value = 'Z00.0';
      renderIcdTags();
      if (document.getElementById('kl-ngay_ket_luan') && !document.getElementById('kl-ngay_ket_luan').value) {
        document.getElementById('kl-ngay_ket_luan').value = todayStr;
      }
      document.getElementById('kl-mo_ta_benh_tat').value = 'Hiện tại chưa phát hiện bệnh lý. Đủ sức khỏe làm việc.';
      document.getElementById('kl-loi_dan_bac_si').value = 'Khám sức khỏe định kỳ hàng năm. Giữ gìn chế độ dinh dưỡng và vận động hợp lý.';
      const bsKl = document.getElementById('kl-bac_si_ket_luan');
      if (bsKl) {
        if (savedDoctor && DOCTOR_OPTIONS.includes(savedDoctor)) {
          bsKl.value = savedDoctor;
        } else if (!bsKl.value || !DOCTOR_OPTIONS.includes(bsKl.value)) {
          bsKl.value = DOCTOR_OPTIONS[0];
        }
      }
      const cskcb = document.getElementById('kl-ma_cskcb');
      if (cskcb) cskcb.value = '24275';
      window.showToast('Đã điền nhanh kết luận chuẩn (Loại 1)', 'info');
    };
  }

  // Gắn sự kiện làm mới tiến độ
  const btnRefreshProg = document.getElementById('btn-refresh-conclusion-progress');
  if (btnRefreshProg) {
    btnRefreshProg.onclick = async () => {
      btnRefreshProg.innerText = 'Đang đồng bộ...';
      btnRefreshProg.disabled = true;
      if (window.App && window.App.refreshCurrentPatient) {
        await window.App.refreshCurrentPatient();
      }
      window.showToast('Đã đồng bộ kết quả mới nhất từ các phòng khám', 'success');
    };
  }

  // Gắn sự kiện bấm vào chip hoặc nút "Sửa" để chuyển nhanh tới phòng khám
  container.querySelectorAll('.prog-chip, .btn-jump-room').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const roomId = el.dataset.room;
      if (roomId && window.App && window.App.switchRoom) {
        window.App.switchRoom(roomId);
      }
    });
  });

  // Gắn sự kiện mở Modal tra cứu ICD-10
  const btnOpenIcdModal = document.getElementById('btn-open-icd-modal');
  if (btnOpenIcdModal) {
    btnOpenIcdModal.onclick = () => {
      openIcd10Modal();
    };
  }

  // Nạp danh mục gợi ý ICD-10 ban đầu
  loadIcd10Options('');

  const icdInput = document.getElementById('kl-ma_icd10');
  if (icdInput) {
    const handleIcdSelect = () => {
      const raw = icdInput.value.trim();
      if (!raw.includes(' - ')) {
        renderIcdTags();
        return;
      }

      // Tách các đoạn mã hiện có và đoạn vừa được chọn
      const segments = raw.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      const codes = [];
      const descs = [];

      for (const seg of segments) {
        const match = seg.match(/^([A-Z][0-9]{2}(?:\.[0-9]{1,3})?)\s*[-:]\s*(.+)$/i);
        if (match) {
          const c = match[1].toUpperCase();
          const d = match[2].trim();
          if (!codes.includes(c)) {
            codes.push(c);
            descs.push(d);
          }
        } else {
          const c = seg.toUpperCase();
          if (!codes.includes(c)) codes.push(c);
        }
      }

      // Nếu có mã bệnh khác ngoài Z00.0 thì loại bỏ Z00.0
      let finalCodes = codes;
      if (finalCodes.length > 1 && finalCodes.includes('Z00.0')) {
        finalCodes = finalCodes.filter(c => c !== 'Z00.0');
      }

      icdInput.value = finalCodes.join('; ');
      renderIcdTags();

      // Cập nhật mô tả bệnh tật
      const descInput = document.getElementById('kl-mo_ta_benh_tat');
      if (descInput && descs.length > 0) {
        if (!descInput.value || descInput.value.includes('Hiện tại chưa phát hiện bệnh lý')) {
          descInput.value = descs.join('; ');
        } else {
          const curDescs = descInput.value.split(/[;,]/).map(d => d.trim()).filter(Boolean);
          for (const d of descs) {
            if (!curDescs.includes(d)) curDescs.push(d);
          }
          descInput.value = curDescs.join('; ');
        }
      }

      // Tự động phân loại sức khỏe sang Loại 2 nếu đang để Loại 1
      const plInput = document.getElementById('kl-phan_loai_suc_khoe');
      if (plInput && plInput.value === '1' && finalCodes.some(c => c !== 'Z00.0')) {
        plInput.value = '2';
      }
    };

    icdInput.addEventListener('change', handleIcdSelect);
    icdInput.addEventListener('blur', renderIcdTags);

    let icdDebounce = null;
    icdInput.addEventListener('input', () => {
      if (icdInput.value.includes(' - ')) {
        handleIcdSelect();
        return;
      }
      renderIcdTags();
      clearTimeout(icdDebounce);
      icdDebounce = setTimeout(() => {
        const parts = icdInput.value.split(/[;,]/);
        const lastPart = (parts[parts.length - 1] || '').trim();
        loadIcd10Options(lastPart);
      }, 200);
    });
  }

  // Gắn sự kiện lưu kết luận
  const form = document.getElementById('form-conclusion');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!canConclude) {
      window.showToast('Không thể ký kết luận! Bệnh nhân chưa hoàn thành các phòng khám bắt buộc: ' + missingMandatory.map(m => m.name).join(', '), 'error');
      return;
    }
    let rawIcd = document.getElementById('kl-ma_icd10').value;
    const codes = [];
    rawIcd.split(/[;,]/).forEach(part => {
      const m = part.trim().match(/^([A-Z][0-9]{2}(?:\.[0-9]{1,3})?)/i);
      if (m) {
        const c = m[1].toUpperCase();
        if (!codes.includes(c)) codes.push(c);
      } else if (part.trim()) {
        const c = part.trim().toUpperCase();
        if (!codes.includes(c)) codes.push(c);
      }
    });
    const maIcd10 = codes.length > 0 ? codes.join('; ') : 'Z00.0';

    const payload = {
      phan_loai_suc_khoe: document.getElementById('kl-phan_loai_suc_khoe').value,
      ma_icd10: maIcd10,
      ngay_ket_luan: document.getElementById('kl-ngay_ket_luan').value,
      mo_ta_benh_tat: document.getElementById('kl-mo_ta_benh_tat').value,
      loi_dan_bac_si: document.getElementById('kl-loi_dan_bac_si').value,
      bac_si_ket_luan: document.getElementById('kl-bac_si_ket_luan').value,
      ma_cskcb: document.getElementById('kl-ma_cskcb').value
    };

    window.RoomManager.saveDoctor('ket_luan', payload.bac_si_ket_luan);

    try {
      const res = await fetch(`/api/patients/${p.id}/ket-luan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        window.showToast('Đã lưu kết luận KSK thành công!', 'success');
        if (window.App && window.App.refreshCurrentPatient) {
          await window.App.refreshCurrentPatient();
        }
        if (window.App && window.App.selectNextPatient) {
          await window.App.selectNextPatient();
        }
      } else {
        window.showToast(data.message || 'Lỗi lưu kết luận', 'error');
      }
    } catch (err) {
      window.showToast('Lỗi mạng: ' + err.message, 'error');
    }
  });

  if (window.initDateInputs) {
    window.initDateInputs(container);
  }
}

let cachedDefaultIcd10 = null;

async function loadIcd10Options(query = '') {
  const datalist = document.getElementById('list-icd10');
  if (!datalist) return;
  try {
    let items = [];
    if (!query) {
      if (!cachedDefaultIcd10) {
        const res = await fetch('/api/lookups?category=ICD10');
        const data = await res.json();
        if (data.success && data.data) {
          cachedDefaultIcd10 = data.data;
        }
      }
      items = cachedDefaultIcd10 || [];
    } else {
      const res = await fetch(`/api/lookups?category=ICD10&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.data) {
        items = data.data;
      }
    }

    if (datalist && items.length > 0) {
      datalist.innerHTML = items.map(item => {
        const cleanDesc = item.name.replace(/^[A-Z0-9.]+\s*-\s*/, '');
        return `<option value="${item.code} - ${cleanDesc}">${item.name}</option>`;
      }).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh mục ICD-10:', err);
  }
}

// Modal tra cứu toàn diện ~20.000 mã ICD-10 (Hỗ trợ chọn nhiều mã cách nhau bởi dấu ;)
function openIcd10Modal() {
  let modal = document.getElementById('modal-icd10');
  if (modal) modal.remove();

  // Khởi tạo danh sách mã đã chọn từ input hiện tại
  const icdInput = document.getElementById('kl-ma_icd10');
  const currentVal = icdInput ? icdInput.value.trim() : 'Z00.0';
  const selectedIcdMap = new Map(); // code -> desc

  if (currentVal) {
    currentVal.split(/[;,]/).forEach(c => {
      const code = c.trim().toUpperCase();
      if (code) {
        selectedIcdMap.set(code, '');
      }
    });
  }

  modal = document.createElement('div');
  modal.id = 'modal-icd10';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 860px; max-height: 88vh; display: flex; flex-direction: column;">
      <div class="modal-header">
        <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
          <span>📚 Tra Cứu Danh Mục ICD-10 Toàn Diện (~20.000 Mã Bộ Y Tế)</span>
        </h3>
        <button type="button" class="modal-close" id="btn-close-icd-modal">✕</button>
      </div>
      <div class="modal-body" style="padding: 16px 20px; overflow-y: hidden; display: flex; flex-direction: column; flex: 1;">
        <!-- Thanh danh sách các mã đang chọn -->
        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 6px; flex: 1;">
            <strong style="font-size: 13px; color: var(--text-main); margin-right: 4px;">Đã chọn (<span id="icd-modal-count">0</span> mã):</strong>
            <div id="icd-modal-selected-chips" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-apply-icd-modal" style="padding: 6px 16px; font-weight: 700; font-size: 13px;">
            ✅ Hoàn thành & Áp dụng
          </button>
        </div>

        <div style="margin-bottom: 10px;">
          <input type="text" id="icd-modal-search" class="form-control" placeholder="🔎 Gõ mã hoặc tên bệnh (VD: Z00, Z10, lái xe, tuyển quân, đi làm, cận thị, huyết áp, trẻ em...)" style="font-size: 14px; padding: 10px 14px;" autofocus>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;">
          <span class="badge-chip" data-q="" style="cursor: pointer; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 14px; font-size: 12px; font-weight: 600;">⭐ Ưu tiên KSK</span>
          <span class="badge-chip" data-q="Z00.0" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">Z00.0 - KSK Tổng quát</span>
          <span class="badge-chip" data-q="Z10" style="cursor: pointer; padding: 4px 10px; background: #fef3c7; color: #92400e; border-radius: 14px; font-size: 12px; font-weight: bold;">Z10 - KSK Công ty / Cơ quan</span>
          <span class="badge-chip" data-q="Z02.1" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">Z02.1 - Tuyển dụng / Đi làm</span>
          <span class="badge-chip" data-q="Z02.4" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">Z02.4 - Lái xe</span>
          <span class="badge-chip" data-q="Z02.3" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">Z02.3 - Tuyển quân</span>
          <span class="badge-chip" data-q="trẻ em" style="cursor: pointer; padding: 4px 10px; background: #ecfdf5; color: #065f46; border-radius: 14px; font-size: 12px;">👶 KSK Trẻ em (Z00.1 / Z00.129)</span>
          <span class="badge-chip" data-q="cận thị" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">👁️ Mắt</span>
          <span class="badge-chip" data-q="huyết áp" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">🫀 Tim mạch</span>
          <span class="badge-chip" data-q="tiểu đường" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">🍬 Tiểu đường</span>
          <span class="badge-chip" data-q="dạ dày" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">🫁 Tiêu hóa</span>
          <span class="badge-chip" data-q="răng" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">🦷 Răng Hàm Mặt</span>
        </div>
        <div id="icd-modal-results" style="border: 1px solid var(--border); border-radius: 8px; flex: 1; overflow-y: auto; min-height: 260px; max-height: 380px;">
          <div style="text-align: center; padding: 30px; color: var(--text-muted);">Đang tải danh mục...</div>
        </div>
      </div>
      <div class="modal-footer" style="padding: 10px 20px;">
        <span style="font-size: 12px; color: var(--text-muted); margin-right: auto;">Bấm '+ Chọn mã' để chọn thêm nhiều mã bệnh. Bấm '✅ Hoàn thành & Áp dụng' để lưu.</span>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-icd-modal">Đóng</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function updateModalSelectedBar() {
    const chipsContainer = document.getElementById('icd-modal-selected-chips');
    const countSpan = document.getElementById('icd-modal-count');
    if (!chipsContainer || !countSpan) return;

    countSpan.innerText = selectedIcdMap.size;
    const codes = Array.from(selectedIcdMap.keys());

    chipsContainer.innerHTML = codes.map(code => {
      const isZ00 = code === 'Z00.0';
      const bg = isZ00 ? '#ecfdf5' : '#e0f2fe';
      const text = isZ00 ? '#065f46' : '#0369a1';
      return `
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: ${bg}; color: ${text}; border-radius: 12px; font-size: 12px; font-family: monospace; font-weight: 700; border: 1px solid rgba(0,0,0,0.06);">
          ${code}
          <span class="modal-chip-remove" data-code="${code}" style="cursor: pointer; font-size: 14px; font-weight: bold; margin-left: 2px; opacity: 0.8;" title="Bỏ chọn">&times;</span>
        </span>
      `;
    }).join('');

    chipsContainer.querySelectorAll('.modal-chip-remove').forEach(btn => {
      btn.onclick = () => {
        const code = btn.dataset.code;
        selectedIcdMap.delete(code);
        updateModalSelectedBar();
        renderModalResults(document.getElementById('icd-modal-search')?.value.trim() || '');
      };
    });
  }

  function applySelectedCodes() {
    const finalCodes = Array.from(selectedIcdMap.keys());
    const finalVal = finalCodes.length > 0 ? finalCodes.join('; ') : 'Z00.0';
    if (icdInput) icdInput.value = finalVal;

    // Cập nhật mô tả bệnh tật
    const descs = Array.from(selectedIcdMap.values()).filter(Boolean);
    const descInput = document.getElementById('kl-mo_ta_benh_tat');
    if (descInput) {
      if (finalVal === 'Z00.0') {
        descInput.value = 'Hiện tại chưa phát hiện bệnh lý. Đủ sức khỏe làm việc.';
      } else if (descs.length > 0) {
        descInput.value = descs.join('; ');
      }
    }

    const plInput = document.getElementById('kl-phan_loai_suc_khoe');
    if (plInput) {
      if (finalVal === 'Z00.0') {
        plInput.value = '1';
      } else if (plInput.value === '1' && finalCodes.some(c => c !== 'Z00.0')) {
        plInput.value = '2';
      }
    }

    // Hiển thị tags trên form chính
    const renderTagsFn = document.getElementById('icd-tags-container') ? () => {
      const container = document.getElementById('icd-tags-container');
      const input = document.getElementById('kl-ma_icd10');
      if (!container || !input) return;
      const codes = input.value.split(/[;,]/).map(c => c.trim().toUpperCase()).filter(Boolean);
      container.innerHTML = codes.map(code => {
        const isZ00 = code === 'Z00.0';
        const bg = isZ00 ? '#ecfdf5' : '#e0f2fe';
        const text = isZ00 ? '#065f46' : '#0369a1';
        return `
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: ${bg}; color: ${text}; border-radius: 12px; font-size: 12px; font-family: monospace; font-weight: 700; border: 1px solid rgba(0,0,0,0.06);">
            ${code}
            <span class="btn-remove-icd-tag" data-code="${code}" style="cursor: pointer; font-size: 14px; font-weight: bold; margin-left: 3px; opacity: 0.8;" title="Xóa mã ${code}">&times;</span>
          </span>
        `;
      }).join('');
      container.querySelectorAll('.btn-remove-icd-tag').forEach(btn => {
        btn.onclick = () => {
          const targetCode = btn.dataset.code;
          const currentCodes = input.value.split(/[;,]/).map(c => c.trim().toUpperCase()).filter(Boolean);
          const remaining = currentCodes.filter(c => c !== targetCode);
          input.value = remaining.length > 0 ? remaining.join('; ') : 'Z00.0';
          renderTagsFn();
        };
      });
    } : null;

    if (renderTagsFn) renderTagsFn();

    modal.remove();
    window.showToast(`Đã chọn ${finalCodes.length} mã ICD-10: ${finalVal}`, 'success');
  }

  const applyBtn = document.getElementById('btn-apply-icd-modal');
  if (applyBtn) applyBtn.onclick = applySelectedCodes;

  const closeBtn = document.getElementById('btn-close-icd-modal');
  const cancelBtn = document.getElementById('btn-cancel-icd-modal');
  const closeModal = () => modal.remove();

  if (closeBtn) closeBtn.onclick = closeModal;
  if (cancelBtn) cancelBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  const searchInput = document.getElementById('icd-modal-search');
  let modalDebounce = null;
  if (searchInput) {
    searchInput.oninput = () => {
      clearTimeout(modalDebounce);
      modalDebounce = setTimeout(() => {
        renderModalResults(searchInput.value.trim());
      }, 200);
    };
    setTimeout(() => searchInput.focus(), 50);
  }

  modal.querySelectorAll('.badge-chip').forEach(chip => {
    chip.onclick = () => {
      if (searchInput) {
        searchInput.value = chip.dataset.q;
        renderModalResults(chip.dataset.q);
      }
    };
  });

  async function renderModalResults(query) {
    const container = document.getElementById('icd-modal-results');
    if (!container) return;
    container.innerHTML = '<div style="text-align: center; padding: 25px; color: var(--text-muted);">⏳ Đang tra cứu danh mục...</div>';

    try {
      const res = await fetch(`/api/lookups?category=ICD10&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.success || !data.data || data.data.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted);">Không tìm thấy mã ICD-10 phù hợp</div>';
        return;
      }

      container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; position: sticky; top: 0; z-index: 2; border-bottom: 2px solid var(--border);">
              <th style="padding: 10px 12px; text-align: left; width: 110px;">Mã ICD</th>
              <th style="padding: 10px 12px; text-align: left;">Tên Bệnh & Chẩn Đoán Chi Tiết</th>
              <th style="padding: 10px 12px; text-align: center; width: 130px;">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            ${data.data.map((item, idx) => {
              const cleanDesc = item.name.replace(/^[A-Z0-9.]+\s*-\s*/, '');
              const isSelected = selectedIcdMap.has(item.code);
              const isHighlight = item.code.startsWith('Z00') || item.code === 'Z10' || item.code.startsWith('Z02');
              return `
                <tr style="border-bottom: 1px solid var(--border); ${isSelected ? 'background: #eff6ff;' : (isHighlight ? 'background: #f0fdf4;' : (idx % 2 === 0 ? 'background: #ffffff;' : 'background: #fbfcfd;'))}">
                  <td style="padding: 8px 12px; font-weight: 700; color: ${isSelected ? '#2563eb' : (isHighlight ? '#15803d' : 'var(--primary)')}; font-family: monospace; font-size: 14px;">${item.code}</td>
                  <td style="padding: 8px 12px; line-height: 1.4;">${cleanDesc}</td>
                  <td style="padding: 8px 12px; text-align: center;">
                    <button type="button" class="btn btn-sm btn-select-icd" data-code="${item.code}" data-desc="${cleanDesc.replace(/"/g, '&quot;')}" style="padding: 4px 12px; font-size: 12px; font-weight: 600; ${isSelected ? 'background: #16a34a; border-color: #16a34a; color: white;' : 'background: #2563eb; border-color: #2563eb; color: white;'}">
                      ${isSelected ? '✓ Đã chọn' : '+ Chọn mã'}
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.btn-select-icd').forEach(btn => {
        btn.onclick = () => {
          const code = btn.dataset.code;
          const desc = btn.dataset.desc;
          if (selectedIcdMap.has(code)) {
            selectedIcdMap.delete(code);
          } else {
            if (code !== 'Z00.0' && selectedIcdMap.has('Z00.0')) {
              selectedIcdMap.delete('Z00.0');
            }
            selectedIcdMap.set(code, desc);
          }
          updateModalSelectedBar();
          renderModalResults(searchInput ? searchInput.value.trim() : '');
        };
      });
    } catch (err) {
      container.innerHTML = `<div style="text-align: center; padding: 25px; color: var(--danger);">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
  }

  updateModalSelectedBar();
  renderModalResults('');
}

window.ConclusionModule = {
  renderConclusionView
};
