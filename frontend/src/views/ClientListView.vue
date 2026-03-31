<template>
  <div>
    <div class="flex justify-between items-center mb-3">
      <h1>Clients</h1>
      <router-link to="/clients/new" class="btn btn-primary">+ New Client</router-link>
    </div>

    <div class="search-bar">
      <input
        v-model="search"
        class="form-control"
        placeholder="Search by name, mobile, email, city, rashi..."
        @input="debouncedFetch"
      />
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>City</th>
              <th>Rashi</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in clients" :key="c.id" @click="$router.push(`/clients/${c.id}`)" style="cursor:pointer">
              <td>
                <img v-if="c.photo_path" :src="`/api/clients/${c.id}/photo`" class="client-photo" style="width:36px;height:36px" />
                <span v-else class="client-photo photo-placeholder" style="width:36px;height:36px;font-size:0.85rem">
                  {{ c.first_name[0] }}{{ c.last_name[0] }}
                </span>
              </td>
              <td>{{ c.first_name }} {{ c.last_name }}</td>
              <td>{{ c.mobile_number || '–' }}</td>
              <td>{{ c.email || '–' }}</td>
              <td>{{ c.city || '–' }}</td>
              <td>{{ c.rashi || '–' }}</td>
              <td>{{ formatDate(c.created_at) }}</td>
            </tr>
            <tr v-if="!clients.length && !loading">
              <td colspan="7" class="text-muted">No clients found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="pages > 1">
        <button class="btn btn-outline btn-sm" :disabled="page <= 1" @click="page--; fetchClients()">Prev</button>
        <span class="text-sm text-muted">Page {{ page }} of {{ pages }}</span>
        <button class="btn btn-outline btn-sm" :disabled="page >= pages" @click="page++; fetchClients()">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const clients = ref([])
const search = ref('')
const page = ref(1)
const pages = ref(1)
const loading = ref(false)
let debounceTimer = null

async function fetchClients() {
  loading.value = true
  try {
    const { data } = await api.get('/clients', { params: { search: search.value || undefined, page: page.value } })
    clients.value = data.items
    pages.value = data.pages
  } catch (e) {
    console.error('Failed to load clients', e)
  } finally {
    loading.value = false
  }
}

function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchClients() }, 300)
}

function formatDate(d) {
  if (!d) return '–'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(fetchClients)
</script>
