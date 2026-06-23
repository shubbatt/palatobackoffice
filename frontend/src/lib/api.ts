import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

// Attach Bearer token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('palato_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('palato_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Typed endpoints ────────────────────────────────────────────────

export const auth = {
  login:  (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me:     () => api.get('/auth/me'),
};

export const dashboard = {
  daily:  () => api.get('/dashboard/daily'),
  weekly: () => api.get('/dashboard/weekly'),
};

export const dispatch = {
  list:           (params?: object) => api.get('/dispatch', { params }),
  create:         (data: object)    => api.post('/dispatch', data),
  confirmCollect: (id: number)      => api.patch(`/dispatch/${id}/collect`),
  confirmReceive: (id: number, data: object) => api.patch(`/dispatch/${id}/receive`, data),
};

export const waste = {
  list:   (params?: object) => api.get('/waste', { params }),
  create: (data: object)    => api.post('/waste', data),
};

export const closeGate = {
  list:            (params?: object) => api.get('/close-gate', { params }),
  submit:          (data: object)    => api.post('/close-gate', data),
  approveOverride: (id: number, data: object) => api.patch(`/close-gate/${id}/override`, data),
};

export const incidents = {
  list:    (params?: object) => api.get('/incidents', { params }),
  show:    (id: number)      => api.get(`/incidents/${id}`),
  resolve: (id: number, notes: string) => api.patch(`/incidents/${id}/resolve`, { notes }),
};

export const opening = {
  store:  (data: object) => api.post('/opening', data),
  today:  (siteId: number) => api.get(`/opening/today/${siteId}`),
  update: (id: number, data: object) => api.patch(`/opening/${id}`, data),
};

export const cash = {
  list:   (params?: object) => api.get('/cash', { params }),
  store:  (data: object)    => api.post('/cash', data),
  verify: (id: number)      => api.patch(`/cash/${id}/verify`),
};

export const temperatures = {
  list:  (params?: object) => api.get('/temperatures', { params }),
  store: (data: object)    => api.post('/temperatures', data),
};

export const closing = {
  store: (data: object) => api.post('/closing', data),
  today: (siteId: number) => api.get(`/closing/today/${siteId}`),
};

export const sites = {
  list:    () => api.get('/sites'),
  show:    (id: number) => api.get(`/sites/${id}`),
  store:   (data: object) => api.post('/sites', data),
  update:  (id: number, data: object) => api.patch(`/sites/${id}`, data),
  destroy: (id: number) => api.delete(`/sites/${id}`),
};

export const skus = {
  list:    () => api.get('/sku-costs'),
  show:    (id: number) => api.get(`/sku-costs/${id}`),
  store:   (data: object) => api.post('/sku-costs', data),
  update:  (id: number, data: object) => api.patch(`/sku-costs/${id}`, data),
  destroy: (id: number) => api.delete(`/sku-costs/${id}`),
};

export const users = {
  list:    () => api.get('/users'),
  show:    (id: number) => api.get(`/users/${id}`),
  store:   (data: object) => api.post('/users', data),
  update:  (id: number, data: object) => api.patch(`/users/${id}`, data),
  destroy: (id: number) => api.delete(`/users/${id}`),
};
