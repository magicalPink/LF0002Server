const express = require('express');
const router = express.Router();
const userHandler = require('../router_handler/userinfo');
router.get('/userinfo', userHandler.getUserInfo);
router.post('/setnickname', userHandler.setNickname);
router.post('/setavatar', userHandler.setAvatar);
router.get('/getonlinelist', userHandler.getOnlineList);
module.exports = router;
