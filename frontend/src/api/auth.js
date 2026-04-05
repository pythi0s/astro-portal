import client from './client'

export const login = (email, password) => client.post('/auth/login', { email, password })
export const getMe = () => client.get('/auth/me')
export const updateMe = (data) => client.put('/auth/me', data)
export const register = (data) => client.post('/auth/register', data)
