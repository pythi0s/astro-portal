import client from './client'

export const listCustomers = (params) => client.get('/customers/', { params })
export const getCustomers = listCustomers
export const getCustomer = (id) => client.get(`/customers/${id}`)
export const createCustomer = (data) => client.post('/customers/', data)
export const updateCustomer = (id, data) => client.put(`/customers/${id}`, data)
export const deleteCustomer = (id) => client.delete(`/customers/${id}`)
export const uploadPhoto = (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post(`/customers/${id}/photo`, fd)
}
export const uploadKundali = (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return client.post(`/customers/${id}/kundali`, fd)
}
export const getCustomerVisits = (id) => client.get(`/customers/${id}/visits`)
export const getCustomerSolutions = (id) => client.get(`/customers/${id}/solutions`)
export const assignSolution = (customerId, data) => client.post(`/customers/${customerId}/solutions`, data)
export const updateCustomerSolution = (customerId, solutionId, data) => client.put(`/customers/${customerId}/solutions/${solutionId}`, data)
export const removeCustomerSolution = (customerId, solutionId) => client.delete(`/customers/${customerId}/solutions/${solutionId}`)
