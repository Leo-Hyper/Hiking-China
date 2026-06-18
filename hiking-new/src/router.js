import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/routes', name: 'Routes', component: () => import('./views/Routes.vue') },
  { path: '/forum', name: 'Forum', component: () => import('./views/Forum.vue') },
  { path: '/gear', name: 'Gear', component: () => import('./views/Gear.vue') },
  { path: '/events', name: 'Events', component: () => import('./views/Events.vue') },
  { path: '/post/:id', name: 'PostDetail', component: () => import('./views/PostDetail.vue') },
  { path: '/login', name: 'Login', component: () => import('./views/auth/AuthPage.vue') },
  { path: '/register', name: 'Register', component: () => import('./views/auth/AuthPage.vue') },
  { path: '/profile', name: 'Profile', component: () => import('./views/auth/ProfilePage.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
