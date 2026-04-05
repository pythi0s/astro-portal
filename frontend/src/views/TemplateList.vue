<template>
  <div>
    <!-- KPI cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-primary-600">{{ templates.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Total Templates</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ emailTemplates.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Email Templates</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ waTemplates.length }}</p>
        <p class="text-xs text-gray-500 mt-1">WhatsApp Templates</p>
      </div>
      <div class="bg-white rounded-xl border p-4 text-center">
        <p class="text-2xl font-bold text-amber-600">{{ messageLogs.length }}</p>
        <p class="text-xs text-gray-500 mt-1">Messages Sent</p>
      </div>
    </div>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Message Templates</h1>
        <p class="text-gray-500 text-sm mt-1">{{ templates.length }} template{{ templates.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/templates/new"
        class="btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        New Template
      </router-link>
    </div>

    <!-- Tabs -->
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
              class="btn-icon-blue">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </button>
            <button v-if="t.channel === 'whatsapp'" @click="openSendWhatsApp(t)" title="Send WhatsApp"
              class="btn-icon-green">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </button>
            <button @click="$router.push(`/templates/${t.id}/edit`)" title="Edit"
              class="btn-icon-amber">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button @click="confirmDelete(t)" title="Delete"
              class="btn-icon-red">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
        <p v-if="t.subject" class="text-sm text-gray-600 mt-3"><strong>Subject:</strong> {{ t.subject }}</p>
        <p class="text-sm text-gray-500 mt-1 whitespace-pre-wrap line-clamp-3">{{ t.body }}</p>
      </div>
      <div v-if="!loading && !templates.length" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        <p class="text-gray-400 font-medium">No templates yet</p>
        <p class="text-gray-400 text-sm mt-1">Create an email or WhatsApp template to start sending messages</p>
      </div>
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Send Email Tab -->
    <div v-if="activeTab === 'Send Email'" class="max-w-xl">
      <div class="bg-white rounded-xl border p-6 space-y-4">
        <h3 class="font-semibold text-gray-700">Compose Email</h3>
        <div v-if="!emailTemplates.length" class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          No email templates found. <router-link to="/templates/new" class="underline font-medium">Create one first</router-link>.
        </div>
        <template v-else>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Customer *</label>
            <select v-model="emailForm.customer_id" required class="form-select w-full">
              <option value="">Select customer...</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.email || 'no email' }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Template *</label>
            <select v-model="emailForm.template_id" required class="form-select w-full">
              <option value="">Select template...</option>
              <option v-for="t in emailTemplates" :key="t.id" :value="t.id">{{ t.name }} \u2014 {{ t.subject }}</option>
            </select>
          </div>
          <div v-if="selectedEmailTemplate" class="bg-gray-50 rounded-lg p-4">
            <p class="text-xs font-medium text-gray-500 mb-1">Preview</p>
            <p class="text-sm font-medium">{{ selectedEmailTemplate.subject }}</p>
            <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{{ selectedEmailTemplate.body }}</p>
          </div>
          <button @click="handleSendEmail" :disabled="sending || !emailForm.customer_id || !emailForm.template_id"
            class="btn-primary px-6">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {{ sending ? 'Sending...' : 'Send Email' }}
          </button>
        </template>
        <div v-if="sendResult" class="rounded-lg p-3 text-sm" :class="sendResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          {{ sendResult.message }}
        </div>
      </div>
    </div>

    <!-- Send WhatsApp Tab -->
    <div v-if="activeTab === 'Send WhatsApp'" class="max-w-xl">
      <div class="bg-white rounded-xl border p-6 space-y-4">
        <h3 class="font-semibold text-gray-700 flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          Compose WhatsApp Message
        </h3>
        <div v-if="!waTemplates.length" class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          No WhatsApp templates found. <router-link to="/templates/new" class="underline font-medium">Create one first</router-link> with channel set to "whatsapp".
        </div>
        <template v-else>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Customer *</label>
            <select v-model="waForm.customer_id" required class="form-select w-full">
              <option value="">Select customer...</option>
              <option v-for="c in waCustomers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.phone || 'no phone' }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Template *</label>
            <select v-model="waForm.template_id" required class="form-select w-full">
              <option value="">Select template...</option>
              <option v-for="t in waTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div v-if="selectedWaTemplate" class="bg-green-50 rounded-lg p-4">
            <p class="text-xs font-medium text-green-700 mb-1">Message Preview</p>
            <p class="text-sm text-green-800 whitespace-pre-wrap">{{ selectedWaTemplate.body }}</p>
          </div>
          <button @click="handleSendWhatsApp" :disabled="waSending || !waForm.customer_id || !waForm.template_id"
            class="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            {{ waSending ? 'Sending...' : 'Send WhatsApp' }}
          </button>
        </template>
        <div v-if="waResult" class="rounded-lg p-3 text-sm" :class="waResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          {{ waResult.message }}
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
              <td class="px-4 py-3 max-w-xs truncate">{{ m.subject || '\u2014' }}</td>
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

    <!-- Send Email from Template Modal -->
    <div v-if="sendEmailModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="sendEmailModal = null">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-bold mb-4">Send Email: {{ sendEmailModal.name }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Select Customer</label>
            <select v-model="modalCustomerId" class="form-select w-full">
              <option value="">Select customer...</option>
              <option v-for="c in emailableCustomers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.email }})</option>
            </select>
          </div>
          <div v-if="sendEmailModal.subject" class="bg-gray-50 rounded-lg p-3">
            <p class="text-xs text-gray-500 mb-1">Subject</p>
            <p class="text-sm font-medium">{{ sendEmailModal.subject }}</p>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="sendEmailModal = null" class="btn-secondary">Cancel</button>
            <button @click="handleModalSend" :disabled="modalSending || !modalCustomerId"
              class="btn-primary">
              {{ modalSending ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div v-if="modalResult" class="rounded-lg p-3 text-sm" :class="modalResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            {{ modalResult.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- Send WhatsApp from Template Modal -->
    <div v-if="sendWaModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="sendWaModal = null">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          Send WhatsApp: {{ sendWaModal.name }}
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Select Customer</label>
            <select v-model="waModalCustomerId" class="form-select w-full">
              <option value="">Select customer...</option>
              <option v-for="c in waCustomers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.phone }})</option>
            </select>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <p class="text-xs text-green-700 mb-1">Message</p>
            <p class="text-sm text-green-800 whitespace-pre-wrap">{{ sendWaModal.body }}</p>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="sendWaModal = null" class="btn-secondary">Cancel</button>
            <button @click="handleWaModalSend" :disabled="waModalSending || !waModalCustomerId"
              class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {{ waModalSending ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div v-if="waModalResult" class="rounded-lg p-3 text-sm" :class="waModalResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            {{ waModalResult.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { listTemplates, deleteTemplate, sendEmail, sendWhatsApp, getMessageLog } from '@/api/messages'
import { listCustomers } from '@/api/customers'
import dayjs from 'dayjs'

const confirm = inject('confirm')
const templates = ref([])
const customers = ref([])
const messageLogs = ref([])
const loading = ref(false)
const activeTab = ref('Templates')
const tabs = ['Templates', 'Send Email', 'Send WhatsApp', 'Message Log']

// Send email form
const emailForm = ref({ customer_id: '', template_id: '' })
const sending = ref(false)
const sendResult = ref(null)

// Send WhatsApp form
const waForm = ref({ customer_id: '', template_id: '' })
const waSending = ref(false)
const waResult = ref(null)

// Send email modal
const sendEmailModal = ref(null)
const modalCustomerId = ref('')
const modalSending = ref(false)
const modalResult = ref(null)

// Send WhatsApp modal
const sendWaModal = ref(null)
const waModalCustomerId = ref('')
const waModalSending = ref(false)
const waModalResult = ref(null)

function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY HH:mm') : '\u2014' }

const emailTemplates = computed(() => templates.value.filter(t => t.channel === 'email'))
const waTemplates = computed(() => templates.value.filter(t => t.channel === 'whatsapp'))
const emailableCustomers = computed(() => customers.value.filter(c => c.email))
const waCustomers = computed(() => customers.value.filter(c => c.phone))
const selectedEmailTemplate = computed(() => emailTemplates.value.find(t => t.id === Number(emailForm.value.template_id)))
const selectedWaTemplate = computed(() => waTemplates.value.find(t => t.id === Number(waForm.value.template_id)))

async function loadTemplates() {
  loading.value = true
  try {
    const { data } = await listTemplates()
    templates.value = data
  } catch {
    templates.value = []
  } finally {
    loading.value = false
  }
}

async function loadCustomers() {
  try {
    const { data } = await listCustomers()
    customers.value = Array.isArray(data) ? data : []
  } catch { customers.value = [] }
}

async function loadLogs() {
  try {
    const { data } = await getMessageLog()
    messageLogs.value = Array.isArray(data) ? data : []
  } catch { messageLogs.value = [] }
}

async function confirmDelete(template) {
  const ok = await confirm({
    title: 'Delete Template',
    subtitle: 'This action cannot be undone.',
    message: `Are you sure you want to delete "${template.name}"?`,
    type: 'danger',
    confirmLabel: 'Delete',
  })
  if (!ok) return
  await deleteTemplate(template.id)
  await loadTemplates()
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
  } finally { sending.value = false }
}

async function handleSendWhatsApp() {
  waSending.value = true
  waResult.value = null
  try {
    await sendWhatsApp({ customer_id: Number(waForm.value.customer_id), template_id: Number(waForm.value.template_id) })
    waResult.value = { ok: true, message: 'WhatsApp message sent successfully!' }
    waForm.value = { customer_id: '', template_id: '' }
    loadLogs()
  } catch (e) {
    waResult.value = { ok: false, message: e.response?.data?.detail || 'Failed to send WhatsApp. Check Twilio settings.' }
  } finally { waSending.value = false }
}

function openSendEmail(template) {
  sendEmailModal.value = template
  modalCustomerId.value = ''
  modalResult.value = null
}

function openSendWhatsApp(template) {
  sendWaModal.value = template
  waModalCustomerId.value = ''
  waModalResult.value = null
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
  } finally { modalSending.value = false }
}

async function handleWaModalSend() {
  waModalSending.value = true
  waModalResult.value = null
  try {
    await sendWhatsApp({ customer_id: Number(waModalCustomerId.value), template_id: sendWaModal.value.id })
    waModalResult.value = { ok: true, message: 'WhatsApp message sent!' }
    loadLogs()
  } catch (e) {
    waModalResult.value = { ok: false, message: e.response?.data?.detail || 'Failed to send WhatsApp. Check Twilio settings.' }
  } finally { waModalSending.value = false }
}

watch(activeTab, (tab) => {
  if (tab === 'Message Log') loadLogs()
  if ((tab === 'Send Email' || tab === 'Send WhatsApp') && !customers.value.length) loadCustomers()
})

onMounted(() => {
  loadTemplates()
  loadCustomers()
})
</script>
