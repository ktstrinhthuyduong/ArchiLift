# Nhật ký thay đổi ArchiLift

Ghi lại các thay đổi đáng chú ý của ArchiLift, mới nhất ở trên cùng. Mỗi phiên bản ghi theo **mã phiên bản code**, tức số `?v=` trong `app/index.html`.

Các nhóm thay đổi: **Thêm** (tính năng mới) · **Thay đổi** (cách hoạt động khác trước) · **Sửa lỗi** · **Kiểm tra** (số liệu đã đối chiếu) · **Tài liệu**.

---

## [Offline] — 25/11/2026

### Thêm

- Thư mục `Offline\`: **bản offline** mang sang máy khác, không cần Python / Internet / cài đặt.
  - `DongGoi_Offline.py`: đóng gói `ArchiLift_Offline_<yyyy-mm-dd>[_vNN].zip` (không ghi đè), chỉ gồm file giao diện (html, css, js, logo) + 2 file .vbs + `HUONG_DAN.txt` (ghi mã phiên bản code). Khoảng 80 KB.
  - `ArchiLift.vbs`: mở `app\index.html` thành cửa sổ ứng dụng riêng bằng Edge (hoặc Chrome) `--app`; không có thì mở bằng trình duyệt mặc định.
  - `Tao loi tat ArchiLift.vbs`: lối tắt Desktop + Start Menu, biểu tượng logo.

### Thay đổi

- Logo tab (favicon) thu về 16–64 px: 39 KB → 9 KB.

### Kiểm tra

- Mở bằng `file://` (Edge chạy ngầm): đủ 8 tab, tab 4 ra 2 bảng phương án, mô phỏng ra kết quả, lưu được trong trình duyệt, không lỗi JavaScript; đường dẫn có dấu cách và `#` mở đúng.

## [Máy chủ] — 23/11/2026

### Thêm

