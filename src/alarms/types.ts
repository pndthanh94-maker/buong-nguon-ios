/** 1 = Chủ nhật … 7 = Thứ bảy — trùng quy ước weekday của iOS và expo-notifications. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: Weekday[] = [2, 3, 4, 5, 6, 7, 1];

export const TEN_THU: Record<Weekday, string> = {
  1: 'Chủ nhật',
  2: 'Thứ hai',
  3: 'Thứ ba',
  4: 'Thứ tư',
  5: 'Thứ năm',
  6: 'Thứ sáu',
  7: 'Thứ bảy',
};

export const TEN_THU_NGAN: Record<Weekday, string> = {
  1: 'CN',
  2: 'T2',
  3: 'T3',
  4: 'T4',
  5: 'T5',
  6: 'T6',
  7: 'T7',
};

export interface Alarm {
  id: string;
  /** Nhãn hiện trên màn hình khi chuông kêu. */
  nhan: string;
  gio: number;
  phut: number;
  /** Rỗng = báo một lần duy nhất rồi tự tắt. */
  lapLai: Weekday[];
  bat: boolean;
  ringtoneId: string;
  hoanBat: boolean;
  hoanPhut: number;
  rung: boolean;
  /** Mốc epoch của lần kêu đã hẹn, chỉ dùng cho báo thức một lần để biết khi nào nên tự tắt. */
  motLanLuc: number | null;
  taoLuc: number;
}

/** Id nhạc chuông mặc định. Danh sách nhạc nằm ở ringtones.ts vì có kèm asset. */
export const RINGTONE_MAC_DINH_ID = 'chuong-co-dien';

export const HOAN_PHUT_LUA_CHON = [5, 9, 10, 15, 20, 30];

export function alarmMoi(): Alarm {
  const bayGio = new Date();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nhan: 'Báo thức',
    gio: (bayGio.getHours() + 1) % 24,
    phut: 0,
    lapLai: [],
    bat: true,
    ringtoneId: RINGTONE_MAC_DINH_ID,
    hoanBat: true,
    hoanPhut: 9,
    rung: true,
    motLanLuc: null,
    taoLuc: Date.now(),
  };
}
