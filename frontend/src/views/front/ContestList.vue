<template>
  <div class="contest-list-page fade-in">
    <div class="hero-section">
      <h1 class="hero-title">FOCUS 摄影大赛</h1>
      <p class="hero-subtitle">用镜头定格瞬间，用光影讲述故事。参与赛事，赢取属于你的荣誉。</p>
    </div>

    <div class="contests-container">
      <div v-if="loading" class="loading-state">赛事加载中...</div>

      <div v-else-if="contests.length === 0" class="empty-state">
        <el-icon size="50"><Trophy /></el-icon>
        <p>目前还没有举办任何比赛，敬请期待！</p>
      </div>

      <div v-else class="contests-grid">
        <div
          class="contest-card glass-panel"
          v-for="item in contests" :key="item.id"
          @click="$router.push(`/contest/${item.id}`)"
        >
          <div class="status-badge" :class="item.status === 1 ? 'active' : 'ended'">
            {{ item.status === 1 ? '🔥 进行中' : '已结束' }}
          </div>

          <div class="card-img-wrapper">
            <img :src="item.cover_url.startsWith('http') ? item.cover_url : `http://localhost:3000${item.cover_url}`" class="contest-img" />
          </div>

          <div class="card-content">
            <h2 class="contest-title">{{ item.title }}</h2>
            <div class="contest-meta">
              <span class="time-range"><el-icon><Calendar /></el-icon> {{ formatDate(item.end_time) }} 截止</span>
              <span class="participants"><el-icon><UserFilled /></el-icon> {{ item.participant_count }} 人参赛</span>
            </div>
            <p class="contest-desc">{{ item.description.length > 60 ? item.description.slice(0, 60) + '...' : item.description }}</p>

            <div class="card-action">
              <el-button type="primary" :plain="item.status === 0" class="enter-btn" round>
                {{ item.status === 1 ? '立即参赛 / 投票' : '查看排行榜' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Trophy, Calendar, UserFilled } from '@element-plus/icons-vue';
import request from '../../utils/request';

const contests = ref([]);
const loading = ref(true);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const fetchContests = async () => {
  loading.value = true;
  try {
    const res = await request.get('/contest/list');
    contests.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

onMounted(() => { fetchContests(); });
</script>

<style scoped>
.contest-list-page { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding-bottom: 80px; }

/* 巨幕区域 */
.hero-section { width: 100%; height: 350px; background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=2000&auto=format&fit=crop') center center / cover no-repeat; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
.hero-title { font-size: 48px; letter-spacing: 6px; font-weight: 600; margin-bottom: 20px; color: #fff; text-shadow: 0 4px 20px rgba(0,0,0,0.8); }
.hero-subtitle { font-size: 16px; color: #ccc; max-width: 600px; line-height: 1.6; }

/* 赛事列表 */
.contests-container { max-width: 1200px; margin: 0 auto; padding: 50px 20px; }
.loading-state, .empty-state { text-align: center; color: #666; padding: 100px 0; display: flex; flex-direction: column; align-items: center; gap: 15px; font-size: 16px; }

.contests-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 40px; }

/* 卡片样式 */
.contest-card { position: relative; border-radius: 16px; overflow: hidden; background: #111; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.4s; display: flex; flex-direction: column; }
.contest-card:hover { transform: translateY(-10px); border-color: #409eff; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }

.status-badge { position: absolute; top: 15px; left: 15px; z-index: 10; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; backdrop-filter: blur(10px); }
.status-badge.active { background: rgba(245, 108, 108, 0.8); color: #fff; box-shadow: 0 4px 10px rgba(245, 108, 108, 0.3); }
.status-badge.ended { background: rgba(255, 255, 255, 0.2); color: #ccc; }

.card-img-wrapper { width: 100%; height: 220px; overflow: hidden; }
.contest-img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
.contest-card:hover .contest-img { transform: scale(1.05); }

.card-content { padding: 25px; display: flex; flex-direction: column; flex: 1; }
.contest-title { font-size: 20px; font-weight: 600; margin: 0 0 15px; color: #eee; }
.contest-meta { display: flex; justify-content: space-between; font-size: 13px; color: #888; margin-bottom: 15px; }
.contest-meta span { display: flex; align-items: center; gap: 5px; }
.contest-desc { font-size: 14px; color: #aaa; line-height: 1.6; flex: 1; margin-bottom: 25px; }

.card-action { text-align: right; }
.enter-btn { width: 100%; font-weight: bold; letter-spacing: 1px; }
</style>