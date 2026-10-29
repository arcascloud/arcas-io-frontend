param(
  [string]$Log = ""
)

# Login + statistic via Invoke-RestMethod (no SQL possible from PowerShell)
$token = (Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"usuario":"admin","password":"admin123"}').access_token
$h = @{Authorization = "Bearer $token"}

$full = Invoke-RestMethod -Uri 'http://localhost:3000/api/inventario/tienda/productos?empresaId=2' -Headers $h
Write-Host "=== TOTAL productos (sin origen) ==="
Write-Host ($full.Count)

$zeros = ($full | Where-Object { [int]$_.existencia -eq 0 }).Count
$nonzero = ($full | Where-Object { [int]$_.existencia -gt 0 }).Count
Write-Host "  con existencia != 0 : $nonzero"
Write-Host "  con existencia == 0 : $zeros"

# Categories with ANY product at all (regardless of stock)
$allCats = [System.Collections.Generic.HashSet[string]]::new()
foreach($p in $full){ if($p.categoriaId){ $allCats.Add("$($p.categoriaId)|$($p.categoria)") } }
Write-Host "`n=== Categorías con al MENOS un producto CATEGORÍA (sin considerar stock) ==="
$allCats | Sort-Object | ForEach-Object { Write-Host ("  categoriaId={0} desc='{1}'" -f ($_ -split '\|')[0], ($_ -split '\|')[1]) }

$tienda = Invoke-RestMethod -Uri 'http://localhost:3000/api/inventario/tienda/productos?origen=tienda&empresaId=2' -Headers $h
Write-Host "`n=== Para tienda virtual (origen=tienda) ==="
$uniqueCatsTienda = [System.Collections.Generic.HashSet[string]]::new()
$zeroStockCatIds = [System.Collections.Generic.HashSet[int]]::new()
foreach($p in $tienda){ if($p.categoriaId){ $uniqueCatsTienda.Add("$($p.categoriaId)|$($p.categoria)") ; if([int]$p.existencia -eq 0){ $zeroStockCatIds.Add([int]$p.categoriaId) } } }
Write-Host "  categories showing in tienda dropdown: $($uniqueCatsTienda.Count)"
Write-Host "  distinct category IDs: $($uniqueCatsTienda.Count)"
$z = ($zeroStockCatIds | Sort-Object)
if ($z.Count -gt 0) { Write-Host "  ids con EXISTENCIA == 0 (por lo tanto NO aparecerian): $($z -join ',')" }
else { Write-Host "  NOTA: ninguna categoría tiene existencia=0" }
