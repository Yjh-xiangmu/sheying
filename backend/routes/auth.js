const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 1. 用户注册接口
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // 检查账号是否已存在
        const [existingUsers] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUsers.length > 0) {
            return res.json({ code: 400, message: '该账号已存在，请直接登录' });
        }

        // 使用 bcrypt 加密密码 (盐值设为 10)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 插入新用户，默认昵称为 '摄影师_' 加随机数，默认角色为 0 (普通用户)
        const nickname = '摄影师_' + Math.floor(Math.random() * 10000);
        await db.query(
            'INSERT INTO users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, nickname, 0]
        );

        res.json({ code: 200, message: '注册成功，请登录！' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 2. 用户登录接口
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // 查找用户
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.json({ code: 400, message: '账号不存在' });
        }

        const user = users[0];

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ code: 400, message: '密码错误' });
        }

        // 校验账号风控状态
        if (user.status === 0) {
            // 历史封禁次数达到2次，永久封禁
            if (user.ban_count >= 2) {
                return res.json({
                    code: 403,
                    message: '您的账号因多次严重违规已被永久封禁，无法申诉。'
                });
            }
            // 还有申诉机会
            else if (user.appeal_chances > 0) {
                return res.json({
                    code: 403,
                    message: `您的账号因多次违规被封禁。您还有 ${user.appeal_chances} 次申诉机会。`,
                    needAppeal: true,  // 告诉前端，需要弹出申诉框
                    user_id: user.id   // 把ID传给前端，用于提交申诉
                });
            }
            // 申诉机会用光了
            else {
                return res.json({
                    code: 403,
                    message: '您的账号在本次封禁中的申诉机会已用尽，无法解封。'
                });
            }
        }

        // 生成 JWT 令牌，包含用户 id 和角色，有效期 7 天
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 返回给前端的数据 (剔除密码)
        res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});
// --- 提交封禁申诉 ---
router.post('/appeal', async (req, res) => {
    const { user_id, content } = req.body;
    try {
        // 1. 检查是否已经有正在处理中的申诉
        const [existing] = await db.query('SELECT * FROM appeals WHERE user_id = ? AND status = 0', [user_id]);
        if (existing.length > 0) {
            return res.json({ code: 400, message: '您已有待处理的申诉，请耐心等待管理员审核，勿重复提交。' });
        }

        // 2. 扣减该用户的 1 次申诉机会
        await db.query('UPDATE users SET appeal_chances = appeal_chances - 1 WHERE id = ?', [user_id]);

        // 3. 写入申诉表
        await db.query('INSERT INTO appeals (user_id, content) VALUES (?, ?)', [user_id, content]);

        res.json({ code: 200, message: '申诉已提交，请等待管理员审核结果。' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '申诉提交失败' });
    }
});
module.exports = router;