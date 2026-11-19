// Admin management panel, room editor, student results, backup, and leaderboard (Part D)

let edit = null;
let editingSpecialQs = [];
let studentSearchQuery = '';
let studentSortDesc = true;

// Helper to escape HTML characters
function escHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c];
  });
}

// Escape field for CSV export
function escapeCsvField(val) {
  const str = String(val == null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Check how many students have recorded progress in a room
function countStudentsWithProgress(roomId) {
  if (!S || !S.prog || !Array.isArray(S.users)) return 0;
  const students = S.users.filter(u => u.role === 'student');
  return students.filter(u => {
    const p = S.prog[u.email];
    if (!p) return false;
    const list = p[roomId] || p[String(roomId)];
    return Array.isArray(list) && list.length > 0;
  }).length;
}

// Calculate exam metrics for student, guarding against total = 0
function getStudentExamStats(email) {
  const list = (S.exams && S.exams[email]) || [];
  if (!Array.isArray(list) || list.length === 0) {
    return { attempts: '-', bestPct: '-' };
  }
  let maxPct = -1;
  list.forEach(item => {
    if (item && typeof item.total === 'number' && item.total > 0 && typeof item.correct === 'number') {
      const pct = Math.round((item.correct / item.total) * 100);
      if (pct > maxPct) {
        maxPct = pct;
      }
    }
  });
  return {
    attempts: list.length,
    bestPct: maxPct >= 0 ? maxPct + '%' : '-'
  };
}

// Filter and sort students list
function getFilteredAndSortedStudents() {
  if (!S || !Array.isArray(S.users)) return [];
  const q = (studentSearchQuery || '').trim().toLowerCase();
  let students = S.users.filter(u => u.role === 'student');
  if (q) {
    students = students.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }
  return students.sort((a, b) => {
    const ptsA = pts(a.email);
    const ptsB = pts(b.email);
    return studentSortDesc ? ptsB - ptsA : ptsA - ptsB;
  });
}

// Render student table rows HTML
function renderStudentRowsHtml(students) {
  if (!students || students.length === 0) {
    return '<tr><td colspan="7" class="text-center py-16 text-mut">No students found.</td></tr>';
  }
  const totalRooms = (S.rooms || []).length;
  return students.map(u => {
    const c = (S.rooms || []).filter(r => cleared(u.email, r)).length;
    const p = pts(u.email);
    const examStats = getStudentExamStats(u.email);
    return `<tr>
      <td>${escHtml(u.name)}</td>
      <td>${escHtml(u.email)}</td>
      <td>${c}/${totalRooms}</td>
      <td><b>${p}</b></td>
      <td>${escHtml(examStats.bestPct)}</td>
      <td>${escHtml(examStats.attempts)}</td>
      <td class="nowrap">
        <button type="button" class="btn g s" onclick="resetStudentProgress('${escHtml(u.email)}', '${escHtml(u.name)}')">Reset progress</button>
      </td>
    </tr>`;
  }).join('');
}

// Live student search handler (updates tbody without re-rendering the whole page to preserve focus)
function onStudentSearchInput(val) {
  studentSearchQuery = val || '';
  const tbody = $('student-table-body');
  if (tbody) {
    tbody.innerHTML = renderStudentRowsHtml(getFilteredAndSortedStudents());
  }
}

// Toggle sort order by points
function toggleStudentSort() {
  studentSortDesc = !studentSortDesc;
  const iconEl = $('student-sort-indicator');
  if (iconEl) {
    iconEl.textContent = studentSortDesc ? '▼' : '▲';
  }
  const tbody = $('student-table-body');
  if (tbody) {
    tbody.innerHTML = renderStudentRowsHtml(getFilteredAndSortedStudents());
  }
}

// Reset student progress with confirm dialog
function resetStudentProgress(email, name) {
  if (confirm(`Are you sure you want to reset all progress for student "${name}" (${email})?\n\nThis will clear all completed rooms, earned points, and exam records.`)) {
    Store.resetStudent(email);
    toast(`Progress reset for ${name}`);
    draw();
  }
}

// CSV export with UTF-8 BOM for proper Arabic support in Excel
function exportStudentCSV() {
  if (!S || !Array.isArray(S.users)) return;
  const students = S.users.filter(u => u.role === 'student');
  const totalRooms = (S.rooms || []).length;

  const headers = ['Name', 'Email', 'Rooms Cleared', 'Points', 'Best Exam %'];
  const rows = students.map(u => {
    const c = (S.rooms || []).filter(r => cleared(u.email, r)).length;
    const p = pts(u.email);
    const examStats = getStudentExamStats(u.email);

    return [
      escapeCsvField(u.name),
      escapeCsvField(u.email),
      escapeCsvField(`${c}/${totalRooms}`),
      escapeCsvField(p),
      escapeCsvField(examStats.bestPct)
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student_results_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download backup JSON file
function downloadBackup() {
  const jsonStr = Store.exportBackup();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecst_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Handle restore backup from JSON file
function handleRestoreBackup(ev) {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    if (confirm('Restoring a backup will overwrite current rooms, users, and progress. Do you want to proceed?')) {
      const res = Store.importBackup(content);
      if (res && res.ok) {
        toast(res.msg || 'Backup restored successfully');
        draw();
      } else {
        toast('Restore failed: ' + ((res && res.msg) || 'Invalid backup file'));
      }
    }
    ev.target.value = '';
  };
  reader.readAsText(file);
}

// Reset entire state with double confirmation
function resetEverything() {
  if (confirm('WARNING: This will reset all students, progress, and custom rooms back to factory defaults.\n\nAre you sure you want to proceed?')) {
    if (confirm('FINAL CONFIRMATION: All current data will be permanently wiped.\n\nReset everything now?')) {
      Store.resetAll();
      toast('System reset to factory defaults');
      draw();
    }
  }
}

// Leaderboard view
function board() {
  const L = (S.users || [])
    .filter(u => u.role === 'student')
    .map(u => ({
      u,
      p: pts(u.email),
      c: (S.rooms || []).filter(r => cleared(u.email, r)).length
    }))
    .sort((a, b) => b.p - a.p);

  // Equal points = equal rank (competition ranking)
  let currentRank = 1;
  const ranked = L.map((item, idx) => {
    if (idx > 0 && item.p < L[idx - 1].p) {
      currentRank = idx + 1;
    }
    return { ...item, rank: currentRank };
  });

  const meEmail = S.me && S.me.email;

  return `<main>
    <h1>Leaderboard</h1>
    <div class="card scroll mt-24">
      <table>
        <thead>
          <tr>
            <th style="width: 70px;">Rank</th>
            <th>Student</th>
            <th>Rooms</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${ranked.map(x => {
            const isMe = meEmail && x.u.email === meEmail;
            let rankDisplay = String(x.rank);
            if (x.rank === 1) rankDisplay = '<span class="medal-icon">🥇</span> 1';
            else if (x.rank === 2) rankDisplay = '<span class="medal-icon">🥈</span> 2';
            else if (x.rank === 3) rankDisplay = '<span class="medal-icon">🥉</span> 3';

            return `<tr class="${isMe ? 'leaderboard-current-user' : ''}">
              <td>${rankDisplay}</td>
              <td>${escHtml(x.u.name)}${isMe ? '<span class="tag-you">You</span>' : ''}</td>
              <td>${x.c}</td>
              <td><b>${x.p}</b></td>
            </tr>`;
          }).join('') || '<tr><td colspan="4" class="text-center py-16 text-mut">No students yet.</td></tr>'}
        </tbody>
      </table>
    </div>
  </main>`;
}

// Admin dashboard view
function admin() {
  if (!S.me || S.me.role !== 'admin') {
    location.hash = 'path';
    return '';
  }

  const filteredStudents = getFilteredAndSortedStudents();

  let h = `<main>
    <div class="admin-header-row">
      <div>
        <h1>Admin</h1>
        <p class="text-mut">Review student results, manage lab rooms, and configure system backups.</p>
      </div>
    </div>

    <h3 class="admin-section-title">Rooms (${(S.rooms || []).length})</h3>
    <button type="button" class="btn" onclick="edt(-1)">+ New room</button>`;

  // Room Editor
  if (edit !== null) {
    const r = edit >= 0 && S.rooms[edit]
      ? S.rooms[edit]
      : { title: '', cat: '', diff: 'Easy', min: 15, desc: '', qs: [] };

    // Format questions: special questions get tagged read-only lines, text questions get q|a
    const tasksText = (r.qs || []).map(q => {
      if (q.type === 'mcq') return `[mcq] ${q.q}`;
      if (q.type === 'terminal') return `[terminal] ${q.q}`;
      if (q.exhibit) return `[exhibit] ${q.q}`;
      return `${q.q} | ${q.a || ''}`;
    }).join('\n');

    h += `<div class="card mt-16">
      <h3>${edit >= 0 ? 'Edit Room' : 'New Room'}</h3>
      <label>Title</label>
      <input id="et" value="${escHtml(r.title)}" placeholder="Room title">
      <label>Category</label>
      <input id="ec" value="${escHtml(r.cat)}" placeholder="Category">
      <label>Difficulty</label>
      <select id="ed">${D.map(d => `<option ${d === r.diff ? 'selected' : ''}>${d}</option>`).join('')}</select>
      <label>Estimated Minutes</label>
      <input id="em2" type="number" value="${r.min || 15}">
      <label>Description</label>
      <input id="es" value="${escHtml(r.desc)}" placeholder="Short room description">

      <label>Tasks &mdash; one per line: <code>question | answer1;answer2</code> (Special tasks like <code>[mcq]</code> or <code>[terminal]</code> are preserved unchanged)</label>
      <textarea id="eq" rows="7">${escHtml(tasksText)}</textarea>

      <!-- Sub-form: Add MCQ question -->
      <div class="mcq-form-card">
        <div class="mcq-form-title">+ Add Multiple Choice Question (MCQ)</div>
        <div class="mcq-grid">
          <div class="mcq-grid-full">
            <input id="mcq-q" placeholder="Question text">
          </div>
          <div>
            <input id="mcq-opt0" placeholder="Option 1">
          </div>
          <div>
            <input id="mcq-opt1" placeholder="Option 2">
          </div>
          <div>
            <input id="mcq-opt2" placeholder="Option 3">
          </div>
          <div>
            <input id="mcq-opt3" placeholder="Option 4">
          </div>
        </div>
        <div class="mcq-row">
          <select id="mcq-correct">
            <option value="">-- Select correct option --</option>
            <option value="0">Option 1</option>
            <option value="1">Option 2</option>
            <option value="2">Option 3</option>
            <option value="3">Option 4</option>
          </select>
          <input id="mcq-pts" type="number" value="10" placeholder="Points (10)" style="max-width: 120px;">
          <button type="button" class="btn g s" onclick="addMcqQuestion()">+ Add MCQ</button>
        </div>
      </div>

      <div class="mt-16">
        <button type="button" class="btn" onclick="sv()">Save Room</button>
        <button type="button" class="btn g" onclick="cancelEdit()">Cancel</button>
      </div>
    </div>`;
  }

  // Rooms table
  h += `<div class="card scroll mt-16">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Room</th>
          <th>Level</th>
          <th>Tasks</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${(S.rooms || []).map((r, i) => `<tr>
          <td>${i + 1}</td>
          <td>${escHtml(r.title)}</td>
          <td><span class="tag ${escHtml(r.diff)}">${escHtml(r.diff)}</span></td>
          <td>${(r.qs || []).length}</td>
          <td class="nowrap">
            <button type="button" class="btn g s" onclick="mv(${i},-1)">↑</button>
            <button type="button" class="btn g s" onclick="mv(${i},1)">↓</button>
            <button type="button" class="btn g s" onclick="edt(${i})">Edit</button>
            <button type="button" class="btn g s" onclick="del(${i})">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Student Results Section -->
  <div class="admin-toolbar">
    <div>
      <h3 class="admin-section-title" style="margin:0;">Student Results</h3>
    </div>
    <div class="admin-btn-group">
      <div class="admin-search-box">
        <input id="student-search-input" type="text" placeholder="Search by name or email..." value="${escHtml(studentSearchQuery)}" oninput="onStudentSearchInput(this.value)">
      </div>
      <button type="button" class="btn g s" onclick="exportStudentCSV()">Export CSV</button>
    </div>
  </div>

  <div class="card scroll">
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Rooms</th>
          <th class="sortable-th" onclick="toggleStudentSort()">
            Points <span id="student-sort-indicator">${studentSortDesc ? '▼' : '▲'}</span>
          </th>
          <th>Best Exam %</th>
          <th>Attempts</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="student-table-body">
        ${renderStudentRowsHtml(filteredStudents)}
      </tbody>
    </table>
  </div>

  <!-- Backup & Maintenance Card -->
  <div class="backup-card">
    <div class="backup-title">Data Backup & Maintenance</div>
    <div class="backup-desc">Export a complete snapshot of all students, progress, and challenge rooms as a JSON file, restore an existing backup, or reset the environment to factory defaults.</div>
    <div class="backup-actions">
      <button type="button" class="btn g" onclick="downloadBackup()">Download backup</button>
      <input type="file" id="backup-file-input" accept=".json" style="display:none" onchange="handleRestoreBackup(event)">
      <button type="button" class="btn g" onclick="$('backup-file-input').click()">Restore backup</button>
      <button type="button" class="btn btn-danger" onclick="resetEverything()">Reset everything</button>
    </div>
  </div>

  </main>`;

  return h;
}

// Start room editing
function edt(i) {
  edit = i;
  if (i >= 0 && S.rooms && S.rooms[i]) {
    const r = S.rooms[i];
    editingSpecialQs = (r.qs || [])
      .filter(q => q.type === 'mcq' || q.type === 'terminal' || q.exhibit)
      .map(q => ({ ...q }));
  } else {
    editingSpecialQs = [];
  }
  draw();
}

// Cancel room editing
function cancelEdit() {
  edit = null;
  editingSpecialQs = [];
  draw();
}

// Add MCQ Question to the active editing session
function addMcqQuestion() {
  const qEl = $('mcq-q');
  const opt0El = $('mcq-opt0');
  const opt1El = $('mcq-opt1');
  const opt2El = $('mcq-opt2');
  const opt3El = $('mcq-opt3');
  const correctEl = $('mcq-correct');
  const ptsEl = $('mcq-pts');

  if (!qEl || !opt0El || !opt1El || !opt2El || !opt3El || !correctEl) return;

  const qText = qEl.value.trim();
  const opt0 = opt0El.value.trim();
  const opt1 = opt1El.value.trim();
  const opt2 = opt2El.value.trim();
  const opt3 = opt3El.value.trim();
  const correctVal = correctEl.value;

  // Validate non-empty question, 4 non-empty options, and selected correct option
  if (!qText) {
    return toast('Question text cannot be empty');
  }
  if (!opt0 || !opt1 || !opt2 || !opt3) {
    return toast('All 4 options must be non-empty');
  }
  if (correctVal === '' || correctVal == null) {
    return toast('Please select the correct option');
  }

  const newMcq = {
    type: 'mcq',
    q: qText,
    options: [opt0, opt1, opt2, opt3],
    correct: Number(correctVal),
    pts: (ptsEl && Number(ptsEl.value)) || 10
  };

  editingSpecialQs.push(newMcq);

  const eqEl = $('eq');
  if (eqEl) {
    const currentVal = eqEl.value.trim();
    eqEl.value = currentVal ? currentVal + '\n[mcq] ' + qText : '[mcq] ' + qText;
  }

  // Reset MCQ inputs
  qEl.value = '';
  opt0El.value = '';
  opt1El.value = '';
  opt2El.value = '';
  opt3El.value = '';
  correctEl.value = '';
  if (ptsEl) ptsEl.value = '10';

  toast('MCQ question added');
}

// Save room
function sv() {
  const eqInput = $('eq');
  const etInput = $('et');
  const ecInput = $('ec');
  const edInput = $('ed');
  const em2Input = $('em2');
  const esInput = $('es');
  if (!eqInput || !etInput) return;

  const title = etInput.value.trim();
  if (!title) {
    return toast('Room title is required');
  }

  const lines = eqInput.value.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    return toast('At least one task needed');
  }

  const specialPool = [...editingSpecialQs];
  const qs = [];

  lines.forEach(line => {
    const specialMatch = line.match(/^\[(mcq|terminal|exhibit)\]\s*(.*)$/i);
    if (specialMatch) {
      const qText = specialMatch[2].trim();
      const poolIdx = specialPool.findIndex(item => (item.q || '').trim() === qText);
      if (poolIdx >= 0) {
        qs.push({ ...specialPool[poolIdx], q: qText });
        specialPool.splice(poolIdx, 1);
      } else {
        const typeTag = specialMatch[1].toLowerCase();
        qs.push({
          type: typeTag === 'exhibit' ? 'text' : typeTag,
          q: qText,
          pts: 10
        });
      }
    } else if (line.includes('|')) {
      const [qPart, ...aParts] = line.split('|');
      const qText = qPart.trim();
      const aText = aParts.join('|').trim();
      if (qText) {
        qs.push({ q: qText, a: aText, type: 'text', pts: 10 });
      }
    }
  });

  if (!qs.length) {
    return toast('At least one valid task needed');
  }

  const o = {
    title,
    cat: (ecInput && ecInput.value.trim()) || 'General',
    diff: (edInput && edInput.value) || 'Easy',
    min: (em2Input && +em2Input.value) || 15,
    desc: (esInput && esInput.value.trim()) || '',
    qs,
    edited: true
  };

  if (edit >= 0 && S.rooms && S.rooms[edit]) {
    o.id = S.rooms[edit].id;
  }

  Store.saveRoom(o);
  edit = null;
  editingSpecialQs = [];
  toast('Room saved successfully');
  draw();
}

// Move room up/down in list
function mv(i, d) {
  const j = i + d;
  if (!S || !S.rooms || j < 0 || j >= S.rooms.length) return;
  [S.rooms[i], S.rooms[j]] = [S.rooms[j], S.rooms[i]];
  Store.save();
  draw();
}

// Delete room with progress warning
function del(i) {
  if (!S || !S.rooms || !S.rooms[i]) return;
  const r = S.rooms[i];
  const count = countStudentsWithProgress(r.id);
  const msg = count > 0
    ? `Delete room "${r.title}"?\n\nWarning: ${count} student(s) currently have progress in this room. Deleting it will permanently erase their progress in this room.`
    : `Delete room "${r.title}"? This cannot be undone.`;

  if (confirm(msg)) {
    Store.deleteRoom(r.id);
    toast(`Room "${r.title}" deleted`);
    draw();
  }
}
