import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { timRingtone } from '@/alarms/ringtones';

import * as DinhKy from './dinhky';

interface GiaTriBoiCanh {
  chuong: DinhKy.ChuongDinhKy;
  dangTai: boolean;
  lanKeTiep: Date | null;
  /** "12:34" — đếm ngược tới lần kêu kế tiếp. */
  conLai: string;
  soLanDaKeu: number;
  batDau: () => Promise<void>;
  dungLai: () => Promise<void>;
  doiMoiPhut: (moiPhut: number) => Promise<void>;
}

const BoiCanh = createContext<GiaTriBoiCanh | null>(null);

export function NhaCungCapChuong({ children }: { children: ReactNode }) {
  const [chuong, setChuong] = useState<DinhKy.ChuongDinhKy>(DinhKy.macDinh);
  const [dangTai, setDangTai] = useState(true);
  const [bayGio, setBayGio] = useState(() => Date.now());

  const nguoiPhat = useRef<AudioPlayer | null>(null);
  /** Số lần đã xử lý, để mỗi mốc chỉ kêu đúng một lần. */
  const daXuLy = useRef(0);

  const ringtone = timRingtone(chuong.ringtoneId);

  const ghiVaLenLich = useCallback(async (moi: DinhKy.ChuongDinhKy) => {
    setChuong(moi);
    await DinhKy.luu(moi);
    try {
      await DinhKy.lenLich(moi);
    } catch (loi) {
      // Chưa cấp quyền thông báo thì vẫn giữ trạng thái đã bật: lúc app đang mở
      // chuông vẫn kêu được bằng expo-audio.
      console.warn('[chuong] Không lên lịch thông báo được', loi);
    }
  }, []);

  useEffect(() => {
    let huy = false;
    (async () => {
      const daLuu = await DinhKy.tai();
      if (huy) return;
      // Đang chạy từ phiên trước thì bỏ qua các mốc đã trôi qua, không kêu dồn.
      daXuLy.current = DinhKy.soLanDaKeu(daLuu);
      setChuong(daLuu);
      setDangTai(false);
    })().catch((loi) => {
      console.warn('[chuong] Không đọc được chuông định kỳ', loi);
      setDangTai(false);
    });
    return () => {
      huy = true;
    };
  }, []);

  // Một người phát cho mỗi nhạc chuông, dùng lại cho mọi lần kêu.
  useEffect(() => {
    const may = createAudioPlayer(ringtone.asset);
    may.volume = 1;
    nguoiPhat.current = may;
    return () => {
      nguoiPhat.current = null;
      may.remove();
    };
  }, [ringtone.asset]);

  const keu = useCallback(async () => {
    const may = nguoiPhat.current;
    if (!may) return;
    try {
      // Đặt lại ngay trước khi phát, vì màn hình báo thức có thể đã đổi chế độ
      // âm thanh sang doNotMix trước đó.
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers',
      });
    } catch (loi) {
      console.warn('[chuong] Không đặt được chế độ âm thanh', loi);
    }
    try {
      await may.seekTo(0);
    } catch {
      // Chưa nạp xong thì cứ phát từ đầu.
    }
    may.play();
    if (chuong.rung && Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [chuong.rung]);

  // Nhịp 1 giây: vừa chạy đồng hồ đếm ngược, vừa canh mốc kêu.
  useEffect(() => {
    if (!chuong.dangChay) return;

    const nhip = setInterval(() => {
      const moc = Date.now();
      setBayGio(moc);

      const lan = DinhKy.soLanDaKeu(chuong, moc);
      if (lan <= daXuLy.current) return;
      daXuLy.current = lan;
      // Ở nền thì notification lặp đã lo phần tiếng, phát thêm sẽ nghe trùng.
      if (AppState.currentState === 'active') void keu();
    }, 1000);

    return () => clearInterval(nhip);
  }, [chuong, keu]);

  // Quay lại app: bỏ qua những mốc đã kêu bằng notification lúc ở nền.
  useEffect(() => {
    const dangKy = AppState.addEventListener('change', (trangThai) => {
      if (trangThai !== 'active') return;
      daXuLy.current = DinhKy.soLanDaKeu(chuong);
      setBayGio(Date.now());
    });
    return () => dangKy.remove();
  }, [chuong]);

  const batDau = useCallback(async () => {
    daXuLy.current = 0;
    await ghiVaLenLich({ ...chuong, dangChay: true, batLuc: Date.now() });
  }, [chuong, ghiVaLenLich]);

  const dungLai = useCallback(async () => {
    daXuLy.current = 0;
    nguoiPhat.current?.pause();
    await ghiVaLenLich({ ...chuong, dangChay: false, batLuc: null });
  }, [chuong, ghiVaLenLich]);

  const doiMoiPhut = useCallback(
    async (moiPhut: number) => {
      // Đổi khoảng cách lúc đang chạy thì đếm lại từ bây giờ, cho khỏi lệch nhịp.
      daXuLy.current = 0;
      await ghiVaLenLich({
        ...chuong,
        moiPhut,
        batLuc: chuong.dangChay ? Date.now() : chuong.batLuc,
      });
    },
    [chuong, ghiVaLenLich]
  );

  const giaTri = useMemo<GiaTriBoiCanh>(() => {
    const ke = DinhKy.lanKeTiep(chuong, bayGio);
    return {
      chuong,
      dangTai,
      lanKeTiep: ke,
      conLai: ke ? DinhKy.demNguoc(ke, bayGio) : '--:--',
      soLanDaKeu: DinhKy.soLanDaKeu(chuong, bayGio),
      batDau,
      dungLai,
      doiMoiPhut,
    };
  }, [chuong, dangTai, bayGio, batDau, dungLai, doiMoiPhut]);

  return <BoiCanh.Provider value={giaTri}>{children}</BoiCanh.Provider>;
}

export function useChuongDinhKy(): GiaTriBoiCanh {
  const giaTri = useContext(BoiCanh);
  if (!giaTri) throw new Error('useChuongDinhKy phải nằm trong <NhaCungCapChuong>');
  return giaTri;
}
