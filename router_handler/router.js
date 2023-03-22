const db = require('../db/index')
// 插入sql
const addSql = `INSERT INTO router SET ?`

//获取路由列表
exports.getRouter = (req, res) => {
    let searchSql = 'SELECT * FROM router where 1=1'
    if(req.query.name) {
        searchSql += ` name like '%${req.query.name}%'`
    }
    console.log(searchSql)
    // 查询sql
    console.log(req.query)
    db.query(searchSql, (err, results) => {
        if (err) {
            return res.cc(err)
        }
        //处理数据 转换为树结构
        let arr = []
        results.map(item => {
            if(item.parentId === 0) {
                arr.push(item)
            } else {
                arr.forEach(item1 => {
                    if(item1.id === item.parentId) {
                        item1.children = item1.children || []
                        item1.children.push(item)
                    }
                })
            }
        })
        return res.send({
            status: 0,
            data:arr
        })
    })
}
//添加路由接口
exports.addRouter = (req, res) => {
    const route = req.body
    console.log(route)
    db.query(addSql, route, (err, results) => {
        if (err) {
            return res.cc(err)
        }
        console.log(req.user)
        return res.send({
            status: 0,
            msg:'添加成功'
        })
    })
}
