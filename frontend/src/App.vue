<template>
  <div v-if="route.meta?.public">
    <router-view />
  </div>
  <div v-else-if="auth.isLoggedIn" class="flex h-screen bg-gray-50">
    <!-- Sidebar overlay (mobile / unpinned hover) -->
    <div v-if="sidebarOpen && !sidebarPinned" class="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden" @click="sidebarOpen = false"></div>

    <!-- Sidebar -->
    <aside
      class="bg-gradient-to-b from-primary-700 to-primary-800 text-white flex flex-col shrink-0 z-40 transition-all duration-300 ease-in-out"
      :class="[
        sidebarPinned
          ? (sidebarCollapsed ? 'w-16' : 'w-60')
          : (sidebarOpen ? 'fixed inset-y-0 left-0 w-60 shadow-2xl' : 'fixed inset-y-0 -left-60 w-60'),
        sidebarPinned ? 'relative' : ''
      ]"
      @mouseenter="!sidebarPinned && (sidebarOpen = true)"
      @mouseleave="!sidebarPinned && (sidebarOpen = false)"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center border-b border-white/10 px-4 gap-3 shrink-0">
        <span class="text-2xl">&#x2728;</span>
        <span v-if="!sidebarCollapsed || !sidebarPinned || sidebarOpen" class="text-lg font-extrabold tracking-wide whitespace-nowrap">Astro Portal</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <router-link v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 hover:bg-white/10"
          active-class="!bg-white/15 font-bold shadow-sm"
          :title="sidebarCollapsed && sidebarPinned ? item.label : ''">
          <span class="text-lg shrink-0">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed || !sidebarPinned || sidebarOpen" class="whitespace-nowrap">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Sidebar controls -->
      <div class="p-3 border-t border-white/10 flex items-center" :class="sidebarCollapsed && sidebarPinned && !sidebarOpen ? 'justify-center' : 'justify-between'">
        <button @click="togglePin"
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors" :title="sidebarPinned ? 'Unpin sidebar (auto-hide)' : 'Pin sidebar (always visible)'">
          <svg class="w-4 h-4 transition-colors" :class="sidebarPinned ? 'text-white' : 'text-primary-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="sidebarPinned" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button v-if="sidebarPinned && !sidebarCollapsed" @click="sidebarCollapsed = true"
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Collapse">
          <svg class="w-4 h-4 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
        <button v-if="sidebarPinned && sidebarCollapsed" @click="sidebarCollapsed = false"
          class="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Expand">
          <svg class="w-4 h-4 text-primary-200 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col overflow-hidden min-w-0">
      <!-- Top header bar -->
      <header class="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-20">
        <div class="flex items-center gap-3">
          <button v-if="!sidebarPinned" @click="sidebarOpen = !sidebarOpen"
            class="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <!-- Breadcrumbs -->
          <nav class="flex items-center text-sm text-gray-500 gap-1">
            <router-link to="/" class="hover:text-primary-600 transition-colors">Home</router-link>
            <template v-for="(crumb, i) in breadcrumbs" :key="i">
              <svg class="w-3.5 h-3.5 text-gray-300 mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              <router-link v-if="crumb.to" :to="crumb.to" class="hover:text-primary-600 transition-colors">{{ crumb.label }}</router-link>
              <span v-else class="text-gray-800 font-semibold">{{ crumb.label }}</span>
            </template>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-semibold text-primary-600 hidden md:inline">&#x2728; Astro Portal</span>
          <div class="relative">
            <button @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 pr-3 transition-colors">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {{ (auth.user?.full_name || auth.user?.email || '?')[0].toUpperCase() }}
              </div>
              <span class="text-sm font-medium text-gray-700 hidden sm:inline">{{ auth.user?.full_name || auth.user?.email }}</span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div v-if="showUserMenu" class="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 z-50 animate-slide-down">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="font-bold text-sm">{{ auth.user?.full_name || '&#x2014;' }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ auth.user?.email }}</p>
                <span class="inline-block mt-1.5 badge badge-primary capitalize">{{ auth.user?.role }}</span>
              </div>
              <button @click="openProfileEdit" class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Profile
              </button>
              <button @click="handleLogout" class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content with mandala background -->
      <main class="flex-1 overflow-auto relative" style="background-color: #f9fafb;">
        <div class="mandala-overlay"></div>
        <div class="p-6 max-w-7xl mx-auto relative z-10">
          <router-view />
        </div>
      </main>
    </div>

    <!-- Click outside to close user menu -->
    <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false"></div>

    <!-- Profile Edit Modal -->
    <div v-if="showProfileEdit" class="modal-overlay" @click.self="showProfileEdit = false">
      <div class="modal-panel max-w-md">
        <div class="modal-header"><h2 class="text-lg font-bold">Edit Profile</h2></div>
        <form @submit.prevent="handleProfileSave">
          <div class="modal-body space-y-4">
            <div><label class="form-label">Email</label><input :value="auth.user?.email" disabled class="form-input bg-gray-50 text-gray-500 cursor-not-allowed" /></div>
            <div><label class="form-label">Role</label><input :value="auth.user?.role" disabled class="form-input bg-gray-50 text-gray-500 cursor-not-allowed capitalize" /></div>
            <div><label class="form-label">Full Name</label><input v-model="profileForm.full_name" class="form-input" /></div>
            <div><label class="form-label">Phone</label><input v-model="profileForm.phone" class="form-input" /></div>
            <div><label class="form-label">Member Since</label><input :value="formatDate(auth.user?.created_at)" disabled class="form-input bg-gray-50 text-gray-500 cursor-not-allowed" /></div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showProfileEdit = false" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="profileSaving" class="btn-primary">
              <span v-if="profileSaving" class="spinner-sm"></span>
              {{ profileSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Global Confirm Dialog -->
    <div v-if="confirmDialog.show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" @click.self="confirmDialog.show = false">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-slide-up">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="confirmDialog.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 class="font-bold">{{ confirmDialog.title }}</h3>
            <p class="text-sm text-gray-500">{{ confirmDialog.subtitle }}</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-5">{{ confirmDialog.message }}</p>
        <div class="flex gap-3 justify-end">
          <button @click="confirmDialog.show = false; confirmDialog.onCancel?.()" class="btn-secondary">Cancel</button>
          <button @click="confirmDialog.onConfirm?.(); confirmDialog.show = false"
            :class="confirmDialog.type === 'danger' ? 'bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm hover:shadow-md transition-all' : 'btn-primary'">
            {{ confirmDialog.confirmLabel || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, reactive, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { updateMe } from '@/api/auth'
import dayjs from 'dayjs'
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarPinned = ref(true)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const showUserMenu = ref(false)
const showProfileEdit = ref(false)
const profileSaving = ref(false)
const profileForm = ref({ full_name: '', phone: '' })
const confirmDialog = reactive({ show: false, title: '', subtitle: '', message: '', type: 'danger', confirmLabel: 'Confirm', onConfirm: null, onCancel: null })
function showConfirm({ title, subtitle = '', message, type = 'danger', confirmLabel = 'Confirm' }) {
  return new Promise((resolve) => {
    Object.assign(confirmDialog, { show: true, title, subtitle, message, type, confirmLabel, onConfirm: () => resolve(true), onCancel: () => resolve(false) })
  })
}
provide('confirm', showConfirm)
const navItems = computed(() => {
  const items = [
    { to: '/', icon: '\uD83D\uDCCA', label: 'Dashboard' },
    { to: '/customers', icon: '\uD83D\uDC65', label: 'Customers' },
    { to: '/solutions', icon: '\uD83D\uDC8E', label: 'Solutions' },
    { to: '/templates', icon: '\uD83D\uDCE7', label: 'Templates' },
  ]
  if (auth.user?.role === 'admin') { items.push({ to: '/admin/users', icon: '\uD83D\uDD11', label: 'User Management' }) }
  return items
})
function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY') : '\u2014' }
function togglePin() {
  if (sidebarPinned.value) { sidebarPinned.value = false; sidebarCollapsed.value = false; sidebarOpen.value = true }
  else { sidebarPinned.value = true; sidebarCollapsed.value = false; sidebarOpen.value = false }
}
const breadcrumbs = computed(() => {
  const path = route.path
  const crumbs = []
  if (path.startsWith('/customers')) { crumbs.push({ label: 'Customers', to: '/customers' }); if (path === '/customers/new') crumbs.push({ label: 'New Customer' }); else if (path.endsWith('/edit')) crumbs.push({ label: 'Edit Customer' }); else if (route.params.id) crumbs.push({ label: 'Details' }) }
  else if (path.startsWith('/solutions')) { crumbs.push({ label: 'Solutions', to: '/solutions' }); if (path === '/solutions/new') crumbs.push({ label: 'New Solution' }); else if (path.endsWith('/edit')) crumbs.push({ label: 'Edit Solution' }) }
  else if (path.startsWith('/templates')) { crumbs.push({ label: 'Templates', to: '/templates' }); if (path === '/templates/new') crumbs.push({ label: 'New Template' }); else if (path.endsWith('/edit')) crumbs.push({ label: 'Edit Template' }) }
  else if (path.startsWith('/visits')) { crumbs.push({ label: 'New Visit' }) }
  else if (path.startsWith('/admin')) { crumbs.push({ label: 'User Management' }) }
  return crumbs
})
function openProfileEdit() { profileForm.value = { full_name: auth.user?.full_name || '', phone: auth.user?.phone || '' }; showProfileEdit.value = true; showUserMenu.value = false }
async function handleProfileSave() { profileSaving.value = true; try { await updateMe(profileForm.value); await auth.fetchUser(); showProfileEdit.value = false } finally { profileSaving.value = false } }
async function handleLogout() {
  const ok = await showConfirm({ title: 'Sign Out', subtitle: 'You will be logged out', message: 'Are you sure you want to sign out of Astro Portal?', type: 'warning', confirmLabel: 'Sign Out' })
  if (!ok) return; auth.logout(); router.push('/login')
}
</script>
