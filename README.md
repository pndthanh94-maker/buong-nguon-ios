# Báo Thức — app báo thức cho iOS

App báo thức viết bằng Expo + React Native (TypeScript), giao diện tiếng Việt, nền tối theo phong cách app Đồng hồ của iOS.

## Hai chế độ chuông

App tự chọn một trong hai, tuỳ máy:

| | AlarmKit | Thông báo |
|---|---|---|
| Yêu cầu | iOS 26+ **và** development build | iOS 15+, chạy được ngay trong Expo Go |
| Máy để im lặng | Vẫn kêu | **Không kêu** |
| App bị đóng hẳn | Vẫn kêu | Vẫn hiện thông báo |
| Nút trên màn khoá | Hoãn / Tắt do hệ thống vẽ | Hoãn / Tắt dạng nút thông báo |
| Độ dài chuông | Tới khi bấm tắt | ~30 giây mỗi lần, app xếp 3 lần cách nhau 1 phút |

Màn hình danh sách hiện cảnh báo vàng khi đang chạy ở chế độ thông báo, để không ai tưởng nhầm là chuông thật.

## Chạy thử ngay (Expo Go, không cần Mac)

```bash
npm start
```

Mở app **Expo Go** trên iPhone, quét mã QR. Cho phép quyền thông báo khi được hỏi.

Lưu ý khi thử trong Expo Go: đây là chế độ thông báo, nên **bật chuông máy và tắt chế độ im lặng** thì mới nghe thấy. Thử nhanh bằng cách đặt báo thức sau thời điểm hiện tại 2 phút.

## Bật chuông thật bằng AlarmKit

AlarmKit là native module nên Expo Go không chạy được. Cần một development build:

```bash
npx eas-cli@latest build --profile development --platform ios
```

Build xong, cài file lên iPhone chạy iOS 26 trở lên, rồi:

```bash
npx expo start --dev-client
```

App sẽ tự nhận ra AlarmKit, xin quyền báo thức, và từ đó mọi báo thức đi qua AlarmKit.

Nếu có máy Mac thì chạy thẳng `npx expo run:ios` cũng được (cần Xcode 26 trở lên để biên dịch AlarmKit).

### Phần Swift chưa được biên dịch thử

Code trong `modules/alarm-kit/ios/AlarmKitModule.swift` viết trên Windows nên **chưa qua trình biên dịch Swift lần nào** — Windows không build iOS được. Logic bám theo API AlarmKit của iOS 26, nhưng lần `eas build` đầu tiên có thể cần chỉnh vài nhãn tham số cho khớp đúng SDK đang dùng. Toàn bộ file đã bọc trong `#if canImport(AlarmKit)` và `if #available(iOS 26.0, *)`, nên máy iOS đời cũ vẫn build và chạy bình thường, chỉ là lùi về chế độ thông báo.

Phần JavaScript thì đã kiểm tra thật: `npx expo export --platform ios` bundle sạch, typecheck và lint không lỗi, lõi tính giờ chạy qua 22 trường hợp kiểm thử (gồm tràn qua nửa đêm, lặp theo thứ, giờ đã trôi qua trong ngày), và toàn bộ luồng thêm → lưu → danh sách → màn chuông kêu → tắt chuông đã chạy thử trên trình duyệt.

## Xuất file .ipa để cài lên máy

Workflow `.github/workflows/build-ipa.yml` build trên runner macOS của GitHub, ra file **.ipa không ký** — không cần máy Mac, không cần tài khoản Apple Developer.

Đẩy project lên GitHub → tab **Actions** → **build-ipa** → **Run workflow**. Xong thì tải artifact `BaoThuc-ipa` về.

**Yêu cầu tối thiểu: iOS 16.4.** Đây là mức sàn của chính Expo SDK 58 — `:ios => '16.4'` trong podspec của `expo`, `expo-modules-core`, `expo-notifications`, `expo-audio` và `expo-router`. Sửa `deploymentTarget` trong `app.json` xuống thấp hơn sẽ không build được.

Cài lên iPhone từ Windows:

| Cách | Hết hạn | Điều kiện |
|---|---|---|
| TrollStore | Vĩnh viễn | Chỉ iOS 16.4 – 16.6.1: dưới 16.4 app không chạy, trên 16.6.1 TrollStore không cài được |
| Sideloadly / AltStore | 7 ngày, phải ký lại | Apple ID miễn phí, iOS nào cũng được |
| EAS Build + TestFlight | 90 ngày | Tài khoản Apple Developer 99 USD/năm |

Lần build đầu có thể gãy ở `modules/alarm-kit/ios/AlarmKitModule.swift` nếu runner dùng Xcode có sẵn SDK iOS 26, vì code Swift đó chưa qua trình biên dịch lần nào. Runner Xcode cũ hơn thì `#if canImport(AlarmKit)` tự loại khối đó ra, build chạy bình thường và app lùi về chế độ thông báo.

## Chạy thử trên trình duyệt

```bash
npm run web
```

Hữu ích để xem nhanh giao diện và luồng màn hình mà không cần điện thoại. Lưu ý: web **không có** `expo-notifications`, nên phần lên lịch sẽ báo warning trong console — đúng như thiết kế, app vẫn lưu và vẫn đi tiếp. Muốn thử chuông thật thì phải dùng Expo Go hoặc development build.

## Cấu trúc

