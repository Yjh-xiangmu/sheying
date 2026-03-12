<template>
  <div class="ranking-container fade-in">
    <div class="ranking-header">
      <h1 class="title">TOP 20 摄影之巅</h1>
      <p class="subtitle">基于全站作品的点赞与浏览热度实时生成，见证每一个光影传奇。</p>
    </div>

    <div v-if="loading" class="loading-state">榜单排位中...</div>

    <div v-else class="ranking-list">
      <div
        class="ranking-item"
        v-for="(item, index) in rankList"
        :key="item.id"
        @click="$router.push(`/artwork/${item.id}`)"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="rank-badge" :class="getRankClass(index)">
          <span v-if="index > 2">{{ index + 1 }}</span>
          <el-icon v-else :size="28"><Trophy /></el-icon>
        </div>

        <div class="cover-wrapper">
          <img :src="`http://localhost:3000${item.cover_url}`" class="cover-img" />
        </div>

        <div class="item-info">
          <h2 class="work-title">{{ item.title }}</h2>
          <div class="author-info">
            <el-avatar :size="24" :src="item.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
            <span class="nickname">{{ item.nickname }}</span>
          </div>
        </div>

        <div class="hot-stats">
          <div class="stat-item">
            <span class="label">热度值</span>
            <span class="score">{{ item.hot_score }}</span>
          </div>
          <div class="stat-minor">
            <span>❤️ {{ item.like_count }}</span>
            <span style="margin-left: 10px;">👁️ {{ item.view_count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Trophy } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const rankList = ref([]);
const loading = ref(true);

// 动态给前三名分配金、银、铜的 CSS 类名
const getRankClass = (index) => {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return 'normal';
};

onMounted(async () => {
  try {
    const res = await request.get('/artworks/ranking');
    rankList.value = res.data;
  } catch (error) {
    ElMessage.error('榜单加载失败');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.ranking-container { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding: 60px 20px; }

.ranking-header { text-align: center; margin-bottom: 50px; }
.ranking-header .title { font-size: 40px; font-weight: 300; letter-spacing: 4px; margin-bottom: 15px; color: #fff; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
.ranking-header .subtitle { color: #888; font-size: 16px; letter-spacing: 1px; }

.loading-state { text-align: center; color: #666; padding: 100px 0; font-size: 16px; }

.ranking-list { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 15px; }

.ranking-item {
  display: flex; align-items: center; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px 20px;
  cursor: pointer; transition: all 0.3s ease;
  opacity: 0; transform: translateY(20px); animation: slideUp 0.5s ease forwards;
}
.ranking-item:hover { background: rgba(255,255,255,0.08); transform: translateX(10px); border-color: rgba(255,255,255,0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

/* 名次徽章样式 */
.rank-badge { width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; font-style: italic; border-radius: 50%; margin-right: 20px; flex-shrink: 0; }
.rank-badge.gold { background: linear-gradient(135deg, #FFD700, #DAA520); color: #000; box-shadow: 0 0 15px rgba(255,215,0,0.5); }
.rank-badge.silver { background: linear-gradient(135deg, #E0E0E0, #9E9E9E); color: #000; box-shadow: 0 0 15px rgba(224,224,224,0.5); }
.rank-badge.bronze { background: linear-gradient(135deg, #CD7F32, #8B4513); color: #fff; box-shadow: 0 0 15px rgba(205,127,50,0.5); }
.rank-badge.normal { color: #666; font-size: 24px; }

.cover-wrapper { width: 120px; height: 80px; border-radius: 8px; overflow: hidden; margin-right: 25px; flex-shrink: 0; }
.cover-img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
.ranking-item:hover .cover-img { transform: scale(1.1); }

.item-info { flex: 1; min-width: 0; }
.work-title { font-size: 20px; font-weight: 500; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.author-info { display: flex; align-items: center; gap: 10px; }
.nickname { color: #aaa; font-size: 14px; }

.hot-stats { text-align: right; min-width: 100px; }
.stat-item { margin-bottom: 5px; }
.stat-item .label { font-size: 12px; color: #888; margin-right: 8px; }
.stat-item .score { font-size: 24px; font-weight: bold; color: #ff4d4f; font-style: italic; }
.stat-minor { font-size: 12px; color: #666; }
</style>