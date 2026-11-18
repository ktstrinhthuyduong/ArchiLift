# 1. Dữ liệu đầu vào và kết quả đầu ra

Tài liệu này mô tả **phải nhập gì** và **nhận được gì** ở từng phần của ArchiLift.

---

## 1.1. Đầu vào

### a) Danh sách tầng (tab 1 – Công trình)

Mỗi tầng là một dòng. Danh sách lưu **từ dưới lên** (B3, B2, B1, T1, T2…).

| Trường | Ý nghĩa | Ví dụ |
|---|---|---|
| Tên | Tên tầng hiển thị | `T5`, `B1` |
| Cao tầng (m) | Chiều cao từ sàn tầng này đến sàn tầng trên | 3,2 |
| Công năng | Hầm, Sảnh, Căn hộ, Văn phòng… (chỉ để đọc, không ảnh hưởng công thức) | Căn hộ |
| Dân số | Số người **sống/làm việc** ở tầng đó — họ là người *đi đến* tầng này lúc cao điểm lên | 40 |
| Ga vào % | Tỷ lệ người **vào nhà** qua tầng này (sảnh, tầng hầm đỗ xe) | T1: 70, mỗi hầm: 10 |
| Tầng cốt ±0.000 | Tầng chọn làm mốc cao độ (thường T1) | T1 |

Phần mềm tự tính **cao độ sàn** mỗi tầng: cộng dồn chiều cao từ dưới lên, rồi trừ cao độ tầng mốc. Tầng hầm vì vậy có cao độ âm.

> **Quy ước quan trọng**
> - Tầng có **Ga vào % > 0** là nơi khách *bắt đầu* đi (sảnh, hầm).
> - Tầng có **Dân số > 0** là nơi khách *muốn đến* lúc cao điểm lên.
> - Một tầng **không nên vừa là ga vào vừa có dân số**. Nếu có, dân số tầng đó bị bỏ qua và phần mềm cảnh báo.
> - Tổng "Ga vào %" không bắt buộc bằng 100: phần mềm tự chia lại theo tỷ lệ.

Có hai cách nhập nhanh:
- **Tạo nhanh tầng:** nhập số hầm, chiều cao hầm, ga vào mỗi hầm, số tầng nổi, chiều cao T1, ga vào T1, chiều cao tầng điển hình, "có dân số từ tầng", dân số mỗi tầng.
- **Dán từ Excel:** các cột `Tên | Cao tầng | Công năng | Dân số | Ga vào %`, phân tách bằng Tab. Dấu thập phân dùng `,` hay `.` đều được.

### b) Nhóm thang (tab 2)

| Ký hiệu | Trường | Mặc định | Ghi chú |
|---|---|---|---|
| L | Số cabin trong nhóm | 2 | |
| Q | Tải trọng (kg) | 1000 | Số người CC = ⌊Q / 75⌋ (EN 81-20) → 1000 kg = 13 người |
| v | Vận tốc định mức (m/s) | 1,75 | |
| a | Gia tốc (m/s²) | 1,0 | Giá trị điển hình — lấy theo hãng |
| j | Jerk – độ giật (m/s³) | 1,5 | Giá trị điển hình — lấy theo hãng |
| t_o | Thời gian mở cửa (s) | 2,0 | |
| t_c | Thời gian đóng cửa (s) | 3,0 | |
| t_sd | Trễ khởi hành sau khi đóng cửa (s) | 0,5 | |
| t_p | Thời gian một khách ra **hoặc** vào (s) | 1,2 | |
| lf | Hệ số tải tính năng lực (%) | 80 | Cabin coi như chở 80% số người định mức |
| Tiêu chí | HC5 ≥ …%, INT ≤ … s, AWT ≤ … s | theo loại công trình | Xem bảng dưới |
| Nhu cầu cao điểm | % dân số đến trong 5 phút cao điểm | 7% (chung cư) | Dùng cho "điểm làm việc" và mô phỏng |

Tiêu chí mặc định theo loại công trình (**giả định, cần xác minh** theo CIBSE Guide D / ISO 8100-30 hoặc yêu cầu chủ đầu tư):

| Loại | HC5 ≥ | INT ≤ | Nhu cầu |
|---|---|---|---|
| Chung cư | 7% | 60 s | 7% |
| Văn phòng | 12% | 30 s | 12% |
| Khách sạn | 12% | 40 s | 12% |

### c) Ma trận phục vụ và phân bổ dân số (tab 2)

Với mỗi cặp (tầng, nhóm thang):
- **Dừng (s):** nhóm thang có dừng ở tầng này không.
- **Phân bổ (sh, %):** bao nhiêu % dân số tầng này dùng nhóm thang này.

