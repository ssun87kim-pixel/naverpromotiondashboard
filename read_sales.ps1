$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$files = Get-ChildItem -Path "SAMPLEDATA" -Filter "판매성과*.xlsx"
foreach ($f in $files) {
    Write-Host "=== $($f.Name) ==="
    $wb = $excel.Workbooks.Open($f.FullName)
    $ws = $wb.Sheets.Item(1)
    Write-Host "--- 1행 (헤더) ---"
    for ($i = 1; $i -le 30; $i++) {
        $val = $ws.Cells.Item(1, $i).Value2
        if ($val) { Write-Host "$i : $val" }
    }
    Write-Host "--- 2행 (샘플) ---"
    for ($i = 1; $i -le 30; $i++) {
        $val = $ws.Cells.Item(2, $i).Value2
        if ($val) { Write-Host "$i : $val" }
    }
    $wb.Close($false)
}

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
