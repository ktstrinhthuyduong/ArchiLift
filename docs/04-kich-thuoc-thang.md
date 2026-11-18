# 4. Tra kích thước thang theo hãng (tab 7)

Mã nguồn: [`app/js/lifts.js`](../app/js/lifts.js) (tra cứu, kiểm tra), [`app/js/liftdata.js`](../app/js/liftdata.js) (kho dữ liệu), [`app/js/liftdraw.js`](../app/js/liftdraw.js) (hình vẽ)

Phần này **không tính giao thông**. Nó trả lời câu hỏi: *"Với hãng, tải trọng, vận tốc, kiểu cửa này thì hố thang, pit, OH cần bao nhiêu, và dòng máy có đáp ứng hành trình/số dừng không?"*

---

## 4.1. Kho dữ liệu hãng

Kho **chỉ chứa số liệu có nguồn** (tên tài liệu, ấn bản, trang). Mỗi dòng máy thuộc một trong hai dạng:

| Dạng | Có gì | Ví dụ |
|---|---|---|
| **Có bảng kích thước** | Danh sách cấu hình: cửa, tải, số người, vận tốc max, BB, DD, LL, WW, WD; có thể kèm PH, OH, giới hạn hành trình/số dừng, CH, HH | KONE MonoSpace 500 DX (66 cấu hình); Mitsubishi theo bảng TKCS FPT Plaza 5 (6 cấu hình); Schindler 5000 (1 cấu hình từ Schindler Plan) |
| **Chỉ có giới hạn** | Vận tốc max, tải max, hành trình max, số thang tối đa/nhóm, hoặc bảng tải trọng theo vận tốc | KONE N/S MonoSpace, N/S MiniSpace; Shanghai Mitsubishi LEHY-MRL-II, LEHY-III-S, LEHY-III |

> Số cấu hình ở bảng trên là tại thời điểm viết tài liệu (18/11/2026). Danh sách đầy đủ, kèm nguồn, xem trong `liftdata.js` hoặc ở mục "Kho dữ liệu hãng" cuối tab 7.

Ngoài dữ liệu có sẵn, người dùng có thể **nạp thêm** (lưu trong hồ sơ dự án):
- **Nhập kết quả từ công cụ hãng:** từng cấu hình một, chép từ KONE Studio, Schindler Plan hoặc LEHY Civil Engineering.
- **Dán nhiều cấu hình từ Excel:** định dạng cột xem [tài liệu 1](01-dau-vao-dau-ra.md#f-kích-thước-thang-theo-hãng-tab-7).

---

## 4.2. Thuật toán chọn cấu hình — `LiftTab.solve`

### Trường hợp A — dòng máy có bảng kích thước

1. **Lọc** các cấu hình có cùng kiểu cửa, cùng tải trọng, và vận tốc phù hợp. Có hai cách hiểu "vận tốc phù hợp":
   - KONE: vận tốc tối đa của cấu hình ≥ vận tốc chọn (một bảng dùng cho nhiều vận tốc).
   - Mitsubishi, Schindler (`exactSpeed`): vận tốc phải **bằng đúng**.
2. **Thang chữa cháy có cáng:** nếu có cấu hình cabin ≥ 1100 × 2100 mm thì chỉ giữ các cấu hình đó.
3. **Sắp xếp** theo diện tích hố WW × WD tăng dần (rồi theo rộng cửa). Mặc định chọn **hố nhỏ nhất**; người dùng có thể chọn cấu hình khác.
4. **Tính pit và OH:**
   - PH = theo cấu hình, hoặc theo bảng pit theo vận tốc của dòng máy (KONE: 1050 mm ở 1,0 m/s; 1200 mm ở 1,6–1,75 m/s).
   - OH = theo cấu hình, hoặc **OH = CH + phần cộng theo vận tốc** (KONE: +1300 ở 1,0 m/s; +1500 ở 1,6–1,75 m/s), cộng thêm 400 mm nếu có lan can nóc cabin 1100. Cần nhập CH thì mới tính được.
5. **Kiểm tra giới hạn dòng máy:**
   - Lấy giới hạn hành trình và số điểm dừng từ cấu hình, hoặc từ bảng giới hạn theo (vận tốc, tải). Bảng chọn mức tải nhỏ nhất mà vẫn ≥ tải đang xét.
   - So với hành trình và số dừng người dùng nhập.
   - Nếu tài liệu không có giới hạn thì cảnh báo "hỏi hãng".

### Trường hợp B — dòng máy chỉ có giới hạn

- Danh sách tải trọng và vận tốc lấy theo giới hạn, hoặc theo bảng tải theo vận tốc.
- Kiểm tra: tải ≤ tải max, vận tốc ≤ vận tốc max, hành trình ≤ max, số thang trong nhóm ≤ max, số dừng ≤ max.
- **Không có kích thước, không vẽ hình.** Phần mềm nhắc chạy công cụ của hãng rồi nhập kết quả.

### Kiểm tra thang chữa cháy

| Tiêu chí | Thường | Có cáng/giường |
|---|---|---|
| Rộng cabin BB | ≥ 1100 mm | ≥ 1100 mm |
| Sâu cabin DD | ≥ 1400 mm | ≥ 2100 mm |
| Tải trọng | ≥ 630 kg | ≥ 1000 kg |
| Vận tốc | ≥ H / 60 (H = hành trình, m) | như bên trái |

> ⚠️ Các tiêu chí trên lấy từ nguồn thứ cấp, **cần đối chiếu** QCVN 06:2022/BXD + Sửa đổi 1:2023 và TCVN 6396-72. Kiểm tra "v ≥ H/60" chưa tính thời gian tăng/giảm tốc và đóng cửa, nên **dễ dãi hơn thực tế**. Ví dụ H = 104 m, v = 1,75 m/s: kiểm tra báo đạt, nhưng thời gian chạy thực ≈ 61,8 s > 60 s. Xem [tài liệu 5](05-gioi-han-va-luu-y.md).

---

## 4.3. Hình vẽ

Ba hình vẽ tham số (SVG) theo mẫu bản vẽ tư vấn KONE:
1. **Mặt bằng hố:** WW × WD, cabin BB × DD, cửa LL, vách dày theo nhập.
2. **Mặt cắt pit:** PH.
3. **Mặt cắt OH:** loại không phòng máy (MRL) hoặc có phòng máy (MR: phòng máy, máy kéo, móc treo).

Các kích thước chưa có số hiển thị dạng `? CH`, `? HH`, `? OH`. Vị trí đối trọng, ray, máy kéo, giảm chấn hiện còn **vẽ tượng trưng**. Hình chỉ là **sơ đồ**, không dùng để phát hành hồ sơ.
