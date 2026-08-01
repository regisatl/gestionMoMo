/**
 * Script de seed — crée 2 marchands et 2 clients de test
 * avec toutes les données remplies.
 *
 * Usage :
 *   node src/scripts/seedTestUsers.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User     = require('../models/User');
const Account  = require('../models/Account');

// ---------------------------------------------------------------------------
// Données de test
// ---------------------------------------------------------------------------

const MERCHANTS = [
  {
    name:            'Kofi Mensah',
    phone:           '+2290101111111',
    email:           'kofi.mensah@example.com',
    passwordHash:    'Admin@Kofi2024',   // mot de passe web-admin (min 8 chars)
    pinHash:         '12345',            // PIN mobile (5 chiffres)
    role:            'merchant',
    status:          'active',
    businessName:    'Kofi Mobile Money Services',
    businessAddress: 'Rue des Palmiers, Cotonou, Bénin',
    language:        'fr',
    theme:           'light',
    // Compte MoMo associé
    account: {
      momoAccountNumber: 'MOMO-TEST-MERCHANT-001',
      balance:           250000,
      currency:          'XOF',
      momoUserId:        'momo-uid-kofi-001',
      momoEnvironment:   'sandbox',
      isActive:          true,
      totalDeposits:     1500000,
      totalWithdrawals:  1250000,
      totalTransactions: 48,
    },
  },
  {
    name:            'Ama Adjovi',
    phone:           '+2290102222222',
    email:           'ama.adjovi@example.com',
    passwordHash:    'Admin@Ama2024',    // mot de passe web-admin
    pinHash:         '54321',            // PIN mobile
    role:            'merchant',
    status:          'active',
    businessName:    'Adjovi Tech & Pay',
    businessAddress: 'Avenue Steinmetz, Porto-Novo, Bénin',
    language:        'fr',
    theme:           'dark',
    account: {
      momoAccountNumber: 'MOMO-TEST-MERCHANT-002',
      balance:           87500,
      currency:          'XOF',
      momoUserId:        'momo-uid-ama-002',
      momoEnvironment:   'sandbox',
      isActive:          true,
      totalDeposits:     500000,
      totalWithdrawals:  412500,
      totalTransactions: 21,
    },
  },
];

const CLIENTS = [
  {
    name:         'Brice Ahounou',
    phone:        '+2290103333333',
    email:        'brice.ahounou@example.com',
    passwordHash: 'Admin@Brice2024',  // mot de passe web-admin
    pinHash:      '11111',             // PIN mobile
    role:         'client',
    status:       'active',
    language:     'fr',
    theme:        'light',
  },
  {
    name:         'Fatoumata Diallo',
    phone:        '+2290104444444',
    email:        'fatoumata.diallo@example.com',
    passwordHash: 'Admin@Fato2024',   // mot de passe web-admin
    pinHash:      '99999',             // PIN mobile
    role:         'client',
    status:       'active',
    language:     'fr',
    theme:        'light',
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  const results = [];

  // ---- Marchands ----
  for (const data of MERCHANTS) {
    const { account: accountData, ...userData } = data;

    // Vérifie si le numéro existe déjà
    const existing = await User.findOne({ phone: userData.phone });
    if (existing) {
      console.log(`⚠️  Marchand déjà existant (${userData.phone}) — ignoré`);
      results.push({ ...userData, skipped: true });
      continue;
    }

    const user = await User.create(userData);

    // Crée le compte MoMo associé
    const account = await Account.create({
      merchantId: user._id,
      ...accountData,
      lastSync: new Date(),
    });

    console.log(`✅ Marchand créé : ${user.name} (${user.phone})`);
    console.log(`   └─ Compte MoMo : ${account.momoAccountNumber} — Solde : ${account.balance} XOF`);
    results.push({ name: user.name, phone: user.phone, pin: userData.pinHash, password: userData.passwordHash, role: 'merchant', account: account.momoAccountNumber });
  }

  // ---- Clients ----
  for (const userData of CLIENTS) {
    const existing = await User.findOne({ phone: userData.phone });
    if (existing) {
      console.log(`⚠️  Client déjà existant (${userData.phone}) — ignoré`);
      results.push({ ...userData, skipped: true });
      continue;
    }

    const user = await User.create(userData);
    console.log(`✅ Client créé : ${user.name} (${user.phone})`);
    results.push({ name: user.name, phone: user.phone, pin: userData.pinHash, password: userData.passwordHash, role: 'client' });
  }

  // ---- Résumé ----
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('RÉCAPITULATIF DES COMPTES DE TEST');
  console.log('─────────────────────────────────────────────────────────────');
  for (const r of results) {
    if (r.skipped) continue;
    console.log(`[${r.role.toUpperCase().padEnd(8)}] ${r.name}`);
    console.log(`             Tél       : ${r.phone}`);
    console.log(`             PIN mob.  : ${r.pin}`);
    console.log(`             MDP web   : ${r.password}`);
    if (r.account) console.log(`             Compte    : ${r.account}`);
    console.log('');
  }
  console.log('─────────────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌 Déconnecté de MongoDB');
}

seed().catch((err) => {
  console.error('❌ Erreur seed :', err.message);
  mongoose.disconnect();
  process.exit(1);
});
