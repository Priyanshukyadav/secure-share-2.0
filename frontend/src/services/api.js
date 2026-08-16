import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large file uploads
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Set authorization token
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
}

/**
 * Get authorization token
 */
export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Initialize auth token from localStorage
 */
export function initializeAuth() {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
  }
}

/**
 * Auth API calls
 */
export const authAPI = {
  register: (name, email, password, confirmPassword) =>
    api.post('/auth/register', { name, email, password, confirmPassword }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getCurrentUser: () =>
    api.get('/auth/me'),

  logout: () => {
    setAuthToken(null);
  }
};

/**
 * File API calls
 */
export const fileAPI = {
  /**
   * Upload encrypted file
   * @param {File} file - Encrypted file
   * @param {string} iv - Base64 encoded IV
   * @param {string} authTag - Base64 encoded auth tag
   * @param {string} originalName - Original filename
   * @param {string} salt - Optional base64 encoded salt for password-derived key
   */
  upload: (file, iv, authTag, originalName, salt) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('iv', iv);
    formData.append('authTag', authTag);
    formData.append('originalName', originalName);
    if (salt) {
      formData.append('salt', salt);
    }

    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Download encrypted file
   * @param {string} fileId - File ID
   */
  download: (fileId) =>
    api.get(`/files/${fileId}/download`, {
      responseType: 'arraybuffer'
    }),

  /**
   * Get file metadata
   */
  getMetadata: (fileId) =>
    api.get(`/files/${fileId}`),

  /**
   * List user's files
   */
  listFiles: (page = 1, limit = 10) =>
    api.get('/files', { params: { page, limit } }),

  /**
   * Delete file
   */
  delete: (fileId) =>
    api.delete(`/files/${fileId}`),

  /**
   * Share an uploaded file.
   * The password is already attached to the file at upload time.
   * @param {string} fileId - File ID
   * @param {number} expiresIn - Expiration time in hours (optional)
   */
  share: (fileId, expiresIn) => {
    return api.post(`/files/${fileId}/share`, { expiresIn });
  },

  /**
   * Get shared file info
   * @param {string} token - Share token
   */
  getSharedFileInfo: (token) =>
    api.get(`/files/shared/${token}`),

  /**
   * Download shared file
   * @param {string} token - Share token
   */
  downloadSharedFile: (token) =>
    api.get(`/files/shared/${token}/download`, {
      responseType: 'arraybuffer'
    })
};

/**
 * Error handler
 */
api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('❌ API Error:', message);

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect
      setAuthToken(null);
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
