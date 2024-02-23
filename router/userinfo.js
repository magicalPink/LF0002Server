const express = require('express');
const router = express.Router();
const userHandler = require('../router_handler/userinfo');
router.get('/userinfo', userHandler.getUserInfo);
router.post('/setNickname', userHandler.setNickname);
router.post('/setAvatar', userHandler.setAvatar);
router.get('/getOnlineList', userHandler.getOnlineList);
module.exports = router;
