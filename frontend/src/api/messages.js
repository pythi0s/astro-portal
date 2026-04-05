import client from './client'

export const listTemplates = (params) => client.get('/templates/', { params })
export const createTemplate = (data) => client.post('/templates/', data)
export const updateTemplate = (id, data) => client.put(`/templates/${id}`, data)
export const deleteTemplate = (id) => client.delete(`/templates/${id}`)
export const sendEmail = (data) => client.post('/messages/send-email', data)
export const sendWhatsApp = (data) => client.post('/messages/send-whatsapp', data)
export const getMessageLog = (params) => client.get('/messages/log', { params })
