<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Template' : 'New Template' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Update message template' : 'Create a reusable message template' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-xl">
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Template Info
        </h3>
        <div class="space-y-4">
          <div><label class="form-label">Name *</label><input v-model="form.name" required class="form-input" placeholder="Template name" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Channel</label>
              <select v-model="form.channel" class="form-select w-full"><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>
            </div>
            <div><label class="form-label">Trigger Type</label>
              <select v-model="form.trigger_type" class="form-select w-full"><option value="first_visit">First Visit</option><option value="follow_up">Follow Up</option><option value="solution_given">Solution Given</option><option value="custom">Custom</option></select>
            </div>
          </div>
          <div><label class="form-label">Subject (email only)</label><input v-model="form.subject" class="form-input" placeholder="Message subject" /></div>
          <div>
            <label class="form-label">Body *</label>
            <textarea v-model="form.body" rows="6" required class="form-input" placeholder="Write your template..."></textarea>
            <p class="text-xs text-gray-400 mt-1.5">Placeholders: <code class="text-primary-600">&#123;&#123;customer_name&#125;&#125;</code>, <code class="text-primary-600">&#123;&#123;customer_email&#125;&#125;</code>, <code class="text-primary-600">&#123;&#123;customer_phone&#125;&#125;</code></p>
          </div>
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
import { listTemplates, createTemplate, updateTemplate } from '@/api/messages'

const route = useRoute()
const router = useRouter()
const props = defineProps({ id: String })
const templateId = props.id || route.params.id
const isEdit = computed(() => !!templateId)
const saving = ref(false)
const form = ref({ name: '', channel: 'email', trigger_type: 'custom', subject: '', body: '' })

async function handleSubmit() {
  saving.value = true
  try {
    if (isEdit.value) { await updateTemplate(templateId, form.value) }
    else { await createTemplate(form.value) }
    router.push('/templates')
  } finally { saving.value = false }
}

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await listTemplates()
    const tpl = data.find((t) => t.id === Number(templateId))
    if (tpl) Object.keys(form.value).forEach((k) => { if (tpl[k] != null) form.value[k] = tpl[k] })
  }
})
</script>
