// Data store, localStorage persistence, and points/progress helpers

// QuestionTypes registry conforming to CONTRACT.md
window.QuestionTypes = window.QuestionTypes || {
  _types: {},
  register(type, handler) {
    this._types[type] = handler;
  },
  get(type) {
    return this._types[type];
  }
};

const K = window.__ECST_KEY || 'ecst_v4';
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
      rooms: JSON.parse(JSON.stringify(window.SEED || [])),
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
    let migrated = false;
    const adminUsers = S.users.filter(u => u.role === 'admin');
    const hasCurrentAdmin = S.users.some(u => u.email === 'admin@ecst.edu');

    if (adminUsers.length === 1 && !hasCurrentAdmin && adminUsers[0].email !== 'admin@ecst.edu') {
      const oldAdmin = adminUsers[0];
      const oldEmail = oldAdmin.email;
      const newEmail = 'admin@ecst.edu';
      oldAdmin.email = newEmail;
      oldAdmin.pass = 'Ecst@2026!';

      // Move / merge S.prog[oldEmail] -> S.prog[newEmail]
      if (S.prog && S.prog[oldEmail]) {
        S.prog[newEmail] = S.prog[newEmail] || {};
        for (const roomId in S.prog[oldEmail]) {
          const oldList = S.prog[oldEmail][roomId] || [];
          const existingList = S.prog[newEmail][roomId] || [];
          S.prog[newEmail][roomId] = [...new Set([...existingList, ...oldList])];
        }
        delete S.prog[oldEmail];
      }

      // Move / merge S.exams[oldEmail] -> S.exams[newEmail]
      if (S.exams && S.exams[oldEmail]) {
        S.exams[newEmail] = (S.exams[newEmail] || []).concat(S.exams[oldEmail] || []);
        delete S.exams[oldEmail];
      }

      // Update S.me if it pointed to oldEmail
      if (S.me) {
        if (typeof S.me === 'string' && S.me === oldEmail) {
          S.me = newEmail;
        } else if (typeof S.me === 'object' && S.me.email === oldEmail) {
          S.me.email = newEmail;
          S.me.pass = 'Ecst@2026!';
        }
      }
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
          S.rooms[idx] = JSON.parse(JSON.stringify(seedRoom));
        }
      }
    });

    // 2. Add new rooms from SEED (not in S.rooms and not in S.deleted) at the end
    seedList.forEach(seedRoom => {
      const exists = S.rooms.some(r => r.id === seedRoom.id);
      const isDeleted = S.deleted.includes(seedRoom.id);
      if (!exists && !isDeleted) {
        S.rooms.push(JSON.parse(JSON.stringify(seedRoom)));
        migrated = true;
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
  saveRoom(room) {
    room.edited = true;
    const existingIdx = (room.id !== undefined && room.id !== null)
      ? S.rooms.findIndex(r => r.id === room.id)
      : -1;

    if (existingIdx >= 0) {
      const oldRoom = S.rooms[existingIdx];
      const oldQs = oldRoom.qs || [];
      const incomingQs = room.qs || [];
      const highestExistingQId = oldQs.reduce((max, q) => Math.max(max, (q && q.id !== undefined) ? q.id : -1), -1);
      let nextQId = Math.max(room.nextQId || 0, oldRoom.nextQId || 0, highestExistingQId + 1);

      const matchedOldIndices = new Set();
      const extraFields = ['type', 'exhibit', 'options', 'correct', 'pts', 'explain', 'norm'];

      const updatedQs = incomingQs.map(q => {
        const copyQ = { ...q };
        let matchedOldQ = null;
        for (let j = 0; j < oldQs.length; j++) {
          if (!matchedOldIndices.has(j) && oldQs[j] && oldQs[j].q && copyQ.q && oldQs[j].q.trim() === copyQ.q.trim()) {
            matchedOldIndices.add(j);
            matchedOldQ = oldQs[j];
            break;
          }
        }

        if (matchedOldQ) {
          copyQ.id = matchedOldQ.id;
          extraFields.forEach(f => {
            if (matchedOldQ[f] !== undefined && copyQ[f] === undefined) {
              copyQ[f] = matchedOldQ[f];
            }
          });
        } else {
          copyQ.id = nextQId++;
        }
        return copyQ;
      });

      const nextCounter = Math.max(room.nextQId || 0, oldRoom.nextQId || 0, nextQId);
      const updatedRoom = {
        ...oldRoom,
        ...room,
        edited: true,
        qs: updatedQs,
        nextQId: nextCounter
      };
      S.rooms[existingIdx] = updatedRoom;
      save();
      return updatedRoom;
    } else {
      // New room creation: new room id = max(all room ids ever used, S.deleted) + 1, never reused
      const allUsedRoomIds = [0, ...S.rooms.map(r => r.id), ...(S.deleted || []), ...(window.SEED || []).map(r => r.id)];
      const newRoomId = Math.max(...allUsedRoomIds) + 1;
      room.id = newRoomId;

      const incomingQs = room.qs || [];
      let nextQId = 0;
      const updatedQs = incomingQs.map((q, idx) => {
        const copyQ = { ...q };
        if (copyQ.id === undefined) {
          copyQ.id = idx;
        }
        nextQId = Math.max(nextQId, copyQ.id + 1);
        return copyQ;
      });

      room.qs = updatedQs;
      room.nextQId = Math.max(room.nextQId || 0, nextQId);
      room.edited = true;
      S.rooms.push(room);
      save();
      return room;
    }
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
