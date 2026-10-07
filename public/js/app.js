let currentPatientList = [];
let selectedPatientId = null;
let selectedPatientData = null;
let currentFilter = 'all'; // 'all', 'waiting', 'done'
let currentSearchQuery = '';
let currentDotKham = '';
let currentDateFilter = '';

function isPatientDoneForRoom(p, room) {
  if (room === 'the_luc') return !!p.da_kham_the_luc;
  if (room === 'mat') return !!p.da_kham_mat;
  if (room === 'tmh') return !!p.da_kham_tmh;
  if (room === 'rhm') return !!p.da_kham_rhm;
  if (room === 'noi') return !!p.da_kham_noi;
  if (room === 'ngoai') return !!p.da_kham_ngoai;
  if (room === 'da_lieu') return !!p.da_kham_da_lieu;
  if (room === 'san') return !!p.da_kham_san;
  if (room === 'cls') return !!p.da_kham_cls;
  if (room === 'ket_luan') return !!p.da_ket_luan;
  return !!p.da_ket_luan;
}

function getTodayIso() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return iso;
}

// Helper trả về DD/MM/YYYY chuẩn 2 chữ số (ví dụ: 04/10/2026)
function getTodayDMY() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
window.getTodayDMY = getTodayDMY;

/**
 * Khởi tạo ô nhập ngày:
 * 1. Tự động thêm dấu gạch chéo '/' khi gõ số ngày, số tháng (VD: gõ 14 -> 14/, gõ tiếp 05 -> 14/05/)
 * 2. Hỗ trợ chọn ngày từ lịch trực quan (popup calendar)
 */
window.initDateInputs = function (container) {
  const wrappers = (container || document).querySelectorAll('.date-picker-wrapper');
  wrappers.forEach((wrapper) => {
    const textInput = wrapper.querySelector('input[type="text"]');
    const nativePicker = wrapper.querySelector('input[type="date"]');
    const calBtn = wrapper.querySelector('.btn-picker-cal');
    if (!textInput || !nativePicker) return;

    if (textInput.dataset.datePickerInited === 'true') return;
    textInput.dataset.datePickerInited = 'true';

    function syncToPicker(val) {
      if (!val) return;
      const parts = val.trim().split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2];
        if (y.length === 4 && !isNaN(parseInt(d, 10)) && !isNaN(parseInt(m, 10)) && !isNaN(parseInt(y, 10))) {
          nativePicker.value = `${y}-${m}-${d}`;
        }
      }
    }

    // Đồng bộ giá trị khởi tạo ban đầu
    syncToPicker(textInput.value);

    // Khi người dùng chọn từ popup lịch
    nativePicker.addEventListener('change', () => {
      if (nativePicker.value) {
        const [yyyy, mm, dd] = nativePicker.value.split('-');
        textInput.value = `${dd}/${mm}/${yyyy}`;
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
        textInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    if (calBtn) {
      calBtn.addEventListener('click', (e) => {
        e.preventDefault();
        syncToPicker(textInput.value);
        if (nativePicker.showPicker) {
          try { nativePicker.showPicker(); } catch (err) { nativePicker.click(); }
        } else {
          nativePicker.click();
        }
      });
    }

    // Xử lý phím Backspace khi con trỏ ở ngay sau dấu '/'
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        const val = textInput.value;
        const start = textInput.selectionStart;
        const end = textInput.selectionEnd;
        if (start === end && start > 0 && val[start - 1] === '/') {
          e.preventDefault();
          textInput.value = val.slice(0, start - 2) + val.slice(start);
          textInput.setSelectionRange(start - 2, start - 2);
          textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // Tự động gạch chéo khi nhập
    textInput.addEventListener('input', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) {
        return;
      }
      let v = textInput.value;
      // Chỉ giữ số và dấu /
      v = v.replace(/[^\d/]/g, '');
      // Gộp nhiều dấu / liên tiếp
      v = v.replace(/\/+/g, '/');

      const parts = v.split('/');
      if (parts.length === 1) {
        if (parts[0].length === 2) {
          v = parts[0] + '/';
        } else if (parts[0].length > 2) {
          const d = parts[0].slice(0, 2);
          const m = parts[0].slice(2, 4);
          const y = parts[0].slice(4, 8);
          v = d + (m ? '/' + m : '') + (y ? '/' + y : '');
        }
      } else if (parts.length === 2) {
        if (parts[1].length === 2) {
          v = parts[0] + '/' + parts[1] + '/';
        } else if (parts[1].length > 2) {
          const m = parts[1].slice(0, 2);
          const y = parts[1].slice(2, 6);
          v = parts[0] + '/' + m + (y ? '/' + y : '');
        }
      } else if (parts.length >= 3) {
        const d = parts[0];
        const m = parts[1];
        const y = parts[2].slice(0, 4);
        v = `${d}/${m}/${y}`;
      }

      if (v !== textInput.value) {
        textInput.value = v;
      }

      syncToPicker(v);
    });

    // Chuẩn hóa định dạng khi rời khỏi ô (ví dụ 1/5/1990 -> 01/05/1990)
    textInput.addEventListener('blur', () => {
      const v = textInput.value.trim();
      if (!v) return;
      const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) {
        const d = m[1].padStart(2, '0');
        const mo = m[2].padStart(2, '0');
        const y = m[3];
        textInput.value = `${d}/${mo}/${y}`;
        syncToPicker(textInput.value);
      }
    });
  });
};


