import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const client = axios.create({
    baseURL: '/api',
})

client.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
})

let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error)
        else resolve(token)
    })
    failedQueue = []
}

client.interceptors.response.use(
    (res) => res,
    async (err) => {
        const originalRequest = err.config
        const auth = useAuthStore()

        // If 401 and not already retrying, attempt a token refresh
        if (err.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return client(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshed = await auth.refresh()
            isRefreshing = false

            if (refreshed) {
                processQueue(null, auth.token)
                originalRequest.headers.Authorization = `Bearer ${auth.token}`
                return client(originalRequest)
            }

            processQueue(new Error('Refresh failed'))
            auth.logout()
            window.location.href = '/login'
        }

        if (err.response?.status === 401) {
            auth.logout()
            window.location.href = '/login'
        }

        return Promise.reject(err)
    }
)

export default client
