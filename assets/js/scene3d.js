/* Bamu3D - real-time 3D vehicle scenes (three.js r128). Vehicles are built from geometry:
   extruded body profiles, clear-coat paint, tinted glass, wheels with rims, emissive lamps,
   studio reflections, soft shadows, pins and scanning rings. Drag to rotate. */
(function (w) {
  'use strict';
  var cache = {}, PAL = [0x1f6b3a, 0xf2f4f2, 0x2b3138, 0xb9c2c9, 0x0b4f6c, 0x8b1e2d], ST = { moving: 0x22d38a, idle: 0xffb020, offline: 0xff4d5e };

  function env(R) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.48, '#d6ecdc'); gr.addColorStop(.52, '#7c9a86'); gr.addColorStop(1, '#1c2b22'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(60, 28, 130, 30); g.fillRect(310, 18, 170, 24); g.fillRect(200, 70, 90, 12);
    var t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.encoding = THREE.sRGBEncoding;
    var p = new THREE.PMREMGenerator(R), e = p.fromEquirectangular(t).texture; p.dispose(); return e;
  }
  var std = function (c, m, r) { return new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r }); };
  var paint = function (c) { return new THREE.MeshPhysicalMaterial({ color: c, metalness: .6, roughness: .3, clearcoat: 1, clearcoatRoughness: .06 }); };
  var glow = function (c, i) { return new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i || 1.2 }); };
  function mesh(g, m, x, y, z) { var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; return o; }

  function wheel(side) {
    var g = new THREE.Group(), tire = std(0x0d0f11, .1, .85), rim = std(0xd8dde0, .95, .2);
    var t = mesh(new THREE.CylinderGeometry(.4, .4, .3, 40), tire), r = mesh(new THREE.CylinderGeometry(.28, .28, .32, 32), rim);
    t.rotation.x = r.rotation.x = Math.PI / 2; g.add(t, r);
    for (var i = 0; i < 5; i++) { var sp = mesh(new THREE.BoxGeometry(.5, .05, .02), std(0x8a9399, .9, .3), 0, 0, side * .17); sp.rotation.z = i * Math.PI / 5; g.add(sp); }
    g.add(mesh(new THREE.CylinderGeometry(.07, .07, .34, 16), std(0x1a1d20, .5, .4)).rotateX(Math.PI / 2));
    return g;
  }
  function car(col) {
    var g = new THREE.Group(), P = paint(col), gl = new THREE.MeshPhysicalMaterial({ color: 0x0a1820, metalness: .9, roughness: .04, transparent: true, opacity: .9 }), dk = std(0x0e1216, .2, .7);
    var s = new THREE.Shape(); s.moveTo(-2.15, .38); s.lineTo(-2.15, .82); s.quadraticCurveTo(-2.1, .98, -1.8, 1); s.lineTo(-.95, 1.03); s.lineTo(1, 1.03); s.quadraticCurveTo(1.6, 1, 1.95, .92); s.quadraticCurveTo(2.2, .85, 2.2, .6); s.lineTo(2.2, .38);
    s.lineTo(1.85, .38); s.absarc(1.35, .38, .5, 0, Math.PI, false); s.lineTo(-.85, .38); s.absarc(-1.35, .38, .5, 0, Math.PI, false); s.lineTo(-2.15, .38);
    var bg = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: true, bevelSize: .07, bevelThickness: .1, bevelSegments: 4, curveSegments: 32 }); bg.translate(0, 0, -.9); g.add(mesh(bg, P));
    var c = new THREE.Shape(); c.moveTo(-1.2, 1); c.lineTo(-.72, 1.43); c.lineTo(.5, 1.43); c.lineTo(1.22, 1); c.closePath();
    var cg = new THREE.ExtrudeGeometry(c, { depth: 1.5, bevelEnabled: true, bevelSize: .05, bevelThickness: .06, bevelSegments: 3 }); cg.translate(0, 0, -.75); g.add(mesh(cg, gl));
    g.add(mesh(new THREE.BoxGeometry(1.14, .07, 1.56), P, -.11, 1.47, 0));
    g.add(mesh(new THREE.BoxGeometry(3.9, .2, 1.6), dk, 0, .3, 0));
    g.add(mesh(new THREE.BoxGeometry(.05, .14, .8), dk, 2.2, .55, 0));
    [-1, 1].forEach(function (z) {
      g.add(mesh(new THREE.BoxGeometry(.06, .11, .42), glow(0xffffff, 1.6), 2.21, .76, z * .56));
      g.add(mesh(new THREE.BoxGeometry(.06, .09, .5), glow(0xff2a2a, 1.4), -2.17, .8, z * .58));
      g.add(mesh(new THREE.BoxGeometry(.18, .1, .12), P, .6, 1.02, z * 1.06));
      [1.35, -1.35].forEach(function (x) { var wh = wheel(z); wh.position.set(x, .4, z * .86); g.add(wh); });
    });
    return g;
  }
  function truck(col) {
    var g = new THREE.Group(), P = paint(col), gl = new THREE.MeshPhysicalMaterial({ color: 0x0a1820, metalness: .9, roughness: .04, transparent: true, opacity: .9 }), dk = std(0x0e1216, .2, .7);
    var cs = new THREE.Shape(); cs.moveTo(.95, .45); cs.lineTo(.95, 2.05); cs.lineTo(1.55, 2.05); cs.lineTo(2.1, 1.3); cs.lineTo(2.15, .45); cs.closePath();
    var cg = new THREE.ExtrudeGeometry(cs, { depth: 1.8, bevelEnabled: true, bevelSize: .06, bevelThickness: .08, bevelSegments: 3 }); cg.translate(0, 0, -.9); g.add(mesh(cg, P));
    var ws = mesh(new THREE.BoxGeometry(.04, .82, 1.72), gl, 1.84, 1.68, 0); ws.rotation.z = .63; g.add(ws);
    g.add(mesh(new THREE.BoxGeometry(.55, .5, 2.04), gl, 1.2, 1.72, 0));
    g.add(mesh(new THREE.BoxGeometry(3.2, 1.9, 2), std(0xf4f6f4, .1, .5), -.7, 1.45, 0));
    g.add(mesh(new THREE.BoxGeometry(3.0, .26, 2.03), std(0x2e8b3f, .3, .4), -.7, 1.2, 0));
    g.add(mesh(new THREE.BoxGeometry(4.5, .2, 1.5), dk, -.2, .5, 0));
    [-1, 1].forEach(function (z) {
      g.add(mesh(new THREE.BoxGeometry(.06, .12, .4), glow(0xffffff, 1.6), 2.16, .85, z * .6));
      g.add(mesh(new THREE.BoxGeometry(.06, .12, .4), glow(0xff2a2a, 1.4), -2.32, .75, z * .7));
      [1.55, -1.1, -1.9].forEach(function (x) { var wh = wheel(z); wh.position.set(x, .4, z * .86); g.add(wh); });
    });
    return g;
  }
  function pin(c) {
    var g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .7, roughness: .3 });
    var s = new THREE.Mesh(new THREE.SphereGeometry(.28, 24, 24), m), k = new THREE.Mesh(new THREE.ConeGeometry(.28, .6, 24), m); k.rotation.x = Math.PI; k.position.y = -.42;
    g.add(s, k, new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }))); return g;
  }
  function ring(c) {
    var m = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 72), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = .03; return m;
  }
  function podium(r, dark) {
    var g = new THREE.Group(), d = new THREE.Mesh(new THREE.CylinderGeometry(r, r + .2, .14, 96), new THREE.MeshStandardMaterial({ color: dark ? 0x0f3524 : 0xf3f8f2, metalness: .35, roughness: .35 }));
    d.position.y = -.07; d.receiveShadow = true; g.add(d);
    var t = new THREE.Mesh(new THREE.TorusGeometry(r, .03, 8, 128), glow(0x6dbf3f, 1.5)); t.rotation.x = Math.PI / 2; g.add(t); return g;
  }
  function content(o) {
    var G = new THREE.Group(), rings = [], pins = [], T = o.type, R = 4.6;
    function addPin(parent, x, y, z, col) { var p = pin(col); p.position.set(x, y, z); p.userData.y = y; parent.add(p); pins.push(p); }
    function addRing(x, z, col) { var r = ring(col); r.position.x = x; r.position.z = z; G.add(r); rings.push(r); }
    if (T === 'showroom') {
      R = 7; G.add(podium(7, o.dark));
      var a = car(PAL[0]); a.position.set(0, 0, 1.4); var b = truck(PAL[1]); b.scale.setScalar(.85); b.position.set(-3.6, 0, -2.3); b.rotation.y = .5;
      var c = car(PAL[2]); c.scale.setScalar(.92); c.position.set(3.7, 0, -2.1); c.rotation.y = -.5; G.add(a, b, c);
      addPin(G, 0, 2.7, 1.4, 0x6dbf3f); addRing(0, 1.4, 0x6dbf3f);
    } else if (T === 'fleet') {
      var K = o.kinds && o.kinds.length ? o.kinds : [{ k: 'truck' }, { k: 'car' }, { k: 'car' }, { k: 'truck' }, { k: 'car' }], n = K.length;
      R = Math.max(4.2, n * 3.9 / 6.283); G.add(podium(R + 2.3, o.dark));
      var tr = new THREE.Mesh(new THREE.TorusGeometry(R, .015, 6, 128), glow(0x6dbf3f, 1)); tr.rotation.x = Math.PI / 2; tr.position.y = .03; G.add(tr);
      K.forEach(function (v, i) {
        var an = i / n * Math.PI * 2, veh = v.k === 'truck' ? truck(PAL[i % PAL.length]) : car(PAL[i % PAL.length]);
        veh.scale.setScalar(.8); veh.position.set(Math.cos(an) * R, 0, Math.sin(an) * R); veh.rotation.y = -(an + Math.PI / 2);
        addPin(veh, 0, v.k === 'truck' ? 3.4 : 2.7, 0, ST[v.s] || 0x6dbf3f); G.add(veh);
      });
      addRing(0, 0, 0x6dbf3f); rings[0].userData.big = true;
    } else {
      G.add(podium(4.6, o.dark)); G.add(car(o.color || PAL[0]));
      addPin(G, 0, 2.7, 0, 0x6dbf3f); addRing(0, 0, 0x6dbf3f); addRing(0, 0, 0x6dbf3f);
      if (T === 'dome') {
        var d = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 2), new THREE.MeshBasicMaterial({ color: 0x6dbf3f, wireframe: true, transparent: true, opacity: .2 })); d.scale.set(1.15, .7, .8); d.position.y = .4; G.add(d);
        var d2 = new THREE.Mesh(new THREE.IcosahedronGeometry(3.55, 2), new THREE.MeshBasicMaterial({ color: 0x6dbf3f, transparent: true, opacity: .05, side: THREE.BackSide })); d2.scale.set(1.15, .7, .8); d2.position.y = .4; G.add(d2);
      }
    }
    return { G: G, rings: rings, pins: pins, R: R };
  }
  var sig = function (o) { return o.type + JSON.stringify(o.kinds || ''); };

  function mount(el, o) {
    o = o || {}; if (!w.THREE) return false;
    var key = o.key, E = key && cache[key];
    if (E) { E.host.className = el.className; el.replaceWith(E.host); if (E.sig !== sig(o)) E.rebuild(o); E.size(); return true; }
    var host = key ? document.createElement('div') : el, R;
    try { R = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return false; }
    try {
      if (!key) host.innerHTML = ''; else host.className = el.className;
      R.setPixelRatio(Math.min(w.devicePixelRatio || 1, 2)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
      R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.outputEncoding = THREE.sRGBEncoding;
      var sc = new THREE.Scene(); sc.environment = env(R);
      var cam = new THREE.PerspectiveCamera(32, 1, .1, 120);
      sc.add(new THREE.HemisphereLight(0xffffff, 0x88aa90, .5));
      var dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(5, 9, 6); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024);
      var sh = dl.shadow.camera; sh.left = sh.bottom = -9; sh.right = sh.top = 9; sh.near = 1; sh.far = 30; dl.shadow.bias = -.0005; sc.add(dl);
      var gnd = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.ShadowMaterial({ opacity: .25 })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = .001; gnd.receiveShadow = true; sc.add(gnd);
      E = { host: host, rot: 0, sig: sig(o), o: o, c: content(o) }; sc.add(E.c.G);
      host.appendChild(R.domElement); R.domElement.style.cssText = 'width:100%;height:100%;display:block;cursor:grab';
      E.size = function () {
        var W = host.clientWidth || 600, H = host.clientHeight || 480; R.setSize(W, H, false); cam.aspect = W / H;
        var base = E.o.type === 'showroom' ? [0, 4.6, 14.5] : E.o.type === 'fleet' ? [0, E.c.R * .9 + 2, E.c.R * 2.4 + 3.2] : [0, 3.6, 10.2], k = Math.max(1, 1.1 / cam.aspect);
        cam.position.set(base[0], base[1] * k, base[2] * k); cam.lookAt(0, .9, 0); cam.updateProjectionMatrix();
      };
      E.rebuild = function (n) { sc.remove(E.c.G); E.o = n; E.sig = sig(n); E.c = content(n); sc.add(E.c.G); E.size(); };
      E.size();
      if (w.ResizeObserver) new ResizeObserver(E.size).observe(host); else w.addEventListener('resize', E.size);
      var drag = false, lx = 0, vis = true, t0 = performance.now();
      host.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; R.domElement.style.cursor = 'grabbing'; });
      w.addEventListener('pointerup', function () { drag = false; R.domElement.style.cursor = 'grab'; });
      w.addEventListener('pointermove', function (e) { if (drag) { E.rot += (e.clientX - lx) * .01; lx = e.clientX; } });
      host.style.touchAction = 'pan-y';
      if (w.IntersectionObserver) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(host);
      (function tick(now) {
        requestAnimationFrame(tick); if (!vis || document.hidden) return;
        var t = (now - t0) / 1000, c = E.c;
        c.G.rotation.y = (E.o.type === 'showroom' ? -.9 + Math.sin(t * .35) * .38 : (E.o.type === 'fleet' ? 0 : -.9) + t * .28) + E.rot;
        c.pins.forEach(function (p, i) { p.position.y = p.userData.y + Math.sin(t * 2 + i) * .12; p.rotation.y = t; });
        c.rings.forEach(function (r, i) { var k = (t * .5 + i * .45) % 1; r.scale.setScalar(1 + k * (r.userData.big ? c.R : 4.5)); r.material.opacity = (1 - k) * .5; });
        R.render(sc, cam);
      })(t0);
    } catch (e) { console.warn('Bamu3D failed', e); return false; }
    if (key) { cache[key] = E; el.replaceWith(host); }
    return true;
  }
  w.Bamu3D = { mount: mount };
})(window);
