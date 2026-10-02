let currentPatientList = [];
let selectedPatientId = null;
let selectedPatientData = null;
let currentFilter = 'waiting'; // 'waiting', 'done', 'all'
let currentSearchQuery = '';
let currentDotKham = '';

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
      const incomingId = event.data?.patientId ?? event.data?.id;
      if (selectedPatientId && incomingId && String(incomingId) === String(selectedPatientId)) {
        loadPatientDetail(selectedPatientId);
      }
    }
  });

  // Tải danh sách đợt khám
  await loadDotKhamList();

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

// Tải danh sách bệnh nhân bên sidebar
async function loadPatientList(autoSelectFirst = false) {
  const currentRoom = window.RoomManager.getCurrentRoom();
  let url = `/api/patients?room=${currentRoom}`;
  if (currentFilter !== 'all') {
    url += `&status=${currentFilter}`;
  }
  if (currentSearchQuery) {
    url += `&q=${encodeURIComponent(currentSearchQuery)}`;
  }
  if (currentDotKham) {
    url += `&dot_kham=${encodeURIComponent(currentDotKham)}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      currentPatientList = data.data;
      renderPatientList();

      if (autoSelectFirst && currentPatientList.length > 0 && !selectedPatientId) {
        selectPatient(currentPatientList[0].id);
      }
    }
  } catch (err) {
    console.error('Lỗi tải danh sách bệnh nhân:', err);
  }
}

// Render thẻ bệnh nhân ở sidebar
function renderPatientList() {
  const listContainer = document.getElementById('patient-list-container');
  if (!listContainer) return;

  const currentRoom = window.RoomManager.getCurrentRoom();

  if (currentPatientList.length === 0) {
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

    return `
      <div class="patient-card ${isSelected ? 'selected' : ''}" data-id="${p.id}">
        <div class="stt-badge">${p.stt || '#'}</div>
        <div class="patient-info">
          <div class="patient-name">${p.ho_ten}</div>
          <div class="patient-sub">
            <span>${p.ngay_sinh}</span>
            <span>•</span>
            <span>${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'}</span>
            ${p.cccd ? `<span>• CCCD: ${p.cccd}</span>` : ''}
          </div>
        </div>
        ${currentRoom !== 'tiep_don' ? `
          <div class="patient-status-badge ${isDone ? 'badge-done' : 'badge-waiting'}">
            ${isDone ? 'Đã khám' : 'Chờ khám'}
          </div>
        ` : ''}
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

// Chọn một bệnh nhân và hiển thị form tương ứng
async function selectPatient(patientId) {
  selectedPatientId = patientId;
  renderPatientList();
  await loadPatientDetail(patientId);
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
  if (!p) {
    if (nameEl) nameEl.innerText = 'Chưa chọn bệnh nhân';
    if (metaEl) metaEl.innerHTML = '';
    return;
  }

  if (nameEl) nameEl.innerText = `${p.stt ? '#' + p.stt + ' - ' : ''}${p.ho_ten}`;
  if (metaEl) {
    metaEl.innerHTML = `
      <span>🎂 ${p.ngay_sinh} (${p.gioi_tinh === 1 ? 'Nam' : 'Nữ'})</span>
      ${p.cccd ? `<span>🆔 CCCD: ${p.cccd}</span>` : ''}
      ${p.sdt ? `<span>📞 ${p.sdt}</span>` : ''}
      ${p.noi_cong_tac ? `<span>🏢 ${p.noi_cong_tac}</span>` : ''}
      ${p.dot_kham ? `<span>📂 ${p.dot_kham}</span>` : ''}
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
}

// Xóa lựa chọn bệnh nhân (chuyển sang tạo mới tại Tiếp đón)
function clearSelectedPatient() {
  selectedPatientId = null;
  selectedPatientData = null;
  updatePatientBanner(null);
  renderPatientList();
  renderWorkspaceContent();
}

// Tự động chuyển ca tiếp theo sau khi lưu
function selectNextPatient() {
  if (!currentPatientList || currentPatientList.length === 0) return;
  const currentIndex = currentPatientList.findIndex((p) => p.id === selectedPatientId);
  if (currentIndex >= 0 && currentIndex + 1 < currentPatientList.length) {
    selectPatient(currentPatientList[currentIndex + 1].id);
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
    btnExportExcel.onclick = () => {
      let exportUrl = '/api/excel/export';
      if (currentDotKham) {
        exportUrl += `?dot_kham=${encodeURIComponent(currentDotKham)}`;
      }
      window.showToast('Đang tạo file Excel 108 cột, vui lòng chờ trong giây lát...', 'info');
      window.location.href = exportUrl;
    };
  }

  // Nút Thêm mới bệnh nhân nhanh tại Tiếp đón
  const btnNewPatient = document.getElementById('btn-new-patient-nav');
  if (btnNewPatient) {
    btnNewPatient.onclick = () => {
      window.RoomManager.setCurrentRoom('tiep_don');
      clearSelectedPatient();
    };
  }
}

// Làm mới thông tin bệnh nhân đang chọn
async function refreshCurrentPatient() {
  if (selectedPatientId) {
    await loadPatientDetail(selectedPatientId);
  }
}

window.App = {
  initApp,
  loadPatientList,
  selectPatient,
  selectNextPatient,
  clearSelectedPatient,
  refreshCurrentPatient
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
