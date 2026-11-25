# ArchiLift – cài đặt MÁY CHỦ luôn bật (chia sẻ trong mạng LAN)
# Chạy bằng CaiDat_MayChu.bat (tự xin quyền quản trị). Tuỳ chọn -ThuNghiem: chỉ kiểm tra, không thay đổi gì.
param([switch]$ThuNghiem, [int]$Port = 8765)
$ErrorActionPreference = 'Stop'
$TaskName = 'ArchiLift May Chu'
$RuleName = "ArchiLift (TCP $Port)"
$Root = Split-Path -Parent $PSScriptRoot
$Serve = Join-Path $Root 'serve.py'

function Buoc($s) { Write-Host ''; Write-Host "== $s" -ForegroundColor Cyan }
function Ok($s)   { Write-Host "   [OK] $s" -ForegroundColor Green }
function Loi($s)  { Write-Host "   [LỖI] $s" -ForegroundColor Red }
function Luu($s)  { Write-Host "   [!] $s" -ForegroundColor Yellow }
function Dung { Write-Host ''; Read-Host 'Bấm Enter để đóng' | Out-Null; exit 1 }

Write-Host '==========================================================='
Write-Host ' ArchiLift – CÀI ĐẶT MÁY CHỦ LUÔN BẬT (mạng LAN)'
if ($ThuNghiem) { Write-Host ' CHẾ ĐỘ THỬ: chỉ kiểm tra, không thay đổi máy' -ForegroundColor Yellow }
Write-Host '==========================================================='

