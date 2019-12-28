param([string]$file)
function Show-Process($Process, [Switch]$Maximize) {
    $sig = '
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern int SetForegroundWindow(IntPtr hwnd);
  '

    if ($Maximize) { $Mode = 3 } else { $Mode = 4 }
    $type = Add-Type -MemberDefinition $sig -Name WindowAPI -PassThru
    $hwnd = $process.MainWindowHandle
    $null = $type::ShowWindowAsync($hwnd, $Mode)
    $null = $type::SetForegroundWindow($hwnd)
}

$proc = (Get-WmiObject -class Win32_Process -Filter 'Name="AfterFX.exe"')

$path = $proc.Path
Invoke-Expression -Command '& "$path" -r "$file"'
Start-Sleep -Milliseconds 500
Show-Process -Process (Get-Process -id $proc.ProcessId) -Maximize
