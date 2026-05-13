<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Overview of your astrology practice</p>
      </div>
      <div class="flex gap-2">
        <router-link to="/customers/new" class="btn btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          New Customer
        </router-link>
        <router-link to="/visits/new" class="btn btn-secondary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Log Visit
        </router-link>
      </div>
    </div>

    <!-- KPI Cards Row 1 -->
    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Customers</p>
        <p class="text-2xl font-extrabold text-gray-900 mt-1">{{ stats.total_customers }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ stats.active_customers }} active</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">New This Month</p>
        <p class="text-2xl font-extrabold text-blue-600 mt-1">{{ stats.new_customers_this_month }}</p>
        <p class="text-xs text-gray-400 mt-1">customers added</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Visits This Month</p>
        <p class="text-2xl font-extrabold text-emerald-600 mt-1">{{ stats.visits_this_month }}</p>
        <p class="text-xs text-gray-400 mt-1">consultations</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (Month)</p>
        <p class="text-2xl font-extrabold text-gray-900 mt-1">&#x20B9;{{ fmtCurrency(stats.revenue_this_month) }}</p>
        <p class="text-xs text-gray-400 mt-1">paid collections</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Payments</p>
        <p class="text-2xl font-extrabold text-red-600 mt-1">&#x20B9;{{ fmtCurrency(stats.pending_payments) }}</p>
        <p class="text-xs text-gray-400 mt-1">yet to collect</p>
      </div>
      <div class="stat-card">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Fee / Visit</p>
        <p class="text-2xl font-extrabold text-amber-600 mt-1">&#x20B9;{{ avgFee }}</p>
        <p class="text-xs text-gray-400 mt-1">this month</p>
      </div>
    </div>

    <!-- Period selector for earnings -->
    <div class="flex items-center gap-3 mb-4">
      <span class="text-sm font-semibold text-gray-600">Earnings:</span>
      <div class="flex gap-1">
        <button v-for="d in [30, 90, 365]" :key="d" @click="earningsDays = d; loadEarnings()"
          class="px-3 py-1 text-xs rounded-lg font-medium transition-colors"
          :class="earningsDays === d ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
          {{ d === 30 ? '30 days' : d === 90 ? '90 days' : '1 year' }}
        </button>
      </div>
      <div class="flex gap-1 ml-2">
        <button v-for="p in ['weekly','monthly']" :key="p" @click="earningsPeriod = p; loadEarnings()"
          class="px-3 py-1 text-xs rounded-lg font-medium capitalize transition-colors"
          :class="earningsPeriod === p ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
          {{ p }}
        </button>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Charts area -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Earnings chart -->
        <div class="card">
          <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Earnings Overview</h3>
          <div v-if="earningsData" class="h-72"><Bar :data="earningsChartData" :options="chartOptions" /></div>
          <div v-else class="empty-state !py-8"><p class="text-gray-400 text-sm">No earnings data for this period</p></div>
        </div>

        <!-- Payment status breakdown -->
        <div class="grid sm:grid-cols-3 gap-4">
          <div class="card text-center">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Paid</p>
            <p class="text-lg font-extrabold text-emerald-600">{{ earningsTotals.paid }}</p>
            <p class="text-xs text-gray-400">&#x20B9;{{ fmtCurrency(earningsTotals.paidAmount) }}</p>
          </div>
          <div class="card text-center">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-2">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Pending</p>
            <p class="text-lg font-extrabold text-amber-600">{{ earningsTotals.totalVisits - earningsTotals.paid }}</p>
            <p class="text-xs text-gray-400">&#x20B9;{{ fmtCurrency(earningsTotals.pendingAmount) }}</p>
          </div>
          <div class="card text-center">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <p class="text-xs font-semibold text-gray-500 uppercase">Collection Rate</p>
            <p class="text-lg font-extrabold text-blue-600">{{ collectionRate }}%</p>
            <p class="text-xs text-gray-400">of total fees</p>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick actions -->
        <div class="card">
          <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div class="space-y-2.5">
            <router-link to="/customers/new" class="action-link">
              <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg></div>
              Add Customer
            </router-link>
            <router-link to="/visits/new" class="action-link">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
              Log Visit
            </router-link>
            <router-link to="/solutions/new" class="action-link">
              <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
              New Solution
            </router-link>
            <router-link to="/templates" class="action-link">
              <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
              Message Templates
            </router-link>
          </div>
        </div>

        <!-- Payment doughnut -->
        <div class="card" v-if="earningsData">
          <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Payment Split</h3>
          <div class="h-48"><Doughnut :data="paymentDoughnutData" :options="doughnutOptions" /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDashboard, getDashboardEarnings } from '@/api/dashboard'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const stats = ref(null)
