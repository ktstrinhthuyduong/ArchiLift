# ArchiLift — ghi chú để làm tiếp (cập nhật 18/11/2026)

> Trên máy mới: mở Claude Code tại thư mục này và nói **"đọc TIEP-THEO.md rồi làm tiếp"**.

### Trạng thái khi đóng gói (18/11/2026, chiều — gói _v04, code 20261118t)
- Gói chuyển máy: **`ArchiLift_DongGoi_2026-11-18_v04.zip`** (toàn bộ thư mục, kể cả `_shared\`; trừ `Catalog hãng\` — chép riêng nếu cần đọc catalog; trừ các gói cũ `ArchiLift_DongGoi_*.zip`). Giải nén ra một thư mục bất kỳ, ví dụ `G:\@ AI\6. ArchiLift`.
- GitHub (công khai): https://github.com/ktstrinhthuyduong/ArchiLift — nhánh `main`; sửa xong: `git add -A`, `git commit`, `git push`. Không đưa `Catalog hãng` và các gói zip cũ (xem `.gitignore`).
- **Dữ liệu dự án mới nhất** (có ảnh mặt bằng + 2 nhãn; P – Cư dân 6 × 1000 kg, 2,5 m/s; CC – Chữa cháy 1 × 1350 kg, 2,5 m/s, B3 → Tum; tầng Tum):
  - chạy `ArchiLift_LAN.bat` → dự án chung nạp sẵn từ `_shared\ArchiLift_chung.json` (rev 20); bấm **Xin sửa** để sửa;
  - hoặc chạy `ArchiLift.bat` → **Mở .json** → `VD_ArchiLift_2026-11-18_v06.json` (cùng nội dung, xuất từ dự án chung).
- Lần đầu mở trên mỗi trình duyệt nếu thấy giao diện cũ: **Ctrl+F5**.
- Ghi nhớ của Claude: thư mục `_claude-memory\` trong gói → chép vào `C:\Users\<tên>\.claude\projects\<tên theo đường dẫn dự án>\memory\` trên máy mới (xem mục 6).
- Phiên bản code: `20261118t` (có chia sẻ LAN trực tiếp: `serve.py`, `ArchiLift_LAN.bat`). Không có việc nào đang làm dở giữa chừng; việc tiếp theo xem mục 4.

## 1. Phần mềm là gì
Ứng dụng web nội bộ tính giao thông thang máy cho Archivina, chạy offline, không cần cài gì. Viết bằng HTML + JavaScript thuần (máy cũ không có Node; Python chỉ dùng để chạy `ArchiLift.bat`). Kế hoạch gốc: `Nội dung kế hoạch xây dựg phần mềm-261117 .docx` (lộ trình V1–V4, dự án thử CT2 – Lạc Hồng).

Chạy: nháy đúp `ArchiLift.bat` (http://localhost:8765) hoặc mở thẳng `app\index.html`.

## 2. Các tab đã có
| Tab | Nội dung | Trạng thái |
|---|---|---|
| 1. Công trình | Danh sách tầng, dân số, ga vào %, tạo nhanh, dán từ Excel, gộp tầng giống nhau | Xong, đã kiểm tra |
| 2. Nhóm thang | Thông số cabin/cửa/tiêu chí, nhu cầu cao điểm (chọn sẵn/tự nhập + nguồn), ma trận phục vụ & phân bổ dân số (gộp tầng) | Xong, đã kiểm tra |
| 3. Kết quả tính | RTT, INT, HC5, AWT/ATT/AJT, điểm làm việc theo nhu cầu, Đạt/Không đạt | Xong; RTT khớp CIBSE cổ điển |
| 4. Chọn thang tự động | Duyệt số cabin × tải × vận tốc, ràng buộc tải min / vận tốc max / thời gian chạy thẳng | Xong |
| 5. Mô phỏng | 4 kịch bản, WT/TT/DT/LW, HC5 thực, biểu đồ ùn tắc, chú thích rê chuột | Xong; HC5 bão hoà ≈ HC5 tính |
| 6. Báo cáo | Mục 1 chia 2 cột: trái mặt bằng công trình (dán/kéo thả/chọn ảnh, bấm đặt nhãn loại thang P/C/VP/DV/KS/H/CC/R, đối chiếu số thang trên MB với số cabin khai báo), phải mặt cắt hành trình tự vẽ từ tab 1–2; mục 2 kết luận theo loại thang (R không tính giao thông); In/PDF, CSV, sơ đồ phân vùng (gộp tầng), bảng chú giải ký hiệu | Xong |
| 7. Kích thước thang theo hãng | 4 loại thang (khách, rác, văn phòng/dịch vụ, chữa cháy); bảng kết quả 1 dòng theo cột; 3 hình vẽ tham số theo mẫu bản vẽ tư vấn KONE (mặt bằng hố, mặt cắt pit, mặt cắt OH có/không phòng máy); ô nhập CH, HH, chiều dày vách; kiểm tra hành trình/số dừng/thang chữa cháy; nút mở công cụ hãng (KONE Studio, Schindler Plan, LEHY QR); ô "Nhập kết quả từ công cụ hãng" (từng cấu hình, có nguồn) và ô dán nhiều cấu hình từ Excel | Dùng được; dữ liệu hãng còn thiếu — xem mục 4 |

## 3. Bản đồ file
| File | Vai trò |
|---|---|
| `app\index.html`, `app\css\style.css` | Khung giao diện |
| `app\js\engine.js` | Động học cabin, RTT cao điểm lên, chọn thang |
| `app\js\sim.js` | Mô phỏng theo bước 0,1 s |
| `app\js\charts.js` | Biểu đồ canvas |
| `app\js\liftdata.js` | **Kho dữ liệu hãng** (chỉ số liệu có nguồn) |
| `app\js\lifts.js` | Tab 7: tra cứu, kiểm tra |
| `app\js\liftdraw.js` | Tab 7: hình vẽ tham số theo mẫu bản vẽ tư vấn KONE — mặt bằng hố, mặt cắt pit, mặt cắt OH (có phòng máy / không phòng máy) |
| `app\js\app.js` | Toàn bộ giao diện, sự kiện, báo cáo, chú giải (`GLOSS`, `PHRASES`) |
| `Catalog hãng\` | Catalog KTS cung cấp (Kone.pdf, Schindler 1.pdf, Mitsubishi .xlsx, `Mishu\` LEHY) |
| `serve.py` | Server chia sẻ LAN (Python, không cần cài thêm): phục vụ `app\` không cache + API `/api/meta`, `/api/state` (GET/PUT), `/api/claim`, `/api/release`; dự án chung lưu `_shared\ArchiLift_chung.json`; tham số `python serve.py [cổng] [bind] [file chia sẻ]` |
| `.claude\launch.json` | Cấu hình chạy thử: `archilift` (cổng 8765), `catalog` (cổng 8766) |
| `.claude\pdfview.html` | Trang xem PDF thành ảnh (pdf.js từ CDN — **cần Internet**) để đọc bảng catalog dạng nét vẽ. Dùng: `http://localhost:8766/.claude/pdfview.html?f=/Catalog hãng/...pdf&p=<trang>` (thêm `&pp=1-20` để xem lưới thu nhỏ, `&x0=&y0=&x1=&y1=` để cắt vùng) |

**Cập nhật code:** `index.html` gắn `?v=<phiên bản>` cho CSS/JS (hiện `20261118t`). Mỗi lần sửa JS/CSS phải **tăng số này**, nếu không trình duyệt người dùng vẫn chạy bản cũ trong cache.

## 4. Việc còn dở (theo thứ tự ưu tiên)
1. ~~Đọc catalog LEHY-III trang 20~~ — **xong 18/11** (dòng "Shanghai Mitsubishi LEHY-III" trong `liftdata.js`, chỉ thông số cơ bản, chưa có kích thước hố).
2. ~~Schindler 5000~~ — **xong 18/11**, vận tốc 1,75 m/s theo KTS. Nạp từ ảnh Schindler Plan (`Catalog hãng\Schindler.jpg`). Số trong ảnh: 1350 kg, 18 người, CO 1000×2100, cabin thô 1800×1600 cao 2500 (trần 2400), hố 2450×2100, HSK 4200 (min 4141), HSG 1450 (1427–2252), CWT trái, **2 lối vào (ZKE=2)**.
3. Kích thước hố Mitsubishi Shanghai (LEHY): catalog không in, phải lấy từ công cụ "LEHY Civil Engineering" (QR) hoặc hãng → nạp qua mục "Nạp dữ liệu" tab 7.
4. **KONE N/S MonoSpace, N/S MiniSpace** mới có giới hạn (vận tốc/hành trình/tải/số thang nhóm) từ tài liệu cũ không ghi ngày → chạy KONE Studio cho các cấu hình hay dùng, nhập kết quả ở tab 7.
5. **Bản vẽ tư vấn KONE** (`A:\09. Other\01. Phong Kien Truc\6.Thu vien\2. Thang may\KONE\BAN VE TU VAN`, 91 PDF trong zip, ~98 MB): đã thử chép vào `app\data\kone` để hiển thị trong phần mềm — **KTS yêu cầu dừng và đã xoá bản chép (18/11)**. Hướng còn mở: chỉ thêm nút mở PDF gốc trên ổ A: theo tải/vận tốc (không chép). Chỉ làm khi KTS yêu cầu.
6. (18/11: đã thêm vị trí đối trọng sau/trái/phải và 1–2 lối vào — theo dữ liệu hãng, cột 18–19 của hàng dữ liệu, hoặc chọn tay ở tab 7.) Hình vẽ tab 7 còn tượng trưng các chi tiết chưa có số: vị trí cabin theo chiều sâu hố, đối trọng, ray, máy kéo, giảm chấn (KONE ghi AA, DBG, RB, BS… — chưa có dữ liệu).
7. Đọc PDF dạng nét vẽ: dùng `.claude\pdfview.html` (cần Internet). Lệnh `pip install pypdf` từng bị chặn; chưa cài poppler.

## 5. Số liệu cần xác minh (đang ghi "giả định"/"cần xác minh" trên giao diện)
- Nhu cầu cao điểm mặc định (7% chung cư, 12% văn phòng/khách sạn) và tiêu chí HC5/INT mặc định: **không trích từ tiêu chuẩn** — cần CIBSE Guide D bảng 3.x / ISO 8100-30 hoặc yêu cầu CĐT.
- Tiêu chí thang chữa cháy (cabin ≥ 1100×1400, ≥ 630 kg; cáng ≥ 1100×2100, ≥ 1000 kg; v ≥ H/60): lấy từ nguồn thứ cấp — cần đối chiếu **QCVN 06:2022/BXD + Sửa đổi 1:2023** và **TCVN 6396-72** bản gốc (PDF tải về bị mã hoá font, chưa đọc được).
- Thông số cửa, gia tốc, jerk mặc định: giá trị điển hình — theo catalog hãng.
- Dữ liệu Mitsubishi trong kho lấy từ bảng TKCS dự án **FPT Plaza 5** (file .xlsx) — số theo một dự án cụ thể; nếu đăng bản dùng thử ra ngoài công ty thì gỡ phần này.

## 6. Dữ liệu và ghi nhớ khi chuyển máy
- Dữ liệu dự án nhập trong ArchiLift nằm trong **trình duyệt**, không trong thư mục → trước khi chuyển: **Lưu .json**, sang máy mới **Mở .json**.
- Ghi nhớ của Claude: máy này ở `C:\Users\Admin\.claude\projects\G----AI-6--ArchiLift\memory\` (thư mục dự án `G:\@ AI\6. ArchiLift`); bản sao trong gói ở `_claude-memory\`. Trên máy mới chép vào `C:\Users\<tên>\.claude\projects\<đường dẫn dự án, ký tự đặc biệt đổi thành ->\memory\` — chạy Claude Code tại thư mục dự án một lần để nó tạo thư mục `projects\...` rồi chép vào. Không chép cũng được: mọi thông tin cần thiết đã có trong file này.
- Kiểm tra lại sau khi chuyển:
  - mở `app\index.html` với dự án ví dụ (nút "Ví dụ") → tab 3 phải ra **6 × 1000 kg, 2,5 m/s: RTT 202,6 s · INT 33,8 s · HC5 8,25% · Đạt**;
  - mở `VD_ArchiLift_2026-11-18_v05.json` → tab 3: P **INT 33,8 s · HC5 10,15% · Đạt**; CC **RTT 239,4 s · HC5 8,59% · Đạt** (không xét INT); tab 6 mặt cắt: P H = 104,00 m / 33 dừng, CC H = 107,20 m / 34 dừng.
- Trên máy mới cần: Python (để chạy `ArchiLift.bat`; không có thì mở thẳng `app\index.html`), trình duyệt Chrome/Edge. `.claude\pdfview.html` cần Internet.

## 7. Dùng thử và góp ý
- `ArchiLift_KichBanDungThu_v02.md` — kịch bản cho người dùng thử (bản mới nhất; v01 giữ lại).
- `ArchiLift_PhieuGopY_v02.xlsx` — mẫu phiếu góp ý (đưa lên Google Drive dùng chung; v01 giữ lại).
- Ghi chú khi đưa lên Google Drive: ArchiLift chỉ cần thư mục `app\` + `ArchiLift.bat`; `Catalog hãng\` (~125 MB) chỉ cần cho việc phát triển. Thư viện ổ `A:` không đồng bộ theo — máy khác phải truy cập được ổ A: mới mở được tài liệu KONE gốc.
- Chia sẻ trong LAN: chạy `ArchiLift_LAN.bat` (chạy `serve.py`, bind 0.0.0.0, in IP máy), đồng nghiệp mở `http://<IP máy>:8765/index.html`. **Xem trực tiếp:** một người sửa (nút "Xin sửa" trên thanh trên cùng), những người khác chỉ xem, tự cập nhật ~3 s (ảnh, nhãn, số liệu); ai bấm "Xin sửa" thì nhận quyền, người sửa cũ chuyển sang chỉ xem (có báo). Người xem: ẩn Mới/Ví dụ/Mở .json, khoá ô nhập, chặn thao tác trên ảnh; vẫn chuyển tab, In/PDF, CSV, Lưu .json, chạy mô phỏng (kết quả chỉ ở máy họ). Lần đầu "Xin sửa" khi chưa có dự án chung → đưa dự án đang mở trong trình duyệt lên. Chế độ chia sẻ không đọc/ghi localStorage; `ArchiLift.bat` (http.server thường) vẫn chạy chế độ cũ, dữ liệu riêng từng trình duyệt.

## 8. Nhật ký thay đổi gần nhất
- 17/11: bản đầu (tab 1–6), gộp tầng, cột nhu cầu, chú thích rê chuột, tab 7 bản đầu, dữ liệu KONE 500 DX / Mitsubishi FPT Plaza 5 / LEHY / Schindler 5000 (khung).
- 18/11: KONE online (nút mở công cụ, ô nhập kết quả, 4 dòng KONE giới hạn); bảng kết quả tab 7 dạng cột; hình vẽ tham số theo mẫu bản vẽ KONE + ô HH; thử chép bản vẽ KONE rồi xoá theo yêu cầu.
- 18/11 (máy mới, ổ G:): nạp LEHY-III (trang 20: 1,0–3,0 m/s, 630–2500 kg, hành trình đến 150 m, ≤ 54 dừng, kèm ghi chú catalog); tab 7 hiện ghi chú dòng máy cả khi chưa có kích thước. `pdftotext` có sẵn trong Git Bash nhưng trang nét vẽ không ra chữ → vẫn dùng `pdfview.html`.
- 18/11: nạp cấu hình Schindler 5000 (1350 kg, 18 người, CO 1000×2100, 1,75 m/s): cabin 1800×1600×2400, hố 2450×2100, pit 1450, OH 4200, hành trình ≤ 80 m, ≤ 40 dừng; ghi chú 2 lối vào, đối trọng trái.
- 18/11: hình vẽ tab 7 — ô chọn "Đối trọng" (theo dữ liệu / sau / trái / phải) và "Lối vào cabin" (theo dữ liệu / 1 / 2 xuyên), cũng có trong mục nhập kết quả từ công cụ hãng; mặt bằng vẽ lỗ cửa + sảnh phía sau khi 2 lối vào, đối trọng + ray ĐT đúng phía; mặt cắt pit/OH vẽ cửa phía sau và vùng chạy ĐT (nét đứt) khi ĐT phía sau; cảnh báo khi 2 lối vào mà ĐT phía sau, hoặc chọn tay khác cấu hình hãng. Dữ liệu: Mitsubishi EL = sau, CC = bên (chưa rõ trái/phải), Schindler 5000 = trái, 2 lối. Sửa khung hình mặt cắt bị cắt chân tiêu đề.
- 18/11: tab 2 thêm ô "Loại thang" cho mỗi nhóm (nhóm cũ tự đoán theo ký hiệu đầu tên, mặc định P). Tab 6: mục 1 "Mặt bằng công trình" (ảnh thu nhỏ ≤ 2400 px JPEG, lưu trong `S.plan` cùng file .json; bấm ảnh đặt nhãn, kéo dời, bấm đúp đổi tên, chuột phải xoá; bảng đối chiếu số thang trên MB / số cabin tab 2); mục 2 "Kết luận theo loại thang" (Đạt khi mọi nhóm của loại đạt; R chỉ liệt kê); các mục sau đánh số lại 3–7. Bộ nhớ trình duyệt đầy (ảnh lớn) → cảnh báo dùng "Lưu .json".
- 18/11: ảnh mặt bằng co kéo được (thanh trượt "Cỡ ảnh" 20–100% hoặc kéo góc phải dưới; lưu `S.plan.w`, in theo cỡ này); "Cỡ nhãn" Nhỏ/Vừa/Lớn (`S.plan.ms`); bấm nhãn mở bảng sửa: ký hiệu, loại (ký hiệu tự đổi tiền tố, vd. P3 → VP3), "Mũi tên chỉ" — nhãn đưa ra ngoài, nối mũi tên tới vị trí thang (`lx, ly` = vị trí nhãn, `x, y` = đầu mũi tên); kéo nhãn dời nhãn, kéo đầu mũi tên dời điểm chỉ (vùng bấm vô hình, không còn vòng tròn; đầu mũi tên 7 px, nét 1,5 px).
- 18/11: tab 6 mục 1 "Mặt bằng và mặt cắt hành trình" chia 2 cột (màn hẹp < 900 px thì xếp dọc). Mặt cắt hành trình (`travelSection`): cột tầng + cao độ + công năng, mỗi nhóm một cột màu theo loại, ● tầng dừng, nét đứt = chạy thẳng không dừng, ▸ tầng có ga vào, ghi H (m), số điểm dừng, tầng thấp → cao; tầng vẽ cách đều (không theo tỉ lệ).
- 18/11: tab 6 bố cục lại — cột trái gồm mục 1 (mặt bằng), 2 (kết luận theo loại, bảng gọn: loại + kết luận loại | nhóm + cấu hình | INT, HC5 kèm tiêu chí | KL), 3 (bảng gọn `summaryCompact`, nhu cầu chỉ ghi số; chọn nhu cầu ở mục 4 / tab 3); cột phải là mặt cắt hành trình kéo dài suốt mục 1–3.
- 18/11: tiêu chí INT = 0 nghĩa là không xét — giao diện/báo cáo ghi "không xét INT" thay cho "INT ≤ 0". Dự án ví dụ: KTS lưu `VD_ArchiLift_2026-11-18.json`; Claude tạo `_v02` (thêm nhóm CC dừng B3–T30), `_v03` (CC 1 × 1350 kg × 2,5 m/s theo KTS; dân số T3–T30 chia theo sức chở P 81,25% / CC 18,75%), `_v04` (tiêu chí riêng CC: HC5 ≥ 7%, không xét INT, theo KTS → P, CC đều Đạt). Chưa có tầng Mái trong danh sách tầng.
- 18/11: `_v05` = `_v04` + tầng Tum trên T30 (cao độ +97,30 suy từ T30 cao 3,2 m; chiều cao tầng Tum để 0 — chưa có số liệu), chỉ nhóm CC dừng Tum (34 điểm dừng, H = 107,20 m). Không có tầng Mái nên không phải bỏ.
- 18/11: cấu hình thang ghi vận tốc sau dấu phẩy: "1 × 1.350 kg, 2,50 m/s" (tab 3, 5, 6 và mặt cắt hành trình); cột mặt cắt rộng 112 px. Đóng gói chuyển máy.
- Ghi chú làm việc: dữ liệu dự án nằm trong trình duyệt của KTS, Claude không sửa trực tiếp được (Claude in Chrome chưa kết nối được trên máy cũ) → cách làm đã dùng: KTS **Lưu .json** vào thư mục dự án, Claude sửa và lưu thành `_vNN` mới (không ghi đè), KTS **Mở .json**.
- 18/11: chia sẻ LAN trực tiếp — `serve.py` + `ArchiLift_LAN.bat` mới + chế độ chia sẻ trong `app.js` (`shareInit`, `sharePoll` 3 s, `sharePush` debounce 400 ms, quyền sửa một người, `#shareBar`). Đã thử 2 người (localhost / 127.0.0.1): người xem thấy ảnh + nhãn mới sau ~3 s, không sửa được; chuyển quyền sửa hoạt động. Không có xác thực — chỉ dùng trong mạng nội bộ.
- 18/11: dự án chung trên máy chủ LAN (`_shared\ArchiLift_chung.json`, có ảnh mặt bằng + 2 nhãn của KTS) — Claude thêm qua API (nhận quyền sửa tạm tên "Claude", PUT, trả quyền) giống `_v05`: tầng Tum, nhóm CC 1 × 1350 kg, 2,5 m/s dừng B3 → Tum, dân số P 81,25% / CC 18,75%, tiêu chí CC HC5 ≥ 7% không xét INT → rev 20, Tóm tắt "Đạt — P, CC". Bản trước khi thêm: `_shared\ArchiLift_chung_truoc-CC_2026-11-18.json` (rev 17). Lưu ý: muốn sửa dự án chung bằng code thì phải qua API (máy chủ giữ dữ liệu trong bộ nhớ, sửa file trực tiếp sẽ bị ghi đè).
- 18/11: tab 6 chữ màu xanh dương (thử nền xanh, KTS bỏ). Xuất dự án chung rev 20 thành `VD_ArchiLift_2026-11-18_v06.json`; đóng gói `_v03` kèm `_shared\`.
