# ============================================================================
#  setup-and-build.ps1
#  Script de setup complet + build APK pour GestionMoMo
#
#  Usage (depuis la racine du projet après git clone) :
#    .\setup-and-build.ps1                  → Setup + APK Debug
#    .\setup-and-build.ps1 -SkipInstall     → Skip npm install (déjà fait)
#    .\setup-and-build.ps1 -Release         → APK Release
#    .\setup-and-build.ps1 -InstallOnPhone  → Build + installe via ADB
#    .\setup-and-build.ps1 -Clean           → Clean Gradle avant build
#    .\setup-and-build.ps1 -UseRender       → Utilise le backend Render (prod)
#                                             au lieu du backend local
# ============================================================================

param(
    [switch]$SkipInstall,
    [switch]$Release,
    [switch]$InstallOnPhone,
    [switch]$Clean,
    [switch]$UseRender
)

$ErrorActionPreference = "Stop"

# ── URL du backend Render (production) ────────────────────────────────────────
$RENDER_URL = "https://gestionmomo.onrender.com"

# ── Helpers d'affichage ───────────────────────────────────────────────────────
function Step  { param($n,$msg) Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Ok    { param($msg) Write-Host "  ✔  $msg" -ForegroundColor Green }
function Fail  { param($msg) Write-Host "  ✖  $msg" -ForegroundColor Red; exit 1 }
function Warn  { param($msg) Write-Host "  ⚠  $msg" -ForegroundColor Yellow }
function Info  { param($msg) Write-Host "     $msg" -ForegroundColor Gray }
function Line  { Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray }

# ── Racine du projet ──────────────────────────────────────────────────────────
$Root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$MobileDir = Join-Path $Root "mobile"
$BackendDir= Join-Path $Root "backend"
$AndroidDir= Join-Path $MobileDir "android"

Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        GestionMoMo — Setup & Build       ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 1 — Choisir le backend (local ou Render)
# ════════════════════════════════════════════════════════════════════════════
Step 1 "Configuration du backend..."

if ($UseRender) {
    # ── Mode Render : vérifier que le backend est accessible ─────────────────
    Info "Mode : backend Render ($RENDER_URL)"
    Info "Vérification de l'accessibilité du backend..."
    try {
        $response = Invoke-WebRequest -Uri "$RENDER_URL/health" -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
        $health   = $response.Content | ConvertFrom-Json
        Ok "Backend Render accessible — statut : $($health.status)"
    } catch {
        Warn "Backend Render inaccessible : $_"
        Warn "Le backend Render met ~30s à se réveiller sur le plan Free."
        Info "Réessaie dans 30 secondes ou démarre le backend localement sans -UseRender."
    }

    $apiBaseUrl    = "$RENDER_URL/api"
    $socketBaseUrl = $RENDER_URL

} else {
    # ── Mode local : détecter l'IP ────────────────────────────────────────────
    Info "Mode : backend local"
    $ip = $null
    $adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object {
            $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|VMware|VirtualBox|Hyper-V|Bluetooth|Teredo" -and
            $_.IPAddress -notmatch "^169\." -and
            $_.IPAddress -ne "127.0.0.1"
        } | Sort-Object {
            switch -Wildcard ($_.InterfaceAlias) { "Wi-Fi*" {0} "Ethernet*" {1} default {2} }
        }

    if ($adapters) { $ip = $adapters[0].IPAddress }

    if (-not $ip) {
        Warn "Impossible de détecter l'IP automatiquement."
        $ip = Read-Host "  Saisis ton IP locale manuellement (ex: 192.168.1.10)"
    }

    Ok "IP locale détectée : $ip"
    Info "Le téléphone se connectera au backend sur http://${ip}:5000"
    Info "Rappel : démarre le backend local avec 'cd backend ; npm start'"

    $apiBaseUrl    = "http://${ip}:5000/api"
    $socketBaseUrl = "http://${ip}:5000"
}

# Mettre à jour api.js (ligne __DEV__ uniquement — la ligne prod reste sur Render)
$apiFile = Join-Path $MobileDir "src\services\api.js"
if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    if ($UseRender) {
        # En mode Render, les deux modes (dev et prod) pointent vers Render
        $content = $content -replace "(\? ')[^']+(' // Téléphone physique)", "`${1}${apiBaseUrl}`${2}"
    } else {
        # En mode local, on met à jour l'IP de la ligne __DEV__
        $content = $content -replace "(http://)[\d\.]+(:5000/api)([^']*// Téléphone)", "`${1}${ip}`${2}`${3}"
    }
    Set-Content $apiFile $content -NoNewline
    Ok "api.js mis à jour → $apiBaseUrl"
} else {
    Warn "api.js introuvable : $apiFile"
}

