var express = require('express');
var router = express.Router();
var adminMiddleware = require('../middlewares/admin');
var accessMiddleware = require('../middlewares/accessMiddleware');

router.post('/login', adminMiddleware.login);

router.post('/logout', accessMiddleware.adminAuth, adminMiddleware.logout);

router.post('/create', accessMiddleware.adminAuth, adminMiddleware.createNewAdmin);

router.get('/statistic', accessMiddleware.adminAuth, adminMiddleware.getStatistic);

router.get('/userdata', accessMiddleware.adminAuth, adminMiddleware.getUserInfo);

router.get('/machine', accessMiddleware.adminAuth, adminMiddleware.getMachineInfo);

router.delete('/deleteuser', accessMiddleware.adminAuth, adminMiddleware.deleteUser);

router.delete('/deletemac', accessMiddleware.adminAuth, adminMiddleware.deleteMachine);

module.exports = router;