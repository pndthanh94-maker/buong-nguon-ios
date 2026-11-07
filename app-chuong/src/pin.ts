import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

/**
 * Mở thẳng màn hình tắt tối ưu hoá pin của Android.
 *
 * Đây là cần gạt duy nhất chặn được chế độ Doze. Doze gom các báo thức lại rồi
 * hoãn tới "cửa sổ bảo trì", nên mốc 10 phút trở lên hay bị kêu trễ. Tắt tối ưu
 * hoá pin cho app thì hệ thống để yên cho nó chạy đúng nhịp.
 */
export async function moCaiDatPin(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
    );
  } catch (loi) {
    // Vài hãng chặn màn hình này; lùi về trang thông tin ứng dụng.
    console.warn('[chuong] Không mở được cài đặt pin, thử trang ứng dụng', loi);
    try {
      await IntentLauncher.startActivityAsync('android.settings.APPLICATION_DETAILS_SETTINGS', {
        data: 'package:com.buong.app',
      });
    } catch (loi2) {
      console.warn('[chuong] Không mở được cài đặt ứng dụng', loi2);
    }
  }
}

export const CAN_NHAC_PIN = Platform.OS === 'android';
