import client from './client'

export const listCustomers = (params) => client.get('/customers/', { params })
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
