const NAV = {
  admin: [
    { icon: 'fa-gauge', label: 'Dashboard', href: 'dashboard.html' },
    { icon: 'fa-users', label: 'Students', href: 'students.html' },
    { icon: 'fa-chalkboard-teacher', label: 'Teachers', href: 'teachers.html' },
    { icon: 'fa-calendar-check', label: 'Attendance', href: 'attendance.html' },
    { icon: 'fa-indian-rupee-sign', label: 'Fee Management', href: 'fees.html' },
    { icon: 'fa-chart-bar', label: 'Results', href: 'results.html' },
    { icon: 'fa-bullhorn', label: 'Notice Board', href: 'notices.html' },
    { icon: 'fa-images', label: 'Gallery', href: 'gallery.html' },
    { icon: 'fab fa-whatsapp', label: 'WhatsApp', href: 'whatsapp.html' },
    { icon: 'fa-calendar-alt', label: 'Timetable', href: 'timetable.html' },
    { icon: 'fa-file-alt', label: 'Exam Schedule', href: 'exams.html' },
    { icon: 'fa-user-plus', label: 'Admissions', href: 'admissions.html' },
    { icon: 'fa-envelope', label: 'Contact Messages', href: 'contacts.html' },
    { icon: 'fa-cog', label: 'School Settings', href: 'settings.html' },
  ],
  teacher: [
    { icon: 'fa-gauge', label: 'Dashboard', href: 'dashboard.html' },
    { icon: 'fa-calendar-check', label: 'Attendance', href: 'attendance.html' },
    { icon: 'fa-chart-bar', label: 'Results', href: 'results.html' },
    { icon: 'fa-calendar-alt', label: 'Timetable', href: 'timetable.html' },
    { icon: 'fa-file-alt', label: 'Exam Schedule', href: 'exams.html' },
    { icon: 'fa-bullhorn', label: 'Notices', href: '../admin/notices.html' },
  ],
  student: [
    { icon: 'fa-gauge', label: 'Dashboard', href: 'dashboard.html' },
    { icon: 'fa-calendar-check', label: 'My Attendance', href: 'attendance.html' },
    { icon: 'fa-indian-rupee-sign', label: 'My Fees', href: 'fees.html' },
    { icon: 'fa-chart-bar', label: 'My Results', href: 'results.html' },
    { icon: 'fa-calendar-alt', label: 'Timetable', href: 'timetable.html' },
    { icon: 'fa-file-alt', label: 'Exam Schedule', href: 'exams.html' },
    { icon: 'fa-bullhorn', label: 'Notices', href: '../admin/notices.html' },
  ],
  parent: [
    { icon: 'fa-gauge', label: 'Dashboard', href: 'dashboard.html' },
    { icon: 'fa-calendar-alt', label: 'Timetable', href: 'timetable.html' },
    { icon: 'fa-file-alt', label: 'Exam Schedule', href: 'exams.html' },
    { icon: 'fa-bullhorn', label: 'Notices', href: '../admin/notices.html' },
  ]
};

// Cache school settings for the page lifetime
let _schoolSettings = null;
async function loadSchoolSettings() {
  if (_schoolSettings) return _schoolSettings;
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    _schoolSettings = data.data || {};
  } catch {
    _schoolSettings = {};
  }
  return _schoolSettings;
}

// Expose so other scripts can use fee types etc.
window.getSchoolSettings = loadSchoolSettings;

