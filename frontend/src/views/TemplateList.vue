<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Message Templates</h1>
        <p class="text-gray-500 text-sm mt-1">{{ templates.length }} template{{ templates.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/templates/new"
        class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Template
      </router-link>
    </div>

    <!-- Tabs: Templates / Send Email / Message Log -->
    <div class="border-b mb-6">
      <nav class="flex gap-6">
        <button v-for="t in tabs" :key="t" @click="activeTab = t"
          class="pb-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
          {{ t }}
        </button>
      </nav>
    </div>

    <!-- Templates Tab -->
    <div v-if="activeTab === 'Templates'" class="space-y-3">
      <div v-for="t in templates" :key="t.id" class="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow group">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold">{{ t.name }}</h3>
            <div class="flex gap-2 mt-1">
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="t.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'">
                {{ t.channel }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {{ t.trigger_type.replace('_', ' ') }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button v-if="t.channel === 'email'" @click="openSendEmail(t)" title="Send Email"
              class="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </button>
            <button @click="$router.push(`/templates/${t.id}/edit`)" title="Edit"
              class="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button @click="confirmDelete(t)" title="Delete"
              class="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <p v-if="t.subject" class="text-sm text-gray-600 mt-3"><strong>Subject:</strong> {{ t.subject }}</p>
        <p class="text-sm text-gray-500 mt-1 whitespace-pre-wrap line-clamp-3">{{ t.body }}</p>
      </div>
      <div v-if="!templates.length" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <p class="text-gray-400 font-medium">No templates yet</p>
        <p class="text-gray-400 text-sm mt-1">Create an email template to start sending messages</p>
      </div>
    </div>

    <!-- Send Email Tab -->
    <div v-if="activeTab === 'Send Email'" class="max-w-xl">
      <div class="bg-white rounded-xl border p-6 space-y-4">
        <h3 class="font-semibold text-gray-700">Compose Email</h3>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Customer *</label>
          <select v-model="emailForm.customer_id" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">Select customer...</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.email || 'no email' }})</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Template *</label>
          <select v-model="emailForm.template_id" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
            <option value="">Select template...</option>
            <option v-for="t in emailTemplates" :key="t.id" :value="t.id">{{ t.name }} — {{ t.subject }}</option>
          </select>
        </div>
        <div v-if="selectedTemplate" class="bg-gray-50 rounded-lg p-4">
          <p class="text-xs font-medium text-gray-500 mb-1">Preview</p>
          <p class="text-sm font-medium">{{ selectedTemplate.subject }}</p>
          <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{{ selectedTemplate.body }}</p>
        </div>
        <button @click="handleSendEmail" :disabled="sending || !emailForm.customer_id || !emailForm.template_id"
          class="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          {{ sending ? 'Sending...' : 'Send Email' }}
        </button>
        <div v-if="sendResult" class="rounded-lg p-3 text-sm" :class="sendResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          {{ sendResult.message }}
        </div>
      </div>
    </div>

    <!-- Message Log Tab -->
    <div v-if="activeTab === 'Message Log'">
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-600">
            <tr>
              <th class="text-left px-4 py-3 font-medium">Channel</th>
              <th class="text-left px-4 py-3 font-medium">Recipient</th>
              <th class="text-left px-4 py-3 font-medium">Subject</th>
              <th class="text-left px-4 py-3 font-medium">Status</th>
              <th class="text-left px-4 py-3 font-medium">Sent</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="m in messageLogs" :key="m.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="m.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'">{{ m.channel }}</span>
              </td>
              <td class="px-4 py-3">{{ m.recipient }}</td>
              <td class="px-4 py-3 max-w-xs truncate">{{ m.subject || '—' }}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="m.status === 'sent' ? 'bg-green-100 text-green-700' : m.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'">{{ m.status }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(m.sent_at) }}</td>
            </tr>
            <tr v-if="!messageLogs.length">
              <td colspan="5" class="text-center py-8 text-gray-400">No messages sent yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="deleteTarget = null">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 class="font-semibold">Delete Template</h3>
            <p class="text-sm text-gray-500">This will deactivate the template.</p>
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

    <!-- Send Email from Template Modal -->
    <div v-if="sendEmailModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="sendEmailModal = null">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-bold mb-4">Send Email: {{ sendEmailModal.name }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Select Customer</label>
            <select v-model="modalCustomerId" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">Select customer...</option>
              <option v-for="c in emailableCustomers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.email }})</option>
            </select>
          </div>
          <div v-if="sendEmailModal.subject" class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">Subject</p>
            <p class="text-sm font-medium">{{ sendEmailModal.subject }}</p>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="sendEmailModal = null" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button @click="handleModalSend" :disabled="modalSending || !modalCustomerId"
              class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {{ modalSending ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div v-if="modalResult" class="rounded-lg p-3 text-sm" :class="modalResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            {{ modalResult.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { listTemplates, deleteTemplate, sendEmail, getMessageLog } from '@/api/messages'
import { listCustomers } from '@/api/customers'
import dayjs from 'dayjs'

const templates = ref([])
const customers = ref([])
const messageLogs = ref([])
const activeTab = ref('Templates')
const tabs = ['Templates', 'Send Email', 'Message Log']

const deleteTarget = ref(null)
const deleting = ref(false)

// Send email form (tab)
const emailForm = ref({ customer_id: '', template_id: '' })
const sending = ref(false)
const sendResult = ref(null)

// Send email modal (from template action)
const sendEmailModal = ref(null)
const modalCustomerId = ref('')
const modalSending = ref(false)
const modalResult = ref(null)

function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY HH:mm') : '—' }

const emailTemplates = computed(() => templates.value.filter(t => t.channel === 'email'))
const emailableCustomers = computed(() => customers.value.filter(c => c.email))
const selectedTemplate = computed(() => emailTemplates.value.find(t => t.id === Number(emailForm.value.template_id)))

async function loadTemplates() {
  const { data } = await listTemplates()
  templates.value = data
}

async function loadCustomers() {
  try {
    const { data } = await listCustomers({ is_active: true })
    customers.value = data
  } catch { customers.value = [] }
}

async function loadLogs() {
  try {
    const { data } = await getMessageLog()
    messageLogs.value = Array.isArray(data) ? data : []
  } catch { messageLogs.value = [] }
}

function confirmDelete(template) {
  deleteTarget.value = template
}

async function handleDelete() {
  deleting.value = true
  try {
    await deleteTemplate(deleteTarget.value.id)
    deleteTarget.value = null
    await loadTemplates()
  } finally {
    deleting.value = false
  }
}

async function handleSendEmail() {
  sending.value = true
  sendResult.value = null
  try {
    await sendEmail({ customer_id: Number(emailForm.value.customer_id), template_id: Number(emailForm.value.template_id) })
    sendResult.value = { ok: true, message: 'Email sent successfully!' }
    emailForm.value = { customer_id: '', template_id: '' }
    loadLogs()
  } catch (e) {
    sendResult.value = { ok: false, message: e.response?.data?.detail || 'Failed to send email. Check SMTP settings.' }
  } finally {
    sending.value = false
  }
}

function openSendEmail(template) {
  sendEmailModal.value = template
  modalCustomerId.value = ''
  modalResult.value = null
}

async function handleModalSend() {
  modalSending.value = true
  modalResult.value = null
  try {
    await sendEmail({ customer_id: Number(modalCustomerId.value), template_id: sendEmailModal.value.id })
    modalResult.value = { ok: true, message: 'Email sent successfully!' }
    loadLogs()
  } catch (e) {
    modalResult.value = { ok: false, message: e.response?.data?.detail || 'Failed to send email. Check SMTP settings.' }
  } finally {
    modalSending.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'Message Log') loadLogs()
  if (tab === 'Send Email' && !customers.value.length) loadCustomers()
})

onMounted(() => {
  loadTemplates()
  loadCustomers()
})
</script>
