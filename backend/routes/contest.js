const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- 1. 获取前台比赛列表 (带参赛人数统计) ---
router.get('/list', async (req, res) => {
    try {
        // 【新增：自动结算】每次有人看列表时，先把时间到了的比赛状态更新为 0 (已结束)
        await db.query('UPDATE contests SET status = 0 WHERE end_time <= NOW() AND status = 1');
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM contest_entries e WHERE e.contest_id = c.id) as participant_count
            FROM contests c
            ORDER BY c.status DESC, c.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取比赛列表失败' });
    }
});

// --- 2. 获取单个比赛详情及排行榜 (按票数排序) ---
router.get('/detail/:id', async (req, res) => {
    try {
        // 【新增：自动结算】每次有人看详情时，也触发一次检查
        await db.query('UPDATE contests SET status = 0 WHERE end_time <= NOW() AND status = 1');
        // 查比赛基本信息
        const [contestInfo] = await db.query('SELECT * FROM contests WHERE id = ?', [req.params.id]);
        if (contestInfo.length === 0) return res.json({ code: 404, message: '比赛不存在' });

        // 查参赛作品列表（按票数从高到低排列，生成排行榜）
        const entriesQuery = `
            SELECT e.id as entry_id, e.votes, e.created_at as join_time,
                   a.id as artwork_id, a.title as artwork_title, a.cover_url,
                   u.id as user_id, u.nickname, u.avatar
            FROM contest_entries e
            JOIN artworks a ON e.artwork_id = a.id
            JOIN users u ON e.user_id = u.id
            WHERE e.contest_id = ?
            ORDER BY e.votes DESC, e.created_at ASC
        `;
        const [entries] = await db.query(entriesQuery, [req.params.id]);

        res.json({ code: 200, data: { info: contestInfo[0], entries } });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取详情失败' });
    }
});

// --- 3. 用户投稿参赛 ---
router.post('/join', async (req, res) => {
    const { contest_id, user_id, artwork_id } = req.body;
    try {
        // 检查比赛是否还在进行中
        const [contest] = await db.query('SELECT status, end_time FROM contests WHERE id = ?', [contest_id]);
        if (contest.length === 0 || contest[0].status === 0 || new Date() > new Date(contest[0].end_time)) {
            return res.json({ code: 400, message: '比赛已结束，停止投稿' });
        }

        // 插入参赛记录 (数据库有 UNIQUE KEY 保证每人只能投一次)
        await db.query(
            'INSERT INTO contest_entries (contest_id, user_id, artwork_id) VALUES (?, ?, ?)',
            [contest_id, user_id, artwork_id]
        );
        res.json({ code: 200, message: '投稿成功！' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.json({ code: 400, message: '您已经参加过该比赛了，不能重复投稿哦' });
        } else {
            res.status(500).json({ code: 500, message: '投稿失败' });
        }
    }
});

// --- 4. 给参赛作品投票 ---
router.post('/vote', async (req, res) => {
    const { contest_id, entry_id, user_id } = req.body;
    try {
        // 1. 记录投票信息 (防重投)
        await db.query(
            'INSERT INTO contest_votes (contest_id, entry_id, user_id) VALUES (?, ?, ?)',
            [contest_id, entry_id, user_id]
        );
        // 2. 票数 + 1
        await db.query('UPDATE contest_entries SET votes = votes + 1 WHERE id = ?', [entry_id]);

        res.json({ code: 200, message: '投票成功！' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.json({ code: 400, message: '您已经给这幅作品投过票了' });
        } else {
            res.status(500).json({ code: 500, message: '投票失败' });
        }
    }
});

module.exports = router;