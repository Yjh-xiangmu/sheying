<template>
  <div class="artwork-detail-page" v-if="artwork">
    <div class="image-showcase">
      <div class="glass-bg" :style="{ backgroundImage: `url(http://localhost:3000${artwork.cover_url})` }"></div>
      <el-carousel v-if="parsedImages.length > 1" class="main-carousel scale-in" :interval="5000" arrow="hover" indicator-position="outside" height="75vh">
        <el-carousel-item v-for="(imgUrl, index) in parsedImages" :key="index">
          <div class="carousel-img-wrapper"><img :src="`http://localhost:3000${imgUrl}`" class="carousel-img" /></div>
        </el-carousel-item>
      </el-carousel>
      <img v-else :src="`http://localhost:3000${parsedImages[0]}`" class="main-image scale-in" />
    </div>

    <div class="detail-container slide-up">
      <div class="content-wrapper">
        <div class="main-content">
          <div class="title-header">
            <h1 class="title">{{ artwork.title }}</h1>
            <el-button class="report-btn" type="danger" link @click="showReportDialog = true" title="举报该作品">
              <el-icon size="16"><Warning /></el-icon> 举报
            </el-button>
          </div>

          <div class="meta-tags">
            <span class="tag">📌 {{ artwork.category_name }}</span>
            <span class="tag">👁️ {{ artwork.view_count }} 浏览</span>
            <span class="tag">❤️ {{ artwork.like_count }} 喜欢</span>
            <span class="tag">🕒 {{ formatDate(artwork.created_at) }}</span>
          </div>

          <div class="description-box" v-if="artwork.description">
            <div class="desc-title">作品背后的故事</div>
            <p class="desc-text">{{ artwork.description }}</p>
          </div>

          <div class="comments-section">
            <div class="section-title">评论区 <span class="count">{{ comments.length }}</span></div>

            <div class="comment-input-box" :class="{ 'is-replying': replyTarget }">
              <div v-if="replyTarget" class="reply-tip">
                正在回复 <span>@{{ replyTarget.nickname }}</span>
                <el-icon class="cancel-reply" @click="cancelReply"><Close /></el-icon>
              </div>
              <el-input
                v-model="commentContent"
                type="textarea" :rows="3"
                :placeholder="replyTarget ? `回复 @${replyTarget.nickname}...` : '留下你的专业见解...'"
                class="dark-input"
              />
              <div class="input-actions">
                <el-button type="primary" class="submit-comment-btn" @click="submitComment" :loading="commenting" round>
                  {{ replyTarget ? '发送回复' : '发表评论' }}
                </el-button>
              </div>
            </div>

            <div class="comments-list">
              <div class="comment-item" v-for="item in comments" :key="item.id">
                <el-avatar :size="45" :src="getAvatarUrl(item.avatar)" class="comment-avatar" @click="$router.push(`/user/${item.user_id}`)" style="cursor: pointer;" />
                <div class="comment-content-wrapper">
                  <div class="comment-header">
                    <span class="comment-user" @click="$router.push(`/user/${item.user_id}`)" style="cursor: pointer;">{{ item.nickname }}</span>
                    <span class="comment-time">{{ formatTime(item.created_at) }}</span>
                  </div>
                  <p class="comment-text">{{ item.content }}</p>
                  <div class="comment-actions">
                    <span class="reply-btn" @click="handleReply(item, item.id)">回复</span>
                  </div>

                  <div class="replies-list" v-if="item.replies && item.replies.length > 0">
                    <div class="reply-item" v-for="reply in item.replies" :key="reply.id">
                      <el-avatar :size="30" :src="getAvatarUrl(reply.avatar)" class="reply-avatar" @click="$router.push(`/user/${reply.user_id}`)" style="cursor: pointer;" />
                      <div class="reply-content-wrapper">
                        <div class="reply-header">
                          <span class="reply-user" @click="$router.push(`/user/${reply.user_id}`)" style="cursor: pointer;">{{ reply.nickname }}</span>
                          <span class="reply-time">{{ formatTime(reply.created_at) }}</span>
                        </div>
                        <p class="reply-text">{{ reply.content }}</p>
                        <div class="comment-actions sub-actions">
                          <span class="reply-btn" @click="handleReply(reply, item.id)">回复</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="sidebar">
          <div class="author-card">
            <el-avatar :size="90" :src="getAvatarUrl(artwork.avatar)" class="author-avatar" @click="$router.push(`/user/${artwork.user_id}`)" style="cursor: pointer;" />
            <h3 class="author-name" @click="$router.push(`/user/${artwork.user_id}`)" style="cursor: pointer;">{{ artwork.nickname }}</h3>
            <p class="author-bio">{{ artwork.bio || '用光影记录世界，暂时没有写下简介...' }}</p>

            <div class="author-actions">
              <el-button :type="isFollowing ? 'info' : 'primary'" :plain="!isFollowing" class="follow-btn" round @click="toggleFollow">
                {{ isFollowing ? '已关注' : '+ 关注摄影师' }}
              </el-button>
              <el-button class="msg-btn" type="default" plain round @click="goToMessage" title="发私信">
                <el-icon size="18"><ChatDotRound /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="action-card">
            <div class="action-item" @click="toggleLike">
              <button class="action-btn like-btn" title="点赞">
                <svg class="heart-icon" :class="{ 'is-liked': isLiked }" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
              <span class="action-label">{{ isLiked ? '已点赞' : '点赞' }}</span>
            </div>
            <div class="action-item" @click="toggleCollect">
              <button class="action-btn collect-btn" :class="{ 'is-collected': isCollected }" title="收藏"><el-icon :size="22"><StarFilled v-if="isCollected" /><Star v-else /></el-icon></button>
              <span class="action-label">{{ isCollected ? '已收藏' : '收藏' }}</span>
            </div>
            <div class="action-item" @click="openShareDialog">
              <button class="action-btn share-btn" title="分享"><el-icon :size="22"><Share /></el-icon></button>
              <span class="action-label">分享</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showReportDialog" title="举报违规作品" width="400px" center custom-class="dark-dialog">
      <div class="report-desc">请选择您要举报的违规类型，管理员会尽快核实处理。</div>
      <el-form label-position="top">
        <el-form-item>
          <el-radio-group v-model="reportReason" direction="vertical" class="report-radios">
            <el-radio label="色情低俗">色情低俗</el-radio>
            <el-radio label="政治敏感">政治敏感</el-radio>
            <el-radio label="抄袭盗用">抄袭盗用 (非原创)</el-radio>
            <el-radio label="广告引流">垃圾广告引流</el-radio>
            <el-radio label="其他原因">其他违规原因</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="reportReason === '其他原因'">
          <el-input v-model="customReportReason" type="textarea" :rows="3" placeholder="请详细描述..." class="dark-input"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReportDialog = false" plain round>取消</el-button>
          <el-button type="danger" @click="submitReport" :loading="reporting" round>提交举报</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showShareDialog" title="分享给朋友" width="400px" center custom-class="dark-dialog">
      <div class="share-header">私信发送给：</div>
      <div class="share-friends-list" v-loading="loadingFriends">
        <div v-if="shareFriends.length === 0" class="empty-state">暂无联系人，快去关注摄影师吧</div>
        <div
          v-else
          class="share-friend-item"
          v-for="friend in shareFriends"
          :key="friend.id"
          @click="confirmShare(friend)"
        >
          <el-avatar :size="40" :src="getAvatarUrl(friend.avatar)" />
          <div class="share-friend-info">
            <span class="name">{{ friend.nickname }}</span>
            <span v-if="friend.isStranger" class="tag">未关注</span>
          </div>
          <el-button type="primary" size="small" round>发送</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Share, Star, StarFilled, Warning, Close, ChatDotRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const artwork = ref(null);
