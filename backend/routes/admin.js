const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- 1. 获取所有认证申请列表 ---
router.get('/certifications', async (req, res) => {
    try {
        // 联表查询：查出申请表信息，以及对应用户的账号和当前昵称
        const query = `
            SELECT c.*, u.username, u.nickname
            FROM certifications c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.status ASC, c.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取列表失败' });
    }
});

// --- 2. 审核认证申请 (通过/拒绝) ---
router.put('/certifications/:id', async (req, res) => {
    const { id } = req.params; // 申请记录的ID
    const { status, user_id } = req.body; // status: 1通过, 2拒绝

    try {
        // 更新申请表的状态
        await db.query('UPDATE certifications SET status = ? WHERE id = ?', [status, id]);

        // 核心逻辑：如果是“通过审核”，则必须把该用户的 role 升级为 1 (认证摄影师)
        if (status === 1) {
            await db.query('UPDATE users SET role = 1 WHERE id = ?', [user_id]);
        }

        res.json({ code: 200, message: status === 1 ? '已通过认证，该用户已成为摄影师！' : '已驳回该申请' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '操作失败' });
    }
});
// --- 3. 获取所有用户列表 ---
router.get('/users', async (req, res) => {
    try {
        const query = `
            SELECT id, username, nickname, role, status, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取用户列表失败' });
    }
});

// --- 4. 更改用户状态 (封禁/解封) ---
router.put('/users/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 1 为正常，0 为封禁

    try {
        // 【修复Bug】真正的角色防越权：先查出目标用户的 role
        const [targetUsers] = await db.query('SELECT role FROM users WHERE id = ?', [id]);

        if (targetUsers.length > 0 && targetUsers[0].role === 2) {
            return res.json({ code: 403, message: '权限不足：无法封禁其他管理员账号' });
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({ code: 200, message: status === 1 ? '账号已解封' : '账号已封禁' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '状态更新失败' });
    }
});
// --- 5. 获取后台首页统计可视化数据 ---
router.get('/statistics', async (req, res) => {
    try {
        // 1. 基础四大件统计 (总用户数, 总作品数, 总浏览量, 待审核认证数)
        const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
        const [[{ total_artworks }]] = await db.query('SELECT COUNT(*) as total_artworks FROM artworks');
        const [[{ total_views }]] = await db.query('SELECT SUM(view_count) as total_views FROM artworks');
        const [[{ pending_certs }]] = await db.query('SELECT COUNT(*) as pending_certs FROM certifications WHERE status = 0');

        // 2. 摄影作品分类占比 (为 ECharts 饼图准备数据)
        const [categoryData] = await db.query(`
            SELECT c.name, COUNT(a.id) as value 
            FROM categories c 
            LEFT JOIN artworks a ON c.id = a.category_id 
            GROUP BY c.id
        `);

        // 3. 高产摄影师 Top 5 (为 ECharts 柱状图准备数据)
        const [topAuthors] = await db.query(`
            SELECT u.nickname as name, COUNT(a.id) as value
            FROM users u
            JOIN artworks a ON u.id = a.user_id
            GROUP BY u.id
            ORDER BY value DESC
            LIMIT 5
        `);

        res.json({
            code: 200,
            data: {
                base: {
                    total_users,
                    total_artworks,
                    total_views: total_views || 0, // 如果没有作品，浏览量默认为0
                    pending_certs
                },
                categoryData,
                topAuthors
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取统计数据失败' });
    }
});
// --- 6. 获取所有举报记录 ---
router.get('/reports', async (req, res) => {
    try {
        const query = `
            SELECT r.id, r.reason, r.status, r.created_at, 
                   a.id as artwork_id, a.title, a.cover_url, 
                   u.username as reporter_name
            FROM reports r
            LEFT JOIN artworks a ON r.artwork_id = a.id
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.status ASC, r.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '获取举报列表失败' });
    }
});

// --- 7. 处理举报 (带自动封禁风控引擎) ---
router.put('/reports/:id/handle', async (req, res) => {
    const { action, artwork_id } = req.body;
    try {
        // 1. 标记当前举报为已处理
        await db.query('UPDATE reports SET status = 1 WHERE id = ?', [req.params.id]);

        if (action === 'delete' && artwork_id) {
            // 2. 查出这个违规作品的作者是谁
            const [artworks] = await db.query('SELECT user_id FROM artworks WHERE id = ?', [artwork_id]);

            if (artworks.length > 0) {
                const authorId = artworks[0].user_id;

                // 3. 删除作品，并把关于该作品的其他举报一并处理掉
                await db.query('DELETE FROM artworks WHERE id = ?', [artwork_id]);
                await db.query('UPDATE reports SET status = 1 WHERE artwork_id = ?', [artwork_id]);

                // 4. 风控核心：给作者增加 1 次违规记录
                await db.query('UPDATE users SET violation_count = violation_count + 1 WHERE id = ?', [authorId]);

                // 5. 检查是否达到封号标准
                const [users] = await db.query('SELECT violation_count, ban_count FROM users WHERE id = ?', [authorId]);
                const user = users[0];

                if (user.violation_count >= 5) {
                    // 触发封号！违规清零，封禁次数+1，恢复2次申诉机会，状态改为0
                    await db.query(`
                        UPDATE users 
                        SET status = 0, 
                            ban_count = ban_count + 1, 
                            violation_count = 0, 
                            appeal_chances = 2 
                        WHERE id = ?
                    `, [authorId]);
                }
            }
        }

        res.json({
            code: 200,
            message: action === 'delete' ? '已删除作品并记录违规，满5次将自动封号！' : '已驳回举报'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: '处理失败' });
    }
});
// --- 8. 获取所有用户申诉列表 ---
router.get('/appeals', async (req, res) => {
    try {
        const query = `
            SELECT a.*, u.username, u.nickname, u.ban_count, u.appeal_chances 
            FROM appeals a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.status ASC, a.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json({ code: 200, data: rows });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取申诉列表失败' });
    }
});

// --- 9. 处理申诉 (通过解封 或 驳回维持封禁) ---
router.put('/appeals/:id/handle', async (req, res) => {
    const { action, user_id } = req.body; // action: 'approve'(通过) 或 'reject'(驳回)
    try {
        if (action === 'approve') {
            // 通过：解除封禁，状态恢复为1
            await db.query('UPDATE users SET status = 1 WHERE id = ?', [user_id]);
            await db.query('UPDATE appeals SET status = 1 WHERE id = ?', [req.params.id]);
            res.json({ code: 200, message: '已通过申诉，账号已解封' });
        } else {
            // 驳回：维持封禁，状态设为2
            await db.query('UPDATE appeals SET status = 2 WHERE id = ?', [req.params.id]);
            res.json({ code: 200, message: '已驳回该申诉' });
        }
    } catch (error) {
        res.status(500).json({ code: 500, message: '处理失败' });
    }
});
module.exports = router;