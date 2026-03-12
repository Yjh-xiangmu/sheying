<template>
  <div class="apply-container fade-in">
    <div class="glass-form-box">
      <h2 class="page-title">摄影师资质认证</h2>
      <p class="page-subtitle">成为认证摄影师，解锁发布作品、参与排行等专属权限</p>

      <div v-if="certStatus === 0" class="status-box pending">
        <el-icon :size="40"><Clock /></el-icon>
        <h3>您的申请正在审核中</h3>
        <p>管理员会尽快处理您的申请，请耐心等待。</p>
      </div>

      <el-form v-else :model="form" label-position="top" class="custom-form">
        <el-form-item label="真实姓名" required>
          <el-input v-model="form.real_name" placeholder="请输入您的真实姓名" size="large" />
        </el-form-item>

        <el-form-item label="联系电话" required>
          <el-input v-model="form.phone" placeholder="请输入能联系到您的手机号" size="large" />
        </el-form-item>

        <el-form-item label="申请理由 / 摄影经历" required>
          <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="向管理员简单介绍一下您的摄影经历或擅长的风格..." />
        </el-form-item>

        <el-form-item label="上传代表作品 (请务必上传 2 - 3 张本人原创作品)" required>
          <div class="upload-wall-wrapper">
            <el-upload
              v-model:file-list="fileList"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="3"
              accept="image/*"
              multiple
              :on-exceed="handleExceed"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>

        <el-button type="primary" class="submit-btn" size="large" @click="handleSubmit" :loading="loading">
          提交认证申请
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, Clock } from '@element-plus/icons-vue';
import request from '../../utils/request';

const router = useRouter();
const loading = ref(false);
const fileList = ref([]);
const certStatus = ref(-1); // -1:未申请或已拒绝, 0:待审核, 1:已通过

const form = reactive({ real_name: '', phone: '', reason: '' });

onMounted(async () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    // 如果已经是认证摄影师或管理员，直接跳回首页
    if (user.role === 1 || user.role === 2) {
      ElMessage.success('您已经是尊贵的认证摄影师了');
      router.push('/');
      return;
    }
    // 查询当前是否处于待审核状态
    try {
      const res = await request.get(`/certification/status/${user.id}`);
      certStatus.value = res.data.status;
    } catch (error) {}
  } else {
    router.push('/');
  }
});

const handleExceed = () => {
  ElMessage.warning('最多只能上传 3 张代表作');
};

const handleSubmit = async () => {
  if (!form.real_name) return ElMessage.warning('请填写真实姓名');
  if (!form.phone) return ElMessage.warning('请填写联系电话');
  if (!form.reason) return ElMessage.warning('请填写申请理由');
  if (fileList.value.length < 2) return ElMessage.warning('请至少上传 2 张代表作品');

  const user = JSON.parse(localStorage.getItem('user'));
  const formData = new FormData();

  fileList.value.forEach(fileItem => { formData.append('images', fileItem.raw); });
  formData.append('user_id', user.id);
  formData.append('real_name', form.real_name);
  formData.append('phone', form.phone);
  formData.append('reason', form.reason);

  loading.value = true;
  try {
    const res = await request.post('/certification/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    ElMessage.success(res.message);
    certStatus.value = 0; // 切换为待审核状态视图
  } catch (error) {
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.apply-container { min-height: calc(100vh - 70px); display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; background-color: #0a0a0c; }
.glass-form-box { width: 100%; max-width: 700px; background: rgba(20, 20, 22, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.page-title { color: #fff; text-align: center; margin-bottom: 10px; letter-spacing: 2px; }
.page-subtitle { color: #888; text-align: center; margin-bottom: 30px; font-size: 14px; }
.status-box { text-align: center; padding: 60px 20px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px; color: #fff; }
.status-box h3 { margin: 15px 0 10px; }
.status-box p { color: #888; font-size: 14px; }
.upload-wall-wrapper { width: 100%; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.2); }
:deep(.el-upload--picture-card) { background-color: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); }
:deep(.el-upload--picture-card:hover) { border-color: #fff; color: #fff; }
.submit-btn { width: 100%; margin-top: 20px; font-weight: bold; background: #fff; color: #000; border: none;}
.submit-btn:hover { background: #ccc; }
:deep(.el-form-item__label) { color: #ccc; font-size: 15px; }
:deep(.el-input__wrapper), :deep(.el-textarea__inner) { background-color: rgba(0, 0, 0, 0.4); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset; color: #fff; }
</style>