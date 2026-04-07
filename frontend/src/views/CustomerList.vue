<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">
          Customers
        </h1>
        <p class="page-subtitle">{{ filtered.length }} customer{{ filtered.length !== 1 ? 's' : '' }} in your practice</p>
      </div>
      <router-link to="/customers/new" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Add Customer
      </router-link>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
        <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ customers.length }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">New This Month</p>
        <p class="text-2xl font-extrabold text-emerald-600 mt-1">{{ newThisMonth }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">With Email</p>
        <p class="text-2xl font-extrabold text-blue-600 mt-1">{{ withEmail }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">With Phone</p>
        <p class="text-2xl font-extrabold text-purple-500 mt-1">{{ withPhone }}</p>
      </div>
    </div>

    <!-- Search & filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="search-wrap flex-1">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" class="search-input" placeholder="Search by name, phone, email..." />
      </div>
      <select v-model="filterGender" class="form-select">
        <option value="">All Genders</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="spinner"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert-error">{{ error }}</div>

    <!-- Table -->
    <div v-else-if="filtered.length" class="table-wrap">
      <table class="w-full">
        <thead>
          <tr class="table-header">
            <th>Customer</th>
            <th>Contact</th>
            <th>Rashi</th>
            <th>Created</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c.id" class="table-row border-t border-gray-50 cursor-pointer" @click="$router.push(`/customers/${c.id}`)">
            <td>
              <div class="flex items-center gap-3">
                <img v-if="c.photo_path" :src="`/uploads/${c.photo_path}`" class="w-9 h-9 rounded-xl object-cover ring-2 ring-purple-100" />
                <div v-else class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {{ (c.name || '?')[0].toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800">{{ c.name }}</p>
                  <p class="text-xs text-gray-400">{{ c.city || '' }}</p>
                </div>
              </div>
            </td>
            <td>
              <p class="text-sm">{{ c.phone || '\u2014' }}</p>
              <p class="text-xs text-gray-400">{{ c.email || '' }}</p>
            </td>
            <td>
              <span v-if="c.rashi" class="badge badge-gold">{{ c.rashi }}</span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="text-sm text-gray-500">{{ dayjs(c.created_at).format('DD MMM YY') }}</td>
            <td class="text-right" @click.stop>
              <div class="flex justify-end gap-1">
                <router-link :to="`/customers/${c.id}/edit`" class="btn-icon-purple" title="Edit">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </router-link>
                <button @click="handleDelete(c)" class="btn-icon-red" title="Delete">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <div class="mx-auto mb-4 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
        <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </div>
      <p class="empty-state-title">No customers found</p>
      <p class="empty-state-text">{{ search ? 'Try a different search' : 'Add your first customer to get started' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { getCustomers, deleteCustomer } from '@/api/customers'
import dayjs from 'dayjs'

const confirm = inject('confirm')
const customers = ref([])
const search = ref('')
const filterGender = ref('')
const loading = ref(true)
const error = ref('')

const filtered = computed(() => {
  let list = customers.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    )
  }
  if (filterGender.value) list = list.filter(c => c.gender === filterGender.value)
  return list
})

const newThisMonth = computed(() => {
  const now = dayjs()
  return customers.value.filter(c =>
    dayjs(c.created_at).month() === now.month() &&
    dayjs(c.created_at).year() === now.year()
  ).length
})
const withEmail = computed(() => customers.value.filter(c => c.email).length)
const withPhone = computed(() => customers.value.filter(c => c.phone).length)

onMounted(async () => {
  try {
    const { data } = await getCustomers()
    customers.value = data
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to load customers'
  } finally {
    loading.value = false
  }
})

async function handleDelete(c) {
  const ok = await confirm({
    title: 'Delete Customer',
    subtitle: c.name,
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  await deleteCustomer(c.id)
  customers.value = customers.value.filter(x => x.id !== c.id)
}
</script>
