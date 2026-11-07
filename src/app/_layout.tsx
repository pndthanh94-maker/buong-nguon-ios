import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import * as Engine from '@/alarms/engine';
import { ACTION_HOAN, ACTION_TAT, DuLieuThongBao } from '@/alarms/notifications';
import { NhaCungCapBaoThuc, useBaoThuc } from '@/alarms/store';
import { NhaCungCapChuong } from '@/chuong/store';
import { mau } from '@/ui/theme';

function duLieuCuaThongBao(noiDung: { data?: unknown }): Partial<DuLieuThongBao> {
  return (noiDung.data ?? {}) as Partial<DuLieuThongBao>;
}

/** Nối thông báo của hệ thống với màn hình chuông kêu trong app. */
function CauNoiThongBao() {
  const { timAlarm, doiTrangThai } = useBaoThuc();

  useEffect(() => {
    const khiNhan = Notifications.addNotificationReceivedListener((thongBao) => {
      const duLieu = duLieuCuaThongBao(thongBao.request.content);
      if (!duLieu.alarmId) return;
      router.push({ pathname: '/ringing', params: { id: duLieu.alarmId } });
    });

    const khiBam = Notifications.addNotificationResponseReceivedListener((phanHoi) => {
      const duLieu = duLieuCuaThongBao(phanHoi.notification.request.content);
      const alarm = duLieu.alarmId ? timAlarm(duLieu.alarmId) : undefined;
      if (!alarm) return;

      void (async () => {
        if (phanHoi.actionIdentifier === ACTION_HOAN) {
          await Engine.hoanLai(alarm);
          return;
        }
        if (phanHoi.actionIdentifier === ACTION_TAT) {
          await Engine.tatChuong(alarm);
          if (alarm.lapLai.length === 0) await doiTrangThai(alarm.id, false);
          return;
        }
        router.push({ pathname: '/ringing', params: { id: alarm.id } });
      })();
    });

    return () => {
      khiNhan.remove();
      khiBam.remove();
    };
  }, [timAlarm, doiTrangThai]);

  return null;
}

export default function BoCuc() {
  return (
    <NhaCungCapBaoThuc>
      <NhaCungCapChuong>
        <StatusBar style="light" />
        <CauNoiThongBao />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: mau.nen },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="alarm/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="ringing"
            options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
          />
        </Stack>
      </NhaCungCapChuong>
    </NhaCungCapBaoThuc>
  );
}
