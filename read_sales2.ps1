$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$path = (Get-ChildItem -Path "SAMPLEDATA" -Filter "판매성과*.xlsx" | Select-Object -First 1).FullName
Write-Host "File: $path"
$wb = $excel.Workbooks.Open($path)
$ws = $wb.Sheets.Item(1)
Write-Host "--- Header Row ---"
for ($i = 1; $i -le 30; $i++) {
    $val = $ws.Cells.Item(1, $i).Value2
    if ($val -ne $null) { Write-Host "$i : $val" }
}
Write-Host "--- Row 2 ---"
for ($i = 1; $i -le 30; $i++) {
    $val = $ws.Cells.Item(2, $i).Value2
    if ($val -ne $null) { Write-Host "$i : $val" }
}
$wb.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
