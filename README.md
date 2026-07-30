# 💸 GestionMoMo — Application Mobile Money

Architecture complète Node.js/Express + React Native + React Admin.

## Structure du projet

```
gestionMoMo/
├── backend/          # API Node.js/Express
├── mobile/           # Application React Native
├── web-admin/        # Dashboard React Web
└── shared/           # Tokens de design partagés
```

## Stack technique
- **Backend** : Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, bcrypt
- **Mobile** : React Native, React Navigation, Axios, Context API
- **Web Admin** : React, React Router, Axios, Chart.js
- **Design** : Manrope, couleur principale #0A66C2, Dark/Light mode

## Lancer le projet

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx react-native run-android
# ou
npx react-native run-ios
```

### Web Admin
```bash
cd web-admin
npm install
npm start
```

## Rôles utilisateurs
- `super_admin` — accès global multi-marchands
- `merchant` — gestion de son compte et de ses transactions
- `client` — consultation de l'historique et profil
