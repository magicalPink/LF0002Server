const fs = require('fs');

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
function createRoom(roomId, name, playerNum, status, currentNum, chatList, gameList) {
    let roomData = readRoomData();
    const room = {
        roomId,
        name,
        playerNum,
        status,
        currentNum,
        chatList,
        gameList,
        userList: [],
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
function joinTheRoom(roomId, userInfo,callBack) {
    let roomData = readRoomData();
    //把你从之前房间中移除掉
    roomData.forEach(item => item.userList = item.userList.filter(user => user.id !== userInfo.id))
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].userList.forEach(user => callBack({type:'joinRoom',message:userInfo.nickname + '加入房间'},user.id))
        roomData[index].userList.push(userInfo);
        // 删除掉没有人的房间
        roomData = roomData.filter((room) => room.userList.length)
        writeRoomData(roomData);
        console.log(`房间 ${roomId} 加入成功`);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

//离开房间
function leaveTheRoom(roomId, userInfo,callBack) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].userList = roomData[index].userList.filter(user => user.id !== userInfo.id);
        roomData[index].userList.forEach(user => callBack({type:'leaveRoom',message:userInfo.nickname + '离开房间'},user.id))
        // 删除掉没有人的房间
        roomData = roomData.filter((room) => room.userList.length)
        writeRoomData(roomData);
    } else {
        console.log(`未找到房间 ${roomId}`);
    }
}

// setMessage
function setMessage(roomId,userInfo, message) {
    let roomData = readRoomData();
    const index = roomData.findIndex((room) => room.roomId === roomId);
    if (index !== -1) {
        roomData[index].chatList.push({nickname:userInfo.nickname,sendTime:new Date().getTime(),userId:userInfo.id,message});
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
    setMessage
};
