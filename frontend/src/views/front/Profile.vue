<template>
  <div class="profile-page fade-in">
    <div class="profile-banner"><div class="banner-overlay"></div></div>
    <div class="profile-container">
      <div class="user-header-section">
        <div class="avatar-upload-wrapper" @click="triggerAvatarUpload">
          <el-avatar :size="130" :src="getAvatarUrl(currentUser?.avatar)" class="avatar" />
          <div class="avatar-mask"><el-icon size="24"><Camera /></el-icon></div>
          <input type="file" ref="avatarInput" accept="image/*" style="display: none" @change="handleAvatarChange" />
        </div>
        <div class="info-details" v-if="!isEditing">
          <div class="name-row">
            <h1 class="nickname">{{ currentUser?.nickname }}</h1>
            <el-button class="edit-btn" plain round size="small" @click="isEditing = true">编辑资料</el-button>
          </div>
          <div class="tags"><span class="role-tag"><el-icon><Medal /></el-icon> {{ currentUser?.role === 1 ? '认证摄影师' : '普通用户' }}</span></div>
          <p class="bio">{{ currentUser?.bio || '用光影记录世界，暂时没有写下简介...' }}</p>
        </div>
        <div class="info-edit-form" v-else>
          <el-input v-model="editForm.nickname" placeholder="昵称" class="dark-input mb-15" size="large" />
          <el-input v-model="editForm.bio" type="textarea" :rows="3" placeholder="一句话介绍自己" class="dark-input mb-15" />
          <div class="edit-actions">
            <el-button type="primary" @click="saveProfile" :loading="saving" round>保存修改</el-button>
            <el-button @click="cancelEdit" plain round>取消</el-button>
          </div>
        </div>
      </div>

      <div class="portfolio-section">
        <el-tabs v-model="activeTab" class="minimal-tabs">
          <el-tab-pane :label="`作品 ${myArtworks.length}`" name="works">
            <div v-if="myArtworks.length === 0" class="empty-state"><p>尚未发布任何作品</p></div>
            <div v-else class="works-grid">
              <div class="work-card" v-for="item in myArtworks" :key="item.id">
                <img :src="`http://localhost:3000${item.cover_url}`" class="work-img" @click="$router.push(`/artwork/${item.id}`)" />
                <div class="work-overlay">
                  <div class="work-meta"><span class="work-title">{{ item.title }}</span></div>
                  <el-button class="action-float-btn" type="danger" circle icon="Delete" @click.stop="handleDeleteArtwork(item.id)" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="`收藏 ${myCollections.length}`" name="collections">
            <div v-if="myCollections.length === 0" class="empty-state"><p>收藏夹空空如也</p></div>
            <div v-else class="works-grid">
              <div class="work-card" v-for="item in myCollections" :key="item.id">
                <img :src="`http://localhost:3000${item.cover_url}`" class="work-img" @click="$router.push(`/artwork/${item.id}`)" />
                <div class="work-overlay">
                  <div class="work-meta"><span class="work-title">{{ item.title }}</span></div>
                  <el-button class="action-float-btn" type="warning" circle icon="StarFilled" @click.stop="handleCancelCollect(item.id)" />
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="`关注 ${followingList.length}`" name="following">
            <div v-if="followingList.length === 0" class="empty-state"><p>还没有关注任何人哦</p></div>
            <div v-else class="user-list-grid">
              <div class="user-card" v-for="user in followingList" :key="user.id">
                <el-avatar :size="60" :src="getAvatarUrl(user.avatar)" @click="$router.push(`/user/${user.id}`)" class="clickable" />
                <div class="user-info" @click="$router.push(`/user/${user.id}`)" style="cursor: pointer;">
                  <div class="user-name">{{ user.nickname }}</div><div class="user-bio">{{ user.bio || '暂无简介' }}</div>
                </div>
                <el-button v-if="isMutual(user.id)" type="info" plain round size="small" @click="handleFollow(user.id)">互相关注</el-button>
                <el-button v-else type="info" plain round size="small" @click="handleFollow(user.id)">已关注</el-button>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane :label="`粉丝 ${followersList.length}`" name="followers">
            <div v-if="followersList.length === 0" class="empty-state"><p>还没有粉丝</p></div>
            <div v-else class="user-list-grid">
              <div class="user-card" v-for="user in followersList" :key="user.id">
                <el-avatar :size="60" :src="getAvatarUrl(user.avatar)" @click="$router.push(`/user/${user.id}`)" class="clickable" />
                <div class="user-info" @click="$router.push(`/user/${user.id}`)" style="cursor: pointer;">
                  <div class="user-name">{{ user.nickname }}</div><div class="user-bio">{{ user.bio || '暂无简介' }}</div>
                </div>
                <el-button v-if="isMutual(user.id)" type="info" plain round size="small" @click="handleFollow(user.id)">互相关注</el-button>
                <el-button v-else type="primary" round size="small" @click="handleFollow(user.id)">回 关</el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Camera, Delete, StarFilled, Picture, Star, Medal } from '@element-plus/icons-vue';