Mỗi tầng có dân số phải có **tổng phân bổ = 100%**. Như vậy mỗi người chỉ được tính cho một nhóm, không bị cộng trùng. Tầng lệch 100% sẽ hiện màu đỏ.

Ví dụ: tầng T10 có 40 người, nhóm A nhận 60% và nhóm B nhận 40% → nhóm A tính 24 người, nhóm B tính 16 người.

### d) Mô phỏng (tab 5)

| Trường | Ý nghĩa | Mặc định |
|---|---|---|
| Kịch bản | Cao điểm lên / xuống / hai chiều giờ trưa / hỗn hợp | Cao điểm lên |
| Cường độ (%/5 ph) | Số người phát sinh trong 5 phút, tính theo % dân số nhóm | 7 |
| Tỷ lệ vào / ra / giữa các tầng | Chỉ dùng cho kịch bản hỗn hợp | 40 / 40 / 20 |
| Thời gian đo (s) | Khoảng thời gian lấy số liệu. ISO 8100-32 yêu cầu tối thiểu 7200 s (2 giờ); Schindler dùng ≥ 8 giờ | 28800 (8 giờ) |
| Khởi động (s) | Thời gian chạy trước, **không tính** vào kết quả | 300 |
| Số lần chạy | Chạy nhiều lần với hạt giống ngẫu nhiên khác nhau rồi lấy trung bình | 2 |
| Hạt giống (seed) | Cùng seed → cùng kết quả | 1 |
| Đón lệnh gọi giữa đường | Bật: cabin đang chạy dừng thêm ở tầng có lệnh gọi cùng chiều nếu còn kịp hãm. Tắt: cabin chỉ chọn điểm dừng lúc khởi hành (cách cũ) | Bật |
| Các mức nhu cầu quét (%/5 ph) | Danh sách mức nhu cầu cho nút **Quét nhu cầu**, cách nhau bằng dấu phẩy | 4, 5, 6, 7, 8, 9, 10, 11, 12 |

> Dự án đã lưu trước đây giữ nguyên giá trị cũ (ví dụ 1800 s, 5 lần chạy); giá trị mặc định mới chỉ áp dụng cho dự án tạo mới hoặc bấm **Ví dụ**. Một lượt 8 giờ chạy mất khoảng 20–150 ms.

### e) Chọn thang tự động (tab 4)

Gồm số cabin tối đa (mặc định 12), danh sách tải trọng, danh sách vận tốc, tải trọng tối thiểu, vận tốc tối đa, và thời gian chạy thẳng tối đa (tùy chọn).

### f) Kích thước thang theo hãng (tab 7)

| Trường | Ý nghĩa |
|---|---|
| Chức năng | Thang khách / rác / văn phòng–dịch vụ / chữa cháy |
| Hãng, dòng máy | KONE, Mitsubishi, Schindler… |
| Kiểu cửa | CO (mở giữa) hoặc 2S (mở một bên) |
| Tải trọng, vận tốc | Chọn từ danh sách hãng có |
| Hành trình (m), số điểm dừng | Để kiểm tra giới hạn của dòng máy |
| CH, HH | Chiều cao cabin, chiều cao cửa (mm) — để tính OH |
| Chiều dày vách | Để vẽ mặt bằng hố |
| Lan can nóc cabin 1100 | Có thì OH cộng thêm 400 mm (KONE) |
| Có cáng/giường | Chỉ thang chữa cháy: yêu cầu cabin sâu ≥ 2100 mm |

Có thể **nạp thêm dữ liệu hãng** bằng cách dán từ Excel. Các cột theo thứ tự:

```
Cửa (CO/2S) | Tải kg | Số người | Vận tốc m/s | BB | DD | LL | WW | WD | PH | OH | Phòng máy (ghi chú) | Hành trình max m | Số dừng max
```

Trong đó BB/DD là rộng/sâu cabin, LL là rộng cửa thông thủy, WW/WD là rộng/sâu hố, PH là sâu pit, OH là chiều cao tầng trên cùng. Đơn vị mm. **Bắt buộc ghi nguồn.**

---

## 1.2. Đầu ra

### a) Kết quả tính (tab 3) — cho từng nhóm thang

| Chỉ số | Tên đầy đủ | Hiểu đơn giản |
|---|---|---|
| **RTT** (s) | Round Trip Time | Thời gian một cabin đi hết một vòng: rời sảnh → chở khách lên → quay lại sảnh |
| **INT** (s) | Interval | Cứ bao nhiêu giây lại có một cabin rời sảnh. INT = RTT / L |
| **HC5** (người/5 ph) | Handling Capacity | Nhóm thang chở được bao nhiêu người trong 5 phút |
| **%HC5** | | HC5 chia dân số nhóm. So với tiêu chí (vd. ≥ 7%) |
| **AWT** (s) | Average Waiting Time | Thời gian chờ trung bình từ lúc bấm gọi đến lúc vào cabin |
| **ATT** (s) | Average Transit Time | Thời gian trung bình ở trong cabin |
| **AJT** (s) | Average Journey Time | AWT + ATT |
| Hệ số tải tại nhu cầu | | Ở mức nhu cầu thực, cabin đầy bao nhiêu %. Nên ≤ 80% |
| **Đạt / Không đạt** | | Đạt khi mọi tiêu chí đều đạt |

