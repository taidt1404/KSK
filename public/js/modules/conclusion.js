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
              <label style="margin-bottom: 0;">Mã bệnh theo ICD-10 <span class="req">*</span></label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-open-icd-modal" style="padding: 2px 8px; font-size: 11px;">
                🔍 Tra cứu (~20.000 mã)
              </button>
            </div>
            <input type="text" id="kl-ma_icd10" list="list-icd10" class="form-control" value="${ketLuan.ma_icd10 || 'Z00.0'}" placeholder="Chọn hoặc gõ (VD: Z00, Z10, Z02, lái xe, cận thị...)" autocomplete="off" required>
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
      const val = icdInput.value.trim();
      const match = val.match(/^([A-Z][0-9]{2}(?:\.[0-9]{1,3})?)\s*[-:]\s*(.+)$/i);
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
    let icdDebounce = null;
    icdInput.addEventListener('input', () => {
      if (icdInput.value.includes(' - ')) {
        handleIcdSelect();
        return;
      }
      clearTimeout(icdDebounce);
      icdDebounce = setTimeout(() => {
        loadIcd10Options(icdInput.value.trim());
      }, 200);
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

// Modal tra cứu toàn diện ~20.000 mã ICD-10
function openIcd10Modal() {
  let modal = document.getElementById('modal-icd10');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'modal-icd10';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 820px; max-height: 85vh; display: flex; flex-direction: column;">
      <div class="modal-header">
        <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
          <span>📚 Tra Cứu Danh Mục ICD-10 Toàn Diện (~20.000 Mã Bộ Y Tế)</span>
        </h3>
        <button type="button" class="modal-close" id="btn-close-icd-modal">✕</button>
      </div>
      <div class="modal-body" style="padding: 16px 20px; overflow-y: hidden; display: flex; flex-direction: column; flex: 1;">
        <div style="margin-bottom: 12px;">
          <input type="text" id="icd-modal-search" class="form-control" placeholder="🔎 Gõ mã hoặc tên bệnh (VD: Z00, Z10, lái xe, tuyển quân, đi làm, cận thị, huyết áp, trẻ em...)" style="font-size: 14px; padding: 10px 14px;" autofocus>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
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
          <span class="badge-chip" data-q="răng" style="cursor: pointer; padding: 4px 10px; background: #f1f5f9; border-radius: 14px; font-size: 12px;">🦷 Răng Hàm Mặt</span>
        </div>
        <div id="icd-modal-results" style="border: 1px solid var(--border); border-radius: 8px; flex: 1; overflow-y: auto; min-height: 280px; max-height: 420px;">
          <div style="text-align: center; padding: 30px; color: var(--text-muted);">Đang tải danh mục...</div>
        </div>
      </div>
      <div class="modal-footer" style="padding: 10px 20px;">
        <span style="font-size: 12px; color: var(--text-muted); margin-right: auto;">Tìm kiếm tự động tức thời trên 19.568 mã ICD-10</span>
        <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-icd-modal">Đóng</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

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

  renderModalResults('');
}

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
            <th style="padding: 10px 12px; text-align: center; width: 110px;">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          ${data.data.map((item, idx) => {
            const cleanDesc = item.name.replace(/^[A-Z0-9.]+\s*-\s*/, '');
            const isHighlight = item.code.startsWith('Z00') || item.code === 'Z10' || item.code.startsWith('Z02');
            return `
              <tr style="border-bottom: 1px solid var(--border); ${isHighlight ? 'background: #f0fdf4;' : (idx % 2 === 0 ? 'background: #ffffff;' : 'background: #fbfcfd;')}">
                <td style="padding: 8px 12px; font-weight: 700; color: ${isHighlight ? '#15803d' : 'var(--primary)'}; font-family: monospace; font-size: 14px;">${item.code}</td>
                <td style="padding: 8px 12px; line-height: 1.4;">${cleanDesc}</td>
                <td style="padding: 8px 12px; text-align: center;">
                  <button type="button" class="btn btn-primary btn-sm btn-select-icd" data-code="${item.code}" data-desc="${cleanDesc.replace(/"/g, '&quot;')}" style="padding: 4px 10px; font-size: 12px;">
                    Chọn mã
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
        const icdInput = document.getElementById('kl-ma_icd10');
        if (icdInput) icdInput.value = code;

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

        const modal = document.getElementById('modal-icd10');
        if (modal) modal.remove();
        window.showToast(`Đã chọn mã [${code}] - ${desc}`, 'success');
      };
    });
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; padding: 25px; color: var(--danger);">Lỗi tải dữ liệu: ${err.message}</div>`;
  }
}

window.ConclusionModule = {
  renderConclusionView
};
