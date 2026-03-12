<template>
  <div class="upload-container fade-in">
    <div class="glass-form-box">
      <h2 class="page-title">发布摄影组图</h2>

      <el-form :model="form" label-position="top" class="custom-form">
        <el-form-item label="上传作品 (最多9张，第一张将作为封面)" required>
          <div class="upload-wall-wrapper">
            <el-upload
              v-model:file-list="fileList"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="9"
              accept="image/*"
              multiple
              :on-exceed="handleExceed"
              class="custom-uploader"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </div>
        </el-form-item>

        <div class="info-area">
          <el-form-item label="作品标题" required>
            <el-input v-model="form.title" placeholder="给这组作品起个震撼的名字..." size="large" />
          </el-form-item>

          <el-form-item label="作品分类" required>
            <el-select v-model="form.category_id" placeholder="选择最合适的分类" size="large" style="width: 100%;">
              <el-option label="人像" :value="1" />
              <el-option label="风景" :value="2" />
              <el-option label="纪实" :value="3" />
              <el-option label="街拍" :value="4" />
            </el-select>
          </el-form-item>

          <el-form-item label="作品描述 (背后故事/器材参数)">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="分享这组照片背后的故事，或者你使用的相机、镜头等参数..."
            />
          </el-form-item>

          <el-button type="primary" class="submit-btn" size="large" @click="handleSubmit" :loading="loading">
            立刻发布
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import request from '../../utils/request';

const router = useRouter();
const loading = ref(false);
const fileList = ref([]); // 存放多张图片的数组

const form = reactive({
  title: '',
  category_id: '',
  description: ''
});

// 超出上传数量限制时的提示
const handleExceed = () => {
  ElMessage.warning('最多只能上传 9 张图片哦！');
};

// 提交表单到后端
const handleSubmit = async () => {
  if (fileList.value.length === 0) return ElMessage.warning('请至少上传一张图片！');
  if (!form.title) return ElMessage.warning('请填写作品标题！');
  if (!form.category_id) return ElMessage.warning('请选择作品分类！');

  const userStr = localStorage.getItem('user');
  if (!userStr) return ElMessage.error('登录状态已失效，请重新登录');
  const user = JSON.parse(userStr);

  const formData = new FormData();

  // 核心改动：遍历 fileList，将所有图片追加到 'images' 字段中
  fileList.value.forEach((fileItem) => {
    formData.append('images', fileItem.raw);
  });

  formData.append('user_id', user.id);
  formData.append('title', form.title);
  formData.append('category_id', form.category_id);
  formData.append('description', form.description);

  loading.value = true;
  try {
    await request.post('/artworks/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    ElMessage.success('组图发布成功！');
    router.push('/');
  } catch (error) {
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.upload-container {
  min-height: calc(100vh - 70px);
  display: flex; justify-content: center; align-items: flex-start;
  padding: 40px 20px; background-color: #0a0a0c;
}

.glass-form-box {
  width: 100%; max-width: 800px;
  background: rgba(20, 20, 22, 0.6); backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px;
  padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

.page-title { color: #fff; text-align: center; margin-bottom: 30px; letter-spacing: 2px; font-weight: 400; }

/* 照片墙样式覆盖 */
.upload-wall-wrapper { width: 100%; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.2); }
:deep(.el-upload--picture-card) { background-color: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); }
:deep(.el-upload--picture-card:hover) { border-color: #fff; color: #fff; }
:deep(.el-upload-list--picture-card .el-upload-list__item) { border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }

.info-area { margin-top: 30px; }
.submit-btn { width: 100%; margin-top: 20px; font-size: 16px; font-weight: bold; background: #fff; color: #000; border: none; border-radius: 8px;}
.submit-btn:hover { background: #ccc; }

:deep(.el-form-item__label) { color: #ccc; font-size: 15px; }
:deep(.el-input__wrapper), :deep(.el-textarea__inner) { background-color: rgba(0, 0, 0, 0.4); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset; color: #fff; }
:deep(.el-select-dropdown) { background-color: #1e1e1e; border: 1px solid #333; }
:deep(.el-select-dropdown__item) { color: #aaa; }
:deep(.el-select-dropdown__item.hover), :deep(.el-select-dropdown__item:hover) { background-color: #333; color: #fff; }
</style>