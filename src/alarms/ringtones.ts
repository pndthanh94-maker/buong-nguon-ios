import { RINGTONE_MAC_DINH_ID } from './types';

export interface Ringtone {
  id: string;
  ten: string;
  /** Tên file dùng cho notification (iOS chỉ nhận basename). */
  fileName: string;
  /** Asset để phát trong app bằng expo-audio. */
  asset: number;
}

export const RINGTONES: Ringtone[] = [
  {
    id: 'chuong-co-dien',
    ten: 'Chuông cổ điển',
    fileName: 'chuong-co-dien.wav',
    asset: require('../../assets/sounds/chuong-co-dien.wav'),
  },
  {
    id: 'binh-minh',
    ten: 'Bình minh',
    fileName: 'binh-minh.wav',
    asset: require('../../assets/sounds/binh-minh.wav'),
  },
  {
    // Notification của iOS chỉ phát được file dưới 30 giây, nên fileName trỏ vào
    // bản wav cắt 24 giây; trong app thì phát bản mp3 nguyên 61 giây.
    id: 'tieng-chuong',
    ten: 'Tiếng chuông',
    fileName: 'tieng-chuong.wav',
    asset: require('../../assets/sounds/tieng-chuong.mp3'),
  },
];

export const RINGTONE_MAC_DINH =
  RINGTONES.find((r) => r.id === RINGTONE_MAC_DINH_ID) ?? RINGTONES[0];

export function timRingtone(id: string | null | undefined): Ringtone {
  return RINGTONES.find((r) => r.id === id) ?? RINGTONE_MAC_DINH;
}
