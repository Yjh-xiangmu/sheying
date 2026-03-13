const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'img_' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 获取所有作品分类
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY sort_order ASC');
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取分类失败' });
    }
});

// 发布作品接口
router.post('/upload', upload.array('images', 9), async (req, res) => {
    try {
        const { user_id, category_id, title, description } = req.body;
        if (!req.files || req.files.length === 0) {
            return res.json({ code: 400, message: '请至少上传一张图片' });
        }
        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        const cover_url = imageUrls[0];
        const images_json = JSON.stringify(imageUrls);

        await db.query(
            'INSERT INTO artworks (user_id, category_id, title, description, cover_url, images, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, category_id, title, description, cover_url, images_json, 1]
        );
        res.json({ code: 200, message: '组图发布成功' });
    } catch (error) {
        res.status(500).json({ code: 500, message: '上传失败' });
    }
});

// 获取作品列表接口 (支持分类和关键词搜索)
router.get('/list', async (req, res) => {
    try {
        const { category_id, keyword } = req.query;
        let query = `
            SELECT 
                a.id, a.title, a.description, a.cover_url, a.like_count, a.created_at,
                u.nickname, u.avatar, 
                c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.status = 1
        `;
        const params = [];

        if (category_id) {
            query += ` AND a.category_id = ?`;
            params.push(category_id);
        }

        if (keyword) {
            query += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        query += ` ORDER BY a.created_at DESC`;

        const [rows] = await db.query(query, params);
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取作品列表失败' });
    }
});
// --- 获取热度排行榜接口 ---
router.get('/ranking', async (req, res) => {
    try {
        // 热度算法：点赞数 * 5 + 浏览量。取前 20 名
        const query = `
            SELECT 
                a.id, a.title, a.cover_url, a.like_count, a.view_count, 
                (a.like_count * 5 + a.view_count) as hot_score,
                u.nickname, u.avatar 
            FROM artworks a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.status = 1
            ORDER BY hot_score DESC
            LIMIT 20
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取排行榜失败' });
    }
});
// 获取单个作品详情接口
router.get('/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.*, u.nickname, u.avatar, u.bio, c.name as category_name
            FROM artworks a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.id = ? AND a.status = 1
        `;
        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) return res.json({ code: 404, message: '作品不存在' });

        db.query('UPDATE artworks SET view_count = view_count + 1 WHERE id = ?', [id]).catch(console.error);
        res.json({ code: 200, data: rows[0] });
    } catch (error) {
        res.status(500).json({ code: 500, message: '服务器异常' });
    }
});
// --- 获取关注用户的最新动态推送 (Feed流) ---
router.get('/feed/:user_id', async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.title, a.cover_url, a.like_count, a.view_count, a.created_at,
                   u.id as user_id, u.nickname, u.avatar 
            FROM artworks a
            JOIN follows f ON a.user_id = f.following_id
            JOIN users u ON a.user_id = u.id
            WHERE f.follower_id = ? AND a.status = 1
            ORDER BY a.created_at DESC
        `;
        const [rows] = await db.query(query, [req.params.user_id]);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取动态失败' });
    }
});
module.exports = router;