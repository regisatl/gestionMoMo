/**
 * emailService.js
 * Envoi d'emails transactionnels via nodemailer (SMTP).
 * Compatible avec Gmail, Brevo, Mailgun, SendGrid, etc.
 */

const nodemailer = require('nodemailer');

// Création du transporteur — lazy (créé au premier appel)
let _transporter = null;
const getTransporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour le port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
};

/**
 * Envoie un email.
 * @param {Object} opts
 * @param {string}   opts.to       Destinataire
 * @param {string}   opts.subject  Sujet
 * @param {string}   opts.text     Corps texte brut (fallback)
 * @param {string}   [opts.html]   Corps HTML (optionnel)
 * @returns {Promise<void>}  — échoue silencieusement si SMTP non configuré
 */
const send = async ({ to, subject, text, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[emailService] SMTP non configuré — email ignoré vers', to);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'GestionMoMo'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('[emailService] Erreur envoi email :', err.message);
  }
};

// ─── Templates ──────────────────────────────────────────────────────────────

/**
 * Email de bienvenue — compte créé par un admin
 */
const sendWelcome = ({ to, name, phone, password, pin }) => {
  const lines = [];
  if (password) lines.push(`• Mot de passe web-admin : <strong>${password}</strong>`);
  if (pin)      lines.push(`• Code PIN mobile : <strong>${pin}</strong>`);

  return send({
    to,
    subject: 'Bienvenue sur GestionMoMo — Vos identifiants de connexion',
    text: [
      `Bonjour ${name},`,
      '',
      'Votre compte GestionMoMo a été créé par un administrateur.',
      `Numéro de téléphone : ${phone}`,
      password ? `Mot de passe web-admin : ${password}` : '',
      pin      ? `Code PIN mobile : ${pin}` : '',
      '',
      'Veuillez changer vos identifiants dès votre première connexion.',
      '',
      '— L\'équipe GestionMoMo',
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#0A66C2;margin-bottom:4px;">Bienvenue sur GestionMoMo</h2>
        <p style="color:#374151;font-size:15px;">Bonjour <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Votre compte a été créé par un administrateur. Voici vos identifiants :</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:16px 0;">
          <p style="margin:4px 0;font-size:14px;color:#374151;">📞 Téléphone : <strong>${phone}</strong></p>
          ${lines.map(l => `<p style="margin:4px 0;font-size:14px;color:#374151;">${l}</p>`).join('')}
        </div>
        <p style="color:#EF4444;font-size:13px;font-weight:600;">⚠️ Veuillez changer vos identifiants dès votre première connexion.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© GestionMoMo — Ne pas répondre à cet email</p>
      </div>`,
  });
};

/**
 * Email de réinitialisation du mot de passe web-admin
 */
const sendPasswordReset = ({ to, name, newPassword }) => {
  return send({
    to,
    subject: 'GestionMoMo — Réinitialisation de votre mot de passe',
    text: [
      `Bonjour ${name},`,
      '',
      'Votre mot de passe web-admin a été réinitialisé par un administrateur.',
      `Nouveau mot de passe temporaire : ${newPassword}`,
      '',
      'Veuillez le changer immédiatement après connexion.',
      '',
      '— L\'équipe GestionMoMo',
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#0A66C2;margin-bottom:4px;">Réinitialisation du mot de passe</h2>
        <p style="color:#374151;font-size:15px;">Bonjour <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Votre mot de passe web-admin a été réinitialisé par un administrateur.</p>
        <div style="background:#fff;border:2px solid #0A66C2;border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;">
          <p style="margin:0;font-size:13px;color:#6b7280;">Nouveau mot de passe temporaire</p>
          <p style="margin:8px 0 0;font-size:22px;font-weight:700;font-family:monospace;color:#0A66C2;letter-spacing:2px;">${newPassword}</p>
        </div>
        <p style="color:#EF4444;font-size:13px;font-weight:600;">⚠️ Changez ce mot de passe immédiatement après connexion.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© GestionMoMo — Ne pas répondre à cet email</p>
      </div>`,
  });
};

/**
 * Email de réinitialisation du PIN mobile
 */
const sendPinReset = ({ to, name, newPin }) => {
  return send({
    to,
    subject: 'GestionMoMo — Réinitialisation de votre code PIN mobile',
    text: [
      `Bonjour ${name},`,
      '',
      'Votre code PIN mobile a été réinitialisé par un administrateur.',
      `Nouveau code PIN temporaire : ${newPin}`,
      '',
      'Veuillez le changer immédiatement depuis l\'application mobile.',
      '',
      '— L\'équipe GestionMoMo',
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#7C3AED;margin-bottom:4px;">Réinitialisation du code PIN mobile</h2>
        <p style="color:#374151;font-size:15px;">Bonjour <strong>${name}</strong>,</p>
        <p style="color:#374151;font-size:14px;">Votre code PIN mobile a été réinitialisé par un administrateur.</p>
        <div style="background:#fff;border:2px solid #7C3AED;border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;">
          <p style="margin:0;font-size:13px;color:#6b7280;">Nouveau code PIN temporaire</p>
          <p style="margin:8px 0 0;font-size:36px;font-weight:700;font-family:monospace;color:#7C3AED;letter-spacing:8px;">${newPin}</p>
        </div>
        <p style="color:#EF4444;font-size:13px;font-weight:600;">⚠️ Changez ce code PIN immédiatement depuis l'application mobile.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#9ca3af;font-size:12px;text-align:center;">© GestionMoMo — Ne pas répondre à cet email</p>
      </div>`,
  });
};

module.exports = { send, sendWelcome, sendPasswordReset, sendPinReset };