# Mettre à jour socketClient.js
$socketFile = Join-Path $MobileDir "src\services\socketClient.js"
if (Test-Path $socketFile) {
    $content = Get-Content $socketFile -Raw
    if ($UseRender) {
        $content = $content -replace "(\? ')[^']+(' // Téléphone physique)", "`${1}${socketBaseUrl}`${2}"
    } else {
        $content = $content -replace "(http://)[\d\.]+(:5000)([^']*// Téléphone)", "`${1}${ip}`${2}`${3}"
    }
    Set-Content $socketFile $content -NoNewline
    Ok "socketClient.js mis à jour → $socketBaseUrl"
} else {
    Warn "socketClient.js introuvable : $socketFile"
}

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 2 — Vérifier Java 17
# ════════════════════════════════════════════════════════════════════════════
Step 2 "Vérification de Java..."

$javaCmd = $null

try { $javaCmd = (Get-Command java -ErrorAction Stop).Source } catch {}

if (-not $javaCmd -and $env:JAVA_HOME) {
    $candidate = Join-Path $env:JAVA_HOME "bin\java.exe"
    if (Test-Path $candidate) { $javaCmd = $candidate }
}

if (-not $javaCmd) {
    $searchPaths = @(
        "C:\Program Files\Eclipse Adoptium",
        "C:\Program Files\Java",
        "C:\Program Files\Microsoft",
        "C:\Program Files\OpenJDK"
    )
    foreach ($base in $searchPaths) {
        if (Test-Path $base) {
            $found = Get-ChildItem $base -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue |
                     Where-Object { $_.FullName -notmatch "jre" } |
                     Select-Object -First 1
            if ($found) { $javaCmd = $found.FullName; break }
        }
    }
}

if (-not $javaCmd) {
    Fail @"
Java 17 introuvable sur cette machine.

  Installe Eclipse Temurin 17 (gratuit) :
  → https://adoptium.net/temurin/releases/?version=17

  Coche 'Set JAVA_HOME' pendant l'installation, puis relance ce script.
"@
}

$javaVersionOutput = & "$javaCmd" -version 2>&1 | Select-String "version"
$javaVersionStr    = $javaVersionOutput -replace '.*"(\d+).*".*','$1'
$javaMajor         = [int]($javaVersionStr -replace '"','')

if ($javaMajor -lt 17) {
    Fail "Java $javaMajor détecté mais React Native 0.74 requiert Java 17+."
}

if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = Split-Path (Split-Path $javaCmd -Parent) -Parent
    Warn "JAVA_HOME défini temporairement : $($env:JAVA_HOME)"
}

Ok "Java $javaMajor : $javaCmd"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 3 — Trouver le Android SDK
# ════════════════════════════════════════════════════════════════════════════
Step 3 "Recherche du Android SDK..."

$sdkDir = $null

if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    $sdkDir = $env:ANDROID_HOME
} elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    $sdkDir = $env:ANDROID_SDK_ROOT
} else {
    $candidates = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "C:\Android\Sdk",
        "D:\Android\Sdk"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $sdkDir = $c; break }
    }
}

if (-not $sdkDir) {
    Fail @"
Android SDK introuvable.

  1. Installe Android Studio : https://developer.android.com/studio
  2. Ajoute la variable d'environnement :
       ANDROID_HOME = C:\Users\<toi>\AppData\Local\Android\Sdk
  3. Relance ce script.
"@
}

$env:ANDROID_HOME     = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$platformTools = Join-Path $sdkDir "platform-tools"
if (Test-Path $platformTools) { $env:PATH = "$platformTools;$env:PATH" }

Ok "Android SDK : $sdkDir"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 4 — Générer local.properties
# ════════════════════════════════════════════════════════════════════════════
Step 4 "Génération de android/local.properties..."

