<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">New Visit</h1>
        <p class="page-subtitle">Log a consultation visit</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
      <!-- Visit Details -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Visit Details
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Customer *</label>
            <select v-model="form.customer_id" required class="form-select w-full">
              <option value="">Select customer...</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.phone || c.email || c.id }})</option>
            </select>
          </div>
          <div>
            <label class="form-label">Visit Date</label>
            <input v-model="form.visit_date" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Consultation Type</label>
            <select v-model="form.consultation_type" class="form-select w-full">
              <option value="first_visit">First Visit</option>
              <option value="follow_up">Follow Up</option>
              <option value="special">Special</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label class="form-label">Follow-up Date</label>
            <input v-model="form.follow_up_date" type="date" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Consultation -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Consultation
        </h3>
        <div class="space-y-4">
          <div>
            <label class="form-label">Problems Discussed</label>
            <textarea v-model="form.problems_discussed" rows="2" class="form-input"></textarea>
          </div>
          <div>
            <label class="form-label">Analysis</label>
            <textarea v-model="form.analysis" rows="2" class="form-input"></textarea>
          </div>
          <div>
            <label class="form-label">Recommendations</label>
            <textarea v-model="form.recommendations" rows="2" class="form-input"></textarea>
          </div>
        </div>
      </div>

      <!-- Payment -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Payment
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Fees (&#8377;)</label>
            <input v-model="form.fees" type="number" min="0" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="form-label">Payment Status</label>
            <select v-model="form.payment_status" class="form-select w-full">
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="waived">Waived</option>
            </select>
          </div>
          <div>
            <label class="form-label">Payment Method</label>
            <select v-model="form.payment_method" class="form-select w-full">
              <option value="">&mdash;</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Solutions Given -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Solutions Given
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <label v-for="s in solutions" :key="s.id"
            class="flex items-center gap-2 text-sm p-3 border rounded-xl cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors"
            :class="form.solution_ids.includes(s.id) ? 'bg-primary-50 border-primary-300' : 'border-gray-200'">
            <input type="checkbox" :value="s.id" v-model="form.solution_ids" class="rounded text-primary-600 focus:ring-primary-500" />
            <span>{{ s.name }} <span class="text-gray-400 text-xs">({{ s.category }})</span></span>
          </label>
        </div>
        <div v-if="!solutions.length" class="empty-state py-6">
          <p class="text-gray-400 text-sm">No solutions available. Create some first.</p>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Notes
        </h3>
        <textarea v-model="form.notes" rows="2" class="form-input" placeholder="Additional notes..."></textarea>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="saving" class="btn btn-primary">
          <span v-if="saving" class="spinner-sm mr-2"></span>
          {{ saving ? 'Saving...' : 'Create Visit' }}
        </button>
        <button type="button" @click="$router.back()" class="btn btn-secondary">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listCustomers } from '@/api/customers'
import { listSolutions } from '@/api/solutions'
import { createVisit } from '@/api/visits'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const customers = ref([])
const solutions = ref([])

const form = ref({
  customer_id: route.query.customer_id || '',
  visit_date: new Date().toISOString().split('T')[0],
  consultation_type: 'follow_up',
  problems_discussed: '',
  analysis: '',
  recommendations: '',
  fees: 0,
  payment_status: 'pending',
  payment_method: '',
  follow_up_date: '',
  notes: '',
  solution_ids: [],
})

async function handleSubmit() {
  saving.value = true
  const payload = { ...form.value, customer_id: Number(form.value.customer_id) }
  if (!payload.payment_method) delete payload.payment_method
  if (!payload.follow_up_date) delete payload.follow_up_date
  try {
    await createVisit(payload)
    router.push(form.value.customer_id ? `/customers/${form.value.customer_id}` : '/customers')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [custRes, solRes] = await Promise.all([
    listCustomers({ is_active: true, limit: 200 }),
    listSolutions({ is_active: true }),
  ])
  customers.value = custRes.data
  solutions.value = solRes.data
})
</script>
