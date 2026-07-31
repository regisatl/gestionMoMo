/**
 * Règles de validation — GestionMoMo Mobile
 *
 * Format téléphone béninois : +229 01 XX XX XX XX
 *   +229  : indicatif Bénin
 *   01    : préfixe obligatoire
 *   XXXXXXXX : 8 chiffres libres
 *   Longueur totale : 13 caractères
 *
 * Exemples valides   : +22901234567890  ✗  (trop long)
 *                      +2290112345678   ✓
 *                      +2290198765432   ✓
 * Exemples invalides : +22900123456789  ✗  (01 absent)
 *                      +2291012345678   ✗  (229 1... pas 229 01...)
 */

/** Regex du numéro béninois */
export const BENIN_PHONE_REGEX = /^\+22901\d{8}$/;

/**
 * Valide un numéro béninois.
 * @param {string} phone
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateBeninPhone = (phone) => {
  const cleaned = (phone || '').trim();
  if (!cleaned) {
    return { valid: false, error: 'Numéro de téléphone requis' };
  }
  if (!BENIN_PHONE_REGEX.test(cleaned)) {
    return {
      valid: false,
      error: 'Format invalide — ex : +2290112345678',
    };
  }
  return { valid: true, error: null };
};

/**
 * Formate un numéro pour l'affichage : +2290112345678 → +229 01 12 34 56 78
 * @param {string} phone
 * @returns {string}
 */
export const formatBeninPhone = (phone) => {
  const cleaned = (phone || '').replace(/\s/g, '');
  if (!BENIN_PHONE_REGEX.test(cleaned)) return phone;
  // +229 01 XX XX XX XX
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)} ${cleaned.slice(12)}`;
};
