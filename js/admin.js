// Admin management panel, room editor, and leaderboard

let edit = null;

function board() {
  const L = S.users
    .filter(u => u.role === 'student')
    .map(u => ({
      u,
      p: pts(u.email),
      c: S.rooms.filter(r => cleared(u.email, r)).length
    }))
    .sort((a, b) => b.p - a.p);

  return `<main><h1>Leaderboard</h1><div class="card scroll mt-24"><table><tr><th>#</th><th>Student</th><th>Rooms</th><th>Points</th></tr>${L.map((x, i) => `<tr><td>${i + 1}</td><td>${e(x.u.name)}</td><td>${x.c}</td><td><b>${x.p}</b></td></tr>`).join('') || '<tr><td colspan=4>No students yet.</td></tr>'}</table></div></main>`;
}

function admin() {
  if (!S.me || S.me.role !== 'admin') {
    location.hash = 'path';
    return '';
  }
  const st = S.users.filter(u => u.role === 'student');
  let h = `<main><h1>Admin</h1><p class="text-mut">Review results and manage rooms.</p><h3 class="admin-section-title">Rooms (${S.rooms.length})</h3><button class="btn" onclick="edt(-1)">+ New room</button>`;

  if (edit !== null) {
    const r = edit >= 0 ? S.rooms[edit] : { title: '', cat: '', diff: 'Easy', min: 15, desc: '', qs: [] };
    h += `<div class="card mt-16"><label>Title</label><input id="et" value="${e(r.title)}"><label>Category</label><input id="ec" value="${e(r.cat)}"><label>Difficulty</label><select id="ed">${D.map(d => `<option ${d === r.diff ? 'selected' : ''}>${d}</option>`).join('')}</select><label>Minutes</label><input id="em2" type="number" value="${r.min}"><label>Description</label><input id="es" value="${e(r.desc)}"><label>Tasks — one per line: question | answer1;answer2</label><textarea id="eq" rows="7">${e((r.qs || []).map(q => q.q + '|' + q.a).join('\n'))}</textarea><button class="btn" onclick="sv()">Save</button> <button class="btn g" onclick="edit=null;draw()">Cancel</button></div>`;
  }

  h += `<div class="card scroll mt-16"><table><tr><th>#</th><th>Room</th><th>Level</th><th>Tasks</th><th></th></tr>${S.rooms.map((r, i) => `<tr><td>${i + 1}</td><td>${e(r.title)}</td><td><span class="tag ${e(r.diff)}">${e(r.diff)}</span></td><td>${(r.qs || []).length}</td><td class="nowrap"><button class="btn g s" onclick="mv(${i},-1)">↑</button> <button class="btn g s" onclick="mv(${i},1)">↓</button> <button class="btn g s" onclick="edt(${i})">Edit</button> <button class="btn g s" onclick="del(${i})">Delete</button></td></tr>`).join('')}</table></div>
<h3 class="admin-section-title">Student results</h3><div class="card scroll"><table><tr><th>Student</th><th>Email</th><th>Rooms</th><th>Points</th></tr>${st.map(u => `<tr><td>${e(u.name)}</td><td>${e(u.email)}</td><td>${S.rooms.filter(r => cleared(u.email, r)).length}/${S.rooms.length}</td><td>${pts(u.email)}</td></tr>`).join('') || '<tr><td colspan=4>No students yet.</td></tr>'}</table></div></main>`;
  return h;
}

function edt(i) {
  edit = i;
  draw();
}

function sv() {
  const eqInput = $('eq');
  const etInput = $('et');
  const ecInput = $('ec');
  const edInput = $('ed');
  const em2Input = $('em2');
  const esInput = $('es');
  if (!eqInput || !etInput) return;

  const qs = eqInput.value
    .split('\n')
    .filter(l => l.includes('|'))
    .map((l, qIdx) => {
      const [a, ...b] = l.split('|');
      return { id: qIdx, q: a.trim(), a: b.join('|').trim() };
    });

  if (!etInput.value.trim() || !qs.length) {
    return toast('Title and at least one task needed');
  }

  const o = {
    title: etInput.value.trim(),
    cat: ecInput.value.trim() || 'General',
    diff: edInput.value,
    min: +em2Input.value || 15,
    desc: esInput.value.trim(),
    qs,
    edited: true
  };

  if (edit >= 0) {
    o.id = S.rooms[edit].id;
  }
  Store.saveRoom(o);

  edit = null;
  draw();
}

function mv(i, d) {
  const j = i + d;
  if (j < 0 || j >= S.rooms.length) return;
  [S.rooms[i], S.rooms[j]] = [S.rooms[j], S.rooms[i]];
  save();
  draw();
}

function del(i) {
  if (confirm('Delete this room?')) {
    const roomId = S.rooms[i].id;
    Store.deleteRoom(roomId);
    draw();
  }
}