async function buildLayout(pageTitle, role) {
  const user = Auth.getUser();
  if (!user) return;

  const settings = await loadSchoolSettings();
  const schoolName = settings.schoolName || 'My School';
  const schoolTagline = settings.tagline || 'School Management System';
  const schoolLogo = settings.logo || null;
  const primaryColor = settings.primaryColor || '#1e3a5f';

  const navItems = NAV[role] || NAV.admin;
  const currentPage = window.location.pathname.split('/').pop();
  const changePasswordPath = '../change-password.html';
  const securityLabel = user.mustChangePassword ? 'Set Password' : 'Change Password';
  // Role-specific tint: admin uses custom primaryColor, others keep their own brand color
  const roleColors = { admin: primaryColor, teacher: '#14532d', student: '#1e1b4b', parent: '#431407' };
  const sidebarBg = roleColors[role] || primaryColor;
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Logo or initial avatar
  const logoHTML = schoolLogo
    ? `<img src="${schoolLogo}" alt="logo" class="w-10 h-10 rounded-xl object-cover flex-shrink-0">`
    : `<div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0">${schoolName[0].toUpperCase()}</div>`;

  const sidebarHTML = `
    <div class="flex flex-col h-full text-white" style="background:${sidebarBg}; width:240px; min-width:240px; height:100vh;">
      <div class="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        ${logoHTML}
        <div class="flex-1 min-w-0"><div class="font-bold text-sm leading-tight">${schoolName}</div><div class="text-xs text-white/60">${schoolTagline}</div></div>
        <button id="sidebarCloseBtn" onclick="closeMobileSidebar()" style="display:none" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 flex-shrink-0">
          <i class="fas fa-times text-white/70"></i>
        </button>
      </div>
      <nav class="flex-1 py-4 px-2 overflow-y-auto">
        ${navItems.map(item => `
          <a href="${item.href}" class="sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm text-white/80 hover:text-white ${item.href === currentPage ? 'active text-white' : ''}">
            <i class="fas ${item.icon} w-5 text-center"></i>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="px-4 py-4 border-t border-white/10">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold flex-shrink-0">${(user.name || 'U')[0].toUpperCase()}</div>
          <div class="min-w-0">
            <div class="text-sm font-semibold truncate">${user.name}</div>
            <div class="text-xs text-white/50 capitalize">${user.role}</div>
          </div>
        </div>
        <a href="${changePasswordPath}" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition mb-2">
          <i class="fas fa-key"></i> ${securityLabel}
        </a>
        <button onclick="Auth.logout()" class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>`;

  const headerHTML = `
    <div class="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center gap-2 min-w-0">
        <button id="menuToggle" onclick="toggleMobileSidebar()" style="display:none" class="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0 mr-1">
          <i class="fas fa-bars text-gray-600 text-lg"></i>
        </button>
        <div class="min-w-0">
          <h1 class="text-base sm:text-xl font-bold text-gray-800 truncate">${pageTitle}</h1>
          <p class="text-xs text-gray-400 mt-0.5 hidden sm:block">${dateStr}</p>
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        ${user.mustChangePassword ? '<span class="badge badge-yellow hidden sm:inline-flex">Password update required</span>' : ''}
        <span class="badge badge-blue capitalize hidden sm:inline-flex">${user.role}</span>
        <span class="text-sm text-gray-600 font-medium hidden lg:block">${user.name}</span>
        ${role === 'admin' ? `
        <div class="relative" id="bellWrap">
          <button onclick="toggleNotifDropdown()" id="bellBtn" class="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
            <i class="fas fa-bell text-base"></i>
            <span id="bellBadge" style="display:none;position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;background:#ef4444;color:white;font-size:10px;font-weight:700;border-radius:999px;display:none;align-items:center;justify-content:center;padding:0 4px;"></span>
          </button>
          <div id="notifDropdown" style="display:none;position:absolute;right:0;top:calc(100% + 8px);width:320px;z-index:1000;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.15);border:1px solid #f1f5f9;overflow:hidden;background:white;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;">
              <span style="font-weight:700;font-size:14px;color:#1e293b;">Notifications</span>
              <span id="notifCountLabel" style="font-size:12px;color:#94a3b8;"></span>
            </div>
            <div id="notifList" style="max-height:320px;overflow-y:auto;">
              <div style="text-align:center;padding:32px 16px;color:#94a3b8;font-size:13px;"><i class="fas fa-spinner fa-spin"></i></div>
            </div>
            <div style="padding:10px 16px;border-top:1px solid #f1f5f9;background:#f8fafc;text-align:center;">
              <a href="/admin/admissions.html" style="font-size:12px;color:#2563eb;text-decoration:none;margin-right:16px;">Admissions</a>
              <a href="/admin/contacts.html" style="font-size:12px;color:#2563eb;text-decoration:none;">Contact Messages</a>
            </div>
          </div>
        </div>` : ''}
        <a href="${changePasswordPath}" style="display:inline-flex;align-items:center;gap:5px;background:#0f766e;color:white;text-decoration:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;" class="hidden sm:inline-flex">
          <i class="fas fa-key"></i><span class="hidden md:inline">${securityLabel}</span>
        </a>
        <button onclick="Auth.logout()" style="display:inline-flex;align-items:center;gap:5px;background:#dc2626;color:white;border:none;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;">
          <i class="fas fa-sign-out-alt"></i><span class="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>`;

  const sidebar = document.getElementById('sidebar');
  const header = document.getElementById('topbar');
  if (sidebar) sidebar.innerHTML = sidebarHTML;
  if (header) header.innerHTML = headerHTML;
  document.title = `${pageTitle} | School Management`;

  // Start notification bell polling for admin
  if (role === 'admin') {
    fetchNotifications();
    if (!window._notifInterval) {
      window._notifInterval = setInterval(fetchNotifications, 30000);
    }
    // Close dropdown on outside click (register once)
    if (!window._notifClickListenerAdded) {
      window._notifClickListenerAdded = true;
      document.addEventListener('click', (e) => {
        const wrap = document.getElementById('bellWrap');
        const dd = document.getElementById('notifDropdown');
        if (dd && wrap && !wrap.contains(e.target)) {
          dd.style.display = 'none';
        }
      });
    }
  }

  // Inject overlay into body (only once)
  if (!document.getElementById('sidebarOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.onclick = () => closeMobileSidebar();
    document.body.appendChild(overlay);
  }

  // Show/hide mobile-only elements based on screen width
  function updateMobileUI() {
    const isMobile = window.innerWidth < 768;
    const toggle = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('sidebarCloseBtn');
    if (toggle) toggle.style.display = isMobile ? 'flex' : 'none';
    if (closeBtn) closeBtn.style.display = isMobile ? 'flex' : 'none';
    // On desktop, ensure sidebar is always visible (remove any mobile state)
    if (!isMobile) {
      sidebar && sidebar.classList.remove('sidebar-open');
      const ov = document.getElementById('sidebarOverlay');
      if (ov) ov.classList.remove('sidebar-overlay-visible');
    }
  }
  updateMobileUI();
  window.addEventListener('resize', updateMobileUI);
}

// Global mobile sidebar functions — accessible from onclick in HTML
window.toggleMobileSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('sidebar-open');
  if (isOpen) {
    sidebar.classList.remove('sidebar-open');
    overlay && overlay.classList.remove('sidebar-overlay-visible');
  } else {
    sidebar.classList.add('sidebar-open');
    overlay && overlay.classList.add('sidebar-overlay-visible');
  }
};

