<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Solution' : 'New Solution' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Update solution details' : 'Add a remedy, gemstone, or ritual' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-xl">
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          Solution Info
        </h3>
        <div class="space-y-4">
          <div><label class="form-label">Name *</label><input v-model="form.name" required class="form-input" placeholder="Solution name" /></div>
          <div><label class="form-label">Category *</label><input v-model="form.category" required class="form-input" placeholder="e.g. Gemstone, Ritual, Mantra" /></div>
          <div><label class="form-label">Description</label><textarea v-model="form.description" rows="4" class="form-input" placeholder="Describe this solution..."></textarea></div>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="btn-primary">
          <span v-if="saving" class="spinner-sm"></span>
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button type="button" @click="$router.back()" class="btn-secondary">Cancel</button>
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
const form = ref({ name: '', category: '', description: '' })

async function handleSubmit() {
  saving.value = true
  try {
    if (isEdit.value) { await updateSolution(solutionId, form.value) }
    else { await createSolution(form.value) }
    router.push('/solutions')
  } finally { saving.value = false }
}

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await getSolution(solutionId)
    form.value = { name: data.name || '', category: data.category || '', description: data.description || '' }
  }
})
</script>
