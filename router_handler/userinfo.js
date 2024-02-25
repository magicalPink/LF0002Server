const db = require('../db/index')

const onlineUser = require("../utils/onlineUser-redis")
// 查询sql
const sql = `SELECT * FROM users WHERE id = ?`

exports.getUserInfo = (req, res) => {
    db.query(sql, req.user.id, (err, results) => {
        if (err) {
            return res.cc(err)
        }
        if (results.length !== 1) {
            return res.cc(9,'获取用户信息失败！')
        }
        let userInfo = results[0]
        delete userInfo.password
        res.send({
            status: 0,
            message: '获取用户信息成功！',
            data: userInfo
        })
    })
}

//修改用户昵称
exports.setNickname = (req, res) => {
    const id = req.body.id
    const newNickname = req.body.nickname

    // 更新SQL
    const updateSql = `UPDATE users SET nickname = ? WHERE id = ?`

    db.query(updateSql, [newNickname, id], (err, results) => {
        if (err) {
            return res.cc(err)
        }
        if (results.affectedRows !== 1) {
            return res.cc(9, '修改用户昵称失败！')
        }
        res.send({
            status: 0,
            message: '修改用户昵称成功！'
        })
    })
}

//修改用户头像
exports.setAvatar = (req, res) => {
    const id = req.body.id
    const newAvatar = req.body.avatar

    // 更新SQL
    const updateSql = `UPDATE users SET avatar = ? WHERE id = ?`

    db.query(updateSql, [newAvatar, id], (err, results) => {
        if (err) {
            return res.cc(err)
        }
        if (results.affectedRows !== 1) {
            return res.cc(9, '修改用户头像失败！')
        }
        res.send({
            status: 0,
            message: '修改用户头像成功！'
        })
    })
}

//获取在线列表
exports.getOnlineList = (req, res) => {
    onlineUser.getList().then(list => {
        res.send({
            status: 0,
            data: list
        })
    })
}


