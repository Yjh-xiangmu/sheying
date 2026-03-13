<template>
  <div class="forum-container fade-in">
    <div class="forum-header">
      <div class="header-content">
        <h1 class="title">摄影交流区</h1>
        <p class="subtitle">器材讨论 / 前期拍摄 / 后期调色 / 经验分享</p>
        <el-button type="primary" size="large" round class="post-btn" @click="showPostDialog = true">
          <el-icon><EditPen /></el-icon> 发起讨论
        </el-button>
      </div>
    </div>

    <div class="topics-list-wrapper">
      <div v-if="loading" class="loading-state">板块加载中...</div>
      <div v-else-if="topics.length === 0" class="empty-state">暂无讨论，快来抢占沙发吧！</div>

      <div v-else class="topics-list">
        <div class="topic-item" v-for="topic in topics" :key="topic.id" @click="$router.push(`/topic/${topic.id}`)">

          <div class="topic-author">
            <el-avatar :size="50" :src="getAvatarUrl(topic.avatar)" />
          </div>

          <div class="topic-main">
            <div class="topic-title-row">
              <span v-if="topic.is_pinned === 1" class="tag pinned">置顶</span>
              <span v-if="topic.is_elite === 1" class="tag elite">精华</span>
              <h2 class="topic-title">{{ topic.title }}</h2>
            </div>
            <p class="topic-preview">{{ topic.content.length > 80 ? topic.content.slice(0, 80) + '...' : topic.content }}</p>
            <div class="topic-meta">
              <span class="author-name">{{ topic.nickname }}</span>
              <span class="dot">·</span>
              <span class="time">{{ formatTime(topic.created_at) }}</span>
            </div>
          </div>

          <div class="topic-stats">
            <div class="stat-box">
              <el-icon size="16"><View /></el-icon>
              <span>{{ topic.view_count }}</span>
            </div>
            <div class="stat-box">
              <el-icon size="16"><ChatLineSquare /></el-icon>
              <span>{{ topic.reply_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showPostDialog" title="发起新讨论" width="600px" center custom-class="dark-dialog">
      <el-form label-position="top">
        <el-form-item label="讨论主题">
          <el-input v-model="postForm.title" placeholder="用一句话概括你的问题或分享..." class="dark-input" />
        </el-form-item>
        <el-form-item label="详细内容">
          <el-input v-model="postForm.content" type="textarea" :rows="6" placeholder="详细描述你的想法..." class="dark-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPostDialog = false" plain round>取消</el-button>
          <el-button type="primary" @click="submitPost" :loading="posting" round>确认发布</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { EditPen, View, ChatLineSquare } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const router = useRouter();
const topics = ref([]);
const loading = ref(true);

const showPostDialog = ref(false);
const posting = ref(false);
const postForm = reactive({ title: '', content: '' });

const getAvatarUrl = (path) => path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const fetchTopics = async () => {
  loading.value = true;
  try {
    const res = await request.get('/forum/list');
    topics.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

const checkLogin = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) { ElMessage.warning('请先登录后操作'); return null; }
  return JSON.parse(userStr);
};

const submitPost = async () => {
  const user = checkLogin();
  if (!user) return;
  if (!postForm.title.trim() || !postForm.content.trim()) return ElMessage.warning('标题和内容不能为空');

  posting.value = true;
  try {
    await request.post('/forum/create', { user_id: user.id, title: postForm.title, content: postForm.content });
    ElMessage.success('发布成功');
    showPostDialog.value = false;
    postForm.title = ''; postForm.content = '';
    fetchTopics(); // 刷新列表
  } catch (error) {} finally { posting.value = false; }
};

onMounted(() => { fetchTopics(); });
</script>

<style scoped>
.forum-container { min-height: calc(100vh - 70px); background-color: #050505; color: #fff; padding-bottom: 80px; }

/* 头部 Banner */
.forum-header { width: 100%; height: 300px; background: linear-gradient(135deg, #1a1a1c 0%, #0a0a0a 100%); display: flex; justify-content: center; align-items: center; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
.header-content .title { font-size: 40px; letter-spacing: 4px; margin-bottom: 15px; font-weight: 500; }
.header-content .subtitle { color: #888; font-size: 16px; margin-bottom: 30px; }
.post-btn { padding: 0 30px; font-weight: bold; font-size: 16px; }

/* 列表区 */
.topics-list-wrapper { max-width: 1000px; margin: -40px auto 0; position: relative; z-index: 10; padding: 0 20px; }
.topics-list { display: flex; flex-direction: column; gap: 15px; }

/* 单个帖子卡片 */
.topic-item { display: flex; gap: 20px; background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 25px; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
.topic-item:hover { border-color: #409eff; transform: translateY(-3px); }

.topic-main { flex: 1; overflow: hidden; }
.topic-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.topic-title { font-size: 18px; font-weight: 500; margin: 0; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 标签样式 */
.tag { font-size: 12px; padding: 2px 6px; border-radius: 4px; font-weight: bold; flex-shrink: 0;}
.tag.pinned { background: rgba(245,108,108,0.1); color: #f56c6c; border: 1px solid rgba(245,108,108,0.3); }
.tag.elite { background: rgba(230,162,60,0.1); color: #e6a23c; border: 1px solid rgba(230,162,60,0.3); }

.topic-preview { color: #888; font-size: 14px; margin: 0 0 15px 0; line-height: 1.5; }
.topic-meta { font-size: 13px; color: #666; display: flex; align-items: center; gap: 8px; }
.author-name { color: #aaa; }

/* 数据统计 */
.topic-stats { display: flex; flex-direction: column; justify-content: center; gap: 15px; min-width: 60px; align-items: flex-end; border-left: 1px dashed rgba(255,255,255,0.1); padding-left: 20px; }
.stat-box { display: flex; align-items: center; gap: 5px; color: #888; font-size: 14px; }

/* 状态与弹窗 */
.loading-state, .empty-state { text-align: center; color: #666; padding: 100px 0; background: #111; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);}
:deep(.dark-dialog) { background: #1a1a1c; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
:deep(.dark-dialog .el-dialog__title) { color: #fff; font-weight: 500; }
:deep(.dark-input .el-input__wrapper), :deep(.dark-input .el-textarea__inner) { background-color: #111; box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset; color: #fff; border-radius: 8px; }
</style>