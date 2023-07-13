//导入  express 模块
const express = require('express');
//导入 cors 模块
const cors = require('cors');
const config = require('./config')
const expressJWT = require('express-jwt')
//创建 express 实例
const app = express();
// 创建一个websocket服务
// const server = require('http').createServer(app)
// 导入nodejs-websocket模块
const wsServer = require('./socket')

//使用 cors 中间件
app.use(cors());
app.use(expressJWT({ secret: config.jwtSecretKey }).unless({ path: [/^\/api\//] }))
//配置解析表单数据
app.use(express.urlencoded({ extended: false }));
//配置解析json数据
app.use(express.json());
//捕获未授权的错误
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({ status: 9, message: '身份认证失败！' })
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

// 监听指定端口
wsServer.listen(3001, () => {
    console.log('websocket服务启动成功，端口号为：3000')
})
//调用app.listen方法，指定端口号并启动web服务器
app.listen(3000, function () {
    console.log('Express server running at http://localhost:3000');
})