// Toast Notification
window.showToast = function (message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
};

// Khởi chạy ứng dụng
async function initApp() {
  window.RoomManager.updateNavbarRoomDisplay();

  // Khởi tạo SSE
  window.SSE.initSSE((event) => {
    if (
      event.type === 'PATIENT_ADDED' ||
      event.type === 'PATIENT_UPDATED' ||
      event.type === 'EXAM_UPDATED' ||
      event.type === 'PATIENTS_BATCH_IMPORTED'
    ) {
      loadPatientList(false);
      updateTrashCount();
      const incomingId = event.data?.patientId ?? event.data?.id;
      if (selectedPatientId && incomingId && String(incomingId) === String(selectedPatientId)) {
        loadPatientDetail(selectedPatientId);
      }
    } else if (event.type === 'PATIENT_DELETED') {
      loadPatientList(false);
      updateTrashCount();
      const incomingId = event.data?.patientId ?? event.data?.id;
      if (selectedPatientId && incomingId && String(incomingId) === String(selectedPatientId)) {
        if (event.data?.permanent) {
          clearSelectedPatient();
          window.showToast('Hồ sơ bệnh nhân này vừa bị xóa vĩnh viễn khỏi hệ thống.', 'info');
        } else {
          loadPatientDetail(selectedPatientId);
          window.showToast('Hồ sơ bệnh nhân này vừa được chuyển vào Thùng rác.', 'info');
        }
      }
    } else if (event.type === 'PATIENT_RESTORED') {
      loadPatientList(false);
      updateTrashCount();
      const incomingId = event.data?.patientId ?? event.data?.id;
      if (selectedPatientId && incomingId && String(incomingId) === String(selectedPatientId)) {
        loadPatientDetail(selectedPatientId);
        window.showToast('Hồ sơ bệnh nhân này vừa được khôi phục thành công!', 'success');
      }
    }
  });

  // Tải danh sách đợt khám & số lượng thùng rác
  await loadDotKhamList();
  updateTrashCount();

  // Tải danh sách bệnh nhân
  await loadPatientList(true);

  // Gắn sự kiện giao diện
  setupEventListeners();

  // Lắng nghe phím tắt Ctrl + S
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (window.onSaveExamShortcut) {
        window.onSaveExamShortcut();
      }
    }
  });
}

// Tải danh sách các đợt khám vào dropdown
async function loadDotKhamList() {
  try {
    const res = await fetch('/api/lookups/dot-kham');
    const data = await res.json();
    const select = document.getElementById('select-dot-kham');
    if (select && data.success) {
      select.innerHTML = '<option value="">-- Tất cả đợt khám --</option>' +
        data.data.map((dk) => `<option value="${dk}">${dk}</option>`).join('');
    }
  } catch (err) {
    console.error('Lỗi tải đợt khám:', err);
  }
}

let lastFetchedAllPatients = [];

// Cập nhật số lượng hồ sơ trong thùng rác
async function updateTrashCount() {
  try {
    const res = await fetch('/api/patients/trash-count');
    const data = await res.json();
    if (data.success) {
      const el = document.getElementById('tab-trash-count');
      if (el) el.innerText = data.count || 0;
    }
  } catch (err) {
    console.error('Lỗi tải số lượng thùng rác:', err);
  }
}

