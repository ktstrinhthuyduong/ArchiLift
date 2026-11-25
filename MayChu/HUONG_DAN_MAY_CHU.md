# ArchiLift — Cài máy chủ luôn bật

Cài ArchiLift lên một máy luôn bật trong văn phòng, để mọi người dùng chung qua một link cố định, kể cả khi máy của KTS chủ trì đã tắt.

## Chọn máy chủ

- Máy để bàn **luôn bật** và **cắm dây mạng**. Có thể dùng máy lưu file, máy in hoặc máy văn phòng ít tắt.
- Windows 10/11 và tài khoản có **quyền quản trị** để chạy bộ cài.
- Đã cài **Python 3** từ python.org:
  - tích ô "Add python.exe to PATH";
  - nên chọn "Install for all users".

## Các bước

1. **Chép cả thư mục ArchiLift** vào ổ cứng của máy chủ, ví dụ `D:\ArchiLift`.
   - Không chạy từ ổ mạng hay USB: tác vụ chạy lúc khởi động Windows không đọc được các ổ này.
   - Muốn chuyển cả dự án đang làm sang máy chủ: chép kèm `_shared\ArchiLift_chung.json` từ máy cũ.
2. **Kiểm tra trước:** nháy đúp `MayChu\KiemTra_MayChu.bat`.
   - Bước này chỉ xem máy có đủ điều kiện không, không thay đổi gì.
   - Dòng `[LỖI]` thì phải sửa trước khi cài. Dòng `[!]` là lưu ý.
3. **Cài:** nháy đúp `MayChu\CaiDat_MayChu.bat`, rồi bấm **Yes** khi Windows hỏi quyền quản trị. Bộ cài sẽ:
   - tạo tác vụ **"ArchiLift May Chu"**:
     - tự chạy 30 giây sau khi Windows khởi động, không cần ai đăng nhập;
     - chạy ẩn, không có cửa sổ;
     - tự chạy lại sau 1 phút nếu bị dừng do lỗi;
   - mở tường lửa cổng TCP **8765** cho mạng nội bộ (Domain / Private);
   - hỏi có tắt chế độ ngủ khi cắm điện không. Nên chọn **C** (có). Màn hình vẫn tự tắt bình thường;
   - chạy máy chủ ngay, mở trình duyệt, và in ra **link cho mọi người**, ví dụ `http://192.168.100.66:8765/index.html`;
   - tạo file lối tắt `MayChu\ArchiLift_<IP>.url`. Gửi file này cho đồng nghiệp: nháy đúp là mở ArchiLift, biểu tượng là logo Archivina.
4. **Giữ IP cố định:** nhờ quản trị mạng **giữ chỗ IP (DHCP reservation)** cho máy chủ trên router. Nếu IP đổi thì link cũ không vào được nữa.

## Dùng hằng ngày

- Mọi người mở link (hoặc file `.url`). Mỗi lúc **một người sửa**: ai cần sửa thì bấm **Xin sửa**. Những người khác xem, màn hình tự cập nhật khoảng 3 giây một lần.
- Dự án chung lưu trên máy chủ, trong file `_shared\ArchiLift_chung.json`. Nên **Lưu .json** định kỳ để có bản sao lưu.
- Sau khi đã có máy chủ, máy cá nhân **không chạy** `ArchiLift.vbs` / `ArchiLift_LAN.vbs` nữa, nếu không sẽ thành 2 bản dự án khác nhau. Chỉ dùng link máy chủ.
- Nút **Tắt** chỉ hiện khi mở ArchiLift ngay trên máy chủ. Bấm Tắt là dừng cho **mọi người**, đến lần khởi động Windows sau mới tự chạy lại.

## Cập nhật phiên bản mới

Chép đè các file mới vào thư mục ArchiLift trên máy chủ, **không chép đè** thư mục `_shared`. Sau đó khởi động lại máy chủ, hoặc chạy lại `CaiDat_MayChu.bat`. Người dùng bấm Ctrl + F5 để nạp giao diện mới.

## Gỡ cài đặt

Nháy đúp `MayChu\GoCaiDat_MayChu.bat`. Lệnh này xoá tác vụ tự chạy và luật tường lửa, rồi tắt máy chủ. Thư mục ArchiLift và dữ liệu dự án được giữ nguyên.

## Khi không vào được

| Hiện tượng | Kiểm tra |
|---|---|
| Không vào được từ máy khác, nhưng trên máy chủ mở `http://localhost:8765` được | Mạng đang để **Public**: đổi sang Private. Hoặc tường lửa của phần mềm diệt virus đang chặn cổng 8765. |
| Không vào được cả trên máy chủ | Mở Task Scheduler, xem tác vụ "ArchiLift May Chu" ở trạng thái Running chưa. Log ở `C:\Windows\Temp\ArchiLift_server.log`. |
| Hôm qua vào được, hôm nay không | IP máy chủ đã đổi. Chạy lại `KiemTra_MayChu.bat` để xem IP mới, rồi giữ chỗ IP trên router. |