Mỗi nhóm có **hai bộ số**:
- **Năng lực:** tính khi cabin chở 80% (theo `lf`). Trả lời câu hỏi *"nhóm thang chở tối đa được bao nhiêu?"*
- **Điểm làm việc theo nhu cầu:** tính ở đúng mức nhu cầu nhập vào. Trả lời câu hỏi *"với lượng người thực tế, cabin đầy bao nhiêu và khách chờ bao lâu?"* Nếu nhu cầu vượt năng lực, kết quả ghi **Quá tải**.

Ngoài ra còn có các **cảnh báo**, ví dụ: tầng vừa là ga vào vừa có dân số; có ga vào nằm cao hơn tầng có dân số thấp nhất.

### b) Chọn thang tự động (tab 4)

Danh sách các phương án **đạt mọi tiêu chí**, mỗi dòng gồm: số cabin, tải trọng, vận tốc, số người/cabin, %HC5, INT, RTT, AWT và hệ số tải tại nhu cầu, thời gian chạy thẳng hết hành trình. Danh sách sắp theo **ít cabin → tải nhỏ → vận tốc thấp**. Có thêm một dòng "gọn nhất" cho mỗi số cabin. Bấm **Áp dụng** để đưa phương án vào nhóm.

### c) Mô phỏng (tab 5)

| Chỉ số | Ý nghĩa |
|---|---|
| Số khách, đã phục vụ, chưa phục vụ | Số khách phát sinh trong giai đoạn đo |
| WT trung bình, P50, P90, P95, lớn nhất | Thời gian chờ (s). P90 = 90% khách chờ ít hơn số này |
| LW | % khách chờ quá 60 s và quá 90 s (ngưỡng 90 s theo ISO 8100-32 / báo cáo Schindler) |
| IS | Số lần cabin dừng trung bình giữa tầng lên và tầng đích của một khách |
| TT, DT, DT P95 | Thời gian trong cabin; thời gian từ lúc gọi đến lúc tới đích |
| HC5 thực (P5) | Số khách được chở tới đích trong mỗi 5 phút của giai đoạn đo (trung bình và lớn nhất), tính cả khách gọi thang lúc khởi động |
| Thời gian vượt | Sau khi ngừng phát sinh khách, còn mất bao lâu để chở hết người đang chờ |
| Số lần dừng / cabin / giờ | Mức độ làm việc của cabin |
| Biểu đồ | Phân bố thời gian chờ; số người chờ theo thời gian (đường đi lên liên tục = ùn tắc); AWT theo tầng xuất phát |

Mỗi chỉ số có giá trị trung bình và khoảng min–max qua các lần chạy.

**Quét nhu cầu:** bảng một dòng cho mỗi mức nhu cầu — nhu cầu sinh ra, P5, HC5 thực %, WT, WT P90, DT, IS, LW > 60 s, LW > 90 s, khách chưa phục vụ, trạng thái (*Đáp ứng* / *Bất ổn k/n* / *Ùn tắc*), kèm **giới hạn phục vụ** và hai biểu đồ WT, LW > 90 s theo mức nhu cầu. Chi tiết: [tài liệu 3, mục 3.5](03-mo-phong.md#35-quét-nhiều-mức-nhu-cầu).

### d) Kích thước thang (tab 7)

- Bảng kết quả một dòng: BB × DD, LL, WW × WD, PH, OH, công thức OH (nếu tính), phòng máy.
- Ba hình vẽ: mặt bằng hố, mặt cắt pit, mặt cắt OH (loại có hoặc không phòng máy).
- Bảng **Kiểm tra**: tải trọng/vận tốc/hành trình/số điểm dừng so với giới hạn dòng máy; các tiêu chí thang chữa cháy. Mỗi dòng kiểm tra có ghi nguồn.

### e) Báo cáo (tab 6)

Bản in/PDF gồm: thông tin dự án, thông số các nhóm, sơ đồ phân vùng, kết quả, chú giải ký hiệu. Có thể **xuất CSV** để mở bằng Excel.

### f) Lưu hồ sơ

Toàn bộ dữ liệu dự án tự lưu trong trình duyệt (`localStorage`, khóa `archilift.v1`). **Lưu .json** / **Mở .json** để chuyển máy hoặc lưu trữ.
