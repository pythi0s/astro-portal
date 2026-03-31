<template>
  <div>
    <div class="flex justify-between items-center mb-3">
      <h1>{{ isEdit ? 'Edit Client' : 'New Client' }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="card">
      <h3 class="mb-2">Personal Details</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>First Name *</label>
          <input v-model="form.first_name" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input v-model="form.last_name" class="form-control" required />
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select v-model="form.gender" class="form-control">
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input v-model="form.date_of_birth" type="date" class="form-control" />
        </div>
        <div class="form-group">
          <label>Time of Birth</label>
          <input v-model="form.time_of_birth" type="time" step="1" class="form-control" />
        </div>
        <div class="form-group">
          <label>Place of Birth</label>
          <input v-model="form.place_of_birth" class="form-control" />
        </div>
        <div class="form-group">
          <label>Mobile Number</label>
          <input v-model="form.mobile_number" class="form-control" placeholder="+91XXXXXXXXXX" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" class="form-control" />
        </div>
      </div>

      <h3 class="mb-2" style="margin-top:1.5rem">Address</h3>
      <div class="form-grid">
        <div class="form-group" style="grid-column: 1 / -1">
          <label>Address</label>
          <textarea v-model="form.address" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <label>City</label>
          <input v-model="form.city" class="form-control" />
        </div>
        <div class="form-group">
          <label>State</label>
          <input v-model="form.state" class="form-control" />
        </div>
        <div class="form-group">
          <label>Pincode</label>
          <input v-model="form.pincode" class="form-control" />
        </div>
        <div class="form-group">
          <label>Country</label>
          <input v-model="form.country" class="form-control" />
        </div>
      </div>

      <h3 class="mb-2" style="margin-top:1.5rem">Astrological Details</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Rashi (Moon Sign)</label>
          <select v-model="form.rashi" class="form-control">
            <option value="">Select</option>
            <option v-for="r in rashis" :key="r">{{ r }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nakshatra (Birth Star)</label>
          <select v-model="form.nakshatra" class="form-control">
            <option value="">Select</option>
            <option v-for="n in nakshatras" :key="n">{{ n }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Lagna (Ascendant)</label>
          <select v-model="form.lagna" class="form-control">
            <option value="">Select</option>
            <option v-for="r in rashis" :key="r">{{ r }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Gotra</label>
          <input v-model="form.gotra" class="form-control" />
        </div>
        <div class="form-group">
          <label>Manglik Status</label>
          <select v-model="form.manglik_status" class="form-control">
            <option value="">Select</option>
            <option>Yes</option>
            <option>No</option>
            <option>Partial (Anshik)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Referred By</label>
          <input v-model="form.referred_by" class="form-control" />
        </div>
      </div>

      <div class="form-group" style="margin-top:1.5rem">
        <label>Notes</label>
        <textarea v-model="form.notes" class="form-control" rows="3"></textarea>
      </div>

      <div class="flex gap-1" style="margin-top:1.5rem">
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Client' }}</button>
        <button type="button" class="btn btn-outline" @click="$router.back()">Cancel</button>
      </div>

      <p v-if="error" style="color:var(--danger);margin-top:0.5rem">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const saving = ref(false)
const error = ref('')

const form = ref({
  first_name: '', last_name: '', gender: '', date_of_birth: '', time_of_birth: '',
  place_of_birth: '', mobile_number: '', email: '', address: '', city: '', state: '',
  pincode: '', country: 'India', rashi: '', nakshatra: '', gotra: '', lagna: '',
  manglik_status: '', notes: '', referred_by: '',
})

const rashis = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)',
  'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)',
]

const nakshatras = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

onMounted(async () => {
  if (isEdit.value) {
    try {
      const { data } = await api.get(`/clients/${route.params.id}`)
      Object.keys(form.value).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) form.value[key] = data[key]
      })
    } catch (e) {
      error.value = 'Failed to load client details'
    }
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    // Remove empty strings for optional fields
    const payload = {}
    for (const [key, val] of Object.entries(form.value)) {
      if (val !== '' && val !== null) payload[key] = val
    }

    if (isEdit.value) {
      await api.put(`/clients/${route.params.id}`, payload)
      router.push(`/clients/${route.params.id}`)
    } else {
      const { data } = await api.post('/clients', payload)
      router.push(`/clients/${data.id}`)
    }
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to save client'
  } finally {
    saving.value = false
  }
}
</script>
