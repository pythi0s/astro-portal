<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-600/20 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"></div>
      <div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-500/10 blur-2xl"></div>
    </div>

    <div class="relative z-10 w-full max-w-md mx-4 animate-slide-up">
      <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <span class="text-3xl">&#x2728;</span>
          </div>
          <h1 class="text-2xl font-extrabold gradient-text">Astro Portal</h1>
          <p class="text-gray-500 text-sm mt-1">Sign in to manage your practice</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="form-label">Email</label>
            <input v-model="email" type="email" required placeholder="your@email.com"
                   class="form-input" />
          </div>
          <div>
            <label class="form-label">Password</label>
            <input v-model="password" type="password" required placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                   class="form-input" />
          </div>
          <div v-if="error" class="alert-error">{{ error }}</div>
          <button type="submit" :disabled="loading" class="btn-primary w-full py-3 text-base">
            <span v-if="loading" class="spinner-sm"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">Secure astrology practice management</p>
      </div>
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
