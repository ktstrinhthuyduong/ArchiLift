# ArchiLift – gỡ cài đặt máy chủ luôn bật. Không xoá thư mục ArchiLift và dữ liệu dự án.
param([int]$Port = 8765)
$TaskName = 'ArchiLift May Chu'
$RuleName = "ArchiLift (TCP $Port)"
Write-Host '== Gỡ cài đặt máy chủ ArchiLift' -ForegroundColor Cyan
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "   [OK] Đã xoá tác vụ '$TaskName'" -ForegroundColor Green
} else { Write-Host '   Không có tác vụ tự chạy' }
try { Invoke-RestMethod -Method Post "http://127.0.0.1:$Port/api/stop" -Body '{}' -TimeoutSec 3 | Out-Null; Write-Host '   [OK] Đã tắt máy chủ' -ForegroundColor Green } catch { Write-Host '   Máy chủ không chạy' }
$r = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if ($r) { $r | Remove-NetFirewallRule; Write-Host "   [OK] Đã xoá luật tường lửa cổng $Port" -ForegroundColor Green } else { Write-Host '   Không có luật tường lửa' }
Write-Host '   Giữ nguyên thư mục ArchiLift và _shared\ArchiLift_chung.json.'
Write-Host '   Chế độ ngủ không tự khôi phục: chỉnh lại ở Settings > System > Power & sleep nếu cần.'
Read-Host 'Bấm Enter để đóng' | Out-Null
