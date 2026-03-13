<template>
  <div class="comment-manage-container">
    <div class="header">
      <h2>内容与评论审核</h2>
      <p>管理全站用户的留言，含有敏感词的评论将被系统自动拦截，需人工二次确认。</p>
    </div>

    <el-card class="box-card">
      <el-table :data="commentList" style="width: 100%" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />

        <el-table-column label="评论人" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="30" :src="row.avatar ? `http://localhost:3000${row.avatar}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              <span>{{ row.user_name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="所属作品" width="200">
          <template #default="{ row }">
            <span v-if="row.artwork_title" class="artwork-title" @click="goToArtwork(row.artwork_id)">
              《{{ row.artwork_title }}》
            </span>
            <span v-else style="color: #999;">作品已被删除</span>
          </template>
        </el-table-column>

        <el-table-column prop="content" label="评论内容" min-width="250" />

        <el-table-column prop="created_at" label="发布时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="danger" effect="dark">触发敏感词</el-tag>
            <el-tag v-else type="success" effect="plain">正常展示</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" size="small" type="success" @click="handleComment(row.id, 'approve')">误判放行</el-button>
            <el-button size="small" type="danger" @click="handleComment(row.id, 'delete')">强制删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../utils/request';

const commentList = ref([]);
const loading = ref(true);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const goToArtwork = (id) => {
  window.open(`/artwork/${id}`, '_blank');
};

const fetchComments = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/comments');
    commentList.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

const handleComment = (id, action) => {
  const isApprove = action === 'approve';
  ElMessageBox.confirm(
    isApprove ? '确认放行该评论？（前台将恢复可见）' : '警告：此操作将永久删除该评论！确认删除吗？',
    '处理确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: isApprove ? 'success' : 'error' }
  ).then(async () => {
    try {
      await request.put(`/admin/comments/${id}/handle`, { action });
      ElMessage.success('处理完成');
      fetchComments(); // 刷新列表
    } catch (error) {}
  }).catch(() => {});
};

onMounted(() => { fetchComments(); });
</script>

<style scoped>
.comment-manage-container { padding: 20px; }
.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
.user-info { display: flex; align-items: center; gap: 10px; }
.artwork-title { color: #409eff; cursor: pointer; text-decoration: underline; font-weight: bold; }
.artwork-title:hover { color: #66b1ff; }
</style>