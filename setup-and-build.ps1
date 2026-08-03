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
# ============================================================================

param(
    [switch]$SkipInstall,
    [switch]$Release,
    [switch]$InstallOnPhone,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

# ── Helpers d'affichage ───────────────────────────────────────────────────────
function Step  { param($n,$msg) Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Ok    { param($msg) Write-Host "  ✔  $msg" -ForegroundColor Green }
function Fail  { param($msg) Write-Host "  ✖  $msg" -ForegroundColor Red; exit 1 }
function Warn  { param($msg) Write-Host "  ⚠  $msg" -ForegroundColor Yellow }
function Info  { param($msg) Write-Host "     $msg" -ForegroundColor Gray }
function Line  { Write-Host "─────────────────────────────────────────────────" -ForegroundColor DarkGray }

# ── Racine du projet (là où se trouve ce script) ─────────────────────────────
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
# ÉTAPE 1 — Vérifier Java 17
# ════════════════════════════════════════════════════════════════════════════
Step 1 "Vérification de Java..."

$javaCmd = $null

# 1a. Java dans le PATH
try {
    $javaCmd = (Get-Command java -ErrorAction Stop).Source
} catch {}

# 1b. Java via JAVA_HOME
if (-not $javaCmd -and $env:JAVA_HOME) {
    $candidate = Join-Path $env:JAVA_HOME "bin\java.exe"
    if (Test-Path $candidate) { $javaCmd = $candidate }
}

# 1c. Recherche automatique dans Program Files
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

# Vérifier la version
$javaVersionOutput = & "$javaCmd" -version 2>&1 | Select-String "version"
$javaVersionStr    = $javaVersionOutput -replace '.*"(\d+).*".*','$1'
$javaMajor         = [int]($javaVersionStr -replace '"','')

if ($javaMajor -lt 17) {
    Fail "Java $javaMajor détecté mais React Native 0.74 requiert Java 17+. Installe Java 17."
}

# Définir JAVA_HOME si absent
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = Split-Path (Split-Path $javaCmd -Parent) -Parent
    Warn "JAVA_HOME non défini — défini temporairement : $($env:JAVA_HOME)"
    Info "Pour le rendre permanent : Panneau de configuration → Variables d'environnement"
}

Ok "Java $javaMajor détecté : $javaCmd"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 2 — Trouver le Android SDK
# ════════════════════════════════════════════════════════════════════════════
Step 2 "Recherche du Android SDK..."

$sdkDir = $null

# 2a. Via ANDROID_HOME
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
    $sdkDir = $env:ANDROID_HOME
}
# 2b. Via ANDROID_SDK_ROOT
elseif ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) {
    $sdkDir = $env:ANDROID_SDK_ROOT
}
# 2c. Chemins par défaut communs
else {
    $candidates = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "C:\Android\Sdk",
        "D:\Android\Sdk",
        "C:\Users\$env:USERNAME\Android\Sdk"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $sdkDir = $c; break }
    }
}

if (-not $sdkDir) {
    Fail @"
Android SDK introuvable.

  1. Installe Android Studio : https://developer.android.com/studio
  2. Au premier démarrage, l'assistant SDK Setup télécharge le SDK automatiquement.
  3. Puis dans Android Studio :
       File → Settings → Languages & Frameworks → Android SDK
       Note le chemin 'SDK Location'.
  4. Ajoute la variable d'environnement :
       ANDROID_HOME = C:\Users\<toi>\AppData\Local\Android\Sdk
  5. Relance ce script.
"@
}

# Définir les variables d'environnement pour cette session
$env:ANDROID_HOME     = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$platformTools = Join-Path $sdkDir "platform-tools"
if (Test-Path $platformTools) {
    $env:PATH = "$platformTools;$env:PATH"
}

Ok "Android SDK : $sdkDir"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 3 — Générer local.properties
# ════════════════════════════════════════════════════════════════════════════
Step 3 "Génération de mobile/android/local.properties..."

$localProps = Join-Path $AndroidDir "local.properties"

# Convertit le chemin Windows en format Java Properties (\ → \\, C: → C\:)
$sdkEscaped = $sdkDir -replace '\\', '\\' -replace ':', '\:'

Set-Content -Path $localProps -Value "sdk.dir=$sdkEscaped" -Encoding UTF8
Ok "local.properties généré : sdk.dir=$sdkEscaped"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 4 — Détecter l'IP locale et mettre à jour les URLs
# ════════════════════════════════════════════════════════════════════════════
Step 4 "Détection de l'IP locale du PC..."

# Priorité : Wi-Fi > Ethernet > autre
$ip = $null
$adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
        $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|VMware|VirtualBox|Hyper-V|Bluetooth|Teredo" -and
        $_.IPAddress -notmatch "^169\." -and
        $_.IPAddress -ne "127.0.0.1"
    } | Sort-Object { switch -Wildcard ($_.InterfaceAlias) { "Wi-Fi*" {0} "Ethernet*" {1} default {2} } }

