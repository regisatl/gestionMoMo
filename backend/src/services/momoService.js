/**
 * momoService.js
 *
 * Service d'intégration MTN MoMo API (Bénin — sandbox & production).
 * Couvre :
 *   - Provisioning automatique (création userId + apiKey par marchand)
 *   - Collection API  → requestToPay (dépôt : MTN débite le client)
 *   - Disbursement API → transfer    (retrait : MTN crédite le client)
 *   - Airtime         → creditSale   (recharge crédit téléphonique)
 *   - Subscription    → activatePlan (forfait data / illimité)
 *
 * IMPORTANT :
 *   - En mode SANDBOX les appels sont simulés côté MTN (pas de débit réel).
 *   - Pour la PRODUCTION, remplace MOMO_ENVIRONMENT=production dans .env
 *     et fournis les vraies clés primaires.
 *   - creditSale et activatePlan utilisent la Disbursement API car MTN
 *     ne fournit pas d'endpoint dédié dans son API publique standard.
 *     En production, une convention avec MTN Bénin doit être établie.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Account = require('../models/Account');
const logger = require('../config/logger');

const BASE_URL = process.env.MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const ENV      = process.env.MOMO_ENVIRONMENT || 'sandbox';

// ─── Clés primaires (par produit API) ─────────────────────────────────────────
const PRIMARY_KEYS = {
  collection:   process.env.MOMO_COLLECTION_PRIMARY_KEY,
  disbursement: process.env.MOMO_DISBURSEMENT_PRIMARY_KEY,
  remittance:   process.env.MOMO_REMITTANCE_PRIMARY_KEY,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formate un numéro de téléphone en format MTN (ex: "+22901XXXXXXXX" → "22901XXXXXXXX")
 */
const formatPhone = (phone) => phone.replace(/^\+/, '');

/**
 * Construit les headers de base pour un appel API MoMo
 */
const buildHeaders = (apiKey, accessToken, product) => ({
  'Authorization':  `Bearer ${accessToken}`,
  'X-Target-Environment': ENV,
  'Ocp-Apim-Subscription-Key': PRIMARY_KEYS[product],
  'Content-Type':  'application/json',
  'X-Reference-Id': uuidv4(),
  ...(apiKey ? { 'ApiKey': apiKey } : {}),
});

// ─── Provisioning ─────────────────────────────────────────────────────────────

/**
 * Crée un utilisateur API MTN MoMo pour un marchand (étape de provisioning sandbox).
 * En production, ce processus est fait manuellement avec MTN.
 * @param {string} product  'collection' | 'disbursement'
 * @returns {{ userId: string, apiKey: string }}
 */
const provisionUser = async (product = 'collection') => {
  const userId = uuidv4();

  // Étape 1 : Créer l'utilisateur
  await axios.post(
    `${BASE_URL}/${product}/v1_0/apiuser`,
    { providerCallbackHost: process.env.MOMO_CALLBACK_URL || 'https://webhook.site/placeholder' },
    {
      headers: {
        'X-Reference-Id': userId,
        'Ocp-Apim-Subscription-Key': PRIMARY_KEYS[product],
        'Content-Type': 'application/json',
      },
    }
  );

  // Étape 2 : Générer la clé API
  const { data } = await axios.post(
    `${BASE_URL}/${product}/v1_0/apiuser/${userId}/apikey`,
    {},
    {
      headers: {
        'Ocp-Apim-Subscription-Key': PRIMARY_KEYS[product],
      },
    }
  );

  logger.info(`[MoMo] Provisioning OK — userId: ${userId}`);
  return { userId, apiKey: data.apiKey };
};

// ─── Token d'accès ─────────────────────────────────────────────────────────────

/**
 * Obtient un token d'accès OAuth2 MTN MoMo.
 * @param {string} userId
 * @param {string} apiKey
 * @param {string} product  'collection' | 'disbursement'
 * @returns {string} accessToken
 */
const getAccessToken = async (userId, apiKey, product = 'collection') => {
  const credentials = Buffer.from(`${userId}:${apiKey}`).toString('base64');

  const { data } = await axios.post(
    `${BASE_URL}/${product}/token/`,
    {},
    {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': PRIMARY_KEYS[product],
        'Content-Type': 'application/json',
      },
    }
  );

  return data.access_token;
};

