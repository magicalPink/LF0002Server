const io = require('nodejs-websocket')
const jwt = require('jsonwebtoken');
const config = require('./config');
const roomUtils = require('./roomUtils');
// 在线用户列表
let onlineUsers = [];
// 创建一个 WebSocket 服务
const wsServer = io.createServer(function (conn) {
    // 解析连接的查询参数
    const token = conn.path.split('?')[1].split('=')[1].split('%20')[1];
    console.log(token);

    // 根据 token 进行用户身份验证，识别连接的用户
    jwt.verify(token, config.jwtSecretKey, (err, decoded) => {
        if (err) {
            // JWT 验证失败
            console.error('JWT 验证失败:', err);
            return;
        }

        // JWT 验证成功，decoded 对象包含解析后的 JWT 数据
        console.log('解析后的 JWT 数据:', decoded);

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

        // 广播当前在线用户列表
        broadcastMessage({ type: 'online', onlineUsers: onlineUsers.map(u => u.nickname) });
        // 广播房间列表
        broadcastMessage({ type: 'roomList', roomList: roomUtils.readRoomData() });
        // 广播用户上线消息
        broadcastMessage({ type: 'join', user: user.nickname });

        // 接收到用户发送的消息
        conn.on('text', (data) => {
            console.log('接收到用户发送的消息:', data);
            let message = JSON.parse(data);
            console.log(message)
            if (message.type === 'createRoom') {
                let id = new Date().getTime();
                roomUtils.createRoom(id, user.nickname + '的房间', 2, 0, 0, []);
                roomUtils.joinTheRoom(id, decoded,broadcastMessageById,1);
                broadcastMessage({ type: 'roomList', roomId: id, roomList: roomUtils.readRoomData() });
            }
            if (message.type === 'joinRoom') {
                roomUtils.joinTheRoom(message.roomId, decoded,broadcastMessageById,0);
                broadcastMessage({ type: 'roomList', roomId: message.roomId, roomList: roomUtils.readRoomData() });
            }
            if (message.type === 'leaveRoom') {
                roomUtils.leaveTheRoom(message.roomId, decoded,broadcastMessageById);
                broadcastMessage({ type: 'roomList', roomId: message.roomId, roomList: roomUtils.readRoomData() });
            }
            if(message.type === 'message') {
                roomUtils.setMessage(message.roomId, decoded, message.message);
                let room = roomUtils.readRoomData().find(room => room.roomId === message.roomId);
                room.userList.forEach(user => broadcastMessageById({type:'chatList',chatList:room.chatList},user.id))
                // broadcastMessage({ type: 'chatList', roomId: message.roomId, roomList: roomUtils.readRoomData() });
            }
            if(message.type === 'ready') {
                roomUtils.setReady(message.roomId, decoded,true,broadcastMessageById);
                broadcastMessage({ type: 'roomList', roomId: message.roomId, roomList: roomUtils.readRoomData() });
            }
            if(message.type === 'unready') {
                roomUtils.setReady(message.roomId, decoded,false,broadcastMessageById);
                broadcastMessage({ type: 'roomList', roomId: message.roomId, roomList: roomUtils.readRoomData() });
            }
            if(message.type === 'startGame') {
                roomUtils.startGame(message.roomId, decoded,broadcastMessageById);
                broadcastMessage({ type: 'message', roomId: message.roomId, roomList: roomUtils.readRoomData() });
            }
            if(message.type === 'drop') {
                roomUtils.drop(message.info, decoded,broadcastMessageById);
            }
            if(message.type === 'remind') {
                let room = roomUtils.readRoomData().find(room => room.roomId === message.roomId);
                room.userList.forEach(user => {
                    if(user.id !== decoded.id) {
                        broadcastMessageById({type:'warning',message:'花都等谢了，麻溜的下！'},user.id)
                    }
                })
            }
            if(message.type === 'giveUp') {
                roomUtils.giveUp(message.roomId, decoded,message.role,broadcastMessageById);
            }
        })
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


