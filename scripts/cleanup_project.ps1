# nucleIQ Project Cleanup Script
# Run this PowerShell script to move unnecessary files to delete folder
# Date: 2026-01-19

# Set execution policy if needed
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

$ProjectRoot = "c:\ECOLAB-ETS\RnD\nucleIQ"
$DeleteFolder = Join-Path $ProjectRoot "delete\cleanup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create cleanup folder
New-Item -ItemType Directory -Force -Path $DeleteFolder | Out-Null
Write-Host "Created cleanup folder: $DeleteFolder" -ForegroundColor Green

# Backend utility scripts to move
$BackendScriptsToMove = @(
    "add_constraints.py",
    "check_db.py",
    "check_parent_perms.py",
    "check_parent_user.py",
    "create_parent_tables.py",
    "create_parent_user.py",
    "create_parent_user_fixed.py",
    "create_tables.py",
    "debug_fees.py",
    "enroll_student.py",
    "final_parent_verification.py",
    "find_enrolled_students.py",
    "find_students_simple.py",
    "fix_auth_final.py",
    "fix_parent_tables.py",
    "mini_fix.py",
    "seed_raw.py",
    "test_db_conn.py",
    "test_endpoint.py",
    "test_isnotparent.py",
    "test_parent_api.py",
    "test_parent_features.py",
    "test_parent_restrictions.py",
    "test_students_api.py",
    "verify_parent_student_link.py",
    "migration_0005.sql",
    # Additional log files from Response2
    "backend_error.txt",
    "backend_logs.txt",
    "populate_output.log",
    "migration_output.txt",
    "migrations_list.txt",
    "students_migrations.txt",
    "test_security_enhancements.py"
)

Write-Host "`n=== Moving Backend Utility Scripts ===" -ForegroundColor Cyan

$BackendScriptsFolder = Join-Path $DeleteFolder "backend_scripts"
New-Item -ItemType Directory -Force -Path $BackendScriptsFolder | Out-Null

foreach ($file in $BackendScriptsToMove) {
    $sourcePath = Join-Path $ProjectRoot "backend\$file"
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination $BackendScriptsFolder -Force
        Write-Host "  Moved: backend\$file" -ForegroundColor Yellow
    }
    else {
        Write-Host "  Not found: backend\$file" -ForegroundColor Gray
    }
}

# Old/deprecated app directories
Write-Host "`n=== Moving Deprecated App Directories ===" -ForegroundColor Cyan

$DeprecatedDirs = @(
    "backend\alumni_old",
    "backend\notifications_old"
)

$DeprecatedAppsFolder = Join-Path $DeleteFolder "deprecated_apps"
New-Item -ItemType Directory -Force -Path $DeprecatedAppsFolder | Out-Null

foreach ($dir in $DeprecatedDirs) {
    $sourcePath = Join-Path $ProjectRoot $dir
    if (Test-Path $sourcePath) {
        $dirName = Split-Path $dir -Leaf
        Move-Item -Path $sourcePath -Destination (Join-Path $DeprecatedAppsFolder $dirName) -Force
        Write-Host "  Moved: $dir" -ForegroundColor Yellow
    }
    else {
        Write-Host "  Not found: $dir" -ForegroundColor Gray
    }
}

# Root level files to move
Write-Host "`n=== Moving Root Level Files ===" -ForegroundColor Cyan

$RootFilesToMove = @(
    "generate_phase3_files.py",
    "setup_timetable.ps1",
    "setup_timetable.sh",
    "add_exports.ps1",
    "migration_0005_sql.txt",
    "login.json",
    # Additional log files from Response2
    "server_log.txt"
)

$RootFilesFolder = Join-Path $DeleteFolder "root_files"
New-Item -ItemType Directory -Force -Path $RootFilesFolder | Out-Null

foreach ($file in $RootFilesToMove) {
    $sourcePath = Join-Path $ProjectRoot $file
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination $RootFilesFolder -Force
        Write-Host "  Moved: $file" -ForegroundColor Yellow
    }
    else {
        Write-Host "  Not found: $file" -ForegroundColor Gray
    }
}

# Frontend files to move
Write-Host "`n=== Moving Frontend Development Files ===" -ForegroundColor Cyan

$FrontendFilesToMove = @(
    "frontend\src\App.example.tsx",
    "frontend\tscOutput.txt",
    "frontend\tsc_output.txt",
    "frontend\api-mapping.csv",
    "frontend\api-mapping.json"
)

$FrontendFilesFolder = Join-Path $DeleteFolder "frontend_files"
New-Item -ItemType Directory -Force -Path $FrontendFilesFolder | Out-Null

foreach ($file in $FrontendFilesToMove) {
    $sourcePath = Join-Path $ProjectRoot $file
    if (Test-Path $sourcePath) {
        $fileName = Split-Path $file -Leaf
        Move-Item -Path $sourcePath -Destination (Join-Path $FrontendFilesFolder $fileName) -Force
        Write-Host "  Moved: $file" -ForegroundColor Yellow
    }
    else {
        Write-Host "  Not found: $file" -ForegroundColor Gray
    }
}

# Move MD Files and Prompts to archive
Write-Host "`n=== Archiving Documentation Folders ===" -ForegroundColor Cyan

$DocFoldersToArchive = @(
    "MD Fiels",
    "Prompts"
)

$ArchiveFolder = Join-Path $DeleteFolder "documentation_archive"
New-Item -ItemType Directory -Force -Path $ArchiveFolder | Out-Null

foreach ($folder in $DocFoldersToArchive) {
    $sourcePath = Join-Path $ProjectRoot $folder
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination (Join-Path $ArchiveFolder $folder) -Force
        Write-Host "  Archived: $folder" -ForegroundColor Yellow
    }
    else {
        Write-Host "  Not found: $folder" -ForegroundColor Gray
    }
}

# Move template data file
Write-Host "`n=== Moving Data Files ===" -ForegroundColor Cyan

$templateDataPath = Join-Path $ProjectRoot "students_template_data.xlsx"
if (Test-Path $templateDataPath) {
    $templatesDir = Join-Path $ProjectRoot "backend\templates\import_templates"
    New-Item -ItemType Directory -Force -Path $templatesDir | Out-Null
    Move-Item -Path $templateDataPath -Destination $templatesDir -Force
    Write-Host "  Moved students_template_data.xlsx to backend\templates\import_templates\" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Cleanup Summary ===" -ForegroundColor Green
Write-Host "All unnecessary files have been moved to: $DeleteFolder" -ForegroundColor Green
Write-Host "`nYou can safely delete the entire 'delete' folder after verifying the application works correctly." -ForegroundColor Cyan

# List files that were moved
Write-Host "`n=== Files Moved ===" -ForegroundColor Cyan
Get-ChildItem -Path $DeleteFolder -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Replace($DeleteFolder, "").TrimStart("\")
    Write-Host "  $relativePath"
}

Write-Host "`nCleanup complete!" -ForegroundColor Green
