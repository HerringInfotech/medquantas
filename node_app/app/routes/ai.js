const express = require('express');
const router = express.Router();
const AiController = require('../controllers/ai');

router.post('/chat', AiController.chat);
router.get('/price-anomalies', AiController.getPriceAnomalies);

module.exports = router;
