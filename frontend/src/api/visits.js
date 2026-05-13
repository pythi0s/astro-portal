import client from './client'

export const listVisits = (params) => client.get('/visits/', { params })
export const getVisit = (id) => client.get(`/visits/${id}`)
export const createVisit = (data) => client.post('/visits/', data)
export const updateVisit = (id, data) => client.put(`/visits/${id}`, data)
export const deleteVisit = (id) => client.delete(`/visits/${id}`)
export const getTimeline = (customerId, params) => client.get(`/timeline/${customerId}`, { params })
