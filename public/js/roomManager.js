const ROOMS = [
  { id: 'tiep_don', name: 'Tiếp Đón & Hành Chính', icon: '🏢', desc: 'Đăng ký bệnh nhân, nạp file Excel đoàn KSK' },
  { id: 'the_luc', name: 'Khám Thể Lực', icon: '⚖️', desc: 'Đo chiều cao, cân nặng, huyết áp, mạch, vòng ngực' },
  { id: 'noi', name: 'Khám Nội Khoa', icon: '🩺', desc: 'Tuần hoàn, hô hấp, tiêu hóa, thận tiết niệu, thần kinh...' },
  { id: 'ngoai', name: 'Khám Ngoại Khoa', icon: '🩹', desc: 'Khám cơ xương, vết mổ, trĩ, thoát vị...' },
  { id: 'mat', name: 'Khám Mắt', icon: '👁️', desc: 'Đo thị lực có/không kính, đáy mắt, tật khúc xạ' },
  { id: 'tmh', name: 'Khám Tai Mũi Họng', icon: '👂', desc: 'Thính lực nói thường, nói thầm, mũi họng' },
  { id: 'rhm', name: 'Khám Răng Hàm Mặt', icon: '🦷', desc: 'Khám hàm trên, hàm dưới, sâu răng, nha chu' },
  { id: 'da_lieu', name: 'Khám Da Liễu', icon: '🧴', desc: 'Khám dị ứng, nấm da, bệnh da liễu khác' },
  { id: 'san', name: 'Khám Sản Phụ Khoa', icon: '🌸', desc: 'Khám phụ khoa định kỳ dành riêng cho Nữ' },
  { id: 'cls', name: 'Cận Lâm Sàng', icon: '🧪', desc: 'Xét nghiệm máu, nước tiểu, X-quang, Siêu âm, Điện tim' },
  { id: 'ket_luan', name: 'Kết Luận & Xuất Báo Cáo', icon: '📋', desc: 'Tổng kết sức khỏe, mã ICD-10 và xuất Excel 108 cột' }
];

function getCurrentRoom() {
  const saved = localStorage.getItem('ksk_current_room');
  if (saved && ROOMS.some((r) => r.id === saved)) {
    return saved;
  }
  return 'tiep_don';
}

function setCurrentRoom(roomId) {
  localStorage.setItem('ksk_current_room', roomId);
  updateNavbarRoomDisplay();
}

function getRoomInfo(roomId) {
  return ROOMS.find((r) => r.id === roomId) || ROOMS[0];
}

function updateNavbarRoomDisplay() {
  const current = getRoomInfo(getCurrentRoom());
  const tag = document.getElementById('current-room-badge');
  if (tag) {
    tag.innerHTML = `<span>${current.icon}</span> <span>${current.name}</span>`;
  }
}

function renderRoomGrid(containerId, onSelect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentId = getCurrentRoom();
  container.innerHTML = ROOMS.map((r) => `
    <div class="room-card ${r.id === currentId ? 'active' : ''}" data-room="${r.id}">
      <div class="room-icon">${r.icon}</div>
      <div class="room-name">${r.name}</div>
      <div class="room-desc">${r.desc}</div>
    </div>
  `).join('');

  container.querySelectorAll('.room-card').forEach((card) => {
    card.addEventListener('click', () => {
      const roomId = card.getAttribute('data-room');
      setCurrentRoom(roomId);
      if (onSelect) onSelect(roomId);
    });
  });
}

function getSavedDoctor(roomId) {
  return localStorage.getItem(`ksk_doctor_${roomId}`) || '';
}

function saveDoctor(roomId, doctorName) {
  if (doctorName) {
    localStorage.setItem(`ksk_doctor_${roomId}`, doctorName.trim());
  }
}

window.RoomManager = {
  ROOMS,
  getCurrentRoom,
  setCurrentRoom,
  getRoomInfo,
  updateNavbarRoomDisplay,
  renderRoomGrid,
  getSavedDoctor,
  saveDoctor
};
