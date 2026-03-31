<template>
  <div>
    <h1 class="mb-3">Dashboard</h1>
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat-value">{{ stats.total_clients ?? '–' }}</div>
        <div class="stat-label">Total Clients</div>
      </div>
      <div class="card stat-card">
        <div class="stat-value">{{ stats.total_interactions ?? '–' }}</div>
        <div class="stat-label">Total Consultations</div>
      </div>
    </div>
    <div class="card">
      <h3 class="mb-2">Recent Clients</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>City</th>
              <th>Rashi</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in stats.recent_clients" :key="c.id" @click="$router.push(`/clients/${c.id}`)" style="cursor:pointer">
              <td>{{ c.first_name }} {{ c.last_name }}</td>
              <td>{{ c.mobile_number || '–' }}</td>
              <td>{{ c.city || '–' }}</td>
              <td>{{ c.rashi || '–' }}</td>
              <td>{{ formatDate(c.created_at) }}</td>
            </tr>
            <tr v-if="!stats.recent_clients?.length">
              <td colspan="5" class="text-muted">No clients yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const stats = ref({})

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard')
    stats.value = data
  } catch (e) {
    console.error('Failed to load dashboard', e)
  }
})

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
