/* ArchiLift – bộ tính: động học cabin, RTT cao điểm lên, chọn thang tự động.
   Phương pháp: CIBSE Guide D / Barney (Elevator Traffic Handbook), dạng tổng quát
   theo cao độ thực (tầng cao không đều, nhiều ga vào gồm tầng hầm, vùng tốc hành). */
(function (global) {
  'use strict';
  const AL = (global.AL = global.AL || {});

  AL.LOADS = [450, 630, 800, 1000, 1050, 1150, 1275, 1350, 1600, 1800, 2000, 2500];
  AL.SPEEDS = [1.0, 1.5, 1.6, 1.75, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0, 7.0];

  /* Thời gian chạy (flight time) quãng d (m) với profile S: vận tốc v, gia tốc a, jerk j. */
  AL.flightTime = function (d, v, a, j) {
    if (!(d > 0)) return 0;
    if ((a * a) / j > v) a = Math.sqrt(v * j); // không đạt a trước khi đạt v
    const dFull = (v * v) / a + (v * a) / j;
    if (d >= dFull) return d / v + v / a + a / j;
    const dAcc = (2 * a * a * a) / (j * j);
    if (d >= dAcc) {
      const k = (a * a) / j;
      const vp = (-k + Math.sqrt(k * k + 4 * a * d)) / 2;
      return 2 * (vp / a + a / j);
    }
    return 4 * Math.cbrt(d / (2 * j));
  };

  /* Số người theo tải trọng: EN 81-20 / ISO 8100-1, Q/75 làm tròn xuống. */
  AL.capacityFromLoad = function (Q) {
    return Math.floor((+Q || 0) / 75 + 1e-9);
  };

  /* Cao độ các tầng (m) so với tầng cốt ±0.000. floors lưu từ dưới lên. */
  AL.computeElevations = function (state) {
    let z = 0;
    const out = state.floors.map(function (f) {
      const r = Object.assign({}, f, { zAbs: z });
      z += +f.h || 0;
      return r;
    });
    const d = out.find(function (f) { return f.id === state.datumId; }) || out[0];
    const z0 = d ? d.zAbs : 0;
    out.forEach(function (f) { f.z = Math.round((f.zAbs - z0) * 1000) / 1000; });
    return out;
  };

  /* Dữ liệu đầu vào của một nhóm thang. */
  AL.buildGroupInput = function (state, g) {
    const floors = AL.computeElevations(state);
    const served = [];
    const warnings = [];
    floors.forEach(function (f) {
      const cell = (g.cells && g.cells[f.id]) || {};
      if (!cell.s) return;
      served.push({
        id: f.id, name: f.name, z: f.z, func: f.func,
        pop: (+f.pop || 0) * (+cell.sh || 0) / 100,
        ent: +f.ent || 0,
      });
    });
    served.sort(function (a, b) { return a.z - b.z; });
    const entr = served.filter(function (f) { return f.ent > 0; });
    const entSum = entr.reduce(function (s, f) { return s + f.ent; }, 0);
    entr.forEach(function (f) { f.p = f.ent / entSum; });
    const upper = served.filter(function (f) { return !(f.ent > 0) && f.pop > 0; });
    const pop = upper.reduce(function (s, f) { return s + f.pop; }, 0);
    upper.forEach(function (f) { f.p = f.pop / pop; });
    served.forEach(function (f) {
      if (f.ent > 0 && f.pop > 0) warnings.push('Tầng ' + f.name + ' vừa là ga vào vừa có dân số: dân số tầng này không tính vào chuyến đi cao điểm lên.');
    });
    if (entr.length && upper.length) {
      const maxE = entr[entr.length - 1].z, minU = upper[0].z;
      if (maxE > minU) warnings.push('Có ga vào cao hơn tầng có dân số thấp nhất — công thức RTT giả định ga vào nằm dưới vùng phục vụ.');
    }
    let df = 0;
    if (upper.length >= 2) df = (upper[upper.length - 1].z - upper[0].z) / (upper.length - 1);
    else if (upper.length === 1 && entr.length) df = Math.abs(upper[0].z - entr[entr.length - 1].z);
    return { served: served, entr: entr, upper: upper, pop: pop, df: df, warnings: warnings };
  };

  /* Thời gian một vòng chạy RTT với số khách trung bình P mỗi chuyến (cao điểm lên). */
  AL.roundTrip = function (gi, g, P) {
    const v = +g.v, a = +g.a, j = +g.j;
    let SU = 0, F = 0, Htop = 0;
    gi.upper.forEach(function (f, i) {
      SU += 1 - Math.pow(1 - f.p, P);
      const F0 = F;
      F = i === gi.upper.length - 1 ? 1 : F + f.p;
      Htop += f.z * (Math.pow(F, P) - Math.pow(F0, P));
    });
    let SE = 0, Q = 0, Lbot = 0;
    for (let k = gi.entr.length - 1; k >= 0; k--) {
      const e = gi.entr[k];
      SE += 1 - Math.pow(1 - e.p, P);
      const Q0 = Q;
      Q = k === 0 ? 1 : Q + e.p;
      Lbot += e.z * (Math.pow(Q, P) - Math.pow(Q0, P));
    }
    const D = Htop - Lbot;
    const df = gi.df;
    const tfd = AL.flightTime(df, v, a, j);
    const ts = tfd - df / v + (+g.to) + (+g.tc) + (+g.tsd);
    const tRun = (2 * D) / v;
    const tStops = (SU + SE) * ts;
    const tPax = 2 * P * (+g.tp);
    return {
      P: P, SU: SU, SE: SE, Htop: Htop, Lbot: Lbot, D: D, df: df, tfd: tfd, ts: ts,
      tRun: tRun, tStops: tStops, tPax: tPax, rtt: tRun + tStops + tPax,
    };
  };

  /* Thời gian chờ trung bình cao điểm lên (Barney): AWT = [0.4 + (1.8·P/CC − 0.77)²]·INT, áp dụng 0.5 ≤ P/CC ≤ 0.8 */
  AL.awtUp = function (lf, int) {
    const x = Math.max(lf, 0.5);
    return (0.4 + Math.pow(1.8 * x - 0.77, 2)) * int;
  };

  function metrics(gi, g, r, L, CC) {
    const int = r.rtt / L;
    const hc5 = (300 * r.P * L) / r.rtt;
    const lf = r.P / CC;
    const v = +g.v;
    const att = (0.5 * r.D) / v + 0.5 * r.SU * r.ts + r.P * (+g.tp);
    const awt = AL.awtUp(lf, int);
    return Object.assign({}, r, {
      int: int, hc5: hc5, hc5pct: gi.pop > 0 ? (hc5 / gi.pop) * 100 : 0,
      lf: lf, awt: awt, att: att, ajt: awt + att,
    });
  }

  /* Đánh giá đầy đủ một nhóm: năng lực (tải tính toán lf%) + điểm làm việc theo nhu cầu + tiêu chí. */
  AL.evaluate = function (gi, g) {
    const CC = AL.capacityFromLoad(g.Q);
    const L = Math.max(1, Math.round(+g.L || 1));
    const lf = (+g.lf || 80) / 100;
    const res = { CC: CC, L: L, pop: gi.pop, errors: [], warnings: gi.warnings.slice(), checks: [] };
    if (!gi.upper.length) res.errors.push('Nhóm chưa phục vụ tầng nào có dân số (kiểm tra ma trận phục vụ / phân bổ dân số).');
    if (!gi.entr.length) res.errors.push('Nhóm chưa phục vụ ga vào nào (tầng có "Ga vào %" > 0).');
    if (CC < 1) res.errors.push('Tải trọng quá nhỏ.');
    if (!(+g.v > 0 && +g.a > 0 && +g.j > 0)) res.errors.push('Vận tốc, gia tốc, jerk phải > 0.');
    if (res.errors.length) { res.pass = false; return res; }

    res.cap = metrics(gi, g, AL.roundTrip(gi, g, lf * CC), L, CC);
    res.travel = gi.upper[gi.upper.length - 1].z - gi.entr[0].z;
    res.tExpress = AL.flightTime(res.travel, +g.v, +g.a, +g.j);

    const lam5 = ((+g.demand || 0) / 100) * gi.pop;
    if (lam5 > 0) {
      const lam = lam5 / 300;
      const f = function (P) { return (lam * AL.roundTrip(gi, g, P).rtt) / L - P; };
      if (f(CC) > 0) {
        res.dem = { overload: true, lam5: lam5 };
      } else {
        let lo = 1e-6, hi = CC;
        for (let i = 0; i < 60; i++) {
          const m = (lo + hi) / 2;
          if (f(m) > 0) lo = m; else hi = m;
        }
        res.dem = Object.assign(metrics(gi, g, AL.roundTrip(gi, g, hi), L, CC), { overload: false, lam5: lam5 });
      }
    }

    const c = g.crit || {};
    if (+c.hc5 > 0) res.checks.push({ key: 'hc5', label: 'Năng lực vận chuyển HC5', unit: '% dân số', val: res.cap.hc5pct, target: +c.hc5, op: '≥', ok: res.cap.hc5pct >= +c.hc5 });
    if (+c.int > 0) res.checks.push({ key: 'int', label: 'Khoảng cách giữa các chuyến INT', unit: 's', val: res.cap.int, target: +c.int, op: '≤', ok: res.cap.int <= +c.int });
    if (res.dem) {
      res.checks.push({ key: 'lf', label: 'Hệ số tải tại nhu cầu', unit: '%', val: res.dem.overload ? Infinity : res.dem.lf * 100, target: 80, op: '≤', ok: !res.dem.overload && res.dem.lf <= 0.8 });
      if (+c.awt > 0) res.checks.push({ key: 'awt', label: 'Thời gian chờ TB tại nhu cầu AWT', unit: 's', val: res.dem.overload ? Infinity : res.dem.awt, target: +c.awt, op: '≤', ok: !res.dem.overload && res.dem.awt <= +c.awt });
    }
    res.pass = res.checks.every(function (k) { return k.ok; });
    return res;
  };

  /* Chọn thang tự động: duyệt số cabin × tải trọng × vận tốc, giữ phương án đạt mọi tiêu chí. */
  AL.size = function (gi, g, opt) {
    opt = opt || {};
    const loads = opt.loads || AL.LOADS, speeds = opt.speeds || AL.SPEEDS, maxL = opt.maxL || 12;
    const ok = [];
    for (let L = 1; L <= maxL; L++) {
      loads.forEach(function (Q) {
        speeds.forEach(function (v) {
          const g2 = Object.assign({}, g, { L: L, Q: Q, v: v });
          const e = AL.evaluate(gi, g2);
          if (e.errors.length || !e.pass) return;
          if (opt.tMax > 0 && e.tExpress > opt.tMax) return;
          ok.push({ L: L, Q: Q, v: v, CC: e.CC, hc5pct: e.cap.hc5pct, int: e.cap.int, rtt: e.cap.rtt,
            awtDem: e.dem && !e.dem.overload ? e.dem.awt : null, lfDem: e.dem && !e.dem.overload ? e.dem.lf : null,
            tExpress: e.tExpress });
        });
      });
    }
    ok.sort(function (a, b) { return a.L - b.L || a.Q - b.Q || a.v - b.v; });
    // phương án gọn nhất cho từng số cabin
    const perL = {};
    ok.forEach(function (r) { if (!perL[r.L]) perL[r.L] = r; });
    return { all: ok, perL: Object.keys(perL).map(function (k) { return perL[k]; }) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
