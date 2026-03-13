<template>
  <div class="topic-detail-page fade-in" v-if="topic">
    <div class="topic-container">

      <div class="breadcrumb">
        <span class="back-btn" @click="$router.push('/forum')">
          <el-icon><ArrowLeft /></el-icon> 返回交流区
        </span>
      </div>

      <div class="main-post glass-panel">
        <h1 class="topic-title">{{ topic.title }}</h1>
        <div class="post-meta">
          <el-avatar :size="45" :src="getAvatarUrl(topic.avatar)" @click="$router.push(`/user/${topic.user_id}`)" class="clickable-avatar"/>
          <div class="author-info">
            <span class="author-name" @click="$router.push(`/user/${topic.user_id}`)">{{ topic.nickname }}</span>
            <div class="time-view">
              <span>{{ formatTime(topic.created_at) }}</span>
              <span class="dot">·</span>
              <el-icon><View /></el-icon> {{ topic.view_count }} 次浏览
            </div>
          </div>
          <div class="louzhu-tag">楼主</div>
        </div>
        <div class="post-content">{{ topic.content }}</div>
      </div>

      <div class="replies-section">
        <div class="section-header">全部回复 ({{ replies.length }})</div>

        <div v-if="replies.length === 0" class="empty-state">
          还没有人回复，快来抢沙发吧！
        </div>

        <div v-else class="replies-list">
          <div class="reply-item glass-panel" v-for="(reply, index) in replies" :key="reply.id">
            <div class="reply-meta">
              <el-avatar :size="40" :src="getAvatarUrl(reply.avatar)" @click="$router.push(`/user/${reply.user_id}`)" class="clickable-avatar"/>
              <div class="author-info">
                <span class="author-name" @click="$router.push(`/user/${reply.user_id}`)">
                  {{ reply.nickname }}
                  <span v-if="reply.user_id === topic.user_id" class="louzhu-badge">楼主</span>
                  <span v-if="reply.role === 2" class="admin-badge">管理员</span>
                </span>
                <span class="time">{{ formatTime(reply.created_at) }}</span>
              </div>
              <div class="floor-num">#{{ index + 1 }}</div>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
          </div>
        </div>
      </div>

      <div class="reply-input-area glass-panel">
        <div class="input-header">发表回复</div>
        <el-input
          v-model="replyContent"
          type="textarea"
          :rows="4"
          placeholder="友善交流，分享你的专业见解..."
          class="dark-input"
        />
        <div class="submit-row">
          <el-button type="primary" size="large" round @click="submitReply" :loading="replying">
            发送回复
          </el-button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const topic = ref(null);
const replies = ref([]);
const replyContent = ref('');
const replying = ref(false);

const getAvatarUrl = (path) => path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const checkLogin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) { ElMessage.warning('请先登录'); return null; }
  return JSON.parse(userStr);
};

const loadTopicData = async () => {
  const topicId = route.params.id;
  try {
    const topicRes = await request.get(`/forum/detail/${topicId}`);
    topic.value = topicRes.data;
    const repliesRes = await request.get(`/forum/replies/${topicId}`);
    replies.value = repliesRes.data;
  } catch (error) {
    if (error.response?.status === 404) {
      ElMessage.error('帖子不存在');
      router.push('/forum');
    }
  }
};

const submitReply = async () => {
  const user = checkLogin();
  if (!user) return;
  if (!replyContent.value.trim()) return ElMessage.warning('回复内容不能为空');

  replying.value = true;
  try {
    await request.post('/forum/reply', {
      topic_id: topic.value.id,
      user_id: user.id,
      content: replyContent.value.trim()
    });
    ElMessage.success('回复成功');
    replyContent.value = '';
    // 重新拉取回帖列表
    const repliesRes = await request.get(`/forum/replies/${topic.value.id}`);
    replies.value = repliesRes.data;
  } catch (error) {
  } finally { replying.value = false; }
};

onMounted(() => { loadTopicData(); });
</script>

<style scoped>
.topic-detail-page { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding: 40px 20px 100px; }
.topic-container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.glass-panel { background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 30px; }

/* 导航条 */
.breadcrumb { margin-bottom: 10px; }
.back-btn { color: #888; font-size: 15px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: 0.3s; }
.back-btn:hover { color: #fff; transform: translateX(-5px); }

/* 主帖样式 */
.topic-title { font-size: 28px; font-weight: 600; margin: 0 0 25px 0; line-height: 1.4; color: #eee; }
.post-meta { display: flex; align-items: center; gap: 15px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); position: relative; }
.clickable-avatar { cursor: pointer; border: 1px solid #333; }
.author-info { display: flex; flex-direction: column; gap: 5px; }
.author-name { font-size: 16px; font-weight: 500; color: #fff; cursor: pointer; }
.author-name:hover { color: #409eff; }
.time-view { font-size: 13px; color: #666; display: flex; align-items: center; gap: 8px; }
.louzhu-tag { position: absolute; right: 0; top: 10px; font-size: 12px; color: #e6a23c; background: rgba(230,162,60,0.1); border: 1px solid rgba(230,162,60,0.2); padding: 4px 12px; border-radius: 4px; font-weight: bold; }
.post-content { font-size: 16px; line-height: 1.8; color: #ccc; white-space: pre-wrap; letter-spacing: 0.5px; }

/* 回复列表区 */
.replies-section { margin-top: 20px; }
.section-header { font-size: 18px; font-weight: 500; margin-bottom: 20px; color: #eee; border-left: 4px solid #409eff; padding-left: 10px; }
.empty-state { text-align: center; color: #666; padding: 60px 0; background: #111; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); }
.replies-list { display: flex; flex-direction: column; gap: 15px; }
.reply-item { padding: 25px; }
.reply-meta { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; position: relative; }
.louzhu-badge { font-size: 10px; color: #e6a23c; background: rgba(230,162,60,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 5px; vertical-align: middle; }
.admin-badge { font-size: 10px; color: #f56c6c; background: rgba(245,108,108,0.1); padding: 2px 6px; border-radius: 4px; margin-left: 5px; vertical-align: middle; }
.floor-num { position: absolute; right: 0; top: 5px; font-size: 13px; color: #555; font-weight: bold; }
.reply-content { font-size: 15px; line-height: 1.6; color: #bbb; padding-left: 55px; white-space: pre-wrap; }

/* 底部回复输入区 */
.reply-input-area { margin-top: 20px; }
.input-header { font-size: 16px; font-weight: 500; margin-bottom: 15px; color: #ddd; }
:deep(.dark-input .el-textarea__inner) { background-color: #1a1a1c; box-shadow: 0 0 0 1px rgba(255,255,255,0.05) inset; color: #fff; border-radius: 8px; font-size: 15px; padding: 15px; }
:deep(.dark-input .el-textarea__inner:focus) { box-shadow: 0 0 0 1px #409eff inset; }
.submit-row { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>