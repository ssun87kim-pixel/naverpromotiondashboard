$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$path1 = (Resolve-Path 'SAMPLEDATA/상품성과_2026-03-10_2026-03-23.xlsx').Path
$wb1 = $excel.Workbooks.Open($path1)
$ws1 = $wb1.Sheets.Item(1)
Write-Host '=== 상품성과 파일 컬럼 ==='
for ($i = 1; $i -le 40; $i++) {
    $val = $ws1.Cells.Item(1, $i).Value2
    if ($val) { Write-Host "$i : $val" }
}
$wb1.Close($false)

$path2 = (Resolve-Path 'SAMPLEDATA/ONLINE_NAVER_CATEGORY.xlsx').Path
$wb2 = $excel.Workbooks.Open($path2)
$ws2 = $wb2.Sheets.Item(1)
Write-Host ''
Write-Host '=== 카테고리 파일 컬럼 ==='
for ($i = 1; $i -le 20; $i++) {
    $val = $ws2.Cells.Item(1, $i).Value2
    if ($val) { Write-Host "$i : $val" }
}
$wb2.Close($false)

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
