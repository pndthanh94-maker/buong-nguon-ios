Pod::Spec.new do |s|
  s.name           = 'AlarmKitBridge'
  s.version        = '1.0.0'
  s.summary        = 'Cầu nối AlarmKit (iOS 26+) cho app Báo Thức'
  s.description    = 'Expo module bọc AlarmKit để đặt báo thức thật trên iOS 26 trở lên.'
  s.author         = 'app-bao-thuc'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',

    # ĐÂY LÀ CÔNG TẮC BẬT ALARMKIT.
    #
    # Để bật: đổi thành '$(inherited) BAT_ALARMKIT'.
    #
    # Đang để trống vì code Swift trong ios/AlarmKitModule.swift chưa qua trình
    # biên dịch Swift lần nào (viết trên Windows). Máy build của GitHub dùng
    # Xcode 26 nên CÓ sẵn SDK AlarmKit — nếu bật, khối code chưa kiểm chứng đó
    # sẽ được biên dịch thật và có thể làm gãy cả bản build.
    #
    # Tắt thì app lùi về chế độ thông báo, vẫn đủ cho báo thức và chuông định kỳ.
    'SWIFT_ACTIVE_COMPILATION_CONDITIONS' => '$(inherited)'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
