<template>
  <div>
    <!-- KPI cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-primary-600">{{ solutions.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Total Solutions</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-emerald-600">{{ uniqueCategories }}</p>
        <p class="text-xs text-gray-500 mt-1">Categories Used</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ withDescription }}</p>
        <p class="text-xs text-gray-500 mt-1">With Description</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-amber-600">{{ withInstructions }}</p>
        <p class="text-xs text-gray-500 mt-1">With Instructions</p>
      </div>
    </div>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Solutions Catalog</h1>
        <p class="text-gray-500 text-sm mt-1">{{ solutions.length }} solution{{ solutions.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/solutions/new"
        class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Solution
      </router-link>
    </div>

    <div class="mb-4 flex gap-2">
      <select v-model="category" @change="load" class="form-select py-2">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="s in solutions" :key="s.id" class="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group relative">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold">{{ s.name }}</h3>
            <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 capitalize">
              {{ s.category }}
            </span>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="$router.push(`/solutions/${s.id}/edit`)" title="Edit"
              class="btn-icon-amber">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button @click="confirmDelete(s)" title="Delete"
              class="btn-icon-red">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <p v-if="s.description" class="text-sm text-gray-600 mt-3 line-clamp-2">{{ s.description }}</p>
        <p v-if="s.instructions" class="text-sm text-gray-500 mt-2 italic line-clamp-2">{{ s.instructions }}</p>
        <p v-if="s.typical_duration" class="text-xs text-gray-400 mt-2">Duration: {{ s.typical_duration }}</p>
      </div>
    </div>

    <div v-if="!solutions.length" class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
      <p class="text-gray-400 font-medium">No solutions yet</p>
      <p class="text-gray-400 text-sm mt-1">Create your first solution to get started</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { listSolutions, deleteSolution } from '@/api/solutions'

const confirm = inject('confirm')
const solutions = ref([])
const category = ref('')
const categories = ['gemstone', 'mantra', 'puja', 'remedy', 'yantra', 'charity', 'lifestyle', 'other']

const uniqueCategories = computed(() => new Set(solutions.value.map(s => s.category)).size)
const withDescription = computed(() => solutions.value.filter(s => s.description).length)
const withInstructions = computed(() => solutions.value.filter(s => s.instructions).length)

async function load() {
  const params = { is_active: true }
  if (category.value) params.category = category.value
  const { data } = await listSolutions(params)
  solutions.value = data
}

async function confirmDelete(solution) {
  const ok = await confirm({
    title: 'Delete Solution',
    subtitle: 'This will deactivate the solution.',
    message: `Are you sure you want to delete ${solution.name}?`,
    type: 'danger',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  await deleteSolution(solution.id)
  await load()
}

onMounted(load)
</script>
