<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <p class="text-gray-500 text-sm mt-1">Welcome back, {{ auth.user?.full_name || 'Astrologer' }}</p>
      </div>
      <div class="flex gap-2">
        <router-link to="/customers/new" class="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          New Customer
        </router-link>
        <router-link to="/visits/new" class="border bg-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          New Visit
        </router-link>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div v-for="card in cards" :key="card.label" class="bg-white rounded-xl shadow-sm p-5 border hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-gray-500">{{ card.label }}</p>
            <p class="text-2xl font-bold mt-1">{{ card.value }}</p>
            <p v-if="card.sub" class="text-xs mt-1" :class="card.subColor || 'text-gray-400'">{{ card.sub }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg" :class="card.iconBg || 'bg-primary-50'">{{ card.icon }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Earnings Chart -->
      <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">Earnings Overview</h2>
          <select v-model="period" @change="loadEarnings" class="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <Bar v-if="chartData" :data="chartData" :options="barOptions" style="max-height: 280px" />
        <div v-else class="flex items-center justify-center h-64 text-gray-400">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <p>No earnings data yet</p>
          </div>
        </div>
        <div v-if="earnings" class="mt-4 pt-4 border-t flex gap-6 text-sm">
          <div><span class="text-gray-500">Total: </span><span class="font-semibold">₹{{ Number(earnings.grand_total).toLocaleString() }}</span></div>
          <div><span class="text-gray-500">Period: </span><span class="font-medium capitalize">{{ earnings.period }}</span></div>
        </div>
      </div>

      <!-- Payment Status Doughnut -->
      <div class="bg-white rounded-xl shadow-sm p-6 border">
        <h2 class="text-lg font-semibold mb-4">Payment Status</h2>
        <Doughnut v-if="doughnutData" :data="doughnutData" :options="doughnutOptions" />
        <div v-else class="flex items-center justify-center h-48 text-gray-400 text-sm">No payment data</div>
        <div v-if="paymentStats" class="mt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Paid</span>
            <span class="font-medium">{{ paymentStats.paid }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Pending</span>
            <span class="font-medium">{{ paymentStats.pending }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-sky-400 inline-block"></span> Partial</span>
            <span class="font-medium">{{ paymentStats.partial }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Waived</span>
            <span class="font-medium">{{ paymentStats.waived }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Visits -->
      <div class="bg-white rounded-xl shadow-sm border">
        <div class="flex items-center justify-between p-5 border-b">
          <h2 class="text-lg font-semibold">Recent Visits</h2>
          <router-link to="/customers" class="text-primary-600 text-sm hover:underline">View All</router-link>
        </div>
        <div v-if="recentVisits.length" class="divide-y">
          <div v-for="v in recentVisits" :key="v.id" class="p-4 flex items-center gap-3 hover:bg-gray-50 cursor-pointer" @click="$router.push(`/customers/${v.customer_id}`)">
            <div class="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm">🗓</div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">Customer #{{ v.customer_id }}</p>
              <p class="text-xs text-gray-500">{{ v.consultation_type?.replace('_', ' ') }} · ₹{{ v.fees }}</p>
            </div>
            <div class="text-right shrink-0">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="v.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">{{ v.payment_status }}</span>
              <p class="text-xs text-gray-400 mt-1">{{ formatDate(v.visit_date) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="p-8 text-center text-gray-400 text-sm">No visits recorded yet</div>
      </div>

      <!-- Quick Stats & Links -->
      <div class="space-y-6">
        <!-- Solution Categories -->
        <div class="bg-white rounded-xl shadow-sm border">
          <div class="flex items-center justify-between p-5 border-b">
            <h2 class="text-lg font-semibold">Solution Categories</h2>
            <router-link to="/solutions" class="text-primary-600 text-sm hover:underline">Manage</router-link>
          </div>
          <div v-if="solutionStats.length" class="p-5 space-y-3">
            <div v-for="s in solutionStats" :key="s.category" class="flex items-center gap-3">
              <div class="flex-1">
                <div class="flex justify-between text-sm mb-1">
                  <span class="capitalize font-medium">{{ s.category }}</span>
                  <span class="text-gray-500">{{ s.count }}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div class="bg-primary-500 h-2 rounded-full transition-all" :style="{ width: s.pct + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-8 text-center text-gray-400 text-sm">No solutions yet</div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <h2 class="text-lg font-semibold mb-3">Quick Actions</h2>
          <div class="grid grid-cols-2 gap-2">
            <router-link to="/customers/new" class="flex items-center gap-2 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition-colors text-sm">
              <span>👤</span> Add Customer
            </router-link>
            <router-link to="/visits/new" class="flex items-center gap-2 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition-colors text-sm">
              <span>🗓</span> Record Visit
            </router-link>
            <router-link to="/solutions/new" class="flex items-center gap-2 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition-colors text-sm">
              <span>💎</span> Add Solution
            </router-link>
            <router-link to="/templates/new" class="flex items-center gap-2 p-3 rounded-lg border hover:bg-primary-50 hover:border-primary-200 transition-colors text-sm">
              <span>📧</span> New Template
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { getDashboardSummary, getDashboardEarnings } from '@/api/dashboard'
import { listVisits } from '@/api/visits'
import { listSolutions } from '@/api/solutions'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const auth = useAuthStore()
const summary = ref(null)
const earnings = ref(null)
const period = ref('monthly')
const recentVisits = ref([])
const solutionStats = ref([])
const paymentStats = ref(null)

function formatDate(d) { return d ? dayjs(d).format('DD MMM YYYY') : '—' }

const cards = computed(() => {
  if (!summary.value) return []
  const s = summary.value
  return [
    { label: 'Total Customers', value: s.total_customers, icon: '👥', iconBg: 'bg-blue-50', sub: `${s.active_customers} active`, subColor: 'text-blue-500' },
    { label: 'Visits This Month', value: s.visits_this_month, icon: '🗓', iconBg: 'bg-emerald-50', sub: `${s.new_customers_this_month} new customers`, subColor: 'text-emerald-500' },
    { label: 'Revenue This Month', value: `₹${Number(s.revenue_this_month).toLocaleString()}`, icon: '💰', iconBg: 'bg-amber-50', sub: 'Paid visits only', subColor: 'text-gray-400' },
    { label: 'Pending Payments', value: `₹${Number(s.pending_payments).toLocaleString()}`, icon: '⏳', iconBg: 'bg-red-50', sub: 'Needs follow-up', subColor: s.pending_payments > 0 ? 'text-red-500' : 'text-gray-400' },
  ]
})

const chartData = computed(() => {
  if (!earnings.value?.breakdown?.length) return null
  return {
    labels: earnings.value.breakdown.map((b) => b.label),
    datasets: [
      { label: 'Collected', data: earnings.value.breakdown.map((b) => Number(b.total_fees) - Number(b.pending_amount)), backgroundColor: '#059669', borderRadius: 4 },
      { label: 'Pending', data: earnings.value.breakdown.map((b) => Number(b.pending_amount)), backgroundColor: '#fbbf24', borderRadius: 4 },
    ],
  }
})

const barOptions = {
  responsive: true,
  plugins: { legend: { position: 'bottom' } },
  scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { callback: v => '₹' + v.toLocaleString() } } },
}

const doughnutData = computed(() => {
  if (!paymentStats.value) return null
  const s = paymentStats.value
  const total = s.paid + s.pending + s.partial + s.waived
  if (total === 0) return null
  return {
    labels: ['Paid', 'Pending', 'Partial', 'Waived'],
    datasets: [{ data: [s.paid, s.pending, s.partial, s.waived], backgroundColor: ['#059669', '#fbbf24', '#38bdf8', '#d1d5db'], borderWidth: 0, spacing: 2 }],
  }
})

const doughnutOptions = {
  responsive: true,
  cutout: '65%',
  plugins: { legend: { display: false } },
}

async function loadSummary() {
  const { data } = await getDashboardSummary()
  summary.value = data
}

async function loadEarnings() {
  const { data } = await getDashboardEarnings({ period: period.value, days: 90 })
  earnings.value = data
}

async function loadRecentVisits() {
  try {
    const { data } = await listVisits({ limit: 5 })
    recentVisits.value = Array.isArray(data) ? data.slice(0, 5) : []
  } catch { recentVisits.value = [] }
}

async function loadSolutionStats() {
  try {
    const { data } = await listSolutions({ is_active: true })
    const cats = {}
    for (const s of (Array.isArray(data) ? data : [])) {
      cats[s.category] = (cats[s.category] || 0) + 1
    }
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1
    solutionStats.value = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count, pct: Math.round((count / total) * 100) }))
  } catch { solutionStats.value = [] }
}

async function loadPaymentStats() {
  try {
    const { data } = await listVisits({})
    const visits = Array.isArray(data) ? data : []
    paymentStats.value = {
      paid: visits.filter(v => v.payment_status === 'paid').length,
      pending: visits.filter(v => v.payment_status === 'pending').length,
      partial: visits.filter(v => v.payment_status === 'partial').length,
      waived: visits.filter(v => v.payment_status === 'waived').length,
    }
  } catch { paymentStats.value = null }
}

onMounted(() => {
  loadSummary()
  loadEarnings()
  loadRecentVisits()
  loadSolutionStats()
  loadPaymentStats()
})
</script>
