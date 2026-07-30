const express = require('express');
const router = express.Router();
const momoController = require('../controllers/momoController');

// Callbacks MTN MoMo — pas d'authentification JWT (appel externe)
// La sécurité est assurée par validation de signature ou IP whitelisting
router.post('/callback/collection', momoController.collectionCallback);
router.post('/callback/disbursement', momoController.disbursementCallback);
router.post('/callback/remittance', momoController.remittanceCallback);

module.exports = router;
