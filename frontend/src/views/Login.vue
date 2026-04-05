<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-center mb-2">✨ Astro Portal</h1>
      <p class="text-gray-500 text-center text-sm mb-6">Sign in to manage your practice</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="email" type="email" required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input v-model="password" type="password" required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" :disabled="loading"
          class="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
