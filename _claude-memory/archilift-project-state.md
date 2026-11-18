---
name: archilift-project-state
description: "ArchiLift (phần mềm giao thông thang máy Archivina) — nơi ghi trạng thái, cách sửa dữ liệu dự án qua file .json, quy tắc tăng phiên bản code"
metadata:
  node_type: memory
  type: project
  originSessionId: b4aa7982-460d-4e49-a999-092a55104df5
  modified: 2026-11-18T04:15:00.280Z
---

Trạng thái đầy đủ và việc còn dở của ArchiLift luôn ghi trong `TIEP-THEO.md` ở thư mục dự án — đọc file đó trước khi làm.

Dữ liệu dự án nằm trong localStorage trình duyệt của KTS, Claude không sửa trực tiếp được (Claude in Chrome không kết nối được ngày 18/11/2026). Cách làm đã chốt: KTS **Lưu .json** vào thư mục dự án → Claude sửa, lưu thành `_vNN` mới, không ghi đè → KTS **Mở .json**. Bản mới nhất 18/11/2026: `VD_ArchiLift_2026-11-18_v05.json`.

Từ 18/11/2026 có chia sẻ LAN trực tiếp (`serve.py` qua `ArchiLift_LAN.bat`): dự án chung nằm ở `_shared\ArchiLift_chung.json` trên máy chạy server — khi chạy chế độ này có thể đọc/sửa file đó thay vì xin KTS lưu .json (chỉ khi không ai đang sửa, vì người sửa sẽ ghi đè).

**Why:** KTS thấy "chưa cập nhật gì" khi trình duyệt giữ JS cũ trong cache; và không có đường sửa dữ liệu trực tiếp.

**How to apply:** mỗi lần sửa JS/CSS phải tăng `?v=` trong `app/index.html` (ghi số mới vào TIEP-THEO.md mục 3). Mọi số liệu thang (vận tốc, tải, số cabin, tiêu chí, cao tầng) phải hỏi KTS, không tự đặt — xem [[archilift-no-invented-numbers]].
