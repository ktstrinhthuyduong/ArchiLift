# ArchiLift — Tính toán giao thông thang máy (Archivina)

Ứng dụng web nội bộ chạy trên máy tính, **không cần Internet, không cần cài thư viện**.

## Chạy
- Cách 1 (khuyên dùng): nháy đúp `ArchiLift.vbs` → trình duyệt mở `http://localhost:8765`, **không hiện cửa sổ đen** (cần Python). Tắt bằng nút **Tắt** trên thanh trên cùng. Dự án lưu vào `_shared\ArchiLift_chung.json`, chung với chế độ LAN.
- Cách 2: mở trực tiếp `app\index.html` bằng Chrome/Edge (không cần Python).
- Dùng chung trong mạng LAN công ty: nháy đúp `ArchiLift_LAN.vbs` trên máy làm chủ; thông báo hiện địa chỉ `http://<IP>:8765/index.html` cho máy khác (lần đầu Windows Firewall hỏi cho phép `pythonw`). Một người sửa ("Xin sửa"), người khác xem. Nút **Tắt** chỉ có ở máy làm chủ.
- **Bản offline mang sang máy khác** (không cần Python, không cần Internet): `python Offline/DongGoi_Offline.py` → `ArchiLift_Offline_<ngày>.zip` (~80 KB). Máy nhận: giải nén, nháy đúp `ArchiLift.vbs` (cửa sổ riêng qua Edge/Chrome `--app`), `Tao loi tat ArchiLift.vbs` để có biểu tượng Desktop/Start Menu.
- **Máy chủ luôn bật** (mọi người vào được cả khi máy KTS tắt): chép ArchiLift sang máy đó, chạy `MayChu\CaiDat_MayChu.bat` — xem [MayChu/HUONG_DAN_MAY_CHU.md](MayChu/HUONG_DAN_MAY_CHU.md).
- `ArchiLift.bat` / `ArchiLift_LAN.bat` vẫn dùng được (có cửa sổ đen, đóng cửa sổ để tắt).

Dữ liệu tự lưu trong trình duyệt của từng máy. Lưu hồ sơ dự án bằng **Lưu .json** (đặt vào `03_WORKING` của dự án), mở lại bằng **Mở .json**.

## Quy trình
1. **Công trình** – danh sách tầng: cao tầng, công năng, dân số, ga vào % (sảnh, tầng hầm). Có *Tạo nhanh tầng* và *Dán từ Excel* (cột: Tên | Cao tầng | Công năng | Dân số | Ga vào %).
2. **Nhóm thang** – số cabin, tải trọng, vận tốc, gia tốc, jerk, thời gian cửa, tiêu chí; ma trận tầng dừng và phân bổ dân số (mỗi tầng tổng 100% → không cộng trùng).
3. **Kết quả tính** – RTT, INT, HC5, %HC5, AWT/ATT/AJT ước tính, điểm làm việc theo nhu cầu, Đạt/Không đạt.
4. **Chọn thang tự động** – duyệt số cabin × tải trọng × vận tốc, liệt kê phương án đạt, *Áp dụng* vào nhóm.
5. **Mô phỏng** – cao điểm lên / xuống / hai chiều / hỗn hợp; mặc định đo 8 giờ; đón lệnh gọi giữa đường (bật/tắt); WT, TT, DT, IS, LW (> 60 s, > 90 s), HC5 thực, biểu đồ ùn tắc; **quét nhiều mức nhu cầu** để tìm giới hạn phục vụ (cách làm của báo cáo Schindler).
6. **Báo cáo** – In / Lưu PDF, xuất CSV mở bằng Excel.

## Mã nguồn
`app\js\engine.js` (động học, RTT, chọn thang) · `app\js\sim.js` (mô phỏng) · `app\js\app.js` (giao diện) · `app\js\charts.js` · `app\css\style.css`.

Tài liệu kỹ thuật (thuật toán, đầu vào/đầu ra, giới hạn): xem thư mục [`docs/`](docs/README.md).

## Đã kiểm tra
- RTT khớp công thức CIBSE cổ điển (1 sảnh, tầng đều): S, H, RTT trùng đến 10⁻¹².
- Mô phỏng cao điểm lên khi quá tải (12%, 8 giờ) cho HC5 thực ≈ 9,1%, so với 8,25% tính toán. Mô phỏng cao hơn vì chở đầy 100% số người định mức, còn công thức dùng hệ số tải 80%.
- Đón lệnh gọi giữa đường: thời điểm "còn kịp hãm" khớp tích phân số của profile chữ S; mọi khách được trả đúng tầng.
- DCS (gần đúng), so với báo cáo Kone 254 HQV, 8 thang, sức chở 80%: up-peak WT/DT lệch +9–12%; giờ trưa WT cao hơn 60–78% (nghiêng về an toàn). Chi tiết ở docs/03-mo-phong.md.

## Giới hạn (bản v1)
DCS mới mô phỏng gần đúng; chưa có thang tầng kép, nhập trực tiếp file .xlsx (dùng dán từ Excel), lưu SQLite. Thông số cửa/gia tốc/jerk và tiêu chí mặc định là giá trị điển hình — cần xác nhận theo hãng và yêu cầu dự án. Kết quả để kiểm tra phương án nội bộ, cần đối chiếu báo cáo nhà thầu trước khi chốt.
