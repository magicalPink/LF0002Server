const db = require('../db/index')

function query(sql, values) {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) {
                reject(err)
            } else {
                resolve(results)
            }
        })
    })
}

// 获取路由列表
exports.getRouter = async (req, res) => {
    const name = req.query.name
    const sql = `SELECT * FROM router`
    if(name) {
        const sql = `SELECT * FROM router WHERE name LIKE '%${name}%'`
    }
    try {
        const results = await query(sql)
        const treeData = buildTree(results)
        res.send({
            status: 0,
            data: treeData
        })
    } catch (err) {
        res.cc(err)
    }
}

exports.getMenuList = async (req, res) => {
    const sql = `SELECT * FROM router`
    try {
        const results = await query(sql)
        let menuData = []
        console.log(req.user)
        if(req.user.authority != 'admin') {
            let authority = req.user.authority.split(',')
            menuData = results.filter(item => {
                return item.jurisdiction == 0 || authority.includes(item.id)
            })
        } else {
            menuData = results
        }
        console.log(results)
        const treeData = buildTree(menuData)
        res.send({
            status: 0,
            data: treeData,
        })
    } catch (err) {
        res.cc(err)
    }
}

// 添加或修改路由
exports.addRouter = async (req, res) => {
    const route = req.body
    const id = route.id
    try {
        let results
        if (id) {
            const updateSql = `UPDATE router SET ? WHERE id = ?`
            results = await query(updateSql, [route, id])
        } else {
            const insertSql = `INSERT INTO router SET ? ON DUPLICATE KEY UPDATE ?`
            results = await query(insertSql, [route, route])
        }
        res.send({
            status: 0,
            msg: id ? '修改成功' : '添加成功'
        })
    } catch (err) {
        res.cc(err)
    }
}

// 删除路由
exports.deleteRouter = async (req, res) => {
    const id = req.query.id
    try {
        const deleteSql = `DELETE FROM router WHERE id = ?`
        const results = await query(deleteSql, id)
        res.send({
            status: 0,
            msg: '删除成功'
        })
    } catch (err) {
        res.cc(err)
    }
}

// 辅助函数：构建树形结构
function buildTree(data) {
    const tree = []
    const map = {}
    data.forEach(item => {
        map[item.id] = item
    })
    data.forEach(item => {
        const parent = map[item.parentId]
        if (parent) {
            parent.children = parent.children || []
            parent.children.push(item)
        } else {
            tree.push(item)
        }
    })
    return tree
}
