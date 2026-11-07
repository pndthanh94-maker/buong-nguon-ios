import { Link, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBaoThuc } from '@/alarms/store';
import { hhmm, lanKeTiep, moTaConBaoLau, moTaLapLai } from '@/alarms/schedule';
import { timRingtone } from '@/alarms/ringtones';
import { Alarm } from '@/alarms/types';
import { MOI_PHUT_LUA_CHON, moTaMoiPhut, nhanNut } from '@/chuong/dinhky';
import { useChuongDinhKy } from '@/chuong/store';
import { bo, chu, mau } from '@/ui/theme';
import { NenApp } from '@/ui/NenApp';

function CanhBao({ noiDung }: { noiDung: string }) {
  return (
    <View style={styles.canhBao}>
      <Text style={styles.canhBaoChu}>{noiDung}</Text>
    </View>
  );
}

function DongBaoThuc({ alarm }: { alarm: Alarm }) {
  const { doiTrangThai, xoaAlarm } = useBaoThuc();
  const ke = lanKeTiep(alarm);

  const hoiXoa = () => {
    Alert.alert('Xoá báo thức?', `${hhmm(alarm.gio, alarm.phut)} — ${alarm.nhan}`, [
      { text: 'Giữ lại', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => void xoaAlarm(alarm.id) },
    ]);
  };

  return (
    <Pressable
      style={styles.dong}
      onPress={() => router.push({ pathname: '/alarm/[id]', params: { id: alarm.id } })}
      onLongPress={hoiXoa}>
      <View style={styles.dongTrai}>
        <Text style={[styles.gio, !alarm.bat && styles.mo]}>{hhmm(alarm.gio, alarm.phut)}</Text>
        <Text style={[styles.phuDe, !alarm.bat && styles.mo]} numberOfLines={1}>
          {alarm.nhan} · {moTaLapLai(alarm.lapLai)}
        </Text>
        {alarm.bat && ke ? <Text style={styles.conLai}>{moTaConBaoLau(ke)}</Text> : null}
      </View>
      <Switch
        value={alarm.bat}
        onValueChange={(bat) => void doiTrangThai(alarm.id, bat)}
        trackColor={{ false: mau.vien, true: mau.xanh }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

/** Chuông kêu cách nhau một khoảng cố định, đếm từ lúc bấm Bắt đầu. */
function TheChuongDinhKy() {
  const { chuong, conLai, soLanDaKeu, batDau, dungLai, doiMoiPhut } = useChuongDinhKy();
  const ringtone = timRingtone(chuong.ringtoneId);

  return (
    <View style={styles.theChuong}>
      <View style={styles.chuongDau}>
        <Text style={styles.chuongTieuDe}>Chuông định kỳ</Text>
        <Text style={styles.chuongNhac}>{ringtone.ten}</Text>
      </View>

      <View style={styles.chip}>
        {MOI_PHUT_LUA_CHON.map((phut) => {
          const dangChon = phut === chuong.moiPhut;
          return (
            <Pressable
              key={phut}
              style={[styles.chipNut, dangChon && styles.chipNutChon]}
              onPress={() => void doiMoiPhut(phut)}>
              <Text style={[styles.chipChu, dangChon && styles.chipChuChon]}>{nhanNut(phut)}</Text>
            </Pressable>
          );
        })}
      </View>

      {chuong.dangChay ? (
        <View style={styles.chuongGiua}>
          <Text style={styles.chuongDem}>{conLai}</Text>
          <Text style={styles.chuongPhu}>
            {moTaMoiPhut(chuong.moiPhut)} · đã kêu {soLanDaKeu} lần
          </Text>
        </View>
      ) : (
        <Text style={styles.chuongPhu}>
          {moTaMoiPhut(chuong.moiPhut)}, đếm từ lúc bấm Bắt đầu.
        </Text>
      )}

      <Pressable
        style={[styles.chuongNut, chuong.dangChay ? styles.chuongNutDung : styles.chuongNutBat]}
        onPress={() => void (chuong.dangChay ? dungLai() : batDau())}>
        <Text style={chuong.dangChay ? styles.chuongNutChuDung : styles.chuongNutChuBat}>
          {chuong.dangChay ? 'Dừng' : 'Bắt đầu'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ManDanhSach() {
  const { danhSach, dangTai, cheDo, coQuyen } = useBaoThuc();

  return (
    <NenApp>
      <SafeAreaView style={styles.nen} edges={['top', 'bottom']}>
        <View style={styles.dauTrang}>
          <Text style={styles.tieuDe}>Báo thức</Text>
          <Link href={{ pathname: '/alarm/[id]', params: { id: 'moi' } }} asChild>
            <Pressable hitSlop={12}>
              <Text style={styles.nutThem}>+</Text>
            </Pressable>
          </Link>
        </View>

        <ScrollView contentContainerStyle={styles.noiDung}>
          {cheDo === 'thong-bao' ? (
            <CanhBao noiDung="Đang chạy bằng thông báo: máy để im lặng sẽ không nghe thấy chuông. Muốn chuông kêu thật như app Đồng hồ, cần iOS 26 và một development build." />
          ) : null}
          {!coQuyen && !dangTai ? (
            <CanhBao noiDung="Chưa được cấp quyền báo thức. Mở Cài đặt của iPhone để bật lại, nếu không chuông sẽ không kêu." />
          ) : null}

          <TheChuongDinhKy />

          {dangTai ? (
            <Text style={styles.trong}>Đang tải…</Text>
          ) : danhSach.length === 0 ? (
            <View style={styles.khoiTrong}>
              <Text style={styles.trong}>Chưa có báo thức nào</Text>
              <Text style={styles.trongPhu}>Bấm dấu + ở góc trên để thêm cái đầu tiên.</Text>
            </View>
          ) : (
            danhSach.map((alarm) => <DongBaoThuc key={alarm.id} alarm={alarm} />)
          )}

          {danhSach.length > 0 ? (
            <Text style={styles.ghiChu}>
              Chạm để sửa, giữ lâu để xoá. Nhạc chuông đang dùng:{' '}
              {timRingtone(danhSach[0].ringtoneId).ten}.
            </Text>
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
    paddingBottom: 8,
  },
  tieuDe: { color: mau.chu, fontSize: chu.lon, fontWeight: '700' },
  nutThem: { color: mau.nhan, fontSize: 34, fontWeight: '300', lineHeight: 38 },
  noiDung: { padding: bo.dem, gap: 10, paddingBottom: 40 },
  dong: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: mau.theKinh,
    borderRadius: bo.bo,
    padding: bo.dem,
  },
  dongTrai: { flex: 1, paddingRight: 12 },
  gio: { color: mau.chu, fontSize: 44, fontWeight: '200', fontVariant: ['tabular-nums'] },
  phuDe: { color: mau.chuMo, fontSize: chu.nho, marginTop: 2 },
  conLai: { color: mau.xanh, fontSize: chu.beo, marginTop: 4 },
  mo: { opacity: 0.4 },
  theChuong: { backgroundColor: mau.theKinh, borderRadius: bo.bo, padding: bo.dem, gap: 12 },
  chuongDau: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  chuongTieuDe: { color: mau.chu, fontSize: chu.vua, fontWeight: '600' },
  chuongNhac: { color: mau.chuMo, fontSize: chu.beo },
  chip: { flexDirection: 'row', gap: 6 },
  chipNut: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: mau.theSang,
    alignItems: 'center',
  },
  chipNutChon: { backgroundColor: mau.nhan },
  chipChu: { color: mau.chuMo, fontSize: chu.beo, fontWeight: '600' },
  chipChuChon: { color: mau.chu },
  chuongGiua: { alignItems: 'center', gap: 2 },
  chuongDem: { color: mau.chu, fontSize: 40, fontWeight: '200', fontVariant: ['tabular-nums'] },
  chuongPhu: { color: mau.chuMo, fontSize: chu.beo, textAlign: 'center' },
  chuongNut: { borderRadius: bo.bo, paddingVertical: 14, alignItems: 'center' },
  chuongNutBat: { backgroundColor: mau.xanh },
  chuongNutDung: { backgroundColor: mau.theSang },
  chuongNutChuBat: { color: '#000000', fontSize: chu.vua, fontWeight: '700' },
  chuongNutChuDung: { color: mau.chu, fontSize: chu.vua, fontWeight: '700' },
  canhBao: {
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    borderRadius: bo.bo,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  canhBaoChu: { color: mau.vang, fontSize: chu.beo, lineHeight: 18 },
  khoiTrong: { paddingTop: 80, alignItems: 'center', gap: 6 },
  trong: { color: mau.chuMo, fontSize: chu.vua, textAlign: 'center' },
  trongPhu: { color: mau.chuMo, fontSize: chu.nho, opacity: 0.7, textAlign: 'center' },
  ghiChu: { color: mau.chuMo, fontSize: chu.beo, textAlign: 'center', marginTop: 12, opacity: 0.7 },
});
