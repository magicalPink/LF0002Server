const express = require('express');
const router = express.Router();
const userHandler = require('../router_handler/userinfo');
router.get('/userinfo', userHandler.getUserInfo);
module.exports = router;
