# Bàn giao — dự án Buông

Tài liệu cho người tiếp nhận. Viết ngày 02/11/2026.

Mục đích: ghi lại **những gì đã làm, vì sao làm vậy, và chỗ nào chưa chắc chắn** — nhất là
những cạm bẫy của nền tảng đã phải trả giá mới tìm ra. Đọc mục 4 trước khi sửa bất cứ thứ gì.

---

## 1. Dự án này là gì

Một cái chuông nhắc "buông", kêu cách nhau đều đặn **1 / 5 / 10 / 15 / 20 / 30 phút**,
đếm từ lúc người dùng bấm Bắt đầu chứ không theo giờ trong ngày.

Ba bản cho ba nền tảng, dùng chung tiếng chuông, hình nền và icon.

| Thư mục | App | Nền tảng | Khung |
|---|---|---|---|
| `app-chuong/` | **Buông** | iOS 15.1+ · Android 7+ | Expo SDK 55, RN 0.83.10 |
| `app-windows/` | **Buông** | Windows | Electron 45 |
| thư mục gốc | **Báo Thức** | iOS 16.4+ | Expo SDK 58, RN 0.88.1 |

App ở thư mục gốc là app báo thức đầy đủ (danh sách báo thức, lặp theo thứ, hoãn, AlarmKit).
`app-chuong` tách ra riêng vì ban đầu tưởng máy đích chạy iOS 15 — hoá ra iOS 16.7, nhưng vẫn
giữ nguyên vì nó đúng phạm vi người dùng cần: **chỉ chuông định kỳ, không có báo thức**.

---

## 2. Người dùng muốn gì

- Chỉ cần chuông định kỳ, **không cần đặt giờ báo thức**
- Tiếng chuông phải kêu **trọn file 69 giây**
- Nút tăng giảm âm lượng **không được làm tắt chuông**

## 3. Quy tắc của chủ dự án

- **Mọi thứ liên quan đến báo thức và chuông đều nằm trong thư mục dự án này.**
  Không tự ý tạo thư mục mới trên ổ D.
- Đặt tên biến, hàm, ghi chú bằng **tiếng Việt**. Giữ nguyên nếp này.
- Thư mục `ban-cu-v1.0/` là bản dự phòng để quay về. Không xoá.

---

## 4. Những bài học đã trả giá

Đây là phần giá trị nhất của tài liệu. Mỗi mục là một lỗi thật đã gặp, kèm triệu chứng.

### 4.1 Expo SDK 56 nâng sàn iOS lên 16.4

SDK 55 là bản **cuối cùng** còn hỗ trợ iOS 15.1. Từ SDK 56 trở đi mọi gói Expo khai
`:ios => '16.4'` ngay trong podspec — sửa `deploymentTarget` trong `app.json` xuống thấp hơn
sẽ **không** build được, vì native code của chính Expo đòi vậy.

Kiểm nhanh: tìm chuỗi `:ios =>` trong các tệp `.podspec` dưới `node_modules/expo/`.

### 4.2 Tên tài nguyên Android không nhận gạch ngang

File âm thanh tên `tieng-chuong.wav` làm **prebuild ném lỗi ngay**. Plugin `expo-notifications`
gọi `assertValidAndroidAssetName`, hàm này ném chứ không tự sửa. Tài nguyên Android chỉ nhận
`a-z`, `0-9`, `_`.

Vì vậy mọi file âm thanh trong `app-chuong/assets/` đều dùng **gạch dưới**.

### 4.3 Android cắt âm thanh nền sau khoảng 3 phút

Chỉ đặt `shouldPlayInBackground: true` là **chưa đủ**. Tài liệu Expo ghi rõ: thiếu
`setActiveForLockScreen(true, ...)` thì hệ điều hành cắt sau khoảng 3 phút.

Cách giữ app sống ở nền (xem `app-chuong/src/useChuong.ts`): phát file `im_lang.wav`
(10 giây im lặng) **lặp vô hạn** kèm bật điều khiển màn khoá. Android chỉ để app chạy tiếp
khi nó đang thực sự phát âm thanh.

Hệ quả: có một thông báo thường trực "Buông — Chuông định kỳ" khi chuông chạy. Android bắt buộc.

### 4.4 iOS giới hạn nhạc thông báo 30 giây, Android thì không

Nên mỗi nền tảng một file khác nhau, xem hằng `FILE_CHUONG` trong `app-chuong/src/chuong.ts`:

| File | Giây | Dùng cho |
|---|---|---|
| `tieng_chuong.mp3` | 69 | App tự phát, cả hai nền tảng |
| `tieng_chuong_dai.wav` | 69 | Thông báo **Android** |
| `tieng_chuong.wav` | 24 | Thông báo **iOS** — quá 30 giây là iOS bỏ qua cả thông báo |
| `im_lang.wav` | 10 | Giữ app sống ở nền |

