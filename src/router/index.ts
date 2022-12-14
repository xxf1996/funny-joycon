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
      },
      {
        path: 'ping-pong',
        name: 'ping-pong',
        component: () => import('@/demos/ping-pong')
      }
    ]
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('@/layout/DemoLayout.vue'),
    children: [
      {
        path: 'tf-2d',
        name: 'tf-2d',
        component: () => import('@/tests/tf-2d')
      },
      {
        path: 'tf-cnn',
        name: 'tf-cnn',
        component: () => import('@/tests/tf-cnn')
      },
      {
        path: 'posture-train',
        name: 'posture-train',
        component: () => import('@/tests/posture-train')
      },
      {
        path: 'similarity',
        name: 'similarity',
        component: () => import('@/tests/similarity')
      },
      {
        path: 'posture-similarity',
        name: 'posture-similarity',
        component: () => import('@/tests/posture-similarity')
      }
    ]
  }
]
const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
