<template>
  <div class="report-manage-container">
    <div class="header">
      <h2>违规举报处理</h2>
      <p>及时处理社区用户的举报信息，共同维护干净的摄影环境。</p>
    </div>

    <el-card class="box-card">
      <el-table :data="reportList" style="width: 100%" v-loading="loading" border stripe>
        <el-table-column prop="id" label="举报ID" width="80" align="center" />

        <el-table-column label="被举报作品" width="250">
          <template #default="{ row }">
            <div v-if="row.cover_url" class="artwork-preview" @click="previewImage(row.cover_url)">
              <img :src="`http://localhost:3000${row.cover_url}`" class="tiny-img" />
              <span>{{ row.title }}</span>
            </div>
            <span v-else style="color: #f56c6c">该作品已被删除</span>
          </template>
        </el-table-column>

        <el-table-column prop="reporter_name" label="举报人" width="120" align="center" />

        <el-table-column label="举报理由" min-width="150">
          <template #default="{ row }">
            <el-tag type="danger" effect="plain">{{ row.reason }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待处理</el-tag>
            <el-tag v-else type="success">已处理</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0 && row.cover_url">
              <el-button size="small" type="danger" @click="handleReport(row.id, 'delete', row.artwork_id)">确认违规并删除</el-button>
              <el-button size="small" @click="handleReport(row.id, 'ignore', null)">驳回</el-button>
            </template>
            <span v-else style="color: #999; font-size: 13px;">——</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" width="50%" center>
      <img :src="previewUrl" style="width: 100%; border-radius: 8px;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../../utils/request';

const reportList = ref([]);
const loading = ref(true);

const dialogVisible = ref(false);
const previewUrl = ref('');

const previewImage = (url) => {
  previewUrl.value = `http://localhost:3000${url}`;
  dialogVisible.value = true;
};

const fetchReports = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/reports');
    reportList.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

const handleReport = (id, action, artwork_id) => {
  const confirmText = action === 'delete' ? '警告：此操作将永久删除该作品！确定违规吗？' : '确定驳回（忽略）该举报吗？';

  ElMessageBox.confirm(confirmText, '处理确认', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: action === 'delete' ? 'error' : 'info'
  }).then(async () => {
    try {
      await request.put(`/admin/reports/${id}/handle`, { action, artwork_id });
      ElMessage.success('处理完成');
      fetchReports(); // 刷新列表
    } catch (error) {}
  }).catch(() => {});
};

onMounted(() => { fetchReports(); });
</script>

<style scoped>
.report-manage-container { padding: 20px; }
.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
.artwork-preview { display: flex; align-items: center; gap: 10px; cursor: pointer; color: #409eff; }
.tiny-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }
</style>