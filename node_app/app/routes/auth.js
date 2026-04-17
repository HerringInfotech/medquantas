const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');
const ActivityLogController = require('../controllers/activityLog');

router.post('/sign_in',AuthController.sign_in);
router.post('/sign_up',AuthController.sign_up);
router.post('/forgotpassword',AuthController.forgotpassword);
router.post('/change_password',AuthController.change_password);
router.post('/speed',AuthController.speed);
router.post('/get_user',AuthController.get_user);
router.post('/update_user',AuthController.update_user);
router.post('/change_status',AuthController.change_status);
router.post('/send_mail',AuthController.send_mail);
router.post('/send_costsheet',AuthController.send_costsheet);

// User Activity Logs
router.post('/get_activity_logs', ActivityLogController.get_activity_logs);
router.post('/log_activity', ActivityLogController.log_activity);
router.post('/get_activity_summary', ActivityLogController.get_activity_summary);

module.exports = router;