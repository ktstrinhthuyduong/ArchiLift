/* ArchiLift – mô phỏng vận hành nhóm thang theo bước thời gian (0,1 s).
   Mỗi hành khách ảo có tầng đi, tầng đến, thời điểm gọi; cabin chạy theo điều khiển
   tập hợp hai chiều (directional collective), lệnh gọi tầng phân cho cabin có thời gian
   đến dự kiến nhỏ nhất. cfg.midRoute (mặc định bật): cabin đang chạy được đổi điểm dừng
   sang tầng có lệnh gọi cùng chiều nằm giữa đường nếu còn kịp hãm theo profile S.
   cfg.ctrl = 'dcs': điều khiển gọi tầng đích (DCS) — khách nhập tầng đến tại sảnh tầng, được phân ngay
   một cabin cố định theo chi phí: thời gian chờ ước tính + số điểm dừng mới (tầng đi, tầng đến) nhân với
   số khách bị ảnh hưởng (đang trong cabin + đã được phân cho cabin), có ràng buộc sức chở.
   cfg.cap: sức chở khi mô phỏng (% số người định mức, mặc định 100; báo cáo Kone dùng ~80%). */
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
    const capPct = +cfg.cap > 0 ? Math.min(100, +cfg.cap) : 100;
    const CC = Math.max(1, Math.floor(AL.capacityFromLoad(g.Q) * capPct / 100 + 1e-9)), L = Math.max(1, Math.round(+g.L));
    const dcs = cfg.ctrl === 'dcs';
    const DCS_W = cfg.dcsW != null ? +cfg.dcsW : 1;   // trọng số phạt điểm dừng mới theo số khách bị ảnh hưởng
    const fl = gi.served, n = fl.length, z = fl.map(function (f) { return f.z; });
    const upIdx = gi.upper.map(function (f) { return fl.indexOf(f); });
    const entIdx = gi.entr.map(function (f) { return fl.indexOf(f); });
    const upCum = cumul(gi.upper.map(function (f) { return f.p; }));
    const entCum = cumul(gi.entr.map(function (f) { return f.p; }));
    const TF = [];
    for (let i = 0; i < n; i++) { TF.push([]); for (let k = 0; k < n; k++) TF[i].push(AL.flightTime(Math.abs(z[i] - z[k]), v, acc, jk)); }
    const tsEst = AL.flightTime(gi.df, v, acc, jk) - gi.df / v + to + tc + tsd;
    // Thời điểm (tính từ lúc cabin bắt đầu chuyển động) mà chuyến quãng d bắt đầu khác chuyến dài hơn:
    // trước thời điểm này cabin vẫn có thể dừng ở cách d mà không cần hãm gấp (cùng a, j, v).
    const aEff = (acc * acc) / jk > v ? Math.sqrt(v * jk) : acc;
    function devTime(d) {
      if (!(d > 0)) return 0;
      if (d >= (v * v) / aEff + (v * aEff) / jk) return d / v;                    // đạt v: lúc bắt đầu hãm
      if (d >= (2 * aEff * aEff * aEff) / (jk * jk)) {                              // đạt a, không đạt v
        const k = (aEff * aEff) / jk;
        return (-k + Math.sqrt(k * k + 4 * aEff * d)) / 2 / aEff;                    // vp / a: lúc giảm gia tốc
      }
      return Math.cbrt(d / (2 * jk));                                               // không đạt a: T/4
    }
    const DEV = TF.map(function (row, i) { return row.map(function (_, k) { return devTime(Math.abs(z[i] - z[k])); }); });
    const midRoute = cfg.midRoute !== false;

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
      const car = { id: c, f: f0, st: 0, dir: 0, timer: 0, tgt: -1, tTrip: 0, load: [], calls: new Int32Array(n), stops: 0, isStops: 0 };
      if (dcs) {   // khách đã được phân cho cabin, đang chờ tại từng tầng theo chiều; số khách chờ theo tầng đến
        car.pkU = []; car.pkD = []; car.dst = new Int32Array(n); car.nAsg = 0;
        for (let i = 0; i < n; i++) { car.pkU.push([]); car.pkD.push([]); }
      }
      cars.push(car);
    }
    const pending = [], pendingPax = [];
    const trace = cfg.trace || null; // mảng ghi sự kiện để kiểm tra (tuỳ chọn)
    let delivered = 0;
    t = 0;

    function upCall(c, k) { return dcs ? c.pkU[k].length > 0 : asgUp[k] === c.id; }
    function dnCall(c, k) { return dcs ? c.pkD[k].length > 0 : asgDn[k] === c.id; }
    function isTarget(c, k) { return c.calls[k] > 0 || upCall(c, k) || dnCall(c, k); }
    function waitQ(c, f, d) { return dcs ? (d > 0 ? c.pkU[f] : c.pkD[f]) : (d > 0 ? qUp[f] : qDn[f]); }
    function anyDir(c, f, dir) {
      for (let k = f + dir; k >= 0 && k < n; k += dir) if (isTarget(c, k)) return true;
      return false;
    }
    function scan(c, f, dir) {
      if (dir > 0) {
        for (let k = f + 1; k < n; k++) if (c.calls[k] > 0 || upCall(c, k)) return k;
        for (let k = n - 1; k > f; k--) if (dnCall(c, k)) return k;
      } else {
        for (let k = f - 1; k >= 0; k--) if (c.calls[k] > 0 || dnCall(c, k)) return k;
        for (let k = 0; k < f; k++) if (upCall(c, k)) return k;
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
      const f = c.f, upHere = waitQ(c, f, 1).length > 0, dnHere = waitQ(c, f, -1).length > 0;
      const above = anyDir(c, f, 1), below = anyDir(c, f, -1);
      if (c.dir > 0) { if (above || upHere) return 1; if (dnHere || below) return -1; return 0; }
      if (c.dir < 0) { if (below || dnHere) return -1; if (upHere || above) return 1; return 0; }
      if (upHere) return 1; if (dnHere) return -1; if (above) return 1; if (below) return -1; return 0;
    }
    function board(c, reopen) {
      if (c.dir === 0) return 0;
      const q = waitQ(c, c.f, c.dir);
      let k = 0;
      while (q.length && c.load.length < CC) {
        const p = q.shift();
        if (dcs) { c.dst[p.d]--; c.nAsg--; }
        p.tb = t; p.sb = c.isStops - (reopen ? 1 : 0); c.load.push(p); c.calls[p.d]++; k++;
      }
      if (dcs) {   // cabin đầy: khách còn lại được phân lại cho cabin khác
        while (q.length) { const p = q.shift(); c.dst[p.d]--; c.nAsg--; pendingPax.push(p); }
        return k;
      }
      (c.dir > 0 ? asgUp : asgDn)[c.f] = -1;
      if (q.length) pending.push([c.f, c.dir]);
      return k;
    }
    function arrive(c, reopen) {
      const f = c.f;
      let nOut = 0;
      if (c.calls[f] > 0) {
        const keep = [];
        c.load.forEach(function (p) { if (p.d === f) { p.ta = t; p.is = c.isStops - p.sb; nOut++; delivered++; } else keep.push(p); });
        c.load = keep; c.calls[f] = 0;
      }
      c.dir = chooseDir(c);
      const nIn = board(c, reopen);
      if (trace) trace.push(['arr', +t.toFixed(1), c.id, f, nOut, nIn, c.load.length, c.dir]);
      if (nOut + nIn === 0) { c.st = 0; return; }
      c.st = 2; c.stops++;
      if (!reopen) c.isStops++;   // mở cửa lại tại cùng tầng không tính là một lần dừng mới
      c.timer = to + tc + tp * (nOut + nIn);
    }
    // cabin đang chạy (st = 1) còn kịp dừng ở tầng k nằm giữa tầng xuất phát và tầng đích không
    function canStopAt(c, k) {
      if (!midRoute || c.st !== 1 || c.dir === 0) return false;
      if ((k - c.f) * c.dir <= 0 || (c.tgt - k) * c.dir <= 0) return false;
      const el = c.tTrip - c.timer;                // thời gian đã trôi kể cả trễ khởi hành
      return Math.max(0, el - tsd) <= DEV[c.f][k];
    }
    function estimate(c, f, d) {
      if (d === c.dir && canStopAt(c, f)) {
        return (TF[c.f][f] + tsd) - (c.tTrip - c.timer) + (c.load.length >= CC ? 60 : (c.load.length / CC) * 5);
      }
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
      const c = cars[best];
      if (d === c.dir && c.load.length < CC && canStopAt(c, f)) {   // đổi điểm dừng kế tiếp sang tầng gọi
        const el = c.tTrip - c.timer;
        c.tgt = f; c.tTrip = TF[c.f][f] + tsd; c.timer = c.tTrip - el;
        if (trace) trace.push(['mid', +t.toFixed(1), c.id, c.f, f, +c.timer.toFixed(1)]);
      }
    }
    /* DCS: phân khách cho một cabin cố định. Chi phí = thời gian chờ ước tính
       + (số điểm dừng mới) × thời gian một lần dừng × (1 + DCS_W × số khách bị ảnh hưởng). */
    function assignDcs(p) {
      const o = p.o, d = p.d > p.o ? 1 : -1;
      let best = null, bc = Infinity;
      for (let i = 0; i < L; i++) {
        const c = cars[i];
        const atDoor = c.st === 2 && c.f === o && c.dir === d && c.timer > tc;
        const q = d > 0 ? c.pkU[o] : c.pkD[o];
        const ahead = c.dir === d && (o - c.f) * d >= 0;          // cabin đang đi cùng chiều, chưa qua tầng gọi
        const loadAt = (atDoor || ahead) ? c.load.length : 0;
        let cost = atDoor ? 0 : estimate(c, o, d);
        if (loadAt + q.length >= CC) cost += 1000;               // không còn chỗ
        const newO = (atDoor || isTarget(c, o)) ? 0 : 1;
        const newD = (c.calls[p.d] > 0 || c.dst[p.d] > 0) ? 0 : 1;
        cost += (newO + newD) * tsEst * (1 + DCS_W * (c.load.length + c.nAsg));
        if (cost < bc) { bc = cost; best = c; }
      }
      const c = best;
      if (c.st === 2 && c.f === o && c.dir === d && c.load.length < CC && c.timer > tc) {   // cabin đang mở cửa: vào luôn
        p.tb = t; p.sb = c.isStops - 1; c.load.push(p); c.calls[p.d]++; c.timer += tp; return;
      }
      (d > 0 ? c.pkU[o] : c.pkD[o]).push(p); c.dst[p.d]++; c.nAsg++;
      if (d === c.dir && c.load.length < CC && canStopAt(c, o)) {   // đổi điểm dừng kế tiếp sang tầng gọi
        const el = c.tTrip - c.timer;
        c.tgt = o; c.tTrip = TF[c.f][o] + tsd; c.timer = c.tTrip - el;
      }
    }
    function newPax(p) {
      if (dcs) { assignDcs(p); return; }
      const d = p.d > p.o ? 1 : -1;
      for (let i = 0; i < L; i++) {
        const c = cars[i];
        if (c.st === 2 && c.f === p.o && c.dir === d && c.load.length < CC && c.timer > tc) {
          p.tb = t; p.sb = c.isStops - 1; c.load.push(p); c.calls[p.d]++; c.timer += tp; return;
        }
      }
      (d > 0 ? qUp : qDn)[p.o].push(p);
      registerCall(p.o, d);
    }
    function depart(c) {
      const f = c.f;
      if (c.load.length < CC) {
        const d0 = chooseDir(c); // chỉ mở cửa lại nếu có khách tại tầng đúng chiều sẽ đi
        if (d0 !== 0 && waitQ(c, f, d0).length) { arrive(c, true); return; }
      }
      let k = nextTarget(c);
      if (k < 0) {
        c.dir = 0;
        if (homing && f !== home && c.load.length === 0) k = home;
        else { c.st = 0; return; }
      }
      c.dir = z[k] > z[f] ? 1 : -1;
      c.tgt = k; c.st = 1; c.timer = c.tTrip = TF[f][k] + tsd;
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
      while (pendingPax.length) assignDcs(pendingPax.shift());
      if (t >= nextSample) {
        let w = 0;
        if (dcs) cars.forEach(function (c) { w += c.nAsg; });
        else for (let i = 0; i < n; i++) w += qUp[i].length + qDn[i].length;
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
    const isv = done.map(function (p) { return Math.max(0, p.is - 1); });   // số lần dừng giữa tầng lên và tầng đích
    const avg = function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; };
    // năng lực thực P5: số khách được trả trong từng cửa sổ 5 phút của giai đoạn đo — tính mọi khách được
    // vận chuyển trong khoảng đó (kể cả khách gọi thang lúc khởi động), như P5 = 5n/T của ISO 8100-32
    const wins = Math.max(1, Math.floor(dur / 300));
    const hc = new Array(wins).fill(0);
    pax.forEach(function (p) { if (p.ta < 0) return; const w = Math.floor((p.ta - warm) / 300); if (w >= 0 && w < wins) hc[w]++; });
    // xu hướng hàng chờ: số người chờ trung bình ở 1/4 đầu và 1/4 cuối giai đoạn đo
    const sm = samples.filter(function (x) { return x.t >= warm && x.t <= Tgen; }), nq = sm.length;
    const qAvg = function (a) { return a.length ? a.reduce(function (s, x) { return s + x.wait; }, 0) / a.length : 0; };
    const qFirst = qAvg(sm.slice(0, Math.floor(nq / 4))), qLast = qAvg(sm.slice(Math.floor((3 * nq) / 4)));
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
      lw90: wt.length ? (wt.filter(function (x) { return x > 90; }).length / wt.length) * 100 : 0,
      is: avg(isv),
      att: avg(tt), ajt: avg(jt), jt95: pct(jt, 0.95),
      hc5: avg(hc), hc5max: Math.max.apply(null, hc),
      hc5pct: gi.pop > 0 ? (avg(hc) / gi.pop) * 100 : 0,
      qFirst: qFirst, qLast: qLast,
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
    const keys = ['n', 'served', 'unserved', 'demand5', 'awt', 'wt50', 'wt90', 'wt95', 'wtMax', 'lw60', 'lw90', 'is', 'att', 'ajt', 'jt95', 'hc5', 'hc5max', 'hc5pct', 'qFirst', 'qLast', 'overrun', 'stopsPerCarHour'];
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
    const each = res.map(function (x) { const o = {}; keys.forEach(function (k) { o[k] = x[k]; }); return o; });
    return { runs: runs, mean: mean, min: min, max: max, each: each, wt: wtAll, samples: samples, perFloor: perFloor };
  };
})(typeof window !== 'undefined' ? window : globalThis);
