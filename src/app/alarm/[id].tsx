import { useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { moTaLapLai, thuTuHienThi } from '@/alarms/schedule';
import { useBaoThuc } from '@/alarms/store';
import { RINGTONES, timRingtone } from '@/alarms/ringtones';
import {
  Alarm,
  HOAN_PHUT_LUA_CHON,
  TEN_THU_NGAN,
  WEEKDAYS,
  Weekday,
  alarmMoi,
} from '@/alarms/types';
import { BanhXeGio } from '@/ui/BanhXeGio';
import { bo, chu, mau } from '@/ui/theme';
import { NenApp } from '@/ui/NenApp';

function Khoi({ tieuDe, children }: { tieuDe?: string; children: ReactNode }) {
  return (
    <View style={styles.khoi}>
      {tieuDe ? <Text style={styles.khoiTieuDe}>{tieuDe}</Text> : null}
      <View style={styles.the}>{children}</View>
    </View>
  );
}

function Hang({ nhan, children, duoi }: { nhan: string; children: ReactNode; duoi?: boolean }) {
  return (
    <View style={[styles.hang, duoi && styles.hangCuoi]}>
      <Text style={styles.hangNhan}>{nhan}</Text>
      {children}
    </View>
  );
}

export default function ManSuaBaoThuc() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timAlarm, luuAlarm, xoaAlarm } = useBaoThuc();

  // Bản nháp chỉ dựng một lần lúc mở màn hình; sửa từ đây là việc riêng của màn này.
  const banDau = useMemo<Alarm>(() => {
    const coSan = id && id !== 'moi' ? timAlarm(id) : undefined;
    return coSan ? { ...coSan } : alarmMoi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [nhap, setNhap] = useState<Alarm>(banDau);
  const laTaoMoi = !id || id === 'moi' || !timAlarm(id);

  const ringtone = timRingtone(nhap.ringtoneId);
  const nguoiPhat = useAudioPlayer(ringtone.asset);

  // Màn này có thể mở trực tiếp bằng deep link, lúc đó không có gì để quay lại.
  const dong = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const nghe = () => {
    try {
      nguoiPhat.seekTo(0);
      nguoiPhat.play();
    } catch {
      // Nghe thử hỏng thì cũng không nên chặn việc lưu báo thức.
    }
  };

  const doiThu = (thu: Weekday) => {
    setNhap((cu) => ({
      ...cu,
      lapLai: cu.lapLai.includes(thu)
        ? cu.lapLai.filter((t) => t !== thu)
        : [...cu.lapLai, thu].sort((a, b) => thuTuHienThi(a) - thuTuHienThi(b)),
    }));
  };

  const luu = async () => {
    nguoiPhat.pause();
    await luuAlarm({ ...nhap, bat: true, nhan: nhap.nhan.trim() || 'Báo thức' });
    dong();
  };

  const hoiXoa = () => {
    Alert.alert('Xoá báo thức?', 'Báo thức này sẽ bị gỡ khỏi danh sách.', [
      { text: 'Giữ lại', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: () => {
          void xoaAlarm(nhap.id).then(dong);
        },
      },
    ]);
  };

  return (
    <NenApp>
      <SafeAreaView style={styles.nen} edges={['top', 'bottom']}>
        <View style={styles.dauTrang}>
          <Pressable hitSlop={12} onPress={dong}>
            <Text style={styles.nutPhu}>Huỷ</Text>
          </Pressable>
          <Text style={styles.tieuDe}>{laTaoMoi ? 'Báo thức mới' : 'Sửa báo thức'}</Text>
          <Pressable hitSlop={12} onPress={() => void luu()}>
            <Text style={styles.nutChinh}>Lưu</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.noiDung} keyboardShouldPersistTaps="handled">
          <BanhXeGio
            gio={nhap.gio}
            phut={nhap.phut}
            onDoi={(gio, phut) => setNhap((cu) => ({ ...cu, gio, phut }))}
          />

          <Khoi tieuDe="LẶP LẠI">
            <View style={styles.hangThu}>
              {WEEKDAYS.map((thu) => {
                const chon = nhap.lapLai.includes(thu);
                return (
                  <Pressable
                    key={thu}
                    onPress={() => doiThu(thu)}
                    style={[styles.vienThu, chon && styles.vienThuChon]}>
                    <Text style={[styles.chuThu, chon && styles.chuThuChon]}>{TEN_THU_NGAN[thu]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.moTa}>{moTaLapLai(nhap.lapLai)}</Text>
          </Khoi>

          <Khoi tieuDe="NHÃN">
            <TextInput
              style={styles.oNhap}
              value={nhap.nhan}
              onChangeText={(nhan) => setNhap((cu) => ({ ...cu, nhan }))}
              placeholder="Báo thức"
              placeholderTextColor={mau.chuMo}
              maxLength={40}
              returnKeyType="done"
            />
          </Khoi>

          <Khoi tieuDe="NHẠC CHUÔNG">
            {RINGTONES.map((r) => (
              <Pressable
                key={r.id}
                style={styles.hang}
                onPress={() => setNhap((cu) => ({ ...cu, ringtoneId: r.id }))}>
                <Text style={styles.hangNhan}>{r.ten}</Text>
                <Text style={styles.dauChon}>{nhap.ringtoneId === r.id ? '✓' : ''}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.nutNghe} onPress={nghe}>
              <Text style={styles.nutNgheChu}>Nghe thử</Text>
            </Pressable>
          </Khoi>

          <Khoi tieuDe="KHI CHUÔNG KÊU">
            <Hang nhan="Cho phép hoãn">
              <Switch
                value={nhap.hoanBat}
                onValueChange={(hoanBat) => setNhap((cu) => ({ ...cu, hoanBat }))}
                trackColor={{ false: mau.vien, true: mau.xanh }}
              />
            </Hang>
            {nhap.hoanBat ? (
              <View style={styles.hangPhut}>
                {HOAN_PHUT_LUA_CHON.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setNhap((cu) => ({ ...cu, hoanPhut: p }))}
                    style={[styles.vienPhut, nhap.hoanPhut === p && styles.vienPhutChon]}>
                    <Text style={[styles.chuPhut, nhap.hoanPhut === p && styles.chuPhutChon]}>
                      {p} phút
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Hang nhan="Rung" duoi>
              <Switch
                value={nhap.rung}
                onValueChange={(rung) => setNhap((cu) => ({ ...cu, rung }))}
                trackColor={{ false: mau.vien, true: mau.xanh }}
              />
            </Hang>
          </Khoi>

          {!laTaoMoi ? (
            <Pressable style={styles.nutXoa} onPress={hoiXoa}>
              <Text style={styles.nutXoaChu}>Xoá báo thức</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </NenApp>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'transparent' },
  dauTrang: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bo.dem,
    paddingVertical: 10,
  },
  tieuDe: { color: mau.chu, fontSize: chu.vua, fontWeight: '600' },
  nutPhu: { color: mau.chuMo, fontSize: chu.vua },
  nutChinh: { color: mau.nhan, fontSize: chu.vua, fontWeight: '600' },
  noiDung: { padding: bo.dem, paddingBottom: 48, gap: 20 },
  khoi: { gap: 8 },
  khoiTieuDe: { color: mau.chuMo, fontSize: chu.beo, letterSpacing: 0.8, marginLeft: 4 },
  the: { backgroundColor: mau.theKinh, borderRadius: bo.bo, overflow: 'hidden' },
  hang: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bo.dem,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: mau.vien,
  },
  hangCuoi: { borderBottomWidth: 0 },
  hangNhan: { color: mau.chu, fontSize: chu.vua },
  dauChon: { color: mau.nhan, fontSize: chu.vua, fontWeight: '700' },
  hangThu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    gap: 6,
  },
  vienThu: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mau.theSang,
  },
  vienThuChon: { backgroundColor: mau.nhan },
  chuThu: { color: mau.chuMo, fontSize: chu.nho, fontWeight: '600' },
  chuThuChon: { color: mau.chu },
  moTa: {
    color: mau.chuMo,
    fontSize: chu.beo,
    paddingHorizontal: bo.dem,
    paddingBottom: 12,
  },
  oNhap: {
    color: mau.chu,
    fontSize: chu.vua,
    paddingHorizontal: bo.dem,
    paddingVertical: 14,
  },
  nutNghe: { paddingHorizontal: bo.dem, paddingVertical: 12 },
  nutNgheChu: { color: mau.nhan, fontSize: chu.nho },
  hangPhut: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  vienPhut: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: mau.theSang,
  },
  vienPhutChon: { backgroundColor: mau.nhan },
  chuPhut: { color: mau.chuMo, fontSize: chu.nho },
  chuPhutChon: { color: mau.chu, fontWeight: '600' },
  nutXoa: {
    backgroundColor: mau.theKinh,
    borderRadius: bo.bo,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nutXoaChu: { color: mau.nhan, fontSize: chu.vua },
});