```
src/
  app/                    Màn hình (Expo Router)
    _layout.tsx           Bọc store + cầu nối thông báo → màn chuông kêu
    index.tsx             Danh sách báo thức
    alarm/[id].tsx        Thêm / sửa (id = "moi" là tạo mới)
    ringing.tsx           Màn chuông đang kêu: phát nhạc loop, rung, Hoãn/Tắt
  alarms/
    types.ts              Kiểu dữ liệu thuần, không phụ thuộc native
    ringtones.ts          Danh sách nhạc chuông (kèm asset)
    schedule.ts           Tính lần kêu kế tiếp, mô tả lặp lại, cộng phút qua nửa đêm
    storage.ts            Đọc/ghi AsyncStorage, có kiểm tra dữ liệu hỏng
    notifications.ts      Engine chạy bằng expo-notifications
    engine.ts             Chọn AlarmKit hay thông báo, đồng bộ lịch
    store.tsx             Context giữ danh sách, tự tắt báo thức một lần đã kêu xong
  chuong/
    dinhky.ts             Chuông định kỳ: tính mốc kêu từ batLuc, lên lịch notification lặp
    store.tsx             Context đếm ngược + phát chuông khi app đang mở
  ui/
    theme.ts              Màu, cỡ chữ
    NenApp.tsx            Hình nền + màng tối, bọc mọi màn hình
    BanhXeGio.tsx         Bánh xe chọn giờ/phút tự viết (không cần native)
modules/
  alarm-kit/              Local Expo module bọc AlarmKit
    ios/AlarmKitModule.swift
    index.ts              API phía JS, tự lùi về null khi không có native
assets/sounds/            Nhạc chuông. tieng-chuong.mp3 là bản đầy đủ phát trong app,
                          tieng-chuong.wav là bản cắt 24 giây cho notification
assets/hinh-nen.jpg       Hình nền dọc, dựng từ buong-bo.jpg bằng ffmpeg
```

## Tính năng

- Thêm / sửa / xoá báo thức (chạm để sửa, giữ lâu để xoá)
- Lặp theo thứ trong tuần, hoặc báo một lần rồi tự tắt
- Nhãn riêng cho từng báo thức
- Ba nhạc chuông, có nút nghe thử
- Hoãn 5/9/10/15/20/30 phút, bật tắt được
- Rung theo nhịp khi chuông kêu
- Đếm "Còn 7 giờ 20 phút nữa" dưới mỗi báo thức đang bật
- Giữ màn hình sáng khi chuông đang kêu
- Hình nền riêng cho cả app, phủ màng tối 62% để chữ trắng vẫn đọc được
- **Chuông định kỳ**: kêu cách nhau 5/10/15/20/30/60 phút, đếm từ lúc bấm Bắt đầu
  chứ không theo giờ trong ngày. Đóng app rồi mở lại vẫn không lệch nhịp vì mốc kêu
  luôn được tính lại từ `batLuc`.

## Giới hạn cần biết của chế độ thông báo

- iOS chỉ cho tối đa 64 thông báo chờ. App chia ngân sách 56 chỗ: mỗi báo thức lặp chiếm `số thứ × 3` chỗ. Đặt quá nhiều thì app tự giảm số lần nhắc lại xuống còn 1 thay vì để iOS âm thầm bỏ bớt.
- Máy để im lặng hoặc bật Focus chặt: `interruptionLevel: 'timeSensitive'` giúp vượt phần lớn chế độ Focus, nhưng công tắc im lặng vật lý thì không vượt được. Đây là giới hạn của iOS, không phải lỗi app.
- Nhạc chuông chỉ kêu khoảng 30 giây mỗi thông báo.
- Chuông định kỳ dùng một notification lặp vô hạn (`TIME_INTERVAL` + `repeats: true`) làm
  xương sống, nên vẫn kêu đúng nhịp khi app bị treo ở nền hay bị tắt hẳn — nhưng lúc đó
  chỉ nghe bản wav 24 giây. Khi app đang mở thì store phát bản mp3 đầy đủ và handler tự
  tắt tiếng notification để khỏi nghe trùng.
- `huyLichBaoThuc()` cố tình không huỷ notification của chuông định kỳ. Nếu quay về
  `cancelAllScheduledNotificationsAsync()` thì mỗi lần thêm/sửa báo thức sẽ làm chuông
  định kỳ tắt ngang.

## Lệnh hay dùng

```bash
npm start
```

```bash
npx tsc --noEmit
```

```bash
npx eslint .
```

```bash
npx expo-doctor
```

## Ghi chú kỹ thuật

- `UIBackgroundModes: ["audio"]` trong `app.json` để chuông còn kêu khi app chạy nền. Khi nộp App Store, Apple có thể hỏi lý do dùng quyền này — câu trả lời là phát chuông báo thức.
- Hai file `.wav` trong `assets/sounds` được sinh bằng script Node (sóng sin + bao biên độ), dài 24 giây, PCM 16-bit 44.1kHz mono — đúng định dạng iOS nhận cho âm báo thông báo (phải dưới 30 giây).
- `expo-notifications` đăng ký category `bao-thuc` với hai nút Hoãn / Tắt, xử lý trong `_layout.tsx`.
- Báo thức một lần được gắn mốc `motLanLuc`; mỗi lần mở lại app, cái nào quá giờ hẹn 10 phút sẽ tự tắt.
