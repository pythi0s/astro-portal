import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getMe, refreshToken as apiRefresh } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '')
    const user = ref(null)
    const initialized = ref(false)

    const isLoggedIn = computed(() => !!token.value)

    function setToken(newToken) {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    async function login(email, password) {
        const { data } = await apiLogin(email, password)
        setToken(data.access_token)
        await fetchUser()
    }

    async function fetchUser() {
        if (!token.value) return
        const { data } = await getMe()
        user.value = data
    }

    async function refresh() {
        if (!token.value) return false
        try {
            const { data } = await apiRefresh()
            setToken(data.access_token)
            return true
        } catch {
            return false
        }
    }

    /** Called once on app startup to restore session from localStorage token. */
    async function init() {
        if (initialized.value) return
        if (token.value) {
            try {
                await fetchUser()
                // Token is still valid — refresh it to extend the session
                await refresh()
            } catch {
                logout()
            }
        }
        initialized.value = true
    }

    function logout() {
        token.value = ''
        user.value = null
        localStorage.removeItem('token')
    }

    return { token, user, isLoggedIn, initialized, login, fetchUser, refresh, init, logout }
})
