import client from './client'

export const getDashboardSummary = () => client.get('/dashboard/summary')
export const getDashboardEarnings = (params) => client.get('/dashboard/earnings', { params })
export const getTimeline = (customerId, params) => client.get(`/timeline/${customerId}`, { params })
