/**
 * whatsappService.js
 *
 * Passerelle WhatsApp via whatsapp-web.js (Puppeteer).
 * Le client se connecte à ton WhatsApp Business existant via QR code.
 * Une fois authentifié, la session est sauvegardée localement
 * (.wwebjs_auth/) — pas besoin de rescanner à chaque redémarrage.
 *
 * Fonctionnement :
 *  1. Au démarrage du serveur, le client s'initialise.
 *  2. Si c'est la première fois : un QR code s'affiche dans la console
 *     → scanne-le avec WhatsApp Business sur ton téléphone.
 *  3. La session est persistée → plus de QR code aux redémarrages suivants.
 *  4. Tous les envois sont mis en file d'attente tant que le client
 *     n'est pas prêt, puis envoyés automatiquement.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ─── État du client ──────────────────────────────────────────────────────────
let client = null;
let isReady = false;
const messageQueue = []; // file d'attente si le client n'est pas encore prêt

// ─── Initialisation ──────────────────────────────────────────────────────────

/**
 * Initialise le client WhatsApp.
 * Appelé une seule fois au démarrage du serveur (server.js).
 */
const init = () => {
  if (client) return; // déjà initialisé

  // Désactivé via variable d'environnement
  if (process.env.WHATSAPP_ENABLED === 'false') {
    console.log('[WhatsApp] Désactivé (WHATSAPP_ENABLED=false).');
    return;
  }

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth', // dossier de session persistante
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    },
  });

  // ── QR Code ──
  client.on('qr', (qr) => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  📱 WHATSAPP — Scanne ce QR code avec ton téléphone');
    console.log('  WhatsApp Business → Appareils liés → Lier un appareil');
    console.log('═══════════════════════════════════════════════════\n');
    qrcode.generate(qr, { small: true });
    console.log('\n═══════════════════════════════════════════════════\n');
  });

  // ── Prêt ──
  client.on('ready', () => {
    isReady = true;
    console.log('✅ [WhatsApp] Client connecté et prêt.');

    // Vide la file d'attente
    if (messageQueue.length > 0) {
      console.log(`[WhatsApp] Envoi de ${messageQueue.length} message(s) en attente...`);
      messageQueue.forEach(({ to, message, resolve, reject }) => {
        _sendNow(to, message).then(resolve).catch(reject);
      });
      messageQueue.length = 0;
    }
  });

  // ── Authentifié ──
  client.on('authenticated', () => {
    console.log('🔐 [WhatsApp] Session authentifiée — QR code non requis au prochain démarrage.');
  });

  // ── Échec d'authentification ──
  client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('❌ [WhatsApp] Échec d\'authentification :', msg);
    console.error('   Supprime le dossier .wwebjs_auth/ et redémarre pour rescanner le QR.');
  });

  // ── Déconnexion ──
  client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('⚠️ [WhatsApp] Client déconnecté :', reason);
    // Tentative de reconnexion après 10 secondes
    setTimeout(() => {
      console.log('[WhatsApp] Tentative de reconnexion...');
      client.initialize();
    }, 10000);
  });

  client.initialize();
  console.log('⏳ [WhatsApp] Initialisation en cours...');
};

// ─── Envoi immédiat (interne) ─────────────────────────────────────────────────

/**
 * Formate le numéro au format WhatsApp : 22901XXXXXXXX@c.us
 * WhatsApp utilise le format E.164 sans "+" suivi de "@c.us"
 */
const formatNumber = (phone) => {
  const digits = phone.replace(/\D/g, ''); // retire tout sauf les chiffres
  return `${digits}@c.us`;
};

const _sendNow = async (to, message) => {
  const chatId = formatNumber(to);
  await client.sendMessage(chatId, message);
  console.log(`[WhatsApp] ✉️  Message envoyé à ${to}`);
};

// ─── Envoi public ─────────────────────────────────────────────────────────────

/**
 * Envoie un message WhatsApp.
 * Si le client n'est pas encore prêt, met le message en file d'attente.
 *
 * @param {string} to      Numéro de téléphone (format +229..., 229..., etc.)
 * @param {string} message Texte du message
 * @returns {Promise<void>}
 */
const send = (to, message) => {
  if (process.env.WHATSAPP_ENABLED === 'false') return Promise.resolve();

  if (!client) {
    console.warn('[WhatsApp] Client non initialisé — message ignoré vers', to);
    return Promise.resolve();
  }

  if (isReady) {
    return _sendNow(to, message).catch((err) => {
      console.error('[WhatsApp] Erreur envoi :', err.message);
    });
  }

  // Client pas encore prêt → file d'attente
  return new Promise((resolve, reject) => {
    console.log(`[WhatsApp] Client non prêt — message vers ${to} mis en file d'attente.`);
    messageQueue.push({ to, message, resolve, reject });
  });
};

// ─── Templates messages ───────────────────────────────────────────────────────

/**
 * Message de bienvenue — compte créé par un admin
 */
const sendWelcome = ({ to, name, phone, password, pin }) => {
  const lines = [
    `👋 *Bienvenue sur GestionMoMo !*`,
    ``,
    `Bonjour *${name}*, votre compte a été créé avec succès.`,
    ``,
    `📞 Téléphone : ${phone}`,
    password ? `🖥️ Mot de passe web : \`${password}\`` : null,
    pin       ? `📱 Code PIN mobile : \`${pin}\`` : null,
    ``,
    `⚠️ *Changez vos identifiants dès votre première connexion.*`,
    ``,
    `— L'équipe GestionMoMo`,
  ].filter(Boolean).join('\n');

  return send(to, lines);
};

/**
 * Message de réinitialisation du mot de passe web-admin
 */
const sendPasswordReset = ({ to, name, newPassword }) => {
  const msg = [
    `🔐 *Réinitialisation de mot de passe — GestionMoMo*`,
    ``,
    `Bonjour *${name}*,`,
    `Votre mot de passe web-admin a été réinitialisé par un administrateur.`,
    ``,
    `🖥️ Nouveau mot de passe temporaire :`,
    `\`${newPassword}\``,
    ``,
    `⚠️ *Changez ce mot de passe immédiatement après connexion.*`,
    ``,
    `— L'équipe GestionMoMo`,
  ].join('\n');

  return send(to, msg);
};

/**
 * Message de réinitialisation du code PIN mobile
 */
const sendPinReset = ({ to, name, newPin }) => {
  const msg = [
    `🔑 *Réinitialisation de code PIN — GestionMoMo*`,
    ``,
    `Bonjour *${name}*,`,
    `Votre code PIN mobile a été réinitialisé par un administrateur.`,
    ``,
    `📱 Nouveau code PIN temporaire :`,
    `\`${newPin}\``,
    ``,
    `⚠️ *Changez ce code PIN immédiatement depuis l'application mobile.*`,
    ``,
    `— L'équipe GestionMoMo`,
  ].join('\n');

  return send(to, msg);
};

// ─── Status ───────────────────────────────────────────────────────────────────

/** Retourne l'état de connexion du client */
const getStatus = () => ({
  initialized: !!client,
  ready: isReady,
  queueLength: messageQueue.length,
});

module.exports = { init, send, sendWelcome, sendPasswordReset, sendPinReset, getStatus };
