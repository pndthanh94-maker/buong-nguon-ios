import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MOC_PHUT, moTa } from './src/chuong';
import { CAN_NHAC_PIN, moCaiDatPin } from './src/pin';
import { bo, chu, mau } from './src/theme';
import { useChuong } from './src/useChuong';

const HINH_NEN = require('./assets/hinh-nen.jpg');
const PHU_KIN = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

export default function App() {
  return (
    <SafeAreaProvider>
      <ManChuong />
    </SafeAreaProvider>
  );
}

function ManChuong() {
  const { trangThai, dangTai, coQuyen, conLai, soLanDaKeu, batDau, dungLai, doiMoc, ngheThu } =
    useChuong();
  const dangChay = trangThai.dangChay;

  return (
    <View style={styles.nen}>
      {/* Màng tối là bắt buộc: hình nền xanh ngọc rất sáng, không phủ thì chữ trắng đọc không ra. */}
      <Image source={HINH_NEN} style={styles.anh} resizeMode="cover" />
      <View style={styles.mang} />

      <StatusBar style="light" />

      <SafeAreaView style={styles.khung} edges={['top', 'bottom']}>
        <View style={styles.dau}>
          <Text style={styles.tieuDe}>Buông</Text>
          <Text style={styles.phuDe}>{moTa(trangThai.moiPhut)}, đếm từ lúc bấm Bắt đầu</Text>
        </View>

        {!coQuyen && !dangTai ? (
          <View style={styles.canhBao}>
            <Text style={styles.canhBaoChu}>
              Chưa được cấp quyền thông báo. Chuông sẽ chỉ kêu khi app đang mở. Vào Cài đặt
              của máy để bật lại.
            </Text>
          </View>
        ) : null}

        <View style={styles.dayDai} />

        <View style={styles.duoi}>
          <View style={styles.giua}>
            <Text style={styles.dem}>{dangChay ? conLai : '--:--'}</Text>
            <Text style={styles.demPhu}>{dangChay ? `đã kêu ${soLanDaKeu} lần` : 'chưa chạy'}</Text>
          </View>

          <View style={styles.chip}>
            {MOC_PHUT.map((phut) => {
              const dangChon = phut === trangThai.moiPhut;
              return (
                <Pressable
                  key={phut}
                  style={[styles.chipNut, dangChon && styles.chipNutChon]}
                  onPress={() => void doiMoc(phut)}>
                  <Text style={[styles.chipChu, dangChon && styles.chipChuChon]}>{phut}′</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.nut, dangChay ? styles.nutDung : styles.nutBat]}
            onPress={() => void (dangChay ? dungLai() : batDau())}>
            <Text style={dangChay ? styles.nutChuDung : styles.nutChuBat}>
              {dangChay ? 'Dừng' : 'Bắt đầu'}
            </Text>
          </Pressable>

          <View style={styles.hangPhu}>
            <Pressable onPress={() => void ngheThu()} hitSlop={10}>
              <Text style={styles.ngheThu}>Nghe thử tiếng chuông</Text>
            </Pressable>
            {CAN_NHAC_PIN ? (
              <Pressable onPress={() => void moCaiDatPin()} hitSlop={10}>
                <Text style={styles.ngheThu}>Tắt tối ưu hoá pin</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: mau.nen },
  anh: { ...PHU_KIN, width: '100%', height: '100%' },
  mang: { ...PHU_KIN, backgroundColor: mau.mangHinhNen },
  khung: { flex: 1, padding: bo.dem, gap: 12 },
  /** Chừa trống nửa trên màn hình cho hình nền. */
  dayDai: { flex: 1 },

  dau: { gap: 4 },
  tieuDe: { color: mau.chu, fontSize: chu.lon, fontWeight: '700' },
  phuDe: { color: mau.chuMo, fontSize: chu.nho },

  canhBao: {
    backgroundColor: 'rgba(255, 214, 10, 0.12)',
    borderRadius: bo.bo,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
    padding: 12,
  },
  canhBaoChu: { color: mau.vang, fontSize: chu.beo, lineHeight: 18 },

  giua: { alignItems: 'center', gap: 2, marginBottom: 4 },
  dem: {
    color: mau.chu,
    fontSize: chu.khongLo,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  demPhu: { color: mau.chuMo, fontSize: chu.nho },

  duoi: { gap: 14, paddingBottom: 4 },
  chip: { flexDirection: 'row', gap: 8 },
  chipNut: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: mau.theSang,
    alignItems: 'center',
  },
  chipNutChon: { backgroundColor: mau.nhan },
  chipChu: { color: mau.chuMo, fontSize: chu.vua, fontWeight: '600' },
  chipChuChon: { color: mau.chu },

  nut: { borderRadius: bo.bo, paddingVertical: 18, alignItems: 'center' },
  nutBat: { backgroundColor: mau.xanh },
  nutDung: { backgroundColor: mau.the },
  nutChuBat: { color: '#000000', fontSize: chu.vua, fontWeight: '700' },
  nutChuDung: { color: mau.chu, fontSize: chu.vua, fontWeight: '700' },

  hangPhu: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  ngheThu: { color: mau.chuMo, fontSize: chu.beo, textAlign: 'center', paddingVertical: 4 },
});
