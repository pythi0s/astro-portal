<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Solution' : 'New Solution' }}</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4 max-w-xl">
      <div class="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select v-model="form.category" class="w-full px-3 py-2 border rounded-lg text-sm">
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea v-model="form.description" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
          <textarea v-model="form.instructions" rows="3" class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Typical Duration</label>
          <input v-model="form.typical_duration" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 21 days, 3 months" />
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving"
          class="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button type="button" @click="$router.back()" class="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createSolution, getSolution, updateSolution } from '@/api/solutions'

const route = useRoute()
const router = useRouter()
const props = defineProps({ id: String })
const solutionId = props.id || route.params.id
const isEdit = computed(() => !!solutionId)
const saving = ref(false)
const categories = ['gemstone', 'mantra', 'puja', 'remedy', 'yantra', 'charity', 'lifestyle', 'other']

const form = ref({
  name: '', category: 'other', description: '', instructions: '', typical_duration: '',
})

async function handleSubmit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await updateSolution(solutionId, form.value)
    } else {
      await createSolution(form.value)
    }
    router.push('/solutions')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await getSolution(solutionId)
    Object.keys(form.value).forEach((k) => { if (data[k] != null) form.value[k] = data[k] })
  }
})
</script>
