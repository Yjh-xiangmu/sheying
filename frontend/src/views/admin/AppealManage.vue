<template>
  <div class="appeal-manage-container">
    <div class="header">
      <h2>封禁申诉处理</h2>
      <p>认真评估用户的申诉理由，决定是否给予解封机会。</p>
    </div>

    <el-card class="box-card">
      <el-table :data="appealList" style="width: 100%" v-loading="loading" border stripe>
        <el-table-column prop="id" label="申诉单号" width="100" align="center" />

        <el-table-column label="申诉人信息" width="180">
          <template #default="{ row }">
            <div><strong>账号：</strong>{{ row.username }}</div>
            <div><strong>昵称：</strong>{{ row.nickname }}</div>
            <div style="color: #f56c6c; font-size: 12px; margin-top: 5px;">历史封禁: {{ row.ban_count }} 次</div>
            <div style="color: #e6a23c; font-size: 12px;">剩余申诉机会: {{ row.appeal_chances }} 次</div>
          </template>
        </el-table-column>

        <el-table-column prop="content" label="申诉理由 / 小作文" min-width="250" />

        <el-table-column prop="created_at" label="提交时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待处理</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已解封</el-tag>
            <el-tag v-else type="danger">已驳回</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button size="small" type="success" @click="handleAppeal(row, 'approve')">予以解封</el-button>
              <el-button size="small" type="danger" @click="handleAppeal(row, 'reject')">无情驳回</el-button>
            </template>
            <span v-else style="color: #999; font-size: 13px;">已处理</span>
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

const appealList = ref([]);
const loading = ref(true);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}`;
};

const fetchAppeals = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/appeals');
    appealList.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

const handleAppeal = (row, action) => {
  const isApprove = action === 'approve';
  ElMessageBox.confirm(
    isApprove ? '确认给该用户一次机会并立即解封吗？' : '确认驳回申诉维持封禁吗？（该用户将损失一次申诉机会）',
    '处理确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: isApprove ? 'success' : 'warning' }
  ).then(async () => {
    try {
      await request.put(`/admin/appeals/${row.id}/handle`, { action, user_id: row.user_id });
      ElMessage.success('处理完成');
      fetchAppeals();
    } catch (error) {}
  }).catch(() => {});
};

onMounted(() => { fetchAppeals(); });
</script>

<style scoped>
.appeal-manage-container { padding: 20px; }
.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
</style>