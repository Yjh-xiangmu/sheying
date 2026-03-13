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
// --- 3. 获取帖子详情 (包含浏览量自动 +1) ---
router.get('/detail/:id', async (req, res) => {
    try {
        // 每次点进详情，浏览量 + 1
        await db.query('UPDATE topics SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);

        const query = `
            SELECT t.*, u.nickname, u.avatar 
            FROM topics t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.id = ?
        `;
        const [rows] = await db.query(query, [req.params.id]);
        if (rows.length > 0) {
            res.json({ code: 200, data: rows[0] });
        } else {
            res.json({ code: 404, message: '帖子已被删除或不存在' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取帖子详情失败' });
    }
});

// --- 4. 获取帖子的所有盖楼回复 ---
router.get('/replies/:topic_id', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.nickname, u.avatar, u.role
            FROM topic_replies r
            JOIN users u ON r.user_id = u.id
            WHERE r.topic_id = ?
            ORDER BY r.created_at ASC
        `;
        const [rows] = await db.query(query, [req.params.topic_id]);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取回帖失败' });
    }
});

// --- 5. 发布回帖 (盖楼) ---
router.post('/reply', async (req, res) => {
    const { topic_id, user_id, content } = req.body;
    try {
        await db.query(
            'INSERT INTO topic_replies (topic_id, user_id, content) VALUES (?, ?, ?)',
            [topic_id, user_id, content]
        );
        res.json({ code: 200, message: '回复成功！' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '回复失败' });
    }
});

module.exports = router;