if ($adapters) { $ip = $adapters[0].IPAddress }

if (-not $ip) {
    Warn "Impossible de détecter l'IP automatiquement."
    $ip = Read-Host "  Saisis ton IP locale manuellement (ex: 192.168.1.10)"
}

Ok "IP locale détectée : $ip"
Info "Le téléphone se connectera au backend sur http://${ip}:5000"

# Mettre à jour api.js
$apiFile = Join-Path $MobileDir "src\services\api.js"
if (Test-Path $apiFile) {
    $apiContent = Get-Content $apiFile -Raw
    # Remplace n'importe quelle IP dans la ligne BASE_URL __DEV__
    $apiContent = $apiContent -replace "(http://)[\d\.]+(:5000/api)", "`${1}${ip}`${2}"
    Set-Content $apiFile $apiContent -NoNewline
    Ok "api.js mis à jour → http://${ip}:5000/api"
} else {
    Warn "api.js introuvable : $apiFile"
}

# Mettre à jour socketClient.js
$socketFile = Join-Path $MobileDir "src\services\socketClient.js"
if (Test-Path $socketFile) {
    $socketContent = Get-Content $socketFile -Raw
    $socketContent = $socketContent -replace "(http://)[\d\.]+(:5000)", "`${1}${ip}`${2}"
    Set-Content $socketFile $socketContent -NoNewline
    Ok "socketClient.js mis à jour → http://${ip}:5000"
} else {
    Warn "socketClient.js introuvable : $socketFile"
}

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 5 — npm install
# ════════════════════════════════════════════════════════════════════════════
if (-not $SkipInstall) {
    Step 5 "Installation des dépendances npm..."

    # Backend
    if (Test-Path $BackendDir) {
        Info "Backend : npm install..."
        Push-Location $BackendDir
        npm install --silent 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install (backend) a échoué." }
        Pop-Location
        Ok "Backend : dépendances installées"
    }

    # Mobile
    Info "Mobile : npm install..."
    Push-Location $MobileDir
    npm install --silent 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install (mobile) a échoué." }
    Pop-Location
    Ok "Mobile : dépendances installées"
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

Step 6 "Build APK $buildType (gradle $gradleTask)..."
Info "Cela peut prendre 3 à 10 minutes la première fois..."

Push-Location $AndroidDir
$startTime = Get-Date

if ($Clean) {
    Info "Nettoyage Gradle (clean)..."
    & .\gradlew clean --no-daemon 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "gradle clean a échoué." }
    Ok "Clean terminé"
}

& .\gradlew $gradleTask --no-daemon

if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Fail "Le build a échoué. Lis les erreurs Gradle ci-dessus."
}
Pop-Location

$duration = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Ok "Build terminé en ${duration}s"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 7 — Copie de l'APK dans dist/
# ════════════════════════════════════════════════════════════════════════════
Step 7 "Copie de l'APK..."

$distDir    = Join-Path $MobileDir "dist"
$timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$destName   = "GestionMoMo-$buildType-$timestamp.apk"
$destPath   = Join-Path $distDir $destName

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

Copy-Item $apkPath $destPath
Ok "APK copié → mobile/dist/$destName"

# ════════════════════════════════════════════════════════════════════════════
# ÉTAPE 8 — Installation ADB (optionnel)
# ════════════════════════════════════════════════════════════════════════════
if ($InstallOnPhone) {
    Step 8 "Installation sur le téléphone via ADB..."

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
            Warn "Aucun appareil ADB détecté."
            Info "Vérifie que le débogage USB est activé et que le câble est branché."
        } else {
            Info "Appareils connectés :"
            $devices | ForEach-Object { Info "  → $_" }
            & "$adbCmd" install -r $destPath
            if ($LASTEXITCODE -eq 0) { Ok "Application installée sur le téléphone !" }
            else                     { Warn "L'installation ADB a échoué. Installe l'APK manuellement." }
        }
    }
}

# ════════════════════════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ════════════════════════════════════════════════════════════════════════════
Line
Write-Host ""
Write-Host "  ✅  SETUP ET BUILD TERMINÉS" -ForegroundColor Green
Write-Host ""
Write-Host "  APK : mobile/dist/$destName" -ForegroundColor White
Write-Host ""
Write-Host "  Pour installer sur le téléphone :" -ForegroundColor Gray
Write-Host "    Option A (câble USB) : adb install -r mobile\dist\$destName" -ForegroundColor Gray
Write-Host "    Option B (sans câble): Envoie le fichier APK sur le téléphone" -ForegroundColor Gray
Write-Host "                           et ouvre-le depuis le gestionnaire de fichiers" -ForegroundColor Gray
Write-Host ""
Write-Host "  Pour rebuild après une modification de code :" -ForegroundColor Gray
Write-Host "    .\setup-and-build.ps1 -SkipInstall" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Pour rebuild propre :" -ForegroundColor Gray
Write-Host "    .\setup-and-build.ps1 -SkipInstall -Clean" -ForegroundColor Yellow
Write-Host ""
Line