const comments = ref([]);
const commentContent = ref('');

const replyTarget = ref(null);

const isLiked = ref(false);
const isCollected = ref(false);
const isFollowing = ref(false);
const commenting = ref(false);

const showReportDialog = ref(false);
const reportReason = ref('色情低俗');
const customReportReason = ref('');
const reporting = ref(false);

// 【新增】分享相关状态
const showShareDialog = ref(false);
const shareFriends = ref([]);
const loadingFriends = ref(false);

const getAvatarUrl = (path) => {
  return path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
};

const parsedImages = computed(() => {
  if (!artwork.value) return [];
  if (artwork.value.images) {
    try { return typeof artwork.value.images === 'string' ? JSON.parse(artwork.value.images) : artwork.value.images; } catch (e) { return [artwork.value.cover_url]; }
  }
  return [artwork.value.cover_url];
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const checkLogin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) { ElMessage.warning('请先登录'); return null; }
  return JSON.parse(userStr);
};

const fetchComments = async (id) => {
  try {
    const res = await request.get(`/interaction/comments/${id}`);
    comments.value = res.data;
  } catch (error) {}
};

const handleReply = (targetUserItem, topLevelId) => {
  replyTarget.value = {
    parentId: topLevelId,
    nickname: targetUserItem.nickname,
    isSub: targetUserItem.id !== topLevelId
  };
  commentContent.value = '';
  window.scrollTo({ top: document.querySelector('.comments-section').offsetTop - 100, behavior: 'smooth' });
};

