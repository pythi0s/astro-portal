<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Solutions Catalog</h1>
        <p class="text-gray-500 text-sm mt-1">{{ solutions.length }} solution{{ solutions.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/solutions/new"
        class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Solution
      </router-link>
    </div>

    <div class="mb-4 flex gap-2">
      <select v-model="category" @change="load" class="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
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
          <!-- Quick actions -->
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button @click="$router.push(`/solutions/${s.id}/edit`)" title="Edit"
              class="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button @click="confirmDelete(s)" title="Delete"
              class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
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

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="deleteTarget = null">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 class="font-semibold">Delete Solution</h3>
            <p class="text-sm text-gray-500">This will deactivate the solution.</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?</p>
        <div class="flex gap-3 justify-end">
          <button @click="deleteTarget = null" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button @click="handleDelete" :disabled="deleting" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listSolutions, deleteSolution } from '@/api/solutions'

const solutions = ref([])
const category = ref('')
const categories = ['gemstone', 'mantra', 'puja', 'remedy', 'yantra', 'charity', 'lifestyle', 'other']
const deleteTarget = ref(null)
const deleting = ref(false)

async function load() {
  const params = { is_active: true }
  if (category.value) params.category = category.value
  const { data } = await listSolutions(params)
  solutions.value = data
}

function confirmDelete(solution) {
  deleteTarget.value = solution
}

async function handleDelete() {
  deleting.value = true
  try {
    await deleteSolution(deleteTarget.value.id)
    deleteTarget.value = null
    await load()
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>
