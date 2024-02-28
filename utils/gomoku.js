const redis = require('./redis-client');
const onlineUser = require('./onlineUser-redis');
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
    //创建房间
    if(message.type == "createRoom") {
        const roomId = 'Gomoku:' + Math.floor(Math.random() * (90001 - 10000 + 1) + 10000);
        let roomData = {
            roomId,
            roomName:user.nickname + '的五子棋',
            currentUser:null,
            userList:[
                {...user,chess:'black',ready:false}
            ],
            roomStatus:'noStart',//1 noStart 2 start 3 over
            winUser:null,
            chessboard,
        }
        callback({Game:'Gomoku',type:'roomData',...roomData},user.id)
        redis.setexObject(roomId,3000,roomData);
        onlineUser.setUserState(user,'Gomoku')
    }
    //加入房间
    if(message.type == "joinRoom") {
        redis.getAsync('Gomoku:' + message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            if(roomData.userList.length < 2) {
                // 房间没人
                if(!roomData.userList?.length) {
                    roomData.userList.push({...user,chess:'black',ready:false})
                } else {
                    //房间有人
                    if(roomData.userList[0].chess == 'black') {
                        roomData.userList.push({...user,chess:'white',ready:false})
                    } else {
                        roomData.userList.push({...user,chess:'black',ready:false})
                    }
                }
                roomData.userList.forEach(item => {
                    callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
                })
                redis.setexObject(roomData.roomId,3000,roomData);
                onlineUser.setUserState(user,'Gomoku')
            } else {
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已满'},user.id)
            }
        })
    }

    //离开房间
    if(message.type == "leave") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            roomData.userList = roomData.userList.filter(item => item.id !== user.id)
            onlineUser.setUserState(user)
            callback({Game:'Gomoku',type:'leave'},user.id)
            if(!roomData.userList.length) {
                redis.setexObject(roomData.roomId,1,roomData);
            } else {
                callback({Game:'Gomoku',type:'roomData',...roomData},roomData.userList[0].id)
                redis.setexObject(roomData.roomId,3000,roomData);
            }
        })
    }

    //邀请
    if(message.type == "invite") {
        onlineUser.getUser(message.inviteUserId).then(res => {
            if(res) {
                //用户在线
                if(!res.state) {
                    callback({Game:'Gomoku',type:'invite',roomId:message.roomId,message:user.nickname + '邀请你加入他的五子棋对局'},message.inviteUserId)
                } else {
                    callback({Game:'Gomoku',type:'errorMessage',message:'用户在游戏中'},user.id)
                }
            } else {
                //用户离线
                callback({Game:'Gomoku',type:'errorMessage',message:'用户已离线'},user.id)
            }
            console.log(res)
        })
    }

    //开始游戏
    if(message.type == "start") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            roomData.userList.forEach(item => {
                if(item.id == user.id) {
                    item.ready = true
                }
            })

            if(roomData.userList.length > 1 && roomData.userList[0].ready && roomData.userList[1].ready) {
                roomData.roomStatus = 'start'
                if(roomData.userList[0].chess == "black") {
                    roomData.currentUser = roomData.userList[0].id
                } else {
                    roomData.currentUser = roomData.userList[1].id
                }
            }

            roomData.userList.forEach(item => {
                callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
            })
            redis.setexObject(roomData.roomId,3000,roomData);
        })
    }

    //开始游戏
    if(message.type == "drop") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            //空格
            if(roomData.chessboard[message.drop.x][message.drop.y] === 9) {
                roomData.chessboard[message.drop.x][message.drop.y] = message.drop.chess
                roomData.currentUser = message.opponentId
                redis.setexObject(roomData.roomId,3000,roomData);
                roomData.userList.forEach(item => {
                    callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
                })
            }
        })
    }
}

module.exports = GomokuFun
