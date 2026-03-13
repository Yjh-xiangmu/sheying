<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="logo">FOCUS 控制台</div>
      <ul class="menu">
        <li><router-link to="/admin/dashboard"><el-icon><DataLine /></el-icon> 仪表盘</router-link></li>
        <li><router-link to="/admin/cert-audit"><el-icon><Stamp /></el-icon> 资质审核</router-link></li>
        <li><router-link to="/admin/users"><el-icon><User /></el-icon> 用户管理</router-link></li>
        <li><router-link to="/admin/reports"><el-icon><Warning /></el-icon> 举报处理</router-link></li>
        <li><router-link to="/admin/appeals"><el-icon><DocumentChecked /></el-icon> 申诉审核</router-link></li>
        <li><router-link to="/admin/comments"><el-icon><ChatLineRound /></el-icon> 评论审核</router-link></li>
      </ul>

      <div class="logout-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon> 退出登录
      </div>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 【修复报错】：这里把所有后台需要的图标合并到了同一行，去掉了重复的 import
import { DataLine, Stamp, User, Warning, DocumentChecked, SwitchButton, ChatLineRound } from '@element-plus/icons-vue';

const router = useRouter();

const handleLogout = () => {
  // 清除本地存储，彻底断开登录状态
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  ElMessage.info('管理员已安全退出');
  // 跳转回前台默认首页
  router.push('/');
};
</script>

<style scoped>
.admin-layout { display: flex; height: 100vh; background-color: #f5f7fa; }

.sidebar {
  width: 250px; background-color: #2b2f3a; color: #fff;
  display: flex; flex-direction: column;
}
.logo { height: 70px; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; border-bottom: 1px solid #1f2229; letter-spacing: 2px;}

.menu { list-style: none; padding: 0; margin: 0; flex: 1; }
.menu li a { display: flex; align-items: center; gap: 10px; color: #aeb9c2; text-decoration: none; padding: 20px; transition: 0.3s; }
.menu li a:hover, .menu li a.router-link-active { background-color: #1f2229; color: #409EFF; border-left: 4px solid #409EFF; }

/* 底部退出按钮样式 */
.logout-btn {
  padding: 20px; display: flex; align-items: center; justify-content: center; gap: 10px;
  background-color: #1f2229; color: #f56c6c; cursor: pointer; transition: 0.3s; font-weight: bold;
}
.logout-btn:hover { background-color: #f56c6c; color: #fff; }

.main-content { flex: 1; padding: 20px; overflow-y: auto; }
</style>