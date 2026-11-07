# Buông — app chuông định kỳ

Một màn hình, một việc: chuông kêu cách nhau **5 / 10 / 15 / 20 / 30 phút**, đếm từ lúc bấm Bắt đầu chứ không theo giờ trong ngày. Không có báo thức, không đặt giờ, không danh sách.

Chạy được cả **iOS** lẫn **Android** từ cùng một bộ mã.

## Yêu cầu

**iOS 15.1 trở lên** · **Android 7.0 trở lên** (theo ghi chú phát hành Expo SDK 55; số chính xác hiện ra trong `android/build.gradle` sau khi prebuild).

App dựng trên Expo SDK 55 — bản cuối còn hỗ trợ iOS 15, vì từ SDK 56 Expo nâng sàn lên iOS 16.4.

Máy đích thực tế đang chạy **iOS 16.7**, nên SDK 58 cũng dùng được. Giữ SDK 55 vì nó chạy tốt trên 16.7 và lên SDK 58 không được thêm gì: thứ duy nhất SDK mới mang lại cho app này là AlarmKit, mà AlarmKit đòi iOS 26. Đổi SDK chỉ tạo rủi ro chứ không đổi được điều gì.

## Chuông kêu bằng cách nào

Hai lớp, vì iOS giới hạn app bên thứ ba:

| Lúc đó | Nghe gì |
|---|---|
| App đang mở | Bản mp3 đầy đủ 61 giây, vượt công tắc im lặng nhờ `playsInSilentMode`, dùng `duckOthers` nên chỉ hạ nhạc khác xuống rồi trả lại |
| App ở nền hoặc đã tắt | Notification lặp vô hạn, bản wav cắt 24 giây |

Khi app đang mở, handler tự tắt tiếng notification để khỏi nghe trùng hai lần.

Mốc kêu luôn tính lại từ `batLuc` chứ không cộng dồn, nên đóng app rồi mở lại vẫn đúng nhịp tuyệt đối — đã kiểm chứng bằng cách tải lại giữa chừng, đếm ngược chạy tiếp chứ không reset.

## Android — dễ hơn iOS nhiều

Không cần máy Mac, không phải ký lại 7 ngày, không cần TrollStore. Tải file `.apk` về, bấm vào, cài xong.

### Cách 1 — EAS Build (ít bước nhất, không cần GitHub)

```bash
npx eas-cli login
```

```bash
npx eas-cli build --platform android --profile preview
```

Đăng nhập bằng tài khoản Expo miễn phí. Build xong nó đưa một đường link tải `.apk` — mở link đó ngay trên điện thoại Android là tải và cài được luôn.

### Cách 2 — GitHub Actions

Workflow `.github/workflows/build-apk.yml` chạy trên runner Linux, nhanh và rẻ hơn hẳn build iOS. Đẩy code lên GitHub → Actions → **build-apk** → Run workflow → tải artifact `Buong-apk`.

### Cài lên máy Android

Chép file `.apk` vào máy, mở app **Tệp**, chạm vào nó. Lần đầu Android sẽ hỏi cho phép cài app từ nguồn này — bật rồi quay lại bấm Cài đặt.

APK này ký bằng khoá debug mặc định của Expo. Đủ để cài riêng cho mình, nhưng không đưa lên Google Play được.

### Khác biệt cần biết trên Android

- **Chế độ Doze có thể làm chuông trễ.** Khi máy để yên màn hình tắt lâu, Android gom các thông báo lại để tiết kiệm pin, nên mốc 15 phút có thể lệch vài phút. iOS không bị kiểu này. Muốn đúng tuyệt đối thì vào Cài đặt → Pin → bỏ tối ưu hoá pin cho app Buông.
- **Tên file âm thanh phải dùng gạch dưới**, không được gạch ngang. Tên tài nguyên Android chỉ nhận `a-z`, `0-9` và `_`. Đây là lý do file tên `tieng_chuong.wav`. Đổi thành gạch ngang là prebuild ném lỗi ngay.
- Kênh thông báo đặt ở mức **HIGH** để chuông nổi lên màn hình, không chỉ kêu lặng lẽ.

## iOS — xuất file .ipa để cài lên máy

Workflow `.github/workflows/build-ipa.yml` build trên runner macOS của GitHub, ra file **.ipa không ký** — không cần máy Mac, không cần tài khoản Apple Developer.

Đẩy project lên GitHub → tab **Actions** → **build-ipa** → **Run workflow** → tải artifact `Chuong-ipa`.

Cài lên iPhone từ Windows:

| Cách | Hết hạn | Điều kiện |
|---|---|---|
| **AltStore + AltServer** | 7 ngày nhưng **tự gia hạn** | Apple ID miễn phí. AltServer trên PC tự ký lại qua WiFi khi hai máy cùng mạng. Cách nên dùng. |
| Sideloadly | 7 ngày, cắm cáp ký lại bằng tay | Apple ID miễn phí |
| TrollStore | Vĩnh viễn | **Không dùng được trên iOS 16.7** — Apple vá lỗi CoreTrust ở đúng bản này. Chỉ chạy tới 16.6.1. |
| Tài khoản Apple Developer | 1 năm | 99 USD/năm |

