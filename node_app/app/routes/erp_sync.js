const express = require('express');
const router = express.Router();
const ErpSyncController = require('../controllers/erp_sync');

// Item Master — form submit
router.post('/update_item_master', ErpSyncController.update_item_master);
router.post('/get_item_master',    ErpSyncController.get_item_master);

// Price Master — form submit
router.post('/update_price_master', ErpSyncController.update_price_master);
router.post('/get_price_master',    ErpSyncController.get_price_master);

// Item Sync — ERP Sync Now
router.post('/save_item_sync', ErpSyncController.save_item_sync);
router.post('/get_item_sync',  ErpSyncController.get_item_sync);

// Price Sync — ERP Sync Now
router.post('/save_price_sync', ErpSyncController.save_price_sync);
router.post('/get_price_sync',  ErpSyncController.get_price_sync);

module.exports = router;
