const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];
const isFileProtocol = window.location.protocol === 'file:';

if (isFileProtocol) {
  const normalizedPath = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
  const frontendMarker = '/frontend/';
  const markerIndex = normalizedPath.toLowerCase().lastIndexOf(frontendMarker);

  if (markerIndex !== -1) {
    const relativePath = normalizedPath.slice(markerIndex + frontendMarker.length);
    const redirectUrl = `http://localhost/${relativePath}${window.location.search}${window.location.hash}`;
    window.location.replace(redirectUrl);
  }
}

const isLocalHost = LOCAL_HOSTS.includes(window.location.hostname);
const API_BASE = isFileProtocol ? 'http://localhost:5000/api' : '/api';
const FALLBACK_API_BASE = isLocalHost ? 'http://localhost:5000/api' : null;

const getApiLoginPath = () => {
  const path = window.location.pathname;
  if (path.includes('/admin/') || path.includes('/teacher/') || path.includes('/student/') || path.includes('/parent/')) {
    return '../login.html';
  }
  return 'login.html';
};

const getApiPasswordChangePath = () => {
  const path = window.location.pathname;
  if (path.includes('/admin/') || path.includes('/teacher/') || path.includes('/student/') || path.includes('/parent/')) {
    return '../change-password.html';
  }
  return 'change-password.html';
};

const isPasswordChangePage = () => window.location.pathname.endsWith('/change-password.html') || window.location.pathname.endsWith('change-password.html');

const apiFetch = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Remove Content-Type for multipart/form-data (let browser set it with boundary)
  if (headers['Content-Type'] === 'multipart/form-data') {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
    credentials: 'include',
    signal: controller.signal
  };

  let res;
  let data = {};
  const requestUrl = `${API_BASE}${endpoint}`;
  const fallbackUrl = FALLBACK_API_BASE && FALLBACK_API_BASE !== API_BASE ? `${FALLBACK_API_BASE}${endpoint}` : null;

  const runFetch = async (url) => {
    const response = await fetch(url, config);
    let responseData = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }
    return { response, responseData };
  };

  try {
    try {
      const primary = await runFetch(requestUrl);
      res = primary.response;
      data = primary.responseData;
    } catch (primaryError) {
      if (!fallbackUrl || primaryError.name !== 'AbortError') {
        throw primaryError;
      }

      const fallback = await runFetch(fallbackUrl);
      res = fallback.response;
      data = fallback.responseData;
    }

    if (!res.ok) {
      if (res.status === 401 && endpoint !== '/auth/login') {
        if (window.Auth?.clearSession) window.Auth.clearSession();
        else {
          localStorage.removeItem('user');
        }

        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = getApiLoginPath();
        }
      }

      if (res.status === 403 && data.requiresPasswordChange) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
          if (storedUser) {
            storedUser.mustChangePassword = true;
            localStorage.setItem('user', JSON.stringify(storedUser));
          }
        } catch {}

        if (!isPasswordChangePage()) {
          window.location.href = getApiPasswordChangePath();
        }
      }

      throw new Error(data.message || 'Request failed');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please refresh the page and try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  return data;
};

const api = {
  get: (url, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`${url}${qs ? '?' + qs : ''}`);
  },
  post: (url, body, isFormData = false) => {
    if (isFormData) {
      return apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body
      });
    }
    return apiFetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  put: (url, body, isFormData = false) => {
    if (isFormData) {
      return apiFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'multipart/form-data' },
        body
      });
    }
    return apiFetch(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },
  delete: (url) => apiFetch(url, { method: 'DELETE' })
};

window.api = api;
