# Quick fix script to add default exports
# Run this in PowerShell

$files = @(
    "c:\ECOLAB-ETS\RnD\nucleIQ\frontend\src\pages\finance\JournalEntries.tsx",
    "c:\ECOLAB-ETS\RnD\nucleIQ\frontend\src\pages\finance\VendorMaster.tsx",
    "c:\ECOLAB-ETS\RnD\nucleIQ\frontend\src\pages\finance\FinanceDashboard.tsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $componentName = [System.IO.Path]::GetFileNameWithoutExtension($file)
    
    # Add default export at the end if not present
    if ($content -notmatch "export default $componentName") {
        $content += "`n`nexport default $componentName;"
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "Added default export to $componentName"
    }
}

Write-Host "Done!"
