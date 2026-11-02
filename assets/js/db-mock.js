/* Bamu Tracker - relational SQL simulation engine (localStorage) + shared UI kit.
   Simulation only: real deployments use database/schema.sql with hashed passwords and a server API. */
(function (w) {
  'use strict';
  var KEY = 'bamu_db_v2', ME = Math.random(), SIMX = 25;
  var PLANS = { 'Personal Lite': 149, 'Personal Pro': 229, 'Fleet Pro': 189, 'Enterprise': 249 };
  var MODELS = [['Bamu T1 Lite', 899], ['Bamu T2 Pro CAN', 1499], ['Bamu T3 Fleet ID', 1899], ['Bamu Cam 4G', 2999]];
  var CITIES = [['Pretoria', -25.7479, 28.2293], ['Midrand', -25.9953, 28.128], ['Sandton', -26.1076, 28.0567], ['Johannesburg', -26.2041, 28.0473], ['Soweto', -26.2678, 27.8546], ['Kempton Park', -26.1, 28.2294], ['Centurion', -25.8603, 28.1894]];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var hash = function (s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); };
  var ago = function (t) { var s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : Math.floor(s / 86400) + ' d ago'; };
  var dt = function (t) { return new Date(t).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }); };
  var money = function (v) { return 'R ' + Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  function logCmd(S, d, type, by, role) {
    var prev = S.commands.length ? S.commands[S.commands.length - 1].hash : '00000000';
    var c = { id: S.seq++, dev: d.id, imei: d.imei, plate: d.plate, type: type, by: by, role: role, ts: Date.now(), status: d.status === 'offline' && type !== 'ping' ? 'queued' : 'acknowledged', prev: prev };
    c.hash = hash(prev + c.dev + c.type + c.by + c.ts); S.commands.push(c); return c;
  }
  function seed() {
    var s = 7, R = function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    var n = Date.now(), D = 864e5;
    var S = { seq: 1000, meta: { v: 1, written: n }, users: [], devices: [], telemetry: [], commands: [], alerts: [], trips: [], invoices: [], tickets: [], jobs: [] };
    function U(id, role, name, email, pass, phone, plan) { S.users.push({ id: id, role: role, name: name, email: email, pass: pass, phone: phone, plan: plan, status: 'active', card: role === 'client' ? '4242' : '', notify: { email: true, sms: true }, created: n - 90 * D }); }
    U(1, 'admin', 'Control Centre Admin', 'admin@bamu.co.za', 'Admin@123', '', '');
    U(2, 'client', 'Thabo Mokoena', 'client@bamu.co.za', 'Client@123', '+27 82 555 0101', 'Fleet Pro');
    U(3, 'client', 'Lerato Logistics (Pty) Ltd', 'ops@lerato.co.za', 'Client@123', '+27 11 555 0148', 'Enterprise');
    U(4, 'partner', 'Bamu Pretoria Central (Fitment)', 'partner@bamu.co.za', 'Partner@123', '+27 12 555 0190', '');
    function V(id, imei, model, owner, plate, veh, lat, lng, status, speed) { S.devices.push({ id: id, imei: imei, model: model, sim: '89270' + String(1000000000 + id * 7919), owner: owner, plate: plate, vehicle: veh, lat: lat, lng: lng, heading: R() * 6.28, speed: speed, status: status, immob: false, fw: '2.1.4', batt: 80 + Math.floor(R() * 20), seen: n }); }
    V(10, '865432100000010', 'Bamu T3 Fleet ID', 2, 'GP 123 ABC', 'Toyota Hilux 2.8 GD-6', -25.7479, 28.2293, 'moving', 64);
    V(11, '865432100000028', 'Bamu T2 Pro CAN', 2, 'GP 456 DEF', 'Mercedes Sprinter 515', -25.9953, 28.128, 'idle', 0);
    V(12, '865432100000036', 'Bamu T3 Fleet ID', 3, 'GP 789 GHI', 'Isuzu NPR 400', -26.2041, 28.0473, 'moving', 48);
    V(13, '865432100000044', 'Bamu T2 Pro CAN', 3, 'GP 321 JKL', 'Volkswagen Crafter', -26.1076, 28.0567, 'moving', 72);
    V(14, '865432100000051', 'Bamu T1 Lite', 3, 'GP 654 MNO', 'Ford Ranger', -26.2678, 27.8546, 'offline', 0);
    V(15, '865432100000069', 'Bamu T1 Lite', null, '', '', null, null, 'inventory', 0);
    V(16, '865432100000077', 'Bamu T2 Pro CAN', null, '', '', null, null, 'inventory', 0); V(17, '865432100000085', 'Bamu T3 Fleet ID', null, '', '', null, null, 'inventory', 0);
    S.devices.forEach(function (d) { if (!d.owner) d.partner = 4; });
    S.devices.forEach(function (d) {
      if (!d.owner) return;
      for (var i = 0; i < 8; i++) {
        var a = CITIES[Math.floor(R() * 7)], b = CITIES[Math.floor(R() * 7)], st = n - (i + 1) * D * 0.9 - R() * 3e6, mins = 20 + Math.floor(R() * 70), km = Math.round((8 + R() * 70) * 10) / 10;
        S.trips.push({ id: S.seq++, dev: d.id, start: st, end: st + mins * 6e4, from: a[0], to: b[0] === a[0] ? 'Centurion' : b[0], km: km, max: 80 + Math.floor(R() * 45), avg: Math.round(km / (mins / 60)) });
      }
    });
    function J(owner, plate, veh, svc, city, off, st) { var u = S.users.find(function (x) { return x.id === owner; }), c = CITIES.find(function (x) { return x[0] === city; }); S.jobs.push({ id: S.seq++, partner: 4, owner: owner, customer: u.name, plate: plate, vehicle: veh, service: svc, city: city, lat: c[1], lng: c[2], when: n + off * 36e5, status: st, imei: null }); }
    J(2, 'GP 778 PQR', 'Toyota Fortuner', 'install', 'Pretoria', 3, 'scheduled'); J(3, 'GP 902 STU', 'Hino 300', 'install', 'Johannesburg', 27, 'scheduled'); J(2, 'GP 123 ABC', 'Toyota Hilux 2.8 GD-6', 'repair', 'Centurion', 5, 'in-progress'); J(3, 'GP 321 JKL', 'Volkswagen Crafter', 'install', 'Sandton', -48, 'done');
    function A(dev, type, sev, msg, ago) { var d = S.devices.find(function (x) { return x.id === dev; }); S.alerts.push({ id: S.seq++, dev: dev, owner: d.owner, type: type, sev: sev, msg: msg, ts: n - ago, read: false }); }
    A(10, 'speed', 'high', 'Speeding: 118 km/h in 100 zone', 36e5); A(13, 'geofence', 'high', 'Left Midrand depot geofence', 9e6);
    A(14, 'tamper', 'critical', 'Main power disconnected', 2e7); A(11, 'battery', 'medium', 'Backup battery below 25%', 8e7);
    [2, 3].forEach(function (o) {
      var c = S.devices.filter(function (d) { return d.owner === o; }).length, u = S.users.find(function (x) { return x.id === o; });
      for (var k = 0; k < 3; k++) S.invoices.push({ id: S.seq++, owner: o, no: 'INV-' + (2026) + '-' + o + '0' + (3 - k), date: n - k * 30 * D, amount: c * PLANS[u.plan], status: k === 0 ? 'due' : 'paid', paid: k === 0 ? null : n - k * 30 * D + 3 * D });
    });
    S.tickets.push({ id: S.seq++, owner: 3, name: 'Lerato Logistics (Pty) Ltd', email: 'ops@lerato.co.za', type: 'support', priority: 'medium', subject: 'Driver ID tags not registering', msg: 'Two drivers report the iButton is not read on GP 789 GHI.', status: 'open', ts: n - 5e7, dev: null, replies: [] });
    S.tickets.push({ id: S.seq++, owner: null, name: 'Sipho Dlamini', email: 'sipho@example.co.za', type: 'lead', priority: 'low', subject: 'Quote for 12 trucks', msg: 'Please send a fleet quote for 12 light delivery trucks.', status: 'open', ts: n - 9e7, dev: null, replies: [] });
    logCmd(S, S.devices[0], 'ping', 'Control Centre Admin', 'admin'); logCmd(S, S.devices[2], 'ping', 'Lerato Logistics (Pty) Ltd', 'client');
    return S;
  }

  var S, subs = [];
  function load() { try { var r = localStorage.getItem(KEY); if (r) { var o = JSON.parse(r); if (o && o.users) return o; } } catch (e) { } return S && S.users ? S : seed(); }
  function save() { S.meta.written = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function emit() { subs.slice().forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  S = load(); save();
  w.addEventListener('storage', function (e) { if (e.key === KEY) { S = load(); emit(); } });

  var B = {
    esc: esc, ago: ago, dt: dt, money: money, hash: hash, PLANS: PLANS, MODELS: MODELS, CITIES: CITIES,
    get db() { return S; },
    add: function (t, r) { r.id = S.seq++; S[t].push(r); save(); emit(); return r; },
    upd: function (t, id, p) { var r = S[t].find(function (x) { return x.id == id; }); if (r) { Object.assign(r, p); save(); emit(); } return r; },
    del: function (t, id) { S[t] = S[t].filter(function (x) { return x.id != id; }); save(); emit(); },
    find: function (t, id) { return S[t].find(function (x) { return x.id == id; }); },
    mut: function (fn) { fn(S); save(); emit(); },
    refresh: function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); emit(); },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) { } S = seed(); save(); emit(); },
    mine: function (u) { return S.devices.filter(function (d) { return d.owner === u.id; }); },
    alertsFor: function (u) { return S.alerts.filter(function (a) { return a.owner === u.id; }).sort(function (a, b) { return b.ts - a.ts; }); },
    alert: function (d, type, msg) { var sev = type === 'panic' || type === 'tamper' ? 'critical' : type === 'battery' ? 'medium' : 'high'; S.alerts.push({ id: S.seq++, dev: d.id, owner: d.owner, type: type, sev: sev, msg: msg, ts: Date.now(), read: false }); },
    cmd: function (id, type, by, role) {
      var d = B.find('devices', id); if (!d) return null;
      if (type === 'immobilise') { d.immob = true; d.speed = 0; d.status = 'idle'; }
      if (type === 'restore') d.immob = false;
      if (type === 'ping' && d.status !== 'offline') d.seen = Date.now();
      var c = logCmd(S, d, type, by, role); save(); emit(); return c;
    },
    verifyChain: function () { var p = '00000000'; return S.commands.every(function (c) { var ok = c.prev === p && c.hash === hash(c.prev + c.dev + c.type + c.by + c.ts); p = c.hash; return ok; }); },
    sim: function () { if (!w.__bamuSim) w.__bamuSim = setInterval(tick, 3000); }
  };
  function recent(d, type) { return S.alerts.some(function (a) { return a.dev === d.id && a.type === type && Date.now() - a.ts < 60000; }); }
  function tick() {
    try { var l = JSON.parse(localStorage.getItem('bamu_lock') || '{}'); if (l.id !== ME && Date.now() - l.t < 4500) return; localStorage.setItem('bamu_lock', JSON.stringify({ id: ME, t: Date.now() })); } catch (e) { }
    S = load();
    S.devices.forEach(function (d) {
      if (!d.owner || d.status === 'offline' || d.immob || d.lat == null) return;
      if (d.status === 'idle' && Math.random() < .15) d.status = 'moving'; else if (d.status === 'moving' && Math.random() < .04) { d.status = 'idle'; d.speed = 0; }
      if (d.status === 'moving') {
        d.heading += (Math.random() - .5) * .6; d.speed = Math.max(20, Math.min(128, d.speed + (Math.random() - .5) * 16));
        var k = d.speed / 3600 * 3 / 111 * SIMX; d.lat += Math.cos(d.heading) * k; d.lng += Math.sin(d.heading) * k;
        if (d.lat < -26.45 || d.lat > -25.55 || d.lng < 27.75 || d.lng > 28.55) { d.heading += Math.PI; if (!recent(d, 'geofence')) B.alert(d, 'geofence', 'Left permitted Gauteng geofence'); }
        if (d.speed > 110 && !recent(d, 'speed')) B.alert(d, 'speed', 'Speeding: ' + Math.round(d.speed) + ' km/h in 100 zone');
        S.telemetry.push({ dev: d.id, lat: d.lat, lng: d.lng, speed: Math.round(d.speed), ts: Date.now() });
      }
      d.seen = Date.now();
    });
    if (S.telemetry.length > 400) S.telemetry = S.telemetry.slice(-400);
    save(); emit();
  }

  /* ---------- Authentication (separate stores: admin = sessionStorage, client = localStorage) ---------- */
  var store = function (r) { return r === 'client' ? localStorage : sessionStorage; };
  B.user = function (r) {
    try {
      var s = JSON.parse(store(r).getItem('bamu_session_' + r)); if (!s) return null;
      if (r !== 'client' && Date.now() - s.t > 1800000) { B.logout(r); return null; }
      var u = S.users.find(function (x) { return x.id === s.id && x.role === r && x.status === 'active'; });
      if (u && r !== 'client') { s.t = Date.now(); store(r).setItem('bamu_session_' + r, JSON.stringify(s)); }
      return u || null;
    } catch (e) { return null; }
  };
  B.login = function (r, email, pass) {
    var st = store(r), f = JSON.parse(st.getItem('bamu_fail_' + r) || '{"n":0,"t":0}');
    if (f.n >= 5 && Date.now() - f.t < 60000) return { err: 'Too many attempts. Try again in a minute.' };
    var u = S.users.find(function (x) { return x.role === r && x.email.toLowerCase() === String(email).trim().toLowerCase(); });
    if (!u || u.pass !== pass) { st.setItem('bamu_fail_' + r, JSON.stringify({ n: f.n >= 5 ? 1 : f.n + 1, t: Date.now() })); return { err: 'Invalid email or password.' }; }
    if (u.status !== 'active') return { err: 'This account is suspended. Please contact support.' };
    st.removeItem('bamu_fail_' + r); st.setItem('bamu_session_' + r, JSON.stringify({ id: u.id, t: Date.now() })); return { ok: u };
  };
  B.logout = function (r) { store(r).removeItem('bamu_session_' + r); };

  /* ---------- UI kit ---------- */
  var ui = B.ui = {
    stat: function (l, v, s) { return '<div class="stat"><span>' + l + '</span><b>' + v + '</b><small>' + (s || '&nbsp;') + '</small></div>'; },
    badge: function (t) { return '<span class="badge ' + esc(t) + '">' + esc(t) + '</span>'; },
    status: function (d) { return ui.badge(d.immob ? 'immobilised' : d.status); },
    table: function (cols, rows, empty) {
      if (!rows.length) return '<p class="empty">' + (empty || 'No records found.') + '</p>';
      return '<div class="tw"><table><thead><tr>' + cols.map(function (c) { return '<th>' + c[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) { return '<tr>' + cols.map(function (c) { return '<td>' + c[1](r) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    },
    on: function (v, m) { v.onclick = function (e) { var b = e.target.closest('[data-act]'); if (b && m[b.dataset.act]) m[b.dataset.act](b.dataset.id, b); }; },
    toast: function (msg, bad) { var t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); },
    modal: function (title, fields, cb, label) {
      var m = document.createElement('div'); m.className = 'modal';
      m.innerHTML = '<form class="mbox"><h3>' + esc(title) + '</h3>' + fields.map(function (f) {
        if (f.t === 'note') return '<p>' + f.l + '</p>';
        var i;
        if (f.t === 'select') i = '<select name="' + f.n + '">' + f.o.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(f.v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
        else if (f.t === 'textarea') i = '<textarea name="' + f.n + '" rows="4"' + (f.r === false ? '' : ' required') + '>' + esc(f.v || '') + '</textarea>';
        else i = '<input name="' + f.n + '" type="' + (f.t || 'text') + '" value="' + esc(f.v || '') + '"' + (f.r === false ? '' : ' required') + (f.p ? ' pattern="' + f.p + '"' : '') + (f.m ? ' title="' + esc(f.m) + '"' : '') + '>';
        return '<label>' + f.l + i + '</label>';
      }).join('') + '<div class="row"><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn">' + (label || 'Save') + '</button></div></form>';
      document.body.appendChild(m);
      var close = function () { m.remove(); };
      m.querySelector('[data-x]').onclick = close; m.onmousedown = function (e) { if (e.target === m) close(); };
      m.querySelector('form').onsubmit = function (e) { e.preventDefault(); if (cb(Object.fromEntries(new FormData(e.target))) !== false) close(); };
      var f = m.querySelector('input,select,textarea'); if (f) f.focus();
    },
    map: function (cv, units, o) {
      o = o || {}; if (!w.L) { cv.classList.add('map-unavailable'); cv.setAttribute('role', 'status'); cv.textContent = 'The live map library did not load. Refresh the page or check your connection.'; return; }
      var M = w.__bamuLmap;
      var isMini = cv.classList.contains('mini');
      if (!M) {
        var el = document.createElement('div'); el.className = 'map';
        el.setAttribute('role', 'application'); el.setAttribute('aria-label', 'Interactive satellite map');
        cv.replaceWith(el);
        var map = L.map(el, { zoomControl: true, scrollWheelZoom: true }).setView([-26.05, 28.15], 13);
        if (map.attributionControl) map.attributionControl.setPosition('topright');
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri, Vantor, Earthstar Geographics, and the GIS User Community' }).addTo(map);
        M = w.__bamuLmap = { el: el, map: map, mk: {}, tr: {}, fit: false, sel: null, o: {} };
      } else {
        cv.replaceWith(M.el);
      }
      M.o = o; M.el.classList.toggle('mini', isMini);
      M.map.scrollWheelZoom[cv.classList.contains('mini') ? 'disable' : 'enable']();
      setTimeout(function () { M.map.invalidateSize(); }, 0);
      var seen = {}, bounds = [];
      units.forEach(function (d) {
        if (d.lat == null) return; seen[d.id] = 1; bounds.push([d.lat, d.lng]);
        var cls = (d.immob ? 'offline' : d.status) + (d.id === o.sel ? ' sel' : ''), m = M.mk[d.id];
        var html = '<div class="bm ' + cls + '"></div><span class="bl">' + esc(d.plate) + '</span>';
        if (!m) { m = M.mk[d.id] = L.marker([d.lat, d.lng], { icon: L.divIcon({ className: 'bw', html: html, iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(M.map); m.on('click', function () { if (M.o.onSel) M.o.onSel(d.id); }); m._cls = cls; }
        else { m.setLatLng([d.lat, d.lng]); if (m._cls !== cls) { m.setIcon(L.divIcon({ className: 'bw', html: html, iconSize: [18, 18], iconAnchor: [9, 9] })); m._cls = cls; } }
        var tr = S.telemetry.filter(function (t) { return t.dev === d.id; }).slice(-25).map(function (t) { return [t.lat, t.lng]; });
        if (tr.length > 1) { if (!M.tr[d.id]) M.tr[d.id] = L.polyline(tr, { color: '#2e8b3f', weight: 4, opacity: .65 }).addTo(M.map); else M.tr[d.id].setLatLngs(tr); }
      });
      Object.keys(M.mk).forEach(function (k) { if (!seen[k]) { M.map.removeLayer(M.mk[k]); delete M.mk[k]; if (M.tr[k]) { M.map.removeLayer(M.tr[k]); delete M.tr[k]; } } });
      if (!M.fit && bounds.length) { M.map.fitBounds(L.latLngBounds(bounds).pad(.35), { maxZoom: 12 }); M.fit = true; }
      if (o.sel && o.sel !== M.sel && M.mk[o.sel]) { M.sel = o.sel; M.map.flyTo(M.mk[o.sel].getLatLng(), Math.max(M.map.getZoom(), 15), { animate: true, duration: .45 }); }
    },
    mapCanvas: function (cv, units, o) {
      o = o || {}; var dpr = w.devicePixelRatio || 1, W = cv.clientWidth || 800, H = cv.clientHeight || 480;
      cv.width = W * dpr; cv.height = H * dpr; var g = cv.getContext('2d'); g.scale(dpr, dpr);
      var cs = getComputedStyle(document.body), c = function (n) { return cs.getPropertyValue(n).trim(); };
      var X = function (lng) { return (lng - 27.75) / .8 * W; }, Y = function (lat) { return (lat + 25.55) / -.9 * H; };
      g.fillStyle = c('--bg2'); g.fillRect(0, 0, W, H); g.strokeStyle = c('--line'); g.lineWidth = 1; g.font = '10px monospace';
      for (var lo = 27.8; lo < 28.55; lo += .1) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), H); g.stroke(); g.fillStyle = c('--muted'); g.fillText(lo.toFixed(1) + '\u00b0E', X(lo) + 3, H - 4); }
      for (var la = -25.6; la > -26.45; la -= .1) { g.beginPath(); g.moveTo(0, Y(la)); g.lineTo(W, Y(la)); g.stroke(); g.fillStyle = c('--muted'); g.fillText(la.toFixed(1) + '\u00b0', 3, Y(la) - 3); }
      [[0, 6], [6, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 3], [2, 5]].forEach(function (q) { var a = CITIES[q[0]], b = CITIES[q[1]]; g.lineCap = 'round'; g.strokeStyle = c('--line2'); g.lineWidth = 8; g.beginPath(); g.moveTo(X(a[2]), Y(a[1])); g.lineTo(X(b[2]), Y(b[1])); g.stroke(); g.strokeStyle = c('--panel'); g.lineWidth = 5; g.stroke(); });
      CITIES.forEach(function (t) { g.fillStyle = c('--brand'); g.beginPath(); g.arc(X(t[2]), Y(t[1]), 4, 0, 7); g.fill(); g.fillStyle = c('--muted'); g.font = '11px sans-serif'; g.fillText(t[0], X(t[2]) + 7, Y(t[1]) + 4); });
      var col = { moving: c('--green'), idle: c('--amber'), offline: c('--red') }, pts = [];
      units.forEach(function (d) {
        if (d.lat == null) return;
        var tr = S.telemetry.filter(function (t) { return t.dev === d.id; }).slice(-25);
        if (tr.length > 1) { g.strokeStyle = c('--accent'); g.globalAlpha = .55; g.lineWidth = 2; g.beginPath(); tr.forEach(function (t, i) { i ? g.lineTo(X(t.lng), Y(t.lat)) : g.moveTo(X(t.lng), Y(t.lat)); }); g.stroke(); g.globalAlpha = 1; }
        var x = X(d.lng), y = Y(d.lat), sel = d.id === o.sel;
        if (sel) { g.strokeStyle = c('--accent'); g.lineWidth = 2; g.beginPath(); g.arc(x, y, 14, 0, 7); g.stroke(); }
        g.fillStyle = d.immob ? c('--red') : col[d.status] || c('--grey'); g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill();
        g.fillStyle = c('--text'); g.font = '600 11px sans-serif'; g.fillText(d.plate, x + 11, y - 9); pts.push([x, y, d.id]);
      });
      cv.onclick = function (e) { var r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, best = null, bd = 18; pts.forEach(function (p) { var dd = Math.hypot(p[0] - mx, p[1] - my); if (dd < bd) { bd = dd; best = p[2]; } }); if (best && o.onSel) o.onSel(best); };
    },
    bars: function (cv, lab, val, fmt) {
      fmt = fmt || function (x) { return x; }; var dpr = w.devicePixelRatio || 1, W = cv.clientWidth || 500, H = cv.clientHeight || 240;
      cv.width = W * dpr; cv.height = H * dpr; var g = cv.getContext('2d'); g.scale(dpr, dpr);
      var cs = getComputedStyle(document.body), c = function (n) { return cs.getPropertyValue(n).trim(); }, max = Math.max.apply(null, val.concat([1])), bw = W / lab.length;
      g.textAlign = 'center'; lab.forEach(function (l, i) {
        var h = (H - 54) * val[i] / max; g.fillStyle = c('--accent'); g.fillRect(i * bw + bw * .2, H - 24 - h, bw * .6, h);
        g.fillStyle = c('--text'); g.font = '12px sans-serif'; g.fillText(fmt(val[i]), i * bw + bw / 2, H - 29 - h);
        g.fillStyle = c('--muted'); g.fillText(l.length > 16 ? l.slice(0, 15) + '\u2026' : l, i * bw + bw / 2, H - 6);
      });
    }
  };

  /* ---------- Portal shell ---------- */
  var NAV_ICON = { 'Dashboard':'⌂', 'Vehicles':'▣', 'Live Map':'⌖', 'Trip History':'↻', 'Alerts':'!', 'Billing':'R', 'Settings':'⚙', 'Master Dashboard':'⌂', 'Customers':'♙', 'Trackers':'◉', 'Dispatch Map':'⌖', 'Command Logs':'☷', 'Support Tickets':'?', 'Analytics':'▥', 'Install Jobs':'▣', 'Job Map':'⌖', 'Stock':'▤' };
  var NAV = {
    client: [['index.html', 'Dashboard'], ['vehicles.html', 'Vehicles'], ['map.html', 'Live Map'], ['trip-history.html', 'Trip History'], ['alerts.html', 'Alerts'], ['billing.html', 'Billing'], ['settings.html', 'Settings']],
    admin: [['index.html', 'Master Dashboard'], ['customers.html', 'Customers'], ['trackers.html', 'Trackers'], ['dispatch-map.html', 'Dispatch Map'], ['logs.html', 'Command Logs'], ['support-tickets.html', 'Support Tickets'], ['analytics.html', 'Analytics']],
    partner: [['index.html', 'Dashboard'], ['jobs.html', 'Install Jobs'], ['map.html', 'Job Map'], ['inventory.html', 'Stock']]
  };
  var STAFF = { admin: ['Control Centre', 'Authorised Bamu staff only. All sessions are audited and expire after 30 minutes of inactivity.', 'Staff email'], partner: ['Partner Portal', 'For certified Bamu fitment partners. Sessions expire after 30 minutes of inactivity.', 'Partner email'] };
  var TAG = { client: 'Client Portal', admin: 'Control Centre', partner: 'Partner Portal' };
  var IMG = '../assets/img/';
  function staffLogin(app, r) {
    var t = STAFF[r];
    app.innerHTML = '<div class="login-wrap"><form class="login-card" id="alf"><img class="mark big" src="' + IMG + 'logo-mark.png" alt="Bamu Tracker"><h1>' + t[0] + '</h1><p class="muted">' + t[1] + '</p><label>' + t[2] + '<input name="e" type="email" required autocomplete="username"></label><label>Password<input name="p" type="password" required autocomplete="current-password"></label><p class="err" id="er"></p><button class="btn block">Sign in securely</button></form></div>';
    document.getElementById('alf').onsubmit = function (e) { e.preventDefault(); var f = e.target, x = B.login(r, f.e.value, f.p.value); if (x.err) { document.getElementById('er').textContent = x.err; return; } location.reload(); };
  }
  B.page = function (p, file, title, render) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.className = p + ((file === 'map.html' || file === 'dispatch-map.html') ? ' map-page' : ''); var app = document.getElementById('app'), u = B.user(p);
      if (!u) { if (p !== 'client' && file === 'index.html') return staffLogin(app, p); location.replace(p === 'client' ? '../public-website/login.html' : 'index.html'); return; }
      app.innerHTML = '<aside class="side"><div class="brand"><img class="mark" src="' + IMG + 'logo-mark.png" alt=""><div><b>Bamu Tracker</b><small>' + TAG[p] + '</small></div></div><nav>' +
        NAV[p].map(function (n) { return '<a href="' + n[0] + '" class="' + (n[0] === file ? 'on' : '') + '"' + (n[0] === file ? ' aria-current="page"' : '') + '><span class="nav-icon" aria-hidden="true">' + (NAV_ICON[n[1]] || '•') + '</span><span class="nav-label">' + n[1] + '</span><span class="pill" data-pill="' + n[0] + '"></span></a>'; }).join('') +
        '</nav></aside><div class="main"><header class="top"><h1>' + title + '</h1><div class="who"><span class="live"><i></i>Live</span><span>' + esc(u.name) + '</span><button class="btn ghost sm" id="out">Sign out</button></div></header><main id="view"></main></div>';
      document.getElementById('out').onclick = function () { B.logout(p); location.href = p === 'client' ? '../public-website/login.html' : 'index.html'; };
      var v = document.getElementById('view');
      var count = { client: function (cu) { return B.alertsFor(cu).filter(function (x) { return !x.read; }).length; }, admin: function () { return S.tickets.filter(function (t) { return t.status === 'open'; }).length; }, partner: function () { return S.jobs.filter(function (j) { return j.status === 'scheduled'; }).length; } };
      var tgt = { client: 'alerts.html', admin: 'support-tickets.html', partner: 'jobs.html' };
      var draw = function () {
        var a = document.activeElement; if (a && v.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
        var cu = B.user(p); if (!cu) { location.reload(); return; } render(v, cu);
        var pill = app.querySelector('[data-pill="' + tgt[p] + '"]'); if (pill) pill.textContent = count[p](cu) || '';
      };
      subs.push(draw); draw();
    });
  };

  /* ---------- Public website shell ---------- */
  var PUB = [['index.html', 'Home'], ['personal-tracking.html', 'Personal'], ['fleet-management.html', 'Fleet'], ['pricing.html', 'Pricing'], ['fitment-centres.html', 'Fitment Centres'], ['about.html', 'About'], ['contact.html', 'Contact']];
  B.pub = function () {
    var f = location.pathname.split('/').pop() || 'index.html', link = function (n) { return '<a href="' + n[0] + '" class="' + (n[0] === f ? 'on' : '') + '">' + n[1] + '</a>'; };
    document.getElementById('site-nav').innerHTML = '<div class="topbar"><div class="wrap row between"><span>24/7 Control room: +27 10 555 0100</span><span><a href="contact.html">Become a fitment partner</a> &nbsp;·&nbsp; <a href="../partner-portal/index.html">Partner login</a> &nbsp;·&nbsp; <a href="../admin-portal/index.html">Admin login</a> &nbsp;·&nbsp; <a href="login.html">Client login</a></span></div></div><div class="wrap navbar"><a class="brand" href="index.html"><img class="mark" src="' + IMG + 'logo-mark.png" alt=""><b>Bamu Tracker</b></a><nav>' + PUB.map(link).join('') + '</nav><a class="btn sm" href="login.html">Client Login</a></div>';
    document.querySelectorAll('[data-scene]').forEach(function (e) { if (w.Bamu3D) w.Bamu3D.mount(e, { type: e.dataset.scene, dark: e.hasAttribute('data-dark') }); });
    B.fx();
    document.getElementById('site-foot').innerHTML = '<div class="wrap"><div class="cols"><div><h4>Bamu Tracker</h4><p>Vehicle tracking, recovery and fleet intelligence for South Africa.</p></div><div><h4>Solutions</h4><a href="personal-tracking.html">Personal tracking</a><a href="fleet-management.html">Fleet management</a><a href="pricing.html">Pricing</a></div><div><h4>Company</h4><a href="about.html">About</a><a href="fitment-centres.html">Fitment centres</a><a href="contact.html">Contact</a></div><div><h4>24/7 Control Room</h4><p>+27 10 555 0100<br>support@bamu.co.za</p></div></div><p>\u00a9 2026 Bamu Tracker (Pty) Ltd. Demonstration platform.</p></div>';
  };
  B.fx = function () {
    if (!w.IntersectionObserver) return;
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12 });
    document.querySelectorAll('.card,.sec h2,.sec .lead,.split>div,.quote,.tw').forEach(function (e) { e.classList.add('rv'); io.observe(e); });
    var co = new IntersectionObserver(function (en) { en.forEach(function (x) {
      if (!x.isIntersecting) return; co.unobserve(x.target); var m = /^(\D*)([\d.]+)(.*)$/.exec(x.target.textContent); if (!m) return;
      var end = parseFloat(m[2]), t0 = performance.now(), dec = (m[2].split('.')[1] || '').length;
      (function step(n) { var k = Math.min(1, (n - t0) / 1400), v = end * (1 - Math.pow(1 - k, 3)); x.target.textContent = m[1] + v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + m[3]; if (k < 1) requestAnimationFrame(step); })(t0);
    }); }, { threshold: .5 });
    document.querySelectorAll('.strip b').forEach(function (e) { co.observe(e); });
  };
  w.Bamu = B;
})(window);
