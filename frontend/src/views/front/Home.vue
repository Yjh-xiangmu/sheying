<template>
  <div class="home">
    <div class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <h1 class="fade-up-1">探索无界光影</h1>
        <p class="fade-up-2">发现全球优秀摄影师的灵感之作</p>
      </div>

      <div class="scroll-indicator fade-up-3" @click="scrollToGallery">
        <span class="scroll-text">下滑探索作品</span>
        <el-icon class="arrow-icon"><ArrowDown /></el-icon>
      </div>
    </div>

    <div class="gallery-container" ref="galleryRef">
      <div class="filter-bar">
        <div class="category-tabs">
          <span class="tab-item" :class="{ active: !activeCategory }" @click="selectCategory('')">全部</span>
          <span
            class="tab-item"
            v-for="cat in categories"
            :key="cat.id"
            :class="{ active: activeCategory === cat.id }"
            @click="selectCategory(cat.id)"
          >
            {{ cat.name }}
          </span>
        </div>

        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索作品名称或描述..."
            class="dark-search"
            clearable
            @keyup.enter="loadArtworks"
            @clear="loadArtworks"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <div v-if="loading" class="loading-status">数据检索中...</div>
      <div v-else-if="artworks.length === 0" class="empty-status">未找到符合条件的作品。</div>

      <div v-else class="waterfall">
        <div
          class="artwork-card fade-in-up"
          v-for="(item, index) in artworks"
          :key="item.id"
          @click="goToDetail(item.id)"
          :style="{ animationDelay: `${(index % 10) * 0.1}s` }"
        >
          <div class="img-wrapper">
            <img :src="`http://localhost:3000${item.cover_url}`" :alt="item.title" class="artwork-img" loading="lazy" />
            <div class="overlay">
              <span class="category-tag">{{ item.category_name }}</span>
              <div class="stats"><span>❤️ {{ item.like_count || 0 }}</span></div>
            </div>
          </div>
          <div class="artwork-info">
            <h3 class="title">{{ item.title }}</h3>
            <div class="author">
              <el-avatar :size="24" :src="item.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
              <span class="nickname">{{ item.nickname }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown, Search } from '@element-plus/icons-vue';
import request from '../../utils/request';

const router = useRouter();
const artworks = ref([]);
const categories = ref([]);
const loading = ref(true);
const galleryRef = ref(null);

// 过滤参数
const activeCategory = ref('');
const searchKeyword = ref('');

const scrollToGallery = () => {
  if (galleryRef.value) {
    const y = galleryRef.value.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

const goToDetail = (id) => {
  router.push(`/artwork/${id}`);
};

const selectCategory = (id) => {
  activeCategory.value = id;
  loadArtworks();
};

const loadCategories = async () => {
  try {
    const res = await request.get('/artworks/categories');
    categories.value = res.data;
  } catch (error) {
    ElMessage.error('加载分类信息失败');
  }
};

const loadArtworks = async () => {
  loading.value = true;
  try {
    const res = await request.get('/artworks/list', {
      params: {
        category_id: activeCategory.value,
        keyword: searchKeyword.value
      }
    });
    artworks.value = res.data;
  } catch (error) {
    ElMessage.error('加载作品列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategories();
  loadArtworks();
});
</script>

<style scoped>
.home { background-color: #0a0a0a; }

.hero-section { position: relative; height: calc(100vh - 70px); overflow: hidden; display: flex; justify-content: center; align-items: center; }
.hero-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000&auto=format&fit=crop') no-repeat center center; background-size: cover; z-index: 1; animation: slowZoom 20s infinite alternate linear; }
@keyframes slowZoom { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
.hero-content { text-align: center; color: #fff; z-index: 2; margin-top: -50px; }
.hero-content h1 { font-size: 4rem; margin-bottom: 20px; letter-spacing: 4px; text-shadow: 0 4px 15px rgba(0,0,0,0.6); }
.hero-content p { font-size: 1.5rem; color: #ddd; letter-spacing: 2px; }

.scroll-indicator { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 3; display: flex; flex-direction: column; align-items: center; color: rgba(255, 255, 255, 0.6); cursor: pointer; transition: color 0.3s; animation: bounce 2s infinite; }
.scroll-indicator:hover { color: #fff; }
.scroll-text { font-size: 12px; letter-spacing: 2px; margin-bottom: 8px; text-transform: uppercase; }
.arrow-icon { font-size: 24px; }
@keyframes bounce { 0%, 20%, 50%, 80%, 100% { transform: translate(-50%, 0); } 40% { transform: translate(-50%, -10px); } 60% { transform: translate(-50%, -5px); } }
.fade-up-1 { animation: fadeUp 1s ease-out forwards; }
.fade-up-2 { opacity: 0; animation: fadeUp 1s ease-out 0.3s forwards; }
.fade-up-3 { opacity: 0; animation: fadeUp 1s ease-out 0.8s forwards; }
@keyframes fadeUp { 0% { opacity: 0; transform: translateY(30px); } 100% { opacity: 1; transform: translateY(0); } }

.gallery-container { max-width: 1400px; margin: 0 auto; padding: 60px 20px; min-height: 80vh; }

/* 过滤与搜索栏样式 */
.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; flex-wrap: wrap; gap: 20px;}
.category-tabs { display: flex; gap: 20px; overflow-x: auto; white-space: nowrap; }
.tab-item { color: #888; font-size: 16px; cursor: pointer; padding: 5px 0; position: relative; transition: color 0.3s; }
.tab-item:hover { color: #fff; }
.tab-item.active { color: #fff; font-weight: bold; }
.tab-item.active::after { content: ''; position: absolute; bottom: -20px; left: 0; width: 100%; height: 2px; background-color: #fff; }

.search-box { width: 300px; }
:deep(.dark-search .el-input__wrapper) { background-color: rgba(20, 20, 22, 0.8); box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset; border-radius: 20px; padding: 0 15px;}
:deep(.dark-search .el-input__inner) { color: #fff; }

.loading-status, .empty-status { text-align: center; color: #888; padding: 100px 0; font-size: 16px; letter-spacing: 1px; }

.waterfall { column-count: 4; column-gap: 20px; }
@media (max-width: 1200px) { .waterfall { column-count: 3; } }
@media (max-width: 900px) { .waterfall { column-count: 2; } }
@media (max-width: 600px) { .waterfall { column-count: 1; } }

.artwork-card { break-inside: avoid; margin-bottom: 20px; background: #151515; border-radius: 12px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); opacity: 0; animation: fadeInUp 0.6s ease forwards; }
@keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } from { opacity: 0; transform: translateY(30px); } }
.artwork-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.8); border-color: rgba(255,255,255,0.2); }
.img-wrapper { position: relative; width: 100%; overflow: hidden; }
.artwork-img { width: 100%; display: block; object-fit: cover; transition: transform 0.5s ease; }
.artwork-card:hover .artwork-img { transform: scale(1.05); }

.overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,0.8) 100%); opacity: 0; transition: opacity 0.3s ease; display: flex; flex-direction: column; justify-content: space-between; padding: 15px; }
.artwork-card:hover .overlay { opacity: 1; }

.category-tag { align-self: flex-start; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
.stats { align-self: flex-end; color: #fff; font-size: 14px; font-weight: bold; }
.artwork-info { padding: 15px; }
.title { color: #fff; font-size: 16px; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.author { display: flex; align-items: center; gap: 10px; }
.nickname { color: #aaa; font-size: 13px; }
</style>