// Tải danh sách bệnh nhân bên sidebar
async function loadPatientList(autoSelectFirst = false) {
  updateTrashCount();
  const currentRoom = window.RoomManager.getCurrentRoom();
  const isTrashTab = currentFilter === 'trash';

  let url = isTrashTab ? '/api/patients?trash=true' : `/api/patients?room=${currentRoom}`;
  if (currentSearchQuery) {
    url += `&q=${encodeURIComponent(currentSearchQuery)}`;
  }
  if (currentDotKham) {
    url += `&dot_kham=${encodeURIComponent(currentDotKham)}`;
  }
  if (currentDateFilter) {
    url += `&date=${encodeURIComponent(currentDateFilter)}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      if (isTrashTab) {
        currentPatientList = data.data;
        renderPatientList();
        const badgeEl = document.getElementById('date-stat-text');
        if (badgeEl) {
          badgeEl.innerHTML = `<span style="color: #b91c1c;">🗑️ <strong>Thùng rác:</strong> ${data.data.length} hồ sơ đã xóa (bấm để xem & khôi phục)</span>`;
        }
        if (autoSelectFirst && currentPatientList.length > 0 && !selectedPatientId) {
          selectPatient(currentPatientList[0].id);
        }
        return;
      }

      lastFetchedAllPatients = data.data;

      // Tính toán số lượng từng tab
      const waitingList = lastFetchedAllPatients.filter((p) => !isPatientDoneForRoom(p, currentRoom));
      const doneList = lastFetchedAllPatients.filter((p) => isPatientDoneForRoom(p, currentRoom));

      // Cập nhật text trên các nút tab
      const btnAll = document.getElementById('tab-btn-all');
      const btnWaiting = document.getElementById('tab-btn-waiting');
      const btnDone = document.getElementById('tab-btn-done');
      if (btnAll) btnAll.innerText = `Tất Cả (${lastFetchedAllPatients.length})`;
      if (btnWaiting) btnWaiting.innerText = `Chờ Khám (${waitingList.length})`;
      if (btnDone) btnDone.innerText = `Đã Khám (${doneList.length})`;

      // Phân bổ danh sách hiển thị theo tab hiện tại
      if (currentFilter === 'waiting') {
        currentPatientList = waitingList;
      } else if (currentFilter === 'done') {
        currentPatientList = doneList;
      } else {
        currentPatientList = lastFetchedAllPatients;
      }

      renderPatientList(doneList.length, waitingList.length);
      updateDateStatBadge(lastFetchedAllPatients);

      if (autoSelectFirst && currentPatientList.length > 0 && !selectedPatientId) {
        selectPatient(currentPatientList[0].id);
      }
    }
  } catch (err) {
    console.error('Lỗi tải danh sách bệnh nhân:', err);
  }
}

// Cập nhật thống kê số lượt khám theo ngày
function updateDateStatBadge(allList = currentPatientList) {
  const badgeEl = document.getElementById('date-stat-text');
  if (!badgeEl) return;

  const total = allList.length;
  const doneCount = allList.filter((p) => p.da_ket_luan).length;
  const waitingCount = total - doneCount;

  const todayStr = getTodayIso();
  const yestStr = getYesterdayIso();

  let label = 'Tất cả các ngày';
  if (currentDateFilter === todayStr) {
    label = `Hôm nay (${formatDateDisplay(todayStr)})`;
  } else if (currentDateFilter === yestStr) {
    label = `Hôm qua (${formatDateDisplay(yestStr)})`;
  } else if (currentDateFilter) {
    label = `Ngày ${formatDateDisplay(currentDateFilter)}`;
  }

  badgeEl.innerHTML = `<strong>${label}:</strong> ${total} lượt (${doneCount} Đã xong • ${waitingCount} Chờ)`;
}

// Chuyển nhanh tab lọc từ code hoặc click
function setFilter(filterName) {
  currentFilter = filterName;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    if (btn.getAttribute('data-filter') === filterName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  loadPatientList(false);
}

// Render thẻ bệnh nhân ở sidebar
function renderPatientList(doneCount = 0, waitingCount = 0) {
  const listContainer = document.getElementById('patient-list-container');
  if (!listContainer) return;

  const mobileQueueCount = document.getElementById('mobile-queue-count');
  if (mobileQueueCount) {
    mobileQueueCount.innerText = currentPatientList.length;
  }

  const currentRoom = window.RoomManager.getCurrentRoom();

  if (currentPatientList.length === 0) {
    if (currentFilter === 'waiting' && doneCount > 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 13px;">
          <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
          <div style="font-weight: 600; color: var(--text-main);">Đã khám hết!</div>
          <p style="margin-top: 4px; font-size: 12px;">Không còn bệnh nhân nào chờ khám.</p>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 12px; font-size: 12px;" onclick="window.App.setFilter('done')">
            👉 Xem ${doneCount} bệnh nhân Đã Khám
          </button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 13px;">
        Không tìm thấy bệnh nhân nào
      </div>
    `;
    return;
  }

  listContainer.innerHTML = currentPatientList.map((p) => {
    let isDone = false;
    if (currentRoom === 'the_luc') isDone = p.da_kham_the_luc;
    else if (currentRoom === 'mat') isDone = p.da_kham_mat;
    else if (currentRoom === 'tmh') isDone = p.da_kham_tmh;
    else if (currentRoom === 'rhm') isDone = p.da_kham_rhm;
    else if (currentRoom === 'noi') isDone = p.da_kham_noi;
    else if (currentRoom === 'ngoai') isDone = p.da_kham_ngoai;
    else if (currentRoom === 'da_lieu') isDone = p.da_kham_da_lieu;
    else if (currentRoom === 'san') isDone = p.da_kham_san;
    else if (currentRoom === 'cls') isDone = p.da_kham_cls;
    else if (currentRoom === 'ket_luan') isDone = p.da_ket_luan;

    const isSelected = p.id === selectedPatientId;
    const isDeleted = !!p.is_deleted;

    return `
      <div class="patient-card ${isSelected ? 'selected' : ''}" data-id="${p.id}" style="${isDeleted ? 'opacity: 0.85; border-color: #fca5a5;' : ''}">
        <div class="stt-badge" style="${isDeleted ? 'background: #ef4444; color: white;' : ''}">${p.stt || '#'}</div>
        <div class="patient-info">
          <div class="patient-name">${(p.ho_ten || '').toUpperCase()}${isDeleted ? ' <span style="color:#b91c1c; font-size:11px;">(ĐÃ XÓA)</span>' : ''}</div>
          <div class="patient-sub">
            <span>${p.ngay_sinh}</span>
            <span>•</span>
            <span>${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'}</span>
            ${p.cccd ? `<span>• CCCD: ${p.cccd}</span>` : ''}
          </div>
        </div>
        ${isDeleted ? `
          <div class="patient-status-badge" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 11px;">
            🗑️ Đã xóa
          </div>
        ` : (currentRoom !== 'tiep_don' ? `
          <div class="patient-status-badge ${isDone ? 'badge-done' : 'badge-waiting'}">
            ${isDone ? 'Đã khám' : 'Chờ khám'}
          </div>
        ` : '')}
      </div>
    `;
  }).join('');

  listContainer.querySelectorAll('.patient-card').forEach((card) => {
    card.addEventListener('click', () => {
      const pId = parseInt(card.getAttribute('data-id'));
      selectPatient(pId);
    });
  });
}

