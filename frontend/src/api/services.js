import client from './client';

const unwrap = (res) => res.data.data;
const envelope = (res) => res.data;

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then(unwrap),
  me: () => client.get('/auth/me').then(unwrap),
  updateProfile: (name) => client.put('/auth/me', { name }).then(unwrap),
  changePassword: (currentPassword, newPassword) =>
    client.put('/auth/password', { currentPassword, newPassword }).then(envelope),
};

export const employeesApi = {
  // Resolves to { data, pagination }
  list: (params) => client.get('/employees', { params }).then(envelope),
  options: (params) => client.get('/employees/options', { params }).then(unwrap),
  get: (id) => client.get(`/employees/${id}`).then(unwrap),
  create: (payload) => client.post('/employees', payload).then(unwrap),
  update: (id, payload) => client.put(`/employees/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/employees/${id}`).then(envelope),
};

export const departmentsApi = {
  list: () => client.get('/departments').then(unwrap),
  create: (payload) => client.post('/departments', payload).then(unwrap),
  update: (id, payload) => client.put(`/departments/${id}`, payload).then(unwrap),
  remove: (id) => client.delete(`/departments/${id}`).then(envelope),
};

export const attendanceApi = {
  // Resolves to { data, summary, pagination }
  list: (params) => client.get('/attendance', { params }).then(envelope),
  create: (payload) => client.post('/attendance', payload).then(unwrap),
  update: (id, payload) => client.put(`/attendance/${id}`, payload).then(unwrap),
};

export const dashboardApi = {
  stats: (today) => client.get('/dashboard/stats', { params: { today } }).then(unwrap),
};

export const healthApi = {
  ready: () => client.get('/health/ready', { timeout: 5000 }).then(envelope),
};
