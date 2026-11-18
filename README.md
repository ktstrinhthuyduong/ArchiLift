# ArchiLift — Tính toán giao thông thang máy (Archivina)

Ứng dụng web nội bộ chạy trên máy tính, **không cần Internet, không cần cài thư viện**.

## Chạy
- Cách 1: nháy đúp `ArchiLift.bat` → trình duyệt mở `http://localhost:8765` (cần Python; tắt bằng cách đóng cửa sổ đen).
- Cách 2: mở trực tiếp `app\index.html` bằng Chrome/Edge.
- Dùng chung trong mạng LAN công ty: trong `ArchiLift.bat` đổi `--bind 127.0.0.1` thành `--bind 0.0.0.0`, máy khác truy cập `http://<IP-máy-chạy>:8765` (Windows Firewall sẽ hỏi cho phép).

Dữ liệu tự lưu trong trình duyệt của từng máy. Lưu hồ sơ dự án bằng **Lưu .json** (đặt vào `03_WORKING` của dự án), mở lại bằng **Mở .json**.

## Quy trình
1. **Công trình** – danh sách tầng: cao tầng, công năng, dân số, ga vào % (sảnh, tầng hầm). Có *Tạo nhanh tầng* và *Dán từ Excel* (cột: Tên | Cao tầng | Công năng | Dân số | Ga vào %).
2. **Nhóm thang** – số cabin, tải trọng, vận tốc, gia tốc, jerk, thời gian cửa, tiêu chí; ma trận tầng dừng và phân bổ dân số (mỗi tầng tổng 100% → không cộng trùng).
3. **Kết quả tính** – RTT, INT, HC5, %HC5, AWT/ATT/AJT ước tính, điểm làm việc theo nhu cầu, Đạt/Không đạt.
4. **Chọn thang tự động** – duyệt số cabin × tải trọng × vận tốc, liệt kê phương án đạt, *Áp dụng* vào nhóm.
5. **Mô phỏng** – cao điểm lên / xuống / hai chiều / hỗn hợp; WT, TT, DT, LW, HC5 thực, biểu đồ ùn tắc.
6. **Báo cáo** – In / Lưu PDF, xuất CSV mở bằng Excel.

## Mã nguồn
`app\js\engine.js` (động học, RTT, chọn thang) · `app\js\sim.js` (mô phỏng) · `app\js\app.js` (giao diện) · `app\js\charts.js` · `app\css\style.css`.

Tài liệu kỹ thuật (thuật toán, đầu vào/đầu ra, giới hạn): xem thư mục [`docs/`](docs/README.md).

## Đã kiểm tra
- RTT khớp công thức CIBSE cổ điển (1 sảnh, tầng đều): S, H, RTT trùng đến 10⁻¹².
- Mô phỏng cao điểm lên khi quá tải cho HC5 thực ≈ HC5 tính (8,3% so với 8,25% trên ví dụ).

## Giới hạn (bản v1)
Chưa có điều khiển đích đến (DCS), thang tầng kép, nhập trực tiếp file .xlsx (dùng dán từ Excel), lưu SQLite. Thông số cửa/gia tốc/jerk và tiêu chí mặc định là giá trị điển hình — cần xác nhận theo hãng và yêu cầu dự án. Kết quả để kiểm tra phương án nội bộ, cần đối chiếu báo cáo nhà thầu trước khi chốt.
