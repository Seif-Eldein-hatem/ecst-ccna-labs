// Data store, localStorage persistence, and points/progress helpers

const K = 'ecst_v4';
const D = ['Easy', 'Medium', 'Hard', 'Expert'];
let S = null;

function save() {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {}
}

function load() {
  try {
    S = JSON.parse(localStorage.getItem(K));
  } catch (e) {
    S = null;
  }

  if (!S) {
    S = {
      users: [
        { name: 'ECST Admin', email: 'admin@ecst.edu', pass: 'Ecst@2026!', role: 'admin' }
      ],
      prog: {},
      rooms: (window.SEED || []).slice(),
      me: null,
      deleted: [],
      exams: {}
    };
  } else {
    S.users = S.users || [];
    S.prog = S.prog || {};
    S.rooms = S.rooms || [];
    S.deleted = S.deleted || [];
    S.exams = S.exams || {};

    // Admin migration: upgrade legacy admin email and password
    const LEGACY_ADMIN_EMAIL = atob('YWxoYXNzYW5hZG1pbkBlY3N0LmVkdQ==');
    let migrated = false;
    S.users.forEach(u => {
      if (u.email === LEGACY_ADMIN_EMAIL || (u.role === 'admin' && u.email !== 'admin@ecst.edu')) {
        u.email = 'admin@ecst.edu';
        u.pass = 'Ecst@2026!';
        migrated = true;
      }
    });

    if (S.me && (S.me.email === LEGACY_ADMIN_EMAIL || (S.me.role === 'admin' && S.me.email !== 'admin@ecst.edu'))) {
      S.me.email = 'admin@ecst.edu';
      S.me.pass = 'Ecst@2026!';
      migrated = true;
    }

    if (!S.users.some(u => u.role === 'admin')) {
      S.users.push({ name: 'ECST Admin', email: 'admin@ecst.edu', pass: 'Ecst@2026!', role: 'admin' });
      migrated = true;
    }

    // Merge SEED rooms
    const seedList = window.SEED || [];
    // 1. Update unedited saved rooms from SEED
    S.rooms.forEach((r, idx) => {
      if (!r.edited) {
        const seedRoom = seedList.find(s => s.id === r.id);
        if (seedRoom) {
          S.rooms[idx] = { ...seedRoom };
        }
      }
    });

    // 2. Add new rooms from SEED (not in S.rooms and not in S.deleted) at the end
    seedList.forEach(seedRoom => {
      const exists = S.rooms.some(r => r.id === seedRoom.id);
      const isDeleted = S.deleted.includes(seedRoom.id);
      if (!exists && !isDeleted) {
        S.rooms.push({ ...seedRoom });
      }
    });

    if (migrated) {
      save();
    }
  }

  window.S = S;
  return S;
}

// Initial load
load();

// Store API conforming to CONTRACT.md
window.Store = {
  get() {
    return S;
  },
  save() {
    save();
  },
  load() {
    return load();
  },
  isSolved(email, roomId, qId) {
    const list = ((S.prog && S.prog[email]) || {})[roomId] || [];
    return list.includes(qId);
  },
  markSolved(email, roomId, q) {
    const qId = (q && typeof q === 'object' && q.id !== undefined) ? q.id : q;
    const p = S.prog[email] = S.prog[email] || {};
    p[roomId] = [...new Set([...(p[roomId] || []), qId])];
    save();
  },
  pts(q) {
    if (q && typeof q === 'object' && q.pts !== undefined) {
      return Number(q.pts) || 0;
    }
    return 10;
  },
  userPoints(email) {
    if (!S || !S.rooms) return 0;
    return S.rooms.reduce((totalPts, r) => {
      const solved = ((S.prog[email] || {})[r.id] || []);
      return totalPts + solved.reduce((roomPts, qId) => {
        const q = (r.qs || []).find((item, idx) => item.id === qId || idx === qId);
        return roomPts + Store.pts(q);
      }, 0);
    }, 0);
  },
  roomCleared(email, room) {
    if (!room || !room.qs || room.qs.length === 0) return false;
    const solved = ((S.prog[email] || {})[room.id] || []);
    return solved.length >= room.qs.length;
  },
  resetStudent(email) {
    if (S.prog && S.prog[email]) {
      delete S.prog[email];
    }
    if (S.exams && S.exams[email]) {
      delete S.exams[email];
    }
    save();
  },
  deleteRoom(roomId) {
    S.deleted = S.deleted || [];
    if (!S.deleted.includes(roomId)) {
      S.deleted.push(roomId);
    }
    const idx = S.rooms.findIndex(r => r.id === roomId);
    if (idx >= 0) {
      S.rooms.splice(idx, 1);
    }
    for (const em in S.prog) {
      if (S.prog[em] && S.prog[em][roomId]) {
        delete S.prog[em][roomId];
      }
    }
    save();
  },
  exportBackup() {
    return JSON.stringify(S, null, 2);
  },
  importBackup(str) {
    try {
      const data = JSON.parse(str);
      if (!data || typeof data !== 'object' || !Array.isArray(data.users) || !data.prog) {
        return { ok: false, msg: 'Invalid backup format' };
      }
      S = data;
      window.S = S;
      save();
      return { ok: true, msg: 'Backup restored successfully' };
    } catch (err) {
      return { ok: false, msg: err.message };
    }
  },
  resetAll() {
    localStorage.removeItem(K);
    load();
    save();
  }
};

// Global helper functions
const done = (em, r) => ((S.prog[em] || {})[r.id] || []);
const cleared = (em, r) => Store.roomCleared(em, r);
const pts = em => Store.userPoints(em);
const total = () => S.rooms.reduce((n, r) => n + (r.qs || []).reduce((acc, q) => acc + Store.pts(q), 0), 0);
const unlocked = i => S.me.role === 'admin' || i === 0 || cleared(S.me.email, S.rooms[i - 1]);
