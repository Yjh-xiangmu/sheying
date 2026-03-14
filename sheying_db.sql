/*
 Navicat Premium Data Transfer

 Source Server         : yjh
 Source Server Type    : MySQL
 Source Server Version : 80026
 Source Host           : localhost:3306
 Source Schema         : sheying_db

 Target Server Type    : MySQL
 Target Server Version : 80026
 File Encoding         : 65001

 Date: 14/03/2026 16:12:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for appeals
-- ----------------------------
DROP TABLE IF EXISTS `appeals`;
CREATE TABLE `appeals`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '申诉人ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '申诉理由',
  `status` tinyint NULL DEFAULT 0 COMMENT '0:待处理, 1:申诉成功(解封), 2:申诉驳回',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户封禁申诉表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of appeals
-- ----------------------------
INSERT INTO `appeals` VALUES (1, 3, '测试的', 0, '2026-03-13 17:04:16');

-- ----------------------------
-- Table structure for artworks
-- ----------------------------
DROP TABLE IF EXISTS `artworks`;
CREATE TABLE `artworks`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '发布者(摄影师)ID',
  `category_id` int NOT NULL COMMENT '分类ID',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '作品标题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '作品描述',
  `cover_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '封面/主图URL',
  `images` json NULL COMMENT '多图路径数组',
  `exif_info` json NULL COMMENT 'EXIF信息',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态: 0待审核, 1已通过, 2已拒绝',
  `view_count` int NULL DEFAULT 0 COMMENT '浏览量',
  `like_count` int NULL DEFAULT 0 COMMENT '点赞数',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '摄影作品表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of artworks
-- ----------------------------
INSERT INTO `artworks` VALUES (1, 1, 2, '大唐不夜城', '好看', '/uploads/img_1773223103597-505145899.png', NULL, NULL, 1, 32, 2, '2026-03-11 17:58:23');
INSERT INTO `artworks` VALUES (4, 3, 1, '赛伊德', '赛伊德', '/uploads/img_1773379329253-662084275.jpg', '[\"/uploads/img_1773379329253-662084275.jpg\"]', NULL, 1, 6, 2, '2026-03-13 13:22:09');
INSERT INTO `artworks` VALUES (5, 1, 1, '收拾收拾', '1111111111', '/uploads/img_1773394323015-766577441.jpg', '[\"/uploads/img_1773394323015-766577441.jpg\"]', NULL, 1, 4, 0, '2026-03-13 17:32:03');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '分类名称',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '作品分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, '人像', 1);
INSERT INTO `categories` VALUES (2, '风景', 2);
INSERT INTO `categories` VALUES (3, '纪实', 3);
INSERT INTO `categories` VALUES (4, '街拍', 4);

-- ----------------------------
-- Table structure for certifications
-- ----------------------------
DROP TABLE IF EXISTS `certifications`;
CREATE TABLE `certifications`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '申请人ID',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '真实姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '联系电话',
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '申请理由/自我介绍',
  `images` json NOT NULL COMMENT '代表作品(2-3张)',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态: 0待审核, 1已通过, 2已拒绝',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '摄影师认证申请表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of certifications
-- ----------------------------
INSERT INTO `certifications` VALUES (1, 1, '张三', '15903852598', '测试的', '[\"/uploads/cert_1773327355460-341112844.jpg\", \"/uploads/cert_1773327355462-41088290.png\"]', 1, '2026-03-12 22:55:55');
INSERT INTO `certifications` VALUES (2, 3, '赛伊德', '100811', '赛伊德', '[\"/uploads/cert_1773379276677-863396716.jpg\", \"/uploads/cert_1773379276683-25726648.jpg\"]', 1, '2026-03-13 13:21:16');
INSERT INTO `certifications` VALUES (3, 4, '六六', '1008611', '热爱', '[\"/uploads/cert_1773394367703-497377224.jpg\", \"/uploads/cert_1773394367703-657573947.jpg\"]', 1, '2026-03-13 17:32:47');

-- ----------------------------
-- Table structure for collections
-- ----------------------------
DROP TABLE IF EXISTS `collections`;
CREATE TABLE `collections`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `artwork_id` int NOT NULL COMMENT '作品ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_collection`(`artwork_id`, `user_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '收藏表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of collections
-- ----------------------------
INSERT INTO `collections` VALUES (2, 2, 1, '2026-03-13 01:14:24');
INSERT INTO `collections` VALUES (5, 3, 1, '2026-03-13 01:44:06');
INSERT INTO `collections` VALUES (6, 3, 3, '2026-03-13 02:02:08');
INSERT INTO `collections` VALUES (7, 4, 1, '2026-03-13 13:22:43');
INSERT INTO `collections` VALUES (8, 4, 4, '2026-03-13 17:28:29');
INSERT INTO `collections` VALUES (9, 1, 4, '2026-03-13 17:29:46');

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `artwork_id` int NOT NULL COMMENT '作品ID',
  `user_id` int NOT NULL COMMENT '评论者ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '评论内容',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `parent_id` int NULL DEFAULT NULL COMMENT '父评论ID，若为NULL则是顶级评论',
  `status` tinyint NULL DEFAULT 1 COMMENT '1正常, 0违规(隐藏)',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '评论表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES (1, 1, 1, '嘿嘿', '2026-03-12 17:22:03', NULL, 1);
INSERT INTO `comments` VALUES (2, 2, 1, '你好', '2026-03-13 01:14:21', NULL, 1);
INSERT INTO `comments` VALUES (3, 3, 1, '啊啊', '2026-03-13 01:33:09', NULL, 1);
INSERT INTO `comments` VALUES (4, 3, 3, '嘿嘿', '2026-03-13 01:33:48', NULL, 1);
INSERT INTO `comments` VALUES (5, 3, 3, '???', '2026-03-13 01:36:14', 3, 1);
INSERT INTO `comments` VALUES (6, 3, 1, '回复 @摄影师_5504 : ?', '2026-03-13 01:39:13', 3, 1);
INSERT INTO `comments` VALUES (7, 1, 4, '嘿嘿', '2026-03-13 17:29:27', 1, 1);
INSERT INTO `comments` VALUES (8, 1, 4, '回复 @摄影师_2035 : 嗯嗯', '2026-03-13 17:29:39', 1, 1);

-- ----------------------------
-- Table structure for contest_entries
-- ----------------------------
DROP TABLE IF EXISTS `contest_entries`;
CREATE TABLE `contest_entries`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `contest_id` int NOT NULL COMMENT '比赛ID',
  `user_id` int NOT NULL COMMENT '参赛者ID',
  `artwork_id` int NOT NULL COMMENT '拿来参赛的作品ID',
  `votes` int NULL DEFAULT 0 COMMENT '得票数',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_entry`(`contest_id`, `user_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '比赛投稿记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contest_entries
-- ----------------------------
INSERT INTO `contest_entries` VALUES (1, 1, 1, 1, 1, '2026-03-13 13:48:11');

-- ----------------------------
-- Table structure for contest_votes
-- ----------------------------
DROP TABLE IF EXISTS `contest_votes`;
CREATE TABLE `contest_votes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `contest_id` int NOT NULL,
  `entry_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT '投票人ID',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_vote`(`entry_id`, `user_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '比赛投票记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contest_votes
-- ----------------------------
INSERT INTO `contest_votes` VALUES (1, 1, 1, 1, '2026-03-13 13:48:15');

-- ----------------------------
-- Table structure for contests
-- ----------------------------
DROP TABLE IF EXISTS `contests`;
CREATE TABLE `contests`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '比赛主题',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '比赛详情/规则',
  `cover_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '比赛宣传海报',
  `start_time` datetime(0) NOT NULL COMMENT '开始时间',
  `end_time` datetime(0) NOT NULL COMMENT '结束时间',
  `status` tinyint NULL DEFAULT 1 COMMENT '1:进行中, 0:已结束',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '摄影比赛表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of contests
-- ----------------------------
INSERT INTO `contests` VALUES (1, '2026极光之夜', '2026极光杯', '/uploads/contest-1773380767792.png', '2026-03-13 00:00:00', '2026-03-13 13:55:00', 0, '2026-03-13 13:46:07');
INSERT INTO `contests` VALUES (2, '2026夜之光', '2026夜之光评比', '/uploads/contest-1773468770977.png', '2026-03-14 00:00:00', '2026-03-16 00:00:00', 1, '2026-03-14 14:12:50');

-- ----------------------------
-- Table structure for follows
-- ----------------------------
DROP TABLE IF EXISTS `follows`;
CREATE TABLE `follows`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `follower_id` int NOT NULL COMMENT '粉丝(关注者)ID',
  `following_id` int NOT NULL COMMENT '被关注者(摄影师)ID',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_follow`(`follower_id`, `following_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户关注表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of follows
-- ----------------------------
INSERT INTO `follows` VALUES (1, 2, 1, '2026-03-13 00:47:04');
INSERT INTO `follows` VALUES (4, 3, 1, '2026-03-13 02:02:06');
INSERT INTO `follows` VALUES (6, 1, 3, '2026-03-13 13:05:05');
INSERT INTO `follows` VALUES (7, 4, 3, '2026-03-13 17:28:26');
INSERT INTO `follows` VALUES (8, 4, 1, '2026-03-13 17:30:58');
INSERT INTO `follows` VALUES (9, 1, 4, '2026-03-13 17:31:24');

-- ----------------------------
-- Table structure for likes
-- ----------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `artwork_id` int NOT NULL COMMENT '作品ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_like`(`artwork_id`, `user_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '点赞表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of likes
-- ----------------------------
INSERT INTO `likes` VALUES (3, 1, 1, '2026-03-12 17:21:59');
INSERT INTO `likes` VALUES (4, 2, 1, '2026-03-12 17:26:11');
INSERT INTO `likes` VALUES (5, 3, 3, '2026-03-13 01:34:35');
INSERT INTO `likes` VALUES (6, 3, 1, '2026-03-13 01:44:04');
INSERT INTO `likes` VALUES (7, 4, 1, '2026-03-13 13:22:43');
INSERT INTO `likes` VALUES (8, 4, 4, '2026-03-13 17:28:29');
INSERT INTO `likes` VALUES (9, 1, 4, '2026-03-13 17:29:46');

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL COMMENT '发送者ID',
  `receiver_id` int NOT NULL COMMENT '接收者ID',
  `artwork_id` int NULL DEFAULT NULL COMMENT '如果不为空，说明这是一条\"作品分享\"卡片',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '私信聊天内容',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '互关私信与分享表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES (1, 3, 1, NULL, '你好！！', '2026-03-13 02:03:06');
INSERT INTO `messages` VALUES (2, 1, 3, 3, '【作品分享】快来看看这幅作品！', '2026-03-13 13:06:48');
INSERT INTO `messages` VALUES (3, 1, 3, 4, '【作品分享】快来看看这幅作品！', '2026-03-13 13:22:46');
INSERT INTO `messages` VALUES (4, 4, 3, NULL, '你好', '2026-03-13 17:28:50');
INSERT INTO `messages` VALUES (5, 4, 3, 1, '【作品分享】快来看看这幅作品！', '2026-03-13 17:29:49');
INSERT INTO `messages` VALUES (6, 4, 1, NULL, '你好', '2026-03-13 17:31:02');
INSERT INTO `messages` VALUES (7, 1, 4, NULL, '1', '2026-03-13 17:31:17');
INSERT INTO `messages` VALUES (8, 1, 4, NULL, '1', '2026-03-13 17:31:28');
INSERT INTO `messages` VALUES (9, 1, 4, NULL, '1', '2026-03-13 17:31:28');
INSERT INTO `messages` VALUES (10, 1, 4, 1, '【作品分享】快来看看这幅作品！', '2026-03-13 17:31:45');

-- ----------------------------
-- Table structure for reports
-- ----------------------------
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `artwork_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT '举报人的ID',
  `reason` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '举报理由',
  `status` tinyint NULL DEFAULT 0 COMMENT '0:待处理, 1:已处理',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '作品举报表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of reports
-- ----------------------------
INSERT INTO `reports` VALUES (1, 2, 1, '色情低俗', 1, '2026-03-13 01:17:11');
INSERT INTO `reports` VALUES (2, 2, 1, '色情低俗', 1, '2026-03-13 01:17:59');
INSERT INTO `reports` VALUES (3, 2, 1, '色情低俗', 1, '2026-03-13 01:18:20');
INSERT INTO `reports` VALUES (4, 1, 1, '色情低俗', 1, '2026-03-13 01:19:15');
INSERT INTO `reports` VALUES (5, 1, 1, '色情低俗', 1, '2026-03-13 01:19:22');
INSERT INTO `reports` VALUES (6, 1, 1, '抄袭盗用', 1, '2026-03-13 01:19:33');
INSERT INTO `reports` VALUES (7, 1, 1, '广告引流', 1, '2026-03-13 01:19:42');
INSERT INTO `reports` VALUES (8, 1, 1, '广告引流', 1, '2026-03-13 01:19:53');
INSERT INTO `reports` VALUES (9, 3, 1, '色情低俗', 1, '2026-03-13 01:39:37');

-- ----------------------------
-- Table structure for topic_replies
-- ----------------------------
DROP TABLE IF EXISTS `topic_replies`;
CREATE TABLE `topic_replies`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL COMMENT '所属帖子ID',
  `user_id` int NOT NULL COMMENT '回帖人ID',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '回帖内容',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '论坛回帖表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of topic_replies
-- ----------------------------
INSERT INTO `topic_replies` VALUES (1, 1, 1, '嗯', '2026-03-13 13:35:09');
INSERT INTO `topic_replies` VALUES (2, 1, 4, '啊', '2026-03-13 17:29:08');

-- ----------------------------
-- Table structure for topics
-- ----------------------------
DROP TABLE IF EXISTS `topics`;
CREATE TABLE `topics`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '发帖人ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '帖子标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '帖子内容',
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '帖子附图(JSON格式)',
  `view_count` int NULL DEFAULT 0 COMMENT '浏览量',
  `is_pinned` tinyint NULL DEFAULT 0 COMMENT '1为置顶, 0为普通',
  `is_elite` tinyint NULL DEFAULT 0 COMMENT '1为加精, 0为普通',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '社区论坛帖子表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of topics
-- ----------------------------
INSERT INTO `topics` VALUES (1, 1, '嘿嘿', '哈哈', NULL, 5, 1, 1, '2026-03-13 13:33:35');
INSERT INTO `topics` VALUES (2, 4, '啊啊啊', '啊啊', NULL, 0, 0, 0, '2026-03-13 17:29:02');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '账号(手机/邮箱)',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '加密后的密码',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '个人简介',
  `role` tinyint NOT NULL DEFAULT 0 COMMENT '角色: 0普通用户, 1认证摄影师, 2管理员',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '账号状态: 1正常, 0封禁',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `violation_count` int NULL DEFAULT 0 COMMENT '当前违规次数(满5次封号)',
  `ban_count` int NULL DEFAULT 0 COMMENT '历史封禁次数(满2次永久封禁)',
  `appeal_chances` int NULL DEFAULT 2 COMMENT '当前封禁剩余的申诉次数',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, '15903852598', '$2b$10$kiqRs6DST5qmEWPrxVt/feH3//lqnKqTWG.doUtUheTY400RVcnjG', '小九', '/uploads/avatar_1773335003108.jpg', '你们好呀', 1, 1, '2026-03-11 17:48:56', 1, 0, 2);
INSERT INTO `users` VALUES (2, 'admin', '$2b$10$eolBhFexT2SK/OqxNVQqluRhm/u9.LfuicPSnyaULpAOF6Rck0462', 'ADMIN', NULL, NULL, 2, 1, '2026-03-12 23:24:45', 0, 0, 2);
INSERT INTO `users` VALUES (3, '123456789', '$2b$10$9TIdG2lvjjR2gSnxF6Xc3ebcPh5wxu9ZVJy7Y8A.imzdy7PtM7nZ2', '摄影师_5504', NULL, NULL, 1, 0, '2026-03-13 01:33:32', 5, 1, 1);
INSERT INTO `users` VALUES (4, '1008611', '$2b$10$ednAnjgBZGTYwnpR8gQvleEJE3hYXLysVQF4KssWJb.UqLk6bV34C', '摄影师_2035', NULL, NULL, 1, 1, '2026-03-13 17:28:07', 0, 0, 2);

SET FOREIGN_KEY_CHECKS = 1;
