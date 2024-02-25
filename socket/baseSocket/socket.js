const io = require('nodejs-websocket')
const jwt = require('jsonwebtoken');
const config = require('../../config');
const onlineUser = require('../../utils/onlineUser-redis');
const db = require("../../db");
const GomokuFun = require("../../utils/gomoku")
// 在线用户列表
let onlineUsers = [];
// 创建一个 WebSocket 服务
const wsServer = io.createServer(function (conn) {
    // 查询sql
    const sql = `SELECT * FROM users WHERE id = ?`
    // 解析连接的查询参数
    const token = conn.path.split('?')[1]?.split('=')[1].split('%20')[1];

    if(!token) return;
    // 根据 token 进行用户身份验证，识别连接的用户
    jwt.verify(token, config.jwtSecretKey, (err, decoded) => {
        if (err) {
            // JWT 验证失败
            return;
        }
        // 将用户添加到在线用户列表
        const user = {
            id: decoded.id,
            username: decoded.username,
            nickname: decoded.nickname,
            connection: conn, // 连接对象
            loginTime: Date.now(), // 登录时间
        };
        onlineUsers = onlineUsers.filter(u => u.id !== user.id);
        onlineUsers.push(user);
        db.query(sql, user.id, (err, results) => {
            onlineUser.addUser(results[0])
        })
        // 接收到用户发送的消息
        conn.on('text', (data) => {
            let message = JSON.parse(data);
            if(message.type === "ping") {
                console.log('pingId：',decoded.id)
                db.query(sql, user.id, (err, results) => {
                    onlineUser.addUser(results[0])
                })
                broadcastMessageById({ping:"心跳"},user.id)
            }
            if(message.Game) {
                //五子棋
                if(message.Game === "Gomoku") {
                    GomokuFun(message,broadcastMessageById)
                }
            }
        });

        // 当连接断开时从在线用户列表中移除
        conn.on('close', () => {
            const index = onlineUsers.findIndex(u => u.id === user.id);
            if (index !== -1) {
                onlineUsers.splice(index, 1);
                console.log(`用户 ${user.username} 已断开连接`);
            }
        });

        // 错误处理
        conn.on('error', (err) => {
            if (err.code === 'ECONNRESET') {
                console.error('连接重置错误:', err);
                // 进行适当的处理
            } else {
                // 其他错误处理逻辑
            }
        });
    });
    // 当连接断开时从在线用户列表中移除
    conn.on('close', () => {
        console.log('close')
    });

    // 错误处理
    conn.on('error', (err) => {
        if (err.code === 'ECONNRESET') {
            console.error('连接重置错误:', err);
            // 进行适当的处理
        } else {
            // 其他错误处理逻辑
        }
    });
});

// 广播消息给所有在线用户
function broadcastMessage(message) {
    const messageJson = JSON.stringify(message);
    onlineUsers.forEach(user => {
        user.connection.sendText(messageJson);
    });
}

//指定ID广播
function broadcastMessageById(message, id) {
    const messageJson = JSON.stringify(message);
    onlineUsers.forEach(user => {
        if (user.id === id) {
            user.connection.sendText(messageJson);
        }
    });
}
//导出
module.exports = wsServer;


