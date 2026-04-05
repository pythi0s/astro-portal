<template>
  <div>
    <!-- KPI cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-primary-600">{{ customers.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Total Customers</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-emerald-600">{{ newThisMonth }}</p>
        <p class="text-xs text-gray-500 mt-1">New This Month</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ withEmail }}</p>
        <p class="text-xs text-gray-500 mt-1">With Email</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-amber-600">{{ withPhone }}</p>
        <p class="text-xs text-gray-500 mt-1">With Phone</p>
      </div>
    </div>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Customers</h1>
        <p class="text-gray-500 text-sm mt-1">{{ customers.length }} customer{{ customers.length !== 1 ? 's' : '' }} found</p>
      </div>
      <router-link to="/customers/new"
        class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Customer
      </router-link>
    </div>

    <div class="mb-4">
      <div class="search-wrap max-w-md">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" @input="debouncedLoad" placeholder="Search by name, phone, email..."
          class="search-input max-w-md" />
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-gray-600">
          <tr>
            <th class="text-left px-4 py-3 font-medium w-12"></th>
            <th class="text-left px-4 py-3 font-medium">Name</th>
            <th class="text-left px-4 py-3 font-medium">Phone</th>
            <th class="text-left px-4 py-3 font-medium">Email</th>
            <th class="text-left px-4 py-3 font-medium">City</th>
            <th class="text-left px-4 py-3 font-medium">Rashi</th>
            <th class="text-left px-4 py-3 font-medium">Joined</th>
            <th class="text-right px-4 py-3 font-medium w-28">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="c in customers" :key="c.id" class="hover:bg-primary-50/30 group transition-colors duration-150">
            <td class="px-4 py-3">
              <img v-if="c.photo_path" :src="`/uploads/${c.photo_path}`" class="w-8 h-8 rounded-full object-cover" />
              <div v-else class="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold">
                {{ c.name?.[0]?.toUpperCase() || '?' }}
              </div>
            </td>
            <td class="px-4 py-3 font-medium cursor-pointer" @click="$router.push(`/customers/${c.id}`)">
              <span class="hover:text-primary-600">{{ c.name }}</span>
            </td>
            <td class="px-4 py-3">{{ c.phone || '—' }}</td>
            <td class="px-4 py-3">{{ c.email || '—' }}</td>
            <td class="px-4 py-3">{{ c.city || '—' }}</td>
            <td class="px-4 py-3">{{ c.rashi || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ formatDate(c.created_at) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="$router.push(`/customers/${c.id}`)" title="View"
                  class="btn-icon-blue">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button @click="$router.push(`/customers/${c.id}/edit`)" title="Edit"
                  class="btn-icon-amber">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button @click="confirmDelete(c)" title="Delete"
                  class="btn-icon-red">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!customers.length">
            <td colspan="8" class="text-center py-12 text-gray-400">
              <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              No customers found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { listCustomers, deleteCustomer } from '@/api/customers'
import dayjs from 'dayjs'

const confirm = inject('confirm')
const customers = ref([])
const search = ref('')
let debounceTimer = null

const newThisMonth = computed(() => {
  const now = dayjs()
  return customers.value.filter(c => dayjs(c.created_at).isSame(now, 'month')).length
})
const withEmail = computed(() => customers.value.filter(c => c.email).length)
const withPhone = computed(() => customers.value.filter(c => c.phone).length)

function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY') : '—' }

async function load() {
  const params = { is_active: true }
  if (search.value) params.search = search.value
  const { data } = await listCustomers(params)
  customers.value = data
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 300)
}

async function confirmDelete(customer) {
  const ok = await confirm({
    title: 'Delete Customer',
    subtitle: 'This action cannot be undone.',
    message: `Are you sure you want to delete ${customer.name}?`,
    type: 'danger',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  await deleteCustomer(customer.id)
  await load()
}

onMounted(load)
</script>
