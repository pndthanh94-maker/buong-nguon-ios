import AsyncStorage from '@react-native-async-storage/async-storage';

import { Alarm, RINGTONE_MAC_DINH_ID, Weekday } from './types';

const KHOA = 'bao-thuc:danh-sach:v1';

function doc(raw: unknown): Alarm | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string') return null;
  if (typeof o.gio !== 'number' || typeof o.phut !== 'number') return null;

  const lapLai = Array.isArray(o.lapLai)
    ? (o.lapLai.filter((t) => typeof t === 'number' && t >= 1 && t <= 7) as Weekday[])
    : [];

  return {
    id: o.id,
    nhan: typeof o.nhan === 'string' ? o.nhan : 'Báo thức',
    gio: Math.min(23, Math.max(0, Math.floor(o.gio))),
    phut: Math.min(59, Math.max(0, Math.floor(o.phut))),
    lapLai,
    bat: o.bat !== false,
    ringtoneId: typeof o.ringtoneId === 'string' ? o.ringtoneId : RINGTONE_MAC_DINH_ID,
    hoanBat: o.hoanBat !== false,
    hoanPhut: typeof o.hoanPhut === 'number' ? o.hoanPhut : 9,
    rung: o.rung !== false,
    motLanLuc: typeof o.motLanLuc === 'number' ? o.motLanLuc : null,
    taoLuc: typeof o.taoLuc === 'number' ? o.taoLuc : Date.now(),
  };
}

export async function taiDanhSach(): Promise<Alarm[]> {
  try {
    const chuoi = await AsyncStorage.getItem(KHOA);
    if (!chuoi) return [];
    const parsed: unknown = JSON.parse(chuoi);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(doc).filter((a): a is Alarm => a !== null);
  } catch {
    // Dữ liệu hỏng thì coi như chưa có báo thức nào, hơn là làm app chết lúc mở.
    return [];
  }
}

export async function luuDanhSach(danhSach: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(KHOA, JSON.stringify(danhSach));
}
