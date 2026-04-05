<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ isEdit ? 'Edit Customer' : 'New Customer' }}</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
      <div class="bg-white rounded-xl border p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Personal Info</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input v-model="form.name" required class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input v-model="form.phone" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Gender</label>
            <select v-model="form.gender" class="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">—</option>
              <option value="male">male</option>
              <option value="female">female</option>
              <option value="other">other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
            <input v-model="form.date_of_birth" type="date" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Birth Time</label>
            <input v-model="form.birth_time" type="time" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Birth Place</label>
            <input v-model="form.birth_place" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Occupation</label>
            <input v-model="form.occupation" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Marital Status</label>
            <input v-model="form.marital_status" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Address</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input v-model="form.address" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input v-model="form.city" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">State</label>
            <input v-model="form.state" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
            <input v-model="form.pincode" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Astrology</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Rashi</label>
            <input v-model="form.rashi" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nakshatra</label>
            <input v-model="form.nakshatra" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Gotra</label>
            <input v-model="form.gotra" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Lagna</label>
            <input v-model="form.lagna" class="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border p-5">
        <h3 class="font-semibold text-gray-700 mb-4">Notes</h3>
        <textarea v-model="form.notes" rows="3"
          class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
      </div>

      <div class="flex gap-3">
        <button type="submit" :disabled="saving"
          class="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button type="button" @click="$router.back()"
          class="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createCustomer, getCustomer, updateCustomer } from '@/api/customers'

const route = useRoute()
const router = useRouter()
const props = defineProps({ id: String })
const customerId = props.id || route.params.id
const isEdit = computed(() => !!customerId)
const saving = ref(false)

const form = ref({
  name: '', email: '', phone: '', gender: '', date_of_birth: '', birth_time: '',
  birth_place: '', occupation: '', marital_status: '',
  address: '', city: '', state: '', pincode: '',
  rashi: '', nakshatra: '', gotra: '', lagna: '', notes: '',
})

async function handleSubmit() {
  saving.value = true
  // Remove empty string values
  const payload = {}
  for (const [k, v] of Object.entries(form.value)) {
    if (v !== '' && v != null) payload[k] = v
  }
  try {
    if (isEdit.value) {
      await updateCustomer(customerId, payload)
    } else {
      await createCustomer(payload)
    }
    router.push(isEdit.value ? `/customers/${customerId}` : '/customers')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    const { data } = await getCustomer(customerId)
    Object.keys(form.value).forEach((k) => {
      if (data[k] != null) form.value[k] = data[k]
    })
  }
})
</script>
