<template>
  <div class="front-layout">
    <header class="navbar">
      <div class="logo">FOCUS 摄影社区</div>
      <nav class="nav-links">
        <router-link to="/">发现</router-link>
        <router-link to="/feed">动态</router-link>
        <router-link to="/forum">交流区</router-link> <router-link to="/ranking">榜单</router-link>
      </nav>
      <div class="user-actions">
        <template v-if="isLoggedIn">
          <a href="javascript:void(0)" class="upload-btn" @click="handlePublishClick">➕ 发布作品</a>
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="el-dropdown-link user-dropdown">
              <el-avatar :size="32" :src="currentUser?.avatar ? `http://localhost:3000${currentUser.avatar}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="nav-avatar" />
              {{ currentUser?.nickname }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu class="dark-dropdown">
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="message">消息私信</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <a v-else href="javascript:void(0)" class="login-btn" @click="showLoginModal = true">登录 / 注册</a>
      </div>
    </header>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <transition name="modal-pop">
      <div v-if="showLoginModal" class="modal-overlay" @click.self="showLoginModal = false">
        <div class="glass-box">
          <div class="close-btn" @click="showLoginModal = false">✕</div>
          <h2 class="title">FOCUS</h2>
          <p class="subtitle">与世界分享你的光影</p>

          <el-tabs v-model="activeTab" class="custom-tabs">
            <el-tab-pane label="登录" name="login">
              <el-form :model="loginForm" :rules="rules" ref="loginRef">
                <el-form-item prop="username">
                  <el-input v-model="loginForm.username" placeholder="请输入账号" size="large" />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password />
                </el-form-item>
                <el-button type="primary" class="submit-btn" size="large" @click="handleLogin" :loading="loading">登 录</el-button>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="注册" name="register">
              <el-form :model="registerForm" :rules="rules" ref="registerRef">
                <el-form-item prop="username">
                  <el-input v-model="registerForm.username" placeholder="设置账号" size="large" />
                </el-form-item>
                <el-form-item prop="password">
                  <el-input v-model="registerForm.password" type="password" placeholder="设置密码" size="large" show-password />
                </el-form-item>
                <el-button type="primary" class="submit-btn" size="large" @click="handleRegister" :loading="loading">注 册</el-button>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </transition>

    <el-dialog v-model="showAppealDialog" title="账号封禁申诉" width="400px" center custom-class="dark-dialog">
      <div style="color: #bbb; margin-bottom: 15px; font-size: 13px; line-height: 1.5;">
        您的账号因多次违规已被系统封禁。您可以通过下方输入框向管理员提交申诉说明，争取解封机会。
      </div>
      <el-input v-model="appealContent" type="textarea" :rows="4" placeholder="请认真填写您的申诉理由及整改保证..." class="dark-input" />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAppealDialog = false" plain round>放弃申诉</el-button>
          <el-button type="primary" @click="submitAppeal" :loading="appealing" round>提交申诉</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import request from '../utils/request';

const router = useRouter();
const isLoggedIn = ref(false);
const currentUser = ref(null);
const showLoginModal = ref(false);
const activeTab = ref('login');
const loading = ref(false);
const loginRef = ref(null);
const registerRef = ref(null);

// 申诉相关状态
const showAppealDialog = ref(false);
const appealContent = ref('');
const appealUserId = ref(null);
const appealing = ref(false);

onMounted(() => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    isLoggedIn.value = true;
    currentUser.value = JSON.parse(user);
  }
});

const loginForm = reactive({ username: '', password: '' });
const registerForm = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }]
};

// 登录与风控拦截逻辑
const handleLogin = async () => {
  if (!loginRef.value) return;
  await loginRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await request.post('/auth/login', loginForm);

        // --- 核心风控拦截逻辑 ---
        if (res.code === 403) {
          if (res.needAppeal) {
            ElMessage.warning(res.message);
            appealUserId.value = res.user_id; // 记录被封禁的ID
            showLoginModal.value = false;     // 关闭登录框
            showAppealDialog.value = true;    // 弹出申诉框
          } else {
            ElMessage.error(res.message);     // 没机会了，直接报死刑
          }
          return;
        } else if (res.code !== 200) {
          return ElMessage.error(res.message || '登录失败');
        }

        // 正常登录成功
        ElMessage.success('登录成功！');
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        isLoggedIn.value = true;
        currentUser.value = res.data.user;
        showLoginModal.value = false;

        if (res.data.user.role === 2) { router.push('/admin/dashboard'); }
      } catch (error) {
      } finally { loading.value = false; }
    }
  });
};

