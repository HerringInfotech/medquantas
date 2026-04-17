const express = require('express');
const router = express.Router();
const MasterController = require('../controllers/master');

router.post('/update_role', MasterController.update_role);
router.post('/get_role', MasterController.get_role);

router.post('/update_module', MasterController.update_module);
router.post('/get_module', MasterController.get_module);
router.post('/delete_module', MasterController.delete_module);

router.post('/update_conversion', MasterController.update_conversion);
router.post('/get_conversion', MasterController.get_conversion);
router.post('/delete_conversion', MasterController.delete_conversion);

router.post('/get_packing', MasterController.get_packing);
router.post('/delete_packing', MasterController.delete_packing);



router.post('/update_role_master', MasterController.update_role_master);
router.post('/get_role_master', MasterController.get_role_master);
router.post('/create_role', MasterController.create_role);
router.post('/check_role', MasterController.check_role);


router.post('/update_pack', MasterController.update_pack);
router.post('/get_pack', MasterController.get_pack);
router.post('/delete_pack', MasterController.delete_pack);

router.post('/update_stage', MasterController.update_stage);
router.post('/get_stage', MasterController.get_stage);
router.post('/delete_stage', MasterController.delete_stage);


router.post('/update_item', MasterController.update_item);
router.post('/delete_item', MasterController.delete_item);

router.post('/update_customer', MasterController.update_customer);
router.post('/get_customer', MasterController.get_customer);
router.post('/delete_customer', MasterController.delete_customer);

router.post('/get_unit', MasterController.get_unit);
router.post('/update_unit', MasterController.update_unit);
router.post('/delete_unit', MasterController.delete_unit);

router.post('/get_bomType', MasterController.get_bomType);
router.post('/update_bomType', MasterController.update_bomType);

router.post('/customer_code', MasterController.customer_code);
router.post('/vendor_code', MasterController.vendor_code);




router.post('/get_item', MasterController.get_item);
router.post('/get_item_suggestions', MasterController.get_item_suggestions);

router.post('/get_conversion_factor', MasterController.get_conversion_factor);
router.post('/update_conversion_factor', MasterController.update_conversion_factor);

router.post('/update_rate', MasterController.update_rate);
router.post('/update_group', MasterController.update_group);
router.post('/check_price', MasterController.check_price);
router.post('/get_rate', MasterController.get_rate);
router.post('/get_group', MasterController.get_group);
router.post('/delete_rate', MasterController.delete_rate);

router.post('/pack_code', MasterController.pack_code);
router.post('/customer_sapcode', MasterController.customer_sapcode);
router.post('/get_erb_logs', MasterController.get_erb_logs);







router.post('/update_itemtype', MasterController.update_itemtype);
router.post('/get_itemtype', MasterController.get_itemtype);
router.post('/delete_itemtype', MasterController.delete_itemtype);

router.post('/get_subtype', MasterController.get_subtype);

router.post('/get_price_logs', MasterController.get_price_log);
router.post('/get_bulk_rate', MasterController.get_bulk_rate);



// router.post('/get_price_logs', MasterController.get_price_log);






module.exports = router;