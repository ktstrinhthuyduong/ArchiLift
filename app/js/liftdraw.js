/* ArchiLift – hình vẽ tham số tab 7 (đơn vị SVG = mm), bố cục theo bản vẽ tư vấn KONE KTS cung cấp:
   1) mặt bằng hố thang, 2) mặt cắt hố pit (cabin ở tầng dưới cùng),
   3) mặt cắt OH + phòng máy (thang có phòng máy), 4) mặt cắt OH trên cùng (thang không phòng máy).
   Kích thước ghi theo kiểu "2000 WD"; số nào chưa có dữ liệu ghi "?" và vẽ tượng trưng. */
(function (global) {
  'use strict';
  const AL = global.AL;
  let uidN = 0;
  const INK = '#222', CAR = '#1f6f8b', DOOR = '#b9770e', GREY = '#777';

  /* ---------- phần tử dùng chung ---------- */
  function open(minx, miny, w, h, fs) {
    const id = 'conc' + (++uidN);
    const svg = '<svg viewBox="' + minx + ' ' + miny + ' ' + w + ' ' + h + '" class="lift-svg" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="' + fs + '">' +
      '<defs><pattern id="' + id + '" width="420" height="420" patternUnits="userSpaceOnUse"><rect width="420" height="420" fill="#fff"/>' +
      '<path d="M40 70 l45 -12 l-16 38z M250 120 l38 16 l-38 16z M140 300 l44 0 l-22 -34z M330 330 l32 -28 l10 38z M60 380 l30 -8 l-6 26z" fill="none" stroke="#777" stroke-width="5"/>' +
      '<circle cx="110" cy="170" r="8" fill="#777"/><circle cx="300" cy="40" r="7" fill="#777"/><circle cx="380" cy="200" r="6" fill="#777"/>' +
      '<circle cx="210" cy="230" r="6" fill="#777"/><circle cx="30" cy="250" r="7" fill="#777"/><circle cx="260" cy="400" r="6" fill="#777"/></pattern></defs>';
    return { s: svg, fill: 'url(#' + id + ')' };
  }
  function conc(fill, x, y, w, h) {
    if (w <= 0 || h <= 0) return '';
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="8"/>';
  }
  function rect(x, y, w, h, col, sw, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + (col || INK) + '" stroke-width="' + (sw || 8) + '"' + (extra || '') + '/>';
  }
  function line(x1, y1, x2, y2, col, sw, extra) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (col || INK) + '" stroke-width="' + (sw || 6) + '"' + (extra || '') + '/>';
  }
  function text(x, y, t, fs, opt) {
    opt = opt || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + fs + '"' + (opt.anchor ? ' text-anchor="' + opt.anchor + '"' : '') +
      (opt.rot ? ' transform="rotate(' + opt.rot + ' ' + x + ' ' + y + ')"' : '') + ' fill="' + (opt.col || INK) + '"' + (opt.bold ? ' font-weight="bold"' : '') + '>' + t + '</text>';
  }
  const tick = function (x, y) { return line(x - 45, y + 45, x + 45, y - 45, INK, 9); };
  /* kích thước ngang: đoạn [x1,x2] tại cao độ y, đường dóng từ yRef */
  function dimH(x1, x2, y, label, fs, yRef) {
    let s = line(x1, y, x2, y, INK, 5) + tick(x1, y) + tick(x2, y);
    if (yRef != null) { const d = y < yRef ? -60 : 60; s += line(x1, yRef, x1, y + d, GREY, 4) + line(x2, yRef, x2, y + d, GREY, 4); }
    const w = Math.abs(x2 - x1), tw = String(label).length * fs * 0.52;
    return s + text((x1 + x2) / 2 + (tw > w ? (tw + w) / 2 + 40 : 0), y - fs * 0.3, label, fs, { anchor: 'middle' });
  }
  /* kích thước đứng: đoạn [y1,y2] tại x, đường dóng từ xRef */
  function dimV(y1, y2, x, label, fs, xRef) {
    let s = line(x, y1, x, y2, INK, 5) + tick(x, y1) + tick(x, y2);
    if (xRef != null) { const d = x < xRef ? -60 : 60; s += line(xRef, y1, x + d, y1, GREY, 4) + line(xRef, y2, x + d, y2, GREY, 4); }
    return s + text(x - fs * 0.3, (y1 + y2) / 2, label, fs, { anchor: 'middle', rot: -90 });
  }
  function chainH(xs, labels, y, fs, yRef) { let s = ''; for (let i = 0; i < xs.length - 1; i++) s += dimH(xs[i], xs[i + 1], y, labels[i], fs, yRef); return s; }
  function ffl(x, y, fs, lab) {
    return '<path d="M' + x + ' ' + y + ' l-60 -100 h120 z" fill="none" stroke="' + INK + '" stroke-width="6"/>' + line(x - 140, y, x + 140, y, INK, 5) + text(x + 90, y - 120, lab || 'FFL', fs * 0.8);
  }
  function leader(x1, y1, x2, y2, t, fs) {
    return line(x1, y1, x2, y2, INK, 4) + line(x2, y2, x2 + t.length * fs * 0.5, y2, INK, 4) + text(x2 + 20, y2 - 20, t, fs);
  }
  function breakH(x1, x2, y) {
    const m = (x1 + x2) / 2;
    return '<path d="M' + x1 + ' ' + y + ' H' + (m - 60) + ' l30 -90 l60 180 l30 -90 H' + x2 + '" fill="none" stroke="' + GREY + '" stroke-width="6"/>';
  }
  const q = function (v, sym) { return (v ? v : '?') + ' ' + sym; };

  /* số liệu dùng chung cho các hình */
  function geo(L, res) {
    const r = res.row, t = +L.wall || 200;
    const CH = res.CH || 0, HH = +L.HH || r.HH || 0;
    const ent = res.ent === 2 ? 2 : 1;
    // khe trước cabin (vẽ tượng trưng); 2 lối vào thì cabin đặt giữa chiều sâu hố
    const fg = ent === 2 ? Math.max(0, Math.round((r.WD - r.DD) / 2)) : Math.round(Math.min(200, Math.max(60, (r.WD - r.DD) / 3)));
    return { r: r, t: t, CH: CH, HH: HH, chD: CH || 2200, hhD: HH || Math.min(CH || 2200, 2100), fg: fg, ent: ent,
      cwt: res.cwt || '', cwtSrc: res.cwtSrc || '',
      cy1: r.WD - fg, cy0: Math.max(0, r.WD - fg - r.DD), PH: res.PH || 0, OH: res.OH || 0, mr: res.model.type === 'MR' };
  }

  /* vách sau trên mặt cắt (từ y0 đến y1): 2 lối vào thì chừa lỗ cửa + sàn sảnh phía sau;
     đối trọng phía sau thì vẽ khối ĐT tượng trưng giữa vách sau và cabin */
  function backWall(fill, g, y0, y1, fs) {
    const t = g.t;
    let s = '';
    if (g.ent === 2) {
      s += conc(fill, -t, y0, t, -g.hhD - 80 - y0) + conc(fill, -t, 0, t, y1) + conc(fill, -t - 900, 0, 900, t);
      s += rect(g.cy0 - 40, -g.hhD, 40, g.hhD, DOOR, 6) + rect(-50, -g.hhD, 40, g.hhD, DOOR, 6);
    } else s += conc(fill, -t, y0, t, y1 - y0);
    if (g.cwt === 'B' && g.cy0 >= 120) {
      const cw = Math.min(g.cy0 - 60, 180);
      // vùng chạy của đối trọng (nét đứt) — vị trí khối ĐT thay đổi theo vị trí cabin nên chỉ ghi vùng
      s += rect(g.cy0 / 2 - cw / 2, y0 + t, cw, -y0 - t, GREY, 5, ' stroke-dasharray="60 40"') + text(g.cy0 / 2, y0 + t + fs * 1.2, 'ĐT', fs * 0.7, { anchor: 'middle', col: GREY });
    }
    return s;
  }

  /* ---------- 1. Mặt bằng hố thang (hình 1) ---------- */
  function planSvg(L, res) {
    const g = geo(L, res), r = g.r, t = g.t, WW = r.WW, WD = r.WD;
    const fs = Math.max(75, (WW + 2 * t) / 24);
    const two = g.ent === 2, back0 = two ? 700 : 0;       // 2 lối vào: chừa chỗ sảnh phía sau
    const minx = -t - 900, miny = -t - 700 - back0, w = WW + 2 * t + 1500, h = WD + 2 * t + 2000 + back0 + fs * 1.5;
    const o = open(minx, miny, w, h, fs);
    let s = o.s;
    const dl = (WW - r.LL) / 2, dr = dl + r.LL;          // lỗ cửa tầng
    const cx0 = (WW - r.BB) / 2, cx1 = cx0 + r.BB;      // cabin đặt giữa hố
    // vách hố (vách trước chừa lỗ cửa; 2 lối vào thì vách sau cũng chừa lỗ cửa)
    if (two) s += conc(o.fill, -t, -t, dl + t, t) + conc(o.fill, dr, -t, WW - dr + t, t);
    else s += conc(o.fill, -t, -t, WW + 2 * t, t);
    s += conc(o.fill, -t, 0, t, WD) + conc(o.fill, WW, 0, t, WD);
    s += conc(o.fill, -t, WD, dl + t, t) + conc(o.fill, dr, WD, WW - dr + t, t);
    // sàn sảnh
    s += line(-t - 400, WD + t + 500, WW + t + 400, WD + t + 500, GREY, 4, ' stroke-dasharray="60 40"');
    if (two) s += line(-t - 400, -t - 500, WW + t + 400, -t - 500, GREY, 4, ' stroke-dasharray="60 40"') + text(WW / 2, -t - 560, 'SẢNH LỐI VÀO 2', fs * 0.7, { anchor: 'middle', col: GREY });
    // ray dẫn hướng cabin (tượng trưng) hai bên, giữa chiều sâu cabin
    const ry = g.cy0 + r.DD / 2;
    [cx0 - 70, cx1 + 70].forEach(function (x) { s += rect(x - 30, ry - 60, 60, 120, INK, 6) + line(x - 60, ry, x + 60, ry, INK, 6); });
    // đối trọng: theo dữ liệu hãng / chọn tay (B sau, L trái, R phải, S bên); chưa có thì tự đặt (sau nếu đủ chỗ, không thì bên)
    const back = g.cy0, side = cx0;
    let pos = g.cwt === 'S' ? 'L' : g.cwt;
    if (!pos) pos = !two && back >= 260 ? 'B' : (side >= 200 ? 'L' : '');
    const cwLab = 'ĐT' + (g.cwt === 'S' ? ' (bên)' : '');
    if (pos === 'B') {
      const cw = Math.min(r.BB * 0.6, 900), cd = Math.max(60, Math.min(back - 100, 180));
      s += rect(WW / 2 - cw / 2, back / 2 - cd / 2, cw, cd, GREY, 8) + text(WW / 2, back / 2 + fs * 0.35, cwLab, fs * 0.7, { anchor: 'middle', col: GREY });
      [WW / 2 - cw / 2 - 50, WW / 2 + cw / 2 + 50].forEach(function (x) { s += rect(x - 20, back / 2 - 40, 40, 80, GREY, 5); });   // ray đối trọng
    } else if (pos === 'L' || pos === 'R') {
      const gap = pos === 'L' ? side : WW - cx1, xc = pos === 'L' ? side / 2 : cx1 + gap / 2;
      const cd = Math.min(r.DD * 0.6, 900), cw = Math.max(60, Math.min(gap - 80, 160));
      s += rect(xc - cw / 2, ry - cd / 2, cw, cd, GREY, 8) + text(xc, ry - cd / 2 - 90, cwLab, fs * 0.7, { anchor: 'middle', col: GREY });
      [ry - cd / 2 - 50, ry + cd / 2 + 50].forEach(function (y) { s += rect(xc - 40, y - 20, 80, 40, GREY, 5); });                   // ray đối trọng
    }
    // cabin: vách kép
    s += rect(cx0, g.cy0, r.BB, r.DD, CAR, 12) + rect(cx0 + 40, g.cy0 + 40, r.BB - 80, r.DD - 80, CAR, 5);
    // cửa cabin + cửa tầng (2 cánh), ngưỡng
    const cl = WW / 2;
    s += rect(cl - r.LL / 2, g.cy1, r.LL / 2, 40, DOOR, 6) + rect(cl, g.cy1 + 40, r.LL / 2, 40, DOOR, 6);
    s += rect(cl - r.LL / 2 - 40, WD + 10, r.LL / 2 + 40, 40, DOOR, 6) + rect(cl, WD + 50, r.LL / 2 + 40, 40, DOOR, 6);
    s += line(dl, g.cy1 + 80, dr, g.cy1 + 80, INK, 4) + line(dl - 60, WD - 10, dr + 60, WD - 10, INK, 4);
    if (two) {   // lối vào 2 (phía sau): đối xứng qua chiều sâu
      s += rect(cl - r.LL / 2, g.cy0 - 40, r.LL / 2, 40, DOOR, 6) + rect(cl, g.cy0 - 80, r.LL / 2, 40, DOOR, 6);
      s += rect(cl - r.LL / 2 - 40, -50, r.LL / 2 + 40, 40, DOOR, 6) + rect(cl, -90, r.LL / 2 + 40, 40, DOOR, 6);
      s += line(dl, g.cy0 - 80, dr, g.cy0 - 80, INK, 4) + line(dl - 60, 10, dr + 60, 10, INK, 4);
    }
    // tim cửa
    s += line(cl, -t - 120 - (two ? 400 : 0), cl, WD + t + 650, GREY, 4, ' stroke-dasharray="120 40 20 40"') + text(cl + 40, WD + t + 560, 'TIM CỬA', fs * 0.7, { col: GREY });
    // kích thước
    s += chainH([0, cx0, cx1, WW], [Math.round(cx0), r.BB + ' BB', Math.round(WW - cx1)], -t - 220 - back0, fs, g.cy0);
    s += chainH([0, dl, dr, WW], [Math.round(dl), r.LL + ' LL', Math.round(WW - dr)], WD + t + 300, fs, WD + t);
    s += dimH(0, WW, WD + t + 750, WW + ' WW', fs, WD + t);
    s += dimV(g.cy0, g.cy1, -t - 280, r.DD + ' DD', fs, cx0);
    s += dimV(0, WD, -t - 650, WD + ' WD', fs, -t);
    s += dimH(WW, WW + t, -t - 520 - back0, t, fs * 0.8, -t);
    s += text(WW / 2, WD + t + 1180, 'MẶT BẰNG HỐ THANG' + (two ? ' — 2 LỐI VÀO' : ''), fs, { anchor: 'middle', bold: true });
    const cwNote = g.cwt ? 'đối trọng ' + ({ B: 'phía sau', L: 'bên trái', R: 'bên phải', S: 'bên (chưa rõ trái/phải)' })[g.cwt] + ' — ' + g.cwtSrc : 'đối trọng tự đặt (chưa có dữ liệu)';
    s += text(WW / 2, WD + t + 1180 + fs * 1.2, 'sơ đồ — ' + cwNote, fs * 0.7, { anchor: 'middle', col: GREY });
    s += text(WW / 2, WD + t + 1180 + fs * 2.1, 'vị trí cabin, kích thước ray/ĐT vẽ tượng trưng', fs * 0.7, { anchor: 'middle', col: GREY });
    return s + '</svg>';
  }

  /* ---------- 2. Mặt cắt hố pit (hình 2) ---------- */
  function pitSvg(L, res) {
    const g = geo(L, res), r = g.r, t = g.t, WD = r.WD, PH = g.PH || 1200;
    const fs = Math.max(75, (WD + 2 * t + 1800) / 26);
    const top = -(g.chD + 900);
    const minx = -t - 1000, miny = top - 300, w = WD + 2 * t + 3100, h = PH + t - top + 1100 + fs * 2;
    const o = open(minx, miny, w, h, fs);
    let s = o.s;
    // vách sau, vách trước (lỗ cửa tầng dưới cùng), đáy pit, sàn sảnh
    s += backWall(o.fill, g, top, PH + t, fs);
    s += conc(o.fill, WD, top, t, -g.hhD - 80 - top) + conc(o.fill, WD, 0, t, PH + t);
    s += conc(o.fill, -t, PH, WD + 2 * t, t);
    s += conc(o.fill, WD + t, 0, 900, t);
    s += breakH(-t - 200, WD + t + 1000, top);
    // cabin ở tầng dưới cùng
    const x0 = g.cy0, x1 = g.cy1;
    s += rect(x0, -g.chD, r.DD, g.chD, CAR, 12) + rect(x0 - 60, -g.chD - 250, r.DD + 120, 250, CAR, 6);
    s += rect(x0 - 60, 0, r.DD + 120, 180, CAR, 8);                         // sàn cabin + khung
    s += line(x0 + r.DD / 2, -g.chD - 250, x0 + r.DD / 2, top, GREY, 5);   // cáp
    // cửa cabin / cửa tầng
    s += rect(x1, -g.hhD, 40, g.hhD, DOOR, 6) + rect(WD + 10, -g.hhD, 40, g.hhD, DOOR, 6);
    // giảm chấn trong pit (tượng trưng)
    const bh = Math.min(PH * 0.45, 520), bx = x0 + r.DD / 2;
    s += rect(bx - 90, PH - bh, 180, bh, INK, 6) + rect(bx - 150, PH - 80, 300, 80, INK, 6);
    s += rect(x0 + 150, PH - Math.min(PH * 0.35, 400), 120, Math.min(PH * 0.35, 400), INK, 5);
    s += text(bx + 120, PH - bh - 60, 'giảm chấn', fs * 0.7, { col: GREY });
    // ray
    s += line(x0 - 120, PH, x0 - 120, top, GREY, 8);
    s += ffl(WD + t + 450, 0, fs, 'FFL tầng dưới cùng');
    // kích thước
    s += dimV(0, PH, WD + t + 1050, q(g.PH, 'PH'), fs, WD + t);
    s += dimV(-g.chD, 0, -t - 300, q(g.CH, 'CH'), fs, x0);
    s += dimV(-g.hhD, 0, WD + t + 700, q(g.HH, 'HH'), fs, WD + t);
    s += dimH(0, WD, PH + t + 350, WD + ' WD', fs, PH + t);
    s += text(WD / 2, PH + t + 800, 'MẶT CẮT HỐ PIT', fs, { anchor: 'middle', bold: true });
    s += text(WD / 2, PH + t + 800 + fs * 1.2, 'cabin ở tầng dưới cùng — sơ đồ', fs * 0.7, { anchor: 'middle', col: GREY });
    return s + '</svg>';
  }

  /* ---------- 3/4. Mặt cắt OH trên cùng: có phòng máy (hình 3) / không phòng máy (hình 4) ---------- */
  function topSvg(L, res) {
    const g = geo(L, res), r = g.r, t = g.t, WD = r.WD;
    const OH = g.OH || (g.chD + 1300);
    const hmM = g.mr && r.MR ? String(r.MR).match(/(\d{4})/) : null;
    const HM = hmM ? +hmM[1] : 0, hmD = HM || 2200;
    const yC = -OH;                                  // mặt dưới trần hố / sàn phòng máy
    const roof = g.mr ? yC - t - hmD : yC;           // mặt dưới mái phòng máy
    const fs = Math.max(75, (WD + 2 * t + 2600) / 26);
    const topPad = g.mr ? 400 : 1100;
    const minx = -t - 1500, miny = roof - t - topPad, w = WD + 2 * t + 3800, h = 1700 + fs * 3 - (roof - t - topPad);
    const o = open(minx, miny, w, h, fs);
    let s = o.s;
    // vách sau / trước (lỗ cửa tầng trên cùng), sàn sảnh tầng trên cùng
    s += backWall(o.fill, g, yC - t, 900, fs);
    s += conc(o.fill, WD, yC - t, t, -g.hhD - 80 - yC + t) + conc(o.fill, WD, 0, t, 900);
    s += conc(o.fill, WD + t, 0, 900, t);
    s += conc(o.fill, -t, yC - t, WD + 2 * t, t);                          // trần hố / sàn phòng máy
    s += breakH(-t - 200, WD + t + 1000, 900);
    // cabin ở tầng trên cùng
    const x0 = g.cy0, x1 = g.cy1;
    s += rect(x0, -g.chD, r.DD, g.chD, CAR, 12) + rect(x0 - 60, -g.chD - 250, r.DD + 120, 250, CAR, 6) + rect(x0 - 60, 0, r.DD + 120, 180, CAR, 8);
    s += rect(x1, -g.hhD, 40, g.hhD, DOOR, 6) + rect(WD + 10, -g.hhD, 40, g.hhD, DOOR, 6);
    s += ffl(WD + t + 450, 0, fs, 'FFL tầng trên cùng');
    if (g.mr) {
      // phòng máy: vách, mái, máy kéo trên sàn, móc treo, lỗ cáp
      s += conc(o.fill, -t, roof - t, t, hmD + t) + conc(o.fill, WD, roof - t, t, hmD + t) + conc(o.fill, -t, roof - t, WD + 2 * t, t);
      const mx = WD * 0.45, my = yC - t;
      s += rect(mx - 380, my - 120, 760, 120, INK, 6) + '<circle cx="' + mx + '" cy="' + (my - 420) + '" r="260" fill="none" stroke="' + INK + '" stroke-width="8"/>' +
        '<circle cx="' + mx + '" cy="' + (my - 420) + '" r="70" fill="none" stroke="' + INK + '" stroke-width="6"/>' + rect(mx - 300, my - 700, 600, 580, INK, 5);
      s += line(mx - 200, my, mx - 200, -g.chD - 250, GREY, 5) + line(mx + 260, my, mx + 260, -g.chD - 250, GREY, 5);
      s += line(WD * 0.5, roof, WD * 0.5, roof + 160, INK, 6) + '<path d="M' + (WD * 0.5) + ' ' + (roof + 160) + ' a50 50 0 1 1 -60 40" fill="none" stroke="' + INK + '" stroke-width="6"/>';
      s += text(WD * 0.5 + 120, roof + 200, 'móc treo', fs * 0.7, { col: GREY });
      s += text(WD * 0.8, yC - t - hmD / 2, 'PHÒNG MÁY', fs * 0.8, { anchor: 'middle', col: GREY });
      s += dimV(roof, yC - t, WD + t + 700, q(HM, 'HM'), fs, WD + t);
    } else {
      // không phòng máy: máy kéo trong giếng, dầm kéo máy dưới trần, quạt thông gió
      const mx = WD * 0.35, my = yC + 250;
      s += rect(mx - 280, my, 560, 420, INK, 6) + '<circle cx="' + mx + '" cy="' + (my + 210) + '" r="150" fill="none" stroke="' + INK + '" stroke-width="6"/>';
      [WD * 0.25, WD * 0.45].forEach(function (x) { s += rect(x - 60, yC, 120, 120, INK, 6) + line(x - 60, yC + 60, x + 60, yC + 60, INK, 4); });
      s += line(WD - 120, yC + 150, WD - 120, yC + 650, INK, 6) + '<path d="M' + (WD - 220) + ' ' + (yC + 320) + ' l100 80 l100 -80 M' + (WD - 220) + ' ' + (yC + 480) + ' l100 -80 l100 80" fill="none" stroke="' + INK + '" stroke-width="5"/>';
      s += line(mx, my + 420, mx, -g.chD - 250, GREY, 5);
      s += leader(mx, my + 100, -t - 300, yC - 700, 'động cơ', fs * 0.75);
      s += leader(WD * 0.45, yC + 60, WD * 0.2, yC - 450, 'dầm kéo máy (*)', fs * 0.75);
      s += leader(WD - 120, yC + 400, WD + t + 250, yC - 250, 'quạt thông gió (*)', fs * 0.75);
    }
    // kích thước
    s += dimV(yC, 0, WD + t + 1050, q(g.OH, 'OH'), fs, WD + t);
    s += dimV(-g.hhD, 0, WD + t + 700, q(g.HH, 'HH'), fs, WD + t);
    s += dimV(-g.chD, 0, -t - 300, q(g.CH, 'CH'), fs, x0);
    s += dimH(0, WD, 900 + 350, WD + ' WD', fs, 900);
    const title = g.mr ? 'MẶT CẮT OH VÀ PHÒNG MÁY' : 'MẶT CẮT OH TRÊN CÙNG';
    s += text(WD / 2, 900 + 800, title, fs, { anchor: 'middle', bold: true });
    s += text(WD / 2, 900 + 800 + fs * 1.2, (g.mr ? 'thang có phòng máy' : 'thang không phòng máy — (*) theo hãng') + ' — sơ đồ', fs * 0.7, { anchor: 'middle', col: GREY });
    if (!g.OH) s += text(WD / 2, 900 + 800 + fs * 2.4, 'OH chưa xác định — nhập CH (hình vẽ tượng trưng)', fs * 0.7, { anchor: 'middle', col: '#c0392b' });
    return s + '</svg>';
  }

  AL.LiftDraw = { plan: planSvg, pit: pitSvg, top: topSvg };
})(window);
