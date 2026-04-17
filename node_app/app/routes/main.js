const express = require('express');
const router = express.Router();
const MainController = require('../controllers/main');

router.post('/update_bom', MainController.update_bom);
router.post('/get_bom', MainController.get_bom);

router.post('/update_sheet', MainController.update_sheet);
router.post('/get_sheet', MainController.get_sheet);



router.post('/fetch_bom', MainController.fetch_bom);


router.post('/update_brand', MainController.update_brand);
router.post('/get_brand', MainController.get_brand);
router.post('/delete_brand', MainController.delete_brand);


router.post('/get_error', MainController.get_error);
router.post('/get_view', MainController.get_view);

router.post('/brand_code', MainController.brand_code);
router.post('/brand_name', MainController.brand_name);
router.post('/brand_name_suggestions', MainController.brand_name_suggestions);
router.post('/get_fg_by_id', MainController.get_fg_by_id);

router.post('/get_report', MainController.get_report);
router.post('/send_daily_reports', MainController.send_daily_reports);
router.post('/run_backup', MainController.run_backup);

router.post('/get_dashboard_metrics', MainController.get_dashboard_metrics);
router.post('/upload_file', MainController.upload_file);
router.post('/get_unique_locations', MainController.get_unique_locations);
router.post('/get_unique_currencies', MainController.get_unique_currencies);
router.post('/update_setting', MainController.update_setting);
router.post('/get_setting', MainController.get_setting);
router.post('/get_email_logs', MainController.get_email_logs);


router.post('/generate_code', MainController.generate_code);

router.post('/fG_sapcode', MainController.fG_sapcode);

router.post('/export_item', MainController.export_item);
router.post('/export_log', MainController.export_log);
router.post('/export_fgmaster', MainController.export_fgmaster);
router.post('/export_supplier', MainController.export_supplier);
router.post('/export_customer', MainController.export_customer);
router.post('/export_make', MainController.export_make);
router.post('/update_sale_sheet', MainController.update_sale_sheet);
router.post('/get_sale_sheet', MainController.get_sale_sheet);



module.exports = router;