import api from './api';

// ---- Auth ----
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
  me: () => api.get('/auth/me'),
};

// ---- Users ----
export const userApi = {
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (avatar) => api.put('/users/avatar', { avatar }),
  requestEmailChange: (newEmail) => api.post('/users/request-email-change', { newEmail }),
  confirmEmailChange: (otp) => api.post('/users/confirm-email-change', { otp }),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.patch(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  getAll: (role) => api.get('/users', { params: { role } }),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  deactivate: (id) => api.patch(`/users/${id}/deactivate`),
  createStaff: (data) => api.post('/users/create-staff', data),
  updateDetails: (id, data) => api.patch(`/users/${id}/details`, data),
};

// ---- Categories ----
export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

// ---- Products ----
export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  lowStock: () => api.get('/products/alerts/low-stock'),
  expiring: () => api.get('/products/alerts/expiring'),
};

// ---- Orders ----
export const orderApi = {
  create: (data) => api.post('/orders', data),
  requestPaymentOtp: (amount) => api.post('/orders/request-payment-otp', { amount }),
  myOrders: () => api.get('/orders/my'),
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (status) => api.get('/orders', { params: { status } }),
  updateStatus: (id, status, note) => api.patch(`/orders/${id}/status`, { status, note }),
  assignDriver: (id, driverId) => api.patch(`/orders/${id}/assign-driver`, { driverId }),
  availableDrivers: () => api.get('/orders/drivers/available'),
  myDeliveries: () => api.get('/orders/driver/my'),
  verifyQrCode: (id, token) => api.post(`/orders/${id}/verify-qr`, { token }),
  cancelOrder: (id) => api.patch(`/orders/${id}/cancel`),
  updatePaymentStatus: (id, paymentStatus, paymentReference) => api.patch(`/orders/${id}/payment-status`, { paymentStatus, paymentReference }),
  downloadInvoice: (id) => api.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};

// ---- Wholesale ----
export const wholesaleApi = {
  requestQuote: (data) => api.post('/wholesale/orders', data),
  myOrders: () => api.get('/wholesale/orders/my'),
  getAll: (status) => api.get('/wholesale/orders', { params: { status } }),
  getById: (id) => api.get(`/wholesale/orders/${id}`),
  approve: (id) => api.patch(`/wholesale/orders/${id}/approve`),
  reject: (id, reason) => api.patch(`/wholesale/orders/${id}/reject`, { reason }),
  fulfil: (id) => api.patch(`/wholesale/orders/${id}/fulfil`),
  recordTransaction: (id, data) => api.patch(`/wholesale/orders/${id}/transaction`, data),
  cancelOrder: (id) => api.patch(`/wholesale/orders/${id}/cancel`),
  pendingBuyers: () => api.get('/wholesale/pending-buyers'),
  approveBuyer: (userId) => api.patch(`/wholesale/approve-buyer/${userId}`),
};

// ---- Dashboard ----
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  salesTrend: (days) => api.get('/dashboard/sales-trend', { params: { days } }),
  topProducts: () => api.get('/dashboard/top-products'),
  inventoryForecast: () => api.get('/dashboard/inventory-forecast'),
  customerReport: () => api.get('/dashboard/customer-report'),
  categoryBreakdown: () => api.get('/dashboard/category-breakdown'),
};

// ---- Notifications ----
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ---- Stores ----
export const storeApi = {
  getAll: () => api.get('/stores'),
  getById: (id) => api.get(`/stores/${id}`),
};

// ---- Contact ----
export const contactApi = {
  send: (data) => api.post('/contact', data),
};

// ---- Suppliers ----
export const supplierApi = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

// ---- Purchases ----
export const purchaseApi = {
  getAll: () => api.get('/purchases'),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  remove: (id) => api.delete(`/purchases/${id}`),
};
// ---- Inventory (Advanced) ----
export const inventoryApi = {
  health: () => api.get('/inventory/health'),
  freshness: () => api.get('/inventory/freshness'),
  dynamicPricing: () => api.get('/inventory/dynamic-pricing'),
  forecast: () => api.get('/inventory/forecast'),
  allocation: () => api.get('/inventory/allocation'),
  warehouseMap: () => api.get('/inventory/warehouse'),
  supplierPerformance: () => api.get('/inventory/supplier-performance'),
  reorder: () => api.get('/inventory/reorder'),
};
