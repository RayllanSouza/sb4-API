const mysql = require('mysql')

const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sb4games',
    charset : 'utf8mb4'
});


module.exports = connection;