<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Templates</h1>
        <p class="page-subtitle">Message templates for email and WhatsApp</p>
      </div>
      <div class="flex gap-2">
        <router-link to="/templates/new" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          New Template
        </router-link>
        <button @click="showBulkModal = true" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Bulk Send
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="stat-card"><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Templates</p><p class="text-2xl font-extrabold text-gray-900 mt-1">{{ templates.length }}</p></div>
      <div class="stat-card"><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p><p class="text-2xl font-extrabold text-blue-600 mt-1">{{ templates.filter(t => t.channel === 'email').length }}</p></div>
      <div class="stat-card"><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</p><p class="text-2xl font-extrabold text-green-600 mt-1">{{ templates.filter(t => t.channel === 'whatsapp').length }}</p></div>
      <div class="stat-card"><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Messages Sent</p><p class="text-2xl font-extrabold text-amber-600 mt-1">{{ messageLogs.length }}</p></div>
    </div>

    <!-- Tabs -->
    <div class="tab-nav">
      <button @click="activeTab = 'templates'" :class="activeTab === 'templates' ? 'tab-btn-active' : 'tab-btn'">Templates</button>
      <button @click="activeTab = 'logs'" :class="activeTab === 'logs' ? 'tab-btn-active' : 'tab-btn'">Message Logs</button>
    </div>

    <!-- Templates Tab -->
    <div v-if="activeTab === 'templates'">
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="search-wrap flex-1">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input v-model="search" class="search-input" placeholder="Search templates..." />
        </div>
        <select v-model="filterChannel" class="form-select">
          <option value="">All Channels</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option>
        </select>
      </div>

      <div v-if="filteredTemplates.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="t in filteredTemplates" :key="t.id" class="card card-hover">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-bold text-gray-800">{{ t.name }}</h3>
              <div class="flex gap-2 mt-1.5">
                <span :class="t.channel === 'email' ? 'badge-blue' : 'badge-green'" class="badge">{{ t.channel }}</span>
                <span class="badge badge-gray capitalize">{{ (t.trigger_type || '').replace(/_/g, ' ') }}</span>
              </div>
            </div>
            <div class="flex gap-1">
              <button @click="previewTemplate(t)" class="btn-icon-amber"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
              <router-link :to="`/templates/${t.id}/edit`" class="btn-icon-blue"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></router-link>
              <button @click="handleDelete(t)" class="btn-icon-red"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          </div>
          <p v-if="t.subject" class="text-sm font-medium text-gray-700 mb-1">{{ t.subject }}</p>
          <p class="text-sm text-gray-500 line-clamp-3">{{ t.body }}</p>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <p class="empty-state-title">No templates found</p>
        <p class="empty-state-text">Create your first template</p>
      </div>
    </div>

    <!-- Logs Tab -->
    <div v-if="activeTab === 'logs'">
      <div v-if="messageLogs.length" class="table-wrap">
        <table class="w-full">
          <thead><tr class="table-header"><th>Date</th><th>Customer</th><th>Channel</th><th>Subject</th><th>Status</th></tr></thead>
          <tbody>
            <tr v-for="log in messageLogs" :key="log.id" class="table-row border-t border-gray-50">
              <td class="text-sm">{{ dayjs(log.sent_at).format('DD MMM YYYY HH:mm') }}</td>
              <td class="font-medium">{{ log.customer_name || '&#x2014;' }}</td>
              <td><span :class="log.channel === 'email' ? 'badge-blue' : 'badge-green'" class="badge">{{ log.channel }}</span></td>
              <td class="text-sm text-gray-600 truncate max-w-xs">{{ log.subject || '&#x2014;' }}</td>
              <td><span :class="log.status === 'sent' ? 'badge-green' : log.status === 'failed' ? 'badge-red' : 'badge-gray'" class="badge capitalize">{{ log.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><p class="empty-state-title">No messages sent yet</p></div>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewTpl" class="modal-overlay" @click.self="previewTpl = null">
      <div class="modal-panel max-w-xl">
        <div class="modal-header flex justify-between items-center">
          <h2 class="text-lg font-bold">{{ previewTpl.name }}</h2>
          <div class="flex gap-2">
            <span :class="previewTpl.channel === 'email' ? 'badge-blue' : 'badge-green'" class="badge">{{ previewTpl.channel }}</span>
            <span class="badge badge-gray capitalize">{{ (previewTpl.trigger_type || '').replace(/_/g, ' ') }}</span>
          </div>
        </div>
        <div class="modal-body">
          <p v-if="previewTpl.subject" class="font-semibold text-gray-800 mb-3">Subject: {{ previewTpl.subject }}</p>
          <div class="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{{ previewTpl.body }}</div>
        </div>
        <div class="modal-footer">
          <button @click="previewTpl = null" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Bulk Send Modal -->
    <div v-if="showBulkModal" class="modal-overlay" @click.self="showBulkModal = false">
      <div class="modal-panel max-w-md">
        <div class="modal-header"><h2 class="text-lg font-bold">Bulk Send Message</h2></div>
        <form @submit.prevent="handleBulkSend">
          <div class="modal-body space-y-4">
            <div><label class="form-label">Template</label>
              <select v-model="bulkForm.template_id" required class="form-select w-full">
                <option value="">Select template...</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }} ({{ t.channel }})</option>
              </select>
            </div>
            <div><label class="form-label">Filter</label>
              <select v-model="bulkForm.filter" class="form-select w-full">
                <option value="all">All Customers</option>
                <option value="with_email">With Email</option>
                <option value="with_phone">With Phone</option>
              </select>
            </div>
            <div v-if="bulkResult" :class="bulkResult.success ? 'alert-success' : 'alert-error'">{{ bulkResult.message }}</div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showBulkModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="bulkSending" class="btn-primary">
              <span v-if="bulkSending" class="spinner-sm"></span>
              {{ bulkSending ? 'Sending...' : 'Send to All' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { listTemplates, deleteTemplate, getMessageLogs, bulkSend } from '@/api/messages'
import dayjs from 'dayjs'

const confirm = inject('confirm')
const templates = ref([])
const messageLogs = ref([])
const search = ref('')
const filterChannel = ref('')
const activeTab = ref('templates')
const previewTpl = ref(null)
const showBulkModal = ref(false)
const bulkSending = ref(false)
const bulkResult = ref(null)
const bulkForm = ref({ template_id: '', filter: 'all' })

const filteredTemplates = computed(() => {
  let list = templates.value
  if (search.value) { const q = search.value.toLowerCase(); list = list.filter(t => t.name.toLowerCase().includes(q) || (t.body||'').toLowerCase().includes(q)) }
  if (filterChannel.value) list = list.filter(t => t.channel === filterChannel.value)
  return list
})

function previewTemplate(t) { previewTpl.value = t }

onMounted(async () => {
  const [tplRes, logRes] = await Promise.all([listTemplates(), getMessageLogs()])
  templates.value = tplRes.data
  messageLogs.value = logRes.data
})

async function handleDelete(t) {
  const ok = await confirm({ title: 'Delete Template', subtitle: t.name, message: 'This will permanently remove this template.', confirmLabel: 'Delete' })
  if (!ok) return
  await deleteTemplate(t.id)
  templates.value = templates.value.filter(x => x.id !== t.id)
}

async function handleBulkSend() {
  bulkSending.value = true; bulkResult.value = null
  try {
    const { data } = await bulkSend(bulkForm.value)
    bulkResult.value = { success: true, message: data.message || `Sent to ${data.sent_count || 0} customers` }
    const logRes = await getMessageLogs()
    messageLogs.value = logRes.data
  } catch (e) {
    bulkResult.value = { success: false, message: e.response?.data?.detail || 'Bulk send failed' }
  } finally { bulkSending.value = false }
}
</script>
