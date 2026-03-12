<template>
  <div class="audit-container">
    <div class="header">
      <h2>摄影师资质审核</h2>
      <p>在此处理用户的实名与作品认证申请，通过后用户将获得发布作品的权限。</p>
    </div>

    <el-card class="box-card">
      <el-table :data="certList" style="width: 100%" v-loading="loading" border>

        <el-table-column prop="id" label="ID" width="60" align="center" />

        <el-table-column label="申请人信息" width="180">
          <template #default="{ row }">
            <div><strong>真实姓名：</strong>{{ row.real_name }}</div>
            <div><strong>联系电话：</strong>{{ row.phone }}</div>
            <div><strong>平台昵称：</strong>{{ row.nickname }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="申请理由 / 经历" min-width="200" show-overflow-tooltip />

        <el-table-column label="代表作品 (点击预览)" width="250" align="center">
          <template #default="{ row }">
            <div class="img-preview-box">
              <el-image
                v-for="(img, idx) in parseImages(row.images)"
                :key="idx"
                style="width: 60px; height: 60px; margin-right: 5px; border-radius: 4px;"
                :src="`http://localhost:3000${img}`"
                :preview-src-list="parseImages(row.images).map(url => `http://localhost:3000${url}`)"
                :initial-index="idx"
                fit="cover"
                preview-teleported
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已通过</el-tag>
            <el-tag v-else type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button size="small" type="success" @click="handleAudit(row, 1)">通过</el-button>
              <el-button size="small" type="danger" @click="handleAudit(row, 2)">驳回</el-button>
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

const certList = ref([]);
const loading = ref(true);

// 解析数据库中的 JSON 图片数组
const parseImages = (imagesJson) => {
  if (!imagesJson) return [];
  try {
    return typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson;
  } catch (e) {
    return [];
  }
};

// 获取列表数据
const fetchList = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/certifications');
    certList.value = res.data;
  } catch (error) {
    ElMessage.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

// 处理审核操作
const handleAudit = (row, status) => {
  const actionText = status === 1 ? '通过' : '驳回';
  ElMessageBox.confirm(`确定要 ${actionText} 该用户的认证申请吗？`, '审核确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: status === 1 ? 'success' : 'warning'
  }).then(async () => {
    try {
      await request.put(`/admin/certifications/${row.id}`, {
        status: status,
        user_id: row.user_id
      });
      ElMessage.success(`操作成功！已${actionText}`);
      fetchList(); // 重新加载列表
    } catch (error) {}
  }).catch(() => {});
};
</script>

<style scoped>
.audit-container { padding: 20px; }
.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
.img-preview-box { display: flex; flex-wrap: wrap; }
</style>