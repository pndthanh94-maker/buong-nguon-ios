import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { congPhut, lanKeTiep } from './schedule';
import { timRingtone } from './ringtones';
import { Alarm } from './types';

export const DANH_MUC = 'bao-thuc';
export const ACTION_HOAN = 'hoan';
export const ACTION_TAT = 'tat';

const KENH_ANDROID = 'bao-thuc';

/** iOS cho tối đa 64 thông báo chờ; chừa chỗ cho các lần hoãn phát sinh. */
const NGAN_SACH_PENDING = 56;
const SO_LAN_NHAC_LAI = 3;
const CACH_NHAU_PHUT = 1;

export interface DuLieuThongBao {
  /** Không có với chuông định kỳ, vì nó không gắn với báo thức nào. */
  alarmId?: string;
  kieu: 'bao-thuc' | 'hoan' | 'dinh-ky';
}

export function caiDatCachHienThi(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (thongBao) => {
      const duLieu = thongBao.request.content.data as Partial<DuLieuThongBao> | undefined;
      // Chuông định kỳ: lúc app đang mở thì store tự phát bản mp3 đầy đủ,
      // nên phải tắt tiếng notification để khỏi nghe trùng hai lần.
      const ngheTrung = duLieu?.kieu === 'dinh-ky' && AppState.currentState === 'active';
      return {
        shouldPlaySound: !ngheTrung,
        shouldSetBadge: false,
        shouldShowBanner: !ngheTrung,
        shouldShowList: true,
      };
    },
  });
}

export async function xinQuyen(): Promise<boolean> {
  const hienTai = await Notifications.getPermissionsAsync();
  if (hienTai.granted) return true;

  const ketQua = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return ketQua.granted;
}

/** Hai nút Hoãn / Tắt hiện ngay trên thông báo ở màn khoá. */
export async function dangKyNutBam(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(DANH_MUC, [
    { identifier: ACTION_HOAN, buttonTitle: 'Hoãn', options: { opensAppToForeground: false } },
    { identifier: ACTION_TAT, buttonTitle: 'Tắt', options: { opensAppToForeground: false } },
  ]);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(KENH_ANDROID, {
      name: 'Báo thức',
      importance: AndroidImportance.MAX,
      sound: 'chuong-co-dien.wav',
      vibrationPattern: [0, 400, 200, 400],
      bypassDnd: true,
    });
  }
}

function noiDung(alarm: Alarm, kieu: DuLieuThongBao['kieu']) {
  const ringtone = timRingtone(alarm.ringtoneId);
  const duLieu: DuLieuThongBao = { alarmId: alarm.id, kieu };
  return {
    title: alarm.nhan || 'Báo thức',
    body: kieu === 'hoan' ? 'Hết giờ hoãn — dậy thôi!' : 'Đã đến giờ dậy',
    sound: ringtone.fileName,
    categoryIdentifier: alarm.hoanBat ? DANH_MUC : undefined,
    interruptionLevel: 'timeSensitive' as const,
    data: duLieu as unknown as Record<string, unknown>,
    vibrate: alarm.rung ? [0, 400, 200, 400] : undefined,
  };
}

/**
 * iOS chỉ phát chuông khoảng 30 giây cho mỗi thông báo, nên mỗi lần báo thức
 * được xếp thành vài thông báo cách nhau 1 phút để tiếng chuông dai hơn.
 */
async function lenLichMotBaoThuc(alarm: Alarm, soLanNhac: number): Promise<void> {
  if (!alarm.bat) return;

  if (alarm.lapLai.length === 0) {
    const moc = lanKeTiep(alarm);
    if (!moc) return;
    for (let i = 0; i < soLanNhac; i++) {
      const khi = new Date(moc.getTime() + i * CACH_NHAU_PHUT * 60 * 1000);
      await Notifications.scheduleNotificationAsync({
        content: noiDung(alarm, 'bao-thuc'),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: khi,
          channelId: KENH_ANDROID,
        },
      });
    }
    return;
  }

  for (const thu of alarm.lapLai) {
    for (let i = 0; i < soLanNhac; i++) {
      const diem = congPhut(thu, alarm.gio, alarm.phut, i * CACH_NHAU_PHUT);
      await Notifications.scheduleNotificationAsync({
        content: noiDung(alarm, 'bao-thuc'),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: diem.thu,
          hour: diem.gio,
          minute: diem.phut,
          channelId: KENH_ANDROID,
        },
      });
    }
  }
}

/**
 * Chỉ huỷ lịch của báo thức, giữ nguyên lịch chuông định kỳ.
 * Nếu huỷ sạch thì mỗi lần thêm/sửa báo thức sẽ làm chuông định kỳ tắt ngang.
 */
export async function huyLichBaoThuc(): Promise<void> {
  const dangCho = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of dangCho) {
    const duLieu = item.content.data as Partial<DuLieuThongBao> | undefined;
    if (duLieu?.kieu === 'dinh-ky') continue;
    await Notifications.cancelScheduledNotificationAsync(item.identifier);
  }
}

/** Huỷ mọi thông báo đang chờ của riêng một báo thức (kể cả thông báo hoãn). */
export async function huyMotBaoThuc(alarmId: string): Promise<void> {
  const dangCho = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of dangCho) {
    const duLieu = item.content.data as Partial<DuLieuThongBao> | undefined;
    if (duLieu?.alarmId === alarmId) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}

/**
 * Xếp lại toàn bộ lịch cho đúng danh sách hiện tại.
 * Số lần nhắc lại bị co lại nếu người dùng đặt quá nhiều báo thức.
 */
export async function lenLichLai(danhSach: Alarm[]): Promise<void> {
  await huyLichBaoThuc();

  const dangBat = danhSach.filter((a) => a.bat);
  const soCho = dangBat.reduce((tong, a) => tong + Math.max(1, a.lapLai.length), 0);
  if (soCho === 0) return;

  let soLanNhac = SO_LAN_NHAC_LAI;
  while (soLanNhac > 1 && soCho * soLanNhac > NGAN_SACH_PENDING) soLanNhac -= 1;

  for (const alarm of dangBat) {
    await lenLichMotBaoThuc(alarm, soLanNhac);
  }
}

/** Hẹn lại sau N phút khi người dùng bấm Hoãn. */
export async function henHoan(alarm: Alarm, phut: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: noiDung(alarm, 'hoan'),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, phut * 60),
      repeats: false,
      channelId: KENH_ANDROID,
    },
  });
}

/** Gỡ các thông báo còn lại của lần kêu hiện tại khi người dùng bấm Tắt. */
export async function tatLanKeuHienTai(alarmId: string): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();

  const dangCho = await Notifications.getAllScheduledNotificationsAsync();
  const bayGio = Date.now();
  for (const item of dangCho) {
    const duLieu = item.content.data as Partial<DuLieuThongBao> | undefined;
    if (duLieu?.alarmId !== alarmId) continue;

    const trigger = item.trigger as { type?: string; value?: number } | null;
    // Chỉ dọn thông báo nhắc lại sắp nổ trong vài phút tới, giữ nguyên lịch tuần.
    if (trigger?.type === 'date' && typeof trigger.value === 'number') {
      if (trigger.value - bayGio < 10 * 60 * 1000) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  }
}
