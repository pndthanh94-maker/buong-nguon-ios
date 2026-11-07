import * as AlarmKit from '@modules/alarm-kit';

import * as ThongBao from './notifications';
import { Alarm } from './types';

export type CheDo = 'alarmkit' | 'thong-bao';

export interface TinhTrang {
  cheDo: CheDo;
  coQuyen: boolean;
}

export const MAU_NHAN = '#FF375F';

/**
 * iOS 26 trở lên (và đã build dev build) thì dùng AlarmKit — chuông kêu thật,
 * vượt chế độ im lặng. Còn lại lùi về thông báo thường.
 */
export function cheDoHienTai(): CheDo {
  return AlarmKit.coAlarmKit() ? 'alarmkit' : 'thong-bao';
}

function sangThongSoAlarmKit(alarm: Alarm): AlarmKit.ThongSoBaoThuc {
  return {
    id: alarm.id,
    gio: alarm.gio,
    phut: alarm.phut,
    thuLapLai: alarm.lapLai,
    nhan: alarm.nhan || 'Báo thức',
    chuNutTat: 'Tắt',
    chuNutHoan: `Hoãn ${alarm.hoanPhut} phút`,
    hoanBat: alarm.hoanBat,
    hoanPhut: alarm.hoanPhut,
    mauChu: MAU_NHAN,
  };
}

export async function chuanBi(): Promise<TinhTrang> {
  const cheDo = cheDoHienTai();

  if (cheDo === 'alarmkit') {
    // Chuông định kỳ luôn chạy bằng notification, kể cả khi báo thức dùng AlarmKit,
    // nên handler hiển thị phải được cài trong cả hai chế độ.
    ThongBao.caiDatCachHienThi();
    const trangThai = await AlarmKit.trangThaiQuyen();
    const coQuyen =
      trangThai === 'da-cho-phep' ? true : trangThai === 'chua-hoi' ? await AlarmKit.xinQuyen() : false;
    // Vẫn xin quyền thông báo: dùng cho phần nhắc nhở phụ và cho máy chưa lên iOS 26.
    await boQuaLoi('xin quyền thông báo', () => ThongBao.xinQuyen().then(() => undefined));
    return { cheDo, coQuyen };
  }

  let coQuyen = false;
  await boQuaLoi('chuẩn bị thông báo', async () => {
    ThongBao.caiDatCachHienThi();
    coQuyen = await ThongBao.xinQuyen();
    if (coQuyen) await ThongBao.dangKyNutBam();
  });
  return { cheDo, coQuyen };
}

/**
 * Hệ thống từ chối lên lịch (chưa cấp quyền, hết suất thông báo, chạy trên web…)
 * thì chỉ ghi log. Báo thức người dùng vừa nhập vẫn phải được lưu và màn hình vẫn phải đi tiếp.
 */
async function boQuaLoi(viec: string, chay: () => Promise<void>): Promise<void> {
  try {
    await chay();
  } catch (loi) {
    console.warn(`[bao-thuc] Không ${viec} được`, loi);
  }
}

/** Đẩy toàn bộ danh sách xuống hệ thống. Gọi lại sau mỗi lần thêm/sửa/xoá/bật/tắt. */
export async function dongBo(danhSach: Alarm[]): Promise<void> {
  await boQuaLoi('đồng bộ lịch báo thức', async () => {
    if (cheDoHienTai() === 'alarmkit') {
      await AlarmKit.huyNhieu(danhSach.map((a) => a.id));
      for (const alarm of danhSach.filter((a) => a.bat)) {
        try {
          await AlarmKit.lenLich(sangThongSoAlarmKit(alarm));
        } catch (loi) {
          console.warn('[bao-thuc] AlarmKit không đặt được báo thức', alarm.id, loi);
        }
      }
      return;
    }

    await ThongBao.lenLichLai(danhSach);
  });
}

export async function huyMot(alarm: Alarm): Promise<void> {
  await boQuaLoi('huỷ lịch', async () => {
    if (cheDoHienTai() === 'alarmkit') {
      await AlarmKit.huy(alarm.id);
      return;
    }
    await ThongBao.huyMotBaoThuc(alarm.id);
  });
}

export async function hoanLai(alarm: Alarm): Promise<void> {
  await boQuaLoi('hoãn báo thức', async () => {
    if (cheDoHienTai() === 'alarmkit') {
      // AlarmKit tự lo phần hoãn qua nút Hoãn trên màn khoá.
      return;
    }
    await ThongBao.henHoan(alarm, alarm.hoanPhut);
  });
}

export async function tatChuong(alarm: Alarm): Promise<void> {
  await boQuaLoi('tắt chuông', async () => {
    if (cheDoHienTai() === 'alarmkit') {
      await AlarmKit.tat(alarm.id);
      return;
    }
    await ThongBao.tatLanKeuHienTai(alarm.id);
  });
}
