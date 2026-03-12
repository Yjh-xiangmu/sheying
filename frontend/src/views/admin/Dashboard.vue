<template>
  <div class="dashboard-container">
    <div class="header">
      <h2>控制台大屏</h2>
      <p>实时监控平台运营数据与动态</p>
    </div>

    <el-row :gutter="20" class="data-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card blue">
          <div class="card-icon"><el-icon><User /></el-icon></div>
          <div class="card-info">
            <div class="card-title">注册用户总数</div>
            <div class="card-value">{{ statData.base.total_users }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card green">
          <div class="card-icon"><el-icon><Picture /></el-icon></div>
          <div class="card-info">
            <div class="card-title">平台作品总数</div>
            <div class="card-value">{{ statData.base.total_artworks }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card purple">
          <div class="card-icon"><el-icon><View /></el-icon></div>
          <div class="card-info">
            <div class="card-title">累计浏览人次</div>
            <div class="card-value">{{ statData.base.total_views }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card orange">
          <div class="card-icon"><el-icon><Bell /></el-icon></div>
          <div class="card-info">
            <div class="card-title">待审核认证</div>
            <div class="card-value">{{ statData.base.pending_certs }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">作品分类占比分布</div>
          </template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">高产摄影师 TOP 5 (发图量)</div>
          </template>
          <div ref="barChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { User, Picture, View, Bell } from '@element-plus/icons-vue';
import * as echarts from 'echarts'; // 引入 ECharts
import request from '../../utils/request';

// 基础数据源
const statData = reactive({
  base: { total_users: 0, total_artworks: 0, total_views: 0, pending_certs: 0 }
});

// 图表 DOM 引用
const pieChartRef = ref(null);
const barChartRef = ref(null);

// 初始化饼图
const initPieChart = (data) => {
  const myChart = echarts.init(pieChartRef.value);
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 张 ({d}%)' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: '作品分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: data
      }
    ]
  };
  myChart.setOption(option);
  window.addEventListener('resize', () => myChart.resize()); // 响应式
};

// 初始化柱状图
const initBarChart = (data) => {
  const myChart = echarts.init(barChartRef.value);
  const names = data.map(item => item.name);
  const values = data.map(item => item.value);

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: names, axisTick: { alignWithLabel: true } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '发布作品数',
        type: 'bar',
        barWidth: '40%',
        data: values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };
  myChart.setOption(option);
  window.addEventListener('resize', () => myChart.resize());
};

onMounted(async () => {
  try {
    // 请求统计数据
    const res = await request.get('/admin/statistics');
    statData.base = res.data.base;

    // 等待 DOM 渲染完成后初始化图表
    await nextTick();
    if (res.data.categoryData.length > 0) initPieChart(res.data.categoryData);
    if (res.data.topAuthors.length > 0) initBarChart(res.data.topAuthors);

  } catch (error) {
    console.error('获取统计数据失败', error);
  }
});
</script>

<style scoped>
.dashboard-container { padding: 20px; }
.header { margin-bottom: 30px; }
.header h2 { margin: 0 0 10px; color: #303133; font-size: 24px;}
.header p { margin: 0; color: #909399; font-size: 14px; }

/* 顶部数据卡片样式 */
.data-cards { margin-bottom: 30px; }
.data-card { display: flex; align-items: center; border-radius: 12px; border: none; color: #fff; }
.data-card :deep(.el-card__body) { display: flex; align-items: center; width: 100%; padding: 25px 20px; }

.card-icon { font-size: 48px; margin-right: 20px; opacity: 0.8; }
.card-info { flex: 1; }
.card-title { font-size: 14px; margin-bottom: 10px; opacity: 0.9; }
.card-value { font-size: 32px; font-weight: bold; }

/* 卡片渐变背景色 */
.data-card.blue { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.data-card.green { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.data-card.purple { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); }
.data-card.orange { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }

/* 图表区样式 */
.charts-row .el-card { border-radius: 12px; }
.chart-header { font-weight: bold; color: #333; font-size: 16px; }
.chart-box { width: 100%; height: 350px; }
</style>