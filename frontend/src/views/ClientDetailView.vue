<template>
  <div v-if="client">
    <!-- Header -->
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-2">
        <img v-if="client.photo_path" :src="`/api/clients/${client.id}/photo`" class="client-photo-lg" />
        <span v-else class="client-photo-lg photo-placeholder" style="font-size:2rem">
          {{ client.first_name[0] }}{{ client.last_name[0] }}
        </span>
        <div>
          <h1>{{ client.first_name }} {{ client.last_name }}</h1>
          <p class="text-muted text-sm">Added {{ formatDate(client.created_at) }}</p>
        </div>
      </div>
      <div class="flex gap-1">
        <router-link :to="`/clients/${client.id}/edit`" class="btn btn-outline">Edit</router-link>
        <button class="btn btn-danger" @click="confirmDelete">Delete</button>
      </div>
    </div>

    <!-- Upload section -->
    <div class="card flex gap-2 items-center">
      <div>
        <label class="btn btn-outline btn-sm">
          Upload Photo
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden @change="uploadFile($event, 'photo')" />
        </label>
      </div>
      <div>
        <label class="btn btn-outline btn-sm">
          Upload Kundali PDF
          <input type="file" accept="application/pdf" hidden @change="uploadFile($event, 'kundali')" />
        </label>
      </div>
      <a v-if="client.kundali_pdf_path" :href="`/api/clients/${client.id}/kundali`" target="_blank" class="btn btn-outline btn-sm">
        View Kundali
      </a>
    </div>

    <!-- Client Details -->
    <div class="card">
      <h3 class="mb-2">Client Details</h3>
      <div class="form-grid">
        <div><strong>Mobile:</strong> {{ client.mobile_number || '–' }}</div>
        <div><strong>Email:</strong> {{ client.email || '–' }}</div>
        <div><strong>Gender:</strong> {{ client.gender || '–' }}</div>
        <div><strong>DOB:</strong> {{ client.date_of_birth || '–' }}</div>
        <div><strong>Time of Birth:</strong> {{ client.time_of_birth || '–' }}</div>
        <div><strong>Place of Birth:</strong> {{ client.place_of_birth || '–' }}</div>
        <div><strong>City:</strong> {{ client.city || '–' }}</div>
        <div><strong>State:</strong> {{ client.state || '–' }}</div>
        <div><strong>Pincode:</strong> {{ client.pincode || '–' }}</div>
        <div><strong>Country:</strong> {{ client.country || '–' }}</div>
      </div>
    </div>

    <div class="card">
      <h3 class="mb-2">Astrological Details</h3>
      <div class="form-grid">
        <div><strong>Rashi:</strong> {{ client.rashi || '–' }}</div>
        <div><strong>Nakshatra:</strong> {{ client.nakshatra || '–' }}</div>
        <div><strong>Lagna:</strong> {{ client.lagna || '–' }}</div>
        <div><strong>Gotra:</strong> {{ client.gotra || '–' }}</div>
        <div><strong>Manglik:</strong> {{ client.manglik_status || '–' }}</div>
        <div><strong>Referred By:</strong> {{ client.referred_by || '–' }}</div>
      </div>
      <div v-if="client.notes" style="margin-top:1rem">
        <strong>Notes:</strong>
        <p class="text-sm" style="white-space:pre-wrap">{{ client.notes }}</p>
      </div>
    </div>

    <!-- Interaction Timeline -->
    <div class="card">
      <div class="flex justify-between items-center mb-2">
        <h3>Consultation Timeline</h3>
        <button class="btn btn-primary btn-sm" @click="showModal = true">+ Add Interaction</button>
      </div>

      <div v-if="client.interactions?.length" class="timeline">
        <div v-for="i in client.interactions" :key="i.id" class="timeline-item">
          <div class="timeline-date">{{ formatDateTime(i.interaction_date) }}</div>
          <span class="timeline-type">{{ i.interaction_type }}</span>
          <div class="timeline-summary">{{ i.summary }}</div>
          <div v-if="i.solutions_given" class="timeline-details"><strong>Solutions:</strong> {{ i.solutions_given }}</div>
          <div v-if="i.remedies" class="timeline-details"><strong>Remedies:</strong> {{ i.remedies }}</div>
          <div v-if="i.fees_charged" class="timeline-details"><strong>Fees:</strong> ₹{{ i.fees_charged }}</div>
          <div v-if="i.next_followup_date" class="timeline-details"><strong>Next Follow-up:</strong> {{ i.next_followup_date }}</div>
          <div class="flex gap-1" style="margin-top:0.3rem">
            <button class="btn btn-outline btn-sm" @click="editInteraction(i)">Edit</button>
            <button class="btn btn-danger btn-sm" @click="deleteInteraction(i.id)">Delete</button>
          </div>
        </div>
      </div>
      <p v-else class="text-muted">No interactions recorded yet.</p>
    </div>

    <!-- Add/Edit Interaction Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editingInteraction ? 'Edit Interaction' : 'New Interaction' }}</h3>
        <form @submit.prevent="saveInteraction">
          <div class="form-grid">
            <div class="form-group">
              <label>Date & Time *</label>
              <input v-model="intForm.interaction_date" type="datetime-local" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Type *</label>
              <select v-model="intForm.interaction_type" class="form-control" required>
                <option value="">Select</option>
                <option value="consultation">Consultation</option>
                <option value="phone_call">Phone Call</option>
                <option value="follow_up">Follow Up</option>
                <option value="remedy">Remedy</option>
                <option value="prediction">Prediction</option>
                <option value="puja">Puja</option>
                <option value="gemstone">Gemstone</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Summary *</label>
            <input v-model="intForm.summary" class="form-control" required maxlength="500" />
          </div>
          <div class="form-group">
            <label>Details</label>
            <textarea v-model="intForm.details" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Solutions Given</label>
            <textarea v-model="intForm.solutions_given" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Remedies</label>
            <textarea v-model="intForm.remedies" class="form-control"></textarea>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Fees Charged (₹)</label>
              <input v-model="intForm.fees_charged" type="number" step="0.01" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label>Payment Mode</label>
              <select v-model="intForm.payment_mode" class="form-control">
                <option value="">Select</option>
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Next Follow-up</label>
              <input v-model="intForm.next_followup_date" type="date" class="form-control" />
            </div>
          </div>
          <div class="flex gap-1" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary">Save</button>
            <button type="button" class="btn btn-outline" @click="showModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="card text-muted">Loading...</div>
  <div v-else class="card text-muted">Client not found.</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const client = ref(null)