/**
 * Récupère le token pour le compte d'un marchand.
 * Utilise les credentials stockés sur Account.
 * Si le compte n'a pas encore de credentials, lance le provisioning (sandbox).
 * @param {object} account  Instance mongoose Account (avec momoApiKey via select)
 * @param {string} product
 * @returns {{ accessToken: string, account: object }}
 */
const getTokenForAccount = async (account, product = 'collection') => {
  let { momoUserId, momoApiKey } = account;

  // Provisioning automatique si pas encore de credentials (sandbox uniquement)
  if (!momoUserId || !momoApiKey) {
    if (ENV !== 'sandbox') {
      throw new Error('Credentials MoMo manquants. Configurez momoUserId et momoApiKey pour ce marchand.');
    }
    logger.info(`[MoMo] Provisioning automatique pour le compte ${account._id}`);
    const creds = await provisionUser(product);
    momoUserId = creds.userId;
    momoApiKey = creds.apiKey;

    // Persister sur le compte (sans retourner la clé dans les réponses API)
    await Account.findByIdAndUpdate(account._id, {
      momoUserId,
      momoApiKey,
    });
  }

  const accessToken = await getAccessToken(momoUserId, momoApiKey, product);
  return { accessToken, momoUserId, momoApiKey };
};

// ─── Collection API (Dépôt) ────────────────────────────────────────────────────

/**
 * Dépôt : demande à MTN de débiter le client et de créditer le marchand.
 * (Collection / Request To Pay)
 *
 * @param {object} account      Compte marchand
 * @param {number} amount       Montant en XOF
 * @param {string} clientPhone  Numéro du client
 * @param {string} reference    Référence interne de la transaction
 * @param {string} description  Motif
 * @returns {{ referenceId: string }}
 */
const requestToPay = async (account, amount, clientPhone, reference, description = '') => {
  try {
    const { accessToken } = await getTokenForAccount(account, 'collection');
    const referenceId = uuidv4();

    await axios.post(
      `${BASE_URL}/collection/v1_0/requesttopay`,
      {
        amount:       String(amount),
        currency:     account.currency || 'XOF',
        externalId:   reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId:      formatPhone(clientPhone),
        },
        payerMessage: description || `Dépôt MoMo — ${reference}`,
        payeeNote:    `GestionMoMo — ${reference}`,
      },
      {
        headers: {
          'Authorization':  `Bearer ${accessToken}`,
          'X-Target-Environment': ENV,
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': PRIMARY_KEYS.collection,
          'Content-Type': 'application/json',
          'X-Callback-Url': `${process.env.MOMO_CALLBACK_URL}/collection`,
        },
      }
    );

    logger.info(`[MoMo] requestToPay lancé — ref: ${referenceId}, montant: ${amount}, client: ${clientPhone}`);
    return { referenceId };
  } catch (err) {
    logger.error(`[MoMo] requestToPay erreur: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    throw new Error(err.response?.data?.message || 'Erreur lors du dépôt MTN MoMo.');
  }
};

// ─── Disbursement API (Retrait + Crédit + Forfait) ─────────────────────────────

/**
 * Retrait : MTN débite le compte marchand et crédite le client.
 * (Disbursement / Transfer)
 *
 * @param {object} account      Compte marchand
 * @param {number} amount       Montant en XOF
 * @param {string} clientPhone  Numéro du client bénéficiaire
 * @param {string} reference    Référence interne
 * @param {string} description  Motif
 * @returns {{ referenceId: string }}
 */
const transfer = async (account, amount, clientPhone, reference, description = '') => {
  try {
    const { accessToken } = await getTokenForAccount(account, 'disbursement');
    const referenceId = uuidv4();

    await axios.post(
      `${BASE_URL}/disbursement/v1_0/transfer`,
      {
        amount:   String(amount),
        currency: account.currency || 'XOF',
        externalId: reference,
        payee: {
          partyIdType: 'MSISDN',
          partyId:      formatPhone(clientPhone),
        },
        payerMessage: description || `Retrait MoMo — ${reference}`,
        payeeNote:    `GestionMoMo — ${reference}`,
      },
      {
        headers: {
          'Authorization':  `Bearer ${accessToken}`,
          'X-Target-Environment': ENV,
          'X-Reference-Id': referenceId,
          'Ocp-Apim-Subscription-Key': PRIMARY_KEYS.disbursement,
          'Content-Type': 'application/json',
          'X-Callback-Url': `${process.env.MOMO_CALLBACK_URL}/disbursement`,
        },
      }
    );

    logger.info(`[MoMo] transfer lancé — ref: ${referenceId}, montant: ${amount}, client: ${clientPhone}`);
    return { referenceId };
  } catch (err) {
    logger.error(`[MoMo] transfer erreur: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    throw new Error(err.response?.data?.message || 'Erreur lors du retrait MTN MoMo.');
  }
};

