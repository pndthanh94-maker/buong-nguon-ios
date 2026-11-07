import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { mau } from './theme';

const CAO_MUC = 52;
const SO_MUC_HIEN = 5;

interface CotProps {
  soLuong: number;
  giaTri: number;
  onChon: (giaTri: number) => void;
}

function Cot({ soLuong, giaTri, onChon }: CotProps) {
  const ref = useRef<ScrollViewInstance>(null);
  const daCuon = useRef(false);

  useEffect(() => {
    // Chỉ nhảy tới vị trí ban đầu một lần, tránh giật khi người dùng đang cuộn.
    if (daCuon.current) return;
    daCuon.current = true;
    requestAnimationFrame(() => ref.current?.scrollTo({ y: giaTri * CAO_MUC, animated: false }));
  }, [giaTri]);

  const dungLai = (su: NativeSyntheticEvent<NativeScrollEvent>) => {
    const chiSo = Math.round(su.nativeEvent.contentOffset.y / CAO_MUC);
    const trongKhoang = Math.min(soLuong - 1, Math.max(0, chiSo));
    if (trongKhoang !== giaTri) {
      if (Platform.OS === 'ios') void Haptics.selectionAsync();
      onChon(trongKhoang);
    }
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.cot}
      showsVerticalScrollIndicator={false}
      snapToInterval={CAO_MUC}
      decelerationRate="fast"
      onMomentumScrollEnd={dungLai}
      contentContainerStyle={styles.cotNoiDung}>
      {Array.from({ length: soLuong }, (_, i) => (
        <View key={i} style={styles.muc}>
          <Text style={[styles.mucChu, i === giaTri && styles.mucChon]}>
            {String(i).padStart(2, '0')}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

interface Props {
  gio: number;
  phut: number;
  onDoi: (gio: number, phut: number) => void;
}

export function BanhXeGio({ gio, phut, onDoi }: Props) {
  return (
    <View style={styles.khung}>
      <View pointerEvents="none" style={styles.dai} />
      <View style={styles.hang}>
        <Cot soLuong={24} giaTri={gio} onChon={(g) => onDoi(g, phut)} />
        <Text style={styles.haiCham}>:</Text>
        <Cot soLuong={60} giaTri={phut} onChon={(p) => onDoi(gio, p)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  khung: {
    height: CAO_MUC * SO_MUC_HIEN,
    justifyContent: 'center',
  },
  dai: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: CAO_MUC * 2,
    height: CAO_MUC,
    borderRadius: 12,
    backgroundColor: mau.theSang,
  },
  hang: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cot: {
    width: 96,
    height: CAO_MUC * SO_MUC_HIEN,
  },
  cotNoiDung: {
    paddingVertical: CAO_MUC * 2,
  },
  muc: {
    height: CAO_MUC,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mucChu: {
    fontSize: 32,
    fontVariant: ['tabular-nums'],
    color: mau.chuMo,
  },
  mucChon: {
    color: mau.chu,
    fontWeight: '600',
  },
  haiCham: {
    fontSize: 32,
    color: mau.chu,
    marginHorizontal: 4,
    marginBottom: 4,
  },
});
