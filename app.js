//导入  express 模块
const express = require('express');
const path = require('path');
//导入 cors 模块
const cors = require('cors');
const config = require('./config')
const expressJWT = require('express-jwt')
//创建 express 实例
const app = express();
// 导入nodejs-websocket模块
const wsServer = require('./socket/baseSocket/socket')
//在线用户方法
const onlineUser = require('./utils/onlineUser-redis');
const redis = require('./utils/redis-client');

//使用 cors 中间件
app.use(cors());
app.use(expressJWT({ secret: config.jwtSecretKey }).unless({ path: [/^\/api\//] }))
//配置解析表单数据
app.use(express.urlencoded({ extended: false }));
//配置解析json数据
app.use(express.json());
// 验证token
app.use(/^(?!\/api).*$/, (req, res, next) => {
    if (req.user) {
        redis.getAsync(req.user.id).then((token) => {
            if (token !== req.headers.authorization) {
                res.status(401).send({status: 9, message: '账号已被他人登录，断开连接！'});
            } else {
                next();
            }
        });
    } else {
        next();
    }
});

//捕获未授权的错误
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({ status: 9, message: '当前登录已过期，请重新登录！' })
    }
})

//配置全局错误处理中间件
app.use((req,res,next) => {
    res.cc = function(err,status = 1) {
        res.send({
            status,
            message: err instanceof Error ? err.message : err
        })
    }
    next()
})

//导入路由模块
const userRouter = require('./router/user');
const userInfoRouter = require('./router/userinfo');
const routerInfo = require('./router/router')

//挂载路由
app.use('/api', userRouter);
app.use('/info', userInfoRouter);
app.use('/router', routerInfo);
//设置静态资源路径
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

//定时任务 删除过期用户
setInterval(() => {
    onlineUser.deletingExpiredUsers()
},30000)

// 监听指定端口
wsServer.listen(3001, () => {
    console.log('socket基础服务启动成功，端口号为：3001')
})
//调用app.listen方法，指定端口号并启动web服务器
app.listen(3000, function () {
    console.log('Express server running at http://localhost:3000');
})
