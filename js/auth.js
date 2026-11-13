// Authentication module: login, user registration, and logout

let mode = 'login';

function auth() {
  return `<div class="auth"><img src="${LOGO}" class="auth-logo" alt="ECST"><h1 class="auth-title">${mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
<p class="text-mut">ECST · CCNA Challenge Labs</p><div class="card">
${mode === 'reg' ? '<label>Full name</label><input id="n" placeholder="Your name">' : ''}<label>Email</label><input id="em" placeholder="you@example.com"><label>Password</label><input id="pw" type="password" placeholder="••••••••">
<button class="btn auth-btn" onclick="${mode === 'login' ? 'login()' : 'reg()'}">${mode === 'login' ? 'Log in' : 'Sign up'}</button></div>
<p class="text-mut">${mode === 'login' ? "Don't have an account? <a class='auth-switch-link' onclick=\"mode='reg';draw()\">Create one</a>" : "Have an account? <a class='auth-switch-link' onclick=\"mode='login';draw()\">Log in</a>"}</p>
</div>`;
}

function login() {
  const emailInput = $('em');
  const passInput = $('pw');
  if (!emailInput || !passInput) return;
  const em = emailInput.value.trim().toLowerCase();
  const pw = passInput.value;
  const u = S.users.find(x => x.email === em && x.pass === pw);
  if (!u) return toast('Wrong email or password');
  S.me = u;
  save();
  location.hash = 'path';
  draw();
}

function reg() {
  const nameInput = $('n');
  const emailInput = $('em');
  const passInput = $('pw');
  if (!emailInput || !passInput) return;
  const em = emailInput.value.trim().toLowerCase();
  const n = nameInput ? nameInput.value.trim() : '';
  const pw = passInput.value;
  if (!n || !em.includes('@') || pw.length < 6) return toast('Fill all fields (password 6+ chars)');
  if (S.users.some(x => x.email === em)) return toast('Email already used');
  const u = { name: n, email: em, pass: pw, role: 'student' };
  S.users.push(u);
  S.me = u;
  save();
  location.hash = 'path';
  draw();
}

function out() {
  S.me = null;
  save();
  draw();
}
