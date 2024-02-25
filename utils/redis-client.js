const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
    constructor() {
        this.client = redis.createClient({
            host: '111.229.200.218',
            port: 6379,
            password: '123456'
        });

        this.client.on('error', function(error) {
            console.error(`Redis error: ${error}`);
        });

        // 将某些Redis函数转换为Promise形式，以便我们可以使用async/await
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.setexAsync = promisify(this.client.setex).bind(this.client);
        this.lpushAsync = promisify(this.client.lpush).bind(this.client);
        this.lrangeAsync = promisify(this.client.lrange).bind(this.client);
        this.rpushAsync = promisify(this.client.rpush).bind(this.client);
        this.lremAsync = promisify(this.client.lrem).bind(this.client);
    }

    async getList(key) {
        const value = await this.lrangeAsync(key,0,-1)
        return value
    }

    async setObject(key, obj) {
        const value = JSON.stringify(obj);
        await this.setAsync(key, value);
    }

    async setexObject(key, time,obj) {
        const value = JSON.stringify(obj);
        await this.setexAsync(key,time, value);
    }

    async getObject(key) {
        const value = await this.getAsync(key);
        return JSON.parse(value);
    }

    async pushToArray(key, value) {
        await this.rpushAsync(key, JSON.stringify(value));
    }

    async removeFromArray(key, value) {
        await this.lremAsync(key, 0, JSON.stringify(value));
    }

    subscribe(channel, callback) {
        const subscriber = this.client.duplicate();
        subscriber.on('message', (channel, message) => {
            callback(JSON.parse(message));
        });
        subscriber.subscribe(channel);
    }

    publish(channel, message) {
        const publisher = this.client.duplicate();
        publisher.publish(channel, JSON.stringify(message));
    }
}

module.exports = new RedisClient();
