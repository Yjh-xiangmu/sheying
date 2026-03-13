<template>
  <div class="contest-manage-container">
    <div class="header">
      <div class="header-text">
        <h2>摄影赛事管理</h2>
        <p>在这里发布全站主题摄影比赛，设定时间，激发社区创作热情。</p>
      </div>
      <el-button type="primary" size="large" @click="showAddDialog = true" icon="Plus">发布新比赛</el-button>
    </div>

    <el-card class="box-card">
      <el-table :data="contestList" style="width: 100%" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />

        <el-table-column label="比赛海报" width="120" align="center">
          <template #default="{ row }">
            <el-image
              style="width: 80px; height: 50px; border-radius: 4px;"
              :src="`http://localhost:3000${row.cover_url}`"
              fit="cover"
            />
          </template>
        </el-table-column>

        <el-table-column prop="title" label="比赛主题" min-width="180" />

        <el-table-column label="比赛时间" width="300" align="center">
          <template #default="{ row }">
            <div style="font-size: 13px; color: #666;">
              起：{{ formatDate(row.start_time) }}<br>
              止：{{ formatDate(row.end_time) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态控制" width="150" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-text="进行中"
              inactive-text="已结束"
              inline-prompt
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              @change="(val) => handleStatusChange(row.id, val)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="发布于" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="发布摄影比赛" width="600px" center>
      <el-form :model="form" label-width="100px">
        <el-form-item label="比赛主题" required>
          <el-input v-model="form.title" placeholder="例如：2026 '夜之光' 城市夜景摄影大赛" />
        </el-form-item>

        <el-form-item label="比赛海报" required>
          <div class="poster-upload-box" @click="triggerUpload">
            <img v-if="previewUrl" :src="previewUrl" class="preview-img" />
            <div v-else class="upload-placeholder">
              <el-icon size="24"><Plus /></el-icon>
              <span>点击上传本地海报</span>
            </div>
            <input type="file" ref="fileInput" accept="image/*" style="display: none" @change="handleFileChange" />
          </div>
        </el-form-item>

        <el-form-item label="起止时间" required>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="比赛详情" required>
          <el-input v-model="form.description" type="textarea" :rows="6" placeholder="详细描述参赛要求、评选标准、奖项设置等..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="submitContest" :loading="submitting">确认发布</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import request from '../../utils/request';

const contestList = ref([]);
const loading = ref(true);

const showAddDialog = ref(false);
const submitting = ref(false);
const dateRange = ref([]);
const form = reactive({ title: '', description: '' });

// 文件上传相关的状态
const fileInput = ref(null);
const coverFile = ref(null);
const previewUrl = ref('');

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const fetchContests = async () => {
  loading.value = true;
  try {
    const res = await request.get('/admin/contests');
    contestList.value = res.data;
  } catch (error) {} finally { loading.value = false; }
};

// 触发隐藏的文件选择框
const triggerUpload = () => {
  fileInput.value.click();
};

// 监听文件选择变化，生成本地预览图
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  coverFile.value = file;
  previewUrl.value = URL.createObjectURL(file); // 生成本地预览的URL
};

// 提交包含文件的表单 (FormData)
const submitContest = async () => {
  if (!form.title || !coverFile.value || !form.description || dateRange.value.length !== 2) {
    return ElMessage.warning('请填写完整比赛信息，并上传海报图片');
  }

  submitting.value = true;
  try {
    // 因为有文件，必须使用 FormData 格式进行提交
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('start_time', dateRange.value[0]);
    formData.append('end_time', dateRange.value[1]);
    formData.append('cover', coverFile.value); // 放入文件实体

    await request.post('/admin/contests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    ElMessage.success('比赛发布成功');
    showAddDialog.value = false;

    // 重置所有表单状态
    form.title = ''; form.description = ''; dateRange.value = [];
    coverFile.value = null; previewUrl.value = '';

    fetchContests();
  } catch (error) {} finally { submitting.value = false; }
};

const handleStatusChange = async (id, status) => {
  try {
    await request.put(`/admin/contests/${id}/status`, { status });
    ElMessage.success('比赛状态已更新');
  } catch (error) {
    fetchContests();
  }
};

onMounted(() => { fetchContests(); });
</script>

<style scoped>
.contest-manage-container { padding: 20px; }
.header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.header h2 { margin: 0 0 10px; color: #303133; }
.header p { margin: 0; color: #909399; font-size: 14px; }
.box-card { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }

/* 图片上传框专属样式 */
.poster-upload-box {
  width: 260px; height: 140px;
  border: 1px dashed #d9d9d9; border-radius: 6px;
  cursor: pointer; position: relative; overflow: hidden;
  display: flex; justify-content: center; align-items: center;
  background-color: #fafafa; transition: 0.3s;
}
.poster-upload-box:hover { border-color: #409eff; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; color: #8c939d; }
.upload-placeholder span { font-size: 12px; margin-top: 8px; }
</style>