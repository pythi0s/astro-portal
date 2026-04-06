<template>
  <div v-if="loading" class="flex justify-center py-20"><div class="spinner"></div></div>
  <div v-else-if="customer">
    <!-- Header -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <div class="relative">
          <img v-if="customer.photo_path" :src="`/uploads/${customer.photo_path}`" class="w-16 h-16 rounded-2xl object-cover ring-4 ring-primary-100 shadow-lg" />
          <div v-else class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-primary-100">
            {{ (customer.full_name || '?')[0].toUpperCase() }}
          </div>
        </div>
        <div>
          <h1 class="page-title">{{ customer.full_name }}</h1>
          <div class="flex items-center gap-3 mt-1">
            <span v-if="customer.phone" class="text-sm text-gray-500 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {{ customer.phone }}
            </span>
            <span v-if="customer.email" class="text-sm text-gray-500 flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              {{ customer.email }}
            </span>
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <router-link :to="`/customers/${customer.id}/edit`" class="btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </router-link>
        <button @click="handleDelete" class="btn-secondary !border-0 !bg-red-500/20 !text-primary-700 hover:!bg-red-500/40">
          <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>

    <!-- Info cards row -->
    <div class="grid sm:grid-cols-3 gap-4 mb-6">
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Visits</p>
        <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ customer.visits?.length || 0 }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Fees</p>
        <p class="text-2xl font-extrabold text-gray-900 mt-1">&#x20B9;{{ totalFees.toLocaleString('en-IN') }}</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kundali</p>
        <p class="text-sm font-medium mt-1">
          <a v-if="kundaliFilename" :href="`/uploads/${customer.kundali_chart_path}`" target="_blank" class="text-primary-600 hover:text-primary-700 underline flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {{ kundaliFilename }}
          </a>
          <span v-else class="text-gray-400 italic">Not uploaded</span>
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-nav">
      <button @click="tab = 'details'" :class="tab === 'details' ? 'tab-btn-active' : 'tab-btn'">Details</button>
      <button @click="tab = 'visits'" :class="tab === 'visits' ? 'tab-btn-active' : 'tab-btn'">Visits ({{ customer.visits?.length || 0 }})</button>
      <button @click="tab = 'solutions'" :class="tab === 'solutions' ? 'tab-btn-active' : 'tab-btn'">Solutions ({{ customer.customer_solutions?.length || 0 }})</button>
      <button @click="tab = 'messages'" :class="tab === 'messages' ? 'tab-btn-active' : 'tab-btn'">Messages</button>
      <button @click="tab = 'timeline'" :class="tab === 'timeline' ? 'tab-btn-active' : 'tab-btn'">Timeline</button>
    </div>

    <!-- Details tab -->
    <div v-if="tab === 'details'" class="grid md:grid-cols-2 gap-6">
      <div class="card space-y-4">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">Personal Info</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-gray-400 text-xs uppercase tracking-wider">Gender</span><p class="font-medium capitalize mt-0.5">{{ customer.gender || '&#x2014;' }}</p></div>
          <div><span class="text-gray-400 text-xs uppercase tracking-wider">Date of Birth</span><p class="font-medium mt-0.5">{{ customer.date_of_birth ? dayjs(customer.date_of_birth).format('DD MMM YYYY') : '&#x2014;' }}</p></div>
          <div><span class="text-gray-400 text-xs uppercase tracking-wider">Birth Time</span><p class="font-medium mt-0.5">{{ customer.birth_time || '&#x2014;' }}</p></div>
          <div><span class="text-gray-400 text-xs uppercase tracking-wider">Birth Place</span><p class="font-medium mt-0.5">{{ customer.birth_place || '&#x2014;' }}</p></div>
          <div><span class="text-gray-400 text-xs uppercase tracking-wider">Rashi</span><p class="font-medium mt-0.5">{{ customer.rashi || '&#x2014;' }}</p></div>
          <div><span class="text-gray-400 text-xs uppercase tracking-wider">Nakshatra</span><p class="font-medium mt-0.5">{{ customer.nakshatra || '&#x2014;' }}</p></div>
          <div class="col-span-2"><span class="text-gray-400 text-xs uppercase tracking-wider">Address</span><p class="font-medium mt-0.5">{{ customer.address || '&#x2014;' }}</p></div>
        </div>
      </div>
      <div class="card space-y-4">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 pb-2">Notes</h3>
        <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ customer.notes || 'No notes added.' }}</p>
      </div>
    </div>

    <!-- Visits tab -->
    <div v-if="tab === 'visits'">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Visit History</h3>
        <router-link :to="`/visits/new?customer_id=${customer.id}`" class="btn-primary text-xs">+ Add Visit</router-link>
      </div>
      <div v-if="customer.visits?.length" class="table-wrap">
        <table class="w-full">
          <thead><tr class="table-header"><th>Date</th><th>Type</th><th>Fee</th><th>Notes</th></tr></thead>
          <tbody>
            <tr v-for="v in customer.visits" :key="v.id" class="table-row border-t border-gray-50">
              <td class="font-medium">{{ dayjs(v.visit_date).format('DD MMM YYYY') }}</td>
              <td><span class="badge badge-primary capitalize">{{ v.visit_type }}</span></td>
              <td class="font-bold">&#x20B9;{{ v.fee_charged }}</td>
              <td class="text-gray-500 truncate max-w-xs">{{ v.notes || '&#x2014;' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><p class="empty-state-title">No visits recorded</p><p class="empty-state-text">Log the first visit for this customer</p></div>
    </div>

    <!-- Solutions tab -->
    <div v-if="tab === 'solutions'">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Assigned Solutions</h3>
        <button @click="showAssignModal = true" class="btn-primary text-xs">+ Assign Solution</button>
      </div>
      <div v-if="customer.customer_solutions?.length" class="grid sm:grid-cols-2 gap-4">
        <div v-for="cs in customer.customer_solutions" :key="cs.id" class="card card-hover">
          <div class="flex justify-between items-start">
            <div>
              <h4 class="font-bold text-gray-800">{{ cs.solution?.name || 'Solution' }}</h4>
              <p class="text-xs text-gray-500 mt-1">{{ cs.solution?.category }}</p>
            </div>
            <span :class="cs.status === 'active' ? 'badge-green' : cs.status === 'completed' ? 'badge-blue' : 'badge-gray'" class="badge capitalize">{{ cs.status }}</span>
          </div>
          <p v-if="cs.custom_instructions" class="text-sm text-gray-600 mt-3 line-clamp-2">{{ cs.custom_instructions }}</p>
          <div class="flex gap-2 mt-3 pt-3 border-t border-gray-50">
            <button v-if="cs.status === 'active'" @click="updateSolutionStatus(cs.id, 'completed')" class="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Mark Complete</button>
            <button @click="removeSolution(cs.id)" class="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><p class="empty-state-title">No solutions assigned</p><p class="empty-state-text">Assign solutions to help this customer</p></div>
    </div>

    <!-- Messages tab -->
    <div v-if="tab === 'messages'">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Message History</h3>
        <button @click="showSendMessage = true" class="btn-primary text-xs">Send Message</button>
      </div>
      <div v-if="messages.length" class="space-y-3">
        <div v-for="m in messages" :key="m.id" class="card">
          <div class="flex items-center justify-between mb-2">
            <span :class="m.channel === 'email' ? 'badge-blue' : 'badge-green'" class="badge">{{ m.channel }}</span>
            <span class="text-xs text-gray-400">{{ dayjs(m.sent_at).format('DD MMM YYYY HH:mm') }}</span>
          </div>
          <p class="text-sm font-semibold text-gray-800">{{ m.subject || 'No subject' }}</p>
          <p class="text-sm text-gray-600 mt-1 line-clamp-3">{{ m.body }}</p>
          <p class="text-xs mt-2" :class="m.status === 'sent' ? 'text-emerald-600' : m.status === 'failed' ? 'text-red-500' : 'text-gray-400'">{{ m.status }}</p>
        </div>
      </div>
      <div v-else class="empty-state"><p class="empty-state-title">No messages sent</p></div>
    </div>

    <!-- Timeline tab -->
    <div v-if="tab === 'timeline'">
      <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Activity Timeline</h3>
      <div v-if="timeline.length" class="relative pl-8">
        <div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div v-for="(event, i) in timeline" :key="i" class="relative mb-6 last:mb-0">
          <div class="absolute -left-3 top-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
               :class="event.type === 'visit' ? 'bg-emerald-500' : event.type === 'solution' ? 'bg-amber-500' : 'bg-blue-500'">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
          <div class="card !p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-800">{{ event.title }}</span>
              <span class="text-xs text-gray-400">{{ dayjs(event.date).format('DD MMM YYYY') }}</span>
            </div>
            <p v-if="event.detail" class="text-sm text-gray-500 mt-1">{{ event.detail }}</p>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><p class="empty-state-title">No activity yet</p></div>
    </div>

    <!-- Assign Solution Modal -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="showAssignModal = false">
      <div class="modal-panel max-w-md">
        <div class="modal-header"><h2 class="text-lg font-bold">Assign Solution</h2></div>
        <form @submit.prevent="assignSolution">
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Solution</label>
              <select v-model="assignForm.solution_id" required class="form-select w-full">
                <option value="">Select a solution...</option>
                <option v-for="s in availableSolutions" :key="s.id" :value="s.id">{{ s.name }} ({{ s.category }})</option>
              </select>
            </div>
            <div>
              <label class="form-label">Instructions</label>
              <textarea v-model="assignForm.custom_instructions" rows="3" class="form-input" placeholder="Custom instructions..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showAssignModal = false" class="btn-secondary">Cancel</button>
            <button type="submit" class="btn-primary">Assign</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Send Message Modal -->
    <div v-if="showSendMessage" class="modal-overlay" @click.self="showSendMessage = false">
      <div class="modal-panel max-w-md">
        <div class="modal-header"><h2 class="text-lg font-bold">Send Message</h2></div>
        <form @submit.prevent="sendMessage">
          <div class="modal-body space-y-4">
            <div>
              <label class="form-label">Channel</label>
              <select v-model="msgForm.channel" required class="form-select w-full">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label class="form-label">Template (optional)</label>
              <select v-model="msgForm.template_id" class="form-select w-full">
                <option value="">No template</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div>
              <label class="form-label">Subject</label>
              <input v-model="msgForm.subject" class="form-input" placeholder="Message subject" />
            </div>
            <div>
              <label class="form-label">Body</label>
              <textarea v-model="msgForm.body" rows="4" class="form-input" required placeholder="Write your message..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showSendMessage = false" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="msgSending" class="btn-primary">
              <span v-if="msgSending" class="spinner-sm"></span>
              {{ msgSending ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCustomer, deleteCustomer, assignSolution as apiAssign, updateCustomerSolution, removeCustomerSolution } from '@/api/customers'
import { getSolutions } from '@/api/solutions'
import { getCustomerMessages, sendCustomerMessage } from '@/api/messages'
import { getTimeline } from '@/api/visits'
import dayjs from 'dayjs'

const confirm = inject('confirm')
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const customer = ref(null)
const tab = ref('details')
const messages = ref([])
const timeline = ref([])
const templates = ref([])
const availableSolutions = ref([])
const showAssignModal = ref(false)
const showSendMessage = ref(false)
const msgSending = ref(false)
const assignForm = ref({ solution_id: '', custom_instructions: '' })
const msgForm = ref({ channel: 'email', template_id: '', subject: '', body: '' })

const totalFees = computed(() => (customer.value?.visits || []).reduce((sum, v) => sum + (v.fee_charged || 0), 0))
const kundaliFilename = computed(() => {
  if (!customer.value?.kundali_chart_path) return null
  return customer.value.kundali_chart_path.split('/').pop()
})

onMounted(async () => {
  try {
    const { data } = await getCustomer(route.params.id)
    customer.value = data
    loadMessages()
    loadTimeline()
    const solRes = await getSolutions()
    availableSolutions.value = solRes.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})

async function loadMessages() { try { const { data } = await getCustomerMessages(route.params.id); messages.value = data } catch {} }
async function loadTimeline() { try { const { data } = await getTimeline(route.params.id); timeline.value = data } catch {} }

async function handleDelete() {
  const ok = await confirm({ title: 'Delete Customer', subtitle: customer.value.full_name, message: 'This will permanently delete this customer and all associated data. This action cannot be undone.', confirmLabel: 'Delete' })
  if (!ok) return
  await deleteCustomer(customer.value.id)
  router.push('/customers')
}

async function assignSolution() {
  await apiAssign(customer.value.id, assignForm.value)
  showAssignModal.value = false
  assignForm.value = { solution_id: '', custom_instructions: '' }
  const { data } = await getCustomer(route.params.id)
  customer.value = data
}

async function updateSolutionStatus(csId, status) {
  await updateCustomerSolution(customer.value.id, csId, { status })
  const { data } = await getCustomer(route.params.id)
  customer.value = data
}

async function removeSolution(csId) {
  const ok = await confirm({ title: 'Remove Solution', message: 'Remove this solution assignment?', confirmLabel: 'Remove' })
  if (!ok) return
  await removeCustomerSolution(customer.value.id, csId)
  const { data } = await getCustomer(route.params.id)
  customer.value = data
}

async function sendMessage() {
  msgSending.value = true
  try {
    await sendCustomerMessage(customer.value.id, msgForm.value)
    showSendMessage.value = false
    msgForm.value = { channel: 'email', template_id: '', subject: '', body: '' }
    await loadMessages()
  } finally { msgSending.value = false }
}
</script>
