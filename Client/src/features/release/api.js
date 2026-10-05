import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://aggroso-ctg0.onrender.com/api',
  withCredentials: true
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('atlas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config
})

const data = response => response.data

export const authApi = {
  login: payload => api.post('/auth/login', payload).then(data),
  register: payload => api.post('/auth/register', payload).then(data),
  me: () => api.get('/auth/me').then(data)
}

export const releaseApi = {
  list: () => api.get('/releases').then(data),
  create: title => api.post('/releases', { title }).then(data),
  versions: releaseId => api.get(`/releases/${releaseId}/versions`).then(data),
  version: (releaseId, version) => api.get(`/releases/${releaseId}/versions/${version}`).then(data),
  createVersion: (releaseId, payload) => api.post(`/releases/${releaseId}/versions`, payload).then(data),
  updateVersion: (releaseId, version, payload) => api.patch(`/releases/${releaseId}/versions/${version}`, payload).then(data),
  readiness: (releaseId, version) => api.get(`/releases/${releaseId}/versions/${version}/readiness`).then(data),
  statements: (releaseId, version) => api.get(`/releases/${releaseId}/versions/${version}/statements`).then(data),
  generate: (releaseId, version, artifact) => api.post(`/releases/${releaseId}/versions/${version}/generate/${artifact}`).then(data),
  compare: (releaseId, from, to) => api.get(`/releases/${releaseId}/compare`, { params: { from, to } }).then(data),
  finalize: (releaseId, version) => api.post(`/releases/${releaseId}/versions/${version}/finalize`).then(data),
  editStatement: (sid, text) => api.patch(`/statements/${sid}`, { text }).then(data),
  approveStatement: sid => api.post(`/statements/${sid}/approve`).then(data),
  rejectStatement: sid => api.post(`/statements/${sid}/reject`).then(data),
}