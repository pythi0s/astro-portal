<template>
  <div class="animate-fade-in">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">
          Solutions
        </h1>
        <p class="page-subtitle">{{ filtered.length }} solution{{ filtered.length !== 1 ? 's' : '' }} in your catalog</p>
      </div>
      <router-link to="/solutions/new" class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Solution
      </router-link>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</p>
        <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ solutions.length }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
        <p class="text-2xl font-extrabold text-purple-600 mt-1">{{ categories.length }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">With Price</p>
        <p class="text-2xl font-extrabold text-emerald-600 mt-1">{{ withPrice }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Price</p>
        <p class="text-2xl font-extrabold text-amber-600 mt-1">{{ avgPrice }}</p>
      </div>
    </div>

    <!-- Search & filter -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="search-wrap flex-1">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input v-model="search" class="search-input" placeholder="Search solutions by name..." />
      </div>
      <select v-model="filterCat" class="form-select">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="spinner"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert-error">{{ error }}</div>

    <!-- Solutions grid -->
    <div v-else-if="filtered.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in filtered" :key="s.id" class="card card-hover">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-bold text-gray-800">{{ s.name }}</h3>
            <span class="badge badge-primary mt-1">{{ s.category }}</span>
          </div>
          <div class="flex gap-1">
            <router-link :to="`/solutions/${s.id}/edit`" class="btn-icon-blue">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </router-link>
            <button @click="handleDelete(s)" class="btn-icon-red">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <p class="text-sm text-gray-500 line-clamp-2 mb-3">{{ s.description || 'No description' }}</p>
        <div v-if="s.default_price" class="text-sm font-semibold text-purple-600">
          &#x20B9; {{ Number(s.default_price).toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state">
      <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
      <p class="empty-state-title">No solutions found</p>
      <p class="empty-state-text">Create your first solution to get started</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { getSolutions, deleteSolution } from '@/api/solutions'

const confirm = inject('confirm')
const solutions = ref([])
const search = ref('')
const filterCat = ref('')
const loading = ref(true)
const error = ref('')

const categories = computed(() => [...new Set(solutions.value.map(s => s.category).filter(Boolean))])

const withPrice = computed(() => solutions.value.filter(s => s.default_price).length)

const avgPrice = computed(() => {
  const priced = solutions.value.filter(s => s.default_price)
  if (!priced.length) return '—'
  const avg = priced.reduce((sum, s) => sum + Number(s.default_price), 0) / priced.length
  return '₹' + Math.round(avg).toLocaleString()
})

const filtered = computed(() => {
  let list = solutions.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q))
  }
  if (filterCat.value) list = list.filter(s => s.category === filterCat.value)
  return list
})

onMounted(async () => {
  try {
    const { data } = await getSolutions()
    solutions.value = data
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to load solutions'
  } finally {
    loading.value = false
  }
})

async function handleDelete(s) {
  const ok = await confirm({ title: 'Delete Solution', subtitle: s.name, message: 'This will remove the solution permanently.', confirmLabel: 'Delete' })
  if (!ok) return
  await deleteSolution(s.id)
  solutions.value = solutions.value.filter(x => x.id !== s.id)
}
</script>
