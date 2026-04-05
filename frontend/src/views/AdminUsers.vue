<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">User Management</h1>
        <p class="text-gray-500 text-sm mt-1">{{ users.length }} user{{ users.length !== 1 ? 's' : '' }}</p>
      </div>
      <button @click="openCreateModal"
        class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New User
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl border p-4">
        <p class="text-xs font-medium text-gray-500 uppercase">Total Users</p>
        <p class="text-2xl font-bold mt-1">{{ stats.total_users ?? '\u2014' }}</p>
      </div>
      <div class="bg-white rounded-xl border p-4">
        <p class="text-xs font-medium text-gray-500 uppercase">Active Users</p>
        <p class="text-2xl font-bold mt-1 text-green-600">{{ stats.active_users ?? '\u2014' }}</p>
      </div>
      <div class="bg-white rounded-xl border p-4">
        <p class="text-xs font-medium text-gray-500 uppercase">Admins</p>
        <p class="text-2xl font-bold mt-1 text-primary-600">{{ stats.admin_count ?? '\u2014' }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-4">
      <select v-model="filterRole" class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="astrologer">Astrologer</option>
        <option value="receptionist">Receptionist</option>
      </select>
      <select v-model="filterActive" class="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="text-left px-4 py-3 font-medium">User</th>
            <th class="text-left px-4 py-3 font-medium">Role</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium">Created</th>
            <th class="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-gray-50 group">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-xs font-bold">
                  {{ (u.full_name || u.email)[0].toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium">{{ u.full_name || '\u2014' }}</p>
                  <p class="text-xs text-gray-500">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full capitalize"
                :class="u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'astrologer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'">
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                {{ u.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(u.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="openEditModal(u)" title="Edit"
                  class="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button v-if="u.is_active" @click="confirmDeactivate(u)" title="Deactivate"
                  class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredUsers.length">
            <td colspan="5" class="text-center py-8 text-gray-400">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit User Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showModal = false">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-bold mb-4">{{ editingUser ? 'Edit User' : 'Create User' }}</h2>
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email *</label>
            <input v-model="form.email" type="email" required
              class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">{{ editingUser ? 'New Password (leave blank to keep)' : 'Password *' }}</label>
            <input v-model="form.password" type="password" :required="!editingUser"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input v-model="form.full_name"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input v-model="form.phone"
              class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select v-model="form.role" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="admin">Admin</option>
              <option value="astrologer">Astrologer</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
          <div v-if="editingUser" class="flex items-center gap-2">
            <input type="checkbox" v-model="form.is_active" id="is_active" class="rounded text-primary-600 focus:ring-primary-500" />
            <label for="is_active" class="text-sm text-gray-700">Active</label>
          </div>
          <div v-if="error" class="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{{ error }}</div>
          <div class="flex gap-3 justify-end pt-2">
            <button type="button" @click="showModal = false"
              class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" :disabled="saving"
              class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : (editingUser ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Deactivate Confirmation Modal -->
    <div v-if="deactivateTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="deactivateTarget = null">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          </div>
          <div>
            <h3 class="font-semibold">Deactivate User</h3>
            <p class="text-sm text-gray-500">The user will no longer be able to log in.</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">Are you sure you want to deactivate <strong>{{ deactivateTarget.full_name || deactivateTarget.email }}</strong>?</p>
        <div class="flex gap-3 justify-end">
          <button @click="deactivateTarget = null" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button @click="handleDeactivate" :disabled="deactivating"
            class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
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