import request from '../../utils/request';
import { useRouter } from 'vue-router';

const router = useRouter();
const currentUser = ref(null);
const activeTab = ref('works');

const myArtworks = ref([]);
const myCollections = ref([]);
const followingList = ref([]);
const followersList = ref([]);

const saving = ref(false);
const isEditing = ref(false);
const editForm = reactive({ id: '', nickname: '', bio: '' });
const avatarInput = ref(null);

const getAvatarUrl = (path) => path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 判断是否互关
const isMutual = (userId) => {
  return followingList.value.some(item => item.id === userId);
};

const refreshFollows = async () => {
  const res = await request.get(`/interaction/follows-list/${currentUser.value.id}`);
  followingList.value = res.data.following || [];
  followersList.value = res.data.followers || [];
};

// 列表里的关注/取消关注/回关 操作
const handleFollow = async (targetId) => {
  try {
    await request.post('/interaction/follow', { follower_id: currentUser.value.id, following_id: targetId });
    await refreshFollows(); // 操作完立刻刷新列表状态
  } catch (error) {}
};

onMounted(async () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
    editForm.id = currentUser.value.id; editForm.nickname = currentUser.value.nickname; editForm.bio = currentUser.value.bio || '';
    request.get(`/user/${currentUser.value.id}/artworks`).then(res => myArtworks.value = res.data);
    request.get(`/user/${currentUser.value.id}/collections`).then(res => myCollections.value = res.data);
    await refreshFollows();
  }
});

const triggerAvatarUpload = () => { avatarInput.value.click(); };
const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('avatar', file); formData.append('id', currentUser.value.id);
  try {
    const res = await request.post('/user/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
    currentUser.value.avatar = res.data; localStorage.setItem('user', JSON.stringify(currentUser.value));
    ElMessage.success('头像更换成功！'); window.location.reload();
  } catch (error) {}
};
const handleDeleteArtwork = (id) => {
  ElMessageBox.confirm('确定要永久删除这部作品吗？', '警告', { type: 'warning' }).then(async () => {
    await request.delete(`/user/artwork/${id}`);
    myArtworks.value = myArtworks.value.filter(item => item.id !== id);
    ElMessage.success('删除成功');
  }).catch(() => {});
};
const handleCancelCollect = async (artwork_id) => {
  try {
    await request.post('/interaction/collect', { artwork_id, user_id: currentUser.value.id });
    myCollections.value = myCollections.value.filter(item => item.id !== artwork_id);
    ElMessage.success('已移出收藏夹');
  } catch (error) {}
};
const cancelEdit = () => { isEditing.value = false; editForm.nickname = currentUser.value.nickname; editForm.bio = currentUser.value.bio || ''; };
const saveProfile = async () => {
  if (!editForm.nickname.trim()) return ElMessage.warning('昵称不能为空');
  saving.value = true;
  try {
    const res = await request.put('/user/update', editForm);
    currentUser.value = res.data; localStorage.setItem('user', JSON.stringify(res.data));
    isEditing.value = false; window.location.reload();
  } catch (error) {} finally { saving.value = false; }
};
</script>

