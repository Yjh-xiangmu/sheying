<template>
  <div class="topic-manage-container">
    <div class="header">
      <h2>论坛交流区管理</h2>
      <p>管理全站用户的发帖，您可以将优质内容置顶或加精，也可以删除违规讨论。</p>
    </div>

    <el-card class="box-card">
      <el-table :data="topicList" style="width: 100%" v-loading="loading" border stripe>
        <el-table-column prop="id" label="帖子ID" width="80" align="center" />

        <el-table-column label="发帖人" width="150">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="30" :src="row.avatar ? `http://localhost:3000${row.avatar}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              <span>{{ row.user_name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="帖子标题" min-width="200">
          <template #default="{ row }">
            <span class="topic-title" @click="goToTopic(row.id)">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作开关" width="220" align="center">
          <template #default="{ row }">
            <div class="switch-group">
              <div class="switch-item">
                <span class="switch-label">置顶</span>
                <el-switch
                  v-model="row.is_pinned"
                  :active-value="1"
                  :inactive-value="0"
                  active-color="#f56c6c"
                  @change="(val) => handleStatusChange(row.id, 'is_pinned', val)"
                />
              </div>
              <div class="switch-item">
                <span class="switch-label">加精</span>
                <el-switch
                  v-model="row.is_elite"
                  :active-value="1"
                  :inactive-value="0"
                  active-color="#e6a23c"
                  @change="(val) => handleStatusChange(row.id, 'is_elite', val)"
                />
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="发布时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="危险操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="danger" icon="Delete" @click="handleDelete(row.id)" circle></el-button>
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

const topicList = ref([]);
const loading = ref(true);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const goToTopic = (id) => {
  window.open(`/topic/${id}`, '_blank');
};

const fetchTopics = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/topics');
    topicList.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

// 切换 置顶/加精 状态
const handleStatusChange = async (id, field, value) => {
  try {
    await request.put(`/admin/topics/${id}/status`, { field, value });
    ElMessage.success('状态已更新');
  } catch (error) {
    ElMessage.error('更新失败');
    fetchTopics(); // 失败则把状态刷回来
  }
};

// 物理删除帖子
const handleDelete = (id) => {
  ElMessageBox.confirm(
    '警告：此操作将永久删除该帖子及其下方所有的回帖记录！是否继续？',
    '高危操作确认',
    { confirmButtonText: '确定彻底删除', cancelButtonText: '取消', type: 'error' }
  ).then(async () => {
    try {
      await request.delete(`/admin/topics/${id}`);
      ElMessage.success('帖子已彻底删除');
      fetchTopics(); // 刷新列表
    } catch (error) {}
  }).catch(() => {});
};

onMounted(() => { fetchTopics(); });
</script>

<style scoped>
.topic-manage-container { padding: 20px; }
.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
.user-info { display: flex; align-items: center; gap: 10px; }
.topic-title { color: #409eff; cursor: pointer; text-decoration: underline; font-weight: 500; }
.topic-title:hover { color: #66b1ff; }
.switch-group { display: flex; justify-content: center; gap: 15px; }
.switch-item { display: flex; align-items: center; gap: 5px; }
.switch-label { font-size: 12px; color: #666; }
</style>