$localProps = Join-Path $AndroidDir "local.properties"
$sdkEscaped = $sdkDir -replace '\\', '\\' -replace ':', '\:'
Set-Content -Path $localProps -Value "sdk.dir=$sdkEscaped" -Encoding UTF8
Ok "local.properties → sdk.dir=$sdkEscaped"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 5 — npm install
# ════════════════════════════════════════════════════════════════════════════
if (-not $SkipInstall) {
    Step 5 "Installation des dépendances npm..."

    if (Test-Path $BackendDir) {
        Info "Backend..."
        Push-Location $BackendDir
        npm install --silent 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install (backend) a échoué." }
        Pop-Location
        Ok "Backend : OK"
    }

    Info "Mobile..."
    Push-Location $MobileDir
    npm install --silent 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install (mobile) a échoué." }
    Pop-Location
    Ok "Mobile : OK"
} else {
    Step 5 "npm install ignoré (-SkipInstall)"
    Ok "Dépendances supposées déjà installées"
}

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 6 — Build APK
# ════════════════════════════════════════════════════════════════════════════
$buildType  = if ($Release) { "Release" } else { "Debug" }
$gradleTask = if ($Release) { "assembleRelease" } else { "assembleDebug" }
$apkSubDir  = if ($Release) { "release" } else { "debug" }
$apkName    = if ($Release) { "app-release.apk" } else { "app-debug.apk" }
$apkPath    = Join-Path $AndroidDir "app\build\outputs\apk\$apkSubDir\$apkName"

Step 6 "Build APK $buildType..."
Info "Cela peut prendre 3 à 10 minutes la première fois..."

Push-Location $AndroidDir
$startTime = Get-Date

if ($Clean) {
    Info "Gradle clean..."
    & .\gradlew clean --no-daemon 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "gradle clean a échoué." }
    Ok "Clean OK"
}

& .\gradlew $gradleTask --no-daemon

if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Le build a échoué." }
Pop-Location

$duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Ok "Build terminé en ${duration}s"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 7 — Copie de l'APK dans dist/
# ════════════════════════════════════════════════════════════════════════════
Step 7 "Copie de l'APK..."

$distDir   = Join-Path $MobileDir "dist"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backendTag = if ($UseRender) { "Render" } else { "Local" }
$destName  = "GestionMoMo-$buildType-$backendTag-$timestamp.apk"
$destPath  = Join-Path $distDir $destName

if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }
Copy-Item $apkPath $destPath
Ok "APK → mobile/dist/$destName"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 8 — Installation ADB (optionnel)
# ════════════════════════════════════════════════════════════════════════════
if ($InstallOnPhone) {
    Step 8 "Installation via ADB..."

    $adbCmd = $null
    try { $adbCmd = (Get-Command adb -ErrorAction Stop).Source } catch {}
    if (-not $adbCmd) {
        $adbPath = Join-Path $sdkDir "platform-tools\adb.exe"
        if (Test-Path $adbPath) { $adbCmd = $adbPath }
    }

    if (-not $adbCmd) {
        Warn "ADB introuvable. Installe l'APK manuellement depuis mobile/dist/"
    } else {
        $devices = & "$adbCmd" devices 2>&1 | Select-String "device$"
        if (-not $devices) {
            Warn "Aucun appareil ADB détecté. Vérifie le débogage USB."
        } else {
            $devices | ForEach-Object { Info "  → $_" }
            & "$adbCmd" install -r $destPath
            if ($LASTEXITCODE -eq 0) { Ok "Application installée !" }
            else { Warn "Installation ADB échouée. Installe l'APK manuellement." }
        }
    }
}

# ════════════════════════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ════════════════════════════════════════════════════════════════════════════
Line
Write-Host ""
Write-Host "  ✅  BUILD TERMINÉ" -ForegroundColor Green
Write-Host ""
Write-Host "  APK    : mobile/dist/$destName" -ForegroundColor White
Write-Host "  Backend: $( if ($UseRender) { $RENDER_URL + ' (Render)' } else { "http://${ip}:5000 (local)" } )" -ForegroundColor White
Write-Host ""
Write-Host "  Installer sur le téléphone :" -ForegroundColor Gray
Write-Host "    Câble USB : adb install -r mobile\dist\$destName" -ForegroundColor Yellow
Write-Host "    Sans câble: envoie le fichier APK et ouvre-le sur le téléphone" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Commandes utiles :" -ForegroundColor Gray
Write-Host "    Rebuild (backend local) : .\setup-and-build.ps1 -SkipInstall" -ForegroundColor DarkCyan
Write-Host "    Rebuild (backend Render): .\setup-and-build.ps1 -SkipInstall -UseRender" -ForegroundColor DarkCyan
Write-Host "    Rebuild propre          : .\setup-and-build.ps1 -SkipInstall -Clean" -ForegroundColor DarkCyan
Write-Host "    Build + install USB     : .\setup-and-build.ps1 -SkipInstall -InstallOnPhone" -ForegroundColor DarkCyan
Write-Host ""
Line
