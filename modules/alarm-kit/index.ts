import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export type TrangThaiQuyen = 'da-cho-phep' | 'tu-choi' | 'chua-hoi' | 'khong-ho-tro';

export interface ThongSoBaoThuc {
  id: string;
  gio: number;
  phut: number;
  /** 1 = Chủ nhật … 7 = Thứ bảy. Rỗng = báo một lần. */
  thuLapLai: number[];
  nhan: string;
  chuNutTat: string;
  chuNutHoan: string;
  hoanBat: boolean;
  hoanPhut: number;
  mauChu: string;
}

interface AlarmKitNative {
  coTheDung(): boolean;
  trangThaiQuyen(): Promise<TrangThaiQuyen>;
  xinQuyen(): Promise<boolean>;
  lenLich(thongSo: ThongSoBaoThuc): Promise<string>;
  huy(id: string): Promise<void>;
  huyNhieu(ids: string[]): Promise<void>;
  tat(id: string): Promise<void>;
}

/**
 * Trong Expo Go không có native module này, nên `native` sẽ là null —
 * mọi hàm bên dưới tự lùi về trạng thái "không hỗ trợ" thay vì làm app chết.
 */
const native = requireOptionalNativeModule<AlarmKitNative>('AlarmKit');

export function coAlarmKit(): boolean {
  if (Platform.OS !== 'ios' || !native) return false;
  try {
    return native.coTheDung();
  } catch {
    return false;
  }
}

export async function trangThaiQuyen(): Promise<TrangThaiQuyen> {
  if (!coAlarmKit()) return 'khong-ho-tro';
  return native!.trangThaiQuyen();
}

export async function xinQuyen(): Promise<boolean> {
  if (!coAlarmKit()) return false;
  try {
    return await native!.xinQuyen();
  } catch {
    return false;
  }
}

export async function lenLich(thongSo: ThongSoBaoThuc): Promise<string | null> {
  if (!coAlarmKit()) return null;
  return native!.lenLich(thongSo);
}

export async function huy(id: string): Promise<void> {
  if (!coAlarmKit()) return;
  await native!.huy(id);
}

export async function huyNhieu(ids: string[]): Promise<void> {
  if (!coAlarmKit() || ids.length === 0) return;
  await native!.huyNhieu(ids);
}

export async function tat(id: string): Promise<void> {
  if (!coAlarmKit()) return;
  await native!.tat(id);
}

export default {
  coAlarmKit,
  trangThaiQuyen,
  xinQuyen,
  lenLich,
  huy,
  huyNhieu,
  tat,
};
