import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { DuLieuThongBao } from '@/alarms/notifications';
import { timRingtone } from '@/alarms/ringtones';

const KHOA = 'bao-thuc:chuong-dinh-ky:v1';
const KENH_ANDROID = 'chuong-dinh-ky';

export const MOI_PHUT_LUA_CHON = [5, 10, 15, 20, 30, 60];
export const MOI_PHUT_MAC_DINH = 15;
export const RINGTONE_DINH_KY_ID = 'tieng-chuong';

/**
 * Chuông kêu cách nhau đúng `moiPhut`, đếm từ lúc người dùng bấm Bắt đầu —
 * không gắn với giờ nào trong ngày như báo thức.
 */
export interface ChuongDinhKy {
  dangChay: boolean;
  moiPhut: number;
  ringtoneId: string;
  /** Mốc epoch lúc bấm Bắt đầu. null = chưa chạy. */
  batLuc: number | null;
  rung: boolean;
}

export function macDinh(): ChuongDinhKy {
  return {
    dangChay: false,
    moiPhut: MOI_PHUT_MAC_DINH,
    ringtoneId: RINGTONE_DINH_KY_ID,
    batLuc: null,
    rung: true,
  };
}

/**
 * Mốc kêu kế tiếp, tính lại từ `batLuc` mỗi lần gọi.
 * Nhờ vậy đóng app rồi mở lại vẫn không bị lệch nhịp.
 */
export function lanKeTiep(chuong: ChuongDinhKy, bayGio: number = Date.now()): Date | null {
  if (!chuong.dangChay || chuong.batLuc === null) return null;
  const chuKy = chuong.moiPhut * 60 * 1000;
  const daKeu = Math.floor(Math.max(0, bayGio - chuong.batLuc) / chuKy);
  return new Date(chuong.batLuc + (daKeu + 1) * chuKy);
}

/** Số lần chuông đã kêu kể từ lúc bấm Bắt đầu. */
export function soLanDaKeu(chuong: ChuongDinhKy, bayGio: number = Date.now()): number {
  if (!chuong.dangChay || chuong.batLuc === null) return 0;
  const chuKy = chuong.moiPhut * 60 * 1000;
  return Math.floor(Math.max(0, bayGio - chuong.batLuc) / chuKy);
}

/** "12:34" — đếm ngược tới lần kêu kế tiếp. */
export function demNguoc(den: Date, bayGio: number = Date.now()): string {
  const giay = Math.max(0, Math.round((den.getTime() - bayGio) / 1000));
  return `${String(Math.floor(giay / 60)).padStart(2, '0')}:${String(giay % 60).padStart(2, '0')}`;
}

export function moTaMoiPhut(moiPhut: number): string {
  return moiPhut === 60 ? 'Mỗi 1 giờ' : `Mỗi ${moiPhut} phút`;
}

export function nhanNut(moiPhut: number): string {
  return moiPhut === 60 ? '1 giờ' : `${moiPhut}′`;
}

export async function tai(): Promise<ChuongDinhKy> {
  try {
    const chuoi = await AsyncStorage.getItem(KHOA);
    if (!chuoi) return macDinh();
    const o = JSON.parse(chuoi) as Record<string, unknown>;
    const batLuc = typeof o.batLuc === 'number' ? o.batLuc : null;
    return {
      // Thiếu mốc bắt đầu thì coi như chưa chạy, hơn là đếm từ số rác.
      dangChay: o.dangChay === true && batLuc !== null,
      moiPhut:
        typeof o.moiPhut === 'number' && MOI_PHUT_LUA_CHON.includes(o.moiPhut)
          ? o.moiPhut
          : MOI_PHUT_MAC_DINH,
      ringtoneId: typeof o.ringtoneId === 'string' ? o.ringtoneId : RINGTONE_DINH_KY_ID,
      batLuc,
      rung: o.rung !== false,
    };
  } catch {
    return macDinh();
  }
}

export async function luu(chuong: ChuongDinhKy): Promise<void> {
  await AsyncStorage.setItem(KHOA, JSON.stringify(chuong));
}

/**
 * Một notification lặp vô hạn là phần xương sống: nó vẫn nổ đúng nhịp khi app
 * bị treo ở nền hoặc bị tắt hẳn. Lúc app đang mở thì store phát bản mp3 đầy đủ
 * và handler trong notifications.ts tắt tiếng cái này đi.
 */
export async function lenLich(chuong: ChuongDinhKy): Promise<void> {
  await huyLich();
  if (!chuong.dangChay) return;

  const ringtone = timRingtone(chuong.ringtoneId);
  const rung = chuong.rung ? [0, 250] : undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(KENH_ANDROID, {
      name: 'Chuông định kỳ',
      importance: AndroidImportance.DEFAULT,
      sound: ringtone.fileName,
      vibrationPattern: rung,
    });
  }

  const duLieu: DuLieuThongBao = { kieu: 'dinh-ky' };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: ringtone.ten,
      body: moTaMoiPhut(chuong.moiPhut),
      sound: ringtone.fileName,
      interruptionLevel: 'timeSensitive',
      data: duLieu as unknown as Record<string, unknown>,
      vibrate: rung,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: chuong.moiPhut * 60,
      repeats: true,
      channelId: KENH_ANDROID,
    },
  });
}

export async function huyLich(): Promise<void> {
  const dangCho = await Notifications.getAllScheduledNotificationsAsync();
  for (const item of dangCho) {
    const duLieu = item.content.data as Partial<DuLieuThongBao> | undefined;
    if (duLieu?.kieu === 'dinh-ky') {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}
