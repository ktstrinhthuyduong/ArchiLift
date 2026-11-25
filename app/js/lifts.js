/* ArchiLift – tab "Kích thước thang theo hãng": tra kích thước hố thang, pit, OH, cabin theo dữ liệu hãng
   (AL.LIFT_LIB + dữ liệu người dùng nạp), vẽ mặt bằng hố thang và mặt cắt qua pit/OH bằng SVG. */
(function (global) {
  'use strict';
  const AL = global.AL;

  const CATS = {
    pax: { label: 'Thang chở khách', door: 'CO', Q: 1000 },
    trash: { label: 'Thang chở rác', door: '2S', Q: 1000 },
    service: { label: 'Thang văn phòng / dịch vụ', door: 'CO', Q: 1000 },
    fire: { label: 'Thang chữa cháy', door: '2S', Q: 1000 },
  };
  const DOORS = { CO: 'Mở giữa (CO)', '2S': 'Mở một bên (2S)' };
  // Công cụ thiết kế online của hãng (mở ở thẻ mới; ArchiLift không lấy số tự động)
  const TOOLS = {
    KONE: { label: 'KONE Studio', url: 'https://www.kone.vn/en/tools-downloads/' },
    Schindler: { label: 'Schindler Plan', url: 'https://schindlerplan.com/' },
    Mitsubishi: { label: 'LEHY Civil Engineering', url: '', hint: 'Mitsubishi Shanghai: quét mã QR "LEHY Civil Engineering" ở trang cuối catalog LEHY (ứng dụng trên điện thoại).' },
  };

  function uid() { return Math.random().toString(36).slice(2, 9); }

  /* Kho dữ liệu = dữ liệu có sẵn + dữ liệu người dùng nạp (lưu trong hồ sơ dự án). */
  function library(S) {
    const lib = {};
    Object.keys(AL.LIFT_LIB).forEach(function (b) { lib[b] = AL.LIFT_LIB[b].map(function (m) { return Object.assign({ builtin: true }, m); }); });
    (S.liftLib || []).forEach(function (m) { (lib[m.brand] = lib[m.brand] || []).push(m); });
    return lib;
  }
  function normRows(m) {
    return m.rows.map(function (r) {
      return { door: r[0], Q: r[1], persons: r[2], vmax: r[3], BB: r[4], DD: r[5], LL: r[6], WW: r[7], WD: r[8],
        PH: r[9] || null, OH: r[10] || null, MR: r[11] || null, maxTR: r[12] || null, maxStops: r[13] || null,
        CH: r[14] || null, HH: r[15] || null, note: r[16] || '',
        // vị trí đối trọng nhìn từ sảnh vào hố: B sau, L trái, R phải, S bên (chưa rõ trái/phải); số lối vào cabin
        cwt: r[17] || null, ent: r[18] || 1 };
    });
  }

  AL.LiftTab = {
    CATS: CATS,
    defaults: function () {
      return Object.keys(CATS).map(function (k) {
        return { id: uid(), cat: k, name: CATS[k].label, brand: 'KONE', model: 0, Q: CATS[k].Q, v: 1.6, door: CATS[k].door, opt: -1,
          stops: 0, travel: 0, CH: 0, wall: 200, cwt: '', ent: 0, balu: false, stretcher: k === 'fire', qty: 1 };
      });
    },

    /* Chọn cấu hình phù hợp và tính kết quả cho một thang. */
    solve: function (S, L) {
      const lib = library(S), models = lib[L.brand] || [];
      const m = models[L.model] || models[0];
      const res = { model: m, opts: [], row: null, checks: [], warn: [] };
      if (!m) { res.warn.push('Chưa có dữ liệu của hãng ' + L.brand + '. Nạp dữ liệu từ planning guide ở mục "Kho dữ liệu hãng" bên dưới.'); return res; }
      const rows = normRows(m);
      if (!rows.length && (m.loadsBySpeed || m.limits)) {
        // dòng máy chỉ có thông số cơ bản / giới hạn (chưa có kích thước): vẫn kiểm tra tải trọng / hành trình / số dừng
        const lim = m.limits;
        res.speeds = lim ? AL.SPEEDS.filter(function (v) { return v <= lim.vmax + 1e-9; }) : m.speeds.slice();
        res.loads = lim ? AL.LOADS.filter(function (q) { return q <= lim.qmax; }) : (m.loadsBySpeed[String(+L.v)] || []);
        res.doors = ['CO', '2S'];
        if (m.noDims) res.warn.push(m.noDims);
        if (res.loads.indexOf(+L.Q) < 0) res.warn.push('Tải trọng ' + L.Q + ' kg không có ở vận tốc ' + L.v + ' m/s của ' + m.model + '.');
        if (lim) {
          const src = m.model + ' — cần xác minh trên KONE Studio';
          res.checks.push({ label: 'Tải trọng ≤ giới hạn dòng máy', val: L.Q + ' kg', target: '≤ ' + lim.qmax + ' kg', ok: +L.Q <= lim.qmax, src: src });
          res.checks.push({ label: 'Vận tốc ≤ giới hạn dòng máy', val: L.v + ' m/s', target: '≤ ' + lim.vmax + ' m/s', ok: +L.v <= lim.vmax + 1e-9, src: src });
          if (+L.travel > 0) res.checks.push({ label: 'Hành trình ≤ giới hạn của dòng máy', val: +L.travel + ' m', target: '≤ ' + lim.trmax + ' m', ok: +L.travel <= lim.trmax, src: src });
          if (+L.qty > 0) res.checks.push({ label: 'Số thang trong nhóm ≤ giới hạn', val: L.qty, target: '≤ ' + lim.group, ok: +L.qty <= lim.group, src: src });
        }
        const du = (m.duty || []).filter(function (d) { return Math.abs(d[0] - +L.v) < 1e-9; })[0];
        if (du && +L.travel > 0) res.checks.push({ label: 'Hành trình ≤ giới hạn của dòng máy', val: +L.travel + ' m', target: '≤ ' + du[2] + ' m', ok: +L.travel <= du[2], src: m.model });
        if (du && +L.stops > 0) res.checks.push({ label: 'Số điểm dừng ≤ giới hạn', val: L.stops, target: '≤ ' + du[3], ok: +L.stops <= du[3], src: m.model });
        if (L.cat === 'fire' && +L.travel > 0) res.checks.push(fireCheck(L, 'QCVN 06:2022/BXD + SĐ1:2023, TCVN 6396-72 — cần xác minh điều khoản'));
        return res;
      }
      res.loads = Array.from(new Set(rows.map(function (r) { return r.Q; }))).sort(function (a, b) { return a - b; });
      res.speeds = (m.speeds || Array.from(new Set(rows.map(function (r) { return r.vmax; })))).slice().sort(function (a, b) { return a - b; });
      res.doors = Array.from(new Set(rows.map(function (r) { return r.door; })));
      res.opts = rows.filter(function (r) { return r.door === L.door && r.Q === +L.Q && (m.exactSpeed ? Math.abs(r.vmax - +L.v) < 1e-9 : r.vmax >= +L.v - 1e-9); });
      if (L.cat === 'fire' && L.stretcher) {
        const ok = res.opts.filter(function (r) { return r.BB >= 1100 && r.DD >= 2100; });
        if (ok.length) res.opts = ok;
      }
      res.opts.sort(function (a, b) { return a.WW * a.WD - b.WW * b.WD || a.LL - b.LL; });
      if (!res.opts.length) { res.warn.push('Không có cấu hình ' + L.Q + ' kg, cửa ' + (DOORS[L.door] || L.door) + ', vận tốc ' + L.v + ' m/s trong tài liệu ' + m.model + '.'); return res; }
      const r = res.row = res.opts[Math.max(0, Math.min(res.opts.length - 1, +L.opt >= 0 ? +L.opt : 0))];
      const vk = String(+L.v);
      res.CH = +L.CH || r.CH || 0;
      res.cwt = L.cwt || r.cwt || '';
      res.cwtSrc = L.cwt ? 'chọn tay' : (r.cwt ? 'theo dữ liệu hãng' : '');
      res.ent = +L.ent || r.ent || 1;
      if (res.ent === 2 && res.cwt === 'B') res.warn.push('Cabin 2 lối vào (xuyên) thì đối trọng không đặt phía sau được — chọn đối trọng bên trái/phải.');
      if (+L.ent && r.ent && +L.ent !== r.ent) res.warn.push('Số lối vào chọn tay (' + L.ent + ') khác cấu hình của hãng (' + r.ent + ') — kích thước hố theo tài liệu có thể không còn đúng, cần hãng xác nhận.');
      res.PH = r.PH || (m.pit ? m.pit[vk] : null);
      res.OH = r.OH || (m.shAdd && res.CH > 0 ? res.CH + m.shAdd[vk] + (L.balu ? 400 : 0) : null);
      res.ohFormula = !r.OH && m.shAdd ? 'SH = CH + ' + m.shAdd[vk] + (L.balu ? ' + 400 (lan can nóc cabin 1100)' : '') : '';
      // giới hạn hành trình / số điểm dừng
      let duty = null;
      if (m.duty) duty = m.duty.filter(function (d) { return Math.abs(d[0] - +L.v) < 1e-9 && +L.Q <= d[1]; }).sort(function (a, b) { return a[1] - b[1]; })[0];
      const maxTR = r.maxTR || (duty && duty[2]), maxSt = r.maxStops || (duty && duty[3]);
      if (maxTR && +L.travel > 0) res.checks.push({ label: 'Hành trình ≤ giới hạn của dòng máy', val: +L.travel + ' m', target: '≤ ' + maxTR + ' m', ok: +L.travel <= maxTR, src: m.model });
      if (maxSt && +L.stops > 0) res.checks.push({ label: 'Số điểm dừng ≤ giới hạn', val: L.stops, target: '≤ ' + maxSt, ok: +L.stops <= maxSt, src: m.model });
      if (!maxTR) res.warn.push('Tài liệu chưa cho giới hạn hành trình/số điểm dừng cho cấu hình này — hỏi hãng.');
      if (L.cat === 'fire') {
        const needD = L.stretcher ? 2100 : 1400, needQ = L.stretcher ? 1000 : 630;
        const src = 'QCVN 06:2022/BXD + SĐ1:2023, TCVN 6396-72 — cần xác minh điều khoản';
        res.checks.push({ label: 'Thang chữa cháy: rộng cabin ≥ 1100 mm', val: r.BB, target: '≥ 1100', ok: r.BB >= 1100, src: src });
        res.checks.push({ label: 'Thang chữa cháy: sâu cabin ≥ ' + needD + ' mm' + (L.stretcher ? ' (có cáng/giường)' : ''), val: r.DD, target: '≥ ' + needD, ok: r.DD >= needD, src: src });
        res.checks.push({ label: 'Thang chữa cháy: tải trọng ≥ ' + needQ + ' kg', val: L.Q, target: '≥ ' + needQ, ok: +L.Q >= needQ, src: src });
        if (+L.travel > 0) res.checks.push(fireCheck(L, src));
      }
      return res;
    },

  };

  /* Thang chữa cháy: thời gian chạy hết hành trình (kể cả tăng/giảm tốc, profile S) ≤ 60 s,
     tính từ lúc cửa đã đóng. Trước đây dùng v ≥ H/60 — bỏ qua tăng/giảm tốc nên dễ dãi hơn thực tế. */
  function fireCheck(L, src) {
    const t = AL.fireRunTime(L.travel, L.v, L.a, L.j);
    return { label: 'Thang chữa cháy: thời gian chạy hết hành trình H = ' + (+L.travel) + ' m ≤ 60 s (tính cả tăng/giảm tốc, từ lúc cửa đã đóng; a = ' + (+L.a > 0 ? +L.a : 1.0) + ' m/s², jerk ' + (+L.j > 0 ? +L.j : 1.5) + ' m/s³)',
      val: t.toFixed(1) + ' s (v = ' + L.v + ' m/s)', target: '≤ 60 s', ok: t <= 60, src: src };
  }

  AL.LiftTab.library = library;
  AL.LiftTab.DOORS = DOORS;
  AL.LiftTab.TOOLS = TOOLS;
})(window);
