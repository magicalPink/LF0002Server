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

function checkWin(chessboard) {
    const directions = [
        [0, 1],  // 右
        [1, 0],  // 下
        [1, 1],  // 右下
        [1, -1]  // 左下
    ];

    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            const currentRole = chessboard[row][col];

            if (currentRole !== 9) {
                for (const [dx, dy] of directions) {
                    let count = 1;

                    // 向正方向延伸
                    let i = 1;
                    while (row + i * dx >= 0 && row + i * dx < 15 && col + i * dy >= 0 && col + i * dy < 15 &&
                    chessboard[row + i * dx][col + i * dy] === currentRole) {
                        count++;
                        i++;
                    }

                    // 向负方向延伸
                    i = 1;
                    while (row - i * dx >= 0 && row - i * dx < 15 && col - i * dy >= 0 && col - i * dy < 15 &&
                    chessboard[row - i * dx][col - i * dy] === currentRole) {
                        count++;
                        i++;
                    }

                    if (count >= 5) {
                        return currentRole; // 返回胜利的玩家角色
                    }
                }
            }
        }
    }

    return -1; // 没有玩家获胜
}

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
            steps:[],
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
                    if(item.id != user.id) {
                        callback({Game:'Gomoku',type:'message',message:user.nickname + '进入房间'},item.id)
                    }
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
                //删除房间
                redis.setexObject(roomData.roomId,1,roomData);
            } else {
                roomData.roomStatus = 'over'
                roomData.userList.forEach(item => {
                    item.ready = false
                    callback({Game:'Gomoku',type:'message',message:'游戏结束'},item.id)
                })
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

    //认输
    if(message.type == "giveUp") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            roomData.roomStatus = 'over'
            roomData.userList.forEach(item => {
                item.ready = false
                if(item.id == user.id) {
                    callback({Game:'Gomoku',type:'message',message:'您认输了'},item.id)
                    callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
                } else {
                    callback({Game:'Gomoku',type:'message',message:'对手认输了，您胜利了'},item.id)
                    callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
                }
            })
            redis.setexObject(roomData.roomId,3000,roomData);
        })
    }

    //申请悔棋
    if(message.type == "applyForRegret") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            if(!roomData.steps.length) {
                return callback({Game:'Gomoku',type:'errorMessage',message:'申请悔棋失败'},user.id)
            }
            if(roomData.steps[roomData.steps.length - 1].chess !== message.chess) {
                return callback({Game:'Gomoku',type:'errorMessage',message:'不是您的回合，悔棋失败'},user.id)
            }
            return callback({Game:'Gomoku',type:'regret',message:user.nickname + '申请悔棋'},message.opponentId)
        })
    }

    //同意悔棋
    if(message.type == "regret") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            let chess = roomData.steps.pop()
            roomData.chessboard[chess.x][chess.y] = 9;
            roomData.currentUser = message.opponentId
            roomData.userList.forEach(item => {
                callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
            })
            redis.setexObject(roomData.roomId,3000,roomData);
        })
    }

    //拒绝悔棋
    if(message.type == "disagreeRegret") {
        return callback({Game:'Gomoku',type:'message',message:'对方拒绝了您的悔棋申请'},message.opponentId)
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
                roomData.chessboard = chessboard
                roomData.steps = []
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

    //下棋
    if(message.type == "drop") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            if(roomData.chessboard[message.drop.x][message.drop.y] === 9) {
                roomData.chessboard[message.drop.x][message.drop.y] = message.drop.chess
                roomData.currentUser = message.opponentId
                roomData.steps.push({x: message.drop.x, y: message.drop.y, chess: message.drop.chess})
                let win = checkWin(roomData.chessboard)
                //游戏结束
                if(win !== -1) {
                    roomData.roomStatus = "over"
                    roomData.userList.forEach(item => {
                        item.ready = false
                        callback({Game:'Gomoku',type:'message',message:'游戏结束' + (win == 'black') ? '黑棋胜' : '白棋胜'},item.id)
                    })
                }
                redis.setexObject(roomData.roomId,3000,roomData);
                roomData.userList.forEach(item => {
                    callback({Game:'Gomoku',type:'roomData',...roomData},item.id)
                })
            }
        })
    }

    //表情
    if(message.type == "meme") {
        redis.getAsync(message.roomId).then(res => {
            if(!res) {
                onlineUser.setUserState(user)
                return callback({Game:'Gomoku',type:'errorMessage',message:'房间已失效'},user.id)
            }
            let roomData = JSON.parse(res)
            roomData.userList.forEach(item => {
                callback({Game:'Gomoku',type:'meme',memeData:{userId:user.id,memeIndex:message.memeIndex}},item.id)
            })
        })
    }
}

module.exports = GomokuFun
