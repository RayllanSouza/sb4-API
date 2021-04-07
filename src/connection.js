const mysql = require('mysql')

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sb4games'
})


module.exports = connection;