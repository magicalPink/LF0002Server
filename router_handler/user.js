const db = require('../db/index')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const tokenStr = require('../config')
const redis = require('../utils/redis-client');

// 查询sql
const searchNameSql = `SELECT * FROM users WHERE username = ?`
// 插入数据sql
const addUserSql = `INSERT INTO users SET ?`
//注册
exports.regUser = (req, res) => {
    const userInfo = req.body
    userInfo.avatar = '/image/avatar/avatar1.png'
    console.log(userInfo)
    if (!userInfo.username || !userInfo.password) {
        // return res.send({ status: 1, message: '用户名或密码不能为空！' })
        return res.cc('用户名或密码不能为空！')
    }
    console.log(userInfo.username)
    db.query(searchNameSql, userInfo.username, (err, results) => {
        console.log(results)
        if(err) {
            return res.cc(err)
        } else if (results.length > 0) {
            return res.cc('用户名被占用！')
        } else {
            //密码加密
            userInfo.password = bcrypt.hashSync(userInfo.password, 10)
            db.query(addUserSql, userInfo, (err, results) => {
                if (err) {
                    console.log(err)
                    return res.cc(err)
                } else {
                    return res.cc('注册成功！', 0)
                }
            })
        }

    })
}
//登录
exports.login = (req, res) => {
    const userInfo = req.body
    if (!userInfo.username || !userInfo.password) {
        return res.send({ status: 1, message: '用户名或密码不能为空！' })
    }
    db.query(searchNameSql, userInfo.username, (err, results) => {
        if(err) {
            return res.send({ status: 1, message: err.message })
        } else if (!results.length) {
            return res.send({ status: 1, message: '用户名或密码不正确！' })
        } else {
            const user = {...results[0], password: ''}
            const token = jwt.sign(user, tokenStr.jwtSecretKey, { expiresIn:tokenStr.expiresIn })
            //解密登录
            if(bcrypt.compareSync(userInfo.password, results[0].password)) {
                redis.client.setex(user.id,28800,'Bearer ' + token)
                return res.send({
                    status: 0,
                    message: '登录成功！',
                    token: 'Bearer ' + token
                })
            } else {
                return res.cc('用户名或密码不正确！')
            }
        }

    })
}
