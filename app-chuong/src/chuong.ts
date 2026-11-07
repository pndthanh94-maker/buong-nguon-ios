import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Các mốc chuông. Mốc 1 phút nằm đúng ở ranh giới iOS cho phép:
 * notification lặp bắt buộc chu kỳ từ 60 giây trở lên, không thấp hơn được.
 */
export const MOC_PHUT = [1, 5, 10, 15, 20, 30];
export const MOC_MAC_DINH = 15;

/**
 * iOS chỉ nhận tên file, không nhận đường dẫn, và bỏ qua file dài quá 30 giây
 * nên phải dùng bản cắt 24 giây. Android không có giới hạn đó nên dùng bản đủ
 * 69 giây — đây là lý do tiếng chuông trước kia bị cụt.
 *
 * Tên dùng gạch dưới chứ không gạch ngang: tài nguyên Android chỉ nhận
 * a-z, 0-9 và _ — có gạch ngang là prebuild ném lỗi ngay.
 */
const FILE_CHUONG = Platform.OS === 'android' ? 'tieng_chuong_dai.wav' : 'tieng_chuong.wav';

/**
 * Bật khi app đang tự phát tiếng bằng expo-audio. Lúc đó phải tắt tiếng của
 * notification, nếu không sẽ nghe chồng hai lần.
 *
 * Handler bên dưới chỉ chạy được khi tiến trình app còn sống. App bị vuốt tắt
 * hẳn thì hệ thống tự phát tiếng notification — đúng như mong muốn.
 */
let dangTuPhat = false;

export function danhDauTuPhat(bat: boolean): void {
  dangTuPhat = bat;
}
const KHOA = 'chuong:trang-thai:v1';
const KENH_ANDROID = 'chuong-dinh-ky';
const RUNG = [0, 250];

/**
 * Chuông kêu cách nhau đúng `moiPhut`, đếm từ lúc bấm Bắt đầu —
 * không gắn với giờ nào trong ngày.
 */
export interface TrangThai {
  dangChay: boolean;
  moiPhut: number;
  /** Mốc epoch lúc bấm Bắt đầu. null = chưa chạy. */
  batLuc: number | null;
}

export function macDinh(): TrangThai {
  return { dangChay: false, moiPhut: MOC_MAC_DINH, batLuc: null };
}

/**
 * Mốc kêu kế tiếp, tính lại từ `batLuc` mỗi lần gọi.
 * Nhờ vậy đóng app rồi mở lại vẫn không lệch nhịp.
 */
export function lanKeTiep(t: TrangThai, bayGio: number = Date.now()): Date | null {
  if (!t.dangChay || t.batLuc === null) return null;
  const chuKy = t.moiPhut * 60 * 1000;
  const daKeu = Math.floor(Math.max(0, bayGio - t.batLuc) / chuKy);
  return new Date(t.batLuc + (daKeu + 1) * chuKy);
}

/** Số lần chuông đã kêu kể từ lúc bấm Bắt đầu. */
export function soLanDaKeu(t: TrangThai, bayGio: number = Date.now()): number {
  if (!t.dangChay || t.batLuc === null) return 0;
  const chuKy = t.moiPhut * 60 * 1000;
  return Math.floor(Math.max(0, bayGio - t.batLuc) / chuKy);
}

/** "12:34" — đếm ngược tới lần kêu kế tiếp. */
export function demNguoc(den: Date, bayGio: number = Date.now()): string {
  const giay = Math.max(0, Math.round((den.getTime() - bayGio) / 1000));
  return `${String(Math.floor(giay / 60)).padStart(2, '0')}:${String(giay % 60).padStart(2, '0')}`;
}

export function moTa(moiPhut: number): string {
  return `Mỗi ${moiPhut} phút`;
}

export async function tai(): Promise<TrangThai> {
  try {
    const chuoi = await AsyncStorage.getItem(KHOA);
    if (!chuoi) return macDinh();
    const o = JSON.parse(chuoi) as Record<string, unknown>;
    const batLuc = typeof o.batLuc === 'number' ? o.batLuc : null;
    return {
      // Thiếu mốc bắt đầu thì coi như chưa chạy, hơn là đếm từ số rác.
      dangChay: o.dangChay === true && batLuc !== null,
      moiPhut:
        typeof o.moiPhut === 'number' && MOC_PHUT.includes(o.moiPhut) ? o.moiPhut : MOC_MAC_DINH,
      batLuc,
    };
  } catch {
    return macDinh();
  }
}

export async function luu(t: TrangThai): Promise<void> {
  await AsyncStorage.setItem(KHOA, JSON.stringify(t));
}

export function caiDatCachHienThi(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => {
      // Hook đang tự phát thì tắt tiếng notification để khỏi nghe chồng.
      return {
        shouldPlaySound: !dangTuPhat,
        shouldShowBanner: !dangTuPhat,
        shouldShowList: true,
        shouldSetBadge: false,
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

/**
 * Một notification lặp vô hạn là phần xương sống: nó vẫn nổ đúng nhịp khi app
 * bị treo ở nền hoặc bị tắt hẳn. iOS bắt buộc chu kỳ từ 60 giây trở lên khi
 * repeats = true — mốc nhỏ nhất ở đây là 5 phút nên luôn thoả.
 */
export async function lenLich(t: TrangThai): Promise<void> {
  await huyLich();
  if (!t.dangChay) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(KENH_ANDROID, {
      name: 'Chuông định kỳ',
      importance: AndroidImportance.HIGH,
      sound: FILE_CHUONG,
      vibrationPattern: RUNG,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Buông',
      body: moTa(t.moiPhut),
      sound: FILE_CHUONG,
      interruptionLevel: 'timeSensitive',
      vibrate: RUNG,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: t.moiPhut * 60,
      repeats: true,
      channelId: KENH_ANDROID,
    },
  });
}

/** App này không có loại thông báo nào khác nên huỷ sạch là đúng. */
export async function huyLich(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
