# Nhật ký thay đổi ArchiLift

Ghi lại các thay đổi đáng chú ý của ArchiLift, mới nhất ở trên cùng. Mỗi phiên bản ghi theo **mã phiên bản code**, tức số `?v=` trong `app/index.html`.

Các nhóm thay đổi: **Thêm** (tính năng mới) · **Thay đổi** (cách hoạt động khác trước) · **Sửa lỗi** · **Kiểm tra** (số liệu đã đối chiếu) · **Tài liệu**.

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