/**
 * Vente crédit (recharge airtime) :
 * Transfère un montant en airtime vers le numéro client via Disbursement.
 * En production : MTN Bénin peut fournir un endpoint dédié — à adapter.
 *
 * @param {object} account
 * @param {number} amount       Montant de recharge en XOF
 * @param {string} clientPhone
 * @param {string} reference
 * @returns {{ referenceId: string }}
 */
const creditSale = async (account, amount, clientPhone, reference) => {
  return transfer(
    account,
    amount,
    clientPhone,
    reference,
    `Recharge crédit ${amount} XOF — ${reference}`
  );
};

/**
 * Activation d'un forfait data / illimité :
 * Transfère le montant du forfait via Disbursement.
 * Le code plan (planCode) est enregistré dans la transaction pour traçabilité.
 * En production : intégrer l'endpoint d'activation spécifique MTN Bénin.
 *
 * @param {object} account
 * @param {number} amount       Prix du forfait en XOF
 * @param {string} clientPhone
 * @param {string} planCode     Code du forfait (ex: DATA_1GB_7D)
 * @param {string} planLabel    Libellé lisible
 * @param {string} reference
 * @returns {{ referenceId: string }}
 */
const activatePlan = async (account, amount, clientPhone, planCode, planLabel, reference) => {
  return transfer(
    account,
    amount,
    clientPhone,
    reference,
    `Forfait ${planLabel} (${planCode}) — ${reference}`
  );
};

// ─── Statut d'une transaction ─────────────────────────────────────────────────

/**
 * Vérifie le statut d'une transaction Collection auprès de MTN.
 * @param {object} account
 * @param {string} referenceId   UUID de la transaction MoMo
 * @returns {{ status: 'SUCCESSFUL'|'FAILED'|'PENDING', reason: string|null }}
 */
const getTransactionStatus = async (account, referenceId, product = 'collection') => {
  try {
    const { accessToken } = await getTokenForAccount(account, product);

    const endpoint = product === 'collection'
      ? `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`
      : `${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`;

    const { data } = await axios.get(endpoint, {
      headers: {
        'Authorization':  `Bearer ${accessToken}`,
        'X-Target-Environment': ENV,
        'Ocp-Apim-Subscription-Key': PRIMARY_KEYS[product],
      },
    });

    return {
      status: data.status,
      reason: data.reason || null,
      financialTransactionId: data.financialTransactionId || null,
    };
  } catch (err) {
    logger.warn(`[MoMo] getTransactionStatus erreur pour ${referenceId}: ${err.message}`);
    return { status: 'UNKNOWN', reason: err.message };
  }
};

// ─── Solde du compte ──────────────────────────────────────────────────────────

/**
 * Récupère le solde du compte MoMo Collection du marchand.
 * @param {object} account
 * @returns {{ availableBalance: string, currency: string }}
 */
const getBalance = async (account) => {
  try {
    const { accessToken } = await getTokenForAccount(account, 'collection');

    const { data } = await axios.get(`${BASE_URL}/collection/v1_0/account/balance`, {
      headers: {
        'Authorization':  `Bearer ${accessToken}`,
        'X-Target-Environment': ENV,
        'Ocp-Apim-Subscription-Key': PRIMARY_KEYS.collection,
      },
    });

    return { availableBalance: data.availableBalance, currency: data.currency };
  } catch (err) {
    logger.warn(`[MoMo] getBalance erreur: ${err.message}`);
    throw new Error('Impossible de récupérer le solde MTN MoMo.');
  }
};

module.exports = {
  provisionUser,
  getAccessToken,
  getTokenForAccount,
  requestToPay,
  transfer,
  creditSale,
  activatePlan,
  getTransactionStatus,
  getBalance,
};
