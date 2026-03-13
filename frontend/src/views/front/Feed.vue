<template>
  <div class="feed-container fade-in">
    <div class="feed-header">
      <h2 class="title">关注动态</h2>
      <p class="subtitle">第一时间获取你关注的摄影师的最新光影</p>
    </div>

    <div v-if="loading" class="loading-state">动态加载中...</div>

    <div v-else-if="!isLoggedIn" class="empty-state">
      <el-icon size="50" color="#444"><User /></el-icon>
      <p>请先登录，查看关注摄影师的动态</p>
    </div>

    <div v-else-if="feedList.length === 0" class="empty-state">
      <el-icon size="50" color="#444"><Picture /></el-icon>
      <p>你的动态空空如也，快去发现页关注一些优秀的摄影师吧！</p>
      <el-button type="primary" round plain @click="$router.push('/')">去发现</el-button>
    </div>

    <div v-else class="feed-list">
      <div class="feed-card" v-for="item in feedList" :key="item.id">
        <div class="card-header">
          <div class="author-info" @click="$router.push(`/user/${item.user_id}`)">
            <el-avatar :size="40" :src="getAvatarUrl(item.avatar)" class="avatar" />
            <div class="author-text">
              <div class="nickname">{{ item.nickname }}</div>
              <div class="time">{{ formatTime(item.created_at) }} 发布</div>
            </div>
          </div>
          <el-button type="default" circle title="发私信" @click="$router.push(`/message?chat_with=${item.user_id}`)">
            <el-icon><ChatDotRound /></el-icon>
          </el-button>
        </div>

        <div class="card-image-box" @click="$router.push(`/artwork/${item.id}`)">
          <img :src="`http://localhost:3000${item.cover_url}`" class="cover-img" />
          <div class="image-overlay">
            <span class="view-details">查看详情</span>
          </div>
        </div>

        <div class="card-footer">
          <h3 class="artwork-title" @click="$router.push(`/artwork/${item.id}`)">{{ item.title }}</h3>
          <div class="stats">
            <span class="stat-item"><el-icon><View /></el-icon> {{ item.view_count }}</span>
            <span class="stat-item heart">❤️ {{ item.like_count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// 【修复】从 import 列表中去掉了不存在的 Heart
import { ChatDotRound, View, Picture, User } from '@element-plus/icons-vue';
import request from '../../utils/request';

const feedList = ref([]);
const loading = ref(true);
const isLoggedIn = ref(false);

const getAvatarUrl = (path) => path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 格式化时间为 "刚刚", "几小时前", 或者具体日期
const formatTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 差值秒数

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const loadFeed = async () => {
  loading.value = true;
  const userStr = localStorage.getItem('user');
  if (userStr) {
    isLoggedIn.value = true;
    const user = JSON.parse(userStr);
    try {
      const res = await request.get(`/artworks/feed/${user.id}`);
      feedList.value = res.data;
    } catch (error) {}
  }
  loading.value = false;
};

onMounted(() => {
  loadFeed();
});
</script>

<style scoped>
.feed-container { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding: 40px 20px; }
.feed-header { text-align: center; margin-bottom: 40px; }
.feed-header .title { font-size: 28px; font-weight: 500; letter-spacing: 2px; margin-bottom: 10px; }
.feed-header .subtitle { color: #888; font-size: 14px; }

.loading-state { text-align: center; color: #666; padding: 100px 0; }
.empty-state { text-align: center; color: #555; padding: 100px 0; display: flex; flex-direction: column; align-items: center; gap: 15px; }

.feed-list { max-width: 650px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
.feed-card { background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; transition: transform 0.3s; }
.feed-card:hover { border-color: rgba(255,255,255,0.15); }

.card-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; }
.author-info { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.avatar { border: 1px solid #333; }
.author-text .nickname { font-size: 15px; font-weight: bold; color: #eee; margin-bottom: 4px; }
.author-text .time { font-size: 12px; color: #888; }

.card-image-box { position: relative; width: 100%; cursor: pointer; background: #000; }
.cover-img { width: 100%; max-height: 600px; object-fit: contain; display: block; }
.image-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.3); opacity: 0; transition: 0.3s; display: flex; justify-content: center; align-items: center; }
.card-image-box:hover .image-overlay { opacity: 1; }
.view-details { border: 1px solid #fff; color: #fff; padding: 8px 24px; border-radius: 20px; font-size: 14px; backdrop-filter: blur(4px); }

.card-footer { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
.artwork-title { margin: 0; font-size: 16px; font-weight: 500; cursor: pointer; transition: 0.3s; }
.artwork-title:hover { color: #409eff; }
.stats { display: flex; gap: 15px; color: #888; font-size: 14px; }
.stat-item { display: flex; align-items: center; gap: 5px; }
.stat-item.heart { color: #ff4d4f; }
</style>