import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import * as Engine from './engine';
import { lanKeTiep } from './schedule';
import { luuDanhSach, taiDanhSach } from './storage';
import { Alarm } from './types';

/** Báo thức một lần coi như đã xong sau khi quá giờ hẹn 10 phút. */
const HAN_TU_TAT = 10 * 60 * 1000;

interface GiaTriBoiCanh {
  danhSach: Alarm[];
  dangTai: boolean;
  cheDo: Engine.CheDo;
  coQuyen: boolean;
  timAlarm: (id: string) => Alarm | undefined;
  luuAlarm: (alarm: Alarm) => Promise<void>;
  xoaAlarm: (id: string) => Promise<void>;
  doiTrangThai: (id: string, bat: boolean) => Promise<void>;
}

const BoiCanh = createContext<GiaTriBoiCanh | null>(null);

/** Gắn mốc giờ cho báo thức một lần đang bật, để sau này biết lúc nào nên tự tắt. */
function danhDauMotLan(alarm: Alarm): Alarm {
  if (alarm.lapLai.length > 0) return { ...alarm, motLanLuc: null };
  if (!alarm.bat) return { ...alarm, motLanLuc: null };
  const moc = lanKeTiep(alarm);
  return { ...alarm, motLanLuc: moc ? moc.getTime() : null };
}

function tuTatCaiDaQua(danhSach: Alarm[], bayGio = Date.now()): Alarm[] {
  return danhSach.map((a) =>
    a.bat && a.lapLai.length === 0 && a.motLanLuc !== null && a.motLanLuc + HAN_TU_TAT < bayGio
      ? { ...a, bat: false, motLanLuc: null }
      : a
  );
}

function sapXep(danhSach: Alarm[]): Alarm[] {
  return [...danhSach].sort((a, b) => a.gio * 60 + a.phut - (b.gio * 60 + b.phut));
}

export function NhaCungCapBaoThuc({ children }: { children: ReactNode }) {
  const [danhSach, setDanhSach] = useState<Alarm[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [cheDo, setCheDo] = useState<Engine.CheDo>(Engine.cheDoHienTai());
  const [coQuyen, setCoQuyen] = useState(false);

  const ghiVaDongBo = useCallback(async (moi: Alarm[]) => {
    const chuanHoa = sapXep(moi.map(danhDauMotLan));
    setDanhSach(chuanHoa);
    await luuDanhSach(chuanHoa);
    await Engine.dongBo(chuanHoa);
  }, []);

  useEffect(() => {
    let huy = false;

    (async () => {
      const daLuu = await taiDanhSach();
      const tinhTrang = await Engine.chuanBi();
      if (huy) return;

      setCheDo(tinhTrang.cheDo);
      setCoQuyen(tinhTrang.coQuyen);
      setDangTai(false);
      await ghiVaDongBo(tuTatCaiDaQua(daLuu));
    })().catch((loi) => {
      console.warn('[bao-thuc] Không khởi động được danh sách', loi);
      setDangTai(false);
    });

    return () => {
      huy = true;
    };
  }, [ghiVaDongBo]);

  // Quay lại app thì dọn những báo thức một lần đã kêu xong.
  useEffect(() => {
    const dangKy = AppState.addEventListener('change', (trangThai) => {
      if (trangThai !== 'active') return;
      setDanhSach((hienTai) => {
        const donDep = tuTatCaiDaQua(hienTai);
        const coDoi = donDep.some((a, i) => a.bat !== hienTai[i].bat);
        if (coDoi) void ghiVaDongBo(donDep);
        return coDoi ? donDep : hienTai;
      });
    });
    return () => dangKy.remove();
  }, [ghiVaDongBo]);

  const timAlarm = useCallback(
    (id: string) => danhSach.find((a) => a.id === id),
    [danhSach]
  );

  const luuAlarm = useCallback(
    async (alarm: Alarm) => {
      const coSan = danhSach.some((a) => a.id === alarm.id);
      const moi = coSan ? danhSach.map((a) => (a.id === alarm.id ? alarm : a)) : [...danhSach, alarm];
      await ghiVaDongBo(moi);
    },
    [danhSach, ghiVaDongBo]
  );

  const xoaAlarm = useCallback(
    async (id: string) => {
      const canXoa = danhSach.find((a) => a.id === id);
      if (canXoa) await Engine.huyMot(canXoa);
      await ghiVaDongBo(danhSach.filter((a) => a.id !== id));
    },
    [danhSach, ghiVaDongBo]
  );

  const doiTrangThai = useCallback(
    async (id: string, bat: boolean) => {
      await ghiVaDongBo(danhSach.map((a) => (a.id === id ? { ...a, bat } : a)));
    },
    [danhSach, ghiVaDongBo]
  );

  const giaTri = useMemo<GiaTriBoiCanh>(
    () => ({ danhSach, dangTai, cheDo, coQuyen, timAlarm, luuAlarm, xoaAlarm, doiTrangThai }),
    [danhSach, dangTai, cheDo, coQuyen, timAlarm, luuAlarm, xoaAlarm, doiTrangThai]
  );

  return <BoiCanh.Provider value={giaTri}>{children}</BoiCanh.Provider>;
}

export function useBaoThuc(): GiaTriBoiCanh {
  const giaTri = useContext(BoiCanh);
  if (!giaTri) throw new Error('useBaoThuc phải nằm trong <NhaCungCapBaoThuc>');
  return giaTri;
}