// Chuyển chế độ xem trên Mobile (Danh sách vs Hồ sơ khám)
function setMobileView(view) {
  const container = document.getElementById('app-container');
  const btnTabList = document.getElementById('btn-mobile-tab-list');
  const btnTabWorkspace = document.getElementById('btn-mobile-tab-workspace');
  if (!container) return;

  if (view === 'workspace') {
    container.classList.add('show-workspace');
    if (btnTabList) btnTabList.classList.remove('active');
    if (btnTabWorkspace) btnTabWorkspace.classList.add('active');
    const ws = document.getElementById('app-workspace');
    if (ws) ws.scrollTop = 0;
  } else {
    container.classList.remove('show-workspace');
    if (btnTabList) btnTabList.classList.add('active');
    if (btnTabWorkspace) btnTabWorkspace.classList.remove('active');
  }
}
window.setMobileView = setMobileView;

// Chọn một bệnh nhân và hiển thị form tương ứng
async function selectPatient(patientId) {
  selectedPatientId = patientId;
  renderPatientList();
  await loadPatientDetail(patientId);
  if (window.innerWidth <= 768) {
    setMobileView('workspace');
  }
}

// Tải chi tiết bệnh nhân
async function loadPatientDetail(patientId) {
  try {
    const res = await fetch(`/api/patients/${patientId}`);
    const data = await res.json();
    if (data.success) {
      selectedPatientData = data.data;
      updatePatientBanner(selectedPatientData.patient);
      renderWorkspaceContent();
    }
  } catch (err) {
    console.error('Lỗi tải chi tiết bệnh nhân:', err);
  }
}

// Cập nhật banner thông tin đầu trang
function updatePatientBanner(p) {
  const nameEl = document.getElementById('banner-patient-name');
  const metaEl = document.getElementById('banner-patient-meta');
  const btnDelete = document.getElementById('btn-delete-patient-nav');
  const btnRestore = document.getElementById('btn-restore-patient-nav');
  const btnPermDelete = document.getElementById('btn-permanent-delete-nav');
  const mobileTabPatientTitle = document.getElementById('mobile-tab-patient-title');

  if (!p) {
    if (nameEl) nameEl.innerText = 'Chưa chọn bệnh nhân';
    if (metaEl) metaEl.innerHTML = '';
    if (btnDelete) btnDelete.style.display = 'none';
    if (btnRestore) btnRestore.style.display = 'none';
    if (btnPermDelete) btnPermDelete.style.display = 'none';
    if (mobileTabPatientTitle) mobileTabPatientTitle.innerText = 'Khám Bệnh';
    return;
  }

  const isDeleted = !!p.is_deleted;

  if (isDeleted) {
    if (btnDelete) btnDelete.style.display = 'none';
    if (btnRestore) btnRestore.style.display = 'inline-flex';
    if (btnPermDelete) btnPermDelete.style.display = 'inline-flex';
  } else {
    if (btnDelete) btnDelete.style.display = 'inline-flex';
    if (btnRestore) btnRestore.style.display = 'none';
    if (btnPermDelete) btnPermDelete.style.display = 'none';
  }

  if (nameEl) {
    nameEl.innerHTML = `${p.stt ? '#' + p.stt + ' - ' : ''}${(p.ho_ten || '').toUpperCase()}${isDeleted ? ' <span style="background: #fee2e2; color: #b91c1c; font-size: 12px; padding: 2px 8px; border-radius: 4px; vertical-align: middle;">⚠️ ĐANG TRONG THÙNG RÁC</span>' : ''}`;
  }
  if (mobileTabPatientTitle) {
    mobileTabPatientTitle.innerText = `${p.stt ? '#' + p.stt + ' ' : ''}${(p.ho_ten || '').toUpperCase()}`;
  }
  if (metaEl) {
    metaEl.innerHTML = `
      <span>🎂 ${p.ngay_sinh} (${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'})</span>
      ${p.cccd ? `<span>🆔 CCCD: ${p.cccd}</span>` : ''}
      ${p.sdt ? `<span>📞 ${p.sdt}</span>` : ''}
      ${p.noi_cong_tac ? `<span>🏢 ${p.noi_cong_tac}</span>` : ''}
      ${p.dot_kham ? `<span>📂 ${p.dot_kham}</span>` : ''}
      ${isDeleted && p.deleted_at ? `<span style="color: #b91c1c; font-weight: 600;">🗑️ Đã xóa: ${p.deleted_at}</span>` : ''}
    `;
  }
}

