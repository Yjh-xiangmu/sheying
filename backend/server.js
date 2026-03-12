const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 路由挂载区 ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/artworks', require('./routes/artwork'));
app.use('/api/interaction', require('./routes/interaction')); // 新增互动路由
app.use('/api/certification', require('./routes/certification')); // 👇 新增这行，挂载认证路由
app.use('/api/admin', require('./routes/admin')); // 👇 新增这行，挂载后台管理路由
app.use('/api/user', require('./routes/user'));

app.get('/', (req, res) => {
    res.json({ code: 200, message: '摄影平台后端服务运行正常！' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 后端服务已运行: http://localhost:${PORT}`);
    console.log(`=================================`);
});