// 提交申诉
const submitAppeal = async () => {
  if (!appealContent.value.trim()) return ElMessage.warning('请填写申诉理由');
  appealing.value = true;
  try {
    const res = await request.post('/auth/appeal', {
      user_id: appealUserId.value,
      content: appealContent.value.trim()
    });
    if (res.code === 200) {
      ElMessage.success(res.message);
      showAppealDialog.value = false;
      appealContent.value = '';
    } else {
      ElMessage.warning(res.message);
    }
  } catch (error) {
  } finally { appealing.value = false; }
};

// 【找回的】注册逻辑
const handleRegister = async () => {
  if (!registerRef.value) return;
  await registerRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await request.post('/auth/register', registerForm);
        ElMessage.success('注册成功，请登录！');
        activeTab.value = 'login';
        loginForm.username = registerForm.username;
        registerForm.username = '';
        registerForm.password = '';
      } catch (error) {
      } finally {
        loading.value = false;
      }
    }
  });
};

// 【找回的】退出登录逻辑
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  isLoggedIn.value = false;
  currentUser.value = null;
  ElMessage.info('已退出登录');
  router.push('/');
};

// 【找回的】下拉菜单点击逻辑
const handleCommand = (command) => {
  if (command === 'logout') handleLogout();
  else if (command === 'profile') router.push('/profile');
  else if (command === 'message') router.push('/message'); // 加这行跳转逻辑
};

// 【找回的】发图权限拦截逻辑
const handlePublishClick = () => {
  if (!currentUser.value) return;

  if (currentUser.value.role === 1 || currentUser.value.role === 2) {
    router.push('/upload');
  } else {
    ElMessageBox.confirm(
      '普通用户仅可浏览和点赞。要发布作品，需要先成为认证摄影师，是否前往申请？',
      '权限不足',
      { confirmButtonText: '去申请认证', cancelButtonText: '暂不需要', type: 'warning' }
    ).then(() => {
      router.push('/apply-certification');
    }).catch(() => {});
  }
};
</script>

<style scoped>
.front-layout { min-height: 100vh; background-color: #0a0a0a; color: #ffffff; }
.navbar { height: 70px; display: flex; justify-content: space-between; align-items: center; padding: 0 50px; position: sticky; top: 0; z-index: 100; background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(15px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.logo { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
.nav-links a { color: #888; text-decoration: none; margin: 0 20px; font-size: 16px; transition: 0.3s; }
.nav-links a:hover, .nav-links a.router-link-active { color: #fff; }
.login-btn { color: #fff; text-decoration: none; border: 1px solid #fff; padding: 8px 20px; border-radius: 20px; transition: 0.3s; }
.login-btn:hover { background: #fff; color: #000; }
.upload-btn { color: #000; background: #fff; text-decoration: none; padding: 6px 15px; border-radius: 20px; font-weight: bold; margin-right: 20px; font-size: 14px; transition: 0.3s; }
.upload-btn:hover { transform: scale(1.05); }
.user-actions { display: flex; align-items: center; }
.user-dropdown { display: flex; align-items: center; color: #fff; cursor: pointer; font-size: 14px; font-weight: 500;}
.nav-avatar { margin-right: 10px; border: 1px solid #555; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px); display: flex; justify-content: center; align-items: center; z-index: 999; }
.glass-box { position: relative; width: 400px; background: rgba(30, 30, 30, 0.6); backdrop-filter: blur(20px); padding: 40px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); text-align: center; }
.close-btn { position: absolute; top: 15px; right: 20px; font-size: 20px; color: #888; cursor: pointer; transition: 0.3s; }
.close-btn:hover { color: #fff; transform: scale(1.1); }
.title { color: #fff; font-size: 28px; letter-spacing: 2px; margin-bottom: 5px; }
.subtitle { color: #aaa; margin-bottom: 25px; font-size: 13px; }
.submit-btn { width: 100%; border-radius: 8px; margin-top: 15px; background-color: #fff; color: #000; border: none; font-weight: bold; }
.submit-btn:hover { background-color: #eee; }
.modal-pop-enter-active, .modal-pop-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; transform: scale(0.9) translateY(20px); }
:deep(.el-tabs__item) { color: #888; }
:deep(.el-tabs__item.is-active) { color: #fff; font-weight: bold; }
:deep(.el-tabs__nav-wrap::after) { background-color: rgba(255,255,255,0.1); }
:deep(.el-input__wrapper) { background-color: rgba(0,0,0,0.4); box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset; }
:deep(.el-input__inner) { color: #fff; }

/* 申诉弹窗样式 */
:deep(.dark-dialog) { background: #1a1a1c; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
:deep(.dark-dialog .el-dialog__title) { color: #fff; font-weight: 500; }
:deep(.dark-input .el-textarea__inner) { background-color: #111; box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset; color: #fff; border-radius: 8px; }
</style>