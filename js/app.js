// Application router, header navigation, toast notifications, and UI initializer

const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

const $ = id => document.getElementById(id);

function toast(t) {
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = t;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 1800);
}

function header(h) {
  const a = S.me && S.me.role === 'admin';
  return `<header><img src="${LOGO}" alt="ECST"><span class="mono">CCNA Challenge Labs</span><nav>
<a href="#path" class="${h === 'path' || h.startsWith('room') ? 'on' : ''}">Path</a><a href="#board" class="${h === 'board' ? 'on' : ''}">Leaderboard</a>${a ? `<a href="#admin" class="${h === 'admin' ? 'on' : ''}">Admin</a>` : ''}
<span class="header-user"><div class="user-name">${e(S.me.name)}</div><div class="mono user-role">${a ? 'Supervisor' : 'Student'}</div></span><a onclick="out()">Log out</a></nav></header>`;
}

function draw() {
  const h = location.hash.slice(1) || 'path';
  const a = $('app');
  if (!a) return;

  if (!S || !S.me) {
    a.innerHTML = auth();
    return;
  }

  let content = '';
  if (h === 'board') {
    content = board();
  } else if (h === 'admin') {
    content = admin();
  } else if (h.startsWith('room-')) {
    content = room(h.slice(5));
  } else {
    content = path();
  }

  a.innerHTML = header(h) + content;

  // Apply progress bar widths from data attributes without template inline styles
  document.querySelectorAll('[data-progress]').forEach(el => {
    el.style.width = el.getAttribute('data-progress') + '%';
  });

  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', draw);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', draw);
} else {
  draw();
}
