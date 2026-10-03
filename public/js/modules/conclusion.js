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
  const todayStr = new Date().toLocaleDateString('vi-VN');

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

  // Đánh giá tình trạng hoàn thành các phòng
  const checks = [
    {
      name: 'Thể Lực',
      done: !!(theLuc.can_nang || theLuc.chieu_cao || theLuc.ha_tam_thu),
      val: theLuc.can_nang ? `${theLuc.can_nang}kg / ${theLuc.chieu_cao}cm (PL ${theLuc.phan_loai_the_luc || 1})` : 'Chưa đo'
    },
    {
      name: 'Khám Nội',
      done: !!(lamSang.noi_bac_sy || lamSang.noi_pl_tuan_hoan || lamSang.noi_tuan_hoan || lamSang.noi_ngay_kham),
      val: (lamSang.noi_bac_sy || lamSang.noi_pl_tuan_hoan || lamSang.noi_tuan_hoan) ? `BS: ${lamSang.noi_bac_sy || 'Đã khám'}` : 'Chưa khám'
    },
    {
      name: 'Khám Ngoại',
      done: !!(lamSang.ngoai_phan_loai || lamSang.ngoai_ket_qua || lamSang.ngoai_bac_sy),
      val: lamSang.ngoai_phan_loai ? `PL ${lamSang.ngoai_phan_loai}` : (lamSang.ngoai_ket_qua ? 'Đã khám' : 'Chưa khám')
    },
    {
      name: 'Khám Mắt',
      done: !!(lamSang.mat_phan_loai || lamSang.mat_khong_kinh_phai || lamSang.mat_benh || lamSang.mat_bac_sy),
      val: lamSang.mat_phan_loai ? `PL ${lamSang.mat_phan_loai} (${lamSang.mat_khong_kinh_phai || 10}/10)` : (lamSang.mat_khong_kinh_phai ? `${lamSang.mat_khong_kinh_phai}/10` : 'Chưa khám')
    },
    {
      name: 'Khám TMH',
      done: !!(lamSang.tmh_phan_loai || lamSang.tmh_benh || lamSang.tmh_tai_trai_thuong || lamSang.tmh_bac_sy),
      val: lamSang.tmh_phan_loai ? `PL ${lamSang.tmh_phan_loai}` : (lamSang.tmh_benh ? 'Đã khám' : 'Chưa khám')
    },
    {
      name: 'Khám RHM',
      done: !!(lamSang.rhm_phan_loai || lamSang.rhm_benh || lamSang.rhm_ham_tren || lamSang.rhm_bac_sy),
      val: lamSang.rhm_phan_loai ? `PL ${lamSang.rhm_phan_loai}` : (lamSang.rhm_benh ? 'Đã khám' : 'Chưa khám')
    },
    {
      name: 'Khám Da Liễu',
      done: !!(lamSang.da_lieu_phan_loai || lamSang.da_lieu_ket_qua || lamSang.da_lieu_bac_sy),
      val: lamSang.da_lieu_phan_loai ? `PL ${lamSang.da_lieu_phan_loai}` : (lamSang.da_lieu_ket_qua ? 'Đã khám' : 'Chưa khám')
    },
    {
      name: 'Cận Lâm Sàng',
      done: !!(cls.cls_hong_cau || cls.cls_duong_huyet || cls.cls_xquang || cls.cls_sieu_am || cls.cls_dien_tim || cls.cls_bac_sy || cls.cls_ast),
      val: (cls.cls_hong_cau || cls.cls_xquang || cls.cls_duong_huyet || cls.cls_dien_tim || cls.cls_bac_sy) ? 'Đã có KQ' : 'Chưa có'
    }
  ];

  if (p.gioi_tinh === 2) {
    checks.push({
      name: 'Sản Phụ Khoa',
      done: !!(lamSang.san_phu_khoa_phan_loai || lamSang.san_phu_khoa_ket_qua || lamSang.san_phu_khoa_bac_sy),
      val: lamSang.san_phu_khoa_phan_loai ? `PL ${lamSang.san_phu_khoa_phan_loai}` : (lamSang.san_phu_khoa_ket_qua ? 'Đã khám' : 'Chưa khám')
    });
  }

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
          <div class="prog-chip ${c.done ? 'done' : 'waiting'}">
            <div>${c.done ? '✅' : '⏳'} ${c.name}</div>
            <div style="font-size: 11px; margin-top: 3px; opacity: 0.85;">${c.val}</div>
          </div>
        `).join('')}
      </div>

      ${missingRooms.length > 0 ? `
        <div style="background: var(--warning-light); color: #92400e; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
          ⚠️ <strong>Lưu ý:</strong> Bệnh nhân còn thiếu các phòng sau: <strong>${missingRooms.map((m) => m.name).join(', ')}</strong>.
        </div>
      ` : `
        <div style="background: var(--success-light); color: #065f46; padding: 10px 14px; border-radius: 6px; font-size: 13px;">
          ✅ Bệnh nhân đã khám đầy đủ tất cả các chuyên khoa. Bác sĩ sẵn sàng tổng kết và phân loại sức khỏe.
        </div>
      `}
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
            <label>Mã bệnh theo ICD-10 <span class="req">*</span></label>
            <input type="text" id="kl-ma_icd10" list="list-icd10" class="form-control" value="${ketLuan.ma_icd10 || 'Z00.0'}" placeholder="Chọn hoặc gõ (VD: Z00.0, H52.1, cận thị...)" autocomplete="off" required>
            <datalist id="list-icd10"></datalist>
          </div>
          <div class="form-group">
            <label>Ngày kết luận <span class="req">*</span></label>
            <input type="text" id="kl-ngay_ket_luan" class="form-control" value="${ketLuan.ngay_ket_luan || todayStr}" required>
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

        <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
          <button type="submit" class="btn btn-primary" id="btn-save-conclusion">
            💾 Ký & Hoàn Thành Hồ Sơ KSK
          </button>
        </div>
      </form>
    </div>
  `;

  // Gắn sự kiện điền nhanh kết luận
  const btnFillNormalKl = document.getElementById('btn-fill-normal-conclusion');
  if (btnFillNormalKl) {
    btnFillNormalKl.onclick = () => {
      document.getElementById('kl-phan_loai_suc_khoe').value = '1';
      document.getElementById('kl-ma_icd10').value = 'Z00.0';
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

  // Nạp danh mục gợi ý ICD-10
  loadIcd10Options();

  const icdInput = document.getElementById('kl-ma_icd10');
  if (icdInput) {
    const handleIcdSelect = () => {
      const val = icdInput.value.trim();
      const match = val.match(/^([A-Z][0-9]{2}(?:\.[0-9]{1,2})?)\s*[-:]\s*(.+)$/i);
      if (match) {
        const code = match[1].toUpperCase();
        const desc = match[2].trim();
        icdInput.value = code;
        const descInput = document.getElementById('kl-mo_ta_benh_tat');
        if (descInput) {
          if (!descInput.value || descInput.value.includes('Hiện tại chưa phát hiện bệnh lý')) {
            descInput.value = code === 'Z00.0' ? 'Hiện tại chưa phát hiện bệnh lý. Đủ sức khỏe làm việc.' : desc;
          }
        }
        const plInput = document.getElementById('kl-phan_loai_suc_khoe');
        if (plInput && plInput.value === '1' && code !== 'Z00.0') {
          plInput.value = '2';
        }
      }
    };
    icdInput.addEventListener('change', handleIcdSelect);
    icdInput.addEventListener('input', () => {
      if (icdInput.value.includes(' - ')) {
        handleIcdSelect();
      }
    });
  }

  // Gắn sự kiện lưu kết luận
  const form = document.getElementById('form-conclusion');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let maIcd10 = document.getElementById('kl-ma_icd10').value.trim();
    const codeMatch = maIcd10.match(/^([A-Z][0-9]{2}(?:\.[0-9]{1,2})?)/i);
    if (codeMatch) {
      maIcd10 = codeMatch[1].toUpperCase();
    }

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
}

let cachedIcd10Data = null;
async function loadIcd10Options() {
  const datalist = document.getElementById('list-icd10');
  if (!datalist) return;
  try {
    if (!cachedIcd10Data) {
      const res = await fetch('/api/lookups?category=ICD10');
      const data = await res.json();
      if (data.success && data.data) {
        cachedIcd10Data = data.data;
      }
    }
    if (cachedIcd10Data && datalist) {
      datalist.innerHTML = cachedIcd10Data.map(item => {
        const cleanDesc = item.name.replace(/^[A-Z0-9.]+\s*-\s*/, '');
        return `<option value="${item.code} - ${cleanDesc}">${item.name}</option>`;
      }).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh mục ICD-10:', err);
  }
}

window.ConclusionModule = {
  renderConclusionView
};
