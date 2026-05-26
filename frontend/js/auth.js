function clearSessionStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

function isSubdirAppPath(pathname = window.location.pathname) {
  return pathname.includes('/admin/') ||
    pathname.includes('/teacher/') ||
    pathname.includes('/student/') ||
    pathname.includes('/parent/');
}

function isChangePasswordPage(pathname = window.location.pathname) {
  return pathname.endsWith('/change-password.html') || pathname.endsWith('change-password.html');
}

function getAuthLoginPath() {
  return isSubdirAppPath() ? '../login.html' : 'login.html';
}

function getAuthPasswordChangePath() {
  return isSubdirAppPath() ? '../change-password.html' : 'change-password.html';
}

function getDashboardPathForRole(role) {
  if (role === 'admin') return 'admin/dashboard.html';
  return `${role}/dashboard.html`;
}

function getRelativeAppPath(path) {
  return isSubdirAppPath() ? `../${path}` : path;
}

function getPostLoginPath(user) {
  if (!user?.role) return getAuthLoginPath();
  if (user.mustChangePassword) return getAuthPasswordChangePath();
  return getRelativeAppPath(getDashboardPathForRole(user.role));
}

const Auth = {
  getUser: getStoredUser,
  isLoggedIn: () => {
    const user = getStoredUser();
    return !!(user && user.role);
  },
  setSession: (token, user) => {
    localStorage.removeItem('token');
    if (!user) {
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearSession: clearSessionStorage,
  getLoginPath: getAuthLoginPath,
  getPasswordChangePath: getAuthPasswordChangePath,
  getDashboardPath: (role = getStoredUser()?.role) => getRelativeAppPath(getDashboardPathForRole(role || 'admin')),
  getPostLoginPath: (user = getStoredUser()) => getPostLoginPath(user),
  redirectAfterLogin: (user = getStoredUser()) => {
    window.location.href = getPostLoginPath(user);
  },
  logout: async () => {
    try {
      if (window.api && window.api.post) {
        await window.api.post('/auth/logout');
      }
    } catch (e) {
      console.warn('Logout API failed, clearing local session anyway');
    }
    clearSessionStorage();
    window.location.href = getAuthLoginPath();
  },
  requireAuth: (allowedRoles = []) => {
    if (!Auth.isLoggedIn()) {
      window.location.href = getAuthLoginPath();
      return null;
    }

    const user = Auth.getUser();
    if (!user?.role) {
      clearSessionStorage();
      window.location.href = getAuthLoginPath();
      return null;
    }

    if (user.mustChangePassword && !isChangePasswordPage()) {
      window.location.href = getAuthPasswordChangePath();
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      window.location.href = getPostLoginPath(user);
      return null;
    }

    return user;
  }
};

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

function showModal(id) {
  const element = document.getElementById(id);
  if (element) element.classList.remove('hidden');
}

function hideModal(id) {
  const element = document.getElementById(id);
  if (element) element.classList.add('hidden');
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCurrency(n) {
  return 'Rs. ' + (n || 0).toLocaleString('en-IN');
}

window.Auth = Auth;
window.showToast = showToast;
window.showModal = showModal;
window.hideModal = hideModal;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatCurrency = formatCurrency;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) return;

  const user = Auth.getUser();
  if (!user?.role) return;

  const accountPath = Auth.getPostLoginPath(user);
  const accountLabel = user.mustChangePassword ? 'Set Password' : 'Dashboard';
  const loginBtns = document.querySelectorAll('a[href="login.html"], a[href="../login.html"]');

  loginBtns.forEach((btn) => {
    if (btn.classList.contains('btn')) {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;align-items:center;gap:10px;';

      const dashBtn = document.createElement('a');
      dashBtn.href = accountPath;
      dashBtn.className = 'btn btn-primary text-sm';
      dashBtn.innerHTML = `<i class="fas ${user.mustChangePassword ? 'fa-key' : 'fa-gauge'}"></i> ${accountLabel}`;

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn btn-secondary text-sm';
      logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
      logoutBtn.onclick = () => Auth.logout();

      wrapper.appendChild(dashBtn);
      wrapper.appendChild(logoutBtn);
      btn.parentNode.replaceChild(wrapper, btn);
    } else {
      btn.href = accountPath;
      btn.textContent = user.mustChangePassword ? 'Finish Account Setup' : 'My Dashboard';
    }
  });
});
