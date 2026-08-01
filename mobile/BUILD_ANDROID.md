# Guide Build Android — GestionMoMo

Ce guide couvre l'installation de l'environnement, la génération de l'APK, son installation sur téléphone physique, et les commandes à utiliser pour chaque mise à jour.

---

## Table des matières

1. [Prérequis — Installation unique](#1-prérequis--installation-unique)
2. [Initialisation du projet natif](#2-initialisation-du-projet-natif)
3. [Configuration réseau (téléphone physique)](#3-configuration-réseau-téléphone-physique)
4. [Builder l'APK](#4-builder-lapk)
5. [Installer l'APK sur le téléphone](#5-installer-lapk-sur-le-téléphone)
6. [Commandes pour les mises à jour](#6-commandes-pour-les-mises-à-jour)
7. [Dépannage](#7-dépannage)

---

## 1. Prérequis — Installation unique

Ces étapes ne sont à faire qu'une seule fois.

### 1.1 Java JDK 17

React Native 0.74 requiert **Java 17**.

1. Télécharge **Eclipse Temurin 17** (gratuit, recommandé) :  
   https://adoptium.net/temurin/releases/?version=17
2. Installe-le (garde les options par défaut, coche *"Set JAVA_HOME"*).
3. Vérifie dans un nouveau terminal PowerShell :
   ```powershell
   java -version
   # → openjdk version "17.x.x" ...
   ```

### 1.2 Android Studio + Android SDK

1. Télécharge **Android Studio** :  
   https://developer.android.com/studio
2. Lance l'installateur et accepte les options par défaut.
3. Au premier démarrage, l'assistant SDK Setup s'ouvre automatiquement.  
   Laisse-le télécharger le SDK (environ 2–3 Go).
4. Dans Android Studio : `File → Settings → Languages & Frameworks → Android SDK`  
   Note le chemin du **SDK Location**, ex : `C:\Users\<toi>\AppData\Local\Android\Sdk`

### 1.3 Variables d'environnement

Ouvre *Panneau de configuration → Système → Variables d'environnement* et ajoute :

| Variable        | Valeur (exemple)                                      |
|-----------------|-------------------------------------------------------|
| `ANDROID_HOME`  | `C:\Users\ferenc.attolou\AppData\Local\Android\Sdk`   |
| `JAVA_HOME`     | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`|

Puis dans la variable **Path**, ajoute ces deux entrées :
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

Ferme et rouvre PowerShell pour que les variables soient prises en compte.

**Vérification rapide :**
```powershell
java -version          # → openjdk 17
adb --version          # → Android Debug Bridge version x.x
echo $env:ANDROID_HOME # → chemin vers le SDK
```

---

## 2. Initialisation du projet natif

Le dossier `android/` n'existe pas encore. Il faut initialiser le projet React Native natif **une seule fois**, puis y copier le code existant.

### Étape A — Générer un projet temporaire

```powershell
# Dans le dossier parent de gestionMoMo
cd C:\Users\ferenc.attolou\Documents\PersonnalProjects

npx react-native@0.74.2 init GestionMoMoTemp --version 0.74.2
```

> Cela génère les dossiers `android/` et `ios/` avec toute la configuration native.

### Étape B — Copier les dossiers natifs

```powershell
# Copie android/ dans le projet mobile existant
Copy-Item -Recurse GestionMoMoTemp\android `
  gestionMoMo\mobile\android

# (Optionnel) Copie ios/ si tu veux builder pour iPhone plus tard
Copy-Item -Recurse GestionMoMoTemp\ios `
  gestionMoMo\mobile\ios

# Copie aussi le fichier babel.config.js s'il n'existe pas
Copy-Item GestionMoMoTemp\babel.config.js `
  gestionMoMo\mobile\babel.config.js -ErrorAction SilentlyContinue

# Supprime le projet temporaire
Remove-Item -Recurse -Force GestionMoMoTemp
```

### Étape C — Installer les dépendances natives

```powershell
cd C:\Users\ferenc.attolou\Documents\PersonnalProjects\gestionMoMo\mobile
npm install
```

### Étape D — Lier react-native-vector-icons

Ce package nécessite une configuration manuelle dans `android/app/build.gradle`.  
Ouvre `mobile/android/app/build.gradle` et ajoute à la fin :

```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

---

## 3. Configuration réseau (téléphone physique)

Ton téléphone et ton PC doivent être **sur le même réseau Wi-Fi** (ou reliés par un câble réseau).

L'IP de ton PC est actuellement : **`10.38.9.90`**

> Si ton IP change (redémarrage du routeur, changement de réseau), mets à jour ces deux fichiers :
> - `mobile/src/services/api.js` → ligne `BASE_URL`
> - `mobile/src/services/socketClient.js` → ligne `SOCKET_URL`

**Vérifier ton IP à tout moment :**
```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } |
  Select-Object InterfaceAlias, IPAddress
```

**Le backend doit être démarré sur le PC avant de tester l'app :**
```powershell
cd C:\Users\ferenc.attolou\Documents\PersonnalProjects\gestionMoMo\backend
npm start
# → Le serveur écoute sur http://0.0.0.0:5000
```

---

## 4. Builder l'APK

### Via le script PowerShell (recommandé)

Depuis le dossier `mobile/` :

```powershell
# APK Debug (rapide, pour tests)
.\build-apk.ps1

# APK Debug + nettoyage complet avant build
.\build-apk.ps1 -Clean

# APK Debug + installation automatique sur le téléphone (câble USB requis)
.\build-apk.ps1 -Install

# APK Release (optimisé, pour distribution)
.\build-apk.ps1 -Release
```

L'APK généré est copié dans `mobile/dist/` avec un nom horodaté :
```
dist/GestionMoMo-Debug-20260801_143022.apk
```

### Via npm scripts

```powershell
cd mobile

# Build Debug
npm run build:apk

# Build Release
npm run build:android:release

# Nettoyage seul
npm run clean:android

# Build Debug + installation ADB en une commande
npm run deploy:android
```

### Via Gradle directement

```powershell
cd mobile/android

# Debug
.\gradlew assembleDebug

# Release
.\gradlew assembleRelease

# Voir toutes les tâches disponibles
.\gradlew tasks
```

**Emplacement des APK générés :**
```
android/app/build/outputs/apk/debug/app-debug.apk
android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Installer l'APK sur le téléphone

### Option A — Via ADB (câble USB, recommandé pour les tests)

1. Active le **mode développeur** sur Android :
   - `Paramètres → À propos du téléphone → Numéro de build` (appuie 7 fois)
2. Active le **débogage USB** :
   - `Paramètres → Options pour les développeurs → Débogage USB`
3. Branche le câble USB et **accepte l'autorisation RSA** sur le téléphone.
4. Installe :
   ```powershell
   adb install -r mobile\dist\GestionMoMo-Debug-XXXXXXXX_XXXXXX.apk
   # ou via npm :
   npm run install:apk   # (depuis le dossier mobile/)
   ```

### Option B — Transfert de fichier (sans câble)

1. Copie l'APK depuis `mobile/dist/` sur le téléphone (via câble, WhatsApp, Google Drive, etc.).
2. Sur le téléphone : autorise l'installation depuis des sources inconnues si demandé.
3. Ouvre le fichier APK depuis le gestionnaire de fichiers.

---

## 6. Commandes pour les mises à jour

Quand tu modifies le code JS/TS (écrans, logique, style), **pas besoin de rebuilder l'APK entier** en développement — utilise le rechargement en direct. Mais pour distribuer une mise à jour sous forme d'APK :

### Mise à jour rapide (modification JS uniquement)

```powershell
cd mobile

# 1. Démarre Metro (dans un terminal séparé)
npm run start

# 2. Lance sur le téléphone connecté en USB
npm run android
```

### Nouvelle version APK (à distribuer)

```powershell
cd mobile

# Build propre + APK Debug
.\build-apk.ps1 -Clean

# Ou APK Release pour une version finale
.\build-apk.ps1 -Release -Clean
```

### Workflow typique de développement

```powershell
# Terminal 1 — backend
cd backend ; npm start

# Terminal 2 — Metro bundler
cd mobile ; npm run start

# Terminal 3 — rebuild APK après modifications importantes
cd mobile ; .\build-apk.ps1 -Install
```

---

## 7. Dépannage

### `JAVA_HOME is not set`
```powershell
# Vérifie que la variable est bien définie
echo $env:JAVA_HOME
# Doit afficher le chemin vers le JDK 17
```

### `SDK location not found`
Crée le fichier `mobile/android/local.properties` avec :
```
sdk.dir=C\:\\Users\\ferenc.attolou\\AppData\\Local\\Android\\Sdk
```
> Note : les `\` sont doublés et le `:` est précédé d'un `\`.

### `Unable to load script from assets`
Le bundle JS n'a pas été généré. Lance Metro dans un terminal séparé :
```powershell
cd mobile ; npm run start
```

### L'app ne se connecte pas au backend
1. Vérifie que le backend tourne : `http://10.38.9.90:5000/health` (depuis un navigateur sur le PC)
2. Vérifie que le téléphone est sur le **même réseau** que le PC
3. Vérifie que le **pare-feu Windows** autorise Node.js sur le port 5000 :
   ```powershell
   # Autoriser Node.js dans le pare-feu (à lancer en admin)
   New-NetFirewallRule -DisplayName "Node.js Backend" `
     -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
   ```
4. Teste depuis le téléphone : ouvre `http://10.38.9.90:5000/health` dans le navigateur mobile.

### L'IP du PC a changé
```powershell
# 1. Trouve la nouvelle IP
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }

# 2. Mets à jour les fichiers de config
# mobile/src/services/api.js       → BASE_URL
# mobile/src/services/socketClient.js → SOCKET_URL

# 3. Rebuilde l'APK
cd mobile ; .\build-apk.ps1 -Clean -Install
```

### `Gradle build failed` — Erreur de mémoire
Ouvre `mobile/android/gradle.properties` et ajoute/modifie :
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### `Could not find react-native-vector-icons`
```powershell
cd mobile
npm install
cd android ; .\gradlew clean
```
Et vérifie que `apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")` est bien dans `android/app/build.gradle`.

---

## Récapitulatif des commandes essentielles

| Action | Commande |
|--------|----------|
| Build APK Debug | `.\build-apk.ps1` |
| Build APK Debug + install | `.\build-apk.ps1 -Install` |
| Build APK Release | `.\build-apk.ps1 -Release` |
| Clean + Build | `.\build-apk.ps1 -Clean` |
| Installer via ADB | `adb install -r dist\<fichier>.apk` |
| Voir les appareils ADB | `adb devices` |
| Démarrer Metro | `npm run start` |
| Run sur téléphone USB | `npm run android` |
| Nettoyer le build | `npm run clean:android` |
| Trouver l'IP locale | `Get-NetIPAddress -AddressFamily IPv4` |
