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
    let { user } = message
    if(message.type == "createRoom") {
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
            if(!res) {
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            if(roomData.userList.length < 2) {
                // 房间没人
                if(!roomData.userList?.length) {
                    roomData.userList.push({...user,chess:'black'})
                } else {
                    //房间有人
                    if(roomData.userList[0].chess == 'black') {
                        roomData.userList.push({...user,chess:'white'})
                    } else {
                        roomData.userList.push({...user,chess:'black'})
                    }
                }
                roomData.userList.forEach(item => {
                    callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
                })
                redis.setexObject(roomData.roomId,30000,roomData);
            } else {
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已满'},user.id)
            }
        })
    }
}
module.exports = GomokuFun
