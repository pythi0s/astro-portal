import client from './client'

export const listSolutions = (params) => client.get('/solutions/', { params })
export const getSolutions = listSolutions
export const getSolution = (id) => client.get(`/solutions/${id}`)
export const createSolution = (data) => client.post('/solutions/', data)
export const updateSolution = (id, data) => client.put(`/solutions/${id}`, data)
export const deleteSolution = (id) => client.delete(`/solutions/${id}`)