const loading = ref(true)
const showModal = ref(false)
const editingInteraction = ref(null)

const intForm = ref(emptyInteraction())

function emptyInteraction() {
  return {
    interaction_date: new Date().toISOString().slice(0, 16),
    interaction_type: '',
    summary: '',
    details: '',
    solutions_given: '',
    remedies: '',
    fees_charged: '',
    payment_mode: '',
    next_followup_date: '',
  }
}

async function fetchClient() {
  loading.value = true
  try {
    const { data } = await api.get(`/clients/${route.params.id}`)
    client.value = data
  } catch {
    client.value = null
  } finally {
    loading.value = false
  }
}

function editInteraction(i) {
  editingInteraction.value = i.id
  intForm.value = {
    interaction_date: i.interaction_date?.slice(0, 16) || '',
    interaction_type: i.interaction_type || '',
    summary: i.summary || '',
    details: i.details || '',
    solutions_given: i.solutions_given || '',
    remedies: i.remedies || '',
    fees_charged: i.fees_charged || '',
    payment_mode: i.payment_mode || '',
    next_followup_date: i.next_followup_date || '',
  }
  showModal.value = true
}

async function saveInteraction() {
  const payload = { ...intForm.value }
  // Clean up empty optional fields
  for (const key of ['details', 'solutions_given', 'remedies', 'payment_mode', 'next_followup_date']) {
    if (!payload[key]) delete payload[key]
  }
  if (!payload.fees_charged) delete payload.fees_charged
  else payload.fees_charged = parseFloat(payload.fees_charged)

  try {
    if (editingInteraction.value) {
      await api.put(`/clients/${client.value.id}/interactions/${editingInteraction.value}`, payload)
    } else {
      await api.post(`/clients/${client.value.id}/interactions`, payload)
    }
    showModal.value = false
    editingInteraction.value = null
    intForm.value = emptyInteraction()
    await fetchClient()
  } catch (e) {
    alert(e.response?.data?.detail || 'Failed to save interaction')
  }
}

async function deleteInteraction(interactionId) {
  if (!confirm('Delete this interaction?')) return
  try {
    await api.delete(`/clients/${client.value.id}/interactions/${interactionId}`)
    await fetchClient()
  } catch (e) {
    alert('Failed to delete interaction')
  }
}

async function confirmDelete() {
  if (!confirm(`Delete ${client.value.first_name} ${client.value.last_name} and all their records?`)) return
  try {
    await api.delete(`/clients/${client.value.id}`)
    router.push('/clients')
  } catch (e) {
    alert('Failed to delete client')
  }
}

async function uploadFile(event, type) {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    await api.post(`/clients/${client.value.id}/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await fetchClient()
  } catch (e) {
    alert(e.response?.data?.detail || `Failed to upload ${type}`)
  }
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d) {
  if (!d) return '–'
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchClient)
</script>
