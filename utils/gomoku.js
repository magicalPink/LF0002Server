const redis = require('./redis-client');
const chessboard = [
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
]
const GomokuFun = (message,callback) => {
    console.log(message)
    if(message.type == "createRoom") {
        let { user } = message
        const roomId = 'Gomoku:' + Math.floor(Math.random() * (90001 - 10000 + 1) + 10000);
        let roomData = {
            roomId,
            roomName:user.nickname + '的五子棋',
            currentUser:user.id,
            userList:[
                {...user,chess:'black'}
            ],
            roomStatus:'noStart',//1 noStart 2 start 3 over
            winUser:null,
            chessboard,
        }
        redis.setexObject(roomId,30000,roomData);
        callback({Game:'Gomoku',type:'roomData',...roomData},user.id)
    }
    if(message.type == "joinRoom") {
        redis.getAsync('Gomoku:' + message.roomId).then(res => {
            let roomData = JSON.parse(res)
            if(roomData.userList.length < 2) {
                roomData.userList.push()
            }
            console.log(data)
        })
    }
}
module.exports = GomokuFun