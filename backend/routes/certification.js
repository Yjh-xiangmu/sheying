const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// 配置 Multer 接收认证代表作图片
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cert_' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. 提交认证申请接口 (最多接收3张图)
router.post('/apply', upload.array('images', 3), async (req, res) => {
    try {
        const { user_id, real_name, phone, reason } = req.body;

        // 检查是否已经有待审核的申请，防止重复提交
        const [existing] = await db.query('SELECT * FROM certifications WHERE user_id = ? AND status = 0', [user_id]);
        if (existing.length > 0) {
            return res.json({ code: 400, message: '您已有待审核的申请，请勿重复提交' });
        }

        if (!req.files || req.files.length < 2) {
            return res.json({ code: 400, message: '请至少上传 2 张代表作品' });
        }

        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        const images_json = JSON.stringify(imageUrls);

        await db.query(
            'INSERT INTO certifications (user_id, real_name, phone, reason, images) VALUES (?, ?, ?, ?, ?)',
            [user_id, real_name, phone, reason, images_json]
        );

        res.json({ code: 200, message: '认证申请提交成功，请等待管理员审核！' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '提交失败，服务器异常' });
    }
});

// 2. 获取用户当前的认证状态
router.get('/status/:user_id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT status FROM certifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.user_id]);
        if (rows.length > 0) {
            res.json({ code: 200, data: { status: rows[0].status } }); // 0待审核, 1通过, 2拒绝
        } else {
            res.json({ code: 200, data: { status: -1 } }); // -1 表示从未申请
        }
    } catch (error) {
        res.status(500).json({ code: 500, message: '查询失败' });
    }
});

module.exports = router;