const cancelReply = () => {
  replyTarget.value = null;
  commentContent.value = '';
};

const submitComment = async () => {
  const user = checkLogin();
  if (!user) return;
  let finalContent = commentContent.value.trim();
  if (!finalContent) return ElMessage.warning('评论内容不能为空');
  if (replyTarget.value && replyTarget.value.isSub) {
    finalContent = `回复 @${replyTarget.value.nickname} : ${finalContent}`;
  }
  commenting.value = true;
  try {
    const payload = { artwork_id: artwork.value.id, user_id: user.id, content: finalContent, parent_id: replyTarget.value ? replyTarget.value.parentId : null };
    const res = await request.post('/interaction/comment', payload);
    if(res.message.includes('审核')) { ElMessage.warning(res.message); } else { ElMessage.success('评论成功'); }
    commentContent.value = ''; replyTarget.value = null; await fetchComments(artwork.value.id);
  } catch (error) {} finally { commenting.value = false; }
};

const toggleFollow = async () => {
  const user = checkLogin();
  if (!user) return;
  try {
    const res = await request.post('/interaction/follow', { follower_id: user.id, following_id: artwork.value.user_id });
    if (res.code === 200) {
      isFollowing.value = res.data.isFollowing;
      ElMessage.success(res.message);
    } else { ElMessage.warning(res.message); }
  } catch (error) {}
};

const goToMessage = () => {
  const user = checkLogin();
  if (!user) return;
  router.push(`/message?chat_with=${artwork.value.user_id}`);
};

const toggleLike = async () => {
  const user = checkLogin();
  if (!user) return;
  try {
    const res = await request.post('/interaction/like', { artwork_id: artwork.value.id, user_id: user.id });
    isLiked.value = res.data.isLiked;
    if (isLiked.value) { artwork.value.like_count++; } else { artwork.value.like_count--; }
  } catch (error) {}
};

const toggleCollect = async () => {
  const user = checkLogin();
  if (!user) return;
  try {
    const res = await request.post('/interaction/collect', { artwork_id: artwork.value.id, user_id: user.id });
    isCollected.value = res.data.isCollected;
    ElMessage.success(res.message);
  } catch (error) {}
};

// 【新增核心逻辑】打开分享弹窗并加载联系人
const openShareDialog = async () => {
  const user = checkLogin();
  if (!user) return;

  showShareDialog.value = true;
  loadingFriends.value = true;
  try {
    const res = await request.get(`/interaction/friends/${user.id}`);
    shareFriends.value = res.data;
  } catch (error) {
    ElMessage.error('获取联系人失败');
  } finally {
    loadingFriends.value = false;
  }
};

// 【新增核心逻辑】确认发送给某个朋友
const confirmShare = async (friend) => {
  const user = checkLogin();
  if (!user) return;

  try {
    await request.post('/interaction/message', {
      sender_id: user.id,
      receiver_id: friend.id,
      content: '【作品分享】快来看看这幅作品！',
      artwork_id: artwork.value.id
    });
    ElMessage.success(`成功分享给 ${friend.nickname}`);
    showShareDialog.value = false;

    // 分享完后可以选择是否跳过去聊天
    router.push(`/message?chat_with=${friend.id}`);
  } catch (error) {
    ElMessage.error('分享失败');
  }
};

const submitReport = async () => {
  const user = checkLogin();
  if (!user) return;
  let finalReason = reportReason.value;
  if (finalReason === '其他原因') {
    if (!customReportReason.value.trim()) return ElMessage.warning('请填写具体的违规原因');
    finalReason = `其他原因: ${customReportReason.value.trim()}`;
  }
  reporting.value = true;
  try {
    const res = await request.post('/interaction/report', { artwork_id: artwork.value.id, user_id: user.id, reason: finalReason });
    if(res.code === 200) {
        ElMessage.success(res.message); showReportDialog.value = false; reportReason.value = '色情低俗'; customReportReason.value = '';
    } else { ElMessage.warning(res.message); }
  } catch (error) {} finally { reporting.value = false; }
};