// Render nội dung chính theo phòng làm việc
function renderWorkspaceContent() {
  const container = document.getElementById('workspace-content');
  if (!container) return;

  const currentRoom = window.RoomManager.getCurrentRoom();

  if (currentRoom === 'tiep_don') {
    window.ReceptionModule.renderReceptionView(container, selectedPatientData);
  } else if (currentRoom === 'ket_luan') {
    window.ConclusionModule.renderConclusionView(container, selectedPatientData);
  } else {
    window.ClinicExamModule.renderClinicExamView(container, selectedPatientData, currentRoom);
  }

  if (window.initDateInputs) {
    window.initDateInputs(container);
  }
}

// Xóa lựa chọn bệnh nhân (chuyển sang tạo mới tại Tiếp đón)
function clearSelectedPatient() {
  selectedPatientId = null;
  selectedPatientData = null;
  updatePatientBanner(null);
  renderPatientList();
  renderWorkspaceContent();
}

// Tự động chuyển ca tiếp theo sau khi lưu (Chỉ chuyển tới bệnh nhân CHƯA KHÁM phòng này)
async function selectNextPatient() {
  const currentRoom = window.RoomManager.getCurrentRoom();
  if (currentRoom === 'tiep_don') return;

  // Cập nhật lại danh sách bệnh nhân để lấy trạng thái mới nhất vừa lưu
  await loadPatientList(false);

  const allList = lastFetchedAllPatients.length > 0 ? lastFetchedAllPatients : currentPatientList;
  if (!allList || allList.length === 0) return;

  const currentIndex = allList.findIndex((p) => p.id === selectedPatientId);

  // 1. Tìm bệnh nhân tiếp theo phía sau người hiện tại mà CHƯA khám phòng này
  let nextPatient = allList.slice(currentIndex + 1).find((p) => !isPatientDoneForRoom(p, currentRoom));

  // 2. Nếu từ người hiện tại về cuối danh sách không còn ai, tìm vòng lại từ đầu danh sách
  if (!nextPatient && currentIndex > 0) {
    nextPatient = allList.slice(0, currentIndex).find((p) => !isPatientDoneForRoom(p, currentRoom));
  }

  if (nextPatient) {
    await selectPatient(nextPatient.id);
  } else {
    // Không còn bệnh nhân nào đang chờ khám ở phòng này
    window.showToast('🎉 Đã hoàn thành khám cho tất cả bệnh nhân trong phòng này!', 'info');
  }
}

