const express = require('express');
const router = express.Router();
const bulkUpdateController = require('../controllers/bulk_update');

router.post('/price_upload', bulkUpdateController.price_upload);
router.post('/percentage_bom_upload', bulkUpdateController.percentage_bom_upload);
router.post('/import_data', bulkUpdateController.import_data);





module.exports = router;