const earningsData = ref(null)
const earningsDays = ref(30)
const earningsPeriod = ref('weekly')

function fmtCurrency(v) { return Number(v || 0).toLocaleString('en-IN') }

const avgFee = computed(() => {
  if (!stats.value || !stats.value.visits_this_month) return '0'
  return fmtCurrency(Math.round(Number(stats.value.revenue_this_month || 0) / stats.value.visits_this_month))
})

const earningsTotals = computed(() => {
  if (!earningsData.value?.breakdown?.length) return { paid: 0, paidAmount: 0, pendingAmount: 0, totalVisits: 0, grandTotal: 0 }
  const b = earningsData.value.breakdown
  const paid = b.reduce((s, x) => s + x.paid_count, 0)
  const totalVisits = b.reduce((s, x) => s + x.visit_count, 0)
  const paidAmount = Number(earningsData.value.grand_total) - b.reduce((s, x) => s + Number(x.pending_amount), 0)
  const pendingAmount = b.reduce((s, x) => s + Number(x.pending_amount), 0)
  return { paid, paidAmount, pendingAmount, totalVisits, grandTotal: Number(earningsData.value.grand_total) }
})

const collectionRate = computed(() => {
  const t = earningsTotals.value
  if (!t.grandTotal) return 0
  return Math.round((t.paidAmount / t.grandTotal) * 100)
})

const earningsChartData = computed(() => {
  if (!earningsData.value?.breakdown?.length) return null
  const b = earningsData.value.breakdown
  return {
    labels: b.map(x => x.label),
    datasets: [
      {
        label: 'Collected',
        data: b.map(x => Number(x.total_fees) - Number(x.pending_amount)),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6, borderSkipped: false,
      },
      {
        label: 'Pending',
        data: b.map(x => Number(x.pending_amount)),
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        borderRadius: 6, borderSkipped: false,
      },
    ]
  }
})

const paymentDoughnutData = computed(() => {
  const t = earningsTotals.value
  return {
    labels: ['Collected', 'Pending'],
    datasets: [{ data: [t.paidAmount, t.pendingAmount], backgroundColor: ['#10b981', '#f59e0b'], borderWidth: 0, hoverOffset: 6 }]
  }
})

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 11 } } }, tooltip: { backgroundColor: '#1f2937', titleFont: { weight: '600' }, bodyFont: { size: 13 }, padding: 10, cornerRadius: 8 } },
  scales: {
    y: { stacked: true, beginAtZero: true, ticks: { precision: 0, font: { size: 11 }, callback: (v) => '\u20B9' + v.toLocaleString('en-IN') }, grid: { color: 'rgba(0,0,0,.04)' } },
    x: { stacked: true, ticks: { font: { size: 10 } }, grid: { display: false } }
  }
}
const doughnutOptions = {
  responsive: true, maintainAspectRatio: false, cutout: '65%',
  plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } } } }
}

async function loadEarnings() {
  try {
    const { data } = await getDashboardEarnings({ period: earningsPeriod.value, days: earningsDays.value })
    earningsData.value = data
  } catch (e) { console.error('Earnings load failed', e) }
}

onMounted(async () => {
  try { const { data } = await getDashboard(); stats.value = data } catch (e) { console.error('Dashboard load failed', e) }
  await loadEarnings()
})
</script>
