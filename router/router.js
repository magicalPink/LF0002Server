const express = require('express');
const router = express.Router();
const routerHandler = require('../router_handler/router');
//获取路由
router.get('/getList', routerHandler.getRouter);
//获取菜单列表
router.get('/getMenuList', routerHandler.getMenuList);
//添加路由
router.post('/addRouter', routerHandler.addRouter);
//删除路由
router.get('/deleteRouter', routerHandler.deleteRouter);


module.exports = router;
