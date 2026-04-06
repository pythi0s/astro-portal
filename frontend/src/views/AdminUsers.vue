<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">{{ users.length }} user{{ users.length !== 1 ? 's' : '' }} registered</p>
      </div>
      <button @click="openCreateModal" class="btn btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New User
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
            <p class="text-2xl font-bold">{{ stats.total_users ?? '\u2014' }}</p>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Users</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.active_users ?? '\u2014' }}</p>
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Admins</p>
            <p class="text-2xl font-bold text-purple-600">{{ stats.admin_count ?? '\u2014' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4">
      <select v-model="filterRole" class="form-select">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="astrologer">Astrologer</option>
        <option value="receptionist">Receptionist</option>
      </select>
      <select v-model="filterActive" class="form-select">
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>

    <!-- Users Table -->
    <div class="table-wrap">
      <table class="w-full text-sm">
        <thead>
          <tr class="table-header">
            <th class="text-left px-4 py-3 font-medium">User</th>
            <th class="text-left px-4 py-3 font-medium">Role</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium">Created</th>
            <th class="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in filteredUsers" :key="u.id" class="table-row group">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {{ (u.full_name || u.email)[0].toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ u.full_name || '\u2014' }}</p>
                  <p class="text-xs text-gray-500">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                :class="u.role === 'admin' ? 'badge-purple' : u.role === 'astrologer' ? 'badge-blue' : 'badge-gray'">
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                :class="u.is_active ? 'badge-green' : 'badge-red'">
                {{ u.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(u.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="openEditModal(u)" title="Edit" class="btn-icon-amber">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button v-if="u.is_active" @click="confirmDeactivate(u)" title="Deactivate" class="btn-icon-red">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredUsers.length">
            <td colspan="5" class="text-center py-12">
              <div class="empty-state">
                <svg class="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p class="text-gray-400 font-medium">No users found</p>
                <p class="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-panel max-w-md animate-slideUp">
        <div class="modal-header">
          <h2 class="text-lg font-bold">{{ editingUser ? 'Edit User' : 'Create User' }}</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form @submit.prevent="handleSave">
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Email *</label>
              <input v-model="form.email" type="email" required class="form-input" />
            </div>
            <div>
              <label class="form-label">{{ editingUser ? 'New Password (leave blank to keep)' : 'Password *' }}</label>
              <input v-model="form.password" type="password" :required="!editingUser" class="form-input" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">Full Name</label>
                <input v-model="form.full_name" class="form-input" />
              </div>
              <div>
                <label class="form-label">Phone</label>
                <input v-model="form.phone" class="form-input" />
              </div>
            </div>
            <div>
              <label class="form-label">Role</label>
              <select v-model="form.role" class="form-select w-full">
                <option value="admin">Admin</option>
                <option value="astrologer">Astrologer</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
            <div v-if="editingUser" class="flex items-center gap-2">
              <input type="checkbox" v-model="form.is_active" id="is_active" class="rounded text-primary-600 focus:ring-primary-500" />
              <label for="is_active" class="text-sm text-gray-700">Active</label>
            </div>
            <div v-if="error" class="alert-error">{{ error }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showModal = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" :disabled="saving" class="btn btn-primary">
              <span v-if="saving" class="spinner-sm mr-2"></span>
              {{ saving ? 'Saving...' : (editingUser ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Deactivate Confirmation Modal -->
    <div v-if="deactivateTarget" class="modal-overlay" @click.self="deactivateTarget = null">
      <div class="modal-panel max-w-sm animate-slideUp">
        <div class="modal-body">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Deactivate User</h3>
              <p class="text-sm text-gray-500">The user will no longer be able to log in.</p>
            </div>
          </div>
          <p class="text-sm text-gray-600 mb-4">Are you sure you want to deactivate <strong>{{ deactivateTarget.full_name || deactivateTarget.email }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button @click="deactivateTarget = null" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeactivate" :disabled="deactivating" class="btn bg-red-600 text-white hover:bg-red-700">
            <span v-if="deactivating" class="spinner-sm mr-2"></span>
            {{ deactivating ? 'Deactivating...' : 'Deactivate' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listUsers, createUser, updateUser, deactivateUser, getAdminStats } from '@/api/admin'
import dayjs from 'dayjs'

const users = ref([])
const stats = ref({})
const showModal = ref(false)
const editingUser = ref(null)
const saving = ref(false)
const error = ref('')
const form = ref({ email: '', password: '', full_name: '', phone: '', role: 'astrologer', is_active: true })

const filterRole = ref('')
const filterActive = ref('')

const deactivateTarget = ref(null)
const deactivating = ref(false)

function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY') : '\u2014' }

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    if (filterRole.value && u.role !== filterRole.value) return false
    if (filterActive.value === 'true' && !u.is_active) return false
    if (filterActive.value === 'false' && u.is_active) return false
    return true
  })
})

async function loadUsers() {
  try {
    const { data } = await listUsers()
    users.value = data
  } catch { users.value = [] }
}

async function loadStats() {
  try {
    const { data } = await getAdminStats()
    stats.value = data
  } catch { stats.value = {} }
}

function openCreateModal() {
  editingUser.value = null
  form.value = { email: '', password: '', full_name: '', phone: '', role: 'astrologer', is_active: true }
  error.value = ''
  showModal.value = true
}

function openEditModal(user) {
  editingUser.value = user
  form.value = {
    email: user.email,
    password: '',
    full_name: user.full_name || '',
    phone: user.phone || '',
    role: user.role,
    is_active: user.is_active,
  }
  error.value = ''
  showModal.value = true
}

async function handleSave() {
  saving.value = true
  error.value = ''
  try {
    if (editingUser.value) {
      const payload = { ...form.value }
      if (!payload.password) delete payload.password
      await updateUser(editingUser.value.id, payload)
    } else {
      await createUser(form.value)
    }
    showModal.value = false
    await loadUsers()
    await loadStats()
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to save user'
  } finally {
    saving.value = false
  }
}

function confirmDeactivate(user) {
  deactivateTarget.value = user
}

async function handleDeactivate() {
  deactivating.value = true
  try {
    await deactivateUser(deactivateTarget.value.id)
    deactivateTarget.value = null
    await loadUsers()
    await loadStats()
  } finally {
    deactivating.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadStats()
})
</script>
