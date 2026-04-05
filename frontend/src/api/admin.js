import client from './client'

export const listUsers = (params) => client.get('/admin/users', { params })
export const getUser = (id) => client.get(`/admin/users/${id}`)
export const createUser = (data) => client.post('/admin/users', data)
export const updateUser = (id, data) => client.put(`/admin/users/${id}`, data)
export const deactivateUser = (id) => client.delete(`/admin/users/${id}`)
export const getAdminStats = () => client.get('/admin/stats')
