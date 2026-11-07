import { Alarm, TEN_THU_NGAN, Weekday } from './types';

const PHUT = 60 * 1000;

export function hhmm(gio: number, phut: number): string {
  return `${String(gio).padStart(2, '0')}:${String(phut).padStart(2, '0')}`;
}

/** Lần kêu kế tiếp tính từ `moc` (mặc định: bây giờ). Trả về null nếu báo thức đã tắt. */
export function lanKeTiep(alarm: Alarm, moc: Date = new Date()): Date | null {
  if (!alarm.bat) return null;

  const ungVien = new Date(moc);
  ungVien.setHours(alarm.gio, alarm.phut, 0, 0);

  if (alarm.lapLai.length === 0) {
    // Báo một lần: nếu giờ hôm nay đã trôi qua thì đẩy sang ngày mai.
    if (ungVien.getTime() <= moc.getTime()) ungVien.setDate(ungVien.getDate() + 1);
    return ungVien;
  }

  for (let them = 0; them < 8; them++) {
    const ngay = new Date(ungVien);
    ngay.setDate(ngay.getDate() + them);
    const thu = (ngay.getDay() + 1) as Weekday;
    if (alarm.lapLai.includes(thu) && ngay.getTime() > moc.getTime()) return ngay;
  }
  return null;
}

/** "Còn 7 giờ 20 phút nữa" — dòng phụ hiện khi vừa bật báo thức. */
export function moTaConBaoLau(den: Date, moc: Date = new Date()): string {
  const conLai = Math.max(0, den.getTime() - moc.getTime());
  const tongPhut = Math.round(conLai / PHUT);
  const gio = Math.floor(tongPhut / 60);
  const phut = tongPhut % 60;

  if (tongPhut < 1) return 'Chuông sẽ kêu ngay bây giờ';
  if (gio === 0) return `Còn ${phut} phút nữa`;
  if (phut === 0) return `Còn ${gio} giờ nữa`;
  return `Còn ${gio} giờ ${phut} phút nữa`;
}

/** "Thứ hai, Thứ tư" · "Các ngày trong tuần" · "Một lần" */
export function moTaLapLai(lapLai: Weekday[]): string {
  if (lapLai.length === 0) return 'Một lần';
  if (lapLai.length === 7) return 'Hằng ngày';

  const sapXep = [...lapLai].sort((a, b) => thuTuHienThi(a) - thuTuHienThi(b));
  const laNgayLamViec = sapXep.length === 5 && sapXep.every((t) => t >= 2 && t <= 6);
  const laCuoiTuan = sapXep.length === 2 && sapXep.includes(7) && sapXep.includes(1);

  if (laNgayLamViec) return 'Thứ hai đến thứ sáu';
  if (laCuoiTuan) return 'Cuối tuần';
  return sapXep.map((t) => TEN_THU_NGAN[t]).join(', ');
}

/** Thứ hai đứng đầu tuần khi hiển thị, Chủ nhật đứng cuối. */
export function thuTuHienThi(thu: Weekday): number {
  return thu === 1 ? 7 : thu - 1;
}

export function cungNgay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Dịch (thứ, giờ, phút) đi `them` phút, tự nhảy sang thứ kế tiếp nếu qua nửa đêm. */
export function congPhut(thu: Weekday, gio: number, phut: number, them: number) {
  const tong = gio * 60 + phut + them;
  const quaNgay = Math.floor(tong / (24 * 60));
  const trongNgay = ((tong % (24 * 60)) + 24 * 60) % (24 * 60);
  const thuMoi = (((thu - 1 + quaNgay) % 7) + 7) % 7 + 1;
  return {
    thu: thuMoi as Weekday,
    gio: Math.floor(trongNgay / 60),
    phut: trongNgay % 60,
  };
}
