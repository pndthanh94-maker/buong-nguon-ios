import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import * as Chuong from './chuong';

/** Bản mp3 đầy đủ 69 giây. */
const NHAC = require('../assets/tieng_chuong.mp3');

/**
 * 10 giây im lặng, phát lặp suốt lúc chuông đang chạy.
 *
 * Đây là cách giữ cho tiến trình app sống ở nền: Android chỉ để app chạy tiếp
 * khi nó đang thực sự phát âm thanh. Không có nó thì hệ thống treo app, đồng hồ
 * đếm dừng, và tiếng chuông phải trông chờ vào notification — mà tiếng
 * notification thì bị nút âm lượng tắt ngang và phát ở luồng âm riêng.
 */
const IM_LANG = require('../assets/im_lang.wav');

export function useChuong() {
  const [trangThai, setTrangThai] = useState<Chuong.TrangThai>(Chuong.macDinh);
  const [dangTai, setDangTai] = useState(true);
  const [coQuyen, setCoQuyen] = useState(true);
  const [bayGio, setBayGio] = useState(() => Date.now());

  const nguoiPhat = useRef<AudioPlayer | null>(null);
  const giuSong = useRef<AudioPlayer | null>(null);
  /** Số lần đã xử lý, để mỗi mốc chỉ kêu đúng một lần. */
  const daXuLy = useRef(0);

  /**
   * Mở phiên âm thanh nền. Dòng `setActiveForLockScreen` là bắt buộc trên
   * Android — thiếu nó thì hệ điều hành cắt âm thanh nền sau khoảng 3 phút.
   */
  const batDauPhatNen = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        // Hạ nhạc đang nghe xuống rồi trả lại, thay vì ngắt hẳn.
        interruptionMode: 'duckOthers',
      });
    } catch (loi) {
      console.warn('[chuong] Không đặt được chế độ âm thanh', loi);
    }

    if (!giuSong.current) {
      const may = createAudioPlayer(IM_LANG);
      may.loop = true;
      may.volume = 1;
      giuSong.current = may;
    }

    giuSong.current.play();
    try {
      giuSong.current.setActiveForLockScreen(true, {
        title: 'Buông',
        artist: 'Chuông định kỳ',
      });
    } catch (loi) {
      console.warn('[chuong] Không bật được điều khiển màn khoá', loi);
    }
    Chuong.danhDauTuPhat(true);
  }, []);

  const dungPhatNen = useCallback(() => {
    Chuong.danhDauTuPhat(false);
    const may = giuSong.current;
    if (!may) return;
    try {
      may.clearLockScreenControls();
    } catch {
      // Chưa từng bật thì không có gì để gỡ.
    }
    may.pause();
  }, []);

  const ghiVaLenLich = useCallback(async (moi: Chuong.TrangThai) => {
    setTrangThai(moi);
    await Chuong.luu(moi);
    try {
      await Chuong.lenLich(moi);
    } catch (loi) {
      // Chưa cấp quyền thông báo thì vẫn giữ trạng thái đã bật: app vẫn tự phát
      // được, chỉ mất lớp dự phòng khi app bị tắt hẳn.
      console.warn('[chuong] Không lên lịch thông báo được', loi);
    }
  }, []);

  useEffect(() => {
    let huy = false;
    Chuong.caiDatCachHienThi();

    (async () => {
      const daLuu = await Chuong.tai();
      if (huy) return;
      // Đang chạy từ phiên trước thì bỏ qua các mốc đã trôi qua, không kêu dồn.
      daXuLy.current = Chuong.soLanDaKeu(daLuu);
      setTrangThai(daLuu);
      setDangTai(false);
      if (daLuu.dangChay) void batDauPhatNen();

      try {
        const duoc = await Chuong.xinQuyen();
        if (!huy) setCoQuyen(duoc);
      } catch (loi) {
        console.warn('[chuong] Không xin được quyền thông báo', loi);
        if (!huy) setCoQuyen(false);
      }
    })().catch((loi) => {
      console.warn('[chuong] Không đọc được trạng thái', loi);
      setDangTai(false);
    });

    return () => {
      huy = true;
    };
  }, [batDauPhatNen]);

  // Một người phát duy nhất cho tiếng chuông, dùng lại cho mọi lần kêu.
  useEffect(() => {
    const may = createAudioPlayer(NHAC);
    may.volume = 1;
    nguoiPhat.current = may;
    return () => {
      nguoiPhat.current = null;
      may.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      giuSong.current?.remove();
      giuSong.current = null;
    };
  }, []);

  const keu = useCallback(async () => {
    const may = nguoiPhat.current;
    if (!may) return;
    try {
      await may.seekTo(0);
    } catch {
      // Chưa nạp xong thì cứ phát từ đầu.
    }
    may.play();
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // Nhịp 1 giây: vừa chạy đồng hồ đếm ngược, vừa canh mốc kêu.
  useEffect(() => {
    if (!trangThai.dangChay) return;

    const nhip = setInterval(() => {
      const moc = Date.now();
      setBayGio(moc);

      const lan = Chuong.soLanDaKeu(trangThai, moc);
      if (lan <= daXuLy.current) return;
      daXuLy.current = lan;
      // Phát cả khi ở nền: phiên âm thanh nền giữ cho app còn sống.
      void keu();
    }, 1000);

    return () => clearInterval(nhip);
  }, [trangThai, keu]);

  // Quay lại app sau khi app từng bị hệ thống treo: bỏ qua các mốc đã lỡ.
  useEffect(() => {
    const dangKy = AppState.addEventListener('change', (tt) => {
      if (tt !== 'active') return;
      daXuLy.current = Chuong.soLanDaKeu(trangThai);
      setBayGio(Date.now());
    });
    return () => dangKy.remove();
  }, [trangThai]);

  const batDau = useCallback(async () => {
    daXuLy.current = 0;
    await batDauPhatNen();
    await ghiVaLenLich({ ...trangThai, dangChay: true, batLuc: Date.now() });
  }, [trangThai, ghiVaLenLich, batDauPhatNen]);

  const dungLai = useCallback(async () => {
    daXuLy.current = 0;
    nguoiPhat.current?.pause();
    dungPhatNen();
    await ghiVaLenLich({ ...trangThai, dangChay: false, batLuc: null });
  }, [trangThai, ghiVaLenLich, dungPhatNen]);

  const doiMoc = useCallback(
    async (moiPhut: number) => {
      // Đổi mốc lúc đang chạy thì đếm lại từ bây giờ, cho khỏi lệch nhịp.
      daXuLy.current = 0;
      await ghiVaLenLich({
        ...trangThai,
        moiPhut,
        batLuc: trangThai.dangChay ? Date.now() : trangThai.batLuc,
      });
    },
    [trangThai, ghiVaLenLich]
  );

  return useMemo(() => {
    const ke = Chuong.lanKeTiep(trangThai, bayGio);
    return {
      trangThai,
      dangTai,
      coQuyen,
      lanKeTiep: ke,
      conLai: ke ? Chuong.demNguoc(ke, bayGio) : '--:--',
      soLanDaKeu: Chuong.soLanDaKeu(trangThai, bayGio),
      batDau,
      dungLai,
      doiMoc,
      ngheThu: keu,
    };
  }, [trangThai, dangTai, coQuyen, bayGio, batDau, dungLai, doiMoc, keu]);
}
