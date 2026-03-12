const mysql = require('mysql2');
require('dotenv').config(); // 加载 .env 文件中的变量

// 创建数据库连接池 (比单次连接更高效)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 将回调形式的查询转换为 Promise 形式，方便后续使用 async/await
const promisePool = pool.promise();

// 测试数据库连接
promisePool.getConnection()
    .then(connection => {
        console.log('✅ 数据库连接成功！');
        connection.release(); // 释放连接
    })
    .catch(err => {
        console.error('❌ 数据库连接失败:', err.message);
    });

module.exports = promisePool;