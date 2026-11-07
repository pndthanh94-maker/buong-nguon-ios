/**
 * Chuông định kỳ cho Windows.
 *
 * Cách tính giờ giống hệt bản điện thoại: mốc kêu luôn tính lại từ `batLuc`
 * chứ không cộng dồn, nên đóng app rồi mở lại vẫn đúng nhịp tuyệt đối.
 */

const MOC_PHUT = [1, 5, 10, 15, 20, 30];
const MOC_MAC_DINH = 15;
const KHOA = 'buong:trang-thai:v1';

const o = {
  dem: document.getElementById('dem'),
  demPhu: document.getElementById('demPhu'),
  phuDe: document.getElementById('phuDe'),
  chip: document.getElementById('chip'),
  nut: document.getElementById('nut'),
  ngheThu: document.getElementById('ngheThu'),
  chuong: document.getElementById('chuong'),
};

/** @type {{dangChay: boolean, moiPhut: number, batLuc: number | null}} */
let trangThai = tai();
/** Số lần đã xử lý, để mỗi mốc chỉ kêu đúng một lần. */
let daXuLy = soLanDaKeu(trangThai);

function macDinh() {
  return { dangChay: false, moiPhut: MOC_MAC_DINH, batLuc: null };
}

function tai() {
  try {
    const chuoi = localStorage.getItem(KHOA);
    if (!chuoi) return macDinh();
    const d = JSON.parse(chuoi);
    const batLuc = typeof d.batLuc === 'number' ? d.batLuc : null;
    return {
      // Thiếu mốc bắt đầu thì coi như chưa chạy, hơn là đếm từ số rác.
      dangChay: d.dangChay === true && batLuc !== null,
      moiPhut: MOC_PHUT.includes(d.moiPhut) ? d.moiPhut : MOC_MAC_DINH,
      batLuc,
    };
  } catch {
    return macDinh();
  }
}

function luu() {
  try {
    localStorage.setItem(KHOA, JSON.stringify(trangThai));
  } catch (loi) {
    console.warn('[buong] Không lưu được trạng thái', loi);
  }
}

function chuKy() {
  return trangThai.moiPhut * 60 * 1000;
}

function soLanDaKeu(t, bayGio = Date.now()) {
  if (!t.dangChay || t.batLuc === null) return 0;
  return Math.floor(Math.max(0, bayGio - t.batLuc) / (t.moiPhut * 60 * 1000));
}

function lanKeTiep(bayGio = Date.now()) {
  if (!trangThai.dangChay || trangThai.batLuc === null) return null;
  const daKeu = soLanDaKeu(trangThai, bayGio);
  return trangThai.batLuc + (daKeu + 1) * chuKy();
}

function demNguoc(den, bayGio = Date.now()) {
  const giay = Math.max(0, Math.round((den - bayGio) / 1000));
  const phut = String(Math.floor(giay / 60)).padStart(2, '0');
  return `${phut}:${String(giay % 60).padStart(2, '0')}`;
}

function keu() {
  o.chuong.currentTime = 0;
  const hua = o.chuong.play();
  if (hua && typeof hua.catch === 'function') {
    hua.catch((loi) => console.warn('[buong] Không phát được tiếng chuông', loi));
  }
}

function dungNhacNgay() {
  o.chuong.pause();
  o.chuong.currentTime = 0;
}

function veChip() {
  o.chip.replaceChildren();
  for (const phut of MOC_PHUT) {
    const b = document.createElement('button');
    b.textContent = `${phut}′`;
    b.className = phut === trangThai.moiPhut ? 'chon' : '';
    b.addEventListener('click', () => doiMoc(phut));
    o.chip.append(b);
  }
}

function ve() {
  const bayGio = Date.now();
  const ke = lanKeTiep(bayGio);

  o.dem.textContent = ke ? demNguoc(ke, bayGio) : '--:--';
  o.demPhu.textContent = trangThai.dangChay
    ? `đã kêu ${soLanDaKeu(trangThai, bayGio)} lần`
    : 'chưa chạy';
  o.phuDe.textContent = `Mỗi ${trangThai.moiPhut} phút, đếm từ lúc bấm Bắt đầu`;

  o.nut.textContent = trangThai.dangChay ? 'Dừng' : 'Bắt đầu';
  o.nut.className = trangThai.dangChay ? 'nut nut-dung' : 'nut nut-bat';

  for (const b of o.chip.children) {
    b.className = b.textContent === `${trangThai.moiPhut}′` ? 'chon' : '';
  }
}

function capNhatKhoaNgu() {
  window.buong?.dangChay(trangThai.dangChay);
}

function batDau() {
  daXuLy = 0;
  trangThai = { ...trangThai, dangChay: true, batLuc: Date.now() };
  luu();
  capNhatKhoaNgu();
  ve();
}

function dungLai() {
  daXuLy = 0;
  dungNhacNgay();
  trangThai = { ...trangThai, dangChay: false, batLuc: null };
  luu();
  capNhatKhoaNgu();
  ve();
}

function doiMoc(phut) {
  // Đổi mốc lúc đang chạy thì đếm lại từ bây giờ, cho khỏi lệch nhịp.
  daXuLy = 0;
  trangThai = {
    ...trangThai,
    moiPhut: phut,
    batLuc: trangThai.dangChay ? Date.now() : trangThai.batLuc,
  };
  luu();
  ve();
}

o.nut.addEventListener('click', () => (trangThai.dangChay ? dungLai() : batDau()));
o.ngheThu.addEventListener('click', keu);

// Nhịp 1 giây: vừa chạy đồng hồ đếm ngược, vừa canh mốc kêu.
setInterval(() => {
  if (trangThai.dangChay) {
    const lan = soLanDaKeu(trangThai);
    if (lan > daXuLy) {
      daXuLy = lan;
      keu();
    }
  }
  ve();
}, 1000);

veChip();
ve();
capNhatKhoaNgu();
