function renderReceptionView(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>🏢 Tiếp Đón & Đăng Ký Hồ Sơ Khám Sức Khỏe Mới</span>
        <button class="btn btn-secondary btn-sm" id="btn-open-import-modal">
          📥 Nạp Danh Sách Đoàn KSK từ Excel
        </button>
      </div>

      <form id="form-reception">
        <div class="form-grid-3">
          <div class="form-group">
            <label>Họ và tên <span class="req">*</span></label>
            <input type="text" id="rec-ho_ten" class="form-control" placeholder="Nhập đầy đủ họ và tên" required autofocus>
          </div>
          <div class="form-group">
            <label>Ngày sinh (DD/MM/YYYY) <span class="req">*</span></label>
            <input type="text" id="rec-ngay_sinh" class="form-control" placeholder="Ví dụ: 15/05/1990" required>
          </div>
          <div class="form-group">
            <label>Giới tính <span class="req">*</span></label>
            <select id="rec-gioi_tinh" class="form-control" required>
              <option value="1">1 - Nam</option>
              <option value="2">2 - Nữ</option>
            </select>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Số CCCD / Định danh</label>
            <input type="text" id="rec-cccd" class="form-control" placeholder="12 chữ số CCCD">
          </div>
          <div class="form-group">
            <label>Ngày cấp CCCD</label>
            <input type="text" id="rec-ngay_cap_cccd" class="form-control" placeholder="DD/MM/YYYY">
          </div>
          <div class="form-group">
            <label>Nơi cấp CCCD</label>
            <input type="text" id="rec-noi_cap_cccd" class="form-control" placeholder="Cục CS QLHC về TTXH">
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Số điện thoại</label>
            <input type="text" id="rec-sdt" class="form-control" placeholder="Số điện thoại liên lạc">
          </div>
          <div class="form-group">
            <label>Mã số thẻ BHYT</label>
            <input type="text" id="rec-so_the_bhyt" class="form-control" placeholder="15 ký tự thẻ BHYT">
          </div>
          <div class="form-group">
            <label>Đối tượng KSK</label>
            <select id="rec-doi_tuong_ksk" class="form-control">
              <option value="64">64 - KSK định kỳ cho người lao động</option>
              <option value="58">58 - KSK cho đối tượng chính sách</option>
              <option value="59">59 - KSK an toàn thực phẩm</option>
              <option value="60">60 - KSK khi đi làm việc ở nước ngoài</option>
              <option value="61">61 - Khám giám định y khoa</option>
            </select>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Tỉnh/Thành phố nơi ở</label>
            <input type="text" id="rec-tinh_tp" class="form-control" placeholder="Ví dụ: TP. Hồ Chí Minh">
          </div>
          <div class="form-group">
            <label>Xã/Phường nơi ở</label>
            <input type="text" id="rec-xa_phuong" class="form-control" placeholder="Ví dụ: Phường Bến Nghé">
          </div>
          <div class="form-group">
            <label>Nghề nghiệp</label>
            <input type="text" id="rec-nghe_nghiep" class="form-control" placeholder="Ví dụ: Công nhân, Kế toán...">
          </div>
        </div>

        <div class="form-grid-2" style="margin-top: 14px;">
          <div class="form-group">
            <label>Nơi làm việc, công tác</label>
            <input type="text" id="rec-noi_cong_tac" class="form-control" placeholder="Tên công ty hoặc trường học">
          </div>
          <div class="form-group">
            <label>Đợt khám / Tên đoàn KSK</label>
            <input type="text" id="rec-dot_kham" class="form-control" placeholder="Ví dụ: Đoàn KSK Công ty May 10">
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          <button type="reset" class="btn btn-secondary">Làm Lại</button>
          <button type="submit" class="btn btn-primary" id="btn-save-patient">
            💾 Đăng Ký & Tạo Hồ Sơ Tiếp Đón (Enter)
          </button>
        </div>
      </form>
    </div>

    <!-- MODAL IMPORT EXCEL -->
    <div id="modal-import-excel" class="modal-overlay hidden">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>📥 Nạp Danh Sách Đoàn KSK từ Excel</h3>
          <button class="modal-close" id="btn-close-import">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 14px;">
            <label>Tên Đợt Khám / Đoàn KSK</label>
            <input type="text" id="import-dot_kham" class="form-control" placeholder="Ví dụ: KSK Công ty CP Xây Dựng 2026">
          </div>
          <div class="form-group">
            <label>Chọn file Excel (.xlsx, .xls)</label>
            <input type="file" id="import-excel-file" class="form-control" accept=".xlsx, .xls">
            <p style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">
              Hệ thống sẽ tự nhận diện các cột Họ tên, Ngày sinh, Giới tính, CCCD, SĐT... từ file.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-import">Hủy</button>
          <button class="btn btn-primary" id="btn-submit-import">Bắt Đầu Nạp Dữ Liệu</button>
        </div>
      </div>
    </div>
  `;

  // Gắn sự kiện submit form
  const form = document.getElementById('form-reception');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      ho_ten: document.getElementById('rec-ho_ten').value,
      ngay_sinh: document.getElementById('rec-ngay_sinh').value,
      gioi_tinh: document.getElementById('rec-gioi_tinh').value,
      cccd: document.getElementById('rec-cccd').value,
      ngay_cap_cccd: document.getElementById('rec-ngay_cap_cccd').value,
      noi_cap_cccd: document.getElementById('rec-noi_cap_cccd').value,
      sdt: document.getElementById('rec-sdt').value,
      so_the_bhyt: document.getElementById('rec-so_the_bhyt').value,
      doi_tuong_ksk: document.getElementById('rec-doi_tuong_ksk').value,
      tinh_tp: document.getElementById('rec-tinh_tp').value,
      xa_phuong: document.getElementById('rec-xa_phuong').value,
      nghe_nghiep: document.getElementById('rec-nghe_nghiep').value,
      noi_cong_tac: document.getElementById('rec-noi_cong_tac').value,
      dot_kham: document.getElementById('rec-dot_kham').value || 'Đoàn KSK ' + new Date().toLocaleDateString('vi-VN')
    };

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        window.showToast('Đã tiếp nhận bệnh nhân: ' + payload.ho_ten, 'success');
        form.reset();
        document.getElementById('rec-dot_kham').value = payload.dot_kham;
        document.getElementById('rec-ho_ten').focus();
        if (window.App && window.App.loadPatientList) {
          window.App.loadPatientList();
        }
      } else {
        window.showToast(data.message || 'Lỗi lưu thông tin', 'error');
      }
    } catch (err) {
      window.showToast('Lỗi mạng: ' + err.message, 'error');
    }
  });

  // Modal import Excel
  const modal = document.getElementById('modal-import-excel');
  const btnOpen = document.getElementById('btn-open-import-modal');
  const btnClose = document.getElementById('btn-close-import');
  const btnCancel = document.getElementById('btn-cancel-import');
  const btnSubmit = document.getElementById('btn-submit-import');

  btnOpen.onclick = () => modal.classList.remove('hidden');
  btnClose.onclick = () => modal.classList.add('hidden');
  btnCancel.onclick = () => modal.classList.add('hidden');

  btnSubmit.onclick = async () => {
    const fileInput = document.getElementById('import-excel-file');
    const dotKhamInput = document.getElementById('import-dot_kham');
    if (!fileInput.files || fileInput.files.length === 0) {
      return alert('Vui lòng chọn 1 file Excel');
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('dot_kham', dotKhamInput.value || 'Đoàn KSK ' + new Date().toLocaleDateString('vi-VN'));

    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Đang xử lý...';

    try {
      const res = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        window.showToast(data.message, 'success');
        modal.classList.add('hidden');
        fileInput.value = '';
        if (window.App && window.App.loadPatientList) {
          window.App.loadPatientList();
        }
      } else {
        window.showToast(data.message || 'Lỗi nạp Excel', 'error');
      }
    } catch (err) {
      window.showToast('Lỗi: ' + err.message, 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = 'Bắt Đầu Nạp Dữ Liệu';
    }
  };
}

window.ReceptionModule = {
  renderReceptionView
};