// Thiết lập các sự kiện giao diện
function setupEventListeners() {
  // Tìm kiếm tức thì khi gõ
  const searchInput = document.getElementById('search-patient-input');
  if (searchInput) {
    let debounce = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        currentSearchQuery = e.target.value.trim();
        loadPatientList(false);
      }, 250);
    });
  }

  // Chuyển tab lọc (Chờ khám / Đã khám / Tất cả)
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      loadPatientList(false);
    });
  });

  // Chọn đợt khám từ dropdown
  const selectDotKham = document.getElementById('select-dot-kham');
  if (selectDotKham) {
    selectDotKham.addEventListener('change', (e) => {
      currentDotKham = e.target.value;
      loadPatientList(true);
    });
  }

  // Nút mở modal đổi phòng khám
  const btnSwitchRoom = document.getElementById('btn-switch-room');
  const modalRoom = document.getElementById('modal-switch-room');
  const btnCloseRoomModal = document.getElementById('btn-close-room-modal');

  if (btnSwitchRoom && modalRoom) {
    btnSwitchRoom.onclick = () => {
      window.RoomManager.renderRoomGrid('room-selection-grid', async (roomId) => {
        modalRoom.classList.add('hidden');
        await loadPatientList(false);
        if (selectedPatientId) {
          await loadPatientDetail(selectedPatientId);
        } else if (currentPatientList.length > 0) {
          await selectPatient(currentPatientList[0].id);
        } else {
          renderWorkspaceContent();
        }
      });
      modalRoom.classList.remove('hidden');
    };
  }
  if (btnCloseRoomModal && modalRoom) {
    btnCloseRoomModal.onclick = () => modalRoom.classList.add('hidden');
  }

  // Nút Xuất Excel 108 cột chuẩn
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.onclick = async () => {
      let exportUrl = '/api/excel/export?';
      const qParams = [];
      if (currentDotKham) {
        qParams.push(`dot_kham=${encodeURIComponent(currentDotKham)}`);
      }
      if (currentDateFilter) {
        qParams.push(`date=${encodeURIComponent(currentDateFilter)}`);
      }
      exportUrl += qParams.join('&');

      const originalHtml = btnExportExcel.innerHTML;
      btnExportExcel.disabled = true;
      btnExportExcel.innerText = '⏳ Đang tạo Excel...';
      window.showToast('Đang tạo file Excel 108 cột chuẩn...', 'info');

      try {
        const response = await fetch(exportUrl);
        if (!response.ok) {
          throw new Error('Lỗi máy chủ (' + response.status + ')');
        }

        let filename = 'Ket_qua_KSK_Tong_hop.xlsx';
        const disposition = response.headers.get('Content-Disposition');
        if (disposition && disposition.includes('filename=')) {
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
          }
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

        window.showToast('Đã tải xuống file Excel thành công!', 'success');
      } catch (err) {
        console.error('Lỗi tải file Excel:', err);
        window.showToast('Lỗi tải file: ' + err.message, 'error');
      } finally {
        btnExportExcel.disabled = false;
        btnExportExcel.innerHTML = originalHtml;
      }
    };
  }

  // Bộ lọc theo ngày
  const filterDateInput = document.getElementById('filter-date-input');
  const btnDateToday = document.getElementById('btn-date-today');
  const btnDateYesterday = document.getElementById('btn-date-yesterday');
  const btnDateAll = document.getElementById('btn-date-all');

  if (filterDateInput) {
    filterDateInput.addEventListener('change', (e) => {
      currentDateFilter = e.target.value;
      loadPatientList(true);
    });
  }

  if (btnDateToday) {
    btnDateToday.onclick = () => {
      currentDateFilter = getTodayIso();
      if (filterDateInput) filterDateInput.value = currentDateFilter;
      loadPatientList(true);
    };
  }

  if (btnDateYesterday) {
    btnDateYesterday.onclick = () => {
      currentDateFilter = getYesterdayIso();
      if (filterDateInput) filterDateInput.value = currentDateFilter;
      loadPatientList(true);
    };
  }

  if (btnDateAll) {
    btnDateAll.onclick = () => {
      currentDateFilter = '';
      if (filterDateInput) filterDateInput.value = '';
      loadPatientList(true);
    };
  }

  // Nút Thêm mới bệnh nhân nhanh tại Tiếp đón
  const btnNewPatient = document.getElementById('btn-new-patient-nav');
  if (btnNewPatient) {
    btnNewPatient.onclick = () => {
      window.RoomManager.setCurrentRoom('tiep_don');
      clearSelectedPatient();
      if (window.innerWidth <= 768) {
        setMobileView('workspace');
        const mobileTabPatientTitle = document.getElementById('mobile-tab-patient-title');
        if (mobileTabPatientTitle) {
          mobileTabPatientTitle.innerText = 'Tiếp Đón Mới';
        }
      }
    };
  }

  // -------------------------------------------------------------
  // Xử lý Xóa vào Thùng rác, Khôi phục & Xóa vĩnh viễn (Admin PIN)
  // -------------------------------------------------------------
  // 1. Xóa tạm thời vào Thùng rác
  const btnDeletePatient = document.getElementById('btn-delete-patient-nav');
  const modalDelete = document.getElementById('modal-delete-patient');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const inputAdminPin = document.getElementById('input-admin-pin');
  const patientInfoText = document.getElementById('delete-modal-patient-info');

  if (btnDeletePatient && modalDelete) {
    btnDeletePatient.onclick = () => {
      if (!selectedPatientData || !selectedPatientData.patient) {
        window.showToast('Vui lòng chọn bệnh nhân cần xóa', 'warning');
        return;
      }
      const p = selectedPatientData.patient;
      if (patientInfoText) {
        patientInfoText.innerText = `${p.stt ? '#' + p.stt + ' - ' : ''}${(p.ho_ten || '').toUpperCase()} (${p.ngay_sinh}, ${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'})${p.cccd ? ' - CCCD: ' + p.cccd : ''}`;
      }
      if (inputAdminPin) inputAdminPin.value = '';
      modalDelete.classList.remove('hidden');
      setTimeout(() => inputAdminPin?.focus(), 100);
    };
  }

  const closeDeleteModal = () => {
    if (modalDelete) modalDelete.classList.add('hidden');
    if (inputAdminPin) inputAdminPin.value = '';
  };

  if (btnCloseDeleteModal) btnCloseDeleteModal.onclick = closeDeleteModal;
  if (btnCancelDelete) btnCancelDelete.onclick = closeDeleteModal;

  if (btnConfirmDelete) {
    btnConfirmDelete.onclick = async () => {
      const pin = inputAdminPin ? inputAdminPin.value.trim() : '';
      if (!pin) {
        window.showToast('Vui lòng nhập mật khẩu Quản trị viên', 'error');
        inputAdminPin?.focus();
        return;
      }
      if (!selectedPatientId) return;

      btnConfirmDelete.disabled = true;
      btnConfirmDelete.innerText = 'Đang chuyển...';

      try {
        const res = await fetch(`/api/patients/${selectedPatientId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': encodeURIComponent(pin)
          },
          body: JSON.stringify({ adminPin: pin })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.showToast(data.message || 'Đã chuyển vào Thùng rác thành công!', 'success');
          closeDeleteModal();
          clearSelectedPatient();
          await loadPatientList(false);
          updateTrashCount();
        } else {
          window.showToast(data.message || 'Mật khẩu quản trị không chính xác!', 'error');
          inputAdminPin?.focus();
        }
      } catch (err) {
        window.showToast('Lỗi kết nối khi xóa: ' + err.message, 'error');
      } finally {
        btnConfirmDelete.disabled = false;
        btnConfirmDelete.innerText = '🗑️ Chuyển Vào Thùng Rác';
      }
    };

    if (inputAdminPin) {
      inputAdminPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnConfirmDelete.click();
        }
      });
    }
  }

  // 2. Khôi phục bệnh nhân từ Thùng rác
  const btnRestorePatient = document.getElementById('btn-restore-patient-nav');
  const modalRestore = document.getElementById('modal-restore-patient');
  const btnCloseRestoreModal = document.getElementById('btn-close-restore-modal');
  const btnCancelRestore = document.getElementById('btn-cancel-restore');
  const btnConfirmRestore = document.getElementById('btn-confirm-restore');
  const inputRestorePin = document.getElementById('input-restore-pin');
  const restorePatientInfoText = document.getElementById('restore-modal-patient-info');

  if (btnRestorePatient && modalRestore) {
    btnRestorePatient.onclick = () => {
      if (!selectedPatientData || !selectedPatientData.patient) {
        window.showToast('Vui lòng chọn bệnh nhân cần khôi phục', 'warning');
        return;
      }
      const p = selectedPatientData.patient;
      if (restorePatientInfoText) {
        restorePatientInfoText.innerText = `${p.stt ? '#' + p.stt + ' - ' : ''}${(p.ho_ten || '').toUpperCase()} (${p.ngay_sinh}, ${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'})`;
      }
      if (inputRestorePin) inputRestorePin.value = '';
      modalRestore.classList.remove('hidden');
      setTimeout(() => inputRestorePin?.focus(), 100);
    };
  }

  const closeRestoreModal = () => {
    if (modalRestore) modalRestore.classList.add('hidden');
    if (inputRestorePin) inputRestorePin.value = '';
  };

  if (btnCloseRestoreModal) btnCloseRestoreModal.onclick = closeRestoreModal;
  if (btnCancelRestore) btnCancelRestore.onclick = closeRestoreModal;

  if (btnConfirmRestore) {
    btnConfirmRestore.onclick = async () => {
      const pin = inputRestorePin ? inputRestorePin.value.trim() : '';
      if (!pin) {
        window.showToast('Vui lòng nhập mật khẩu Quản trị viên', 'error');
        inputRestorePin?.focus();
        return;
      }
      if (!selectedPatientId) return;

      btnConfirmRestore.disabled = true;
      btnConfirmRestore.innerText = 'Đang khôi phục...';

      try {
        const res = await fetch(`/api/patients/${selectedPatientId}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': encodeURIComponent(pin)
          },
          body: JSON.stringify({ adminPin: pin })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.showToast(data.message || 'Đã khôi phục bệnh nhân thành công!', 'success');
          closeRestoreModal();
          await loadPatientDetail(selectedPatientId);
          await loadPatientList(false);
          updateTrashCount();
        } else {
          window.showToast(data.message || 'Mật khẩu quản trị không chính xác!', 'error');
          inputRestorePin?.focus();
        }
      } catch (err) {
        window.showToast('Lỗi kết nối khi khôi phục: ' + err.message, 'error');
      } finally {
        btnConfirmRestore.disabled = false;
        btnConfirmRestore.innerText = '🔄 Khôi Phục Ngay';
      }
    };

    if (inputRestorePin) {
      inputRestorePin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnConfirmRestore.click();
        }
      });
    }
  }

  // 3. Xóa vĩnh viễn khỏi CSDL
  const btnPermDelete = document.getElementById('btn-permanent-delete-nav');
  const modalPermDelete = document.getElementById('modal-permanent-delete-patient');
  const btnClosePermDeleteModal = document.getElementById('btn-close-perm-delete-modal');
  const btnCancelPermDelete = document.getElementById('btn-cancel-perm-delete');
  const btnConfirmPermDelete = document.getElementById('btn-confirm-perm-delete');
  const inputPermanentPin = document.getElementById('input-permanent-pin');
  const permPatientInfoText = document.getElementById('perm-delete-modal-patient-info');

  if (btnPermDelete && modalPermDelete) {
    btnPermDelete.onclick = () => {
      if (!selectedPatientData || !selectedPatientData.patient) {
        window.showToast('Vui lòng chọn bệnh nhân cần xóa vĩnh viễn', 'warning');
        return;
      }
      const p = selectedPatientData.patient;
      if (permPatientInfoText) {
        permPatientInfoText.innerText = `${p.stt ? '#' + p.stt + ' - ' : ''}${(p.ho_ten || '').toUpperCase()} (${p.ngay_sinh}, ${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'})${p.cccd ? ' - CCCD: ' + p.cccd : ''}`;
      }
      if (inputPermanentPin) inputPermanentPin.value = '';
      modalPermDelete.classList.remove('hidden');
      setTimeout(() => inputPermanentPin?.focus(), 100);
    };
  }

  const closePermDeleteModal = () => {
    if (modalPermDelete) modalPermDelete.classList.add('hidden');
    if (inputPermanentPin) inputPermanentPin.value = '';
  };

  if (btnClosePermDeleteModal) btnClosePermDeleteModal.onclick = closePermDeleteModal;
  if (btnCancelPermDelete) btnCancelPermDelete.onclick = closePermDeleteModal;

  if (btnConfirmPermDelete) {
    btnConfirmPermDelete.onclick = async () => {
      const pin = inputPermanentPin ? inputPermanentPin.value.trim() : '';
      if (!pin) {
        window.showToast('Vui lòng nhập mật khẩu Quản trị viên', 'error');
        inputPermanentPin?.focus();
        return;
      }
      if (!selectedPatientId) return;

      btnConfirmPermDelete.disabled = true;
      btnConfirmPermDelete.innerText = 'Đang xóa vĩnh viễn...';

      try {
        const res = await fetch(`/api/patients/${selectedPatientId}?permanent=true`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': encodeURIComponent(pin)
          },
          body: JSON.stringify({ adminPin: pin, permanent: true })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          window.showToast(data.message || 'Đã xóa vĩnh viễn bệnh nhân thành công!', 'success');
          closePermDeleteModal();
          clearSelectedPatient();
          await loadPatientList(false);
          updateTrashCount();
        } else {
          window.showToast(data.message || 'Mật khẩu quản trị không chính xác!', 'error');
          inputPermanentPin?.focus();
        }
      } catch (err) {
        window.showToast('Lỗi kết nối khi xóa vĩnh viễn: ' + err.message, 'error');
      } finally {
        btnConfirmPermDelete.disabled = false;
        btnConfirmPermDelete.innerText = '💥 Xóa Vĩnh Viễn';
      }
    };

    if (inputPermanentPin) {
      inputPermanentPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          btnConfirmPermDelete.click();
        }
      });
    }
  }

  // -------------------------------------------------------------
  // Xử lý các tương tác Responsive trên Mobile & Tablet (iPad/iPhone)
  // -------------------------------------------------------------
  const btnMobileTabList = document.getElementById('btn-mobile-tab-list');
  const btnMobileTabWorkspace = document.getElementById('btn-mobile-tab-workspace');
  const btnBackToList = document.getElementById('btn-back-to-list');

  if (btnMobileTabList) {
    btnMobileTabList.onclick = () => setMobileView('list');
  }
  if (btnMobileTabWorkspace) {
    btnMobileTabWorkspace.onclick = () => setMobileView('workspace');
  }
  if (btnBackToList) {
    btnBackToList.onclick = () => setMobileView('list');
  }

  // Nút menu phụ trên Navbar Mobile (Đợt khám, Xuất Excel, Status)
  const btnToggleMenu = document.getElementById('btn-toggle-menu');
  const navActionsMenu = document.getElementById('nav-actions-menu');
  if (btnToggleMenu && navActionsMenu) {
    btnToggleMenu.onclick = (e) => {
      e.stopPropagation();
      navActionsMenu.classList.toggle('mobile-open');
    };
    document.addEventListener('click', (e) => {
      if (!navActionsMenu.contains(e.target) && e.target !== btnToggleMenu) {
        navActionsMenu.classList.remove('mobile-open');
      }
    });
  }

  // Nút thu gọn / mở rộng Sidebar trên iPad / Tablet / PC
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnExpandSidebar = document.getElementById('btn-expand-sidebar-floating');
  const appSidebar = document.getElementById('app-sidebar');

  if (btnToggleSidebar && appSidebar) {
    btnToggleSidebar.onclick = () => {
      appSidebar.classList.add('collapsed');
    };
  }
  if (btnExpandSidebar && appSidebar) {
    btnExpandSidebar.onclick = () => {
      appSidebar.classList.remove('collapsed');
    };
  }
}

// Làm mới thông tin bệnh nhân đang chọn
async function refreshCurrentPatient() {
  if (selectedPatientId) {
    await loadPatientDetail(selectedPatientId);
  }
}

// Chuyển nhanh sang một phòng khám
function switchRoom(roomId) {
  window.RoomManager.setCurrentRoom(roomId);
  renderWorkspaceContent();
}

window.App = {
  initApp,
  loadPatientList,
  selectPatient,
  selectNextPatient,
  clearSelectedPatient,
  refreshCurrentPatient,
  switchRoom,
  setFilter
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
