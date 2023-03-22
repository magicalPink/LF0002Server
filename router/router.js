const express = require('express');
const router = express.Router();
const routerHandler = require('../router_handler/router');
//获取路由
router.get('/getList', routerHandler.getRouter);
//添加路由
router.post('/addRouter', routerHandler.addRouter);


module.exports = router;