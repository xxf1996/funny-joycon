import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: 'home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/Home.vue')
  },
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/layout/DemoLayout.vue'),
    redirect: { name: 'snake' },
    children: [
      {
        path: 'snake',
        name: 'snake',
        component: () => import('@/demos/snake')
      }
    ]
  }
]
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
