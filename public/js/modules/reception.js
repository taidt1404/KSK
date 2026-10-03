function renderReceptionView(container, patientData) {
  const isEditing = !!(patientData && patientData.patient);
  const p = isEditing ? patientData.patient : {};

  container.innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>${isEditing ? `📝 Chỉnh Sửa Thông Tin Hành Chính: <strong>${p.ho_ten}</strong> (Mã: #${p.stt || p.id})` : '🏢 Tiếp Đón & Đăng Ký Hồ Sơ Khám Sức Khỏe Mới'}</span>
        <div style="display: flex; gap: 8px;">
          ${isEditing ? `
            <button class="btn btn-secondary btn-sm" id="btn-switch-create-new">
              ➕ Đăng Ký Người Mới
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" id="btn-open-import-modal">
            📥 Nạp Danh Sách Đoàn KSK từ Excel
          </button>
        </div>
      </div>

      <form id="form-reception">
        <div class="form-grid-3">
          <div class="form-group">
            <label>Họ và tên <span class="req">*</span></label>
            <input type="text" id="rec-ho_ten" class="form-control" value="${p.ho_ten || ''}" placeholder="Nhập đầy đủ họ và tên" required autofocus>
          </div>
          <div class="form-group">
            <label>Ngày sinh (DD/MM/YYYY) <span class="req">*</span></label>
            <input type="text" id="rec-ngay_sinh" class="form-control" value="${p.ngay_sinh || ''}" placeholder="Ví dụ: 15/05/1990" required>
          </div>
          <div class="form-group">
            <label>Giới tính <span class="req">*</span></label>
            <select id="rec-gioi_tinh" class="form-control" required>
              <option value="1" ${p.gioi_tinh === 1 ? 'selected' : ''}>1 - Nam</option>
              <option value="2" ${p.gioi_tinh === 2 ? 'selected' : ''}>2 - Nữ</option>
            </select>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Số CCCD / Định danh</label>
            <input type="text" id="rec-cccd" class="form-control" value="${p.cccd || ''}" placeholder="12 chữ số CCCD">
          </div>
          <div class="form-group">
            <label>Ngày cấp CCCD</label>
            <input type="text" id="rec-ngay_cap_cccd" class="form-control" value="${p.ngay_cap_cccd || ''}" placeholder="DD/MM/YYYY">
          </div>
          <div class="form-group">
            <label>Nơi cấp CCCD</label>
            <select id="rec-noi_cap_cccd" class="form-control">
              <option value="Cục Cảnh sát QLHC về TTXH" ${(!p.noi_cap_cccd || p.noi_cap_cccd.includes('Cảnh sát') || p.noi_cap_cccd.includes('CS') || p.noi_cap_cccd.includes('QLHC')) ? 'selected' : ''}>Cục Cảnh sát QLHC về TTXH</option>
              <option value="Bộ Công an" ${(p.noi_cap_cccd === 'Bộ Công an' || p.noi_cap_cccd === 'Bộ công an') ? 'selected' : ''}>Bộ Công an</option>
              ${(p.noi_cap_cccd && !p.noi_cap_cccd.includes('Cảnh sát') && !p.noi_cap_cccd.includes('CS') && !p.noi_cap_cccd.includes('QLHC') && p.noi_cap_cccd !== 'Bộ Công an' && p.noi_cap_cccd !== 'Bộ công an') ? `<option value="${p.noi_cap_cccd}" selected>${p.noi_cap_cccd}</option>` : ''}
            </select>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Số điện thoại</label>
            <input type="text" id="rec-sdt" class="form-control" value="${p.sdt || ''}" placeholder="Số điện thoại liên lạc">
          </div>
          <div class="form-group">
            <label>Mã số thẻ BHYT</label>
            <input type="text" id="rec-so_the_bhyt" class="form-control" value="${p.so_the_bhyt || ''}" placeholder="15 ký tự thẻ BHYT">
          </div>
          <div class="form-group">
            <label>Đối tượng KSK</label>
            <select id="rec-doi_tuong_ksk" class="form-control">
              <option value="64" ${(!p.doi_tuong_ksk || p.doi_tuong_ksk === '64') ? 'selected' : ''}>64 - KSK định kỳ cho người lao động</option>
              <option value="100" ${p.doi_tuong_ksk === '100' ? 'selected' : ''}>100 - KSK phân loại sức khỏe để đi học, đi làm việc</option>
              <option value="96" ${p.doi_tuong_ksk === '96' ? 'selected' : ''}>96 - KSK định kỳ cho lái xe</option>
              <option value="98" ${p.doi_tuong_ksk === '98' ? 'selected' : ''}>98 - KSK học sinh, sinh viên</option>
              <option value="59" ${p.doi_tuong_ksk === '59' ? 'selected' : ''}>59 - KSK an toàn thực phẩm</option>
              <option value="60" ${p.doi_tuong_ksk === '60' ? 'selected' : ''}>60 - KSK khi đi làm việc ở nước ngoài</option>
              <option value="58" ${p.doi_tuong_ksk === '58' ? 'selected' : ''}>58 - KSK cho đối tượng chính sách</option>
              <option value="66" ${p.doi_tuong_ksk === '66' ? 'selected' : ''}>66 - KSK định kỳ cho cán bộ</option>
              <option value="99" ${p.doi_tuong_ksk === '99' ? 'selected' : ''}>99 - KSK định kỳ miễn phí (từ 18 tuổi trở lên)</option>
              <option value="92" ${p.doi_tuong_ksk === '92' ? 'selected' : ''}>92 - KSK người cao tuổi (trên 60 tuổi)</option>
              <option value="95" ${p.doi_tuong_ksk === '95' ? 'selected' : ''}>95 - KSK định kỳ cho thuyền viên</option>
              <option value="97" ${p.doi_tuong_ksk === '97' ? 'selected' : ''}>97 - KSK nghĩa vụ quân sự, công an</option>
              <option value="102" ${p.doi_tuong_ksk === '102' ? 'selected' : ''}>102 - KSK theo yêu cầu nghề nghiệp đặc thù</option>
              <option value="103" ${p.doi_tuong_ksk === '103' ? 'selected' : ''}>103 - KSK phát hiện bệnh nghề nghiệp</option>
              <option value="104" ${p.doi_tuong_ksk === '104' ? 'selected' : ''}>104 - KSK theo yêu cầu</option>
              <option value="61" ${p.doi_tuong_ksk === '61' ? 'selected' : ''}>61 - Khám giám định y khoa, pháp y</option>
              <option value="62" ${p.doi_tuong_ksk === '62' ? 'selected' : ''}>62 - Khám cấp giấy chứng thương</option>
              <option value="63" ${p.doi_tuong_ksk === '63' ? 'selected' : ''}>63 - KSK cho người có công với cách mạng</option>
              <option value="65" ${p.doi_tuong_ksk === '65' ? 'selected' : ''}>65 - KSK điều khiển phương tiện đường sắt</option>
              <option value="91" ${p.doi_tuong_ksk === '91' ? 'selected' : ''}>91 - KSK tiền hôn nhân</option>
              <option value="93" ${p.doi_tuong_ksk === '93' ? 'selected' : ''}>93 - KSK định kỳ trẻ em (dưới 06 tuổi)</option>
              <option value="94" ${p.doi_tuong_ksk === '94' ? 'selected' : ''}>94 - KSK bà mẹ</option>
              <option value="101" ${p.doi_tuong_ksk === '101' ? 'selected' : ''}>101 - Khám sàng lọc bệnh không lây nhiễm</option>
              <option value="105" ${p.doi_tuong_ksk === '105' ? 'selected' : ''}>105 - Hình thức khám sức khỏe khác</option>
            </select>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Tỉnh/Thành phố nơi ở</label>
            <input type="text" id="rec-tinh_tp" class="form-control" list="list-tinh_tp" value="${p.tinh_tp || ''}" placeholder="Chọn hoặc gõ Tỉnh/TP...">
            <datalist id="list-tinh_tp"></datalist>
          </div>
          <div class="form-group">
            <label>Xã/Phường nơi ở</label>
            <input type="text" id="rec-xa_phuong" class="form-control" list="list-xa_phuong" value="${p.xa_phuong || ''}" placeholder="Chọn hoặc gõ Xã/Phường...">
            <datalist id="list-xa_phuong"></datalist>
          </div>
          <div class="form-group">
            <label>Nghề nghiệp</label>
            <input type="text" id="rec-nghe_nghiep" class="form-control" list="list-nghe_nghiep" value="${p.nghe_nghiep || ''}" placeholder="Chọn hoặc gõ nghề nghiệp...">
            <datalist id="list-nghe_nghiep"></datalist>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top: 14px;">
          <div class="form-group">
            <label>Nơi làm việc, công tác</label>
            <input type="text" id="rec-noi_cong_tac" class="form-control" value="${p.noi_cong_tac || ''}" placeholder="Tên công ty hoặc trường học">
          </div>
          <div class="form-group">
            <label>Đợt khám / Tên đoàn KSK</label>
            <input type="text" id="rec-dot_kham" class="form-control" value="${p.dot_kham || ''}" placeholder="Ví dụ: Đoàn KSK Công ty May 10">
          </div>
          <div class="form-group">
            <label>Số thứ tự (STT)</label>
            <input type="number" id="rec-stt" class="form-control" value="${p.stt || ''}" placeholder="Để trống hệ thống tự tăng">
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          ${isEditing ? `
            <button type="button" class="btn btn-secondary" id="btn-cancel-edit">Hủy Chỉnh Sửa</button>
            <button type="submit" class="btn btn-success" id="btn-save-patient">
              💾 Cập Nhật Thông Tin Bệnh Nhân (Enter)
            </button>
          ` : `
            <button type="reset" class="btn btn-secondary">Làm Lại</button>
            <button type="submit" class="btn btn-primary" id="btn-save-patient">
              💾 Đăng Ký & Tạo Hồ Sơ Tiếp Đón (Enter)
            </button>
          `}
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

  // Nút chuyển sang tạo người mới
  const btnCreateNew = document.getElementById('btn-switch-create-new');
  if (btnCreateNew) {
    btnCreateNew.onclick = () => {
      if (window.App && window.App.clearSelectedPatient) {
        window.App.clearSelectedPatient();
      }
    };
  }

  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  if (btnCancelEdit) {
    btnCancelEdit.onclick = () => {
      if (window.App && window.App.clearSelectedPatient) {
        window.App.clearSelectedPatient();
      }
    };
  }

  // Gắn sự kiện submit form (Thêm mới HOẶC Cập nhật)
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
      dot_kham: document.getElementById('rec-dot_kham').value || 'Đoàn KSK ' + new Date().toLocaleDateString('vi-VN'),
      stt: document.getElementById('rec-stt').value || null
    };

    try {
      const url = isEditing ? `/api/patients/${p.id}` : '/api/patients';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = 'Lỗi máy chủ (' + res.status + ')';
        try {
          const errJson = JSON.parse(errorText);
          if (errJson.message) errorMsg = errJson.message;
        } catch (_) {}
        window.showToast(errorMsg, 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        window.showToast(isEditing ? 'Đã cập nhật thông tin: ' + payload.ho_ten : 'Đã tiếp nhận bệnh nhân: ' + payload.ho_ten, 'success');
        if (!isEditing) {
          form.reset();
          document.getElementById('rec-dot_kham').value = payload.dot_kham;
          document.getElementById('rec-ho_ten').focus();
        } else {
          if (window.App && window.App.selectPatient) {
            await window.App.selectPatient(p.id);
          }
        }
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

  if (btnOpen) btnOpen.onclick = () => modal.classList.remove('hidden');
  if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
  if (btnCancel) btnCancel.onclick = () => modal.classList.add('hidden');

  if (btnSubmit) {
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

  // Nạp danh mục Tỉnh/Thành phố, Xã/Phường, Nghề nghiệp từ API
  loadAddressLookups();
}

async function loadAddressLookups() {
  const listTinh = document.getElementById('list-tinh_tp');
  const listXa = document.getElementById('list-xa_phuong');
  const listNghe = document.getElementById('list-nghe_nghiep');
  const inputTinh = document.getElementById('rec-tinh_tp');

  // 1. Tải 63 Tỉnh/Thành phố
  try {
    const res = await fetch('/api/lookups/provinces');
    const data = await res.json();
    if (data.success && listTinh) {
      listTinh.innerHTML = data.data.map((t) => `<option value="${t}">`).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh mục Tỉnh/TP:', err);
  }

  // 2. Tải danh mục Nghề nghiệp
  try {
    const res = await fetch('/api/lookups/jobs');
    const data = await res.json();
    if (data.success && listNghe) {
      listNghe.innerHTML = data.data.map((j) => `<option value="${j.name}">`).join('');
    }
  } catch (err) {
    console.error('Lỗi tải danh mục Nghề nghiệp:', err);
  }

  // 3. Hàm tải Xã/Phường theo Tỉnh
  async function updateWards(tinhName) {
    if (!listXa) return;
    try {
      let url = '/api/lookups/wards';
      if (tinhName && tinhName.trim()) {
        url += `?province=${encodeURIComponent(tinhName.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        listXa.innerHTML = data.data.map((x) => `<option value="${x}">`).join('');
      }
    } catch (err) {
      console.error('Lỗi tải danh mục Xã/Phường:', err);
    }
  }

  if (inputTinh) {
    inputTinh.addEventListener('change', (e) => {
      updateWards(e.target.value);
    });
    inputTinh.addEventListener('blur', (e) => {
      updateWards(e.target.value);
    });
    updateWards(inputTinh.value || 'Thành phố Cần Thơ');
  }
}

window.ReceptionModule = {
  renderReceptionView
};
