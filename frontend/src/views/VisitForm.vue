<template>
  <div class="animate-fade-in">
    <div class="page-header">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight">
          <span class="gradient-text">New Visit</span>
        </h1>
        <p class="page-subtitle">Log a consultation visit</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
      <!-- Visit Details -->
      <div class="form-section cosmic-border-top">
        <h3 class="form-section-title">
          <span class="text-lg">&#x1F4C5;</span>
          Visit Details
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Customer <span class="text-amber-500">*</span></label>
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
      <div class="form-section cosmic-border-top">
        <h3 class="form-section-title">
          <span class="text-lg">&#x1F4CB;</span>
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
      <div class="form-section cosmic-border-top">
        <h3 class="form-section-title">
          <span class="text-lg">&#x1F4B0;</span>
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
      <div class="form-section cosmic-border-top">
        <h3 class="form-section-title">
          <span class="text-lg">&#x1F4A1;</span>
          Solutions Given
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <label v-for="s in solutions" :key="s.id"
            class="flex items-center gap-2 text-sm p-3 border rounded-xl cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-colors"
            :class="form.solution_ids.includes(s.id) ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200' : 'border-gray-200'">
            <input type="checkbox" :value="s.id" v-model="form.solution_ids" class="rounded text-purple-600 focus:ring-purple-500" />
            <span>{{ s.name }} <span class="text-gray-400 text-xs">({{ s.category }})</span></span>
          </label>
        </div>
        <div v-if="!solutions.length" class="empty-state py-6">
          <p class="text-gray-400 text-sm">No solutions available. Create some first.</p>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section cosmic-border-top">
        <h3 class="form-section-title">
          <span class="text-lg">&#x1F4DD;</span>
          Notes
        </h3>
        <textarea v-model="form.notes" rows="2" class="form-input" placeholder="Additional notes..."></textarea>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert-error">{{ error }}</div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button type="submit" :disabled="saving" class="btn-primary">
          <span v-if="saving" class="spinner-sm mr-2"></span>
          {{ saving ? 'Saving...' : 'Create Visit' }}
        </button>
        <button type="button" @click="$router.back()" class="btn-secondary">Cancel</button>
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
const error = ref('')
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
  error.value = ''
  const payload = { ...form.value, customer_id: Number(form.value.customer_id) }
  if (!payload.payment_method) delete payload.payment_method
  if (!payload.follow_up_date) delete payload.follow_up_date
  try {
    await createVisit(payload)
    router.push(form.value.customer_id ? `/customers/${form.value.customer_id}` : '/customers')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to create visit'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [custRes, solRes] = await Promise.all([
      listCustomers({ is_active: true, limit: 200 }),
      listSolutions({ is_active: true }),
    ])
    customers.value = custRes.data
    solutions.value = solRes.data
  } catch (e) {
    error.value = 'Failed to load form data'
  }
})
</script>
