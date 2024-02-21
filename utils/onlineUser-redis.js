const redis = require('./redis-client');

const onlineUser = {
    //获取在线列表
    async getList() {
        const value = await redis.getList('onlineUsers')
        return value.map(item => JSON.parse(item))
    },
    //添加用户
    async addUser(user) {
        let List = await this.getList()
        index = List.findIndex(u => u.id === user.id);
        if(index !== -1) {
            let oldUser = List[index]
            redis.removeFromArray('onlineUsers',oldUser)
        }
        redis.pushToArray('onlineUsers', {...user,expirationTime: Date.now() + 10000})
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
