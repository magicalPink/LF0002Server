const fs = require('fs');
const checkerboard = require('./checkerboard');

// 读取房间信息
function readRoomData() {
    try {
        const data = fs.readFileSync('roomData.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('读取房间信息出错:', err);
        return [];
    }
}

// 写入房间信息
function writeRoomData(roomData) {
    const jsonData = JSON.stringify(roomData, null, 2);
    try {
        fs.writeFileSync('roomData.json', jsonData, 'utf8');
    } catch (err) {
        console.error('写入房间信息出错:', err);
    }
}

// 创建房间
function createRoom(roomId, name, playerNum, status, currentNum, chatList) {
    let roomData = readRoomData();
    const room = {
        roomId,
        name,
        playerNum,
        status,
        currentNum,
        chatList,
        ending: null,
        lastPiece: {},
        gameList: checkerboard,
        currentUser: 1,
        userList: [],
        steps: [],
    };

    roomData.push(room);
    writeRoomData(roomData);
}

// 删除房间
function deleteRoom(roomId) {
    const roomData = readRoomData();

    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData.splice(index, 1);
        writeRoomData(roomData);
        console.log(`房间 ${roomId} 删除成功`);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

//加入房间
function joinTheRoom(roomId, userInfo, callBack, role) {
    let roomData = readRoomData();
    //把你从之前房间中移除掉
    roomData.forEach(item => item.userList = item.userList.filter(user => user.id !== userInfo.id))
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].userList.forEach(user => callBack({
            type: 'success',
            message: userInfo.nickname + '加入房间'
        }, user.id))
        roomData[index].userList.push({
            id: userInfo.id,
            nickname: userInfo.nickname,
            userName: userInfo.userName,
            ready: role === 1,
            role,
            step: 0,
        });
        // 删除掉没有人的房间
        roomData = roomData.filter((room) => room.userList.length)
        writeRoomData(roomData);
        console.log(`房间 ${roomId} 加入成功`);
    } else {
        console.log(`未找到房间 ${roomId}`);
        callBack({type: 'error', message: '未找到房间'}, userInfo.id)
    }
}

//离开房间
function leaveTheRoom(roomId, userInfo, callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].userList = roomData[index].userList.filter(user => user.id !== userInfo.id);
        roomData[index].userList.forEach(user => {
            // 给房间没有离开的人 黑子 权限 和 默认准备
            user.role = 1;
            user.ready = true;
            callBack({type: 'warning', message: userInfo.nickname + '离开房间'}, user.id)
        })
        // 删除掉没有人的房间
        roomData = roomData.filter((room) => room.userList.length)
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

// setMessage
function setMessage(roomId, userInfo, message) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].chatList.push({
            nickname: userInfo.nickname,
            sendTime: new Date().getTime(),
            userId: userInfo.id,
            message
        });
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

function setReady(roomId, userInfo, ready, callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].userList.forEach(user => {
            if (user.id === userInfo.id) {
                user.ready = ready;
            } else {
                if (ready) {
                    callBack({type: 'success', message: userInfo.nickname + '已经准备啦，可以开始游戏咯'}, user.id)
                } else {
                    callBack({type: 'success', message: userInfo.nickname + '取消准备了'}, user.id)
                }
            }
        })
        roomData[index].userList.forEach(user => callBack({type: 'ready', userList: roomData[index].userList}, user.id))
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

function startGame(roomId, userInfo, callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].status = 1;
        roomData[index].gameList = checkerboard;
        // 轮流开始下棋所以注释下边的
        // roomData[index].currentUser = 1;
        roomData[index].steps = [];
        writeRoomData(roomData);
        roomData[index].userList.forEach(user => callBack({type: 'success', message: '游戏已开始'}, user.id))
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

function drop(info, userInfo, callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === info.roomId);
    if (index !== -1) {
        roomData[index].gameList[info.x][info.y] = info.role;
        roomData[index].lastPiece = info
        roomData[index].currentUser = info.role == 1 ? 0 : 1;
        roomData[index].steps.push({x: info.x, y: info.y, role: info.role});
        let ending = checkWin(roomData[index].gameList);
        if(ending !== -1) {
            console.log(ending)
            roomData[index].status = 2;
            roomData[index].ending = ending;
            roomData[index].userList.forEach(user => callBack({type: 'gameOver', ending}, user.id))
        }
        roomData[index].userList.forEach(user => callBack({type: 'drop', info:roomData[index].lastPiece}, user.id))
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${info.roomId}`);
    }

}

function checkWin(gameList) {
    const directions = [
        [0, 1],  // 右
        [1, 0],  // 下
        [1, 1],  // 右下
        [1, -1]  // 左下
    ];

    for (let row = 0; row < 15; row++) {
        for (let col = 0; col < 15; col++) {
            const currentRole = gameList[row][col];

            if (currentRole !== 9) {
                for (const [dx, dy] of directions) {
                    let count = 1;

                    // 向正方向延伸
                    let i = 1;
                    while (row + i * dx >= 0 && row + i * dx < 15 && col + i * dy >= 0 && col + i * dy < 15 &&
                    gameList[row + i * dx][col + i * dy] === currentRole) {
                        count++;
                        i++;
                    }

                    // 向负方向延伸
                    i = 1;
                    while (row - i * dx >= 0 && row - i * dx < 15 && col - i * dy >= 0 && col - i * dy < 15 &&
                    gameList[row - i * dx][col - i * dy] === currentRole) {
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

function giveUp(roomId, userInfo,role, callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].status = 2;
        roomData[index].ending = role === 1 ? 0 : 1;
        roomData[index].userList.forEach(user => callBack({type: 'gameOver', ending: roomData[index].ending}, user.id))
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

function regret(roomId, userInfo,consent, callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        if(consent) {
            const lastStep = roomData[index].steps.pop();
            roomData[index].gameList[lastStep.x][lastStep.y] = 9;
            roomData[index].currentUser = lastStep.role;
            roomData[index].lastPiece = roomData[index].steps[roomData[index].steps.length - 1] || {};
            roomData[index].userList.forEach(user => {
                if(user.id !== userInfo.id) {
                    callBack({type: 'success', message: '对方同意你的悔棋'}, user.id)
                }
                callBack({type: 'regretTrue', roomData: {
                    gameList: roomData[index].gameList,
                    currentUser: roomData[index].currentUser,
                    lastPiece: roomData[index].lastPiece,
                }}, user.id)
            })
        } else {
            roomData[index].userList.forEach(user => {
                if(user.id !== userInfo.id) {
                    callBack({type: 'error', message: '对方拒绝你的悔棋'}, user.id)
                }
            })
        }
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}


// 导出方法
module.exports = {
    readRoomData,
    writeRoomData,
    createRoom,
    deleteRoom,
    joinTheRoom,
    leaveTheRoom,
    setMessage,
    setReady,
    startGame,
    drop,
    giveUp,
    regret
};
