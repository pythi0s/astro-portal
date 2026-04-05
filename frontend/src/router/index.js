import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { public: true } },
    { path: '/', name: 'dashboard', component: () => import('@/views/Dashboard.vue') },
    { path: '/customers', name: 'customers', component: () => import('@/views/CustomerList.vue') },
    { path: '/customers/new', name: 'customer-create', component: () => import('@/views/CustomerForm.vue') },
    { path: '/customers/:id', name: 'customer-detail', component: () => import('@/views/CustomerDetail.vue'), props: true },
    { path: '/customers/:id/edit', name: 'customer-edit', component: () => import('@/views/CustomerForm.vue'), props: true },
    { path: '/visits/new', name: 'visit-create', component: () => import('@/views/VisitForm.vue') },
    { path: '/solutions', name: 'solutions', component: () => import('@/views/SolutionList.vue') },
    { path: '/solutions/new', name: 'solution-create', component: () => import('@/views/SolutionForm.vue') },
    { path: '/solutions/:id/edit', name: 'solution-edit', component: () => import('@/views/SolutionForm.vue'), props: true },
    { path: '/templates', name: 'templates', component: () => import('@/views/TemplateList.vue') },
    { path: '/templates/new', name: 'template-create', component: () => import('@/views/TemplateForm.vue') },
    { path: '/templates/:id/edit', name: 'template-edit', component: () => import('@/views/TemplateForm.vue'), props: true },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to) => {
    const auth = useAuthStore()
    if (!to.meta.public && !auth.token) {
        return { name: 'login' }
    }
})

export default router
