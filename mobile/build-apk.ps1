# =============================================================================
#  build-apk.ps1 — Script de build APK pour GestionMoMo
#  Usage :
#    .\build-apk.ps1               → APK Debug (par défaut)
#    .\build-apk.ps1 -Release      → APK Release signé
#    .\build-apk.ps1 -Install      → Build Debug + installe via ADB
#    .\build-apk.ps1 -Clean        → Nettoie le dossier build avant de compiler
#    .\build-apk.ps1 -Clean -Install → Clean + Build + Install
# =============================================================================

param(
    [switch]$Release,
    [switch]$Install,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

# ── Couleurs console ──────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶  $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "✔  $msg" -ForegroundColor Green }
function Write-Fail  { param($msg) Write-Host "✖  $msg" -ForegroundColor Red }
function Write-Info  { param($msg) Write-Host "   $msg" -ForegroundColor Gray }

# ── Chemins ───────────────────────────────────────────────────────────────────
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$AndroidDir = Join-Path $ScriptDir "android"
$OutputDir  = Join-Path $AndroidDir "app\build\outputs\apk"
$DestDir    = Join-Path $ScriptDir "dist"

# ── Vérifications préalables ──────────────────────────────────────────────────
Write-Step "Vérification de l'environnement..."

if (-not (Test-Path $AndroidDir)) {
    Write-Fail "Le dossier 'android/' est introuvable."
    Write-Info "Lance d'abord : npx react-native init GestionMoMo --version 0.74.2"
    Write-Info "Puis recopie ton code src/ dans le nouveau projet."
    exit 1
}

try { $null = Get-Command java -ErrorAction Stop }
catch {
    Write-Fail "Java n'est pas installé ou pas dans le PATH."
    Write-Info "Installe Java 17 (Temurin) : https://adoptium.net"
    exit 1
}

$javaVer = (java -version 2>&1 | Select-String "version").ToString()
Write-Ok "Java détecté : $javaVer"

# ── Mode choisi ───────────────────────────────────────────────────────────────
$buildType  = if ($Release) { "Release" } else { "Debug" }
$gradleTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
$apkSubDir  = if ($Release) { "release" } else { "debug" }
$apkName    = if ($Release) { "app-release.apk" } else { "app-debug.apk" }
$apkPath    = Join-Path $OutputDir "$apkSubDir\$apkName"

Write-Info "Mode          : $buildType"
Write-Info "Dossier build : $OutputDir\$apkSubDir"

# ── Clean optionnel ───────────────────────────────────────────────────────────
if ($Clean) {
    Write-Step "Nettoyage du dossier build (gradle clean)..."
    Push-Location $AndroidDir
    & .\gradlew clean
    if ($LASTEXITCODE -ne 0) { Write-Fail "gradle clean a échoué."; Pop-Location; exit 1 }
    Pop-Location
    Write-Ok "Clean terminé."
}

# ── Build ─────────────────────────────────────────────────────────────────────
Write-Step "Compilation de l'APK $buildType (gradle $gradleTask)..."
$startTime = Get-Date
Push-Location $AndroidDir

& .\gradlew $gradleTask

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Fail "Le build a échoué. Consulte les logs ci-dessus."
    exit 1
}
Pop-Location

$duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Ok "Build terminé en ${duration}s."

# ── Copie dans dist/ ──────────────────────────────────────────────────────────
Write-Step "Copie de l'APK dans dist/..."

if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir | Out-Null
}

$timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$destName   = "GestionMoMo-$buildType-$timestamp.apk"
$destPath   = Join-Path $DestDir $destName

Copy-Item $apkPath $destPath
Write-Ok "APK copié : dist\$destName"

# ── Installation ADB optionnelle ──────────────────────────────────────────────
if ($Install) {
    Write-Step "Installation sur le téléphone via ADB..."

    try { $null = Get-Command adb -ErrorAction Stop }
    catch {
        Write-Fail "ADB n'est pas dans le PATH."
        Write-Info "Ajoute <Android_SDK>\platform-tools à ta variable PATH."
        exit 1
    }

    $devices = adb devices 2>&1 | Select-String "device$"
    if (-not $devices) {
        Write-Fail "Aucun appareil détecté par ADB."
        Write-Info "Vérifie que :"
        Write-Info "  1) Le débogage USB est activé sur le téléphone"
        Write-Info "  2) Le câble USB est branché"
        Write-Info "  3) Tu as accepté l'autorisation RSA sur le téléphone"
        exit 1
    }

    Write-Info "Appareils connectés :"
    $devices | ForEach-Object { Write-Info "  $_" }

    adb install -r $destPath
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "L'installation a échoué."
        exit 1
    }
    Write-Ok "Application installée avec succès !"
    Write-Info "Lance l'app sur ton téléphone : GestionMoMo"
}

# ── Résumé final ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  APK prêt : dist\$destName" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Info "Pour installer manuellement via ADB :"
Write-Info "  adb install -r dist\$destName"
Write-Host ""
Write-Info "Pour transférer par câble ou partage réseau et installer :"
Write-Info "  Copie le fichier APK sur le téléphone, puis ouvre-le."
Write-Host ""
