<template>
  <div class="user-space-page fade-in" v-if="targetUser">
    <div class="profile-banner"><div class="banner-overlay"></div></div>
    <div class="profile-container">
      <div class="user-header-section">
        <el-avatar :size="130" :src="getAvatarUrl(targetUser.avatar)" class="avatar" />

        <div class="info-details">
          <div class="name-row">
            <h1 class="nickname">{{ targetUser.nickname }}</h1>
            <div class="action-buttons">
              <el-button :type="isFollowing ? 'info' : 'primary'" :plain="!isFollowing" round @click="toggleFollow">
                {{ isFollowing ? '已关注' : '+ 关注' }}
              </el-button>
              <el-button type="default" plain round @click="goToMessage" title="发私信">
                <el-icon size="16"><ChatDotRound /></el-icon> 私信
              </el-button>
            </div>
          </div>
          <div class="tags">
            <span class="role-tag"><el-icon><Medal /></el-icon> {{ targetUser.role === 1 ? '认证摄影师' : '摄影爱好者' }}</span>
          </div>
          <p class="bio">{{ targetUser.bio || '这个人很酷，什么也没写...' }}</p>
        </div>
      </div>

      <div class="portfolio-section">
        <h3 class="section-title">Ta 的作品 ({{ taArtworks.length }})</h3>
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="taArtworks.length === 0" class="empty-state">
          <p>Ta 还没有发布过作品</p>
        </div>
        <div v-else class="works-grid">
          <div class="work-card" v-for="item in taArtworks" :key="item.id" @click="$router.push(`/artwork/${item.id}`)">
            <img :src="`http://localhost:3000${item.cover_url}`" class="work-img" />
            <div class="work-overlay">
              <span class="work-title">{{ item.title }}</span>
              <span class="work-stats">❤️ {{ item.like_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChatDotRound, Medal } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const targetUser = ref(null);
const taArtworks = ref([]);
const isFollowing = ref(false);
const loading = ref(true);

const getAvatarUrl = (path) => path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const checkLogin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) { ElMessage.warning('请先登录'); return null; }
  return JSON.parse(userStr);
};

const loadData = async () => {
  const userId = route.params.id;
  try {
    const infoRes = await request.get(`/interaction/user-info/${userId}`);
    targetUser.value = infoRes.data;

    const artsRes = await request.get(`/user/${userId}/artworks`);
    taArtworks.value = artsRes.data;

    const user = checkLogin();
    if (user) {
      const followRes = await request.get(`/interaction/check_follow?follower_id=${user.id}&following_id=${userId}`);
      isFollowing.value = followRes.data.isFollowing;
    }
  } catch (error) {} finally { loading.value = false; }
};

const toggleFollow = async () => {
  const user = checkLogin();
  if (!user) return;
  try {
    const res = await request.post('/interaction/follow', { follower_id: user.id, following_id: targetUser.value.id });
    isFollowing.value = res.data.isFollowing;
    ElMessage.success(res.message);
  } catch (error) {}
};

const goToMessage = () => {
  const user = checkLogin();
  if (!user) return;
  router.push(`/message?chat_with=${targetUser.value.id}`);
};

onMounted(() => { loadData(); });
</script>

<style scoped>
.user-space-page { background-color: #050505; min-height: calc(100vh - 70px); color: #fff; padding-bottom: 80px; }
.profile-banner { width: 100%; height: 350px; background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop') center center / cover no-repeat; position: relative; }
.banner-overlay { position: absolute; bottom: 0; left: 0; width: 100%; height: 150px; background: linear-gradient(to bottom, rgba(5,5,5,0), rgba(5,5,5,1)); }
.profile-container { max-width: 1200px; margin: -100px auto 0; position: relative; z-index: 10; padding: 0 30px; }
.user-header-section { display: flex; align-items: flex-end; margin-bottom: 50px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.avatar { border: 4px solid #050505; background: #111; margin-right: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.info-details { flex: 1; margin-bottom: 10px; }
.name-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
.nickname { font-size: 36px; font-weight: 600; margin: 0; }
.action-buttons { display: flex; gap: 15px; }
.tags { margin-bottom: 15px; }
.role-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: #e6a23c; background: rgba(230, 162, 60, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(230, 162, 60, 0.2); }
.bio { color: #888; font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0; }
.portfolio-section { width: 100%; }
.section-title { font-size: 20px; font-weight: 500; margin-bottom: 30px; color: #fff; border-left: 4px solid #fff; padding-left: 10px; }
.works-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.work-card { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4 / 3; background: #111; cursor: pointer; }
.work-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.work-card:hover .work-img { transform: scale(1.05); }
.work-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%); opacity: 0; transition: opacity 0.3s ease; display: flex; justify-content: space-between; align-items: flex-end; padding: 20px; }
.work-card:hover .work-overlay { opacity: 1; }
.work-title { font-size: 16px; font-weight: 500; color: #fff; }
.work-stats { font-size: 13px; color: #aaa; }
.empty-state { text-align: center; color: #555; padding: 100px 0; }
</style>