### 4.5 iOS bắt chu kỳ thông báo lặp tối thiểu 60 giây

Mốc 1 phút nằm đúng ranh giới. Hạ xuống 30 giây thì iOS **lặng lẽ không kích hoạt**, app
trông như hỏng mà không báo lỗi gì.

### 4.6 Chromium bóp nhịp đồng hồ cửa sổ Electron bị thu nhỏ

Mặc định `backgroundThrottling` bật. Cửa sổ ẩn quá 5 phút thì đồng hồ chỉ còn chạy mỗi phút
một lần hoặc đóng băng hẳn — **các mốc dài bị lỡ, mốc ngắn thì chưa kịp bị bóp**.

Đã tắt trong `app-windows/main.js`. Đừng bật lại.

### 4.7 Gradle và Java không đọc được đường dẫn có dấu tiếng Việt

Để dự án ở `D:\14. Dự Án Trao Quyền Chọn\...` thì build gãy, tên thư mục bị băm thành
`D? �n Trao Quy?n Ch?n`. Java trên Windows giải mã đường dẫn theo bảng mã ANSI, dấu tiếng
Việt không nằm trong đó.

Đã thử cả bốn cách — `gradlew` của Git Bash, `gradlew.bat`, gọi thẳng `java.exe`, và tạo liên
kết thư mục không dấu — **đều gãy**. Liên kết không cứu được vì Node tự giải nó về đường dẫn
thật rồi ghi vào `settings.gradle`.

**Dự án phải nằm ở đường dẫn không dấu.** Hiện tại `D:\19. Design-app-bao-thuc` là hợp lệ.

### 4.8 Gradle để sót tiến trình Java sau khi bị dừng

Dừng build giữa chừng (kể cả có `--no-daemon`) vẫn để lại tiến trình Java giữ file. Lần build
sau gãy với `Unable to delete directory ... merged_native_libs`.

Cách dọn: lọc tiến trình `java.exe` có dòng lệnh chứa `Eclipse Adoptium` rồi dừng hết, sau đó
xoá thư mục `app-chuong/android` và prebuild lại.

### 4.9 expo-audio@55 khai expo-asset là ký tự đại diện

Ở phần peerDependencies. npm kéo về bản mới nhất (58), lệch với expo 55, Metro không resolve
được `expo/internal/bundle-origin`. Đã ghim `expo-asset ~55.0.20` thành dependency trực tiếp.
**Đừng gỡ nó ra.**

### 4.10 ImageBackground không scale trên React Native Web 0.88

Lớp ảnh bên trong giữ nguyên kích thước gốc và bỏ qua `resizeMode`, kết quả chỉ thấy góc trên
trái. Dùng `<Image>` phủ tuyệt đối với chiều rộng và cao 100% thay thế — xem `src/ui/NenApp.tsx`.

### 4.11 Hai chuyện về kiểm thử

- **Windows không hiện được icon của file APK.** Biểu tượng file trắng trong Explorer là bình
  thường, không kết luận được gì. Muốn xem icon thật thì moi từ APK ra: dùng `aapt2 dump badging`
  để tìm, rồi giải nén tệp `res/*.webp` tương ứng.
- **Kích thước byte khớp không có nghĩa là đúng.** Từng kiểm icon bằng cách đối chiếu dung
  lượng rồi báo xong, hoá ra ô cắt sai bố cục. Phải nhìn tận mắt.

### 4.12 TrollStore không dùng được trên iOS 16.7

Apple vá lỗi CoreTrust ở đúng bản này. Bản cuối chạy được là **16.6.1** (riêng bản 16.7 RC,
số build `20H18`, thì vẫn được). iOS 16.7 phải dùng AltStore hoặc Sideloadly — ký lại 7 ngày.

---

## 5. Cách build

Biến môi trường đã đặt cố định ở mức User: `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`.

### Android (`app-chuong`)

```bash
npx expo prebuild --platform android --no-install
```

```bash
cd android && ./gradlew assembleRelease --no-daemon
```

File ra ở `android/app/build/outputs/apk/release/app-release.apk`. APK được ký bằng khoá debug
mặc định của Expo nên **cài được ngay**, nhưng không lên Play Store được.

Đổi file âm thanh hay icon thì **bắt buộc chạy lại prebuild**, nếu không tài nguyên cũ vẫn nằm
trong `android/app/src/main/res/`.

### Windows (`app-windows`)

```bash
npm run dist
```

File ra ở `dist/Buông Setup 1.0.0.exe`. Chưa ký chứng chỉ số nên Windows SmartScreen sẽ cảnh
báo — muốn hết phải mua chứng chỉ code signing, khoảng 200–400 USD mỗi năm.

