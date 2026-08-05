/**
 * mtnPackages.js
 * Catalogue des packages MTN Bénin prédéfinis.
 *
 * Structure :
 *   - credit      : recharges téléphoniques (montants libres ou prédéfinis)
 *   - data_sale   : forfaits data / internet
 *   - unlimited   : forfaits illimités (appels + data)
 *
 * Les codes (planCode) correspondent aux codes MTN Bénin.
 * À mettre à jour selon la grille tarifaire officielle MTN.
 */

const MTN_PACKAGES = {
  // ─── Recharge crédit (airtime) ────────────────────────────────
  credit: {
    label: 'Recharge crédit',
    operator: 'MTN',
    currency: 'XOF',
    // Montants prédéfinis + option montant libre
    presets: [100, 200, 500, 1000, 2000, 5000],
    allowFreeAmount: true,
    minAmount: 50,
    maxAmount: 50000,
  },

  // ─── Forfaits Data (internet) ──────────────────────────────────
  data_sale: {
    label: 'Forfait Data',
    operator: 'MTN',
    currency: 'XOF',
    allowFreeAmount: false,
    plans: [
      { code: 'DATA_10MB_24H',  label: '10 Mo / 24h',       price: 25,   validity: '24h' },
      { code: 'DATA_50MB_24H',  label: '50 Mo / 24h',       price: 100,  validity: '24h' },
      { code: 'DATA_200MB_1D',  label: '200 Mo / 1 jour',   price: 200,  validity: '1 jour' },
      { code: 'DATA_500MB_7D',  label: '500 Mo / 7 jours',  price: 500,  validity: '7 jours' },
      { code: 'DATA_1GB_7D',    label: '1 Go / 7 jours',    price: 1000, validity: '7 jours' },
      { code: 'DATA_2GB_30D',   label: '2 Go / 30 jours',   price: 2000, validity: '30 jours' },
      { code: 'DATA_5GB_30D',   label: '5 Go / 30 jours',   price: 3500, validity: '30 jours' },
      { code: 'DATA_10GB_30D',  label: '10 Go / 30 jours',  price: 5000, validity: '30 jours' },
    ],
  },

  // ─── Forfaits Illimités (appels + data) ────────────────────────
  unlimited: {
    label: 'Forfait Illimité',
    operator: 'MTN',
    currency: 'XOF',
    allowFreeAmount: false,
    plans: [
      { code: 'ILL_CALLS_24H',  label: 'Appels illimités 24h',       price: 200,  validity: '24h' },
      { code: 'ILL_CALLS_7D',   label: 'Appels illimités 7 jours',   price: 1000, validity: '7 jours' },
      { code: 'ILL_CALLS_30D',  label: 'Appels illimités 30 jours',  price: 3000, validity: '30 jours' },
      { code: 'ILL_COMBO_24H',  label: 'Combo illimité 24h',         price: 500,  validity: '24h',    includes: 'Appels + 200Mo' },
      { code: 'ILL_COMBO_7D',   label: 'Combo illimité 7 jours',     price: 2000, validity: '7 jours', includes: 'Appels + 1Go' },
      { code: 'ILL_COMBO_30D',  label: 'Combo illimité 30 jours',    price: 5000, validity: '30 jours', includes: 'Appels + 5Go' },
    ],
  },
};

/**
 * Retourne tous les packages formatés pour l'API
 */
const getAllPackages = () => MTN_PACKAGES;

/**
 * Retourne les packages d'un type donné
 * @param {'credit'|'data_sale'|'unlimited'} type
 */
const getPackagesByType = (type) => MTN_PACKAGES[type] || null;

/**
 * Trouve un plan spécifique par code
 * @param {string} planCode
 */
const findPlanByCode = (planCode) => {
  for (const category of Object.values(MTN_PACKAGES)) {
    if (category.plans) {
      const plan = category.plans.find((p) => p.code === planCode);
      if (plan) return plan;
    }
  }
  return null;
};

/**
 * Valide un montant pour une recharge crédit
 * @param {number} amount
 */
const validateCreditAmount = (amount) => {
  const { minAmount, maxAmount } = MTN_PACKAGES.credit;
  return amount >= minAmount && amount <= maxAmount;
};

module.exports = { getAllPackages, getPackagesByType, findPlanByCode, validateCreditAmount, MTN_PACKAGES };