## Đường đi đầy đủ: từ project này tới app nằm trên iPhone

Bốn bước. Bước 1 và 2 làm một lần, sau này sửa app chỉ cần lặp lại bước 3.

### 1. Chuẩn bị AltStore trên iPhone

TrollStore không dùng được trên iOS 16.7, nên đi đường AltStore:

1. Tải **AltServer** cho Windows ở altstore.io. Cần iTunes và iCloud bản tải thẳng từ Apple, **không phải** bản Microsoft Store.
2. Cắm iPhone bằng cáp, mở AltServer → *Install AltStore* → chọn máy → đăng nhập Apple ID. Nên dùng một Apple ID phụ, không dùng tài khoản chính.
3. Trên iPhone: Cài đặt → Cài đặt chung → VPN & Quản lý thiết bị → tin cậy chứng chỉ vừa tạo.

Sau đó AltServer tự ký lại app mỗi 7 ngày khi iPhone và PC cùng mạng WiFi. Không phải làm gì thêm, miễn thỉnh thoảng cả hai cùng bật.

**Một khả năng nhỏ đáng kiểm tra trước**: riêng bản 16.7 RC, số build `20H18`, thì TrollStore vẫn chạy và cài được vĩnh viễn. Xem ở Cài đặt → Cài đặt chung → Giới thiệu, chạm vào dòng Phiên bản phần mềm để hiện số build. Nếu đúng `20H18` thì đổi hướng sang TrollStore, khỏi phải ký lại hàng tuần.

### 2. Đẩy project lên GitHub

Cần một tài khoản GitHub miễn phí. Tạo một repo **private** rỗng, rồi ở thư mục này chạy:

```bash
git add -A && git commit -m "App chuong dinh ky cho iOS 15"
```

```bash
git remote add origin https://github.com/<tên-tài-khoản>/app-chuong.git
```

```bash
git push -u origin master
```

Repo private vẫn chạy Actions miễn phí, đủ khoảng 10 lần build mỗi tháng.

### 3. Bấm build

Vào repo trên GitHub → tab **Actions** → chọn **build-ipa** ở cột trái → nút **Run workflow**. Chờ tầm 15–30 phút. Xong thì cuộn xuống phần **Artifacts**, tải `Chuong-ipa` về — giải nén ra file `Chuong-unsigned.ipa`.

### 4. Đưa file vào máy

Cách gọn nhất: để file `.ipa` trên PC, cắm iPhone, chuột phải vào biểu tượng AltServer dưới khay hệ thống → *Sideload .ipa* → chọn máy → chọn file.

Hoặc chép file vào iPhone qua iCloud Drive rồi mở app **AltStore** trên máy → tab *My Apps* → dấu **+** góc trên → chọn file `.ipa`.

Xong. App **Chuông** nằm ở màn hình chính.

### Nếu build gãy

Lần build đầu hay gãy ở bước `pod install` hoặc `xcodebuild`. Vào Actions → lần chạy bị đỏ → mở bước bị lỗi, chép đoạn log đỏ ra là sửa được.

## Cấu trúc

```
App.tsx              Màn hình duy nhất
src/
  chuong.ts          Tính mốc kêu, lưu trữ, lên lịch notification lặp
  useChuong.ts       Hook: nhịp 1 giây, phát mp3, đồng bộ khi quay lại app
  theme.ts           Màu, cỡ chữ
assets/
  tieng_chuong.mp3   Bản đầy đủ 61 giây, phát trong app
  tieng_chuong.wav   Bản cắt 24 giây, cho notification (iOS bỏ qua file quá 30 giây;
                     tên dùng gạch dưới vì tài nguyên Android không nhận gạch ngang)
  hinh-nen.jpg       Hình nền dọc dựng từ buong-bo.jpg bằng ffmpeg
```

## Giới hạn cần biết

- **App hết hạn sau 7 ngày** nếu ký bằng Apple ID miễn phí. AltServer tự gia hạn khi iPhone và PC cùng mạng WiFi, nhưng đi xa lâu ngày thì app sẽ ngừng mở được cho tới khi về.
- **Không vượt được công tắc im lặng vật lý khi app ở nền.** Lúc đó tiếng đến từ notification, mà notification thì theo công tắc im lặng. `interruptionLevel: 'timeSensitive'` vượt được phần lớn chế độ Focus, nhưng không vượt công tắc cứng. Đây là giới hạn của iOS, không phải lỗi app.
- **Notification chỉ kêu khoảng 30 giây.** Vì vậy mới có bản wav 24 giây.
- **Chưa cấp quyền thông báo thì chuông chỉ kêu khi app đang mở.** App vẫn chạy và vẫn đếm, chỉ là mất lớp dự phòng.
- iOS bắt buộc chu kỳ notification lặp từ 60 giây trở lên. Mốc nhỏ nhất ở đây là 5 phút nên luôn thoả.

## Lệnh hay dùng

```bash
npm run web          # xem nhanh giao diện trên trình duyệt (không có notification)
npm run typecheck    # tsc --noEmit
npx expo start       # chạy với Expo Go hoặc development build
```
