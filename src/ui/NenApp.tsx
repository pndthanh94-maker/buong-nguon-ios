import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { mau } from './theme';

const HINH = require('../../assets/hinh-nen.jpg');

const PHU_KIN = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/**
 * Hình nền chung cho mọi màn hình.
 *
 * Dùng <Image> phủ tuyệt đối chứ không dùng <ImageBackground>: trên React Native
 * Web 0.88, lớp ảnh bên trong ImageBackground giữ nguyên kích thước gốc
 * 1178×2556 và bỏ qua resizeMode, kết quả là chỉ thấy góc trên trái của hình.
 *
 * Màng tối phủ lên là bắt buộc: hình gốc nền xanh ngọc rất sáng, không phủ thì
 * chữ trắng của app đọc không ra.
 */
export function NenApp({ children }: { children: ReactNode }) {
  return (
    <View style={styles.hinh}>
      <Image source={HINH} style={styles.anh} resizeMode="cover" />
      <View style={styles.mang} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hinh: { flex: 1, backgroundColor: mau.nen },
  anh: { ...PHU_KIN, width: '100%', height: '100%' },
  mang: { ...PHU_KIN, backgroundColor: mau.mangHinhNen },
});