Lưu ý: npm chặn script cài của Electron. Nếu `node_modules/electron/dist/electron.exe` không
có thì chạy `node node_modules/electron/install.js`.

### iOS

**Chưa từng build lần nào.** Có sẵn `.github/workflows/build-ipa.yml` chạy trên runner macOS
của GitHub, nhưng chưa chạy thử. Máy đích là iOS 16.7 nên cài phải qua AltStore.

---

## 6. Bộ công cụ đã cài trên máy

| Thứ | Phiên bản | Ở đâu |
|---|---|---|
| JDK | Temurin 17.0.20.1 | `C:\Program Files\Eclipse Adoptium\` |
| Android SDK | platform-tools 37.0.1, platform android-36, build-tools 36.0.0 | `C:\Users\Windows\AppData\Local\Android\Sdk\` |
| Android CLI | 1.1.16717390 | lệnh `android` |
| GitHub CLI | 2.103.3 | `C:\Program Files\GitHub CLI\` — **chưa đăng nhập** |
| ffmpeg / ffprobe | có sẵn | dùng để dựng mọi file âm thanh và hình nền |

Git đã có chứng thực GitHub của `pndthanh94-maker` trong Windows Credential Manager, nên
`git push` chạy thẳng không hỏi mật khẩu. Còn `gh` giữ đăng nhập ở kho riêng, hiện chưa có.

---

## 7. Việc còn dở

### Chưa kiểm chứng trên máy thật

Đây là chỗ cần chú ý nhất. **Toàn bộ phần hành xử của hệ điều hành chưa ai xác nhận.**

- **Android**: người dùng báo mốc 10 phút trở lên **"có kêu nhưng trễ"**. Chẩn đoán: tiếng đến
  từ thông báo chứ không phải từ đồng hồ của app — đồng hồ chạy theo giây thì không thể trễ.
  Thông báo lặp của Android dùng `AlarmManager` kiểu không chính xác, chế độ Doze hoãn nó tới
  "cửa sổ bảo trì". Đã thêm nút **"Tắt tối ưu hoá pin"** (`app-chuong/src/pin.ts`) nhưng
  **chưa biết có giải quyết được không**.
- Cách phân biệt: khi chuông chạy mà **có** thông báo thường trực "Buông — Chuông định kỳ"
  thì app đang tự giữ mình sống, chuông sẽ đúng giờ. **Không có** dòng đó nghĩa là app bị
  treo, tiếng chỉ đến từ thông báo.
- Nếu đã tắt tối ưu hoá pin mà vẫn trễ: hãng điện thoại (Xiaomi, Oppo, Vivo, Samsung) còn một
  tầng chặn riêng nữa, mỗi hãng một chỗ.
- **Windows**: lỗi bóp nhịp đồng hồ đã sửa nhưng **chưa ai thử lại**.
- **iOS**: chưa build, chưa chạy bao giờ.

### Đã kiểm chứng

- Phép tính giờ đúng ở cả sáu mốc — trích thẳng ba hàm thật từ mã nguồn ra chạy thử
- Trạng thái bền qua lần tải lại: đếm ngược chạy tiếp, không reset
- Giao diện cả ba bản đều hiển thị đúng
- Bốn file âm thanh và hình nền nằm đúng trong APK, khớp byte

### Chưa làm

- **Release trên GitHub**: hai file cài `.apk` và `.exe` chưa đính kèm, vì cần `gh` đăng nhập.
  Chúng không nằm trong repo do GitHub chặn file trên 100MB — bản `.exe` nặng 120MB.
- **App Windows chưa có khay hệ thống**: đóng cửa sổ là chuông tắt, người dùng phải thu nhỏ.
  Cũng chưa có tự khởi động cùng Windows. Cả hai đều đã đề xuất, người dùng chưa trả lời.
- **App báo thức ở thư mục gốc có lỗi Android chưa sửa**: `chuong-co-dien.wav` và
  `binh-minh.wav` còn dấu gạch ngang, build Android sẽ gãy y như mục 4.2. Chưa sửa vì người
  dùng không yêu cầu, và app đó hiện chỉ nhắm iOS.
- `app-chuong/.git-template-cu` là kho git cũ của create-expo-app, đã đổi tên để gỡ lồng nhau.
  Xoá được, không mất gì.

---

## 8. Kho mã

**https://github.com/pndthanh94-maker/buong** — riêng tư, nhánh `main`.

Để ngoài repo: `node_modules`, thư mục `android/` và `ios/` sinh tự động, `app-windows/dist`,
`ban-cu-v1.0/`, và mọi file `.apk` `.exe`.
