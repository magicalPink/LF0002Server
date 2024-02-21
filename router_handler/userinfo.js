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
