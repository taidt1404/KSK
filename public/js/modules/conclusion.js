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
