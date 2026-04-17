const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migration');



router.post('/migration_log', migrationController.migration_log);
router.post('/manual_trigger', migrationController.manual_trigger);
router.post('/update_bom_code', migrationController.update_bom_code);

module.exports = router;
