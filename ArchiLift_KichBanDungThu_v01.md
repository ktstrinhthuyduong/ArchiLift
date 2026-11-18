# ArchiLift — Kịch bản dùng thử (bản thử nghiệm v01)

**Mục đích:** kiểm tra phần mềm tính giao thông thang máy nội bộ Archivina có đúng, dễ dùng và đủ cho công việc Concept/TKCS chưa.
**Thời gian:** khoảng 45–60 phút.
**Ghi góp ý:** mỗi điểm một dòng vào `ArchiLift_PhieuGopY_v01.xlsx` (cột "Bước" ghi số bước dưới đây).

> **Lưu ý:** đây là bản thử nghiệm. Một số số liệu mặc định (nhu cầu cao điểm, tiêu chí HC5/INT, tiêu chí thang chữa cháy, thông số cửa) đang là **giả định — cần xác minh**. Dữ liệu hãng mới có KONE MonoSpace 500 DX đầy đủ; Mitsubishi một phần; Schindler chưa có cấu hình. Không dùng kết quả để phát hành hồ sơ.

## Chuẩn bị
- Mở ArchiLift theo hướng dẫn được gửi (đường link trong mạng LAN, hoặc mở `app\index.html` bằng Chrome/Edge).
- Bấm **Ví dụ** (góc phải trên) để nạp dự án mẫu: chung cư 30 tầng, 3 hầm, số liệu giả định.

---

## Bước 1 — Nhập công trình (tab 1)
1. Xem bảng **Danh sách tầng**; bật/tắt ô **Gộp các tầng giống nhau**.
2. Sửa dân số dòng gộp T3–T30 thành 45 → bỏ gộp, xem 28 tầng đều đổi. Trả lại 40.
3. Thử **Tạo nhanh tầng** với số liệu một dự án bạn đang làm (số hầm, số tầng, cao tầng, dân số/tầng).
4. Thử **Dán từ Excel**: chép 5–10 dòng từ một bảng tầng thật (Tên | Cao tầng | Công năng | Dân số | Ga vào %).

**Mong đợi:** cao độ sàn tự tính; tổng dân số và tổng ga vào % đúng; dán được dấu thập phân "," lẫn ".".

## Bước 2 — Nhóm thang (tab 2)
1. Nạp lại **Ví dụ**. Xem nhóm "P – Cư dân": 6 cabin × 1000 kg × 2,5 m/s.
2. Ở ô **Nhu cầu cao điểm**, đổi 7% → 12% → **Tự nhập** 8,5%; ghi một nguồn thử vào ô Nguồn.
3. Bấm **Thêm nhóm**, cho nhóm mới phục vụ B3–T1 bằng **Đặt dải tầng dừng**; xem ma trận phân bổ dân số và cột **Tổng phân bổ**.
4. Rê chuột vào các tiêu đề cột có gạch chân chấm để đọc chú thích.

**Mong đợi:** con số "= … người/5ph" đổi theo nhu cầu; tầng có dân số mà tổng phân bổ ≠ 100% hiện màu đỏ.

## Bước 3 — Kết quả tính (tab 3)
1. Với dự án ví dụ chưa sửa (nhu cầu 7%), đối chiếu:
   **RTT 202,6 s · INT 33,8 s · HC5 92,4 người/5ph (8,25%) · hệ số tải tại nhu cầu 57% · Đạt.**
2. Đổi nhu cầu lên 12% → kết quả phải chuyển **Quá tải / Không đạt**.
3. Nếu có báo cáo giao thông thang của nhà thầu cho một dự án cũ: nhập cùng số liệu và so RTT/INT/HC5. **Góp ý quan trọng nhất là chênh lệch so với báo cáo hãng.**

## Bước 4 — Chọn thang tự động (tab 4)
1. Bấm **Tính phương án** với cài đặt mặc định.
2. Nhập **Tải trọng tối thiểu** 1000 kg, **Vận tốc tối đa** 2,5 m/s, tính lại.
3. Bấm **Áp dụng** một phương án, xem tab 3 cập nhật.

**Mong đợi:** danh sách sắp theo ít cabin → tải nhỏ → vận tốc thấp; các phương án đều Đạt.

## Bước 5 — Mô phỏng (tab 5)
1. Chạy **Cao điểm lên** với cường độ 7% → nhãn "Hệ thống đáp ứng".
2. Chạy lại với 10% → nhãn "Nguy cơ ùn tắc", biểu đồ số người chờ tăng dần.
3. Thử **Cao điểm xuống** và **Hai chiều – giờ trưa**.

**Góp ý cần:** biểu đồ có dễ hiểu không, chỉ tiêu nào thừa/thiếu, thời gian chạy có chấp nhận được không.

## Bước 6 — Kích thước thang theo hãng (tab 7)
1. Xem 4 thang mặc định (khách, rác, văn phòng/dịch vụ, chữa cháy) với KONE.
2. Thang chữa cháy: nhập chiều cao cabin CH 2100, hành trình 104 m, 33 điểm dừng → xem bảng **Kiểm tra** (KONE MonoSpace 500 DX phải báo không đạt hành trình/số dừng).
3. Đổi hãng sang **Mitsubishi** → xem hình mặt cắt có phòng máy.
4. Bấm **In / Lưu PDF**, xem bản in hình vẽ.

**Góp ý cần:** hình vẽ đủ để kiểm tra bố trí lõi thang ở giai đoạn Concept chưa; cần thêm kích thước/ghi chú gì.

## Bước 7 — Báo cáo (tab 6)
1. Bấm **In / Lưu PDF** → chọn "Lưu dưới dạng PDF".
2. Bấm **Xuất CSV (Excel)**, mở bằng Excel.

**Góp ý cần:** báo cáo có dùng được để gửi nội bộ/chủ đầu tư không; thiếu bảng hay mục nào.

## Bước 8 — Nhận xét chung
Ghi vào phiếu (loại "Đề xuất"): phần mềm giúp được việc gì, còn thiếu gì nhất, bạn có dùng cho dự án thật không và cần thêm điều kiện gì.
