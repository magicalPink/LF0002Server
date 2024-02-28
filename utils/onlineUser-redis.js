const redis = require('./redis-client');

const onlineUser = {
    //获取在线列表
    async getList() {
        const value = await redis.getList('onlineUsers')
        return value.map(item => JSON.parse(item))
    },
    //获取在线列表
    async getUser(id) {
        const value = await this.getList()
        return value.find(item => item.id === id)
    },
    //修改用户状态
    async setUserState(user,state) {
        let List = await this.getList()
        index = List.findIndex(u => u.id === user.id);
        if(index !== -1) {
            let oldUser = List[index]
            redis.removeFromArray('onlineUsers',oldUser)
        }
        let newUser = {
            ...user,
            expirationTime: Date.now() + 60000,
            state,
        }
        redis.pushToArray('onlineUsers', newUser)
    },
    //添加用户
    async addUser(user) {
        let List = await this.getList()
        index = List.findIndex(u => u.id === user.id);
        let oldUser = List[index]
        if(index !== -1) {
            redis.removeFromArray('onlineUsers',oldUser)
        }
        //继承老用户状态
        let newUser = {
            ...user,
            expirationTime: Date.now() + 60000,
            state:oldUser?.state,
        }
        redis.pushToArray('onlineUsers', newUser)
    },
    //删除过期用户
    async deletingExpiredUsers() {
        let List = await this.getList()
        for (let i = 0; i < List.length; i++) {
            if(List[i].expirationTime < Date.now()) {
                console.log('过期：',List[i])
                redis.removeFromArray('onlineUsers',List[i])
            }
        }
    }
}

module.exports = onlineUser
