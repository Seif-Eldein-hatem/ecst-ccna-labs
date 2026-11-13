// Challenge rooms view, path progression, and question renderer registry

// Default 'text' question type
QuestionTypes.register('text', {
  render(q, ctx) {
    if (ctx.solved) {
      return '<div class="q-correct">✓ Correct</div>';
    }
    return `<div class="row"><input id="a${ctx.qIndex}" placeholder="Your answer" onkeydown="if(event.key=='Enter')ans(${ctx.roomIndex},${ctx.qIndex})"><button class="btn btn-submit" onclick="ans(${ctx.roomIndex},${ctx.qIndex})">Submit</button></div>`;
  },
  check(q, answer) {
    const NM = s => s.toLowerCase().replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();
    const v = NM(answer);
    if (!v) return false;
    return (q.a || '').split(';').map(NM).includes(v);
  }
});

function path() {
  const em = S.me.email;
  const c = S.rooms.filter(r => cleared(em, r)).length;
  const p = pts(em);
  const t = total();
  const tasks = S.rooms.reduce((n, r) => n + done(em, r).length, 0);
  const nt = S.rooms.reduce((n, r) => n + (r.qs || []).length, 0);
  const cur = S.rooms.findIndex((r, i) => unlocked(i) && !cleared(em, r));

  return `<main><div class="mono path-brand">ECST · CCNA Challenge Track</div><h1 class="path-title">Welcome back, ${e(S.me.name.split(' ')[0])}.</h1>
<p class="path-desc">Every room is a set of hands-on networking problems, graded the moment you answer. Clear a room to unlock the next one - the difficulty climbs with you.</p>
<div class="grid"><div class="card"><div class="mono">Points earned</div><div class="big">${p} <small>of ${t}</small></div></div><div class="card"><div class="mono">Rooms cleared</div><div class="big">${c} <small>of ${S.rooms.length}</small></div></div><div class="card"><div class="mono">Tasks solved</div><div class="big">${tasks} <small>of ${nt}</small></div></div></div>
<div class="card mb-24"><div class="mono track-label">Track progress<span class="text-red">${nt ? Math.round(tasks / nt * 100) : 0}%</span></div><div class="bar"><i class="bar-fill" data-progress="${nt ? tasks / nt * 100 : 0}"></i></div></div>
${S.rooms.map((r, i) => {
  const ok = unlocked(i);
  const d = done(em, r).length;
  const qCount = (r.qs || []).length;
  const roomPts = (r.qs || []).reduce((acc, q) => acc + Store.pts(q), 0);
  return `<div class="card room ${ok ? '' : 'lock'} ${i === cur ? 'cur' : ''}" ${ok ? `onclick="location.hash='room-${r.id}'"` : ''}><div class="num">${ok ? String(i + 1).padStart(2, '0') : '🔒'}</div><div class="room-body"><div class="mono">${e(r.cat)} · <span class="tag ${e(r.diff)}">${e(r.diff)}</span> · ${r.min} min</div><h3 class="room-title">${e(r.title)}</h3><div class="text-mut">${e(r.desc)}</div>
${ok ? `<div class="bar"><i class="bar-fill" data-progress="${qCount ? d / qCount * 100 : 0}"></i></div>` : `<div class="mono room-locked-text">Locked — clear “${e(S.rooms[i - 1] ? S.rooms[i - 1].title : '')}” first</div>`}</div><div class="mono nowrap">${roomPts} pts${ok ? ` · ${d}/${qCount}` : ''}</div></div>`;
}).join('')}</main>`;
}

function room(id) {
  const i = S.rooms.findIndex(r => r.id == id);
  if (i < 0 || !unlocked(i)) {
    location.hash = 'path';
    return '';
  }
  const r = S.rooms[i];
  const em = S.me.email;
  const dn = done(em, r);
  const qCount = (r.qs || []).length;

  return `<main><a href="#path" class="mono back-link">← Back to path</a><div class="mono mt-20">Room ${String(i + 1).padStart(2, '0')} · ${e(r.cat)} · <span class="tag ${e(r.diff)}">${e(r.diff)}</span></div><h1 class="room-page-title">${e(r.title)}</h1><p class="text-mut">${e(r.desc)}</p>
<div class="bar mb-24"><i class="bar-fill" data-progress="${qCount ? dn.length / qCount * 100 : 0}"></i></div>
${(r.qs || []).map((q, k) => {
  const qId = q.id !== undefined ? q.id : k;
  const isDone = dn.includes(qId) || dn.includes(k);
  const qPts = Store.pts(q);
  const handler = QuestionTypes.get(q.type || 'text') || QuestionTypes.get('text');
  const ctx = {
    room: r,
    roomIndex: i,
    qIndex: k,
    qId: qId,
    email: em,
    solved: isDone,
    solve: () => {
      Store.markSolved(em, r.id, qId);
      toast(`Correct! +${qPts}`);
      draw({ keepScroll: true, focusId: 'a' + (k + 1) });
    }
  };
  return `<div id="q-${r.id}-${qId}" class="q ${isDone ? 'done' : ''}"><div class="mono">Task ${k + 1} · ${qPts} pts</div>${q.exhibit ? `<pre class="exhibit mono">${e(q.exhibit)}</pre>` : ''}<div class="q-title">${e(q.q)}</div>${handler && handler.render ? handler.render(q, ctx) : ''}${isDone && q.explain ? `<div class="q-explain text-mut mt-8">${e(q.explain)}</div>` : ''}</div>`;
}).join('')}
${cleared(em, r) ? `<div class="card room-cleared-card"><h3>Room cleared 🎉</h3>${S.rooms[i + 1] ? `<p><a class="btn btn-next-room" href="#room-${S.rooms[i + 1].id}">Next room →</a></p>` : '<p>You finished the track!</p>'}</div>` : ''}</main>`;
}

const NM = s => s.toLowerCase().replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();

function ans(i, k) {
  const r = S.rooms[i];
  if (!r || !r.qs || !r.qs[k]) return;
  const q = r.qs[k];
  const inputEl = $('a' + k);
  if (!inputEl) return;
  const v = NM(inputEl.value);
  if (!v) return;
  const handler = QuestionTypes.get(q.type || 'text') || QuestionTypes.get('text');
  const ok = handler && handler.check ? handler.check(q, v) : false;
  if (!ok) return toast('Incorrect — try again');

  const qId = q.id !== undefined ? q.id : k;
  Store.markSolved(S.me.email, r.id, qId);
  toast(`Correct! +${Store.pts(q)}`);
  draw({ keepScroll: true, focusId: 'a' + (k + 1) });
}
