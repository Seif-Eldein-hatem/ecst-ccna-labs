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

function draw(opts) {
  const preserve = (opts === true) || (opts && opts.keepScroll);
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const activeId = document.activeElement ? document.activeElement.id : null;
  const targetFocusId = (opts && opts.focusId) || activeId;

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

  // Mount any QuestionTypes that define a mount hook
  if (h.startsWith('room-')) {
    const roomId = h.slice(5);
    const currRoom = S.rooms.find(r => r.id == roomId);
    if (currRoom && currRoom.qs) {
      currRoom.qs.forEach((q, k) => {
        const handler = QuestionTypes.get(q.type || 'text');
        if (handler && typeof handler.mount === 'function') {
          const qId = q.id !== undefined ? q.id : k;
          const qEl = $(`q-${currRoom.id}-${qId}`);
          if (qEl) {
            const em = S.me ? S.me.email : '';
            handler.mount(qEl, q, {
              room: currRoom,
              roomIndex: S.rooms.indexOf(currRoom),
              qIndex: k,
              qId: qId,
              email: em,
              solved: Store.isSolved(em, currRoom.id, qId),
              solve: () => {
                Store.markSolved(em, currRoom.id, qId);
                toast(`Correct! +${Store.pts(q)}`);
                draw({ keepScroll: true, focusId: 'a' + (k + 1) });
              }
            });
          }
        }
      });
    }
  }

  // Apply progress bar widths from data attributes without template inline styles
  document.querySelectorAll('[data-progress]').forEach(el => {
    el.style.width = el.getAttribute('data-progress') + '%';
  });

  if (preserve) {
    window.scrollTo(scrollX, scrollY);
    if (targetFocusId && $(targetFocusId)) {
      $(targetFocusId).focus();
    } else if (activeId && $(activeId)) {
      $(activeId).focus();
    }
  } else {
    window.scrollTo(0, 0);
  }
}

window.addEventListener('hashchange', draw);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', draw);
} else {
  draw();
}
