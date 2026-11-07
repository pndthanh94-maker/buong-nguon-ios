# Đưa tiếng chuông vào mục Nhạc chuông của iPhone

File `tieng-chuong.m4r` là nhạc chuông chuẩn iOS: AAC-LC, 44.1kHz, 30 giây, có vuốt nhỏ dần ở cuối.
Cắt từ bản gốc 61 giây vì iOS không nhận nhạc chuông dài quá 40 giây.

Cài xong nó nằm ở **Cài đặt → Âm thanh & Cảm ứng rung → Nhạc chuông**, và hiện luôn trong
danh sách âm báo của app **Đồng hồ** khi đặt báo thức.

Máy này chưa cài phần mềm nào đẩy file sang iPhone, nên phải chọn một trong ba cách dưới.

---

## Cách 1 — 3uTools (ít bước nhất)

1. Tải 3uTools ở `3u.com`, cài, cắm iPhone bằng cáp, bấm **Tin cậy** trên màn hình iPhone.
2. Vào mục **Ringtone** (hoặc Toolbox → Ringtone).
3. Bấm **Import** → chọn file `tieng-chuong.m4r` → **Import to Device**.
4. Trên iPhone: Cài đặt → Âm thanh & Cảm ứng rung → Nhạc chuông. File nằm ở đầu danh sách.

Không cần đồng bộ cả thư viện nhạc, không sợ mất dữ liệu sẵn có.

## Cách 2 — iTunes (chính thống của Apple)

1. Tải iTunes ở `apple.com/itunes` — lấy bản tải thẳng từ Apple, **không** lấy bản Microsoft Store.
2. Cắm iPhone, bấm Tin cậy.
3. Kéo thẳng file `tieng-chuong.m4r` vào cửa sổ iTunes. Nó vào mục **Âm báo** (Tones).
4. Bấm vào biểu tượng iPhone → tab **Âm báo** → tick **Đồng bộ âm báo** → **Áp dụng**.

Lưu ý: lần đồng bộ đầu iTunes có thể đòi xoá nhạc cũ trên máy nếu máy từng đồng bộ với thư viện khác.
Đọc kỹ hộp thoại trước khi bấm.

## Cách 3 — GarageBand, không cần máy tính

Chỉ làm được nếu cài được GarageBand. Bản mới đòi iOS 26, nhưng nếu Apple ID từng tải GarageBand
trước đây thì App Store sẽ hỏi "Tải bản tương thích cuối cùng?" — bấm đồng ý là được.
Thử mất 30 giây, không được thì quay lại cách 1.

1. Chép file nhạc vào app **Files** trên iPhone.
2. GarageBand → tạo project → nút vòng tròn (Loop) → tab **Files** → chọn file → kéo vào timeline.
3. Ra danh sách project (My Songs) → nhấn giữ project → **Share** → **Ringtone** → Export.

---

## Cái này KHÔNG giải quyết chuyện gì

Nhạc chuông chỉ đổi được *tiếng* của báo thức. App **Đồng hồ** của iOS vẫn **không đặt được
chế độ cứ 15 phút kêu một lần** — nó chỉ hẹn theo giờ trong ngày.

Muốn chuông định kỳ 5/10/15/20/30 phút thì vẫn phải dùng app `D:\app-chuong`.
