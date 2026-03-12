const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. 点赞 / 取消点赞
router.post('/like', async (req, res) => {
    const { artwork_id, user_id } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM likes WHERE artwork_id = ? AND user_id = ?', [artwork_id, user_id]);
        if (existing.length > 0) {
            // 已点赞则取消
            await db.query('DELETE FROM likes WHERE artwork_id = ? AND user_id = ?', [artwork_id, user_id]);
            await db.query('UPDATE artworks SET like_count = like_count - 1 WHERE id = ?', [artwork_id]);
            res.json({ code: 200, message: '已取消点赞', data: { isLiked: false } });
        } else {
            // 未点赞则新增
            await db.query('INSERT INTO likes (artwork_id, user_id) VALUES (?, ?)', [artwork_id, user_id]);
            await db.query('UPDATE artworks SET like_count = like_count + 1 WHERE id = ?', [artwork_id]);
            res.json({ code: 200, message: '点赞成功', data: { isLiked: true } });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '操作失败' });
    }
});

// 2. 检查用户是否已点赞
router.get('/check_like', async (req, res) => {
    const { artwork_id, user_id } = req.query;
    if (!user_id) return res.json({ code: 200, data: { isLiked: false } });
    try {
        const [rows] = await db.query('SELECT id FROM likes WHERE artwork_id = ? AND user_id = ?', [artwork_id, user_id]);
        res.json({ code: 200, data: { isLiked: rows.length > 0 } });
    } catch (error) {
        res.status(500).json({ code: 500, message: '检查状态失败' });
    }
});

