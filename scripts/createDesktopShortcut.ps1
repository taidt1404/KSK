$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path -Path $DesktopPath -ChildPath "Hệ Thống KSK LAN.lnk"
$TargetPath = "D:\WorkSpace\Projects\KSK\Chay_He_Thong_KSK.bat"
$WorkingDir = "D:\WorkSpace\Projects\KSK"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = $WorkingDir
$Shortcut.Description = "Khởi động Hệ thống nhập liệu Khám Sức Khỏe Mạng LAN"
$Shortcut.Save()

Write-Host "Đã tạo shortcut ngoài màn hình Desktop: $ShortcutPath"
