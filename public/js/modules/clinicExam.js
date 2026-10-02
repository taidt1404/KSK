function renderClinicExamView(container, patientData, currentRoomId) {
  if (!patientData || !patientData.patient) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px; color: var(--text-muted);">
        <div style="font-size: 48px; margin-bottom: 12px;">👈</div>
        <h3>Vui lòng chọn một bệnh nhân từ danh sách bên trái để nhập kết quả khám</h3>
      </div>
    `;
    return;
  }

  const p = patientData.patient;
  const theLuc = patientData.the_luc || {};
  const lamSang = patientData.kham_lam_sang || {};
  const cls = patientData.can_lam_sang || {};

  const savedDoctor = window.RoomManager.getSavedDoctor(currentRoomId);
  const todayStr = new Date().toLocaleDateString('vi-VN');

  let formHtml = '';

  // 1. KHÁM THỂ LỰC
  if (currentRoomId === 'the_luc') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>⚖️ Kết Quả Khám Thể Lực</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Chuẩn Mẫu</button>
        </div>
        <form id="form-exam">
          <div class="form-grid-3">
            <div class="form-group">
              <label>Ngày đo</label>
              <input type="text" id="ex-ngay_do" class="form-control" value="${theLuc.ngay_do || todayStr}">
            </div>
            <div class="form-group">
              <label>Cân nặng (kg)</label>
              <input type="number" step="0.1" id="ex-can_nang" class="form-control" value="${theLuc.can_nang || ''}" placeholder="Ví dụ: 62.5">
            </div>
            <div class="form-group">
              <label>Chiều cao (cm)</label>
              <input type="number" step="0.1" id="ex-chieu_cao" class="form-control" value="${theLuc.chieu_cao || ''}" placeholder="Ví dụ: 168">
            </div>
          </div>

          <div class="form-grid-3" style="margin-top: 14px;">
            <div class="form-group">
              <label>Mạch (lần/phút)</label>
              <input type="number" id="ex-mach" class="form-control" value="${theLuc.mach || ''}" placeholder="Ví dụ: 75">
            </div>
            <div class="form-group">
              <label>Huyết áp tâm thu (mmHg)</label>
              <input type="number" id="ex-ha_tam_thu" class="form-control" value="${theLuc.ha_tam_thu || ''}" placeholder="Ví dụ: 120">
            </div>
            <div class="form-group">
              <label>Huyết áp tâm trương (mmHg)</label>
              <input type="number" id="ex-ha_tam_truong" class="form-control" value="${theLuc.ha_tam_truong || ''}" placeholder="Ví dụ: 80">
            </div>
          </div>

          <div class="form-grid-3" style="margin-top: 14px;">
            <div class="form-group">
              <label>Vòng ngực (cm)</label>
              <input type="number" step="0.5" id="ex-vong_nguc" class="form-control" value="${theLuc.vong_nguc || ''}" placeholder="Ví dụ: 85">
            </div>
            <div class="form-group">
              <label>Phân loại thể lực</label>
              <select id="ex-phan_loai_the_luc" class="form-control">
                <option value="1" ${theLuc.phan_loai_the_luc === 1 ? 'selected' : ''}>1 - Rất khỏe</option>
                <option value="2" ${theLuc.phan_loai_the_luc === 2 ? 'selected' : ''}>2 - Khỏe</option>
                <option value="3" ${theLuc.phan_loai_the_luc === 3 ? 'selected' : ''}>3 - Trung bình</option>
                <option value="4" ${theLuc.phan_loai_the_luc === 4 ? 'selected' : ''}>4 - Yếu</option>
                <option value="5" ${theLuc.phan_loai_the_luc === 5 ? 'selected' : ''}>5 - Rất yếu</option>
              </select>
            </div>
            <div class="form-group">
              <label>Người khám / Đo</label>
              <input type="text" id="ex-nguoi_kham" class="form-control" value="${theLuc.nguoi_kham || savedDoctor}" placeholder="Tên điều dưỡng/bác sĩ">
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám Thể Lực & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 2. KHÁM MẮT
  else if (currentRoomId === 'mat') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>👁️ Kết Quả Khám Mắt & Thị Lực</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Thị Lực 10/10</button>
        </div>
        <form id="form-exam">
          <div class="form-grid-2">
            <div class="card" style="margin-bottom: 0;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Thị Lực Không Kính (../10)</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Mắt phải</label>
                  <input type="text" id="ex-mat_khong_kinh_phai" class="form-control" value="${lamSang.mat_khong_kinh_phai || ''}" placeholder="Ví dụ: 10">
                </div>
                <div class="form-group">
                  <label>Mắt trái</label>
                  <input type="text" id="ex-mat_khong_kinh_trai" class="form-control" value="${lamSang.mat_khong_kinh_trai || ''}" placeholder="Ví dụ: 10">
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 0;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Thị Lực Có Kính (../10)</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Mắt phải</label>
                  <input type="text" id="ex-mat_co_kinh_phai" class="form-control" value="${lamSang.mat_co_kinh_phai || ''}">
                </div>
                <div class="form-group">
                  <label>Mắt trái</label>
                  <input type="text" id="ex-mat_co_kinh_trai" class="form-control" value="${lamSang.mat_co_kinh_trai || ''}">
                </div>
              </div>
            </div>
          </div>

          <div class="form-grid-3" style="margin-top: 16px;">
            <div class="form-group">
              <label>Các bệnh về mắt (nếu có)</label>
              <input type="text" id="ex-mat_benh" class="form-control" value="${lamSang.mat_benh || ''}" placeholder="Không có / Cận thị...">
            </div>
            <div class="form-group">
              <label>Phân loại</label>
              <select id="ex-mat_phan_loai" class="form-control">
                <option value="1" ${lamSang.mat_phan_loai === 1 ? 'selected' : ''}>1 - Loại 1 (Tốt)</option>
                <option value="2" ${lamSang.mat_phan_loai === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.mat_phan_loai === 3 ? 'selected' : ''}>3 - Loại 3</option>
                <option value="4" ${lamSang.mat_phan_loai === 4 ? 'selected' : ''}>4 - Loại 4</option>
                <option value="5" ${lamSang.mat_phan_loai === 5 ? 'selected' : ''}>5 - Loại 5</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bác sỹ khám</label>
              <input type="text" id="ex-mat_bac_sy" class="form-control" value="${lamSang.mat_bac_sy || savedDoctor}">
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám Mắt & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 3. KHÁM TAI MŨI HỌNG
  else if (currentRoomId === 'tmh') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>👂 Kết Quả Khám Tai Mũi Họng</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Thính Lực Tốt</button>
        </div>
        <form id="form-exam">
          <div class="form-grid-2">
            <div class="card" style="margin-bottom: 0;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Tai Trái</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Nói thường (m)</label>
                  <input type="text" id="ex-tmh_tai_trai_thuong" class="form-control" value="${lamSang.tmh_tai_trai_thuong || '5'}">
                </div>
                <div class="form-group">
                  <label>Nói thầm (m)</label>
                  <input type="text" id="ex-tmh_tai_trai_tham" class="form-control" value="${lamSang.tmh_tai_trai_tham || '0.5'}">
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 0;">
              <h4 style="margin-bottom: 12px; font-size: 14px;">Tai Phải</h4>
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Nói thường (m)</label>
                  <input type="text" id="ex-tmh_tai_phai_thuong" class="form-control" value="${lamSang.tmh_tai_phai_thuong || '5'}">
                </div>
                <div class="form-group">
                  <label>Nói thầm (m)</label>
                  <input type="text" id="ex-tmh_tai_phai_tham" class="form-control" value="${lamSang.tmh_tai_phai_tham || '0.5'}">
                </div>
              </div>
            </div>
          </div>

          <div class="form-grid-3" style="margin-top: 16px;">
            <div class="form-group">
              <label>Các bệnh về TMH (nếu có)</label>
              <input type="text" id="ex-tmh_benh" class="form-control" value="${lamSang.tmh_benh || ''}" placeholder="Bình thường / Không">
            </div>
            <div class="form-group">
              <label>Phân loại</label>
              <select id="ex-tmh_phan_loai" class="form-control">
                <option value="1" ${lamSang.tmh_phan_loai === 1 ? 'selected' : ''}>1 - Loại 1 (Tốt)</option>
                <option value="2" ${lamSang.tmh_phan_loai === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.tmh_phan_loai === 3 ? 'selected' : ''}>3 - Loại 3</option>
                <option value="4" ${lamSang.tmh_phan_loai === 4 ? 'selected' : ''}>4 - Loại 4</option>
                <option value="5" ${lamSang.tmh_phan_loai === 5 ? 'selected' : ''}>5 - Loại 5</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bác sỹ khám</label>
              <input type="text" id="ex-tmh_bac_sy" class="form-control" value="${lamSang.tmh_bac_sy || savedDoctor}">
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám TMH & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 4. KHÁM RĂNG HÀM MẶT
  else if (currentRoomId === 'rhm') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>🦷 Kết Quả Khám Răng - Hàm - Mặt</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Răng Tốt</button>
        </div>
        <form id="form-exam">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Khám Hàm trên</label>
              <input type="text" id="ex-rhm_ham_tren" class="form-control" value="${lamSang.rhm_ham_tren || ''}" placeholder="Đủ răng / Bình thường">
            </div>
            <div class="form-group">
              <label>Khám Hàm dưới</label>
              <input type="text" id="ex-rhm_ham_duoi" class="form-control" value="${lamSang.rhm_ham_duoi || ''}" placeholder="Đủ răng / Bình thường">
            </div>
          </div>

          <div class="form-grid-3" style="margin-top: 16px;">
            <div class="form-group">
              <label>Các bệnh về RHM (nếu có)</label>
              <input type="text" id="ex-rhm_benh" class="form-control" value="${lamSang.rhm_benh || ''}" placeholder="Không có / Sâu răng...">
            </div>
            <div class="form-group">
              <label>Phân loại</label>
              <select id="ex-rhm_phan_loai" class="form-control">
                <option value="1" ${lamSang.rhm_phan_loai === 1 ? 'selected' : ''}>1 - Loại 1 (Tốt)</option>
                <option value="2" ${lamSang.rhm_phan_loai === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.rhm_phan_loai === 3 ? 'selected' : ''}>3 - Loại 3</option>
                <option value="4" ${lamSang.rhm_phan_loai === 4 ? 'selected' : ''}>4 - Loại 4</option>
                <option value="5" ${lamSang.rhm_phan_loai === 5 ? 'selected' : ''}>5 - Loại 5</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bác sỹ khám</label>
              <input type="text" id="ex-rhm_bac_sy" class="form-control" value="${lamSang.rhm_bac_sy || savedDoctor}">
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám RHM & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 5. KHÁM NỘI KHOA
  else if (currentRoomId === 'noi') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>🩺 Kết Quả Khám Toàn Diện Nội Khoa</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Nội Khoa Bình Thường</button>
        </div>
        <form id="form-exam">
          <div class="form-grid-3">
            <div class="form-group">
              <label>Ngày khám</label>
              <input type="text" id="ex-noi_ngay_kham" class="form-control" value="${lamSang.noi_ngay_kham || todayStr}">
            </div>
            <div class="form-group">
              <label>Bác sỹ khám Nội</label>
              <input type="text" id="ex-noi_bac_sy" class="form-control" value="${lamSang.noi_bac_sy || savedDoctor}">
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 16px;">
            <div class="form-group">
              <label>1. Khám Tuần hoàn</label>
              <input type="text" id="ex-noi_tuan_hoan" class="form-control" value="${lamSang.noi_tuan_hoan || 'Tiếng tim đều, rõ'}">
            </div>
            <div class="form-group">
              <label>Phân loại Tuần hoàn</label>
              <select id="ex-noi_pl_tuan_hoan" class="form-control">
                <option value="1" ${lamSang.noi_pl_tuan_hoan === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_tuan_hoan === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.noi_pl_tuan_hoan === 3 ? 'selected' : ''}>3 - Loại 3</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>2. Khám Hô hấp</label>
              <input type="text" id="ex-noi_ho_hap" class="form-control" value="${lamSang.noi_ho_hap || 'Phổi trong, không rales'}">
            </div>
            <div class="form-group">
              <label>Phân loại Hô hấp</label>
              <select id="ex-noi_pl_ho_hap" class="form-control">
                <option value="1" ${lamSang.noi_pl_ho_hap === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_ho_hap === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.noi_pl_ho_hap === 3 ? 'selected' : ''}>3 - Loại 3</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>3. Khám Tiêu hóa</label>
              <input type="text" id="ex-noi_tieu_hoa" class="form-control" value="${lamSang.noi_tieu_hoa || 'Bụng mềm, không đau'}">
            </div>
            <div class="form-group">
              <label>Phân loại Tiêu hóa</label>
              <select id="ex-noi_pl_tieu_hoa" class="form-control">
                <option value="1" ${lamSang.noi_pl_tieu_hoa === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_tieu_hoa === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.noi_pl_tieu_hoa === 3 ? 'selected' : ''}>3 - Loại 3</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>4. Thận, Tiết niệu</label>
              <input type="text" id="ex-noi_than_tiet_nieu" class="form-control" value="${lamSang.noi_than_tiet_nieu || 'Chạm thận (-)'}">
            </div>
            <div class="form-group">
              <label>Phân loại Thận, Tiết niệu</label>
              <select id="ex-noi_pl_than_tiet_nieu" class="form-control">
                <option value="1" ${lamSang.noi_pl_than_tiet_nieu === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_than_tiet_nieu === 2 ? 'selected' : ''}>2 - Loại 2</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>5. Khám Nội tiết</label>
              <input type="text" id="ex-noi_noi_tiet" class="form-control" value="${lamSang.noi_noi_tiet || 'Tuyến giáp không to, bình thường'}">
            </div>
            <div class="form-group">
              <label>Phân loại Nội tiết</label>
              <select id="ex-noi_pl_noi_tiet" class="form-control">
                <option value="1" ${lamSang.noi_pl_noi_tiet === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_noi_tiet === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.noi_pl_noi_tiet === 3 ? 'selected' : ''}>3 - Loại 3</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>6. Khám Cơ xương khớp</label>
              <input type="text" id="ex-noi_co_xuong_khop" class="form-control" value="${lamSang.noi_co_xuong_khop || 'Khớp hoạt động bình thường'}">
            </div>
            <div class="form-group">
              <label>Phân loại Cơ xương khớp</label>
              <select id="ex-noi_pl_co_xuong_khop" class="form-control">
                <option value="1" ${lamSang.noi_pl_co_xuong_khop === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_co_xuong_khop === 2 ? 'selected' : ''}>2 - Loại 2</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>7. Khám Thần kinh</label>
              <input type="text" id="ex-noi_than_kinh" class="form-control" value="${lamSang.noi_than_kinh || 'Tỉnh táo, phản xạ tốt'}">
            </div>
            <div class="form-group">
              <label>Phân loại Thần kinh</label>
              <select id="ex-noi_pl_than_kinh" class="form-control">
                <option value="1" ${lamSang.noi_pl_than_kinh === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_than_kinh === 2 ? 'selected' : ''}>2 - Loại 2</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2" style="margin-top: 12px;">
            <div class="form-group">
              <label>8. Khám Tâm thần</label>
              <input type="text" id="ex-noi_tam_than" class="form-control" value="${lamSang.noi_tam_than || 'Bình thường, tiếp xúc tốt'}">
            </div>
            <div class="form-group">
              <label>Phân loại Tâm thần</label>
              <select id="ex-noi_pl_tam_than" class="form-control">
                <option value="1" ${lamSang.noi_pl_tam_than === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.noi_pl_tam_than === 2 ? 'selected' : ''}>2 - Loại 2</option>
              </select>
            </div>
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám Nội Khoa & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 6. KHÁM NGOẠI KHOA
  else if (currentRoomId === 'ngoai') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>🩹 Kết Quả Khám Ngoại Khoa</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Ngoại Khoa Bình Thường</button>
        </div>
        <form id="form-exam">
          <div class="form-group">
            <label>Kết quả khám Ngoại khoa</label>
            <input type="text" id="ex-ngoai_ket_qua" class="form-control" value="${lamSang.ngoai_ket_qua || 'Bình thường, không sẹo mổ cũ'}">
          </div>
          <div class="form-grid-2" style="margin-top: 16px;">
            <div class="form-group">
              <label>Phân loại</label>
              <select id="ex-ngoai_phan_loai" class="form-control">
                <option value="1" ${lamSang.ngoai_phan_loai === 1 ? 'selected' : ''}>1 - Loại 1 (Tốt)</option>
                <option value="2" ${lamSang.ngoai_phan_loai === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.ngoai_phan_loai === 3 ? 'selected' : ''}>3 - Loại 3</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bác sỹ khám</label>
              <input type="text" id="ex-ngoai_bac_sy" class="form-control" value="${lamSang.ngoai_bac_sy || savedDoctor}">
            </div>
          </div>
          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám Ngoại & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 7. KHÁM DA LIỄU
  else if (currentRoomId === 'da_lieu') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>🧴 Kết Quả Khám Da Liễu</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Da Liễu Bình Thường</button>
        </div>
        <form id="form-exam">
          <div class="form-group">
            <label>Kết quả khám Da liễu</label>
            <input type="text" id="ex-da_lieu_ket_qua" class="form-control" value="${lamSang.da_lieu_ket_qua || 'Bình thường, không sang thương da'}">
          </div>
          <div class="form-grid-2" style="margin-top: 16px;">
            <div class="form-group">
              <label>Phân loại</label>
              <select id="ex-da_lieu_phan_loai" class="form-control">
                <option value="1" ${lamSang.da_lieu_phan_loai === 1 ? 'selected' : ''}>1 - Loại 1</option>
                <option value="2" ${lamSang.da_lieu_phan_loai === 2 ? 'selected' : ''}>2 - Loại 2</option>
                <option value="3" ${lamSang.da_lieu_phan_loai === 3 ? 'selected' : ''}>3 - Loại 3</option>
              </select>
            </div>
            <div class="form-group">
              <label>Bác sỹ khám</label>
              <input type="text" id="ex-da_lieu_bac_sy" class="form-control" value="${lamSang.da_lieu_bac_sy || savedDoctor}">
            </div>
          </div>
          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Khám Da Liễu & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  // 8. KHÁM SẢN PHỤ KHOA
  else if (currentRoomId === 'san') {
    if (p.gioi_tinh === 1) {
      formHtml = `
        <div class="card" style="text-align: center; padding: 40px;">
          <div style="font-size: 40px; margin-bottom: 10px;">👨</div>
          <h3>Bệnh nhân Nam: Không thực hiện khám Sản phụ khoa</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Hệ thống sẽ tự động để trống mục này theo quy định mẫu KSK.</p>
        </div>
      `;
    } else {
      formHtml = `
        <div class="card">
          <div class="card-title">
            <span>🌸 Kết Quả Khám Sản Phụ Khoa (Nữ)</span>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Bình Thường</button>
          </div>
          <form id="form-exam">
            <div class="form-group">
              <label>Kết quả khám Sản phụ khoa</label>
              <input type="text" id="ex-san_phu_khoa_ket_qua" class="form-control" value="${lamSang.san_phu_khoa_ket_qua || 'Bình thường, không viêm nhiễm'}">
            </div>
            <div class="form-grid-2" style="margin-top: 16px;">
              <div class="form-group">
                <label>Phân loại</label>
                <select id="ex-san_phu_khoa_phan_loai" class="form-control">
                  <option value="1" ${lamSang.san_phu_khoa_phan_loai === 1 ? 'selected' : ''}>1 - Loại 1</option>
                  <option value="2" ${lamSang.san_phu_khoa_phan_loai === 2 ? 'selected' : ''}>2 - Loại 2</option>
                  <option value="3" ${lamSang.san_phu_khoa_phan_loai === 3 ? 'selected' : ''}>3 - Loại 3</option>
                </select>
              </div>
              <div class="form-group">
                <label>Bác sỹ khám</label>
                <input type="text" id="ex-san_phu_khoa_bac_sy" class="form-control" value="${lamSang.san_phu_khoa_bac_sy || savedDoctor}">
              </div>
            </div>
            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary" id="btn-submit-exam">
                💾 Lưu Khám Phụ Khoa & Chuyển Ca Sau (Ctrl + S)
              </button>
            </div>
          </form>
        </div>
      `;
    }
  }

  // 9. CẬN LÂM SÀNG
  else if (currentRoomId === 'cls') {
    formHtml = `
      <div class="card">
        <div class="card-title">
          <span>🧪 Kết Quả Cận Lâm Sàng & Xét Nghiệm Toàn Diện</span>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-normal">Điền Nhanh: Chỉ Số Chuẩn</button>
        </div>
        <form id="form-exam">
          <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--primary-color);">1. Huyết Học & Công Thức Máu</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Hồng cầu (T/L)</label>
              <input type="number" step="0.01" id="ex-cls_hong_cau" class="form-control" value="${cls.cls_hong_cau ?? ''}" placeholder="4.5">
            </div>
            <div class="form-group">
              <label>Bạch cầu (G/L)</label>
              <input type="number" step="0.01" id="ex-cls_bach_cau" class="form-control" value="${cls.cls_bach_cau ?? ''}" placeholder="6.8">
            </div>
            <div class="form-group">
              <label>Tiểu cầu (G/L)</label>
              <input type="number" step="1" id="ex-cls_tieu_cau" class="form-control" value="${cls.cls_tieu_cau ?? ''}" placeholder="250">
            </div>
            <div class="form-group">
              <label>Huyết sắc tố (g/L)</label>
              <input type="number" step="1" id="ex-cls_huyet_sac_to" class="form-control" value="${cls.cls_huyet_sac_to ?? ''}" placeholder="140">
            </div>
          </div>

          <h4 style="font-size: 14px; margin: 18px 0 8px 0; color: var(--primary-color);">2. Sinh Hóa Máu & Chức Năng Gan, Thận</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Đường huyết (mmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_duong_huyet" class="form-control" value="${cls.cls_duong_huyet ?? ''}" placeholder="5.2">
            </div>
            <div class="form-group">
              <label>Ure (mmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_ure" class="form-control" value="${cls.cls_ure ?? ''}" placeholder="4.8">
            </div>
            <div class="form-group">
              <label>Creatinin (µmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_creatinin" class="form-control" value="${cls.cls_creatinin ?? ''}" placeholder="80">
            </div>
            <div class="form-group">
              <label>Bilirubin TP (µmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_bilirubin_tp" class="form-control" value="${cls.cls_bilirubin_tp ?? ''}" placeholder="12.5">
            </div>
            <div class="form-group">
              <label>AST / GOT (U/l)</label>
              <input type="number" step="1" id="ex-cls_ast" class="form-control" value="${cls.cls_ast ?? ''}" placeholder="25">
            </div>
            <div class="form-group">
              <label>ALT / GPT (U/l)</label>
              <input type="number" step="1" id="ex-cls_alt" class="form-control" value="${cls.cls_alt ?? ''}" placeholder="22">
            </div>
            <div class="form-group">
              <label>GGT (U/l)</label>
              <input type="number" step="1" id="ex-cls_ggt" class="form-control" value="${cls.cls_ggt ?? ''}" placeholder="28">
            </div>
          </div>

          <h4 style="font-size: 14px; margin: 18px 0 8px 0; color: var(--primary-color);">3. Mỡ Máu (Lipid) & HbA1c</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Cholesterol TP (mmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_cholesterol_tp" class="form-control" value="${cls.cls_cholesterol_tp ?? ''}" placeholder="4.6">
            </div>
            <div class="form-group">
              <label>Triglycerid (mmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_triglycerid" class="form-control" value="${cls.cls_triglycerid ?? ''}" placeholder="1.5">
            </div>
            <div class="form-group">
              <label>HDL - C (mmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_hdl_c" class="form-control" value="${cls.cls_hdl_c ?? ''}" placeholder="1.3">
            </div>
            <div class="form-group">
              <label>LDL - C (mmol/l)</label>
              <input type="number" step="0.1" id="ex-cls_ldl_c" class="form-control" value="${cls.cls_ldl_c ?? ''}" placeholder="2.6">
            </div>
            <div class="form-group">
              <label>HbA1c (%)</label>
              <input type="number" step="0.1" id="ex-cls_hba1c" class="form-control" value="${cls.cls_hba1c ?? ''}" placeholder="5.4">
            </div>
          </div>

          <h4 style="font-size: 14px; margin: 18px 0 8px 0; color: var(--primary-color);">4. Xét Nghiệm Miễn Dịch & Viêm Gan, Marker Ung Thư</h4>
          <div class="form-grid-3">
            <div class="form-group">
              <label>AFP (ng/ml)</label>
              <input type="number" step="0.1" id="ex-cls_afp" class="form-control" value="${cls.cls_afp ?? ''}" placeholder="3.2">
            </div>
            <div class="form-group">
              <label>CEA (ng/ml)</label>
              <input type="number" step="0.1" id="ex-cls_cea" class="form-control" value="${cls.cls_cea ?? ''}" placeholder="2.1">
            </div>
            <div class="form-group">
              <label>PSA Total (ng/ml)</label>
              <input type="number" step="0.1" id="ex-cls_psa_total" class="form-control" value="${cls.cls_psa_total ?? ''}" placeholder="1.1">
            </div>
            <div class="form-group">
              <label>HBsAg (Viêm gan B)</label>
              <input type="text" id="ex-cls_hbsag" class="form-control" value="${cls.cls_hbsag || ''}" placeholder="Âm tính">
            </div>
            <div class="form-group">
              <label>HBsAb (Kháng thể VG B)</label>
              <input type="text" id="ex-cls_hbsab" class="form-control" value="${cls.cls_hbsab || ''}" placeholder="Dương tính / Âm tính">
            </div>
            <div class="form-group">
              <label>Anti HCV (Viêm gan C)</label>
              <input type="text" id="ex-cls_anti_hcv" class="form-control" value="${cls.cls_anti_hcv || ''}" placeholder="Âm tính">
            </div>
          </div>

          <h4 style="font-size: 14px; margin: 18px 0 8px 0; color: var(--primary-color);">5. Xét Nghiệm Nước Tiểu & Axit Uric</h4>
          <div class="form-grid-3">
            <div class="form-group">
              <label>Axit Uric (µmol/l)</label>
              <input type="number" step="1" id="ex-cls_axit_uric" class="form-control" value="${cls.cls_axit_uric ?? ''}" placeholder="310">
            </div>
            <div class="form-group">
              <label>Glucose (Nước tiểu)</label>
              <input type="text" id="ex-cls_glucose" class="form-control" value="${cls.cls_glucose || ''}" placeholder="Âm tính">
            </div>
            <div class="form-group">
              <label>Protein niệu</label>
              <input type="text" id="ex-cls_protein_nieu" class="form-control" value="${cls.cls_protein_nieu || ''}" placeholder="Âm tính">
            </div>
            <div class="form-group">
              <label>Hồng cầu (Nước tiểu)</label>
              <input type="text" id="ex-cls_nuoc_tieu_hong_cau" class="form-control" value="${cls.cls_nuoc_tieu_hong_cau || ''}" placeholder="Âm tính">
            </div>
            <div class="form-group">
              <label>Bạch cầu (Nước tiểu)</label>
              <input type="text" id="ex-cls_nuoc_tieu_bach_cau" class="form-control" value="${cls.cls_nuoc_tieu_bach_cau || ''}" placeholder="Âm tính">
            </div>
          </div>

          <h4 style="font-size: 14px; margin: 18px 0 8px 0; color: var(--primary-color);">6. Chẩn Đoán Hình Ảnh & Khác</h4>
          <div class="form-grid-3">
            <div class="form-group">
              <label>Điện tim</label>
              <input type="text" id="ex-cls_dien_tim" class="form-control" value="${cls.cls_dien_tim || ''}" placeholder="Nhịp xoang đều">
            </div>
            <div class="form-group">
              <label>Chụp X-Quang phổi</label>
              <input type="text" id="ex-cls_xquang" class="form-control" value="${cls.cls_xquang || ''}" placeholder="Tim phổi bình thường">
            </div>
            <div class="form-group">
              <label>Siêu âm ổ bụng</label>
              <input type="text" id="ex-cls_sieu_am" class="form-control" value="${cls.cls_sieu_am || ''}" placeholder="Các tạng chưa phát hiện bất thường">
            </div>
            <div class="form-group">
              <label>CĐHA khác</label>
              <input type="text" id="ex-cls_cdha_khac" class="form-control" value="${cls.cls_cdha_khac || ''}" placeholder="Chưa ghi nhận bất thường">
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label>Các xét nghiệm khác</label>
              <input type="text" id="ex-cls_xet_nghiem_khac" class="form-control" value="${cls.cls_xet_nghiem_khac || ''}" placeholder="Bình thường">
            </div>
          </div>

          <div class="form-group" style="margin-top: 14px;">
            <label>Bác sỹ / Kỹ thuật viên kết luận Cận lâm sàng</label>
            <input type="text" id="ex-cls_bac_sy" class="form-control" value="${cls.cls_bac_sy || savedDoctor}">
          </div>

          <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-submit-exam">
              💾 Lưu Kết Quả Cận Lâm Sàng & Chuyển Ca Sau (Ctrl + S)
            </button>
          </div>
        </form>
      </div>
    `;
  }

  container.innerHTML = formHtml;

  // Gắn sự kiện điền nhanh (Normal fill button)
  const btnNormal = document.getElementById('btn-fill-normal');
  if (btnNormal) {
    btnNormal.onclick = () => {
      if (currentRoomId === 'the_luc') {
        document.getElementById('ex-can_nang').value = '60';
        document.getElementById('ex-chieu_cao').value = '165';
        document.getElementById('ex-mach').value = '75';
        document.getElementById('ex-ha_tam_thu').value = '120';
        document.getElementById('ex-ha_tam_truong').value = '80';
        document.getElementById('ex-vong_nguc').value = '82';
        document.getElementById('ex-phan_loai_the_luc').value = '1';
      } else if (currentRoomId === 'mat') {
        document.getElementById('ex-mat_khong_kinh_phai').value = '10';
        document.getElementById('ex-mat_khong_kinh_trai').value = '10';
        document.getElementById('ex-mat_benh').value = 'Không có';
        document.getElementById('ex-mat_phan_loai').value = '1';
      } else if (currentRoomId === 'tmh') {
        document.getElementById('ex-tmh_tai_trai_thuong').value = '5';
        document.getElementById('ex-tmh_tai_trai_tham').value = '0.5';
        document.getElementById('ex-tmh_tai_phai_thuong').value = '5';
        document.getElementById('ex-tmh_tai_phai_tham').value = '0.5';
        document.getElementById('ex-tmh_benh').value = 'Bình thường';
        document.getElementById('ex-tmh_phan_loai').value = '1';
      } else if (currentRoomId === 'rhm') {
        document.getElementById('ex-rhm_ham_tren').value = 'Đủ răng, bình thường';
        document.getElementById('ex-rhm_ham_duoi').value = 'Đủ răng, bình thường';
        document.getElementById('ex-rhm_benh').value = 'Không có';
        document.getElementById('ex-rhm_phan_loai').value = '1';
      } else if (currentRoomId === 'noi') {
        document.getElementById('ex-noi_tuan_hoan').value = 'Tiếng tim đều, rõ';
        document.getElementById('ex-noi_ho_hap').value = 'Phổi trong, không rales';
        document.getElementById('ex-noi_tieu_hoa').value = 'Bụng mềm, không đau';
        document.getElementById('ex-noi_than_tiet_nieu').value = 'Chạm thận (-)';
        document.getElementById('ex-noi_noi_tiet').value = 'Tuyến giáp không to, bình thường';
        document.getElementById('ex-noi_co_xuong_khop').value = 'Khớp vận động bình thường';
        document.getElementById('ex-noi_than_kinh').value = 'Tỉnh táo, phản xạ tốt';
        document.getElementById('ex-noi_tam_than').value = 'Bình thường, tiếp xúc tốt';
      } else if (currentRoomId === 'ngoai') {
        document.getElementById('ex-ngoai_ket_qua').value = 'Bình thường, không sẹo mổ cũ';
        document.getElementById('ex-ngoai_phan_loai').value = '1';
      } else if (currentRoomId === 'da_lieu') {
        document.getElementById('ex-da_lieu_ket_qua').value = 'Bình thường, da sạch';
        document.getElementById('ex-da_lieu_phan_loai').value = '1';
      } else if (currentRoomId === 'san' && p.gioi_tinh === 2) {
        document.getElementById('ex-san_phu_khoa_ket_qua').value = 'Bình thường, không viêm nhiễm';
        document.getElementById('ex-san_phu_khoa_phan_loai').value = '1';
      } else if (currentRoomId === 'cls') {
        // Huyết học
        document.getElementById('ex-cls_hong_cau').value = '4.5';
        document.getElementById('ex-cls_bach_cau').value = '6.5';
        document.getElementById('ex-cls_tieu_cau').value = '240';
        document.getElementById('ex-cls_huyet_sac_to').value = '140';
        // Sinh hóa gan, thận
        document.getElementById('ex-cls_duong_huyet').value = '5.1';
        document.getElementById('ex-cls_ure').value = '4.6';
        document.getElementById('ex-cls_creatinin').value = '75';
        document.getElementById('ex-cls_bilirubin_tp').value = '12.5';
        document.getElementById('ex-cls_ast').value = '24';
        document.getElementById('ex-cls_alt').value = '22';
        document.getElementById('ex-cls_ggt').value = '28';
        // Mỡ máu & HbA1c
        document.getElementById('ex-cls_cholesterol_tp').value = '4.5';
        document.getElementById('ex-cls_triglycerid').value = '1.5';
        document.getElementById('ex-cls_hdl_c').value = '1.3';
        document.getElementById('ex-cls_ldl_c').value = '2.6';
        document.getElementById('ex-cls_hba1c').value = '5.4';
        // Miễn dịch
        document.getElementById('ex-cls_afp').value = '3.2';
        document.getElementById('ex-cls_cea').value = '2.1';
        document.getElementById('ex-cls_psa_total').value = '1.1';
        document.getElementById('ex-cls_hbsag').value = 'Âm tính';
        document.getElementById('ex-cls_hbsab').value = 'Dương tính (>1000 mUI/ml)';
        document.getElementById('ex-cls_anti_hcv').value = 'Âm tính';
        // Nước tiểu & Acid uric
        document.getElementById('ex-cls_axit_uric').value = '310';
        document.getElementById('ex-cls_glucose').value = 'Âm tính';
        document.getElementById('ex-cls_protein_nieu').value = 'Âm tính';
        document.getElementById('ex-cls_nuoc_tieu_hong_cau').value = 'Âm tính';
        document.getElementById('ex-cls_nuoc_tieu_bach_cau').value = 'Âm tính';
        // CĐHA & Khác
        document.getElementById('ex-cls_dien_tim').value = 'Nhịp xoang đều';
        document.getElementById('ex-cls_xquang').value = 'Tim phổi bình thường';
        document.getElementById('ex-cls_sieu_am').value = 'Các tạng bình thường';
        document.getElementById('ex-cls_cdha_khac').value = 'Chưa ghi nhận bất thường';
        document.getElementById('ex-cls_xet_nghiem_khac').value = 'Bình thường';
      }
      window.showToast('Đã điền các chỉ số chuẩn bình thường', 'info');
    };
  }

  // Gắn sự kiện submit form lưu dữ liệu
  const form = document.getElementById('form-exam');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveCurrentExam();
    });
  }

  async function saveCurrentExam() {
    let url = `/api/patients/${p.id}`;
    let payload = {};

    if (currentRoomId === 'the_luc') {
      url += '/the-luc';
      payload = {
        ngay_do: document.getElementById('ex-ngay_do').value,
        can_nang: document.getElementById('ex-can_nang').value,
        chieu_cao: document.getElementById('ex-chieu_cao').value,
        mach: document.getElementById('ex-mach').value,
        ha_tam_thu: document.getElementById('ex-ha_tam_thu').value,
        ha_tam_truong: document.getElementById('ex-ha_tam_truong').value,
        vong_nguc: document.getElementById('ex-vong_nguc').value,
        phan_loai_the_luc: document.getElementById('ex-phan_loai_the_luc').value,
        nguoi_kham: document.getElementById('ex-nguoi_kham').value
      };
      window.RoomManager.saveDoctor('the_luc', payload.nguoi_kham);
    } else if (currentRoomId === 'cls') {
      url += '/can-lam-sang';
      payload = {
        cls_hong_cau: document.getElementById('ex-cls_hong_cau').value,
        cls_bach_cau: document.getElementById('ex-cls_bach_cau').value,
        cls_tieu_cau: document.getElementById('ex-cls_tieu_cau').value,
        cls_huyet_sac_to: document.getElementById('ex-cls_huyet_sac_to').value,
        cls_duong_huyet: document.getElementById('ex-cls_duong_huyet').value,
        cls_ure: document.getElementById('ex-cls_ure').value,
        cls_creatinin: document.getElementById('ex-cls_creatinin').value,
        cls_bilirubin_tp: document.getElementById('ex-cls_bilirubin_tp').value,
        cls_ast: document.getElementById('ex-cls_ast').value,
        cls_alt: document.getElementById('ex-cls_alt').value,
        cls_ggt: document.getElementById('ex-cls_ggt').value,
        cls_cholesterol_tp: document.getElementById('ex-cls_cholesterol_tp').value,
        cls_triglycerid: document.getElementById('ex-cls_triglycerid').value,
        cls_hdl_c: document.getElementById('ex-cls_hdl_c').value,
        cls_ldl_c: document.getElementById('ex-cls_ldl_c').value,
        cls_hba1c: document.getElementById('ex-cls_hba1c').value,
        cls_afp: document.getElementById('ex-cls_afp').value,
        cls_cea: document.getElementById('ex-cls_cea').value,
        cls_psa_total: document.getElementById('ex-cls_psa_total').value,
        cls_hbsag: document.getElementById('ex-cls_hbsag').value,
        cls_hbsab: document.getElementById('ex-cls_hbsab').value,
        cls_anti_hcv: document.getElementById('ex-cls_anti_hcv').value,
        cls_axit_uric: document.getElementById('ex-cls_axit_uric').value,
        cls_glucose: document.getElementById('ex-cls_glucose').value,
        cls_protein_nieu: document.getElementById('ex-cls_protein_nieu').value,
        cls_nuoc_tieu_hong_cau: document.getElementById('ex-cls_nuoc_tieu_hong_cau').value,
        cls_nuoc_tieu_bach_cau: document.getElementById('ex-cls_nuoc_tieu_bach_cau').value,
        cls_dien_tim: document.getElementById('ex-cls_dien_tim').value,
        cls_xquang: document.getElementById('ex-cls_xquang').value,
        cls_sieu_am: document.getElementById('ex-cls_sieu_am').value,
        cls_cdha_khac: document.getElementById('ex-cls_cdha_khac').value,
        cls_xet_nghiem_khac: document.getElementById('ex-cls_xet_nghiem_khac').value,
        cls_bac_sy: document.getElementById('ex-cls_bac_sy').value
      };
      window.RoomManager.saveDoctor('cls', payload.cls_bac_sy);
    } else {
      // Các chuyên khoa lâm sàng
      url += '/kham-lam-sang';
      payload._room = currentRoomId;

      if (currentRoomId === 'mat') {
        payload.mat_khong_kinh_phai = document.getElementById('ex-mat_khong_kinh_phai').value;
        payload.mat_khong_kinh_trai = document.getElementById('ex-mat_khong_kinh_trai').value;
        payload.mat_co_kinh_phai = document.getElementById('ex-mat_co_kinh_phai').value;
        payload.mat_co_kinh_trai = document.getElementById('ex-mat_co_kinh_trai').value;
        payload.mat_benh = document.getElementById('ex-mat_benh').value;
        payload.mat_phan_loai = document.getElementById('ex-mat_phan_loai').value;
        payload.mat_bac_sy = document.getElementById('ex-mat_bac_sy').value;
        window.RoomManager.saveDoctor('mat', payload.mat_bac_sy);
      } else if (currentRoomId === 'tmh') {
        payload.tmh_tai_trai_thuong = document.getElementById('ex-tmh_tai_trai_thuong').value;
        payload.tmh_tai_trai_tham = document.getElementById('ex-tmh_tai_trai_tham').value;
        payload.tmh_tai_phai_thuong = document.getElementById('ex-tmh_tai_phai_thuong').value;
        payload.tmh_tai_phai_tham = document.getElementById('ex-tmh_tai_phai_tham').value;
        payload.tmh_benh = document.getElementById('ex-tmh_benh').value;
        payload.tmh_phan_loai = document.getElementById('ex-tmh_phan_loai').value;
        payload.tmh_bac_sy = document.getElementById('ex-tmh_bac_sy').value;
        window.RoomManager.saveDoctor('tmh', payload.tmh_bac_sy);
      } else if (currentRoomId === 'rhm') {
        payload.rhm_ham_tren = document.getElementById('ex-rhm_ham_tren').value;
        payload.rhm_ham_duoi = document.getElementById('ex-rhm_ham_duoi').value;
        payload.rhm_benh = document.getElementById('ex-rhm_benh').value;
        payload.rhm_phan_loai = document.getElementById('ex-rhm_phan_loai').value;
        payload.rhm_bac_sy = document.getElementById('ex-rhm_bac_sy').value;
        window.RoomManager.saveDoctor('rhm', payload.rhm_bac_sy);
      } else if (currentRoomId === 'noi') {
        payload.noi_ngay_kham = document.getElementById('ex-noi_ngay_kham').value;
        payload.noi_tuan_hoan = document.getElementById('ex-noi_tuan_hoan').value;
        payload.noi_pl_tuan_hoan = document.getElementById('ex-noi_pl_tuan_hoan').value;
        payload.noi_ho_hap = document.getElementById('ex-noi_ho_hap').value;
        payload.noi_pl_ho_hap = document.getElementById('ex-noi_pl_ho_hap').value;
        payload.noi_tieu_hoa = document.getElementById('ex-noi_tieu_hoa').value;
        payload.noi_pl_tieu_hoa = document.getElementById('ex-noi_pl_tieu_hoa').value;
        payload.noi_than_tiet_nieu = document.getElementById('ex-noi_than_tiet_nieu').value;
        payload.noi_pl_than_tiet_nieu = document.getElementById('ex-noi_pl_than_tiet_nieu').value;
        payload.noi_noi_tiet = document.getElementById('ex-noi_noi_tiet').value;
        payload.noi_pl_noi_tiet = document.getElementById('ex-noi_pl_noi_tiet').value;
        payload.noi_co_xuong_khop = document.getElementById('ex-noi_co_xuong_khop').value;
        payload.noi_pl_co_xuong_khop = document.getElementById('ex-noi_pl_co_xuong_khop').value;
        payload.noi_than_kinh = document.getElementById('ex-noi_than_kinh').value;
        payload.noi_pl_than_kinh = document.getElementById('ex-noi_pl_than_kinh').value;
        payload.noi_tam_than = document.getElementById('ex-noi_tam_than').value;
        payload.noi_pl_tam_than = document.getElementById('ex-noi_pl_tam_than').value;
        payload.noi_bac_sy = document.getElementById('ex-noi_bac_sy').value;
        window.RoomManager.saveDoctor('noi', payload.noi_bac_sy);
      } else if (currentRoomId === 'ngoai') {
        payload.ngoai_ket_qua = document.getElementById('ex-ngoai_ket_qua').value;
        payload.ngoai_phan_loai = document.getElementById('ex-ngoai_phan_loai').value;
        payload.ngoai_bac_sy = document.getElementById('ex-ngoai_bac_sy').value;
        window.RoomManager.saveDoctor('ngoai', payload.ngoai_bac_sy);
      } else if (currentRoomId === 'da_lieu') {
        payload.da_lieu_ket_qua = document.getElementById('ex-da_lieu_ket_qua').value;
        payload.da_lieu_phan_loai = document.getElementById('ex-da_lieu_phan_loai').value;
        payload.da_lieu_bac_sy = document.getElementById('ex-da_lieu_bac_sy').value;
        window.RoomManager.saveDoctor('da_lieu', payload.da_lieu_bac_sy);
      } else if (currentRoomId === 'san' && p.gioi_tinh === 2) {
        payload.san_phu_khoa_ket_qua = document.getElementById('ex-san_phu_khoa_ket_qua').value;
        payload.san_phu_khoa_phan_loai = document.getElementById('ex-san_phu_khoa_phan_loai').value;
        payload.san_phu_khoa_bac_sy = document.getElementById('ex-san_phu_khoa_bac_sy').value;
        window.RoomManager.saveDoctor('san', payload.san_phu_khoa_bac_sy);
      }
    }

    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        window.showToast('Đã lưu kết quả thành công!', 'success');
        if (window.App && window.App.selectNextPatient) {
          window.App.selectNextPatient();
        }
      } else {
        window.showToast(data.message || 'Lỗi lưu kết quả', 'error');
      }
    } catch (err) {
      window.showToast('Lỗi mạng: ' + err.message, 'error');
    }
  }

  // Bắt phím tắt Ctrl + S để lưu
  window.onSaveExamShortcut = () => {
    saveCurrentExam();
  };
}

window.ClinicExamModule = {
  renderClinicExamView
};
