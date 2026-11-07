import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as Engine from '@/alarms/engine';
import { hhmm } from '@/alarms/schedule';
import { useBaoThuc } from '@/alarms/store';
import { timRingtone } from '@/alarms/ringtones';
import { bo, chu, mau } from '@/ui/theme';
import { NenApp } from '@/ui/NenApp';

const NHIP_RUNG = 1800;

export default function ManChuongKeu() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { timAlarm, doiTrangThai } = useBaoThuc();
  const alarm = id ? timAlarm(id) : undefined;

  const [bayGio, setBayGio] = useState(() => new Date());
  const ringtone = timRingtone(alarm?.ringtoneId);
  const nguoiPhat = useRef<AudioPlayer | null>(null);

  useKeepAwake();

  // Đồng hồ chạy trên màn hình chuông.
  useEffect(() => {
    const dem = setInterval(() => setBayGio(new Date()), 1000);
    return () => clearInterval(dem);
  }, []);

  // Phát chuông lặp, cố kêu cả khi máy đang để im lặng.
  useEffect(() => {
    let dungRoi = false;
    const may = createAudioPlayer(ringtone.asset);
    nguoiPhat.current = may;
    may.loop = true;
    may.volume = 1;

    void (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (loi) {
        console.warn('[bao-thuc] Không đặt được chế độ âm thanh', loi);
      }
      if (dungRoi) return;
      may.play();
    })();

    return () => {
      dungRoi = true;
      nguoiPhat.current = null;
      may.remove();
    };
  }, [ringtone.asset]);

  // Rung theo nhịp cho tới khi tắt chuông.
  useEffect(() => {
    if (!alarm?.rung || Platform.OS === 'web') return;
    const rung = () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };
    rung();
    const dem = setInterval(rung, NHIP_RUNG);
    return () => clearInterval(dem);
  }, [alarm?.rung]);

  const dong = () => {
    nguoiPhat.current?.pause();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const hoan = async () => {
    if (alarm) await Engine.hoanLai(alarm);
    dong();
  };

  const tat = async () => {
    if (alarm) {
      await Engine.tatChuong(alarm);
      // Báo thức một lần thì coi như xong, không để nó kêu lại vào ngày mai.
      if (alarm.lapLai.length === 0) await doiTrangThai(alarm.id, false);
    }
    dong();
  };

  return (
    <NenApp>
      <SafeAreaView style={styles.nen} edges={['top', 'bottom']}>
        <View style={styles.giua}>
          <Text style={styles.nhan}>{alarm?.nhan ?? 'Báo thức'}</Text>
          <Text style={styles.gio}>{hhmm(bayGio.getHours(), bayGio.getMinutes())}</Text>
          <Text style={styles.giay}>{String(bayGio.getSeconds()).padStart(2, '0')} giây</Text>
        </View>

        <View style={styles.nut}>
          {alarm?.hoanBat ? (
            <Pressable style={[styles.nutLon, styles.nutHoan]} onPress={() => void hoan()}>
              <Text style={styles.nutHoanChu}>Hoãn {alarm.hoanPhut} phút</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.nutLon, styles.nutTat]} onPress={() => void tat()}>
            <Text style={styles.nutTatChu}>Tắt chuông</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </NenApp>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between' },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  nhan: { color: mau.nhan, fontSize: chu.vua, fontWeight: '600', letterSpacing: 1 },
  gio: {
    color: mau.chu,
    fontSize: chu.khongLo,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  giay: { color: mau.chuMo, fontSize: chu.nho },
  nut: { padding: bo.dem, gap: 12, paddingBottom: 32 },
  nutLon: { borderRadius: bo.bo, paddingVertical: 18, alignItems: 'center' },
  nutHoan: { backgroundColor: mau.the },
  nutHoanChu: { color: mau.chu, fontSize: chu.vua },
  nutTat: { backgroundColor: mau.nhan },
  nutTatChu: { color: mau.chu, fontSize: chu.vua, fontWeight: '700' },
});
