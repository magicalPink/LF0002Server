const db = require('../db/index')
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
        res.send({
            status: 0,
            message: '获取用户信息成功！',
            data: results[0]
        })
    })
}

//修改用户昵称
exports.setNickname = (req, res) => {
    const route = req.body
    const id = route.id
    const newNickname = route.nickname

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
    const route = req.body
    const id = route.id
    const newAvatar = route.avatar

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

