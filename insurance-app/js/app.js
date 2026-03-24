/* ============================================================
   InsureAI — Core Application Logic
   All data stored in localStorage for demo purposes
   ============================================================ */

const App = {

  /* ── STORAGE HELPERS ── */
  get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  getList: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  pushTo: (key, item) => {
    const list = App.getList(key);
    list.push(item);
    App.set(key, list);
  },

  /* ── ID GENERATORS ── */
  genId: (prefix) => prefix + Date.now().toString().slice(-6) + Math.floor(Math.random()*100),

  /* ── CURRENT USER ── */
  currentUser: () => App.get('currentUser'),
  isLoggedIn: () => !!App.get('currentUser'),

  /* ── AUTH GUARD ── */
  requireAuth: () => {
    if (!App.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  requireAdmin: () => {
    const u = App.currentUser();
    if (!u || u.role !== 'admin') { window.location.href = 'login.html'; return false; }
    return true;
  },
  redirectIfLoggedIn: () => {
    if (App.isLoggedIn()) {
      const u = App.currentUser();
      window.location.href = u.role === 'admin' ? 'admin.html' : 'dashboard.html';
    }
  },

  /* ── REGISTRATION ── */
  register: (data) => {
    const users = App.getList('users');
    if (users.find(u => u.email === data.email)) return { ok: false, msg: 'Email already registered.' };
    const user = {
      id: App.genId('USR'),
      name: data.name, email: data.email, mobile: data.mobile,
      dob: data.dob, password: data.password, role: 'customer',
      verified: true, loginAttempts: 0, locked: false,
      createdAt: new Date().toISOString()
    };
    App.pushTo('users', user);
    return { ok: true };
  },

  /* ── LOGIN ── */
  login: (email, password) => {
    const users = App.getList('users');
    const user = users.find(u => u.email === email);
    if (!user) return { ok: false, msg: 'Invalid credentials. Please try again.' };
    if (user.locked) return { ok: false, msg: 'Account locked due to multiple failed attempts. Check your email.' };
    if (user.password !== password) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) user.locked = true;
      App.set('users', users);
      const left = 5 - user.loginAttempts;
      return { ok: false, msg: user.locked ? 'Account locked after 5 failed attempts.' : `Invalid credentials. ${left} attempts remaining.` };
    }
    user.loginAttempts = 0;
    App.set('users', users);
    App.set('currentUser', user);
    return { ok: true, user };
  },

  logout: () => { localStorage.removeItem('currentUser'); window.location.href = 'login.html'; },

  /* ── POLICIES ── */
  getPolicies: (userId) => App.getList('policies').filter(p => !userId || p.userId === userId),
  getPolicy: (id) => App.getList('policies').find(p => p.id === id),
  addPolicy: (policy) => { App.pushTo('policies', policy); return policy; },
  updatePolicy: (id, updates) => {
    const list = App.getList('policies');
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; App.set('policies', list); }
  },

  /* ── QUOTES ── */
  saveQuote: (quote) => { App.pushTo('quotes', quote); return quote; },
  getQuotes: (userId) => App.getList('quotes').filter(q => q.userId === userId),
  getQuote: (id) => App.getList('quotes').find(q => q.id === id),

  /* ── CLAIMS ── */
  getClaims: (userId) => App.getList('claims').filter(c => !userId || c.userId === userId),
  getClaim: (id) => App.getList('claims').find(c => c.id === id),
  addClaim: (claim) => { App.pushTo('claims', claim); return claim; },
  updateClaim: (id, updates) => {
    const list = App.getList('claims');
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; App.set('claims', list); }
  },

  /* ── PAYMENTS ── */
  getPayments: (userId) => App.getList('payments').filter(p => !userId || p.userId === userId),
  addPayment: (payment) => { App.pushTo('payments', payment); return payment; },

  /* ── UTILITY ── */
  formatCurrency: (n) => '₹' + Number(n).toLocaleString('en-IN'),
  formatDate: (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '-',
  daysLeft: (endDate) => Math.ceil((new Date(endDate) - new Date()) / 86400000),

  toast: (msg, type = 'success') => {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    const bg = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';
    t.className = `toast align-items-center text-white ${bg} border-0 show mb-2`;
    t.setAttribute('role','alert');
    t.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },

  /* ── SEED DEMO DATA ── */
  seed: () => {
    if (App.get('seeded')) return;

    // Admin user
    const users = [
      { id:'USR000', name:'Admin User', email:'admin@insureai.com', mobile:'9000000000', dob:'1985-01-01', password:'Admin@123', role:'admin', verified:true, loginAttempts:0, locked:false, createdAt:'2026-01-01T00:00:00Z' },
      { id:'USR001', name:'Rahul Sharma', email:'rahul@demo.com', mobile:'9876543210', dob:'1990-05-15', password:'Test@1234', role:'customer', verified:true, loginAttempts:0, locked:false, createdAt:'2026-01-10T00:00:00Z' },
      { id:'USR002', name:'Priya Patel', email:'priya@demo.com', mobile:'9876543211', dob:'1995-08-22', password:'Test@1234', role:'customer', verified:true, loginAttempts:0, locked:false, createdAt:'2026-01-15T00:00:00Z' }
    ];
    App.set('users', users);

    const policies = [
      { id:'POL202600001', userId:'USR001', type:'Motor', plan:'Comprehensive', vehicleNumber:'MH12AB1234', make:'Maruti Suzuki', model:'Swift', year:'2022', fuelType:'Petrol', startDate:'2026-01-01', endDate:'2026-12-31', premium:12500, sumInsured:500000, status:'Active', nominee:'Sunita Sharma', nomineeRel:'Spouse', createdAt:'2026-01-01T00:00:00Z' },
      { id:'POL202600002', userId:'USR001', type:'Health', plan:'Standard', members:2, startDate:'2026-02-01', endDate:'2027-01-31', premium:18000, sumInsured:500000, status:'Active', nominee:'Sunita Sharma', nomineeRel:'Spouse', createdAt:'2026-02-01T00:00:00Z' },
      { id:'POL202600003', userId:'USR001', type:'Travel', plan:'Basic', destination:'Thailand', startDate:'2025-12-01', endDate:'2025-12-15', premium:3200, sumInsured:200000, status:'Expired', nominee:'Sunita Sharma', nomineeRel:'Spouse', createdAt:'2025-12-01T00:00:00Z' },
      { id:'POL202600004', userId:'USR002', type:'Home', plan:'Structure + Contents', propertyType:'Owned', city:'Pune', startDate:'2026-01-15', endDate:'2027-01-14', premium:8500, sumInsured:3000000, status:'Active', nominee:'Ravi Patel', nomineeRel:'Father', createdAt:'2026-01-15T00:00:00Z' }
    ];
    App.set('policies', policies);

    const claims = [
      { id:'CLM202600001', userId:'USR001', policyId:'POL202600001', policyType:'Motor', incidentDate:'2026-02-10', filedDate:'2026-02-12', type:'Cashless', description:'Front bumper damaged in minor collision at parking lot.', amount:25000, status:'Approved', statusHistory: [{ status:'Submitted', date:'2026-02-12' }, { status:'Under Review', date:'2026-02-13' }, { status:'Approved', date:'2026-02-18' }] },
      { id:'CLM202600002', userId:'USR001', policyId:'POL202600002', policyType:'Health', incidentDate:'2026-03-05', filedDate:'2026-03-06', type:'Reimbursement', description:'Hospitalization due to viral fever. 3 days admission.', amount:45000, status:'Under Review', statusHistory: [{ status:'Submitted', date:'2026-03-06' }, { status:'Under Review', date:'2026-03-07' }] }
    ];
    App.set('claims', claims);

    const payments = [
      { id:'TXN202600001', userId:'USR001', policyId:'POL202600001', policyType:'Motor', date:'2026-01-01', amount:12500, method:'Credit Card', status:'Success', txnRef:'HDFC8723641' },
      { id:'TXN202600002', userId:'USR001', policyId:'POL202600002', policyType:'Health', date:'2026-02-01', amount:18000, method:'UPI', status:'Success', txnRef:'UPI9034512' },
      { id:'TXN202600003', userId:'USR002', policyId:'POL202600004', policyType:'Home', date:'2026-01-15', amount:8500, method:'Net Banking', status:'Success', txnRef:'NETBK5612390' }
    ];
    App.set('payments', payments);

    App.set('seeded', true);
  }
};

/* ── SIDEBAR ACTIVE LINK ── */
function setActiveSidebarLink() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar .nav-item a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
}

/* ── RENDER NAVBAR USER ── */
function renderNavUser() {
  const u = App.currentUser();
  const el = document.getElementById('navUserName');
  if (el && u) el.textContent = u.name.split(' ')[0];
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  App.seed();
  setActiveSidebarLink();
  renderNavUser();
});