<style scoped>
/* 保持原有样式，仅在 user-card 增加操作按钮布局 */
.profile-page { background-color: #050505; min-height: calc(100vh - 70px); color: #fff; padding-bottom: 80px; }
.profile-banner { width: 100%; height: 350px; background: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop') center center / cover no-repeat; position: relative; }
.banner-overlay { position: absolute; bottom: 0; left: 0; width: 100%; height: 150px; background: linear-gradient(to bottom, rgba(5,5,5,0), rgba(5,5,5,1)); }
.profile-container { max-width: 1200px; margin: -100px auto 0; position: relative; z-index: 10; padding: 0 30px; }
.user-header-section { display: flex; align-items: flex-end; margin-bottom: 50px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.avatar-upload-wrapper { position: relative; cursor: pointer; border-radius: 50%; width: 130px; height: 130px; flex-shrink: 0; border: 4px solid #050505; background: #111; margin-right: 40px; }
.avatar-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; opacity: 0; transition: 0.3s; border-radius: 50%; }
.avatar-upload-wrapper:hover .avatar-mask { opacity: 1; }
.avatar { width: 100%; height: 100%; display: block; }
.info-details { flex: 1; margin-bottom: 10px; }
.name-row { display: flex; align-items: center; gap: 20px; margin-bottom: 10px; }
.nickname { font-size: 36px; font-weight: 600; margin: 0; }
.edit-btn { background: transparent; color: #fff; border-color: rgba(255,255,255,0.3); }
.tags { margin-bottom: 15px; }
.role-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; color: #e6a23c; background: rgba(230, 162, 60, 0.1); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(230, 162, 60, 0.2); }
.bio { color: #888; font-size: 16px; line-height: 1.6; max-width: 600px; margin: 0; }
.info-edit-form { flex: 1; max-width: 500px; margin-bottom: 10px; }
.mb-15 { margin-bottom: 15px; }
:deep(.dark-input .el-input__wrapper), :deep(.dark-input .el-textarea__inner) { background-color: #111; box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset; color: #fff; border-radius: 8px; }
.portfolio-section { width: 100%; }
:deep(.minimal-tabs .el-tabs__item) { color: #666; font-size: 18px; padding: 0 20px; height: 50px; line-height: 50px; font-weight: 400; transition: 0.3s; }
:deep(.minimal-tabs .el-tabs__item.is-active), :deep(.minimal-tabs .el-tabs__item:hover) { color: #fff; }
:deep(.minimal-tabs .el-tabs__nav-wrap::after) { height: 1px; background-color: rgba(255,255,255,0.05); }
:deep(.minimal-tabs .el-tabs__active-bar) { background-color: #fff; height: 2px; }
.works-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; padding-top: 30px; }
.work-card { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4 / 3; background: #111; cursor: pointer; }
.work-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.work-card:hover .work-img { transform: scale(1.05); }
.work-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%); opacity: 0; transition: opacity 0.3s ease; display: flex; flex-direction: column; justify-content: flex-end; }
.work-card:hover .work-overlay { opacity: 1; }
.work-meta { padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
.work-title { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 6px; }
.action-float-btn { position: absolute; top: 15px; right: 15px; transform: scale(0.8); opacity: 0; transition: all 0.3s; }
.work-card:hover .action-float-btn { opacity: 1; transform: scale(1); }
.empty-state { text-align: center; color: #555; padding: 120px 0; }
.user-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; padding-top: 30px; }
.user-card { display: flex; align-items: center; gap: 15px; background: #111; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
.user-card:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.15); }
.user-info { flex: 1; overflow: hidden; }
.user-name { font-size: 16px; color: #fff; font-weight: 500; margin-bottom: 5px; }
.user-bio { font-size: 13px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.clickable { cursor: pointer; }
</style>