import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layout/FrontLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/front/Home.vue')
      },
        {
        path: 'upload',
        name: 'Upload',
        component: () => import('../views/front/Upload.vue')
      },
        {
        path: 'artwork/:id', // :id 是动态参数
        name: 'ArtworkDetail',
        component: () => import('../views/front/ArtworkDetail.vue')
      },
        {
        path: 'apply-certification',
        name: 'ApplyCertification',
        component: () => import('../views/front/ApplyCertification.vue')
      },
        {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/front/Profile.vue')
      },
        {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('../views/front/Ranking.vue')
      },
        {
        path: 'message',
        name: 'Message',
        component: () => import('../views/front/Message.vue')
      },
        {
        path: 'user/:id',
        name: 'UserSpace',
        component: () => import('../views/front/UserSpace.vue')
      },
        {
        path: 'feed',
        name: 'Feed',
        component: () => import('../views/front/Feed.vue')
      },
        {
        path: 'forum',
        name: 'Forum',
        component: () => import('../views/front/Forum.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layout/AdminLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
        {
        path: 'cert-audit',
        name: 'CertAudit',
        component: () => import('../views/admin/CertAudit.vue')
      },
        {
        path: 'users',
        name: 'UserManage',
        component: () => import('../views/admin/UserManage.vue')
      },
        {
        path: 'reports',
        name: 'ReportManage',
        component: () => import('../views/admin/ReportManage.vue')
      },
        {
        path: 'appeals',
        name: 'AppealManage',
        component: () => import('../views/admin/AppealManage.vue')
      },
        {
        path: 'comments',
        name: 'CommentManage',
        component: () => import('../views/admin/CommentManage.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router