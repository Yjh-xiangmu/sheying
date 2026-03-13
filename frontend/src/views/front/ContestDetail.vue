<template>
  <div class="contest-detail-page fade-in" v-if="contestInfo">
    <div class="contest-banner" :style="{ backgroundImage: `url(${getMediaUrl(contestInfo.cover_url)})` }">
      <div class="banner-overlay">
        <div class="banner-content">
          <div class="status-tag" :class="contestInfo.status === 1 ? 'active' : 'ended'">
            {{ contestInfo.status === 1 ? '🔥 比赛进行中' : '已结束' }}
          </div>
          <h1 class="title">{{ contestInfo.title }}</h1>
          <div class="time-info">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(contestInfo.start_time) }} 至 {{ formatDate(contestInfo.end_time) }}
          </div>
          <div class="action-row">
            <el-button
              type="primary"
              size="large"
              round
              class="join-btn"
              :disabled="contestInfo.status === 0"
              @click="openJoinDialog"
            >
              {{ contestInfo.status === 1 ? '我要参赛 / 投稿' : '比赛已结束，停止投稿' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="main-container">
      <div class="rules-section glass-panel">
        <h3 class="section-title"><el-icon><Document /></el-icon> 赛事详情与规则</h3>
        <p class="rules-text">{{ contestInfo.description }}</p>
      </div>

      <div class="leaderboard-section">

        <div class="section-header" v-if="contestInfo.status === 1">
          <h3 class="section-title"><el-icon><Trophy /></el-icon> 参赛作品实时排行榜 ({{ entries.length }})</h3>
        </div>

        <div class="result-announcement" v-else>
          <h3 class="result-title"><el-icon><Medal /></el-icon> 🏆 比赛结果公布：最终获奖名单</h3>
          <p class="result-sub">本次比赛已圆满结束，感谢所有摄影师的精彩呈现，恭喜以下上榜作品！</p>
        </div>

        <div v-if="entries.length === 0" class="empty-state">
          <p>目前还没有人参赛，快来抢占第一名的宝座吧！</p>
        </div>

        <div v-else class="entries-grid">
          <div class="entry-card glass-panel" v-for="(entry, index) in entries" :key="entry.entry_id">
            <div class="rank-badge" :class="'rank-' + (index + 1)">
              {{ index < 3 ? ['🥇','🥈','🥉'][index] : `No.${index + 1}` }}
            </div>

            <div class="entry-img-box" @click="$router.push(`/artwork/${entry.artwork_id}`)">
              <img :src="getMediaUrl(entry.cover_url)" class="entry-img" />
              <div class="img-mask">查看作品</div>
            </div>

            <div class="entry-info">
              <h4 class="artwork-title" @click="$router.push(`/artwork/${entry.artwork_id}`)">{{ entry.artwork_title }}</h4>
              <div class="author" @click="$router.push(`/user/${entry.user_id}`)">
                <el-avatar :size="24" :src="getMediaUrl(entry.avatar)" />
                <span>{{ entry.nickname }}</span>
              </div>
            </div>

            <div class="vote-action">
              <div class="vote-count"><span>{{ entry.votes }}</span> 票</div>
              <el-button
                :type="contestInfo.status === 1 ? 'danger' : 'info'"
                plain
                round
                size="small"
                @click="handleVote(entry.entry_id)"
                :disabled="contestInfo.status === 0"
              >
                <el-icon v-if="contestInfo.status === 1"><Pointer /></el-icon>
                {{ contestInfo.status === 1 ? '投一票' : '投票已截止' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showJoinDialog" title="选择作品参赛" width="700px" center custom-class="dark-dialog">
      <div class="dialog-desc">请从您已发布的作品中选择一幅作为参赛稿件。注意：每人只能投稿一次。</div>

      <div v-if="loadingMyWorks" class="loading-state">加载您的作品库中...</div>

      <div v-else-if="myArtworks.length === 0" class="empty-state" style="padding: 40px 0;">
        <p>您还没有发布过任何作品哦！</p>
        <el-button type="primary" round @click="$router.push('/upload')">去发布作品</el-button>
      </div>

      <div v-else class="my-works-grid">
        <div
          class="my-work-card"
          v-for="work in myArtworks"
          :key="work.id"
          :class="{ selected: selectedArtworkId === work.id }"
          @click="selectedArtworkId = work.id"
        >
          <img :src="getMediaUrl(work.cover_url)" />
          <div class="work-title">{{ work.title }}</div>
          <div class="select-mask" v-if="selectedArtworkId === work.id">
            <el-icon size="30" color="#67c23a"><Select /></el-icon>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showJoinDialog = false" plain round>取消</el-button>
          <el-button type="primary" @click="submitEntry" :loading="submitting" :disabled="!selectedArtworkId" round>
            确认投稿
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Calendar, Document, Trophy, Pointer, Select, Medal } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();

const contestInfo = ref(null);
const entries = ref([]);

// 投稿相关状态
const showJoinDialog = ref(false);
const myArtworks = ref([]);
const loadingMyWorks = ref(false);
const selectedArtworkId = ref(null);
const submitting = ref(false);

const getMediaUrl = (path) => {
  if (!path) return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
  return path.startsWith('http') ? path : `http://localhost:3000${path}`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const checkLogin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) { ElMessage.warning('请先登录后再进行操作'); return null; }
  return JSON.parse(userStr);
};

// 拉取比赛详情与排行榜
const loadContestDetail = async () => {
  try {
    const res = await request.get(`/contest/detail/${route.params.id}`);
    if (res.code === 200) {
      contestInfo.value = res.data.info;
      entries.value = res.data.entries;
    } else {
      ElMessage.error(res.message);
      router.push('/contests');
    }
  } catch (error) {}
};

// 投票操作
const handleVote = async (entryId) => {
  const user = checkLogin();
  if (!user) return;
  try {
    const res = await request.post('/contest/vote', {
      contest_id: contestInfo.value.id,
      entry_id: entryId,
      user_id: user.id
    });
    if (res.code === 200) {
      ElMessage.success('投票成功！');
      loadContestDetail(); // 刷新排行榜
    } else {
      ElMessage.warning(res.message);
    }
  } catch (error) {}
};

// 打开投稿弹窗并加载我的作品
const openJoinDialog = async () => {
  const user = checkLogin();
  if (!user) return;

  showJoinDialog.value = true;
  selectedArtworkId.value = null;
  loadingMyWorks.value = true;
  try {
    const res = await request.get(`/user/${user.id}/artworks`);
    myArtworks.value = res.data;
  } catch (error) {} finally { loadingMyWorks.value = false; }
};

// 确认投稿
const submitEntry = async () => {
  const user = checkLogin();
  if (!user || !selectedArtworkId.value) return;

  submitting.value = true;
  try {
    const res = await request.post('/contest/join', {
      contest_id: contestInfo.value.id,
      user_id: user.id,
      artwork_id: selectedArtworkId.value
    });
    if (res.code === 200) {
      ElMessage.success('投稿成功！');
      showJoinDialog.value = false;
      loadContestDetail(); // 刷新列表，你的作品就会出现在榜单里
    } else {
      ElMessage.warning(res.message);
    }
  } catch (error) {} finally { submitting.value = false; }
};

onMounted(() => { loadContestDetail(); });
</script>

<style scoped>
.contest-detail-page { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding-bottom: 80px; }

/* 头部海报区 */
.contest-banner { width: 100%; height: 400px; background-size: cover; background-position: center; position: relative; }
.banner-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%); display: flex; align-items: center; padding: 0 10%; }
.banner-content { max-width: 600px; }
.status-tag { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 20px; }
.status-tag.active { background: #f56c6c; color: #fff; box-shadow: 0 4px 15px rgba(245,108,108,0.4); }
.status-tag.ended { background: rgba(255,255,255,0.2); color: #ccc; backdrop-filter: blur(5px); }
.title { font-size: 42px; font-weight: 700; margin: 0 0 20px 0; letter-spacing: 2px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.time-info { font-size: 16px; color: #ddd; display: flex; align-items: center; gap: 8px; margin-bottom: 30px; }
.join-btn { font-size: 16px; font-weight: bold; padding: 0 40px; }

/* 主体容器 */
.main-container { max-width: 1200px; margin: -40px auto 0; position: relative; z-index: 10; padding: 0 20px; display: flex; flex-direction: column; gap: 30px; }
.glass-panel { background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

/* 规则详情 */
.section-title { font-size: 20px; font-weight: 500; margin: 0 0 20px 0; display: flex; align-items: center; gap: 10px; color: #eee; }
.rules-text { font-size: 15px; color: #aaa; line-height: 1.8; white-space: pre-wrap; }

/* 排行榜区 */
.leaderboard-section { padding-top: 20px; }
.section-header { margin-bottom: 30px; }

/* 【新增】结果公布样式 */
.result-announcement { text-align: center; padding: 20px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); margin-bottom: 30px; background: linear-gradient(90deg, transparent, rgba(230,162,60,0.1), transparent); }
.result-title { font-size: 26px; color: #e6a23c; margin: 0 0 10px 0; display: flex; align-items: center; justify-content: center; gap: 10px; text-shadow: 0 2px 10px rgba(230,162,60,0.4); }
.result-sub { color: #aaa; font-size: 14px; margin: 0; }

.empty-state { text-align: center; color: #666; padding: 80px 0; background: #111; border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1); }

/* 参赛作品网格 */
.entries-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 25px; }
.entry-card { padding: 15px; display: flex; flex-direction: column; gap: 15px; position: relative; transition: 0.3s; }
.entry-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.15); }

/* 排名徽章 */
.rank-badge { position: absolute; top: 0; left: 15px; transform: translateY(-50%); padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.rank-1 { background: linear-gradient(135deg, #ffd700, #daa520); color: #000; font-size: 16px; padding: 6px 15px; }
.rank-2 { background: linear-gradient(135deg, #e0e0e0, #9e9e9e); color: #000; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #8b4513); color: #fff; }
.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) { background: #333; color: #aaa; border: 1px solid #444; }

.entry-img-box { width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; cursor: pointer; }
.entry-img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
.entry-card:hover .entry-img { transform: scale(1.05); }
.img-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.5); opacity: 0; transition: 0.3s; display: flex; justify-content: center; align-items: center; color: #fff; font-weight: bold; }
.entry-img-box:hover .img-mask { opacity: 1; }

.entry-info { flex: 1; }
.artwork-title { margin: 0 0 8px 0; font-size: 16px; color: #eee; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.artwork-title:hover { color: #409eff; }
.author { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #888; cursor: pointer; }
.author:hover { color: #ccc; }

.vote-action { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
.vote-count { color: #f56c6c; font-size: 13px; }
.vote-count span { font-size: 20px; font-weight: bold; margin-right: 2px; }

/* 投稿弹窗作品选择网格 */
.dialog-desc { color: #aaa; font-size: 14px; margin-bottom: 20px; text-align: center; }
.my-works-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; max-height: 400px; overflow-y: auto; padding: 5px; }
.my-work-card { border-radius: 8px; overflow: hidden; cursor: pointer; position: relative; border: 2px solid transparent; transition: 0.3s; }
.my-work-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
.my-work-card .work-title { padding: 8px; background: #1a1a1c; font-size: 12px; color: #ccc; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.my-work-card.selected { border-color: #67c23a; transform: scale(0.98); }
.select-mask { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; }

:deep(.dark-dialog) { background: #1a1a1c; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
:deep(.dark-dialog .el-dialog__title) { color: #fff; font-weight: 500; }
</style>