/**
 * smsService.js
 * Envoi de SMS via l'API HTTP smsmode©
 * Documentation : https://www.smsmode.com/api-sms/
 *
 * Endpoint : POST https://api.smsmode.com/http/1.6/sendSMS.do
 * Authentification : accessToken (header ou query param)
 * Compte gratuit : 20 crédits offerts sans engagement
 */

const https = require('https');
const querystring = require('querystring');

/**
 * Envoie un SMS via l'API smsmode.
 *
 * @param {string} to      Numéro destinataire — format international sans +  (ex: 22901XXXXXXXX)
 *                          smsmode accepte aussi le format +229... mais on normalise ici
 * @param {string} message Corps du SMS
 * @returns {Promise<void>} — échoue silencieusement si l'API n'est pas configurée
 */
const send = async (to, message) => {
  if (!process.env.SMSMODE_ACCESS_TOKEN) {
    console.warn('[smsService] SMSMODE_ACCESS_TOKEN non configuré — SMS ignoré vers', to);
    return;
  }

  // smsmode attend le numéro sans le "+" (ex: 22901XXXXXXXX)
  const numero = to.replace(/^\+/, '');

  const postData = querystring.stringify({
    accessToken: process.env.SMSMODE_ACCESS_TOKEN,
    numero,
    message,
    // Émetteur personnalisé (11 chars max, alphanumérique) — optionnel
    // emetteur: process.env.SMSMODE_SENDER || 'GestionMoMo',
  });

  const options = {
    hostname: 'api.smsmode.com',
    port: 443,
    path: '/http/1.6/sendSMS.do',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        // smsmode répond "0 | success" ou un code d'erreur
        if (!body.startsWith('0')) {
          console.error('[smsService] Erreur smsmode :', body.trim());
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('[smsService] Erreur réseau :', err.message);
      resolve(); // silencieux
    });

    req.write(postData);
    req.end();
  });
};

// ─── Templates SMS ──────────────────────────────────────────────────────────

/**
 * SMS de bienvenue — compte créé par un admin
 */
const sendWelcome = ({ to, name, phone, password, pin }) => {
  const parts = [`GestionMoMo - Bonjour ${name} ! Votre compte a ete cree.`, `Tel: ${phone}`];
  if (password) parts.push(`MDP web: ${password}`);
  if (pin)      parts.push(`PIN mobile: ${pin}`);
  parts.push('Changez vos identifiants des la 1ere connexion.');
  return send(to, parts.join(' | '));
};

/**
 * SMS de réinitialisation du mot de passe web-admin
 */
const sendPasswordReset = ({ to, name, newPassword }) =>
  send(to, `GestionMoMo - Bonjour ${name}, votre mot de passe web a ete reinitialise. Nouveau MDP temporaire: ${newPassword} | Changez-le immediatement.`);

/**
 * SMS de réinitialisation du code PIN mobile
 */
const sendPinReset = ({ to, name, newPin }) =>
  send(to, `GestionMoMo - Bonjour ${name}, votre code PIN mobile a ete reinitialise. Nouveau PIN temporaire: ${newPin} | Changez-le depuis l'app.`);

module.exports = { send, sendWelcome, sendPasswordReset, sendPinReset };
