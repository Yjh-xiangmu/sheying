const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- 1. 获取某用户发布的所有作品 ---
router.get('/:id/artworks', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.id, a.title, a.cover_url, a.like_count, a.view_count, c.name as category_name
            FROM artworks a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.user_id = ? 
            ORDER BY a.created_at DESC
        `, [req.params.id]);
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取作品失败' });
    }
});

// --- 2. 获取某用户收藏的所有作品 ---
router.get('/:id/collections', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.id, a.title, a.cover_url, a.like_count, a.view_count, c.name as category_name
            FROM collections col
            JOIN artworks a ON col.artwork_id = a.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE col.user_id = ? AND a.status = 1
            ORDER BY col.created_at DESC
        `, [req.params.id]);
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取收藏失败' });
    }
});

// --- 3. 更新个人基本资料 (昵称、简介) ---
router.put('/update', async (req, res) => {
    const { id, nickname, bio } = req.body;
    try {
        await db.query('UPDATE users SET nickname = ?, bio = ? WHERE id = ?', [nickname, bio, id]);

        // 获取更新后的最新用户信息返回给前端，方便前端更新本地缓存
        const [users] = await db.query('SELECT id, username, nickname, avatar, role, bio FROM users WHERE id = ?', [id]);
        res.json({ code: 200, message: '资料更新成功', data: users[0] });
    } catch (error) {
        res.status(500).json({ code: 500, message: '更新失败' });
    }
});
const multer = require('multer');
const path = require('path');

// 配置头像上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, 'avatar_' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- 4. 上传/更换头像 ---
router.post('/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const { id } = req.body;
        const avatarUrl = `/uploads/${req.file.filename}`;
        await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, id]);
        res.json({ code: 200, message: '头像更新成功', data: avatarUrl });
    } catch (error) {
        res.status(500).json({ code: 500, message: '头像上传失败' });
    }
});

// --- 5. 删除自己的作品 ---
router.delete('/artwork/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM artworks WHERE id = ?', [req.params.id]);
        res.json({ code: 200, message: '作品已删除' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '删除失败' });
    }
});
module.exports = router;