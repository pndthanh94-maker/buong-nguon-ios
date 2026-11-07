// Cầu nối AlarmKit (iOS 26+).
//
// Toàn bộ code AlarmKit nằm sau cờ biên dịch BAT_ALARMKIT, mặc định TẮT.
//
// Lý do: file này viết trên Windows nên chưa qua trình biên dịch Swift lần nào.
// Máy build của GitHub dùng Xcode 26, tức là CÓ sẵn SDK AlarmKit — nếu chỉ dựa
// vào canImport(AlarmKit) thì khối code chưa kiểm chứng này sẽ được biên dịch
// thật và có thể làm gãy cả bản build, dù app không thực sự cần nó.
//
// Khi cờ tắt: coTheDung() trả về false, và index.ts phía JavaScript tự lùi về
// đường expo-notifications. Báo thức và chuông định kỳ vẫn chạy đủ, chỉ không
// vượt được công tắc im lặng của máy.
//
// Bật lại: trong AlarmKitBridge.podspec, sửa SWIFT_ACTIVE_COMPILATION_CONDITIONS
// thành '$(inherited) BAT_ALARMKIT'. Lần build đầu sau khi bật gần như chắc chắn
// cần chỉnh vài nhãn tham số cho khớp SDK AlarmKit thật.

import ExpoModulesCore
import CryptoKit

#if BAT_ALARMKIT && canImport(AlarmKit)
import AlarmKit
import SwiftUI
#endif

// MARK: - Thông số nhận từ JavaScript

struct ThongSoBaoThuc: Record {
  @Field var id: String = ""
  @Field var gio: Int = 7
  @Field var phut: Int = 0
  /// 1 = Chủ nhật … 7 = Thứ bảy. Danh sách rỗng nghĩa là báo một lần.
  @Field var thuLapLai: [Int] = []
  @Field var nhan: String = "Báo thức"
  @Field var chuNutTat: String = "Tắt"
  @Field var chuNutHoan: String = "Hoãn"
  @Field var hoanBat: Bool = true
  @Field var hoanPhut: Int = 9
  @Field var mauChu: String = "#FF375F"
}

// MARK: - Lỗi trả về cho JavaScript

internal final class KhongHoTroException: Exception {
  override var reason: String {
    "Thiết bị này không hỗ trợ AlarmKit. Cần iOS 26 trở lên và một development build."
  }
}

internal final class ChuaCapQuyenException: Exception {
  override var reason: String {
    "Người dùng chưa cho phép ứng dụng đặt báo thức."
  }
}

#if BAT_ALARMKIT && canImport(AlarmKit)
/// AlarmKit bắt buộc có kiểu metadata đi kèm; báo thức ở đây không cần dữ liệu thêm.
@available(iOS 26.0, *)
struct MetadataBaoThuc: AlarmMetadata {
  init() {}
}
#endif

