<template>
  <div v-if="customer">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <img v-if="customer.photo_path" :src="`/uploads/${customer.photo_path}`"
          class="w-16 h-16 rounded-full object-cover border-2 border-primary-200 shadow-sm" />
        <div v-else class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
          {{ customer.name[0].toUpperCase() }}
        </div>
        <div>
          <h1 class="text-2xl font-bold">{{ customer.name }}</h1>
          <p class="text-gray-500 text-sm">{{ customer.phone || 'No phone' }} · {{ customer.email || 'No email' }}</p>
          <p v-if="customer.city || customer.rashi" class="text-gray-400 text-xs mt-0.5">
            <span v-if="customer.city">{{ customer.city }}</span>
            <span v-if="customer.city && customer.rashi"> · </span>
            <span v-if="customer.rashi">Rashi: {{ customer.rashi }}</span>
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button v-if="customer.email" @click="showSendEmail = true"
          class="px-4 py-2 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-200 flex items-center gap-1.5 text-blue-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Email
        </button>
        <router-link :to="`/customers/${customer.id}/edit`"
          class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </router-link>
        <router-link :to="`/visits/new?customer_id=${customer.id}`"
          class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          New Visit
        </router-link>
        <button @click="showDeleteConfirm = true"
          class="px-3 py-2 rounded-lg text-sm hover:bg-red-50 text-red-500 border hover:border-red-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
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

    <!-- Details Tab -->
    <div v-if="activeTab === 'Details'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl border p-5 space-y-3">
        <h3 class="font-semibold text-gray-700 mb-3">Personal Info</h3>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Gender</span><span class="font-medium capitalize">{{ customer.gender || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Date of Birth</span><span class="font-medium">{{ customer.date_of_birth || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Birth Time</span><span class="font-medium">{{ customer.birth_time || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Birth Place</span><span class="font-medium">{{ customer.birth_place || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Occupation</span><span class="font-medium">{{ customer.occupation || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Marital Status</span><span class="font-medium capitalize">{{ customer.marital_status || '—' }}</span></div>
      </div>
      <div class="bg-white rounded-xl border p-5 space-y-3">
        <h3 class="font-semibold text-gray-700 mb-3">Astrology</h3>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Rashi</span><span class="font-medium">{{ customer.rashi || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Nakshatra</span><span class="font-medium">{{ customer.nakshatra || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Gotra</span><span class="font-medium">{{ customer.gotra || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Lagna</span><span class="font-medium">{{ customer.lagna || '—' }}</span></div>
      </div>
      <div class="bg-white rounded-xl border p-5 space-y-3">
        <h3 class="font-semibold text-gray-700 mb-3">Address</h3>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Address</span><span class="font-medium">{{ customer.address || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">City</span><span class="font-medium">{{ customer.city || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">State</span><span class="font-medium">{{ customer.state || '—' }}</span></div>
        <div class="flex justify-between text-sm"><span class="text-gray-500">Pincode</span><span class="font-medium">{{ customer.pincode || '—' }}</span></div>
      </div>
      <div class="bg-white rounded-xl border p-5 space-y-3">
        <h3 class="font-semibold text-gray-700 mb-3">Files</h3>
        <div class="flex gap-4">
          <div>
            <label class="text-xs text-gray-500 block mb-1.5">Photo</label>
            <input type="file" accept="image/*" @change="handlePhoto" class="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          </div>
          <div>
            <label class="text-xs text-gray-500 block mb-1.5">Kundali</label>
            <input type="file" accept="image/*,.pdf" @change="handleKundali" class="text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
          </div>
        </div>
        <a v-if="customer.kundali_file_path" :href="`/uploads/${customer.kundali_file_path}`"
          target="_blank" class="text-primary-600 text-sm hover:underline inline-flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          View Kundali
        </a>
      </div>
      <div v-if="customer.notes" class="md:col-span-2 bg-white rounded-xl border p-5">
        <h3 class="font-semibold text-gray-700 mb-2">Notes</h3>
        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ customer.notes }}</p>
      </div>
    </div>

    <!-- Timeline Tab -->
    <div v-if="activeTab === 'Timeline'" class="space-y-4">
      <div v-for="event in timeline" :key="`${event.type}-${event.id}`"
        class="bg-white rounded-xl border p-4 flex gap-4 hover:shadow-sm transition-shadow">
        <div class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg" :class="eventColor(event.type)">
          {{ eventIcon(event.type) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between">
            <span class="font-medium text-sm capitalize">{{ event.type }}</span>
            <span class="text-xs text-gray-400">{{ formatDate(event.date) }}</span>
          </div>
          <p v-if="event.type === 'visit'" class="text-sm text-gray-600 mt-1">
            {{ event.consultation_type.replace('_', ' ') }} · ₹{{ event.fees }} ({{ event.payment_status }})
            <template v-if="event.problems_discussed"><br />{{ event.problems_discussed }}</template>
          </p>
          <p v-else-if="event.type === 'solution'" class="text-sm text-gray-600 mt-1">
            {{ event.solution_name }} ({{ event.solution_category }}) — {{ event.status }}
          </p>
          <p v-else-if="event.type === 'message'" class="text-sm text-gray-600 mt-1">
            {{ event.channel }}: {{ event.subject || 'No subject' }} — {{ event.status }}
          </p>
        </div>
      </div>
      <div v-if="!timeline.length" class="text-center py-12">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p class="text-gray-400">No events yet</p>
      </div>
    </div>

    <!-- Solutions Tab -->
    <div v-if="activeTab === 'Solutions'" class="space-y-3">
      <div v-for="s in solutions" :key="s.id" class="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
        <div class="flex items-baseline justify-between">
          <span class="font-medium">{{ s.solution_name }}</span>
          <span class="text-xs px-2 py-0.5 rounded-full"
            :class="s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
            {{ s.status }}
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ s.solution_category }} · Given {{ formatDate(s.given_date) }}</p>
        <p v-if="s.notes" class="text-sm text-gray-600 mt-1">{{ s.notes }}</p>
      </div>
      <div v-if="!solutions.length" class="text-center py-12">
        <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        <p class="text-gray-400">No solutions given</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showDeleteConfirm = false">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 class="font-semibold">Delete Customer</h3>
            <p class="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">Are you sure you want to delete <strong>{{ customer.name }}</strong>?</p>
        <div class="flex gap-3 justify-end">
          <button @click="showDeleteConfirm = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button @click="handleDeleteCustomer" :disabled="deleteLoading" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {{ deleteLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Send Email Modal -->
    <div v-if="showSendEmail" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showSendEmail = false">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 class="text-lg font-bold mb-4">Send Email to {{ customer.name }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Template *</label>
            <select v-model="emailTemplateId" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="">Select a template...</option>
              <option v-for="t in emailTemplates" :key="t.id" :value="t.id">{{ t.name }} — {{ t.subject }}</option>
            </select>
          </div>
          <div class="flex gap-3 justify-end">
            <button @click="showSendEmail = false" class="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button @click="handleSendEmail" :disabled="emailSending || !emailTemplateId"
              class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {{ emailSending ? 'Sending...' : 'Send' }}
            </button>
          </div>
          <div v-if="emailResult" class="rounded-lg p-3 text-sm" :class="emailResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
            {{ emailResult.message }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="flex items-center justify-center py-20">
    <div class="text-center">
      <svg class="w-8 h-8 animate-spin mx-auto text-primary-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
      <p class="text-gray-400 mt-2 text-sm">Loading customer...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { getCustomer, getCustomerSolutions, uploadPhoto, uploadKundali, deleteCustomer } from '@/api/customers'
import { getTimeline } from '@/api/dashboard'
import { listTemplates, sendEmail } from '@/api/messages'

const route = useRoute()
const router = useRouter()
const props = defineProps({ id: String })
const customerId = props.id || route.params.id

const customer = ref(null)
const timeline = ref([])
const solutions = ref([])
const activeTab = ref('Details')
const tabs = ['Details', 'Timeline', 'Solutions']

// Delete
const showDeleteConfirm = ref(false)
const deleteLoading = ref(false)

// Email
const showSendEmail = ref(false)
const emailTemplates = ref([])
const emailTemplateId = ref('')
const emailSending = ref(false)
const emailResult = ref(null)

function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY') : '—' }
function eventIcon(t) { return t === 'visit' ? '🗓' : t === 'solution' ? '💎' : '📧' }
function eventColor(t) {
  return t === 'visit' ? 'bg-blue-100' : t === 'solution' ? 'bg-yellow-100' : 'bg-green-100'
}

async function load() {
  const { data } = await getCustomer(customerId)
  customer.value = data
  const [tlRes, solRes] = await Promise.all([
    getTimeline(customerId),
    getCustomerSolutions(customerId),
  ])
  timeline.value = tlRes.data
  solutions.value = solRes.data
}

async function loadEmailTemplates() {
  try {
    const { data } = await listTemplates({ channel: 'email' })
    emailTemplates.value = (Array.isArray(data) ? data : []).filter(t => t.channel === 'email')
  } catch { emailTemplates.value = [] }
}

async function handlePhoto(e) {
  const file = e.target.files[0]
  if (!file) return
  const { data } = await uploadPhoto(customerId, file)
  customer.value = data
}

async function handleKundali(e) {
  const file = e.target.files[0]
  if (!file) return
  const { data } = await uploadKundali(customerId, file)
  customer.value = data
}

async function handleDeleteCustomer() {
  deleteLoading.value = true
  try {
    await deleteCustomer(customerId)
    router.push('/customers')
  } finally {
    deleteLoading.value = false
  }
}

async function handleSendEmail() {
  emailSending.value = true
  emailResult.value = null
  try {
    await sendEmail({ customer_id: Number(customerId), template_id: Number(emailTemplateId.value) })
    emailResult.value = { ok: true, message: 'Email sent successfully!' }
  } catch (e) {
    emailResult.value = { ok: false, message: e.response?.data?.detail || 'Failed to send email. Check SMTP settings.' }
  } finally {
    emailSending.value = false
  }
}

onMounted(() => {
  load()
  loadEmailTemplates()
})
</script>