onMounted(async () => {
  const id = route.params.id;
  try {
    const res = await request.get(`/artworks/detail/${id}`);
    artwork.value = res.data;
    await fetchComments(id);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      request.get(`/interaction/check_like?artwork_id=${id}&user_id=${user.id}`).then(res => { isLiked.value = res.data.isLiked; });
      request.get(`/interaction/check_collect?artwork_id=${id}&user_id=${user.id}`).then(res => { isCollected.value = res.data.isCollected; });
      request.get(`/interaction/check_follow?follower_id=${user.id}&following_id=${artwork.value.user_id}`).then(res => { isFollowing.value = res.data.isFollowing; });
    }
  } catch (error) {}
});
</script>

<style scoped>
.artwork-detail-page { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding-bottom: 80px; }
.image-showcase { position: relative; width: 100%; height: 80vh; display: flex; justify-content: center; align-items: center; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.05); }
.glass-bg { position: absolute; inset: -50px; background-size: cover; background-position: center; filter: blur(50px) brightness(0.25); z-index: 0; animation: pulseBg 15s infinite alternate ease-in-out; }
@keyframes pulseBg { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
.main-carousel { width: 100%; max-width: 1200px; z-index: 1; }
.carousel-img-wrapper { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
.carousel-img, .main-image { max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px; box-shadow: 0 30px 60px rgba(0,0,0,0.9); }
:deep(.el-carousel__indicators--outside button) { background-color: rgba(255,255,255,0.3); height: 4px; border-radius: 2px;}
:deep(.el-carousel__indicator.is-active button) { background-color: #fff; width: 20px; }
:deep(.el-carousel__arrow) { background-color: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); width: 50px; height: 50px; font-size: 24px; backdrop-filter: blur(4px);}
:deep(.el-carousel__arrow:hover) { background-color: rgba(255,255,255,0.15); }
.scale-in { opacity: 0; transform: scale(0.95); animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes scaleIn { to { opacity: 1; transform: scale(1); } }
.detail-container { max-width: 1200px; margin: 0 auto; padding: 50px 20px; position: relative; z-index: 2; }
.slide-up { opacity: 0; transform: translateY(40px); animation: slideUp 0.8s ease forwards 0.2s; }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
.content-wrapper { display: flex; gap: 60px; align-items: flex-start; }
.main-content { flex: 1; min-width: 0; }
.title-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
.title { font-size: 34px; letter-spacing: 1px; font-weight: 600; margin: 0; line-height: 1.3; }
.report-btn { margin-top: 8px; font-size: 13px; opacity: 0.6; transition: 0.3s; }
.report-btn:hover { opacity: 1; }
.meta-tags { display: flex; gap: 12px; margin-bottom: 40px; flex-wrap: wrap; }
.tag { background: #111; border: 1px solid rgba(255,255,255,0.08); padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #aaa; }
.description-box { margin-bottom: 50px; }
.desc-title { font-size: 18px; color: #eee; margin-bottom: 15px; font-weight: 500; }
.desc-text { color: #999; line-height: 1.8; font-size: 15px; white-space: pre-wrap; letter-spacing: 0.5px; }

.comments-section { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 40px; }
.section-title { font-size: 20px; font-weight: 500; margin-bottom: 25px; }
.section-title .count { color: #666; font-size: 16px; margin-left: 5px; }
.comment-input-box { margin-bottom: 40px; background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; transition: 0.3s; }
.comment-input-box.is-replying { border-color: #409eff; box-shadow: 0 0 10px rgba(64,158,255,0.1); }
.reply-tip { font-size: 13px; color: #888; margin-bottom: 10px; display: flex; align-items: center; }
.reply-tip span { color: #409eff; margin: 0 5px; font-weight: bold; }
.cancel-reply { cursor: pointer; color: #f56c6c; margin-left: 10px; font-size: 16px; }
:deep(.dark-input .el-textarea__inner) { background-color: transparent; box-shadow: none; color: #fff; padding: 0; resize: none; font-size: 15px; }
:deep(.dark-input .el-textarea__inner:focus) { box-shadow: none; }
.input-actions { display: flex; justify-content: flex-end; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; }
.comments-list { display: flex; flex-direction: column; gap: 25px; }
.comment-item { display: flex; gap: 15px; }
.comment-avatar { border: 1px solid #333; }
.comment-content-wrapper { flex: 1; background: #111; padding: 15px 20px; border-radius: 0 12px 12px 12px; border: 1px solid rgba(255,255,255,0.03); }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.comment-user { color: #ddd; font-weight: 500; font-size: 14px; }
.comment-time { color: #666; font-size: 12px; }
.comment-text { color: #aaa; font-size: 14px; line-height: 1.6; margin: 0 0 10px; }
.comment-actions { display: flex; justify-content: flex-end; }
.reply-btn { font-size: 12px; color: #666; cursor: pointer; transition: 0.3s; padding: 2px 5px; border-radius: 4px; }
.reply-btn:hover { color: #409eff; background: rgba(64,158,255,0.1); }
.replies-list { margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 15px; }
.reply-item { display: flex; gap: 10px; }
.reply-avatar { border: 1px solid #444; }
.reply-content-wrapper { flex: 1; }
.reply-header { display: flex; justify-content: space-between; margin-bottom: 5px; align-items: center; }
.reply-user { color: #ccc; font-size: 13px; font-weight: 500; }
.reply-time { color: #666; font-size: 12px; }
.reply-text { color: #999; font-size: 13px; margin: 0 0 5px; line-height: 1.5; }
.sub-actions { margin-top: 5px; }

.sidebar { width: 320px; position: sticky; top: 100px; display: flex; flex-direction: column; gap: 20px; }
.author-card { background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 35px 25px; text-align: center; }
.author-avatar { border: 3px solid #222; margin-bottom: 15px; transition: 0.3s; }
.author-avatar:hover { transform: scale(1.05); border-color: #555; }
.author-name { font-size: 22px; margin: 0 0 10px; font-weight: 500; }
.author-bio { font-size: 13px; color: #777; margin: 0 0 25px; line-height: 1.6; }
.author-actions { display: flex; gap: 10px; margin-top: 15px; }
.follow-btn { flex: 1; margin: 0 !important; font-weight: bold; }
.msg-btn { width: 40px; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; border-color: rgba(255,255,255,0.3); color: #fff; }
.msg-btn:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.1); }
.action-card { background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 25px; display: flex; justify-content: space-around; }
.action-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
.action-item:hover .action-label { color: #fff; }
.action-label { font-size: 12px; color: #888; transition: 0.3s; }
.action-btn { width: 50px; height: 50px; border-radius: 50%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.3s; }
.action-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
.heart-icon { width: 24px; height: 24px; fill: transparent; stroke: #fff; stroke-width: 2; transition: all 0.3s; }
.heart-icon.is-liked { fill: #ff4d4f; stroke: #ff4d4f; transform: scale(1.15); }
.like-btn:hover .heart-icon { stroke: #ff4d4f; }
.collect-btn.is-collected { color: #e6a23c; border-color: #e6a23c; background: rgba(230, 162, 60, 0.1); }
.collect-btn.is-collected:hover { transform: scale(1.15); }
.collect-btn :deep(svg) { transition: 0.3s; }
.collect-btn.is-collected :deep(svg) { color: #e6a23c; transform: scale(1.1); }

:deep(.dark-dialog) { background: #1a1a1c; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
:deep(.dark-dialog .el-dialog__title) { color: #fff; font-weight: 500; }
.report-desc { color: #888; font-size: 13px; margin-bottom: 20px; line-height: 1.5; text-align: left; }
.report-radios { width: 100%; align-items: flex-start; }
:deep(.el-radio) { color: #bbb; margin-bottom: 15px; width: 100%; }
:deep(.el-radio__input.is-checked + .el-radio__label) { color: #f56c6c; font-weight: bold; }
:deep(.el-radio__input.is-checked .el-radio__inner) { border-color: #f56c6c; background: #f56c6c; }

/* 【新增】分享列表样式 */
.share-header { color: #aaa; font-size: 14px; margin-bottom: 15px; }
.share-friends-list { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; }
.share-friend-item { display: flex; align-items: center; gap: 15px; background: #111; padding: 12px 15px; border-radius: 8px; cursor: pointer; transition: 0.3s; border: 1px solid rgba(255,255,255,0.03); }
.share-friend-item:hover { background: #1a1a1c; border-color: rgba(255,255,255,0.1); }
.share-friend-info { flex: 1; display: flex; flex-direction: column; }
.share-friend-info .name { color: #fff; font-size: 15px; margin-bottom: 4px; }
.share-friend-info .tag { font-size: 10px; color: #e6a23c; background: rgba(230,162,60,0.1); padding: 2px 6px; border-radius: 4px; width: fit-content; }
.empty-state { text-align: center; color: #666; padding: 40px 0; font-size: 13px; }
</style>