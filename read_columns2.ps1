$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

# 한글 파일명 처리
$files = Get-ChildItem -Path "SAMPLEDATA" -Filter "*.xlsx"
foreach ($f in $files) {
    Write-Host "=== $($f.Name) ==="
    $wb = $excel.Workbooks.Open($f.FullName)
    $ws = $wb.Sheets.Item(1)
    for ($i = 1; $i -le 50; $i++) {
        $val = $ws.Cells.Item(1, $i).Value2
        if ($val) { Write-Host "$i : $val" }
    }
    $wb.Close($false)
    Write-Host ""
}

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