# 1. Thư mục phần mềm
Buoc '1. Thư mục ArchiLift'
if (-not (Test-Path $Serve)) { Loi "Không thấy serve.py ở $Root. Giữ nguyên thư mục MayChu bên trong thư mục ArchiLift."; Dung }
if ($Root.StartsWith('\\')) { Loi 'Thư mục đang ở ổ mạng (\\...). Chép ArchiLift vào ổ cứng của chính máy này (vd. D:\ArchiLift).'; Dung }
$drv = [IO.Path]::GetPathRoot($Root).TrimEnd('\')
$dt = (Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$drv'").DriveType
if ($dt -ne 3) { Loi "Ổ $drv không phải ổ cứng của máy này (ổ mạng / USB). Chép ArchiLift vào ổ cứng của máy (vd. D:\ArchiLift)."; Dung }
Ok $Root

# 2. Python
Buoc '2. Python 3'
$py = $null
foreach ($c in @('pythonw', 'python')) {
  $cmd = Get-Command $c -ErrorAction SilentlyContinue | Where-Object { $_.Source -notlike '*WindowsApps*' } | Select-Object -First 1
  if ($cmd) { $py = $cmd.Source; break }
}
if (-not $py -and (Get-Command py -ErrorAction SilentlyContinue)) { $py = (& py -3 -c 'import sys; print(sys.executable)' 2>$null) }
if (-not $py -or -not (Test-Path $py)) { Loi 'Chưa có Python 3. Cài từ python.org (tích "Add python.exe to PATH" và "Install for all users"), rồi chạy lại.'; Dung }
$pyw = Join-Path (Split-Path $py) 'pythonw.exe'
if (-not (Test-Path $pyw)) { Loi "Không thấy pythonw.exe cạnh $py."; Dung }
$ver = & (Join-Path (Split-Path $py) 'python.exe') -c 'import sys; print(sys.version_info[0], sys.version_info[1], sep=chr(46))'
if ([version]$ver -lt [version]'3.7') { Loi "Python $ver quá cũ, cần 3.7 trở lên."; Dung }
Ok "Python $ver – $pyw"
if ($pyw -like "$env:USERPROFILE*") { Luu 'Python đang cài riêng cho tài khoản này. Vẫn chạy được; nếu sau này lỗi thì cài lại bản "Install for all users".' }

# 3. Quyền quản trị
Buoc '3. Quyền quản trị'
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if ($admin) { Ok 'Đang chạy với quyền quản trị' }
elseif ($ThuNghiem) { Luu 'Chưa có quyền quản trị (chế độ thử: bỏ qua)' }
else { Loi 'Cần quyền quản trị. Chạy CaiDat_MayChu.bat và bấm Yes khi Windows hỏi.'; Dung }

# 4. Cổng và địa chỉ IP
Buoc "4. Cổng $Port và địa chỉ IP"
$ips = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' })
if (-not $ips) { Loi 'Máy chưa có địa chỉ mạng LAN.'; Dung }
foreach ($i in $ips) {
  $kieu = if ($i.PrefixOrigin -eq 'Dhcp') { 'IP tự động – nên giữ chỗ cố định trên router' } else { 'IP cố định' }
  Ok ("{0}  ({1}, {2})" -f $i.IPAddress, $i.InterfaceAlias, $kieu)
}
$up = $false
try { $null = Invoke-RestMethod "http://127.0.0.1:$Port/api/server" -TimeoutSec 2; $up = $true } catch { }
if ($up) { Luu "Đang có ArchiLift chạy ở cổng $Port – khi cài sẽ tắt để chạy lại bằng tác vụ máy chủ." }
elseif (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { Loi "Cổng $Port đang bị chương trình khác dùng."; Dung }
else { Ok "Cổng $Port còn trống" }
$pub = @(Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' })
if ($pub) { Luu ("Mạng '" + ($pub.Name -join ', ') + "' đang để Public: máy khác sẽ KHÔNG vào được. Đổi sang Private: Settings > Network & Internet > (mạng) > Private.") }
else { Ok 'Kiểu mạng: Private/Domain' }

$job = '"' + $Serve + '" ' + $Port + ' 0.0.0.0'
if ($ThuNghiem) {
  Buoc 'Chế độ thử – các việc SẼ làm khi cài thật'
  Write-Host "   - Tạo tác vụ '$TaskName': chạy khi khởi động Windows (không cần đăng nhập), tài khoản SYSTEM,"
  Write-Host '     không giới hạn thời gian, tự chạy lại sau 1 phút nếu bị dừng'
  Write-Host "     Lệnh: $pyw $job"
  Write-Host "   - Mở tường lửa: cổng TCP $Port, chiều vào, mạng Domain + Private ('$RuleName')"
  Write-Host '   - Hỏi có tắt chế độ ngủ khi cắm điện không'
  Write-Host '   - Chạy máy chủ ngay, tạo file lối tắt ArchiLift_<IP>.url để gửi người dùng'
  Write-Host ''; Read-Host 'Bấm Enter để đóng' | Out-Null; exit 0
}

# 5. Tác vụ chạy khi khởi động Windows
Buoc '5. Tự chạy khi khởi động Windows'
if ($up) { try { Invoke-RestMethod -Method Post "http://127.0.0.1:$Port/api/stop" -Body '{}' -TimeoutSec 3 | Out-Null } catch { }; Start-Sleep 2 }
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
  Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
$act = New-ScheduledTaskAction -Execute $pyw -Argument $job -WorkingDirectory $Root
$trg = New-ScheduledTaskTrigger -AtStartup
$trg.Delay = 'PT30S'   # chờ mạng sẵn sàng
$prn = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$set = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $act -Trigger $trg -Principal $prn -Settings $set -Description 'Máy chủ ArchiLift cho mạng LAN (serve.py). Gỡ bằng MayChu\GoCaiDat_MayChu.bat.' | Out-Null
Ok "Đã tạo tác vụ '$TaskName' (chạy cả khi chưa ai đăng nhập)"

# 6. Tường lửa
Buoc '6. Tường lửa Windows'
Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Domain,Private | Out-Null
Ok "Mở cổng TCP $Port cho mạng Domain/Private"

# 7. Chế độ ngủ
Buoc '7. Chế độ ngủ'
$a = Read-Host '   Tắt chế độ ngủ / ngủ đông khi cắm điện để máy chủ luôn chạy? (C/K, mặc định C)'
if ($a -notmatch '^[kKnN]') { powercfg /change standby-timeout-ac 0; powercfg /change hibernate-timeout-ac 0; Ok 'Đã tắt ngủ khi cắm điện (màn hình vẫn tự tắt bình thường)' }
else { Luu 'Giữ nguyên. Máy ngủ thì người khác không vào được.' }

# 8. Chạy ngay và kiểm tra
Buoc '8. Chạy máy chủ'
Start-ScheduledTask -TaskName $TaskName
$ok = $false
for ($k = 0; $k -lt 20 -and -not $ok; $k++) { Start-Sleep -Milliseconds 500; try { $s = Invoke-RestMethod "http://127.0.0.1:$Port/api/server" -TimeoutSec 2; $ok = $s.app -eq 'ArchiLift' } catch { } }
if (-not $ok) { Loi 'Máy chủ chưa trả lời. Xem log: C:\Windows\Temp\ArchiLift_server.log'; Dung }
Ok 'Máy chủ đang chạy'

$ip = $ips[0].IPAddress
$url = "http://${ip}:$Port/index.html"
$lnk = Join-Path $PSScriptRoot "ArchiLift_$ip.url"
Set-Content -Path $lnk -Value "[InternetShortcut]`r`nURL=$url`r`nIconFile=$Root\app\img\favicon.ico`r`nIconIndex=0" -Encoding ASCII
Write-Host ''
Write-Host '==========================================================='
Write-Host ' CÀI ĐẶT XONG' -ForegroundColor Green
Write-Host " Link cho mọi người:  $url" -ForegroundColor Green
Write-Host " Lối tắt gửi người dùng: $lnk"
Write-Host (' Dự án chung lưu tại: ' + (Join-Path $Root '_shared\ArchiLift_chung.json'))
Write-Host ' Nhớ nhờ quản trị mạng GIỮ CHỖ IP này trên router để link không đổi.'
Write-Host '==========================================================='
Start-Process $url
Read-Host 'Bấm Enter để đóng' | Out-Null