// --- 1. 发表评论 (支持多级回复与敏感词自动审核) ---
router.post('/comment', async (req, res) => {
    const { artwork_id, user_id, content, parent_id } = req.body;

    // 简单的风控引擎：敏感词词库 (实际商业项目中会调用第三方API或庞大的正则库)
    const badWords = ['色情', '赌博', '广告', '刷单', '加微信'];
    let status = 1; // 默认 1:正常显示

    // 自动审核：如果包含敏感词，状态设为 0，进入人工待审列表，前端暂时不显示
    for (let word of badWords) {
        if (content.includes(word)) {
            status = 0;
            break;
        }
    }

    try {
        await db.query(
            'INSERT INTO comments (artwork_id, user_id, content, parent_id, status) VALUES (?, ?, ?, ?, ?)',
            [artwork_id, user_id, content, parent_id || null, status]
        );

        if (status === 0) {
            res.json({ code: 200, message: '您的评论包含敏感词汇，已提交管理员人工审核。' });
        } else {
            res.json({ code: 200, message: '发表成功' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '评论失败' });
    }
});

// --- 2. 获取作品评论列表 (组装多级回复树) ---
router.get('/comments/:artwork_id', async (req, res) => {
    try {
        // 只拉取 status = 1 (审核通过/正常) 的评论
        const [rows] = await db.query(`
            SELECT c.*, u.nickname, u.avatar 
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.artwork_id = ? AND c.status = 1
            ORDER BY c.created_at ASC
        `, [req.params.artwork_id]);

        // 将平铺的数据组装成树状结构
        const commentsList = [];
        const replyMap = {};

        // 分离顶级评论和子回复
        rows.forEach(row => {
            if (row.parent_id) {
                if (!replyMap[row.parent_id]) replyMap[row.parent_id] = [];
                replyMap[row.parent_id].push(row);
            } else {
                row.replies = [];
                commentsList.push(row);
            }
        });

        // 将子回复挂载到对应的顶级评论下
        commentsList.forEach(comment => {
            if (replyMap[comment.id]) {
                comment.replies = replyMap[comment.id];
            }
        });

        // 倒序排列，让最新评论在上面
        commentsList.reverse();

        res.json({ code: 200, data: commentsList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取评论失败' });
    }
});
// --- 5. 收藏 / 取消收藏 ---
router.post('/collect', async (req, res) => {
    const { artwork_id, user_id } = req.body;
    try {
        const [existing] = await db.query('SELECT * FROM collections WHERE artwork_id = ? AND user_id = ?', [artwork_id, user_id]);
        if (existing.length > 0) {
            // 已收藏则取消
            await db.query('DELETE FROM collections WHERE artwork_id = ? AND user_id = ?', [artwork_id, user_id]);
            res.json({ code: 200, message: '已取消收藏', data: { isCollected: false } });
        } else {
            // 未收藏则添加
            await db.query('INSERT INTO collections (artwork_id, user_id) VALUES (?, ?)', [artwork_id, user_id]);
            res.json({ code: 200, message: '收藏成功', data: { isCollected: true } });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '操作失败' });
    }
});

// --- 6. 检查用户是否已收藏 ---
router.get('/check_collect', async (req, res) => {
    const { artwork_id, user_id } = req.query;
    if (!user_id) return res.json({ code: 200, data: { isCollected: false } });
    try {
        const [rows] = await db.query('SELECT id FROM collections WHERE artwork_id = ? AND user_id = ?', [artwork_id, user_id]);
        res.json({ code: 200, data: { isCollected: rows.length > 0 } });
    } catch (error) {
        res.status(500).json({ code: 500, message: '检查状态失败' });
    }
});
// --- 7. 关注 / 取消关注 ---
router.post('/follow', async (req, res) => {
    const { follower_id, following_id } = req.body;

    // 不能自己关注自己
    if (follower_id === following_id) {
        return res.json({ code: 400, message: '不能关注自己哦' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [follower_id, following_id]);
        if (existing.length > 0) {
            // 已关注则取消
            await db.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [follower_id, following_id]);
            res.json({ code: 200, message: '已取消关注', data: { isFollowing: false } });
        } else {
            // 未关注则添加
            await db.query('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)', [follower_id, following_id]);
            res.json({ code: 200, message: '关注成功', data: { isFollowing: true } });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '操作失败' });
    }
});

// --- 8. 检查是否已关注 ---
router.get('/check_follow', async (req, res) => {
    const { follower_id, following_id } = req.query;
    if (!follower_id || !following_id) return res.json({ code: 200, data: { isFollowing: false } });

    try {
        const [rows] = await db.query('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?', [follower_id, following_id]);
        res.json({ code: 200, data: { isFollowing: rows.length > 0 } });
    } catch (error) {
        res.status(500).json({ code: 500, message: '检查状态失败' });
    }
});
// --- 9. 举报违规作品 ---
router.post('/report', async (req, res) => {
    const { artwork_id, user_id, reason } = req.body;
    try {
        // 防止同一个用户对同一个作品重复举报
        const [existing] = await db.query('SELECT * FROM reports WHERE artwork_id = ? AND user_id = ? AND status = 0', [artwork_id, user_id]);
        if (existing.length > 0) {
            return res.json({ code: 400, message: '您已举报过该作品，管理员正在处理中' });
        }

        await db.query('INSERT INTO reports (artwork_id, user_id, reason) VALUES (?, ?, ?)', [artwork_id, user_id, reason]);
        res.json({ code: 200, message: '举报已提交，感谢您维护社区环境！' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '举报提交失败' });
    }
});
// --- 10. 获取互关好友列表 (只有互相关注才能聊天) ---
router.get('/friends/:user_id', async (req, res) => {
    try {
        // SQL 逻辑：查找既是我关注的，也关注了我的用户
        const query = `
            SELECT u.id, u.nickname, u.avatar 
            FROM follows f1
            JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
            JOIN users u ON f1.following_id = u.id
            WHERE f1.follower_id = ?
        `;
        const [rows] = await db.query(query, [req.params.user_id]);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取好友列表失败' });
    }
});

// --- 11. 获取与某个好友的聊天记录 ---
router.get('/messages/:user1/:user2', async (req, res) => {
    try {
        // 拉取两人互发的所有消息，如果有作品分享，联表查出作品信息
        const query = `
            SELECT m.*, a.title as artwork_title, a.cover_url as artwork_cover 
            FROM messages m
            LEFT JOIN artworks a ON m.artwork_id = a.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) 
               OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.created_at ASC
        `;
        const [rows] = await db.query(query, [req.params.user1, req.params.user2, req.params.user2, req.params.user1]);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取聊天记录失败' });
    }
});

// --- 12. 发送私信 / 分享作品 ---
router.post('/message', async (req, res) => {
    const { sender_id, receiver_id, content, artwork_id } = req.body;
    try {
        await db.query(
            'INSERT INTO messages (sender_id, receiver_id, content, artwork_id) VALUES (?, ?, ?, ?)',
            [sender_id, receiver_id, content || '', artwork_id || null]
        );
        res.json({ code: 200, message: '发送成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '发送失败' });
    }
});
// --- 13. 获取用户的 关注列表 和 粉丝列表 ---
router.get('/follows-list/:user_id', async (req, res) => {
    try {
        // 我关注的人 (Following)
        const [following] = await db.query(`
            SELECT u.id, u.nickname, u.avatar, u.bio
            FROM follows f JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
        `, [req.params.user_id]);

        // 关注我的人 (Followers / 粉丝)
        const [followers] = await db.query(`
            SELECT u.id, u.nickname, u.avatar, u.bio
            FROM follows f JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
        `, [req.params.user_id]);

        res.json({ code: 200, data: { following, followers } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取关注列表失败' });
    }
});
// --- 14. 获取任意用户的基本信息 (用于陌生人主页和搭讪聊天) ---
router.get('/user-info/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nickname, avatar, bio, role FROM users WHERE id = ?', [req.params.id]);
        if (rows.length > 0) {
            res.json({ code: 200, data: rows[0] });
        } else {
            res.json({ code: 404, message: '用户不存在' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取用户信息失败' });
    }
});
module.exports = router;