- Thư mục `MayChu\`: bộ cài **máy chủ luôn bật** cho mạng LAN (không đổi code giao diện).
  - `CaiDat_MayChu.bat` / `.ps1`: tự xin quyền quản trị; tạo tác vụ "ArchiLift May Chu" chạy lúc khởi động Windows bằng tài khoản SYSTEM (không cần đăng nhập, không giới hạn thời gian, tự chạy lại khi lỗi); mở tường lửa TCP 8765 (Domain/Private); hỏi tắt chế độ ngủ; tạo lối tắt `ArchiLift_<IP>.url`.
  - `KiemTra_MayChu.bat`: kiểm tra điều kiện, không thay đổi máy.
  - `GoCaiDat_MayChu.bat` / `.ps1`: xoá tác vụ và luật tường lửa, giữ dữ liệu.
  - `HUONG_DAN_MAY_CHU.md`.

## [20261123a] — 23/11/2026

### Sửa lỗi

- Tiêu chí "Hệ số tải tại nhu cầu" so với ô **hệ số tải** của nhóm thang (trước đây luôn so với 80%). `engine.js`, `AL.evaluate`; dòng tiêu chí ở tab 4 cũng ghi theo ô này.
- Kiểm tra thang chữa cháy (tab 7) tính **thời gian chạy hết hành trình theo profile S** (kể cả tăng/giảm tốc), so với 60 s tính từ lúc cửa đã đóng (EN 81-72 / TCVN 6396-72), thay cho v ≥ H/60. Ví dụ H = 104 m, 1,75 m/s: 61,8 s → **Không đạt** (trước đây báo đạt); 2,0 m/s: 54,7 s → Đạt. Hàm mới `AL.fireRunTime`.

### Thay đổi

- Chọn thang tự động (tab 4): mỗi phương án có cột **Kho hãng** (tổ hợp tải × vận tốc có/không có trong `liftdata.js`). "Phương án gọn nhất theo từng số cabin" ưu tiên tổ hợp có trong kho. Ví dụ dự án mẫu 4 cabin: trước đây gợi ý 630 kg × 7 m/s, nay 1000 kg × 3 m/s. Hàm mới `AL.inLibrary`.
- Chia sẻ LAN (`serve.py`): bấm **Xin sửa** khi người khác đang sửa thì phải xác nhận mới giành quyền; máy đang sửa không liên lạc quá 10 phút (tắt máy, đóng trình duyệt) thì quyền sửa tự được thả.

### Thêm

- Sao lưu dự án chung: trước khi ghi đè `_shared\ArchiLift_chung.json`, bản cũ được chép vào `_shared\backup\` (tối đa 1 bản / 5 phút, giữ 10 bản mới nhất). Muốn quay lại: chép bản cần dùng đè lên `ArchiLift_chung.json` khi server đang tắt.

### Kiểm tra

- Dự án mẫu (`VD_ArchiLift_2026-11-18_v06.json`, nhóm P): RTT 202,6 s · INT 33,8 s · HC5 92,4 người/5 phút — không đổi so với bản trước.

## [20261119f] — 19/11/2026

### Thêm

- Biểu tượng tab trình duyệt (favicon) là chữ A trong logo Archivina, nền trong suốt: `app/img/favicon.ico`, `app/img/favicon.png`.

## [20261119e] — 19/11/2026

### Thay đổi

- `ArchiLift.vbs` (serve.py `--solo`) dùng **cùng file dự án** `_shared\ArchiLift_chung.json` với `ArchiLift_LAN.vbs`; trình duyệt tự nhận quyền sửa, không hiện thanh "Xin sửa". Trước đó (20261119d) chế độ một máy đọc dữ liệu trong trình duyệt nên không thấy dự án đã sửa ở chế độ chia sẻ (vd. thang Chữa cháy).
- Lần đầu mở theo cách mới, dự án cũ trong trình duyệt được giữ lại ở khoá `archilift.v1.truocKhiDungChung`.

## [20261119d] — 19/11/2026

### Thêm

- **Khởi động chạy ẩn, không hiện cửa sổ đen**:
  - `ArchiLift.vbs`: dùng trên máy này (`serve.py --solo`, bind 127.0.0.1);
  - `ArchiLift_LAN.vbs`: chia sẻ trong mạng LAN (bind 0.0.0.0), hiện thông báo 15 s có địa chỉ IP cho máy khác.
  - Cả hai chạy `pythonw`. Nếu máy chủ đã chạy thì chỉ mở trình duyệt; không chạy được Python thì mở thẳng `app\index.html`.
- **Nút "Tắt"** trên thanh trên cùng, chỉ hiện ở chính máy chạy máy chủ (`GET /api/server`, `POST /api/stop`, chỉ nhận từ 127.0.0.1).
- `serve.py`: tuỳ chọn `--solo` (tắt các API chia sẻ); khi chạy bằng pythonw thì ghi log vào `%TEMP%\ArchiLift_server.log`.

### Thay đổi

- Tab 4: hai bảng phương án căn giữa tiêu đề và số liệu các cột (bản 20261119c).

## [20261119b] — 19/11/2026

### Thêm

- **Điều khiển gọi tầng đích (DCS)**: ô *Điều khiển nhóm* trong tab 5 (biến `S.sim.ctrl`, gồm `'col'` mặc định và `'dcs'`).
  - Khách được phân ngay một cabin cố định.
  - Chi phí phân = thời gian chờ ước tính + điểm dừng mới × t_s × (1 + số khách bị ảnh hưởng), có ràng buộc sức chở.
  - Khách không lên được vì cabin đầy thì được phân lại cho cabin khác.
- **Sức chở khi mô phỏng (% định mức)**: biến `S.sim.cap`, mặc định 100. Kone dùng 80%.
- Tiêu đề kết quả và ghi chú cuối bảng nêu rõ kiểu điều khiển và sức chở đang dùng.

### Kiểm tra

- Chế độ tập hợp cho kết quả **trùng khớp** với bản 20261119a trên mô hình 254 HQV, 8 thang.
- Đối chiếu Kone 254 HQV (DCS, 80%):
  - up-peak: WT 42,4 / 46,1 s so với 39 / 42 s của Kone; DT 118 / 134 s so với 105 / 121 s;
  - giờ trưa: WT 60 / 56 s so với 34 / 35 s;
  - PA 6 thang: ùn tắc cả bốn trường hợp, như Kone.

---

## [20261119a] — 19/11/2026

Đợt này nâng tab 5 (Mô phỏng) lên gần cách làm của báo cáo Schindler / ISO 8100-32: cabin đón khách giữa đường, mặc định đo dài hơn, có thêm chỉ số IS và LW > 90 s, và có thể quét nhiều mức nhu cầu để tìm giới hạn phục vụ.

### Thêm

- **Đón lệnh gọi giữa đường** (công tắc *Đón lệnh gọi giữa đường*, biến `S.sim.midRoute`, mặc định **bật**).
  - Khi cabin đang chạy mà có người gọi ở tầng phía trước, cùng chiều, cabin sẽ dừng đón nếu thỏa cả bốn điều kiện:
    1. cabin còn chỗ;
    2. tầng gọi nằm giữa vị trí hiện tại và điểm dừng định trước;
    3. lệnh gọi được giao cho chính cabin này;
    4. cabin **còn kịp hãm** theo profile chữ S (gia tốc a, jerk j).
  - Thời gian "còn kịp hãm" tính theo ba trường hợp: chạy tới vận tốc v, chỉ tới gia tốc a, hoặc không tới a.
  - Khi giao lệnh gọi, bộ chia lệnh cũng ước tính thời gian đến theo cách đón giữa đường này.
  - Tắt công tắc thì cabin chạy như bản cũ: chỉ chọn điểm dừng lúc khởi hành.
- **Chỉ số mới trong kết quả mô phỏng:**
  - **IS**: số lần cabin dừng giữa tầng lên và tầng đích của mỗi khách, lấy trung bình.
  - **LW > 90 s**: % khách chờ quá 90 giây, theo ISO 8100-32. Chỉ số LW > 60 s vẫn giữ.
- **Quét nhiều mức nhu cầu** (mục mới trong tab 5, biến `S.sim.sweep`, mặc định `4, 5, 6, 7, 8, 9, 10, 11, 12` %).
  - Chạy lần lượt từng mức với cùng kịch bản và thời gian đo.
  - Bảng kết quả gồm: nhu cầu, P5, HC5 thực, WT, WT P90, DT, IS, LW60, LW90, số khách chưa phục vụ, trạng thái.
  - Trạng thái mỗi mức là một trong ba: **Đáp ứng**, **Bất ổn k/n** (k trong n lượt chạy bị ùn tắc) hoặc **Ùn tắc**.
  - Phần mềm ghi **giới hạn phục vụ**: mức cao nhất mà mọi lượt chạy ở mức đó, và mọi mức thấp hơn, đều đáp ứng.
  - Có 2 biểu đồ cột WT và LW theo mức nhu cầu; các mức ùn tắc tô đỏ.
  - Kết quả quét được đưa vào **Báo cáo**, là mục 8, hoặc mục 7 nếu chưa chạy mô phỏng đơn.
  - Tối đa 40 mức trong một lần quét. Mất khoảng 4–6 giây cho 9 mức × 2 lượt × 8 giờ.

### Thay đổi

- **Mặc định thời gian mô phỏng** (cho dự án mới và nút **Ví dụ**):
  - thời gian đo **28 800 s** (8 giờ, như Schindler; ISO 8100-32 yêu cầu tối thiểu 2 giờ = 7 200 s);
  - khởi động bỏ qua **300 s**;
  - số lần chạy **2**.

  Hồ sơ `.json` đã lưu trước đây vẫn giữ giá trị cũ. Muốn dùng mặc định mới thì sửa tay trong tab 5.
- **Tiêu chí "Nguy cơ ùn tắc"** nay xét **từng lượt chạy**. Một lượt bị coi là ùn tắc khi có **một** trong ba dấu hiệu sau:
  - số khách chưa phục vụ > 2% tổng số khách;
  - HC5 thực < 95% nhu cầu;
  - hàng chờ tăng dần: số người chờ trung bình ở ¼ cuối thời gian đo lớn hơn 2 lần ở ¼ đầu và hơn ít nhất 10 người.

  Dấu hiệu thứ ba là mới. Nhờ nó, các mức "sát giới hạn" có WT rất cao nhưng chưa rớt thông lượng nay không còn bị báo là đáp ứng. Đây là quy ước riêng của ArchiLift; Schindler không công bố tiêu chí của họ.
- Dòng ghi chú dưới kết quả mô phỏng cho biết lượt chạy có bật đón giữa đường hay không.
- Mã phiên bản code: `20261118t` → `20261119a`. Lần đầu mở bản mới, bấm **Ctrl+F5** (Mac: **Cmd+Shift+R**) để trình duyệt không dùng bản cũ trong bộ nhớ đệm.
- `.claude/launch.json`: chạy máy chủ xem thử bằng `python3` thay cho `python`, vì trên macOS không có lệnh `python`.

### Sửa lỗi

- **P5 / HC5 thực bị đếm thiếu.** Trước đây phần mềm chỉ đếm những khách **gọi thang sau** giai đoạn khởi động, nên bỏ sót những khách đã gọi trong lúc khởi động nhưng được chở trong thời gian đo.
  - Hậu quả: lượt chạy ngắn (30 phút) bị thấp hơn thực tế 4–9%.
  - Ở mức nhu cầu vẫn ổn định (7%), khoảng một nửa số lần chạy báo nhầm "Nguy cơ ùn tắc".
  - Nay phần mềm đếm **mọi khách được chở** trong thời gian đo.
- Sửa số liệu ghi trong README. HC5 thực lúc bão hòa ở dự án mẫu (cao điểm lên, 12%) là **≈ 9,1%**, so với 8,25% tính toán. Con số "8,3%" ghi trước đây là kết quả của lỗi đếm thiếu ở trên.

### Kiểm tra

- Thời điểm "còn kịp hãm" khớp với tích phân số của profile chữ S.
- Chạy 2 544 khách khi bật đón giữa đường:
  - 103 lần cabin đổi điểm dừng giữa đường;
  - 0 lỗi thứ tự dừng, 0 khách bị trả sai tầng.
- So sánh khi bật và tắt đón giữa đường (dự án mẫu, 7%, 8 giờ, 3 lượt):

  | Kịch bản | WT tắt → bật | LW > 90 s tắt → bật |
  |---|---|---|
  | Cao điểm lên | 19,4 → 18,0 s | — |
  | Hai chiều 50/50 | 38,4 → 32,0 s | 11,1 → 7,5% |
  | Giờ trưa | 40,4 → 36,0 s | — |
  | Hỗn hợp 85/10/5 | 30,1 → 31,1 s (kém hơn một chút) | — |

- Tiêu chí ùn tắc mới: không báo nhầm lần nào trong 40 lượt chạy ở mức 7%, với cả lượt 30 phút và lượt 2 giờ. Ngưỡng 98% thử trước đó báo nhầm ở lượt ngắn nên đã đổi xuống 95%.
- Quét nhu cầu trên dự án mẫu (hai chiều 45/45/10):
  - **giới hạn phục vụ 10%** (111,6 người/5 phút);
  - 11%: *Bất ổn 1/2* (WT 218 s, P90 729 s);
  - 12%: *Ùn tắc*.
- Tab 3 (công thức RTT) **không đổi**. Dự án mẫu vẫn ra *RTT 202,6 s · INT 33,8 s · HC5 8,25% · Đạt*.

### Tài liệu

- [01 – Đầu vào, đầu ra](01-dau-vao-dau-ra.md):
  - thêm các mặc định mới, công tắc đón giữa đường và các mức quét vào bảng đầu vào mô phỏng;
  - thêm LW 60/90, IS và định nghĩa P5 vào phần đầu ra.
- [03 – Mô phỏng](03-mo-phong.md):
  - thêm mục "Đón lệnh gọi giữa đường" (điều kiện, bảng thời gian còn kịp hãm, ví dụ số);
  - viết lại cách đếm P5, các chỉ số IS/LW và tiêu chí ùn tắc;
  - thêm **mục 3.5 Quét nhiều mức nhu cầu**.
- [05 – Giới hạn và lưu ý](05-gioi-han-va-luu-y.md): cập nhật mục 5.2 (giới hạn của đón giữa đường) và vấn đề #4 (9,1% so với 8,25%).
- [README tài liệu](README.md): thêm ký hiệu IS và P5. [README dự án](../README.md): cập nhật quy trình bước 5 và mục "Đã kiểm tra".
- Thêm file này (`docs/CHANGELOG.md`).
