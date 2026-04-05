<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">New Visit</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
      <div class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Visit Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Customer *</label>
            <select v-model="form.customer_id" required class="form-select w-full">
              <option value="">Select customer...</option>
              <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.phone || c.email || c.id }})</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Visit Date</label>
            <input v-model="form.visit_date" type="date" class="form-input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Consultation Type</label>
            <select v-model="form.consultation_type" class="form-select w-full">
              <option value="first_visit">First Visit</option>
              <option value="follow_up">Follow Up</option>
              <option value="special">Special</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Follow-up Date</label>
            <input v-model="form.follow_up_date" type="date" class="form-input" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Consultation</h3>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Problems Discussed</label>
          <textarea v-model="form.problems_discussed" rows="2" class="form-input"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Analysis</label>
          <textarea v-model="form.analysis" rows="2" class="form-input"></textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Recommendations</label>
          <textarea v-model="form.recommendations" rows="2" class="form-input"></textarea>
        </div>
      </div>

      <div class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Payment</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Fees (₹)</label>
            <input v-model="form.fees" type="number" min="0" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
            <select v-model="form.payment_status" class="form-select w-full">
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="waived">Waived</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
            <select v-model="form.payment_method" class="form-select w-full">
              <option value="">—</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border p-5 space-y-4">
        <h3 class="font-semibold text-gray-700">Solutions Given</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <label v-for="s in solutions" :key="s.id" class="flex items-center gap-2 text-sm p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="checkbox" :value="s.id" v-model="form.solution_ids" class="rounded" />
            <span>{{ s.name }} <span class="text-gray-400">({{ s.category }})</span></span>
          </label>
        </div>
        <p v-if="!solutions.length" class="text-gray-400 text-sm">No solutions available. Create some first.</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea v-model="form.notes" rows="2" class="form-input"></textarea>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving"
          class="btn-primary px-6">
          {{ saving ? 'Saving...' : 'Create Visit' }}
        </button>
        <button type="button" @click="$router.back()" class="btn-secondary px-6">Cancel</button>
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
