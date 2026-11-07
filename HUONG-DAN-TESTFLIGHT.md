# Đưa app lên TestFlight để gửi cho người khác

Mục đích: có một **đường link** gửi qua Zalo, người nhận bấm vào là cài được app lên iPhone.
Không cần cáp, không cần máy tính, không cần biết kỹ thuật.

Tài liệu này viết cho app **Báo Thức** ở thư mục gốc (Expo SDK 58).

---

## Vì sao phải trả 99 USD

Apple bắt buộc mọi app chạy trên iPhone người khác phải được ký bằng chứng chỉ của một
tài khoản Apple Developer **có trả phí**. Không có đường vòng hợp pháp. Bản `.ipa` không ký
mà kho này build bằng GitHub Actions chỉ dùng được cho máy của chính chủ, qua Sideloadly,
và 7 ngày phải ký lại một lần.

Đổi lại 99 USD/năm, TestFlight cho:

| | |
|---|---|
| Số người nhận | tới 10.000 |
| Cách gửi | một đường link công khai |
| Người nhận cần làm gì | tải app TestFlight ở App Store, bấm link, bấm Install |
| Mỗi bản dùng được | 90 ngày, hết thì đẩy bản mới lên |
| Chuông | kêu trọn vẹn, đúng như bản chạy thật |

---

## Bước 1 — Đăng ký Apple Developer

1. Vào `developer.apple.com/programs`, bấm **Enroll**.
2. Đăng nhập bằng Apple ID của anh. Apple ID này **phải đã bật xác thực hai lớp**.
3. Chọn **Individual** nếu đăng ký với tư cách cá nhân.
4. Trả 99 USD. Apple duyệt thường **1–2 ngày**, có khi lâu hơn.

Duyệt xong, vào `developer.apple.com/account` → mục **Membership**, chép lấy **Team ID**
(một chuỗi 10 ký tự kiểu `AB12XYZ34S`).

## Bước 2 — Tạo app trên App Store Connect

1. Vào `appstoreconnect.apple.com` → **My Apps** → dấu **+** → **New App**.
2. Điền:
   - Platform: **iOS**
   - Name: `Báo Thức` (tên này hiện trong TestFlight)
   - Primary Language: **Vietnamese**
   - Bundle ID: chọn `com.baothuc.app`
   - SKU: gõ gì cũng được, ví dụ `baothuc2026`
3. Tạo xong, vào **App Information**, chép lấy **Apple ID** của app — một dãy số
   khoảng 10 chữ số. Đó chính là `ascAppId`.

## Bước 3 — Điền hai mã vừa lấy vào `eas.json`

Mở `eas.json`, thay hai chỗ đang để chữ hoa:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "1234567890",
      "appleTeamId": "AB12XYZ34S"
    }
  }
}
```

**Không điền địa chỉ email Apple ID vào file này.** Kho này để công khai trên GitHub.
EAS sẽ tự hỏi email khi chạy, hoặc anh đặt biến môi trường `EXPO_APPLE_ID`.

## Bước 4 — Tạo tài khoản Expo và build

Tài khoản Expo **miễn phí**, đăng ký ở `expo.dev`.

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest build --platform ios --profile production
```

Lần đầu chạy, EAS sẽ hỏi đăng nhập Apple rồi **tự tạo chứng chỉ và provisioning profile** —
anh không phải đụng vào Xcode hay Keychain. Cứ đồng ý các bước nó hỏi.

Build chạy trên máy chủ của Expo, khoảng **20–40 phút**.

## Bước 5 — Đẩy lên TestFlight

```bash
npx eas-cli@latest submit --platform ios --profile production
```

Hoặc gộp cả hai bước bằng cách thêm `--auto-submit` vào lệnh build.

## Bước 6 — Bật link công khai

1. Vào App Store Connect → app của anh → tab **TestFlight**.
2. Bản build mới lên sẽ ở trạng thái *Processing* chừng 10–30 phút.
3. Tạo một nhóm ở **External Testing**, thêm bản build vào.
4. Lần đầu, Apple **duyệt bản beta** — thường 1–2 ngày. Những lần sau nhanh hơn nhiều.
5. Duyệt xong, bật **Public Link**. Đó là đường link anh gửi Zalo.

> Nếu chỉ gửi cho vài người và muốn **bỏ qua khâu duyệt**, dùng **Internal Testing**:
> tối đa 100 người, nhưng mỗi người phải được thêm vào tài khoản Apple Developer của anh
> với vai trò tester. Không có link công khai, Apple gửi lời mời qua email.

---

## Những chỗ Apple hay hỏi lại

**`UIBackgroundModes: ["audio"]`** — app khai quyền phát âm thanh dưới nền. Apple có thể
hỏi lý do. Trả lời thật: *app là báo thức và chuông định kỳ, cần phát chuông khi chạy nền*.
Đây là lý do chính đáng, không phải vấn đề.

**Khai báo mã hoá** — `app.json` đã đặt `ITSAppUsesNonExemptEncryption: false`. Nghĩa là
app không dùng thuật toán mã hoá nào ngoài những thứ hệ điều hành cung cấp sẵn. Điều này
đúng với app hiện tại. Nhờ vậy mỗi lần đẩy bản mới không bị hỏi lại câu xuất khẩu mã hoá.
Nếu sau này thêm tính năng có mã hoá riêng thì phải sửa lại khai báo này.

**Số hiệu bản build** — `eas.json` đặt `autoIncrement: "buildNumber"` với
`appVersionSource: "local"`, nên mỗi lần build EAS tự tăng `ios.buildNumber` trong
`app.json`. Nhớ commit thay đổi đó, nếu không lần sau sẽ trùng số và App Store Connect
từ chối nhận.

**AlarmKit đang tắt** — xem ghi chú đầu `modules/alarm-kit/ios/AlarmKitModule.swift`.
Bản lên TestFlight sẽ chạy chế độ thông báo. Nghĩa là **máy để im lặng thì không nghe
chuông** — cần dặn trước người dùng, nếu không họ sẽ tưởng app hỏng.
