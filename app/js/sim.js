/* ArchiLift – mô phỏng vận hành nhóm thang theo bước thời gian (0,1 s).
   Mỗi hành khách ảo có tầng đi, tầng đến, thời điểm gọi; cabin chạy theo điều khiển
   tập hợp hai chiều (directional collective), lệnh gọi tầng phân cho cabin có thời gian
   đến dự kiến nhỏ nhất. Đơn giản hoá: cabin chỉ chọn điểm dừng kế tiếp khi khởi hành. */
(function (global) {
  'use strict';
  const AL = global.AL;

  AL.PROFILES = {
    up: { label: 'Cao điểm lên (Up-peak)', inc: 100, out: 0, inter: 0, homing: true },
    down: { label: 'Cao điểm xuống (Down-peak)', inc: 0, out: 100, inter: 0, homing: false },
    lunch: { label: 'Hai chiều – giờ trưa (Two-way)', inc: 45, out: 45, inter: 10, homing: false },
    mixed: { label: 'Hỗn hợp (tự nhập tỷ lệ)', inc: 40, out: 40, inter: 20, homing: false },
  };

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cumul(ps) { let s = 0; return ps.map(function (p) { s += p; return s; }); }
  function pick(cum, r) {
    for (let i = 0; i < cum.length; i++) if (r < cum[i]) return i;
    return cum.length - 1;
  }
  function pct(sorted, q) {
    if (!sorted.length) return 0;
    const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
    return sorted[i];
  }

  AL.simulate = function (gi, g, cfg) {
    const v = +g.v, acc = +g.a, jk = +g.j, to = +g.to, tc = +g.tc, tsd = +g.tsd, tp = +g.tp;
    const CC = AL.capacityFromLoad(g.Q), L = Math.max(1, Math.round(+g.L));
    const fl = gi.served, n = fl.length, z = fl.map(function (f) { return f.z; });
    const upIdx = gi.upper.map(function (f) { return fl.indexOf(f); });
    const entIdx = gi.entr.map(function (f) { return fl.indexOf(f); });
    const upCum = cumul(gi.upper.map(function (f) { return f.p; }));
    const entCum = cumul(gi.entr.map(function (f) { return f.p; }));
    const TF = [];
    for (let i = 0; i < n; i++) { TF.push([]); for (let k = 0; k < n; k++) TF[i].push(AL.flightTime(Math.abs(z[i] - z[k]), v, acc, jk)); }
    const tsEst = AL.flightTime(gi.df, v, acc, jk) - gi.df / v + to + tc + tsd;

    const R = mulberry32(cfg.seed || 1);
    const warm = +cfg.warm || 0, dur = +cfg.dur || 1800, Tgen = warm + dur;
    const lam = ((+cfg.rate || 0) / 100) * gi.pop / 300;
    const pin = (+cfg.inc || 0) / 100, pout = (+cfg.out || 0) / 100;
    const pax = [];
    let t = 0;
    if (lam > 0) {
      for (;;) {
        t += -Math.log(1 - R()) / lam;
        if (t > Tgen) break;
        const r = R();
        let o, d;
        if (r < pin) { o = entIdx[pick(entCum, R())]; d = upIdx[pick(upCum, R())]; }
        else if (r < pin + pout) { o = upIdx[pick(upCum, R())]; d = entIdx[pick(entCum, R())]; }
        else {
          if (upIdx.length < 2) continue;
          o = upIdx[pick(upCum, R())];
          let tries = 0;
          do { d = upIdx[pick(upCum, R())]; } while (d === o && ++tries < 50);
        }
        if (o === d) continue;
        pax.push({ t: t, o: o, d: d, tb: -1, ta: -1 });
      }
    }

    const qUp = [], qDn = [];
    for (let i = 0; i < n; i++) { qUp.push([]); qDn.push([]); }
    const asgUp = new Int16Array(n).fill(-1), asgDn = new Int16Array(n).fill(-1);
    let home = entIdx[0];
    gi.entr.forEach(function (e, k) { if (e.p > gi.entr[entIdx.indexOf(home)].p) home = entIdx[k]; });
    const homing = !!cfg.homing;
    const cars = [];
    for (let c = 0; c < L; c++) {
      const f0 = homing ? home : Math.round((c * (n - 1)) / Math.max(1, L - 1));
      cars.push({ id: c, f: f0, st: 0, dir: 0, timer: 0, tgt: -1, load: [], calls: new Int32Array(n), stops: 0 });
    }
    const pending = [];
    const trace = cfg.trace || null; // mảng ghi sự kiện để kiểm tra (tuỳ chọn)
    let delivered = 0;
    t = 0;

    function isTarget(c, k) { return c.calls[k] > 0 || asgUp[k] === c.id || asgDn[k] === c.id; }
    function anyDir(c, f, dir) {
      for (let k = f + dir; k >= 0 && k < n; k += dir) if (isTarget(c, k)) return true;
      return false;
    }
    function scan(c, f, dir) {
      if (dir > 0) {
        for (let k = f + 1; k < n; k++) if (c.calls[k] > 0 || asgUp[k] === c.id) return k;
        for (let k = n - 1; k > f; k--) if (asgDn[k] === c.id) return k;
      } else {
        for (let k = f - 1; k >= 0; k--) if (c.calls[k] > 0 || asgDn[k] === c.id) return k;
        for (let k = 0; k < f; k++) if (asgUp[k] === c.id) return k;
      }
      return -1;
    }
    function nextTarget(c) {
      const f = c.f;
      if (c.dir === 0) {
        let best = -1, bd = Infinity;
        for (let k = 0; k < n; k++) if (k !== f && isTarget(c, k)) { const dd = Math.abs(z[k] - z[f]); if (dd < bd) { bd = dd; best = k; } }
        return best;
      }
      let k = scan(c, f, c.dir);
      if (k >= 0) return k;
      return scan(c, f, -c.dir);
    }
    function chooseDir(c) {
      const f = c.f, upHere = qUp[f].length > 0, dnHere = qDn[f].length > 0;
      const above = anyDir(c, f, 1), below = anyDir(c, f, -1);
      if (c.dir > 0) { if (above || upHere) return 1; if (dnHere || below) return -1; return 0; }
      if (c.dir < 0) { if (below || dnHere) return -1; if (upHere || above) return 1; return 0; }
      if (upHere) return 1; if (dnHere) return -1; if (above) return 1; if (below) return -1; return 0;
    }
    function board(c) {
      if (c.dir === 0) return 0;
      const q = c.dir > 0 ? qUp[c.f] : qDn[c.f], A = c.dir > 0 ? asgUp : asgDn;
      let k = 0;
      while (q.length && c.load.length < CC) {
        const p = q.shift();
        p.tb = t; c.load.push(p); c.calls[p.d]++; k++;
      }
      A[c.f] = -1;
      if (q.length) pending.push([c.f, c.dir]);
      return k;
    }
    function arrive(c) {
      const f = c.f;
      let nOut = 0;
      if (c.calls[f] > 0) {
        const keep = [];
        c.load.forEach(function (p) { if (p.d === f) { p.ta = t; nOut++; delivered++; } else keep.push(p); });
        c.load = keep; c.calls[f] = 0;
      }
      c.dir = chooseDir(c);
      const nIn = board(c);
      if (trace) trace.push(['arr', +t.toFixed(1), c.id, f, nOut, nIn, c.load.length, c.dir]);
      if (nOut + nIn === 0) { c.st = 0; return; }
      c.st = 2; c.stops++;
      c.timer = to + tc + tp * (nOut + nIn);
    }
    function estimate(c, f, d) {
      const pos = c.st === 1 ? c.tgt : c.f;
      let cost = c.st ? Math.max(0, c.timer) : 0;
      const dir = c.dir;
      if (dir === 0) cost += Math.abs(z[pos] - z[f]) / v;
      else {
        let stops = 0;
        if ((f - pos) * dir >= 0 && d === dir) {
          for (let k = pos + dir; k !== f && k >= 0 && k < n; k += dir) if (isTarget(c, k)) stops++;
          cost += Math.abs(z[f] - z[pos]) / v + stops * tsEst;
        } else {
          let ext = pos;
          for (let k = pos + dir; k >= 0 && k < n; k += dir) if (isTarget(c, k)) { ext = k; stops++; }
          if ((f - ext) * dir > 0) ext = f;
          cost += (Math.abs(z[ext] - z[pos]) + Math.abs(z[ext] - z[f])) / v + stops * tsEst;
        }
      }
      cost += c.load.length >= CC ? 60 : (c.load.length / CC) * 5;
      return cost;
    }
    function registerCall(f, d) {
      const A = d > 0 ? asgUp : asgDn;
      if (A[f] !== -1) return;
      let best = 0, bc = Infinity;
      cars.forEach(function (c) { const e = estimate(c, f, d); if (e < bc) { bc = e; best = c.id; } });
      A[f] = best;
    }
    function newPax(p) {
      const d = p.d > p.o ? 1 : -1;
      for (let i = 0; i < L; i++) {
        const c = cars[i];
        if (c.st === 2 && c.f === p.o && c.dir === d && c.load.length < CC && c.timer > tc) {
          p.tb = t; c.load.push(p); c.calls[p.d]++; c.timer += tp; return;
        }
      }
      (d > 0 ? qUp : qDn)[p.o].push(p);
      registerCall(p.o, d);
    }
    function depart(c) {
      const f = c.f;
      if (c.load.length < CC) {
        const d0 = chooseDir(c); // chỉ mở cửa lại nếu có khách tại tầng đúng chiều sẽ đi
        if (d0 !== 0 && (d0 > 0 ? qUp[f] : qDn[f]).length) { arrive(c); return; }
      }
      let k = nextTarget(c);
      if (k < 0) {
        c.dir = 0;
        if (homing && f !== home && c.load.length === 0) k = home;
        else { c.st = 0; return; }
      }
      c.dir = z[k] > z[f] ? 1 : -1;
      c.tgt = k; c.st = 1; c.timer = TF[f][k] + tsd;
      if (trace) trace.push(['dep', +t.toFixed(1), c.id, f, k, +c.timer.toFixed(1)]);
    }

    const dt = 0.1, Tmax = Tgen + 3600;
    const samples = [];
    let ip = 0, nextSample = 0, step = 0;
    for (;;) {
      t = step * dt;
      while (ip < pax.length && pax[ip].t <= t) newPax(pax[ip++]);
      for (let i = 0; i < L; i++) {
        const c = cars[i];
        if (c.st === 1) { c.timer -= dt; if (c.timer <= 0) { c.f = c.tgt; c.tgt = -1; arrive(c); } }
        else if (c.st === 2) { c.timer -= dt; if (c.timer <= 0) depart(c); }
        else depart(c);
      }
      while (pending.length) {
        const pr = pending.shift();
        if ((pr[1] > 0 ? qUp : qDn)[pr[0]].length) registerCall(pr[0], pr[1]);
      }
      if (t >= nextSample) {
        let w = 0;
        for (let i = 0; i < n; i++) w += qUp[i].length + qDn[i].length;
        samples.push({ t: t, wait: w });
        nextSample += 10;
      }
      if (t >= Tgen && delivered >= pax.length) break;
      if (t >= Tmax) break;
      step++;
    }
    const tEnd = t;

    const meas = pax.filter(function (p) { return p.t >= warm; });
    const done = meas.filter(function (p) { return p.ta >= 0; });
    const wt = meas.map(function (p) { return (p.tb >= 0 ? p.tb : tEnd) - p.t; }).sort(function (a, b) { return a - b; });
    const tt = done.map(function (p) { return p.ta - p.tb; });
    const jt = done.map(function (p) { return p.ta - p.t; }).sort(function (a, b) { return a - b; });
    const avg = function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; };
    // năng lực thực: số khách được trả trong từng cửa sổ 5 phút trong giai đoạn đo
    const wins = Math.max(1, Math.floor(dur / 300));
    const hc = new Array(wins).fill(0);
    done.forEach(function (p) { const w = Math.floor((p.ta - warm) / 300); if (w >= 0 && w < wins) hc[w]++; });
    const perFloor = fl.map(function (f, i) {
      const ps = meas.filter(function (p) { return p.o === i; });
      return { name: f.name, n: ps.length, awt: avg(ps.map(function (p) { return (p.tb >= 0 ? p.tb : tEnd) - p.t; })) };
    });
    const totalStops = cars.reduce(function (s, c) { return s + c.stops; }, 0);
    return {
      n: meas.length, served: done.length, unserved: meas.length - done.length,
      demand5: (meas.length / dur) * 300,
      awt: avg(wt), wt50: pct(wt, 0.5), wt90: pct(wt, 0.9), wt95: pct(wt, 0.95), wtMax: wt.length ? wt[wt.length - 1] : 0,
      lw60: wt.length ? (wt.filter(function (x) { return x > 60; }).length / wt.length) * 100 : 0,
      att: avg(tt), ajt: avg(jt), jt95: pct(jt, 0.95),
      hc5: avg(hc), hc5max: Math.max.apply(null, hc),
      hc5pct: gi.pop > 0 ? (avg(hc) / gi.pop) * 100 : 0,
      overrun: Math.max(0, tEnd - Tgen), stopsPerCarHour: totalStops / L / (tEnd / 3600),
      wt: wt, samples: samples, perFloor: perFloor,
      pax: trace ? pax : undefined, cars: trace ? cars : undefined,
      asg: trace ? { up: Array.from(asgUp), dn: Array.from(asgDn) } : undefined,
    };
  };

  /* Chạy nhiều lần với hạt giống khác nhau, lấy trung bình. */
  AL.simulateRuns = function (gi, g, cfg, runs) {
    const res = [];
    for (let r = 0; r < runs; r++) res.push(AL.simulate(gi, g, Object.assign({}, cfg, { seed: (+cfg.seed || 1) + r * 7919 })));
    const keys = ['n', 'served', 'unserved', 'demand5', 'awt', 'wt50', 'wt90', 'wt95', 'wtMax', 'lw60', 'att', 'ajt', 'jt95', 'hc5', 'hc5max', 'hc5pct', 'overrun', 'stopsPerCarHour'];
    const mean = {}, min = {}, max = {};
    keys.forEach(function (k) {
      const xs = res.map(function (x) { return x[k]; });
      mean[k] = xs.reduce(function (s, x) { return s + x; }, 0) / xs.length;
      min[k] = Math.min.apply(null, xs); max[k] = Math.max.apply(null, xs);
    });
    const wtAll = [].concat.apply([], res.map(function (x) { return x.wt; }));
    const len = Math.min.apply(null, res.map(function (x) { return x.samples.length; }));
    const samples = [];
    for (let i = 0; i < len; i++) samples.push({ t: res[0].samples[i].t, wait: res.reduce(function (s, x) { return s + x.samples[i].wait; }, 0) / res.length });
    const perFloor = res[0].perFloor.map(function (pf, i) {
      return { name: pf.name, n: res.reduce(function (s, x) { return s + x.perFloor[i].n; }, 0) / runs, awt: res.reduce(function (s, x) { return s + x.perFloor[i].awt; }, 0) / runs };
    });
    return { runs: runs, mean: mean, min: min, max: max, wt: wtAll, samples: samples, perFloor: perFloor };
  };
})(typeof window !== 'undefined' ? window : globalThis);
