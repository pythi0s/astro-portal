<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Template' : 'New Template' }}</h1>

    <form @submit.prevent="handleSubmit" class="space-y-4 max-w-xl">
      <div class="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Name *</label>
          <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Channel</label>
            <select v-model="form.channel" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Trigger Type</label>
            <select v-model="form.trigger_type" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="first_visit">First Visit</option>
              <option value="follow_up">Follow Up</option>
              <option value="solution_given">Solution Given</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Subject (email only)</label>
          <input v-model="form.subject" class="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Body *</label>
          <textarea v-model="form.body" rows="6" required class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
          <p class="text-xs text-gray-400 mt-1">
            Available placeholders: {{ '{{customer_name}}' }}, {{ '{{customer_email}}' }}, {{ '{{customer_phone}}' }}
          </p>
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
import { listTemplates, createTemplate, updateTemplate } from '@/api/messages'

const route = useRoute()
const router = useRouter()
const props = defineProps({ id: String })
const templateId = props.id || route.params.id
const isEdit = computed(() => !!templateId)
const saving = ref(false)

const form = ref({
  name: '', channel: 'email', trigger_type: 'custom', subject: '', body: '',
})

async function handleSubmit() {
  saving.value = true
  try {
    if (isEdit.value) {
      await updateTemplate(templateId, form.value)
    } else {
      await createTemplate(form.value)
    }
    router.push('/templates')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await listTemplates()
    const tpl = data.find((t) => t.id === Number(templateId))
    if (tpl) Object.keys(form.value).forEach((k) => { if (tpl[k] != null) form.value[k] = tpl[k] })
  }
})
</script>
