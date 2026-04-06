<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Customer' : 'New Customer' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Update customer information' : 'Add a new customer to your practice' }}</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
      <!-- Personal Info -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Personal Info
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="form-label">Name *</label><input v-model="form.name" required class="form-input" placeholder="Full name" /></div>
          <div><label class="form-label">Email</label><input v-model="form.email" type="email" class="form-input" placeholder="email@example.com" /></div>
          <div><label class="form-label">Phone</label><input v-model="form.phone" class="form-input" placeholder="+91..." /></div>
          <div><label class="form-label">Gender</label>
            <select v-model="form.gender" class="form-select w-full">
              <option value="">&#x2014;</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
          </div>
          <div><label class="form-label">Date of Birth</label><input v-model="form.date_of_birth" type="date" class="form-input" /></div>
          <div><label class="form-label">Birth Time</label><input v-model="form.birth_time" type="time" class="form-input" /></div>
          <div><label class="form-label">Birth Place</label><input v-model="form.birth_place" class="form-input" placeholder="City of birth" /></div>
          <div><label class="form-label">Occupation</label><input v-model="form.occupation" class="form-input" placeholder="Profession" /></div>
          <div><label class="form-label">Marital Status</label>
            <select v-model="form.marital_status" class="form-select w-full">
              <option value="">&#x2014;</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Address -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Address
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2"><label class="form-label">Address</label><input v-model="form.address" class="form-input" placeholder="Street address" /></div>
          <div><label class="form-label">City</label><input v-model="form.city" class="form-input" /></div>
          <div><label class="form-label">State</label>
            <select v-model="form.state" class="form-select w-full">
              <option value="">&#x2014;</option>
              <option v-for="s in indianStates" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div><label class="form-label">Pincode</label><input v-model="form.pincode" class="form-input" maxlength="6" /></div>
        </div>
      </div>

      <!-- Astrology -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" /></svg>
          Astrology Details
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="form-label">Rashi (Moon Sign)</label>
            <select v-model="form.rashi" class="form-select w-full">
              <option value="">&#x2014;</option>
              <option v-for="r in rashis" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
          <div><label class="form-label">Nakshatra</label>
            <select v-model="form.nakshatra" class="form-select w-full">
              <option value="">&#x2014;</option>
              <option v-for="n in nakshatras" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div><label class="form-label">Gotra</label><input v-model="form.gotra" class="form-input" /></div>
          <div><label class="form-label">Lagna (Ascendant)</label>
            <select v-model="form.lagna" class="form-select w-full">
              <option value="">&#x2014;</option>
              <option v-for="r in rashis" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Photo & Kundali Upload -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          Photo &amp; Kundali
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Photo -->
          <div>
            <label class="form-label">Customer Photo</label>
            <div class="mt-1">
              <div v-if="photoPreview || existingPhoto" class="mb-3">
                <img :src="photoPreview || existingPhoto" class="w-24 h-24 rounded-xl object-cover border border-gray-200 shadow-sm" />
              </div>
              <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/30 cursor-pointer transition-colors text-sm text-gray-600">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                {{ photoFile ? photoFile.name : 'Choose photo...' }}
                <input type="file" accept="image/*" class="hidden" @change="onPhotoSelect" />
              </label>
              <p v-if="photoUploading" class="text-xs text-primary-600 mt-1">Uploading...</p>
            </div>
          </div>
          <!-- Kundali -->
          <div>
            <label class="form-label">Kundali Chart</label>
            <div class="mt-1">
              <div v-if="existingKundali" class="mb-3 flex items-center gap-2 text-sm text-gray-600">
                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ existingKundaliName || 'Kundali uploaded' }}
              </div>
              <label class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/30 cursor-pointer transition-colors text-sm text-gray-600">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                {{ kundaliFile ? kundaliFile.name : 'Choose file...' }}
                <input type="file" accept="image/*,.pdf" class="hidden" @change="onKundaliSelect" />
              </label>
              <p v-if="kundaliUploading" class="text-xs text-primary-600 mt-1">Uploading...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="form-section">
        <h3 class="form-section-title">
          <svg class="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Notes
        </h3>
        <textarea v-model="form.notes" rows="3" class="form-input" placeholder="Additional notes..."></textarea>
      </div>

      <div v-if="error" class="alert-error">{{ error }}</div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving" class="btn btn-primary">
          <span v-if="saving" class="spinner-sm"></span>
          {{ saving ? 'Saving...' : (isEdit ? 'Update Customer' : 'Create Customer') }}
        </button>
        <button type="button" @click="$router.back()" class="btn btn-secondary">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createCustomer, getCustomer, updateCustomer, uploadPhoto, uploadKundali } from '@/api/customers'

const route = useRoute()
const router = useRouter()
const props = defineProps({ id: String })
const customerId = props.id || route.params.id
const isEdit = computed(() => !!customerId)
const saving = ref(false)
const error = ref('')

const photoFile = ref(null)
const photoPreview = ref(null)
const photoUploading = ref(false)
const existingPhoto = ref(null)
const kundaliFile = ref(null)
const kundaliUploading = ref(false)
const existingKundali = ref(null)
const existingKundaliName = ref(null)

const form = ref({
  name: '', email: '', phone: '', gender: '', date_of_birth: '', birth_time: '',
  birth_place: '', occupation: '', marital_status: '',
  address: '', city: '', state: '', pincode: '',
  rashi: '', nakshatra: '', gotra: '', lagna: '', notes: '',
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

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu & Kashmir', 'Ladakh',
]

function onPhotoSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

function onKundaliSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  kundaliFile.value = file
}

async function uploadFiles(id) {
  if (photoFile.value) {
    photoUploading.value = true
    try { await uploadPhoto(id, photoFile.value) } finally { photoUploading.value = false }
  }
  if (kundaliFile.value) {
    kundaliUploading.value = true
    try { await uploadKundali(id, kundaliFile.value) } finally { kundaliUploading.value = false }
  }
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  const payload = {}
  for (const [k, v] of Object.entries(form.value)) {
    if (v !== '' && v != null) payload[k] = v
  }
  try {
    let id = customerId
    if (isEdit.value) {
      await updateCustomer(customerId, payload)
    } else {
      const { data } = await createCustomer(payload)
      id = data.id
    }
    await uploadFiles(id)
    router.push(isEdit.value ? `/customers/${customerId}` : '/customers')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to save customer'
  } finally { saving.value = false }
}

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await getCustomer(customerId)
    Object.keys(form.value).forEach((k) => { if (data[k] != null) form.value[k] = data[k] })
    if (data.photo_path) existingPhoto.value = `/uploads/${data.photo_path}`
    if (data.kundali_file_path) { existingKundali.value = true; existingKundaliName.value = data.kundali_original_name }
  }
})
</script>
