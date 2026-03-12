<template>
  <div class="user-manage-container">
    <div class="header">
      <h2>用户管理</h2>
      <p>在此查看平台所有注册用户，并对违规账号进行封禁处理。</p>
    </div>

    <el-card class="box-card">
      <el-table :data="userList" style="width: 100%" v-loading="loading" border stripe>
        <el-table-column prop="id" label="用户 ID" width="100" align="center" />

        <el-table-column prop="username" label="登录账号" width="150" />

        <el-table-column prop="nickname" label="平台昵称" min-width="150" />

        <el-table-column label="角色" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.role === 2" type="danger" effect="dark">管理员</el-tag>
            <el-tag v-else-if="row.role === 1" type="warning" effect="dark">认证摄影师</el-tag>
            <el-tag v-else type="info">普通用户</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="注册时间" width="200" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="账号状态 (封禁/解封)" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="正常"
              inactive-text="封禁"
              inline-prompt
              :disabled="row.role === 2"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const userList = ref([]);
const loading = ref(true);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/users');
    userList.value = res.data;
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleStatusChange = async (row) => {
  try {
    const res = await request.put(`/admin/users/${row.id}/status`, {
      status: row.status
    });
    ElMessage.success(res.message);
  } catch (error) {
    // 操作失败时恢复开关状态
    row.status = row.status === 1 ? 0 : 1;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-manage-container { padding: 20px; }
.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
</style>