import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getMe } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '')
    const user = ref(null)

    const isLoggedIn = computed(() => !!token.value)

    async function login(email, password) {
        const { data } = await apiLogin(email, password)
        token.value = data.access_token
        localStorage.setItem('token', data.access_token)
        await fetchUser()
    }

    async function fetchUser() {
        if (!token.value) return
        const { data } = await getMe()
        user.value = data
    }

    function logout() {
        token.value = ''
        user.value = null
        localStorage.removeItem('token')
    }

    return { token, user, isLoggedIn, login, fetchUser, logout }
})