window.closeMobileSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar && sidebar.classList.remove('sidebar-open');
  overlay && overlay.classList.remove('sidebar-overlay-visible');
};

window.buildLayout = buildLayout;

// Notification bell
window.toggleNotifDropdown = function () {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const isOpen = dd.style.display !== 'none';
  dd.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) fetchNotifications();
};

function _timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function fetchNotifications() {
  try {
    const res = await fetch('/api/notifications/inbox', { credentials: 'include' });
    if (!res.ok) return;
    const data = await res.json();

    const badge = document.getElementById('bellBadge');
    const list = document.getElementById('notifList');
    const countLabel = document.getElementById('notifCountLabel');
    if (!badge || !list) return;

    const unread = data.unread || 0;
    if (unread > 0) {
      badge.style.display = 'flex';
      badge.textContent = unread > 99 ? '99+' : unread;
    } else {
      badge.style.display = 'none';
    }
    if (countLabel) countLabel.textContent = unread > 0 ? `${unread} new` : 'All clear';

    if (!data.items || data.items.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:32px 16px;color:#94a3b8;font-size:13px;"><i class="fas fa-check-circle" style="color:#22c55e;font-size:24px;display:block;margin-bottom:8px;"></i>No new notifications</div>';
      return;
    }

    list.innerHTML = data.items.map(item => `
      <a href="${item.href}" style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #f8fafc;transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
        <div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;background:${item.type === 'admission' ? '#dcfce7' : '#dbeafe'};color:${item.type === 'admission' ? '#16a34a' : '#2563eb'};">
          <i class="fas ${item.type === 'admission' ? 'fa-user-plus' : 'fa-envelope'}" style="font-size:12px;"></i>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</div>
          <div style="font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.subtitle}</div>
          <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${_timeAgo(item.time)}</div>
        </div>
      </a>
    `).join('');
  } catch { /* silently fail */ }
}

// OneSignal push notification init
(async function initOneSignal() {
  try {
    const res = await fetch('/api/notifications/config');
    const data = await res.json();
    if (!data.configured || !data.appId) return;

    const sdkScript = document.createElement('script');
    sdkScript.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    sdkScript.defer = true;
    document.head.appendChild(sdkScript);

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({ appId: data.appId, notifyButton: { enable: false } });
      const permission = await OneSignal.Notifications.permission;
      if (!permission) await OneSignal.Notifications.requestPermission();
    });
  } catch { /* OneSignal not configured */ }
})();
