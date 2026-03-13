const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- 1. 获取帖子列表 (置顶优先，其次按时间倒序) ---
router.get('/list', async (req, res) => {
    try {
        const query = `
            SELECT t.id, t.title, t.content, t.view_count, t.is_pinned, t.is_elite, t.created_at,
                   u.nickname, u.avatar,
                   (SELECT COUNT(*) FROM topic_replies r WHERE r.topic_id = t.id) as reply_count
            FROM topics t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.is_pinned DESC, t.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取帖子列表失败' });
    }
});

// --- 2. 发起新讨论 (发帖) ---
router.post('/create', async (req, res) => {
    const { user_id, title, content } = req.body;
    try {
        await db.query(
            'INSERT INTO topics (user_id, title, content) VALUES (?, ?, ?)',
            [user_id, title, content]
        );
        res.json({ code: 200, message: '帖子发布成功！' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '发布失败' });
    }
});

module.exports = router;