public class AlarmKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AlarmKit")

    Function("coTheDung") { () -> Bool in
      AlarmKitModule.khaDung
    }

    AsyncFunction("trangThaiQuyen") { () -> String in
      #if BAT_ALARMKIT && canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        switch AlarmManager.shared.authorizationState {
        case .authorized: return "da-cho-phep"
        case .denied: return "tu-choi"
        case .notDetermined: return "chua-hoi"
        @unknown default: return "chua-hoi"
        }
      }
      #endif
      return "khong-ho-tro"
    }

    AsyncFunction("xinQuyen") { () -> Bool in
      #if BAT_ALARMKIT && canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return try await AlarmKitModule.capQuyenNeuCan()
      }
      #endif
      throw KhongHoTroException()
    }

    AsyncFunction("lenLich") { (thongSo: ThongSoBaoThuc) -> String in
      #if BAT_ALARMKIT && canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        return try await AlarmKitModule.datBaoThuc(thongSo)
      }
      #endif
      throw KhongHoTroException()
    }

    AsyncFunction("huy") { (id: String) in
      #if BAT_ALARMKIT && canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        try AlarmManager.shared.cancel(id: AlarmKitModule.dinhDanh(id))
      }
      #endif
    }

    AsyncFunction("huyNhieu") { (ids: [String]) in
      #if BAT_ALARMKIT && canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        for id in ids {
          // Huỷ từng cái một: một ID đã bị gỡ trước đó không được làm hỏng cả mẻ.
          try? AlarmManager.shared.cancel(id: AlarmKitModule.dinhDanh(id))
        }
      }
      #endif
    }

    AsyncFunction("tat") { (id: String) in
      #if BAT_ALARMKIT && canImport(AlarmKit)
      if #available(iOS 26.0, *) {
        try AlarmManager.shared.stop(id: AlarmKitModule.dinhDanh(id))
      }
      #endif
    }
  }

  // MARK: - Hỗ trợ

  private static var khaDung: Bool {
    #if BAT_ALARMKIT && canImport(AlarmKit)
    if #available(iOS 26.0, *) { return true }
    #endif
    return false
  }

  /// ID bên JavaScript không phải UUID, nên băm ra UUID cố định để lần sau còn huỷ đúng cái.
  private static func dinhDanh(_ chuoi: String) -> UUID {
    if let sanCo = UUID(uuidString: chuoi) { return sanCo }

    var b = Array(SHA256.hash(data: Data(chuoi.utf8)).prefix(16))
    b[6] = (b[6] & 0x0F) | 0x40
    b[8] = (b[8] & 0x3F) | 0x80
    return UUID(uuid: (
      b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7],
      b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]
    ))
  }

  #if BAT_ALARMKIT && canImport(AlarmKit)
  @available(iOS 26.0, *)
  private static func capQuyenNeuCan() async throws -> Bool {
    switch AlarmManager.shared.authorizationState {
    case .authorized:
      return true
    case .denied:
      return false
    case .notDetermined:
      return try await AlarmManager.shared.requestAuthorization() == .authorized
    @unknown default:
      return false
    }
  }

  @available(iOS 26.0, *)
  private static func doiThu(_ so: Int) -> Locale.Weekday? {
    switch so {
    case 1: return .sunday
    case 2: return .monday
    case 3: return .tuesday
    case 4: return .wednesday
    case 5: return .thursday
    case 6: return .friday
    case 7: return .saturday
    default: return nil
    }
  }

  @available(iOS 26.0, *)
  private static func mau(_ hex: String) -> Color {
    var chuoi = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if chuoi.hasPrefix("#") { chuoi.removeFirst() }
    guard chuoi.count == 6, let so = UInt32(chuoi, radix: 16) else { return .accentColor }
    return Color(
      red: Double((so >> 16) & 0xFF) / 255.0,
      green: Double((so >> 8) & 0xFF) / 255.0,
      blue: Double(so & 0xFF) / 255.0
    )
  }

  @available(iOS 26.0, *)
  private static func datBaoThuc(_ t: ThongSoBaoThuc) async throws -> String {
    guard try await capQuyenNeuCan() else { throw ChuaCapQuyenException() }

    let nutTat = AlarmButton(
      text: LocalizedStringResource(stringLiteral: t.chuNutTat),
      textColor: .white,
      systemImageName: "stop.fill"
    )

    let canhBao: AlarmPresentation.Alert
    if t.hoanBat {
      let nutHoan = AlarmButton(
        text: LocalizedStringResource(stringLiteral: t.chuNutHoan),
        textColor: .white,
        systemImageName: "zzz"
      )
      canhBao = AlarmPresentation.Alert(
        title: LocalizedStringResource(stringLiteral: t.nhan),
        stopButton: nutTat,
        secondaryButton: nutHoan,
        secondaryButtonBehavior: .countdown
      )
    } else {
      canhBao = AlarmPresentation.Alert(
        title: LocalizedStringResource(stringLiteral: t.nhan),
        stopButton: nutTat
      )
    }

    let thuocTinh = AlarmAttributes<MetadataBaoThuc>(
      presentation: AlarmPresentation(alert: canhBao),
      metadata: MetadataBaoThuc(),
      tintColor: mau(t.mauChu)
    )

    let thu = t.thuLapLai.compactMap { doiThu($0) }
    let lich = Alarm.Schedule.relative(
      Alarm.Schedule.Relative(
        time: Alarm.Schedule.Relative.Time(hour: t.gio, minute: t.phut),
        repeats: thu.isEmpty ? .never : .weekly(thu)
      )
    )

    let thoiGianHoan: Alarm.CountdownDuration? = t.hoanBat
      ? Alarm.CountdownDuration(preAlert: nil, postAlert: TimeInterval(max(1, t.hoanPhut) * 60))
      : nil

    let cauHinh = AlarmManager.AlarmConfiguration<MetadataBaoThuc>(
      countdownDuration: thoiGianHoan,
      schedule: lich,
      attributes: thuocTinh
    )

    let id = dinhDanh(t.id)
    _ = try await AlarmManager.shared.schedule(id: id, configuration: cauHinh)
    return id.uuidString
  }
  #endif
}
