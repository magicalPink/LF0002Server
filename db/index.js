const mysql = require('mysql')

const db = mysql.createPool({
    host: '111.229.200.218',
    user: 'LF0002',
    password: '5pCrb6rAX6bjiKBj',
    database: 'lf0002',
    port:3306
})

module.exports = db
