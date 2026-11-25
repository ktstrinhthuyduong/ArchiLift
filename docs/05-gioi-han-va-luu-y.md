# 5. Giới hạn, giả định và các điểm cần lưu ý

Phần mềm dùng để **kiểm tra phương án nội bộ ở giai đoạn Concept/TKCS**. Trước khi chốt, cần đối chiếu kết quả với báo cáo giao thông của nhà thầu/hãng.

---

## 5.1. Giả định của phương pháp tính

| Giả định | Ảnh hưởng |
|---|---|
| Chỉ tính **cao điểm lên** bằng công thức. Cao điểm xuống và hai chiều chỉ có trong mô phỏng | Công trình mà giờ trưa là giờ căng nhất (văn phòng, thương mại) cần xem kết quả mô phỏng |
| Khách chọn tầng đến độc lập, theo tỷ lệ dân số | Chuẩn CIBSE; không mô tả được nhóm khách đi cùng nhau |
| Cabin chở trung bình 80% số người định mức khi tính năng lực | Hệ số 80% có thể sửa trong nhóm thang |
| Mọi cabin trong nhóm phục vụ **mọi ga vào** (sảnh và hầm) theo "Ga vào %" | Có hầm thì RTT tăng đáng kể (ví dụ mẫu: +≈ 25 s). Nếu hầm có thang con thoi riêng, đặt ga vào hầm = 0 cho nhóm chính |
| Thời gian dừng ở ga vào dùng khoảng cách tầng trung bình của phần phía trên | Sai số nhỏ khi tầng hầm cao khác tầng điển hình |
| Công thức AWT (Barney) chỉ đúng trong khoảng tải 50–80% | Dưới 50% chương trình dùng mức 50%; trên 80% kết quả chỉ mang tính tham khảo |
| ATT ước tính không tính thời gian khách đợi trong cabin khi cabin dừng ở ga vào khác | ATT/AJT tính toán **thấp hơn** mô phỏng (ví dụ mẫu: 56 s so với 81 s) |
| Gia tốc, jerk, thời gian cửa giữ nguyên ở mọi vận tốc | Ở vận tốc cao (≥ 3 m/s), thang thực thường có gia tốc lớn hơn |

## 5.2. Giới hạn của mô phỏng

- Hai kiểu điều khiển: tập hợp hai chiều và **DCS gần đúng**. DCS dùng hàm chi phí đơn giản (mục 3.2, tài liệu 3), không phải thuật toán của hãng. Giờ trưa, WT cao hơn Kone khoảng 60–80%. Chưa có thang tầng kép, đỗ thang chủ động.
- Đón lệnh gọi giữa đường (mặc định bật) chỉ xét lệnh gọi **cùng chiều**, cabin còn chỗ và còn kịp hãm theo profile chữ S; không hãm gấp, không giao lại lệnh gọi đã giao cho cabin khác. Tắt công tắc thì cabin chỉ chọn điểm dừng lúc khởi hành → hơi bi quan với giao thông hai chiều.
- Tiêu chí ùn tắc (mục 3.4 tài liệu 3) là quy ước của ArchiLift, báo cáo Schindler không công bố tiêu chí của họ.
- Mặc định cabin được chở đầy **100%** số người định mức (ô *Sức chở khi mô phỏng*), trong khi phần tính năng lực dùng 80%, nên mô phỏng hơi lạc quan về năng lực lúc bão hòa. Muốn so với Kone thì nhập 80%.

## 5.3. Các điểm đã biết cần sửa hoặc cẩn thận

| # | Vấn đề | Vị trí | Cách xử lý tạm |
|---|---|---|---|
| 1 | ~~Kiểm tra thang chữa cháy dùng v ≥ H/60~~ — **đã sửa 23/11/2026**: tính thời gian chạy theo profile S ≤ 60 s. Gia tốc/jerk của thang ở tab 7 lấy mặc định 1,0 m/s² / 1,5 m/s³ | `lifts.js`, `engine.js` (`AL.fireRunTime`) | Đối chiếu gia tốc thực theo hãng |
| 2 | Chọn thang tự động: **đã giảm 23/11/2026** — có cột "Kho hãng", phương án gọn nhất ưu tiên tổ hợp có trong `liftdata.js`. Kho hãng còn ít dòng máy nên "không" chưa chắc là không có thật | `engine.js`, `AL.size`, `AL.inLibrary` | Vẫn nên nhập vận tốc tối đa và tải trọng tối thiểu phù hợp |
| 3 | ~~Tiêu chí "hệ số tải tại nhu cầu" luôn so với 80%~~ — **đã sửa 23/11/2026**: so với ô hệ số tải của nhóm | `engine.js`, `AL.evaluate` | — |
| 4 | HC5 mô phỏng lúc bão hòa (≈ 9,1% ở dự án mẫu) cao hơn HC5 tính (8,25%) vì mô phỏng chở đầy 100% CC (xem 5.2). Con số "8,3%" ghi trước đây đo ở lượt 30 phút, khi P5 còn bị đếm thiếu | `sim.js` | Đối chiếu với báo cáo của hãng |

## 5.4. Số liệu mặc định cần xác minh

- Nhu cầu cao điểm mặc định (7% chung cư, 12% văn phòng/khách sạn) và tiêu chí HC5/INT: **chưa trích từ tiêu chuẩn**. Cần CIBSE Guide D, ISO 8100-30 hoặc yêu cầu chủ đầu tư.
- Tiêu chí thang chữa cháy: cần đối chiếu QCVN 06:2022/BXD + SĐ1:2023 và TCVN 6396-72 bản gốc.
- Thông số cửa, gia tốc, jerk: giá trị điển hình, cần lấy theo catalog hãng.
- Dữ liệu Mitsubishi (bảng TKCS FPT Plaza 5) là số của **một dự án cụ thể**.

## 5.5. Cách tự kiểm tra sau khi sửa mã

Mở `app/index.html`, bấm **Ví dụ**, vào tab 3. Kết quả phải là:

> **6 × 1000 kg × 2,5 m/s: RTT 202,6 s · INT 33,8 s · HC5 92,4 người/5 phút (8,25%) · tải tại nhu cầu 57% · Đạt**

Các bước tính chi tiết để đối chiếu: [tài liệu 2, mục 2.8](02-tinh-toan-giao-thong.md#28-ví-dụ-tính-tay--dự-án-mẫu).
