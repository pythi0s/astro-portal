import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './views/DashboardView.vue'
import ClientListView from './views/ClientListView.vue'
import ClientDetailView from './views/ClientDetailView.vue'
import ClientFormView from './views/ClientFormView.vue'

const routes = [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/clients', name: 'clients', component: ClientListView },
    { path: '/clients/new', name: 'client-new', component: ClientFormView },
    { path: '/clients/:id', name: 'client-detail', component: ClientDetailView },
    { path: '/clients/:id/edit', name: 'client-edit', component: ClientFormView },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
