/* ArchiLift – giao diện. Dữ liệu dự án lưu trong trình duyệt (localStorage) và file .json. */
(function () {
  'use strict';
  const AL = window.AL;
  const STORE = 'archilift.v1';
  const FUNCS = ['Hầm', 'Sảnh', 'Căn hộ', 'Văn phòng', 'Thương mại', 'Tiện ích', 'Khách sạn', 'Kỹ thuật', 'Mái', 'Khác'];
  const PRESETS = {
    res: { label: 'Chung cư', hc5: 7, int: 60, awt: 0, demand: 7 },
    off: { label: 'Văn phòng', hc5: 12, int: 30, awt: 0, demand: 12 },
    hotel: { label: 'Khách sạn', hc5: 12, int: 40, awt: 0, demand: 12 },
    custom: { label: 'Tự nhập' },
  };
  const TABS = [
    ['building', '1. Công trình'], ['groups', '2. Nhóm thang'], ['calc', '3. Kết quả tính'],
    ['sizing', '4. Chọn thang tự động'], ['sim', '5. Mô phỏng'], ['report', '6. Báo cáo'], ['lifts', '7. Kích thước thang theo hãng'], ['method', 'Phương pháp'],
  ];

  let S, tab = 'building', lastSim = null, lastSweep = null, lastSizing = null, ui = { gen: false, paste: false };
  const share = { on: false, client: '', name: '', isEditor: false, hasEditor: false, editorName: '', rev: -1, pushing: false, offline: false };

  const uid = function () { return Math.random().toString(36).slice(2, 9); };
  const esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function fmt(x, d) {
    if (x === Infinity) return '∞';
    if (x == null || !isFinite(x)) return '—';
    d = d == null ? 1 : d;
    return Number(x).toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  const $ = function (s) { return document.querySelector(s); };

  /* ---------- dữ liệu ---------- */
  /* Loại thang (ký hiệu dùng trên mặt bằng và trong báo cáo). Thang chở rác (R) không tính giao thông. */
  const KINDS = {
    P: { label: 'Thang khách (chung)', col: '#1f6f8b' }, C: { label: 'Thang cư dân', col: '#2e86c1' },
    VP: { label: 'Thang văn phòng', col: '#8e44ad' }, DV: { label: 'Thang dịch vụ', col: '#d35400' },
    KS: { label: 'Thang khách sạn', col: '#16a085' }, H: { label: 'Thang chở hàng', col: '#7f8c8d' },
    CC: { label: 'Thang chữa cháy', col: '#c0392b' }, R: { label: 'Thang chở rác', col: '#6d4c41' },
  };
  /* loại của nhóm: chọn ở tab 2; nhóm cũ chưa chọn thì đoán theo ký hiệu đầu tên ("VP – …", "DV1"…), mặc định P */
  function kindOf(g) {
    if (g.kind && KINDS[g.kind]) return g.kind;
    const m = String(g.name || '').trim().toUpperCase().match(/^([A-Z]{1,2})(?=[\s\d\-–_.]|$)/);
    return m && KINDS[m[1]] ? m[1] : 'P';
  }
  function newGroup(name) {
    return { id: uid(), name: name || 'Nhóm mới', L: 2, Q: 1000, v: 1.75, a: 1.0, j: 1.5, to: 2.0, tc: 3.0, tsd: 0.5, tp: 1.2, lf: 80,
      preset: 'res', crit: { hc5: 7, int: 60, awt: 0 }, demand: 7, cells: {} };
  }
  function genFloors(p) {
    const fl = [];
    for (let i = p.nB; i >= 1; i--) fl.push({ id: uid(), name: 'B' + i, func: 'Hầm', h: p.hB, pop: 0, ent: p.entB });
    for (let i = 1; i <= p.nA; i++) {
      const res = i >= p.resFrom;
      fl.push({ id: uid(), name: 'T' + i, func: i === 1 ? 'Sảnh' : res ? p.func : 'Tiện ích', h: i === 1 ? p.hT1 : p.hTyp,
        pop: i > 1 && res ? p.popPer : 0, ent: i === 1 ? p.entT1 : 0 });
    }
    return fl;
  }
  function example() {
    const floors = genFloors({ nB: 3, hB: 3.3, entB: 10, nA: 30, hT1: 4.5, entT1: 70, hTyp: 3.2, resFrom: 3, popPer: 40, func: 'Căn hộ' });
    const g = newGroup('P – Cư dân');
    Object.assign(g, { L: 6, Q: 1000, v: 2.5 });
    floors.forEach(function (f) { g.cells[f.id] = { s: true, sh: f.pop > 0 ? 100 : 0 }; });
    return {
      v: 1, project: { name: 'Ví dụ – chung cư 30 tầng, 3 hầm (số liệu giả định)', code: 'VD', author: '', note: 'Số liệu ví dụ để làm quen phần mềm, không thuộc dự án nào.' },
      floors: floors, datumId: floors[3].id, groups: [g],
      sim: { profile: 'up', rate: 7, inc: 100, out: 0, inter: 0, dur: 28800, warm: 300, runs: 2, seed: 1, midRoute: true, ctrl: 'col', cap: 100, sweep: '4, 5, 6, 7, 8, 9, 10, 11, 12', groupId: g.id },
      sizing: { maxL: 12, loads: AL.LOADS.join(', '), speeds: AL.SPEEDS.join(', '), groupId: g.id },
    };
  }
  function blank() {
    return { v: 1, project: { name: 'Dự án mới', code: '', author: '', note: '' }, floors: [], datumId: null, groups: [],
      sim: { profile: 'up', rate: 7, inc: 100, out: 0, inter: 0, dur: 28800, warm: 300, runs: 2, seed: 1, midRoute: true, ctrl: 'col', cap: 100, sweep: '4, 5, 6, 7, 8, 9, 10, 11, 12', groupId: null },
      sizing: { maxL: 12, loads: AL.LOADS.join(', '), speeds: AL.SPEEDS.join(', '), groupId: null } };
  }
  function save() {
    if (share.on) { if (share.isEditor) sharePush(); return; }   // chế độ chia sẻ LAN: dự án nằm trên server
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {
      if (!ui.saveWarned) { ui.saveWarned = true; alert('Trình duyệt không lưu được dữ liệu (ảnh mặt bằng quá lớn so với bộ nhớ trình duyệt). Hãy bấm "Lưu .json" để giữ dữ liệu.'); }
    }
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.floors) return s; } catch (e) { /* bỏ qua */ }
    return example();
  }
  const groupById = function (id) { return S.groups.find(function (g) { return g.id === id; }) || S.groups[0]; };

  /* ---------- khung ---------- */
  function renderTabs() {
    $('#tabs').innerHTML = TABS.map(function (t) { return '<button class="tab' + (t[0] === tab ? ' on' : '') + '" data-act="tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    $('#projName').textContent = S.project.name || '';
  }
  function render() {
    const fk = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.bind : null;
    renderTabs();
    const m = { building: vBuilding, groups: vGroups, calc: vCalc, sizing: vSizing, sim: vSim, report: vReport, lifts: vLifts, method: vMethod }[tab];
    $('#main').innerHTML = m();
    afterRender();
    renderShareBar();
    if (share.on && !share.isEditor) document.querySelectorAll('#main input, #main select, #main textarea').forEach(function (el) { if (!el.closest('[data-act]')) el.disabled = true; });
    if (fk) { const el = document.querySelector('[data-bind="' + fk + '"]'); if (el) { el.focus(); if (el.select && el.type !== 'checkbox') el.select(); } }
  }
  function inp(bind, val, opt) {
    opt = opt || {};
    const type = opt.type || 'number';
    return '<input type="' + type + '" data-bind="' + bind + '" value="' + esc(val) + '"' + (opt.step ? ' step="' + opt.step + '"' : type === 'number' ? ' step="any"' : '') +
      (opt.list ? ' list="' + opt.list + '"' : '') + (opt.cls ? ' class="' + opt.cls + '"' : '') + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : '') + '>';
  }
  function sel(bind, val, options) {
    return '<select data-bind="' + bind + '">' + options.map(function (o) {
      const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('') + '</select>';
  }
  function field(label, html, hint) { return '<label class="fld"><span>' + label + '</span>' + html + (hint ? '<small>' + hint + '</small>' : '') + '</label>'; }

  /* ---------- 1. Công trình ---------- */
  function vBuilding() {
    const fl = AL.computeElevations(S);
    const pop = fl.reduce(function (s, f) { return s + (+f.pop || 0); }, 0);
    const ent = fl.reduce(function (s, f) { return s + (+f.ent || 0); }, 0);
    let h = '<div class="card"><h2>Thông tin dự án</h2><div class="grid4">' +
      field('Tên dự án', inp('project.name', S.project.name, { type: 'text' })) +
      field('Mã dự án', inp('project.code', S.project.code, { type: 'text' })) +
      field('Người lập', inp('project.author', S.project.author, { type: 'text' })) +
      field('Tầng cốt ±0.000', sel('datum', S.datumId, fl.slice().reverse().map(function (f) { return [f.id, f.name]; }))) +
      '</div>' + field('Ghi chú', inp('project.note', S.project.note, { type: 'text' })) + '</div>';

    h += '<div class="card"><div class="row-between"><h2>Danh sách tầng <small>(từ trên xuống)</small></h2><div class="btns">' +
      '<label class="chk"><input type="checkbox" data-act="mergeFloors"' + (ui.mergeFloors ? ' checked' : '') + '> Gộp các tầng giống nhau</label>' +
      '<button data-act="toggleGen">Tạo nhanh tầng</button><button data-act="togglePaste">Dán từ Excel</button><button data-act="addFloor">+ Thêm tầng trên cùng</button></div></div>';
    if (ui.gen) h += genForm();
    if (ui.paste) h += pasteForm();
    h += '<p class="hint"><b>Cao tầng</b> = chiều cao từ sàn tầng này đến sàn tầng trên. <b>Dân số</b> = số người sử dụng thang của tầng (căn hộ × người/căn, diện tích ÷ chỉ tiêu…). ' +
      '<b>Ga vào %</b> = tỷ lệ người vào nhà tại tầng đó trong cao điểm lên (sảnh T1, tầng hầm đỗ xe…); để trống nếu không phải ga vào. Tổng sẽ được chuẩn hoá về 100%.</p>';
    h += '<div class="tblwrap"><table class="tbl floors"><thead><tr><th>#</th><th>Tên tầng</th><th>Công năng</th><th>Cao tầng (m)</th><th class="ftc">Cao độ sàn (m)</th><th class="ftc">Dân số (người)</th><th class="ftc">Ga vào (%)</th><th></th></tr></thead><tbody>';
    // gộp tầng liền nhau cùng công năng, cao tầng, dân số, ga vào (tầng cốt ±0.000 luôn để riêng)
    const fsig = function (f) { return f.id === S.datumId ? f.id : [f.func, +f.h || 0, +f.pop || 0, +f.ent || 0].join('|'); };
    let no = fl.length;
    zoningRows(fl.slice().reverse(), ui.mergeFloors, fsig).forEach(function (r) {
      const f = r[0], last = r[r.length - 1], n = r.length;
      const k = 'floor.' + r.map(function (x) { return x.id; }).join(',') + '.';
      const fmtZ = function (x) { return (x.z >= 0 ? '+' : '') + fmt(x.z, 3); };
      h += '<tr class="' + (f.id === S.datumId ? 'datum' : '') + (n > 1 ? ' merged' : '') + '"><td class="num">' + (n > 1 ? (no - n + 1) + '–' + no : no) + '</td>' +
        '<td>' + (n > 1 ? '<b>' + esc(last.name) + ' – ' + esc(f.name) + '</b> <small>(' + n + ' tầng)</small>' : inp(k + 'name', f.name, { type: 'text', cls: 'w-s' })) + '</td>' +
        '<td>' + sel(k + 'func', f.func, FUNCS) + '</td>' +
        '<td>' + inp(k + 'h', f.h, { cls: 'w-s' }) + (n > 1 ? ' <small>/tầng</small>' : '') + '</td>' +
        '<td class="ftc">' + (n > 1 ? fmtZ(last) + ' ÷ ' + fmtZ(f) : fmtZ(f)) + '</td>' +
        '<td class="ftc"><span class="cin">' + inp(k + 'pop', f.pop || '', { cls: 'w-s' }) + (n > 1 && +f.pop > 0 ? '<small class="suf">/tầng (Σ ' + fmt(+f.pop * n, 0) + ')</small>' : '') + '</span></td>' +
        '<td class="ftc"><span class="cin">' + inp(k + 'ent', f.ent || '', { cls: 'w-xs' }) + (n > 1 && +f.ent > 0 ? '<small class="suf">/tầng</small>' : '') + '</span></td>' +
        '<td class="acts">' + (n > 1
          ? '<button class="ic" title="Chèn tầng phía dưới nhóm tầng" data-act="insF" data-id="' + last.id + '">＋</button> <small class="hint" title="Bỏ chọn &quot;Gộp các tầng giống nhau&quot; để sửa tên, xoá hoặc di chuyển từng tầng">bỏ gộp để sửa riêng</small>'
          : '<button class="ic" title="Lên" data-act="upF" data-id="' + f.id + '">▲</button><button class="ic" title="Xuống" data-act="dnF" data-id="' + f.id + '">▼</button>' +
            '<button class="ic" title="Chèn tầng phía dưới" data-act="insF" data-id="' + f.id + '">＋</button><button class="ic del" title="Xoá" data-act="delF" data-id="' + f.id + '">✕</button>') + '</td></tr>';
      no -= n;
    });
    h += '</tbody><tfoot><tr><td></td><td colspan="3"><b>' + fl.length + ' tầng</b> · chiều cao tổng ' + fmt(fl.length ? fl[fl.length - 1].zAbs - fl[0].zAbs : 0, 2) + ' m (sàn thấp nhất → sàn cao nhất)</td><td></td><td class="ftc"><b>' + fmt(pop, 0) + '</b></td><td class="ftc' + (Math.abs(ent - 100) > 0.01 && ent > 0 ? ' warn' : '') + '"><b>' + fmt(ent, 1) + '</b></td><td></td></tr></tfoot></table></div></div>';
    return h;
  }
  function genForm() {
    const g = ui.genP || (ui.genP = { nB: 3, hB: 3.3, entB: 10, nA: 30, hT1: 4.5, entT1: 70, hTyp: 3.2, resFrom: 3, popPer: 40, func: 'Căn hộ' });
    const f = function (k, l) { return field(l, '<input type="number" step="any" data-gen="' + k + '" value="' + g[k] + '">'); };
    return '<div class="sub"><h3>Tạo nhanh danh sách tầng <small>(thay thế danh sách hiện có; sửa chi tiết sau)</small></h3><div class="grid5">' +
      f('nB', 'Số tầng hầm') + f('hB', 'Cao tầng hầm (m)') + f('entB', 'Ga vào mỗi hầm (%)') + f('nA', 'Số tầng nổi (gồm T1)') + f('hT1', 'Cao T1 (m)') +
      f('entT1', 'Ga vào T1 (%)') + f('hTyp', 'Cao tầng điển hình (m)') + f('resFrom', 'Có dân số từ tầng') + f('popPer', 'Dân số mỗi tầng') +
      field('Công năng tầng có dân số', '<select data-gen="func">' + FUNCS.map(function (x) { return '<option' + (x === g.func ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>') +
      '</div><button class="pri" data-act="doGen">Tạo danh sách tầng</button></div>';
  }
  function pasteForm() {
    return '<div class="sub"><h3>Dán bảng từ Excel</h3><p class="hint">Chép vùng ô trong Excel gồm các cột theo thứ tự: <b>Tên tầng | Cao tầng (m) | Công năng | Dân số | Ga vào (%)</b> (cột thiếu để trống). Dấu thập phân "," hoặc "." đều được.</p>' +
      '<textarea id="pasteBox" rows="8" placeholder="T30\t3,2\tCăn hộ\t40\t&#10;T29\t3,2\tCăn hộ\t40\t"></textarea>' +
      '<div class="btns"><label class="chk"><input type="checkbox" id="pasteTop" checked> Dòng đầu là tầng trên cùng</label>' +
      '<button class="pri" data-act="doPaste" data-id="replace">Thay thế danh sách</button><button data-act="doPaste" data-id="append">Thêm vào trên cùng</button></div></div>';
  }
  function num(s) { const x = parseFloat(String(s || '').trim().replace(/\s/g, '').replace(',', '.')); return isFinite(x) ? x : 0; }

  /* ---------- 2. Nhóm thang ---------- */
  function vGroups() {
    const fl = AL.computeElevations(S);
    let h = '<div class="card"><div class="row-between"><h2>Nhóm thang</h2><div class="btns"><button class="pri" data-act="addGroup">+ Thêm nhóm</button></div></div>' +
      '<p class="hint">Mỗi nhóm là một dãy thang điều khiển chung. Muốn so sánh phương án: dùng <b>Nhân bản</b> rồi đổi số cabin/tải trọng/vận tốc. Chọn <b>Loại thang</b> (P, C, VP, DV, KS, H, CC, R) để báo cáo kết luận theo từng loại; thang chở rác (R) chỉ liệt kê, không tính giao thông.</p></div>';
    if (!S.groups.length) h += '<div class="card"><p>Chưa có nhóm thang.</p></div>';
    S.groups.forEach(function (g) {
      const k = 'group.' + g.id + '.', CC = AL.capacityFromLoad(g.Q);
      h += '<div class="card group"><div class="row-between"><h3>' + inp(k + 'name', g.name, { type: 'text', cls: 'title-in' }) + '</h3><div class="btns">' +
        '<button data-act="dupGroup" data-id="' + g.id + '">Nhân bản</button><button class="del" data-act="delGroup" data-id="' + g.id + '">Xoá nhóm</button></div></div>' +
        '<div class="grid6">' +
        field('Loại thang', sel(k + 'kind', kindOf(g), Object.keys(KINDS).map(function (c) { return [c, c + ' – ' + KINDS[c].label]; })), kindOf(g) === 'R' ? 'không tính giao thông trong báo cáo' : 'ký hiệu trên mặt bằng / báo cáo') +
        field('Số cabin L', inp(k + 'L', g.L, { step: 1 })) +
        field('Tải trọng Q (kg)', inp(k + 'Q', g.Q, { list: 'dlLoads' }), 'Sức chứa CC = ' + CC + ' người') +
        field('Vận tốc v (m/s)', inp(k + 'v', g.v, { list: 'dlSpeeds' })) +
        field('Gia tốc a (m/s²)', inp(k + 'a', g.a)) +
        field('Jerk j (m/s³)', inp(k + 'j', g.j)) +
        field('Hệ số tải tính toán (%)', inp(k + 'lf', g.lf), 'CIBSE: 80%') +
        field('Mở cửa t<sub>o</sub> (s)', inp(k + 'to', g.to)) +
        field('Đóng cửa t<sub>c</sub> (s)', inp(k + 'tc', g.tc)) +
        field('Trễ khởi động t<sub>sd</sub> (s)', inp(k + 'tsd', g.tsd)) +
        field('Ra/vào 1 khách t<sub>p</sub> (s)', inp(k + 'tp', g.tp)) +
        '</div><p class="hint warnline">Thông số cửa, gia tốc, jerk mặc định là giá trị điển hình — <b>cần xác nhận theo catalogue hãng thang</b>.</p>' +
        '<h4>Tiêu chí đánh giá</h4><div class="grid6">' +
        field('Loại công trình', sel('preset.' + g.id, g.preset, Object.keys(PRESETS).map(function (p) { return [p, PRESETS[p].label]; }))) +
        field('HC5 tối thiểu (% dân số)', inp('crit.' + g.id + '.hc5', g.crit.hc5)) +
        field('INT tối đa (s)', inp('crit.' + g.id + '.int', g.crit.int), '0 = không xét') +
        field('AWT tối đa tại nhu cầu (s)', inp('crit.' + g.id + '.awt', g.crit.awt || ''), '0/trống = không xét') +
        '<div class="fld dem-fld"><span>Nhu cầu cao điểm (% dân số/5 phút) — dùng tính điểm làm việc &amp; mô phỏng</span>' + demandCtl(g, AL.buildGroupInput(S, g).pop) + '</div>' +
        '</div><p class="hint warnline">Tiêu chí mặc định theo loại công trình chỉ để tham khảo — <b>cần xác minh</b> theo tiêu chuẩn/yêu cầu CĐT áp dụng cho dự án (CIBSE Guide D, ISO 8100-32, ISO 8100-30…).</p>' +
        '<div class="btns range">Phục vụ từ ' + rangeSel('rFrom-' + g.id, fl, 0) + ' đến ' + rangeSel('rTo-' + g.id, fl, fl.length - 1) +
        ' <button data-act="setRange" data-id="' + g.id + '">Đặt dải tầng dừng</button><button data-act="clearRange" data-id="' + g.id + '">Bỏ hết</button></div></div>';
    });
    if (S.groups.length && fl.length) h += matrix(fl);
    return h;
  }
  function rangeSel(id, fl, def) {
    return '<select id="' + id + '">' + fl.map(function (f, i) { return '<option value="' + i + '"' + (i === def ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('') + '</select>';
  }
  function matrix(fl) {
    let h = '<div class="card"><div class="row-between"><h2>Ma trận phục vụ &amp; phân bổ dân số</h2><div class="btns">' +
      '<label class="chk"><input type="checkbox" data-act="mergeMatrix"' + (ui.mergeMatrix ? ' checked' : '') + '> Gộp các tầng giống nhau vào 1 dòng</label>' +
      '<button data-act="autoShare">Tự phân bổ dân số</button></div></div>' +
      '<p class="hint">Ô đánh dấu = nhóm có dừng tại tầng. Ô % = phần dân số của tầng do nhóm đảm nhận. <b>Tổng phân bổ của mỗi tầng có dân số phải = 100%</b> để không cộng trùng một người cho hai nhóm (ví dụ cư dân có thể đi cả thang P và thang C). "Tự phân bổ" chia đều cho các nhóm cùng dừng — sau đó chỉnh tay nếu cần.</p>' +
      '<div class="tblwrap"><table class="tbl matrix"><thead><tr><th>Tầng</th><th>Cao độ</th><th>Dân số</th><th>Ga vào</th>';
    S.groups.forEach(function (g) { h += '<th>' + esc(g.name) + '</th>'; });
    h += '<th>Tổng phân bổ</th></tr></thead><tbody>';
    zoningRows(fl.slice().reverse(), ui.mergeMatrix).forEach(function (r) {
      const f = r[0], last = r[r.length - 1], n = r.length;
      const ids = r.map(function (x) { return x.id; }).join(','); // dòng gộp: sửa 1 ô áp dụng cho mọi tầng trong dòng
      let tot = 0;
      let row = '<tr><td><b>' + (n > 1 ? esc(last.name) + ' – ' + esc(f.name) : esc(f.name)) + '</b> <small>' + esc(f.func) + (n > 1 ? ' · ' + n + ' tầng' : '') + '</small></td>' +
        '<td class="num">' + (n > 1 ? fmt(last.z, 2) + ' ÷ ' + fmt(f.z, 2) : fmt(f.z, 2)) + '</td>' +
        '<td class="num">' + (f.pop ? fmt(+f.pop, 0) + (n > 1 ? ' /tầng <small>(Σ ' + fmt(+f.pop * n, 0) + ')</small>' : '') : '') + '</td>' +
        '<td class="num">' + (f.ent ? fmt(f.ent, 0) + '%' + (n > 1 ? ' /tầng' : '') : '') + '</td>';
      S.groups.forEach(function (g) {
        const c = g.cells[f.id] || {};
        if (c.s) tot += +c.sh || 0;
        row += '<td class="cell' + (c.s ? ' on' : '') + '"><input type="checkbox" data-bind="cell.' + g.id + '.' + ids + '.s"' + (c.s ? ' checked' : '') + '>' +
          (+f.pop > 0 ? '<input type="number" step="any" class="w-xs" data-bind="cell.' + g.id + '.' + ids + '.sh" value="' + (c.sh || '') + '"' + (c.s ? '' : ' disabled') + '>%' : '') + '</td>';
      });
      const bad = +f.pop > 0 && Math.abs(tot - 100) > 0.01;
      row += '<td class="num' + (bad ? ' bad' : '') + '">' + (+f.pop > 0 ? fmt(tot, 0) + '%' : '') + '</td></tr>';
      h += row;
    });
    return h + '</tbody></table></div></div>';
  }

  /* ---------- 3. Kết quả tính ---------- */
  function evalAll() {
    return S.groups.map(function (g) { const gi = AL.buildGroupInput(S, g); return { g: g, gi: gi, e: AL.evaluate(gi, g) }; });
  }
  function badge(ok) { return ok ? '<span class="b ok">Đạt</span>' : '<span class="b bad">Không đạt</span>'; }
  function summaryTable(rs) {
    let h = '<div class="tblwrap"><table class="tbl"><thead><tr><th>Nhóm</th><th>Cabin × Tải × Vận tốc</th><th>CC</th><th>Dân số phục vụ</th><th>Hành trình (m)</th><th>RTT (s)</th><th>INT (s)</th><th>HC5 (người/5ph)</th><th>HC5 (%)</th><th>Nhu cầu cao điểm (% dân số/5 phút)</th><th>AWT ước tính (s)</th><th>Tải tại nhu cầu</th><th>Kết luận</th></tr></thead><tbody>';
    rs.forEach(function (r) {
      const e = r.e, g = r.g;
      if (e.errors.length) { h += '<tr><td>' + esc(g.name) + '</td><td colspan="12" class="bad">' + esc(e.errors.join(' ')) + '</td></tr>'; return; }
      const dem = e.dem ? (e.dem.overload ? '<span class="bad">Quá tải</span>' : fmt(e.dem.lf * 100, 0) + '%') : '—';
      h += '<tr><td><b>' + esc(g.name) + '</b></td><td>' + e.L + ' × ' + fmt(+g.Q, 0) + ' kg, ' + fmt(+g.v, 2) + ' m/s</td><td class="num">' + e.CC + '</td><td class="num">' + fmt(e.pop, 0) +
        '</td><td class="num">' + fmt(e.travel, 1) + '</td><td class="num">' + fmt(e.cap.rtt, 1) + '</td><td class="num">' + fmt(e.cap.int, 1) + '</td><td class="num">' + fmt(e.cap.hc5, 1) +
        '</td><td class="num">' + fmt(e.cap.hc5pct, 2) + '</td><td class="dem">' + demandCtl(g, e.pop) + '</td><td class="num">' + (e.dem && !e.dem.overload ? fmt(e.dem.awt, 1) : '—') + '</td><td class="num">' + dem + '</td><td>' + badge(e.pass) + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function detail(r) {
    const e = r.e, g = r.g, gi = r.gi;
    if (e.errors.length) return '<div class="card"><h3>' + esc(g.name) + '</h3><p class="bad">' + esc(e.errors.join(' ')) + '</p></div>';
    const c = e.cap;
    let h = '<div class="card"><div class="row-between"><h3>' + esc(g.name) + ' — ' + e.L + ' × ' + fmt(+g.Q, 0) + ' kg (' + e.CC + ' người), ' + fmt(+g.v, 2) + ' m/s</h3>' + badge(e.pass) + '</div>';
    if (e.warnings.length) h += '<ul class="warnlist">' + e.warnings.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
    h += '<div class="cols2"><div><h4>Cao điểm lên — năng lực tại hệ số tải ' + fmt(+g.lf, 0) + '%</h4><table class="kv">' +
      kv('Số khách trung bình/chuyến P', fmt(c.P, 2) + ' người') +
      kv('Số điểm dừng kỳ vọng vùng trên S', fmt(c.SU, 2)) +
      kv('Số điểm dừng kỳ vọng tại ga vào S<sub>E</sub>', fmt(c.SE, 2)) +
      kv('Cao độ đảo chiều cao nhất kỳ vọng H', '+' + fmt(c.Htop, 2) + ' m') +
      kv('Cao độ ga vào thấp nhất kỳ vọng', fmt(c.Lbot, 2) + ' m') +
      kv('Khoảng cách tầng trung bình d<sub>f</sub>', fmt(c.df, 2) + ' m') +
      kv('Thời gian chạy 1 tầng t<sub>f</sub>(d<sub>f</sub>)', fmt(c.tfd, 2) + ' s') +
      kv('Thời gian tổn thất mỗi điểm dừng t<sub>s</sub>', fmt(c.ts, 2) + ' s') +
      kv('Chạy ở vận tốc định mức 2D/v', fmt(c.tRun, 1) + ' s') +
      kv('Dừng (S + S<sub>E</sub>)·t<sub>s</sub>', fmt(c.tStops, 1) + ' s') +
      kv('Hành khách ra/vào 2P·t<sub>p</sub>', fmt(c.tPax, 1) + ' s') +
      kv('<b>Thời gian vòng chạy RTT</b>', '<b>' + fmt(c.rtt, 1) + ' s</b>') +
      kv('<b>Khoảng cách chuyến INT = RTT/L</b>', '<b>' + fmt(c.int, 1) + ' s</b>') +
      kv('<b>Năng lực 5 phút HC5 = 300·P·L/RTT</b>', '<b>' + fmt(c.hc5, 1) + ' người (' + fmt(c.hc5pct, 2) + '%)</b>') +
      kv('Thời gian chờ TB ước tính AWT', fmt(c.awt, 1) + ' s') +
      kv('Thời gian trong cabin TB ước tính ATT', fmt(c.att, 1) + ' s') +
      kv('Thời gian đến đích TB ước tính AJT', fmt(c.ajt, 1) + ' s') +
      kv('Hành trình ga vào thấp nhất → tầng cao nhất', fmt(e.travel, 2) + ' m; chạy thẳng ' + fmt(e.tExpress, 1) + ' s') +
      '</table></div><div><h4>Điểm làm việc theo nhu cầu ' + fmt(+g.demand, 1) + '% dân số/5 phút ' + demandNote(g) + '</h4>';
    if (!e.dem) h += '<p class="hint">Chưa nhập nhu cầu cao điểm.</p>';
    else if (e.dem.overload) h += '<p class="bad"><b>Quá tải:</b> nhu cầu ' + fmt(e.dem.lam5, 0) + ' người/5 phút vượt năng lực tối đa của nhóm kể cả khi cabin đầy 100%.</p>';
    else h += '<table class="kv">' + kv('Nhu cầu', fmt(e.dem.lam5, 1) + ' người/5 phút') + kv('Khách/chuyến cân bằng P', fmt(e.dem.P, 2) + ' người') +
      kv('Hệ số tải P/CC', fmt(e.dem.lf * 100, 1) + '%') + kv('RTT', fmt(e.dem.rtt, 1) + ' s') + kv('INT', fmt(e.dem.int, 1) + ' s') +
      kv('AWT ước tính', fmt(e.dem.awt, 1) + ' s') + kv('ATT ước tính', fmt(e.dem.att, 1) + ' s') + kv('AJT ước tính', fmt(e.dem.ajt, 1) + ' s') + '</table>' +
      (e.dem.lf > 0.8 ? '<p class="hint warnline">Hệ số tải &gt; 80%: công thức AWT ngoài phạm vi áp dụng, thời gian chờ thực tế tăng mạnh — kiểm tra bằng mô phỏng.</p>' : '');
    h += '<h4>Kiểm tra tiêu chí</h4><table class="tbl small"><thead><tr><th>Chỉ tiêu</th><th>Yêu cầu</th><th>Kết quả</th><th>Kết luận</th></tr></thead><tbody>' +
      e.checks.map(function (k) { return '<tr><td>' + k.label + '</td><td>' + k.op + ' ' + fmt(k.target, 1) + ' ' + k.unit + '</td><td class="num">' + fmt(k.val, 2) + '</td><td>' + badge(k.ok) + '</td></tr>'; }).join('') +
      '</tbody></table><h4>Ga vào (cao điểm lên)</h4><p class="hint">' + gi.entr.map(function (f) { return esc(f.name) + ' ' + fmt(f.p * 100, 1) + '%'; }).join(' · ') + '</p></div></div></div>';
    return h;
  }
  /* Ghi chú nguồn của nhu cầu cao điểm: mặc định của phần mềm là giả định, chưa trích từ tiêu chuẩn. */
  function demandNote(g, plain) {
    let txt;
    if (g.demandSrc) txt = 'nguồn: ' + g.demandSrc;
    else if (!g.demandSet) txt = 'giả định mặc định ArchiLift, chưa trích tiêu chuẩn — cần xác minh theo CIBSE Guide D / ISO 8100-30 hoặc yêu cầu CĐT';
    else txt = 'chưa ghi nguồn — cần xác minh';
    return plain ? esc(txt) : '<small class="note' + (g.demandSrc ? ' src' : '') + '">(' + esc(txt) + ')</small>';
  }
  /* Ô nhập nhu cầu: chọn mức sẵn hoặc tự nhập + nguồn; hiển thị λ = nhu cầu × dân số (đầu vào công thức). */
  const DEMAND_OPTS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17];
  function demandCtl(g, pop) {
    const custom = g.demandCustom || DEMAND_OPTS.indexOf(+g.demand) < 0;
    const lam5 = (+g.demand || 0) / 100 * (pop || 0);
    return '<span class="noprint dem-ctl"><select data-bind="demandSel.' + g.id + '">' +
      DEMAND_OPTS.map(function (x) { return '<option value="' + x + '"' + (!custom && +g.demand === x ? ' selected' : '') + '>' + fmt(x, 0) + '%</option>'; }).join('') +
      '<option value="custom"' + (custom ? ' selected' : '') + '>Tự nhập…</option></select>' +
      (custom ? '<input type="number" step="any" class="w-xs" data-bind="group.' + g.id + '.demand" value="' + esc(g.demand) + '">%' : '') +
      ' <b>= ' + fmt(lam5, 1) + ' người/5ph</b>' +
      '<input type="text" class="dem-src" data-bind="group.' + g.id + '.demandSrc" value="' + esc(g.demandSrc || '') + '" placeholder="Nguồn: tiêu chuẩn, điều khoản, yêu cầu CĐT…"></span>' +
      '<span class="printonly"><b>' + fmt(+g.demand, 1) + '%</b> = ' + fmt(lam5, 1) + ' người/5ph</span> ' + demandNote(g);
  }
  function kv(k, v) { return '<tr><td>' + k + '</td><td class="num">' + v + '</td></tr>'; }
  function vCalc() {
    if (!S.groups.length) return '<div class="card"><p>Chưa có nhóm thang — vào tab <b>2. Nhóm thang</b>.</p></div>';
    const rs = evalAll();
    return '<div class="card"><div class="row-between"><h2>Tổng hợp — cao điểm lên (phương pháp tính RTT)</h2><div class="btns"><button data-act="csv">Xuất CSV (Excel)</button></div></div>' + summaryTable(rs) +
      '<p class="hint">HC5, INT tính tại hệ số tải tính toán (mặc định 80% CC). Cột AWT/Tải tại nhu cầu: điểm cân bằng khi lượng khách đến bằng nhu cầu cao điểm nhập ở nhóm thang.</p></div>' + rs.map(detail).join('');
  }

  /* ---------- 4. Chọn thang ---------- */
  function vSizing() {
    if (!S.groups.length) return '<div class="card"><p>Chưa có nhóm thang.</p></div>';
    const z = S.sizing, g = groupById(z.groupId);
    let h = '<div class="card"><h2>Chọn số lượng, tải trọng, vận tốc thang tự động</h2><p class="hint">Duyệt mọi tổ hợp số cabin × tải trọng × vận tốc với tầng phục vụ, dân số, thông số cửa và tiêu chí của nhóm đã chọn; giữ các phương án đạt mọi tiêu chí, sắp xếp ít cabin → tải nhỏ → vận tốc thấp.</p><div class="grid4">' +
      field('Nhóm thang', sel('sizing.groupId', g.id, S.groups.map(function (x) { return [x.id, x.name]; }))) +
      field('Số cabin tối đa', inp('sizing.maxL', z.maxL, { step: 1 })) +
      field('Các tải trọng xét (kg)', inp('sizing.loads', z.loads, { type: 'text' })) +
      field('Các vận tốc xét (m/s)', inp('sizing.speeds', z.speeds, { type: 'text' })) +
      field('Tải trọng tối thiểu (kg)', inp('sizing.qMin', z.qMin || '', { ph: 'không giới hạn' }), 'vd. yêu cầu thang chở cáng / đồ đạc') +
      field('Vận tốc tối đa (m/s)', inp('sizing.vMax', z.vMax || '', { ph: 'không giới hạn' })) +
      field('Thời gian chạy thẳng tối đa (s)', inp('sizing.tMax', z.tMax || '', { ph: 'không xét' }), 'ga vào thấp nhất → tầng cao nhất') +
      '</div><p class="hint">Tiêu chí đang dùng của nhóm: HC5 ≥ ' + fmt(+g.crit.hc5, 1) + '%, ' + (+g.crit.int > 0 ? 'INT ≤ ' + fmt(+g.crit.int, 0) + ' s' : 'không xét INT') + (+g.crit.awt > 0 ? ', AWT ≤ ' + fmt(+g.crit.awt, 0) + ' s' : '') + ', hệ số tải tại nhu cầu ' + fmt(+g.demand, 1) + '%/5ph ≤ ' + fmt(+g.lf || 80, 0) + '%.</p>' +
      '<p class="curcfg">Nhóm <b>' + esc(g.name) + '</b> đang khai báo ở tab 2: <b>L = ' + fmt(+g.L, 0) + ' cabin, Q = ' + fmt(+g.Q, 0) + ' kg, v = ' + fmt(+g.v, 2) + ' m/s</b>. Ô "Số cabin tối đa" chỉ là giới hạn tìm kiếm; bấm <b>Áp dụng</b> ở một phương án thì tab 2 mới đổi theo. Dòng trùng cấu hình hiện tại được tô vàng.</p>' +
      '<button class="pri" data-act="runSizing">Tính phương án</button></div>';
    if (lastSizing && lastSizing.gid === g.id) {
      const r = lastSizing.r;
      if (!r.all.length) h += '<div class="card"><p class="bad">Không có phương án nào đạt trong phạm vi đã xét. Tăng số cabin tối đa, thêm tải trọng/vận tốc, hoặc xem xét phân vùng (chia nhóm thang theo dải tầng).</p></div>';
      else {
        h += '<div class="card"><h3>Phương án gọn nhất theo từng số cabin</h3><p class="hint">Ưu tiên tổ hợp tải × vận tốc có trong kho dữ liệu hãng (tab 7). Cột "Kho hãng": <b>có</b> = có dòng máy trong kho cho tổ hợp này; <b class="bad">không</b> = chưa thấy hãng nào trong kho có tổ hợp này, cần hỏi hãng trước khi dùng.</p>' + sizingTable(r.perL, g) + '</div>';
        h += '<div class="card"><h3>Tất cả phương án đạt (' + r.all.length + ', hiển thị tối đa 60)</h3>' + sizingTable(r.all.slice(0, 60), g) + '</div>';
        const ci = r.all.findIndex(function (x) { return +x.L === +g.L && +x.Q === +g.Q && Math.abs(+x.v - +g.v) < 1e-6; });
        if (ci < 0) h += '<p class="curcfg">Cấu hình đang khai báo ở tab 2 (' + fmt(+g.L, 0) + ' × ' + fmt(+g.Q, 0) + ' kg, ' + fmt(+g.v, 2) + ' m/s) <b>không có trong các phương án đạt</b>: không đạt tiêu chí, hoặc nằm ngoài phạm vi đã xét (số cabin tối đa, tải trọng, vận tốc).</p>';
        else if (ci >= 60) h += '<p class="curcfg">Cấu hình đang khai báo ở tab 2 có đạt, nằm ở vị trí ' + (ci + 1) + ' trong ' + r.all.length + ' phương án (ngoài 60 dòng hiển thị).</p>';
      }
    }
    return h;
  }
  function sizingTable(list, g) {
    return '<div class="tblwrap"><table class="tbl sizing"><thead><tr><th>Cabin</th><th>Tải trọng (kg)</th><th>CC</th><th>Vận tốc (m/s)</th><th>RTT (s)</th><th>INT (s)</th><th>HC5 (%)</th><th>Tải tại nhu cầu</th><th>AWT tại nhu cầu (s)</th><th>Chạy thẳng (s)</th><th>Kho hãng</th><th></th></tr></thead><tbody>' +
      list.map(function (r) {
        const cur = +r.L === +g.L && +r.Q === +g.Q && Math.abs(+r.v - +g.v) < 1e-6;
        return '<tr' + (cur ? ' class="curcfg-row" title="Cấu hình đang dùng ở tab 2"' : '') + '><td class="num">' + r.L + '</td><td class="num">' + fmt(r.Q, 0) + '</td><td class="num">' + r.CC + '</td><td class="num">' + fmt(r.v, 2) + '</td><td class="num">' + fmt(r.rtt, 1) +
          '</td><td class="num">' + fmt(r.int, 1) + '</td><td class="num">' + fmt(r.hc5pct, 2) + '</td><td class="num">' + (r.lfDem != null ? fmt(r.lfDem * 100, 0) + '%' : '—') + '</td><td class="num">' + (r.awtDem != null ? fmt(r.awtDem, 1) : '—') +
          '</td><td class="num">' + fmt(r.tExpress, 1) + '</td><td>' + (r.inLib === true ? 'có' : r.inLib === false ? '<span class="bad">không</span>' : '—') + '</td><td>' + (cur ? '<b>Đang dùng</b>' : '<button data-act="applySizing" data-id="' + r.L + '|' + r.Q + '|' + r.v + '">Áp dụng</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function parseList(s) { return String(s).split(/[;,\s]+/).map(num).filter(function (x) { return x > 0; }); }

  /* ---------- 5. Mô phỏng ---------- */
  function vSim() {
    if (!S.groups.length) return '<div class="card"><p>Chưa có nhóm thang.</p></div>';
    const m = S.sim, g = groupById(m.groupId);
    let h = '<div class="card"><h2>Mô phỏng vận hành nhóm thang</h2><p class="hint">Sinh hành khách ảo (tầng đi, tầng đến, thời điểm gọi — phân bố Poisson) và mô phỏng từng cabin: tăng/giảm tốc, cửa, sức chứa, điều khiển tập hợp hai chiều. Kết quả là trung bình của nhiều lần chạy với hạt giống ngẫu nhiên khác nhau.</p><div class="grid5">' +
      field('Nhóm thang', sel('sim.groupId', g.id, S.groups.map(function (x) { return [x.id, x.name]; }))) +
      field('Kịch bản giao thông', sel('sim.profile', m.profile, Object.keys(AL.PROFILES).map(function (k) { return [k, AL.PROFILES[k].label]; }))) +
      field('Cường độ đến (% dân số/5 phút)', inp('sim.rate', m.rate)) +
      field('Đi lên từ ga vào (%)', inp('sim.inc', m.inc)) +
      field('Đi xuống ga vào (%)', inp('sim.out', m.out)) +
      field('Giữa các tầng (%)', inp('sim.inter', m.inter)) +
      field('Thời gian đo (s)', inp('sim.dur', m.dur, { step: 60 })) +
      field('Khởi động bỏ qua (s)', inp('sim.warm', m.warm, { step: 60 })) +
      field('Số lần chạy', inp('sim.runs', m.runs, { step: 1 })) +
      field('Hạt giống', inp('sim.seed', m.seed, { step: 1 })) +
      field('Đón lệnh gọi giữa đường', sel('sim.midRoute', m.midRoute === false ? 'off' : 'on', [['on', 'Bật'], ['off', 'Tắt']])) +
      field('Điều khiển nhóm', sel('sim.ctrl', m.ctrl === 'dcs' ? 'dcs' : 'col', [['col', 'Tập hợp hai chiều (gọi tầng thường)'], ['dcs', 'Gọi tầng đích (DCS)']])) +
      field('Sức chở khi mô phỏng (% định mức)', inp('sim.cap', m.cap == null ? 100 : m.cap, { step: 5 })) +
      '</div><p class="hint">Nhóm: ' + simCap(g, m) + ' người/cabin khi mô phỏng (định mức ' + AL.capacityFromLoad(g.Q) + ') × ' + g.L + ' cabin, ' + fmt(+g.v, 2) + ' m/s. Tỷ lệ lên/xuống/giữa tầng tự chuẩn hoá khi tổng ≠ 100%.</p>' +
      '<p class="hint">Thời gian đo mặc định 28 800 s (8 giờ, như Schindler); ISO 8100-32 yêu cầu tối thiểu 7 200 s (2 giờ). Đón lệnh gọi giữa đường: cabin đang chạy dừng thêm ở tầng có lệnh gọi cùng chiều nếu còn kịp hãm. DCS: khách nhập tầng đến tại sảnh, được phân ngay một cabin, gom khách cùng tầng đến để giảm số lần dừng. Sức chở: số khách tối đa trong cabin khi mô phỏng — Kone dùng ~80% (14/18 người), để 100% nếu theo định mức.</p>' +
      '<button class="pri" data-act="runSim">Chạy mô phỏng</button> <span id="simStatus" class="hint"></span>' +
      '<h3>Quét nhiều mức nhu cầu</h3><p class="hint">Chạy lại mô phỏng ở từng mức nhu cầu (giữ nguyên kịch bản, tỷ lệ chuyến đi, thời gian đo, số lần chạy) để tìm mức nhu cầu cao nhất mà nhóm thang còn phục vụ được — cách làm của báo cáo Schindler.</p><div class="grid5">' +
      field('Các mức nhu cầu (% dân số/5 phút)', inp('sim.sweep', m.sweep == null ? '4, 5, 6, 7, 8, 9, 10, 11, 12' : m.sweep, { type: 'text', ph: 'vd: 5, 6, 7, 8' })) +
      '</div><button class="pri" data-act="runSweep">Quét nhu cầu</button> <span id="sweepStatus" class="hint"></span></div>';
    if (lastSim && lastSim.gid === g.id) h += simResult(lastSim);
    if (lastSweep && lastSweep.gid === g.id) h += sweepResult(lastSweep);
    return h;
  }
  /* Một lượt chạy bị coi là ùn tắc (hàng chờ không ổn định) nếu: > 2% khách chưa được phục vụ khi kết thúc,
     hoặc năng lực thực P5 < 95% nhu cầu sinh ra, hoặc hàng chờ 1/4 cuối giai đoạn đo > 2 lần 1/4 đầu (và hơn 10 người). */
  function simSaturated(m) {
    return m.unserved > 0.02 * m.n || m.hc5 < 0.95 * m.demand5 || (m.qLast > 2 * m.qFirst && m.qLast - m.qFirst > 10);
  }
  function satRuns(r) { return (r.each || [r.mean]).filter(simSaturated).length; }
  function simCfg(m) {
    const sum = (+m.inc || 0) + (+m.out || 0) + (+m.inter || 0);
    if (!(sum > 0)) return null;
    return { rate: +m.rate, inc: (+m.inc / sum) * 100, out: (+m.out / sum) * 100, inter: (+m.inter / sum) * 100, dur: +m.dur, warm: +m.warm, seed: +m.seed || 1,
      homing: AL.PROFILES[m.profile].homing, midRoute: m.midRoute !== false, ctrl: m.ctrl === 'dcs' ? 'dcs' : 'col', cap: +m.cap > 0 ? Math.min(100, +m.cap) : 100 };
  }
  function simCap(g, m) { const c = +m.cap > 0 ? Math.min(100, +m.cap) : 100; return Math.max(1, Math.floor(AL.capacityFromLoad(g.Q) * c / 100 + 1e-9)); }
  function simCfgText(cfg, g, withRate) {
    return (withRate ? fmt(cfg.rate, 1) + '%/5ph · ' : '') + 'lên ' + fmt(cfg.inc, 0) + '% / xuống ' + fmt(cfg.out, 0) + '% / giữa tầng ' + fmt(cfg.inter, 0) + '% · ' + g.L + '×' + g.Q + 'kg, ' + g.v + ' m/s · đo ' + fmt(cfg.dur / 3600, 1) + ' giờ · ' + (cfg.ctrl === 'dcs' ? 'DCS' : 'tập hợp, đón giữa đường: ' + (cfg.midRoute ? 'bật' : 'tắt')) + (cfg.cap < 100 ? ' · sức chở ' + fmt(cfg.cap, 0) + '%' : '');
  }
  function sweepResult(W) {
    // giới hạn phục vụ: mức cao nhất còn đáp ứng mà mọi mức thấp hơn cũng đáp ứng
    let lim = null;
    for (let i = 0; i < W.rows.length && !W.rows[i].sat; i++) lim = W.rows[i];
    const td = function (x, d) { return '<td class="num">' + fmt(x, d) + '</td>'; };
    return '<div class="card"><div class="row-between"><h3>Quét mức nhu cầu — ' + esc(W.label) + ' · ' + esc(W.cfgText) + '</h3>' +
      (lim ? '<span class="b ok">Giới hạn phục vụ ≈ ' + fmt(lim.rate, 1) + '% (' + fmt(lim.m.hc5, 1) + ' người/5 phút)</span>' : '<span class="b bad">Ùn tắc ngay từ mức thấp nhất</span>') + '</div>' +
      '<table class="tbl small"><thead><tr><th>Nhu cầu đặt<br>(%/5 phút)</th><th>Nhu cầu sinh<br>(người/5 phút)</th><th>P5 – vận chuyển thực<br>(người/5 phút)</th><th>HC5 thực<br>(%)</th><th>WT<br>(s)</th><th>WT P90<br>(s)</th><th>DT<br>(s)</th><th>IS<br>(lần dừng)</th><th>LW &gt; 60 s<br>(%)</th><th>LW &gt; 90 s<br>(%)</th><th>Khách chưa<br>phục vụ</th><th>Trạng thái</th></tr></thead><tbody>' +
      W.rows.map(function (x) {
        const m = x.m;
        return '<tr' + (x === lim ? ' class="curcfg-row"' : '') + '>' + td(x.rate, 1) + td(m.demand5, 1) + td(m.hc5, 1) + td(m.hc5pct, 2) + td(m.awt, 1) + td(m.wt90, 1) + td(m.ajt, 1) + td(m.is, 2) + td(m.lw60, 1) + td(m.lw90, 1) + td(m.unserved, 0) +
          '<td style="white-space:nowrap">' + (!x.sat ? '<span class="b ok">Đáp ứng</span>' : x.satK < x.runs ? '<span class="b bad" title="' + x.satK + '/' + x.runs + ' lượt chạy bị ùn tắc">Bất ổn ' + x.satK + '/' + x.runs + '</span>' : '<span class="b bad">Ùn tắc</span>') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="cols2"><div><h4>WT – thời gian chờ trung bình theo mức nhu cầu</h4><canvas id="cvSwWT"></canvas></div><div><h4>LW – tỷ lệ chờ &gt; 90 s theo mức nhu cầu</h4><canvas id="cvSwLW"></canvas></div></div>' +
      '<p class="hint">Mỗi mức là trung bình ' + W.runs + ' lần chạy. Mỗi lượt bị coi là ùn tắc (hàng chờ tăng không dừng) nếu năng lực thực P5 &lt; 95% nhu cầu sinh ra, hoặc &gt; 2% khách chưa được phục vụ khi kết thúc, hoặc số người chờ ở 1/4 cuối giai đoạn đo gấp hơn 2 lần 1/4 đầu. "Bất ổn": chỉ một số lượt ùn tắc — đã sát giới hạn. Giới hạn phục vụ là mức cao nhất mà nó và mọi mức thấp hơn đều đáp ứng. P5, WT, DT, IS, LW theo định nghĩa ISO 8100-32 / báo cáo Schindler (WT tính đến lúc cabin tới tầng, IS = số lần dừng giữa tầng lên và tầng đích).</p></div>';
  }
  function drawSweep() {
    if (!lastSweep || !$('#cvSwWT')) return;
    const R = lastSweep.rows, lab = R.map(function (x) { return fmt(x.rate, 1) + '%'; }), flag = R.map(function (x) { return x.sat; });
    AL.barChart($('#cvSwWT'), lab, R.map(function (x) { return x.m.awt; }), { ylabel: 'WT (s)', xlabel: 'Nhu cầu (% dân số/5 phút) — cột đỏ: ùn tắc', flag: flag, height: 220 });
    AL.barChart($('#cvSwLW'), lab, R.map(function (x) { return x.m.lw90; }), { ylabel: 'LW > 90 s (%)', xlabel: 'Nhu cầu (% dân số/5 phút) — cột đỏ: ùn tắc', flag: flag, height: 220 });
  }
  function simResult(L) {
    const m = L.r.mean, mn = L.r.min, mx = L.r.max;
    const row = function (lab, k, d, u) { return '<tr><td>' + lab + '</td><td class="num"><b>' + fmt(m[k], d) + '</b></td><td class="num">' + fmt(mn[k], d) + ' – ' + fmt(mx[k], d) + '</td><td>' + (u || '') + '</td></tr>'; };
    const sat = satRuns(L.r) > 0;
    return '<div class="card"><div class="row-between"><h3>Kết quả mô phỏng — ' + esc(L.label) + ' · ' + esc(L.cfgText) + '</h3>' +
      (sat ? '<span class="b bad">Nguy cơ ùn tắc</span>' : '<span class="b ok">Hệ thống đáp ứng</span>') + '</div><div class="cols2"><div><table class="tbl small"><thead><tr><th>Chỉ tiêu</th><th>Trung bình</th><th>Khoảng ' + L.r.runs + ' lần</th><th>Đơn vị</th></tr></thead><tbody>' +
      row('Số hành khách trong giai đoạn đo', 'n', 0, 'người') + row('Nhu cầu thực sinh ra', 'demand5', 1, 'người/5 phút') +
      row('Năng lực vận chuyển thực HC5', 'hc5', 1, 'người/5 phút') + row('HC5 thực (% dân số)', 'hc5pct', 2, '%') +
      row('<b>WT</b> – thời gian chờ trung bình (AWT)', 'awt', 1, 's') + row('Thời gian chờ trung vị', 'wt50', 1, 's') +
      row('Thời gian chờ phân vị 90%', 'wt90', 1, 's') + row('Thời gian chờ phân vị 95%', 'wt95', 1, 's') + row('Thời gian chờ lớn nhất', 'wtMax', 1, 's') +
      row('<b>LW</b> – tỷ lệ chờ &gt; 60 s', 'lw60', 1, '%') + row('<b>LW</b> – tỷ lệ chờ &gt; 90 s (ISO 8100-32)', 'lw90', 1, '%') +
      row('<b>IS</b> – số lần dừng giữa tầng lên và tầng đích', 'is', 2, 'lần') + row('<b>TT</b> – thời gian trong cabin TB (ATT)', 'att', 1, 's') +
      row('<b>DT</b> – thời gian đến đích TB (AJT)', 'ajt', 1, 's') + row('Thời gian đến đích phân vị 95%', 'jt95', 1, 's') +
      row('Khách chưa được phục vụ khi kết thúc', 'unserved', 1, 'người') + row('Thời gian xả hàng chờ sau giai đoạn sinh khách', 'overrun', 0, 's') +
      row('Số lần dừng/cabin/giờ', 'stopsPerCarHour', 0, 'lần') +
      '</tbody></table></div><div><h4>Phân bố thời gian chờ</h4><canvas id="cvHist"></canvas><h4>Số người đang chờ theo thời gian (biểu đồ ùn tắc)</h4><canvas id="cvQueue"></canvas></div></div>' +
      '<h4>Thời gian chờ trung bình theo tầng xuất phát</h4><canvas id="cvFloor"></canvas>' +
      '<p class="hint">Mô phỏng nội bộ phục vụ so sánh phương án; điều khiển nhóm đơn giản hoá (' + (L.cfg.ctrl === 'dcs' ? 'gọi tầng đích DCS: phân cabin ngay khi gọi theo thời gian chờ ước tính + số điểm dừng mới, không dùng thuật toán riêng của hãng' : (L.cfg.midRoute ? 'điều khiển tập hợp hai chiều, có đón lệnh gọi giữa đường' : 'cabin chỉ chọn điểm dừng kế tiếp khi khởi hành, không đón lệnh gọi giữa đường') + ', không có điều khiển đích đến DCS') + ') nên kết quả thiên về an toàn. Cần đối chiếu với mô phỏng của nhà thầu thang máy trước khi chốt phương án.</p></div>';
  }
  function drawSim() {
    if (!lastSim || !$('#cvHist')) return;
    const r = lastSim.r, bins = 26, bw = 5, cnt = new Array(bins).fill(0);
    r.wt.forEach(function (w) { cnt[Math.min(bins - 1, Math.floor(w / bw))]++; });
    const tot = r.wt.length || 1;
    AL.barChart($('#cvHist'), cnt.map(function (_, i) { return i === bins - 1 ? '≥' + i * bw : String(i * bw); }), cnt.map(function (c) { return (c / tot) * 100; }),
      { ylabel: '% hành khách', xlabel: 'Thời gian chờ (s)', flag: cnt.map(function (_, i) { return i * bw >= 60; }) });
    AL.lineChart($('#cvQueue'), r.samples.map(function (s) { return s.t / 60; }), r.samples.map(function (s) { return s.wait; }),
      { ylabel: 'Người chờ', xlabel: 'Thời gian (phút) — vạch vàng: hết khởi động', mark: (+lastSim.cfg.warm || 0) / 60, xfmt: function (x) { return fmt(x, 0); } });
    const pf = r.perFloor.filter(function (f) { return f.n > 0; });
    AL.barChart($('#cvFloor'), pf.map(function (f) { return f.name; }), pf.map(function (f) { return f.awt; }), { ylabel: 'AWT (s)', xlabel: 'Tầng xuất phát', flag: pf.map(function (f) { return f.awt > 60; }), height: 220 });
  }

  /* ---------- 6. Báo cáo ---------- */
  function vReport() {
    const fl = AL.computeElevations(S), now = new Date();
    const rs = evalAll().filter(function (r) { return kindOf(r.g) !== 'R'; });   // thang rác: không tính giao thông
    let h = '<div class="card noprint"><div class="row-between"><h2>Báo cáo phân tích giao thông thang máy</h2><div class="btns"><button class="pri" data-act="print">In / Lưu PDF</button><button data-act="csv">Xuất CSV (Excel)</button></div></div><p class="hint">Trình duyệt → In → chọn "Microsoft Print to PDF"/"Lưu dưới dạng PDF". Kết quả mô phỏng gần nhất (nếu có) được đưa vào báo cáo.</p></div>';
    h += '<div class="card report"><div class="rep-head"><div><div class="brand">ARCHIVINA · ArchiLift</div><h1>Phân tích giao thông thang máy</h1><div>' + esc(S.project.name) + (S.project.code ? ' — ' + esc(S.project.code) : '') + '</div></div><div class="rep-meta">Ngày: ' + now.toLocaleDateString('vi-VN') + (S.project.author ? '<br>Người lập: ' + esc(S.project.author) : '') + '</div></div>';
    if (S.project.note) h += '<p>' + esc(S.project.note) + '</p>';
    // mục 1–3 ở cột trái, mặt cắt hành trình ở cột phải kéo dài theo cả 3 mục
    h += '<div class="sec1grid"><div class="sec1-main">' +
      '<h3>1. Mặt bằng vị trí và Mặt cắt hành trình</h3>' + planSection() +
      '<h3>2. Kết luận theo loại thang</h3>' + kindConclusion(rs) +
      '<h3>3. Kết quả tính cao điểm lên từng nhóm</h3>' + (rs.length ? summaryCompact(rs) : '<p class="hint">Chưa có nhóm thang cần tính giao thông.</p>') +
      '</div><div class="sec1-side"><h4>Mặt cắt hành trình</h4>' + travelSection(fl) + '</div></div>';
    h += '<h3>4. Cấu hình nhóm thang</h3><table class="tbl small"><thead><tr><th>Nhóm</th><th>Loại</th><th>L</th><th>Q (kg)</th><th>CC</th><th>v (m/s)</th><th>a</th><th>j</th><th>t<sub>o</sub></th><th>t<sub>c</sub></th><th>t<sub>sd</sub></th><th>t<sub>p</sub></th><th>Tiêu chí</th><th>Nhu cầu cao điểm (% dân số/5 phút)</th></tr></thead><tbody>' +
      S.groups.map(function (g) {
        return '<tr><td>' + esc(g.name) + '</td><td>' + kindTag(kindOf(g)) + '</td><td class="num">' + g.L + '</td><td class="num">' + g.Q + '</td><td class="num">' + AL.capacityFromLoad(g.Q) + '</td><td class="num">' + g.v + '</td><td class="num">' + g.a + '</td><td class="num">' + g.j +
          '</td><td class="num">' + g.to + '</td><td class="num">' + g.tc + '</td><td class="num">' + g.tsd + '</td><td class="num">' + g.tp + '</td><td>HC5 ≥ ' + g.crit.hc5 + '%; ' + (+g.crit.int > 0 ? 'INT ≤ ' + g.crit.int + ' s' : 'không xét INT') + (+g.crit.awt > 0 ? '; AWT ≤ ' + g.crit.awt + ' s' : '') + '</td><td class="dem">' + demandCtl(g, AL.buildGroupInput(S, g).pop) + '</td></tr>';
      }).join('') + '</tbody></table>';
    h += '<div class="row-between"><h3>5. Sơ đồ phân vùng phục vụ</h3><label class="chk noprint"><input type="checkbox" data-act="mergeZoning"' + (ui.mergeZoning ? ' checked' : '') + '> Gộp các tầng giống nhau vào 1 dòng</label></div>' +
      '<table class="tbl small zoning"><thead><tr><th>Tầng</th><th>Công năng</th><th>Cao độ (m)</th><th>Dân số</th><th>Ga vào</th>' + S.groups.map(function (g) { return '<th>' + esc(g.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      zoningRows(fl.slice().reverse(), ui.mergeZoning).map(function (r) {
        const f = r[0], last = r[r.length - 1], n = r.length;
        const name = n > 1 ? esc(last.name) + ' – ' + esc(f.name) + ' <small>(' + n + ' tầng)</small>' : esc(f.name);
        const z = n > 1 ? fmt(last.z, 2) + ' ÷ ' + fmt(f.z, 2) : fmt(f.z, 2);
        const pop = f.pop ? fmt(+f.pop, 0) + (n > 1 ? ' /tầng<br><small>Σ ' + fmt(+f.pop * n, 0) + '</small>' : '') : '';
        return '<tr><td>' + name + '</td><td>' + esc(f.func) + '</td><td class="num">' + z + '</td><td class="num">' + pop + '</td><td class="num">' + (f.ent ? fmt(f.ent, 0) + '%' + (n > 1 ? ' /tầng' : '') : '') + '</td>' +
          S.groups.map(function (g) { const c = g.cells[f.id] || {}; return '<td class="ctr">' + (c.s ? '●' + (+f.pop > 0 && +c.sh !== 100 ? ' <small>' + fmt(+c.sh || 0, 0) + '%</small>' : '') : '') + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
    h += '<h3>6. Chi tiết tính toán từng nhóm</h3>' + rs.map(detail).join('');
    if (lastSim) h += '<h3>7. Mô phỏng vận hành</h3><p>Nhóm ' + esc(groupById(lastSim.gid).name) + '</p>' + simResult(lastSim);
    if (lastSweep) h += '<h3>' + (lastSim ? '8' : '7') + '. Quét mức nhu cầu (mô phỏng)</h3><p>Nhóm ' + esc(groupById(lastSweep.gid).name) + '</p>' + sweepResult(lastSweep);
    h += '<h3>Giả định và giới hạn</h3><ul class="small">' +
      '<li>Phương pháp tính: RTT cao điểm lên theo CIBSE Guide D / Barney, mở rộng cho cao tầng không đều, nhiều ga vào (gồm tầng hầm) và vùng tốc hành. Sức chứa cabin CC = Q/75 làm tròn xuống (EN 81-20 / ISO 8100-1).</li>' +
      '<li>Thông số cửa, gia tốc, jerk, thời gian ra/vào và tiêu chí đánh giá là số liệu nhập; giá trị mặc định là điển hình, cần xác nhận với hãng thang và yêu cầu dự án.</li>' +
      '<li>Kết quả phục vụ kiểm tra phương án nội bộ (Concept/TKCS); không thay thế tính toán, mô phỏng của nhà thầu thang máy và chưa được chứng nhận phù hợp ISO 8100-32.</li></ul>' + glossaryHtml() + '</div>';
    return h;
  }

  /* ---------- Báo cáo: mặt bằng công trình + nhãn loại thang ---------- */
  function kindTag(k) { return '<span class="ktag" style="--c:' + KINDS[k].col + '">' + k + '</span>'; }
  function planSection() {
    const P = S.plan || {}, marks = P.marks || [];
    const pk = ui.planKind || 'P';
    let h = '<div class="plan-tools noprint">' +
      '<label class="btnlink">Chọn ảnh…<input type="file" accept="image/*" id="planFile" hidden></label>' +
      '<span class="hint">hoặc copy ảnh mặt bằng rồi bấm <b>Ctrl+V</b> tại tab này, hoặc kéo thả ảnh vào khung</span>' +
      '<label class="inl">Loại thang khi bấm lên ảnh: <select id="planKind">' + Object.keys(KINDS).map(function (k) {
        return '<option value="' + k + '"' + (k === pk ? ' selected' : '') + '>' + k + ' – ' + KINDS[k].label + '</option>'; }).join('') + '</select></label>' +
      (marks.length ? '<button data-act="planClearMarks">Xoá hết nhãn</button>' : '') + (P.img ? '<button class="del" data-act="planDelImg">Xoá ảnh</button>' : '') + '</div>';
    if (P.img) {
      const pw = Math.max(20, Math.min(100, +P.w || 100)), ms = +P.ms || 12;
      h += '<div class="plan-tools noprint"><label class="inl">Cỡ ảnh <input type="range" min="20" max="100" step="5" data-bind="plan.w" value="' + pw + '"> <b id="planWv">' + pw + '%</b></label>' +
        '<label class="inl">Cỡ nhãn ' + sel('plan.ms', ms, [[9, 'Nhỏ'], [12, 'Vừa'], [15, 'Lớn']]) + '</label>' +
        '<span class="hint">Bấm lên ảnh: đặt nhãn · bấm nhãn: sửa ký hiệu / loại / mũi tên · kéo nhãn: dời · kéo chấm đầu mũi tên: dời vị trí chỉ · chuột phải: xoá · kéo góc phải dưới: co kéo ảnh</span></div>';
      const pct = function (v) { return (v * 100).toFixed(3) + '%'; };
      let svg = '<svg class="plan-lead" xmlns="http://www.w3.org/2000/svg"><defs>' + Object.keys(KINDS).map(function (k) {
        return '<marker id="pa-' + k + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.67" markerHeight="4.67" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + KINDS[k].col + '"/></marker>';
      }).join('') + '</defs>';
      let labs = '';
      marks.forEach(function (m, i) {
        const k = KINDS[m.k] ? m.k : 'P', ar = !!m.ar, lx = ar ? m.lx : m.x, ly = ar ? m.ly : m.y;
        if (ar) {
          svg += '<line id="pl' + i + '" x1="' + pct(lx) + '" y1="' + pct(ly) + '" x2="' + pct(m.x) + '" y2="' + pct(m.y) + '" stroke="' + KINDS[k].col + '" stroke-width="1.5" marker-end="url(#pa-' + k + ')"/>';
          labs += '<div class="panchor noprint" data-i="' + i + '" style="left:' + pct(m.x) + ';top:' + pct(m.y) + ';--c:' + KINDS[k].col + '" title="Kéo để dời vị trí mũi tên chỉ"></div>';
        }
        labs += '<div class="pmark' + (ui.planEdit === i ? ' sel' : '') + '" data-i="' + i + '" style="left:' + pct(lx) + ';top:' + pct(ly) + ';--c:' + KINDS[k].col + '" title="' + esc(KINDS[k].label) + ' — bấm để sửa">' + esc(m.n || k) + '</div>';
      });
      svg += '</svg>';
      let ed = '';
      const em = ui.planEdit != null ? marks[ui.planEdit] : null;
      if (em) {
        const ex = em.ar ? em.lx : em.x, ey = em.ar ? em.ly : em.y;
        ed = '<div class="pedit noprint" style="left:' + pct(ex) + ';top:' + pct(ey) + '">' +
          '<label>Ký hiệu <input type="text" id="pe-text" value="' + esc(em.n || em.k) + '"></label>' +
          '<label>Loại <select id="pe-kind">' + Object.keys(KINDS).map(function (k) { return '<option value="' + k + '"' + (k === em.k ? ' selected' : '') + '>' + k + ' – ' + KINDS[k].label + '</option>'; }).join('') + '</select></label>' +
          '<label class="chk"><input type="checkbox" id="pe-arrow"' + (em.ar ? ' checked' : '') + '> Mũi tên chỉ (đưa nhãn ra ngoài)</label>' +
          '<div class="btns"><button class="pri" data-act="planEditClose">Xong</button><button class="del" data-act="planEditDel">Xoá nhãn</button></div></div>';
      }
      h += '<div class="planwrap"><div class="planbox" id="planBox" style="width:' + pw + '%;--ms:' + ms + 'px"><img src="' + P.img + '" draggable="false" alt="Mặt bằng công trình">' +
        svg + labs + ed + '<div class="presize noprint" title="Kéo để co kéo ảnh"></div></div></div>';
    } else h += '<div class="planbox empty noprint" id="planBox">Chưa có ảnh mặt bằng — dán (Ctrl+V), kéo thả hoặc chọn ảnh.</div>';
    h += '<div class="grid6 noprint" style="margin-top:6px">' + field('Chú thích ảnh', inp('plan.caption', P.caption || '', { type: 'text', ph: 'vd. Mặt bằng tầng 1 – lõi thang A, B' })) + '</div>';
    if (P.caption) h += '<p class="caption">' + esc(P.caption) + '</p>';
    // bảng chú giải: số thang đặt trên mặt bằng đối chiếu với số cabin khai báo ở tab 2
    const used = Object.keys(KINDS).filter(function (k) {
      return marks.some(function (m) { return m.k === k; }) || S.groups.some(function (g) { return kindOf(g) === k; });
    });
    if (!used.length) return h;
    h += '<table class="tbl small"><thead><tr><th>Ký hiệu</th><th>Loại thang</th><th>Số thang trên mặt bằng</th><th>Nhóm thang (tab 2)</th><th>Tổng số cabin</th><th>Đối chiếu</th></tr></thead><tbody>' +
      used.map(function (k) {
        const nm = marks.filter(function (m) { return m.k === k; }).length;
        const gs = S.groups.filter(function (g) { return kindOf(g) === k; });
        const nL = gs.reduce(function (a, g) { return a + (+g.L || 0); }, 0);
        const chk = !gs.length ? '<span class="warn">chưa khai báo nhóm thang</span>' : !nm ? '<span class="hint">chưa đặt nhãn trên mặt bằng</span>' :
          nm === nL ? '<span class="ok">khớp</span>' : '<span class="warn">mặt bằng ' + nm + ' ≠ khai báo ' + nL + '</span>';
        return '<tr><td>' + kindTag(k) + '</td><td>' + KINDS[k].label + '</td><td class="num">' + (nm || '—') + '</td><td>' + (gs.map(function (g) { return esc(g.name); }).join('; ') || '—') +
          '</td><td class="num">' + (gs.length ? nL : '—') + '</td><td>' + chk + '</td></tr>';
      }).join('') + '</tbody></table>';
    return h;
  }
  /* Mặt cắt hành trình (sơ đồ): cột tầng + mỗi nhóm thang một cột; chấm = tầng dừng, nét đứt = chạy thẳng không dừng.
     Khoảng cách các tầng vẽ đều (không theo tỉ lệ chiều cao), cao độ ghi bằng số. */
  function travelSection(fl) {
    if (!fl.length || !S.groups.length) return '<p class="hint">Chưa có danh sách tầng / nhóm thang (tab 1, 2) để vẽ mặt cắt hành trình.</p>';
    const RH = 18, FS = 11, top = 64, xName = 8, xZ = 92, xF = 150, x0 = 250, CW = 112, n = fl.length;
    const W = x0 + S.groups.length * CW + 10, H = top + n * RH + 64;
    const y = function (i) { return top + (n - 1 - i) * RH + RH / 2; };     // fl tăng dần từ dưới lên
    let s = '<svg class="travel-svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial" font-size="' + FS + '">';
    s += '<text x="' + xName + '" y="' + (top - 10) + '" font-weight="bold">Tầng</text><text x="' + (xZ + 40) + '" y="' + (top - 10) + '" font-weight="bold" text-anchor="end">Cao độ (m)</text><text x="' + xF + '" y="' + (top - 10) + '" font-weight="bold">Công năng</text>';
    fl.forEach(function (f, i) {
      const yy = y(i), entF = +f.ent > 0;
      if (i % 2 === 0) s += '<rect x="0" y="' + (yy - RH / 2) + '" width="' + W + '" height="' + RH + '" fill="#f4f6f8"/>';
      s += '<line x1="' + xName + '" y1="' + (yy + RH / 2) + '" x2="' + W + '" y2="' + (yy + RH / 2) + '" stroke="#e1e5ea" stroke-width="1"/>';
      s += '<text x="' + xName + '" y="' + (yy + 4) + '"' + (entF ? ' font-weight="bold"' : '') + '>' + esc(f.name) + (entF ? ' ▸' : '') + '</text>';
      s += '<text x="' + (xZ + 40) + '" y="' + (yy + 4) + '" text-anchor="end">' + (f.z >= 0 ? '+' : '') + fmt(f.z, 2) + '</text>';
      s += '<text x="' + xF + '" y="' + (yy + 4) + '" fill="#5d6773">' + esc(String(f.func || '').slice(0, 14)) + '</text>';
    });
    S.groups.forEach(function (g, j) {
      const k = kindOf(g), col = KINDS[k].col, cx = x0 + j * CW + CW / 2;
      const st = []; fl.forEach(function (f, i) { if (g.cells[f.id] && g.cells[f.id].s) st.push(i); });
      s += '<text x="' + cx + '" y="' + (top - 40) + '" text-anchor="middle" font-weight="bold" fill="' + col + '">' + k + '</text>';
      s += '<text x="' + cx + '" y="' + (top - 26) + '" text-anchor="middle">' + esc(String(g.name).slice(0, 16)) + '</text>';
      s += '<text x="' + cx + '" y="' + (top - 12) + '" text-anchor="middle" fill="#5d6773" font-size="' + (FS - 1) + '">' + g.L + '×' + fmt(+g.Q, 0) + 'kg, ' + fmt(+g.v, 2) + ' m/s</text>';
      if (!st.length) { s += '<text x="' + cx + '" y="' + (top + 14) + '" text-anchor="middle" fill="#b9770e">chưa có tầng dừng</text>'; return; }
      const lo = st[0], hi = st[st.length - 1];
      s += '<rect x="' + (cx - 14) + '" y="' + (y(hi) - 6) + '" width="28" height="' + (y(lo) - y(hi) + 12) + '" rx="4" fill="' + col + '" fill-opacity=".12" stroke="' + col + '" stroke-width="1"/>';
      for (let a = 0; a < st.length - 1; a++) {      // giữa 2 tầng dừng liền nhau: liền nét nếu kề tầng, nét đứt nếu bỏ qua tầng (chạy thẳng)
        const ex = st[a + 1] - st[a] > 1;
        s += '<line x1="' + cx + '" y1="' + y(st[a]) + '" x2="' + cx + '" y2="' + y(st[a + 1]) + '" stroke="' + col + '" stroke-width="' + (ex ? 1.5 : 2.5) + '"' + (ex ? ' stroke-dasharray="4 3"' : '') + '/>';
        if (ex && st[a + 1] - st[a] > 3) s += '<text x="' + (cx + 18) + '" y="' + ((y(st[a]) + y(st[a + 1])) / 2 + 4) + '" font-size="' + (FS - 1) + '" fill="' + col + '" transform="rotate(-90 ' + (cx + 18) + ' ' + ((y(st[a]) + y(st[a + 1])) / 2) + ')" text-anchor="middle">chạy thẳng</text>';
      }
      st.forEach(function (i) { s += '<circle cx="' + cx + '" cy="' + y(i) + '" r="4" fill="' + col + '"/>'; });
      const tr = fl[hi].z - fl[lo].z;
      s += '<text x="' + cx + '" y="' + (top + n * RH + 18) + '" text-anchor="middle">H = ' + fmt(tr, 2) + ' m</text>';
      s += '<text x="' + cx + '" y="' + (top + n * RH + 33) + '" text-anchor="middle" fill="#5d6773">' + st.length + ' điểm dừng</text>';
      s += '<text x="' + cx + '" y="' + (top + n * RH + 48) + '" text-anchor="middle" fill="#5d6773" font-size="' + (FS - 1) + '">' + esc(fl[lo].name) + ' → ' + esc(fl[hi].name) + '</text>';
    });
    s += '</svg>';
    return '<div class="travelwrap">' + s + '</div><p class="hint">Sơ đồ — các tầng vẽ cách đều, không theo tỉ lệ chiều cao. ● tầng dừng · nét liền: dừng các tầng liền nhau · nét đứt: chạy thẳng không dừng · ▸ tầng có ga vào. H = hành trình từ tầng dừng thấp nhất đến cao nhất (theo cao độ tab 1).</p>';
  }
  /* Bảng kết quả cao điểm lên dạng gọn cho báo cáo (bảng đầy đủ + chọn nhu cầu vẫn ở tab 3 và mục 4) */
  function summaryCompact(rs) {
    let h = '<table class="tbl small compact"><thead><tr><th>Nhóm · cấu hình</th><th>Dân số<br><small>H (m)</small></th><th>RTT (s)</th><th>INT (s)</th><th>HC5<br><small>người/5ph · %</small></th>' +
      '<th>Nhu cầu<br><small>%/5ph</small></th><th>Tại nhu cầu<br><small>tải · AWT (s)</small></th><th>KL</th></tr></thead><tbody>';
    rs.forEach(function (r) {
      const e = r.e, g = r.g;
      if (e.errors.length) { h += '<tr><td><b>' + esc(g.name) + '</b></td><td colspan="7" class="bad"><small>' + esc(e.errors.join(' ')) + '</small></td></tr>'; return; }
      const dem = e.dem ? (e.dem.overload ? '<span class="bad">Quá tải</span>' : fmt(e.dem.lf * 100, 0) + '% · ' + fmt(e.dem.awt, 1)) : '—';
      h += '<tr><td>' + kindTag(kindOf(g)) + ' <b>' + esc(g.name) + '</b><br><small>' + e.L + ' × ' + fmt(+g.Q, 0) + ' kg (' + e.CC + ' ng), ' + fmt(+g.v, 2) + ' m/s</small></td>' +
        '<td class="num">' + fmt(e.pop, 0) + '<br><small>' + fmt(e.travel, 1) + '</small></td><td class="num">' + fmt(e.cap.rtt, 1) + '</td><td class="num">' + fmt(e.cap.int, 1) + '</td>' +
        '<td class="num">' + fmt(e.cap.hc5, 1) + '<br><small>' + fmt(e.cap.hc5pct, 2) + '%</small></td><td class="num">' + fmt(+g.demand, 1) + '%</td><td class="num">' + dem + '</td><td>' + badge(e.pass) + '</td></tr>';
    });
    return h + '</tbody></table><p class="hint">Bảng đầy đủ, chọn nhu cầu cao điểm và nguồn: mục 4 / tab 3.</p>';
  }
  /* Kết luận giao thông gộp theo loại thang; thang chở rác chỉ liệt kê */
  function kindConclusion(rs) {
    const marks = (S.plan && S.plan.marks) || [];
    const kinds = Object.keys(KINDS).filter(function (k) {
      return S.groups.some(function (g) { return kindOf(g) === k; }) || marks.some(function (m) { return m.k === k; });
    });
    if (!kinds.length) return '<p class="hint">Chưa có nhóm thang — khai báo ở tab 2 và chọn Loại thang.</p>';
    const okK = [], badK = [];
    // bảng gọn: loại (kèm kết luận loại) | nhóm (kèm cấu hình) | INT, HC5 (kèm tiêu chí) | kết luận nhóm
    let h = '<table class="tbl small compact"><thead><tr><th>Loại thang</th><th>Nhóm · cấu hình</th><th>INT (s)</th><th>HC5 (%)</th><th>Kết luận</th></tr></thead><tbody>';
    kinds.forEach(function (k) {
      const head = kindTag(k) + ' ' + KINDS[k].label;
      if (k === 'R') {
        const gs = S.groups.filter(function (g) { return kindOf(g) === 'R'; });
        h += '<tr><td>' + head + '</td><td>' + (gs.map(function (g) { return esc(g.name); }).join('; ') || '—') + '</td><td colspan="3" class="hint">Không tính giao thông</td></tr>';
        return;
      }
      const list = rs.filter(function (r) { return kindOf(r.g) === k; });
      if (!list.length) { h += '<tr><td>' + head + '</td><td colspan="4" class="warn">Chưa khai báo nhóm thang ở tab 2 — chưa có kết luận</td></tr>'; return; }
      const pass = list.every(function (r) { return !r.e.errors.length && r.e.pass; });
      (pass ? okK : badK).push(k);
      list.forEach(function (r, i) {
        const e = r.e, g = r.g;
        h += '<tr>' + (i === 0 ? '<td rowspan="' + list.length + '">' + head + '<br>' + badge(pass) + '</td>' : '') +
          '<td><b>' + esc(g.name) + '</b><br><small>' + e.L + ' × ' + fmt(+g.Q, 0) + ' kg, ' + fmt(+g.v, 2) + ' m/s</small></td>' +
          (e.errors.length ? '<td colspan="2" class="bad"><small>' + esc(e.errors.join(' ')) + '</small></td><td>' + badge(false) + '</td>' :
            '<td class="num">' + fmt(e.cap.int, 1) + '<br><small>' + (+g.crit.int > 0 ? '≤ ' + g.crit.int : 'không xét') + '</small></td><td class="num">' + fmt(e.cap.hc5pct, 2) + '<br><small>≥ ' + g.crit.hc5 + '</small></td>' +
            '<td>' + badge(e.pass) + (+g.crit.awt > 0 ? '<br><small>AWT ≤ ' + g.crit.awt + ' s</small>' : '') + '</td>') + '</tr>';
      });
    });
    h += '</tbody></table>';
    if (okK.length || badK.length) h += '<p><b>Tóm tắt:</b> ' + (okK.length ? 'Đạt — ' + okK.join(', ') + '. ' : '') + (badK.length ? '<span class="bad">Không đạt — ' + badK.join(', ') + '.</span>' : '') + '</p>';
    return h;
  }
  /* ảnh mặt bằng: thu nhỏ (cạnh dài ≤ 2400 px, JPEG) để lưu được trong trình duyệt và file .json */
  function loadPlanImage(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const rd = new FileReader();
    rd.onload = function () {
      const im = new Image();
      im.onload = function () {
        const k = Math.min(1, 2400 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0, c.width, c.height);
        S.plan = S.plan || { marks: [] };
        if (S.plan.img && (S.plan.marks || []).length && !confirm('Thay ảnh mặt bằng? Các nhãn đã đặt giữ nguyên vị trí tương đối.')) return;
        S.plan.img = c.toDataURL('image/jpeg', 0.85); S.plan.marks = S.plan.marks || [];
        save(); render();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  /* Tầng mới: tích sẵn các nhóm thang đang dừng ở tầng kề. Chèn giữa → nhóm dừng ở cả tầng dưới và tầng trên;
     thêm trên cùng → nhóm dừng ở tầng trên cùng cũ. */
  function inheritCells(ids, below, above) {
    S.groups.forEach(function (g) {
      const sb = below ? !!(g.cells[below.id] && g.cells[below.id].s) : null;
      const sa = above ? !!(g.cells[above.id] && g.cells[above.id].s) : null;
      const on = sb === null ? !!sa : sa === null ? sb : sb && sa;
      if (on) ids.forEach(function (id) { g.cells[id] = { s: true, sh: 0 }; });
    });
    ids.forEach(function (id) {
      const f = S.floors.find(function (x) { return x.id === id; });
      if (!f || !(+f.pop > 0)) return;
      const gs = S.groups.filter(function (g) { return g.cells[id] && g.cells[id].s; });
      gs.forEach(function (g) { g.cells[id].sh = Math.round((100 / gs.length) * 100) / 100; });
    });
  }

  /* Gộp các tầng liền kề giống nhau (công năng, dân số, ga vào, tầng dừng và % phân bổ của mọi nhóm). */
  function zoningRows(list, merge, sigFn) {
    const sig = sigFn || function (f) {
      return [f.func, +f.pop || 0, +f.ent || 0].concat(S.groups.map(function (g) { const c = g.cells[f.id] || {}; return c.s ? 's' + (+c.sh || 0) : '-'; })).join('|');
    };
    const rows = [];
    list.forEach(function (f) {
      const last = rows[rows.length - 1];
      if (merge && last && sig(last[0]) === sig(f)) last.push(f); else rows.push([f]);
    });
    return rows;
  }

  /* ---------- Phương pháp ---------- */
  function vMethod() {
    return '<div class="card method"><h2>Phương pháp tính</h2>' +
      '<h3>1. Động học cabin</h3><p>Thời gian chạy quãng d với profile chữ S (vận tốc v, gia tốc a, jerk j): nếu đạt vận tốc định mức, t<sub>f</sub>(d) = d/v + v/a + a/j; quãng ngắn không đạt v được giải chính xác theo vận tốc đỉnh đạt được.</p>' +
      '<h3>2. Thời gian vòng chạy cao điểm lên (RTT)</h3><p>RTT = 2·(H − L<sub>b</sub>)/v + (S + S<sub>E</sub>)·t<sub>s</sub> + 2·P·t<sub>p</sub></p><ul>' +
      '<li>P = CC × hệ số tải (80%): số khách trung bình mỗi chuyến.</li>' +
      '<li>S = Σ[1 − (1 − u<sub>i</sub>)<sup>P</sup>]: số điểm dừng kỳ vọng phía trên; u<sub>i</sub> = tỷ lệ dân số tầng i trong nhóm (tầng dân số không đều).</li>' +
      '<li>H = Σ z<sub>i</sub>·(F<sub>i</sub><sup>P</sup> − F<sub>i−1</sub><sup>P</sup>): cao độ đảo chiều cao nhất kỳ vọng, F là tỷ lệ dân số luỹ kế từ dưới lên — tính theo cao độ thực nên tự xét vùng tốc hành và cao tầng không đều.</li>' +
      '<li>S<sub>E</sub>, L<sub>b</sub>: số điểm dừng kỳ vọng và cao độ thấp nhất kỳ vọng tại các ga vào (sảnh, tầng hầm) theo tỷ lệ "Ga vào %". Khi chỉ có một sảnh, S<sub>E</sub> = 1 và công thức trở về dạng CIBSE (S + 1)·t<sub>s</sub>.</li>' +
      '<li>t<sub>s</sub> = t<sub>f</sub>(d<sub>f</sub>) − d<sub>f</sub>/v + t<sub>o</sub> + t<sub>c</sub> + t<sub>sd</sub>: thời gian tổn thất mỗi lần dừng.</li></ul>' +
      '<p>INT = RTT/L; HC5 = 300·P·L/RTT (người/5 phút); %HC5 = HC5/dân số nhóm.</p>' +
      '<p>AWT ≈ [0,4 + (1,8·P/CC − 0,77)²]·INT (Barney, áp dụng 50–80% tải); ATT ≈ 0,5·(H − L<sub>b</sub>)/v + 0,5·S·t<sub>s</sub> + P·t<sub>p</sub>.</p>' +
      '<h3>3. Điểm làm việc theo nhu cầu</h3><p>Với nhu cầu λ (người/5 phút), giải P sao cho P = λ·RTT(P)/(300·L). Nếu không có nghiệm P ≤ CC → nhóm quá tải. Hệ số tải P/CC tại nhu cầu nên ≤ 80%.</p>' +
      '<h3>4. Mô phỏng</h3><p>Mô phỏng theo bước 0,1 s: hành khách đến theo quá trình Poisson với cường độ nhập, chọn ga vào/tầng đến theo tỷ lệ dân số và "Ga vào %"; cabin chạy theo t<sub>f</sub>, dừng mở cửa t<sub>o</sub> + t<sub>c</sub> + t<sub>p</sub> × số khách ra/vào, không chở quá CC; lệnh gọi tầng phân cho cabin có thời gian đến ước tính nhỏ nhất (điều khiển tập hợp hai chiều). Kết quả: WT (thời gian chờ), TT (trong cabin), DT (đến đích), LW (% chờ &gt; 60 s), HC5 thực, biểu đồ ùn tắc.</p>' +
      '<h3>5. Tránh cộng trùng dân số</h3><p>Mỗi tầng có dân số phải được phân bổ tổng 100% cho các nhóm thang (ma trận ở tab 2). Một người chỉ được tính cho một nhóm.</p>' +
      '<h3>6. Giới hạn</h3><p>Công cụ nội bộ để kiểm tra phương án Concept/TKCS. DCS chỉ mô phỏng gần đúng (thuật toán phân cabin đơn giản, không phải của hãng); chưa mô phỏng thang đôi/tầng kép, đỗ thang chủ động; chưa được kiểm chứng như phần mềm của hãng — cần đối chiếu báo cáo nhà thầu trước khi xác nhận chính thức.</p></div>';
  }

  /* ---------- sau render ---------- */
  /* ---------- 7. Kích thước thang theo hãng ---------- */
  function vLifts() {
    if (!S.lifts) S.lifts = AL.LiftTab.defaults();
    const LT = AL.LiftTab, lib = LT.library(S);
    let h = '<div class="card noprint"><div class="row-between"><h2>Kích thước thang theo hãng</h2><div class="btns"><button data-act="addLift">+ Thêm thang</button><button class="pri" data-act="print">In / Lưu PDF</button></div></div>' +
      '<p class="hint">Chọn hãng, dòng máy, tải trọng, vận tốc, kiểu cửa → tra kích thước cabin, hố thang tối thiểu, hố pit, OH theo <b>planning guide của hãng</b> (ghi nguồn từng cấu hình). Hình vẽ là <b>sơ đồ</b> để kiểm tra bố trí; bản vẽ lắp đặt phải theo hồ sơ của nhà thầu thang được chọn.</p></div>';
    S.lifts.forEach(function (L) { h += liftCard(L, LT.solve(S, L), lib); });
    return h + libCard(lib);
  }
  const CWT_LABEL = { B: 'phía sau', L: 'bên trái', R: 'bên phải', S: 'bên, chưa rõ trái/phải' };
  function liftCard(L, res, lib) {
    const LT = AL.LiftTab, k = 'lift.' + L.id + '.', m = res.model, r = res.row;
    const brands = Object.keys(lib);
    let h = '<div class="card lift"><div class="row-between"><h3>' + inp(k + 'name', L.name, { type: 'text', cls: 'title-in' }) + ' <small>' + esc(LT.CATS[L.cat].label) + (L.qty > 1 ? ' × ' + L.qty : '') + '</small></h3>' +
      '<div class="btns noprint">' + toolLink(L.brand) + '<button class="del" data-act="delLift" data-id="' + L.id + '">Xoá</button></div></div>' +
      '<div class="grid6 noprint">' +
      field('Chức năng', sel(k + 'cat', L.cat, Object.keys(LT.CATS).map(function (c) { return [c, LT.CATS[c].label]; }))) +
      field('Hãng', sel(k + 'brand', L.brand, brands.map(function (b) { return [b, b + ((lib[b] || []).length ? '' : ' (chưa có dữ liệu)')]; }))) +
      field('Dòng máy', (lib[L.brand] || []).length ? sel(k + 'model', L.model, lib[L.brand].map(function (x, i) { return [i, x.model]; })) : '<span class="hint">—</span>') +
      field('Kiểu cửa', sel(k + 'door', L.door, (res.doors || Object.keys(LT.DOORS)).map(function (d) { return [d, LT.DOORS[d] || d]; }))) +
      field('Tải trọng (kg)', res.loads ? sel(k + 'Q', L.Q, res.loads.map(function (q) { return [q, q + ' kg']; })) : inp(k + 'Q', L.Q)) +
      field('Vận tốc (m/s)', res.speeds ? sel(k + 'v', L.v, res.speeds.map(function (v) { return [v, v + ' m/s']; })) : inp(k + 'v', L.v)) +
      field('Số điểm dừng', inp(k + 'stops', L.stops || '')) +
      field('Hành trình (m)', inp(k + 'travel', L.travel || ''), 'sàn thấp nhất → sàn cao nhất') +
      field('Chiều cao cabin CH (mm)', inp(k + 'CH', L.CH || '', { ph: 'theo hãng' }), 'cần để tính OH') +
      field('Chiều cao cửa HH (mm)', inp(k + 'HH', L.HH || '', { ph: 'theo hãng' }), 'để vẽ') +
      field('Chiều dày vách hố (mm)', inp(k + 'wall', L.wall), 'chỉ để vẽ') +
      field('Đối trọng', sel(k + 'cwt', L.cwt || '', [['', 'Theo dữ liệu' + (r ? ' (' + (CWT_LABEL[r.cwt] || 'chưa có') + ')' : '')], ['B', 'Phía sau'], ['L', 'Bên trái'], ['R', 'Bên phải']]), 'nhìn từ sảnh vào hố') +
      field('Lối vào cabin', sel(k + 'ent', L.ent || 0, [[0, 'Theo dữ liệu' + (r ? ' (' + r.ent + ')' : '')], [1, '1 lối'], [2, '2 lối (xuyên)']])) +
      field('Số lượng', inp(k + 'qty', L.qty, { step: 1 })) +
      '<div class="fld"><span>Tuỳ chọn</span>' +
      (m && m.shAdd ? '<label class="chk"><input type="checkbox" data-bind="' + k + 'balu"' + (L.balu ? ' checked' : '') + '> Lan can nóc cabin 1100 (+400 OH)</label>' : '') +
      (L.cat === 'fire' ? '<label class="chk"><input type="checkbox" data-bind="' + k + 'stretcher"' + (L.stretcher ? ' checked' : '') + '> Chở cáng/giường</label>' : '') + '</div>' +
      '</div>';
    if (res.opts && res.opts.length > 1) h += '<div class="noprint">' + field('Cấu hình cabin (' + res.opts.length + ' phương án, xếp theo hố nhỏ nhất)', sel(k + 'opt', Math.max(0, +L.opt), res.opts.map(function (o, i) {
      return [i, 'Cabin ' + o.BB + '×' + o.DD + ', cửa ' + o.LL + ' → hố ' + o.WW + '×' + o.WD];
    }))) + '</div>';
    if (res.warn.length) h += '<ul class="warnlist">' + res.warn.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
    if (!r) {
      if (res.checks.length) h += '<h4>Kiểm tra</h4><table class="tbl small"><thead><tr><th>Nội dung</th><th>Yêu cầu</th><th>Giá trị</th><th>Kết luận</th></tr></thead><tbody>' +
        res.checks.map(function (c) { return '<tr><td>' + esc(c.label) + '<br><small class="note">' + esc(c.src) + '</small></td><td>' + esc(c.target) + '</td><td class="num">' + esc(c.val) + '</td><td>' + badge(c.ok) + '</td></tr>'; }).join('') + '</tbody></table>';
      if (m) h += '<p class="hint src-line">Nguồn: ' + esc(m.source) + (m.notes ? ' · ' + m.notes.map(esc).join(' · ') : '') + '</p>';
      return h + '</div>';
    }
    const t = +L.wall || 0;
    // bảng kết quả dạng cột (1 dòng) cho gọn
    const ohCell = res.OH ? '<b>' + res.OH + '</b>' + (res.ohFormula ? '<br><small>' + esc(res.ohFormula) + '</small>' : '')
      : (res.ohFormula ? '<span class="warn">' + esc(res.ohFormula.replace('SH = ', '')) + '<br>nhập CH</span>' : '—');
    const mrCell = m.type === 'MRL' ? 'Không' : (r.MR ? esc(r.MR.replace('Phòng máy cao thông thuỷ tối thiểu', 'cao ≥')) : 'Có');
    h += '<div class="tblwrap"><table class="tbl small lift-res"><thead><tr>' +
      '<th>Dòng máy</th><th>Tải / CC</th><th>v (m/s)</th><th>Cửa (LL)</th><th>Cabin BB×DD' + (res.CH ? '×CH' : '') + '</th>' +
      '<th>Hố WW×WD</th><th>Hố ngoài (vách ' + t + ')</th><th>Pit PH</th><th>OH (SH)</th><th>Phòng máy</th></tr></thead><tbody><tr>' +
      '<td>' + esc(m.model) + '<br><small>' + esc(m.typeLabel || m.type || '') + '</small></td>' +
      '<td>' + fmt(+L.Q, 0) + ' kg<br><small>' + r.persons + ' người</small></td>' +
      '<td>' + fmt(+L.v, 2) + '</td>' +
      '<td>' + esc(r.door) + ' ' + r.LL + (r.HH ? '×' + r.HH : '') + '</td>' +
      '<td><b>' + r.BB + '×' + r.DD + (res.CH ? '×' + res.CH : '') + '</b></td>' +
      '<td><b>' + r.WW + '×' + r.WD + '</b></td>' +
      '<td>' + (r.WW + 2 * t) + '×' + (r.WD + 2 * t) + '</td>' +
      '<td><b>' + (res.PH || '—') + '</b></td>' +
      '<td>' + ohCell + '</td>' +
      '<td>' + mrCell + '</td></tr></tbody></table></div>';
    const extra = [];
    if (r.note) extra.push(esc(r.note));
    if (L.qty > 1) extra.push(L.qty + ' thang cạnh nhau: rộng hố ≈ ' + L.qty + '×' + r.WW + ' + vách ngăn (xác nhận với hãng)');
    h += '<p class="hint src-line">Kích thước mm. Nguồn: ' + esc(m.source) + (m.notes ? ' · ' + m.notes.map(esc).join(' · ') : '') + (extra.length ? ' · ' + extra.join(' · ') : '') + '</p>';
    h += '<div class="lift-draw"><div>' + AL.LiftDraw.plan(L, res) + '</div><div>' + AL.LiftDraw.pit(L, res) + '</div><div>' + AL.LiftDraw.top(L, res) + '</div></div>';
    if (res.checks.length) h += '<h4>Kiểm tra</h4><table class="tbl small"><thead><tr><th>Nội dung</th><th>Yêu cầu</th><th>Giá trị</th><th>Kết luận</th></tr></thead><tbody>' +
      res.checks.map(function (c) { return '<tr><td>' + esc(c.label) + ' <small class="note">' + esc(c.src) + '</small></td><td>' + esc(c.target) + '</td><td class="num">' + esc(c.val) + '</td><td>' + badge(c.ok) + '</td></tr>'; }).join('') + '</tbody></table>';
    if (m.type === 'MRL') h += '<p class="hint">Không phòng máy: máy kéo đặt trong giếng thang; tủ điều khiển tại khung cửa tầng trên cùng hoặc theo hãng.</p>';
    return h + '</div>';
  }
  function toolLink(brand) {
    const t = AL.LiftTab.TOOLS[brand];
    if (!t) return '';
    if (!t.url) return '<span class="hint" title="' + esc(t.hint) + '">Công cụ hãng: ' + esc(t.label) + ' (QR) ⓘ</span>';
    return '<a class="btnlink" href="' + esc(t.url) + '" target="_blank" rel="noopener noreferrer" title="Mở công cụ thiết kế online của hãng ở thẻ mới. Chạy cấu hình xong, chép kết quả vào mục &quot;Nhập kết quả từ công cụ hãng&quot; cuối trang.">Mở ' + esc(t.label) + ' ↗</a>';
  }
  function importOneForm(lib) {
    const LT = AL.LiftTab;
    const f = function (id, label, ph) { return field(label, '<input type="number" step="any" id="io_' + id + '"' + (ph ? ' placeholder="' + ph + '"' : '') + '>'); };
    return '<div class="sub"><div class="row-between"><h3>Nhập kết quả từ công cụ hãng</h3><div class="btns">' +
      Object.keys(LT.TOOLS).map(toolLink).join(' ') + '</div></div>' +
      '<p class="hint">Chạy cấu hình trên công cụ hãng (KONE Studio → <i>Create Specification</i>; Schindler Plan; LEHY Civil Engineering), rồi chép các số vào đây — mỗi lần một cấu hình. Số liệu lưu trong hồ sơ dự án (.json), kèm nguồn từng cấu hình. Kích thước hố: <b>rộng = phương mở cửa</b>, <b>sâu = từ sảnh nhìn vào hố</b>.</p>' +
      '<div class="grid6">' +
      field('Hãng', '<select id="io_brand">' + Object.keys(lib).map(function (b) { return '<option>' + esc(b) + '</option>'; }).join('') + '</select>') +
      field('Dòng máy', '<input type="text" id="io_model" list="io_models" placeholder="vd. KONE S MonoSpace"><datalist id="io_models">' +
        Object.keys(lib).map(function (b) { return lib[b].map(function (m) { return '<option value="' + esc(m.model) + '">'; }).join(''); }).join('') + '</datalist>') +
      field('Loại', '<select id="io_type"><option value="MRL">Không phòng máy (MRL)</option><option value="MR">Có phòng máy (MR)</option></select>') +
      field('Kiểu cửa', '<select id="io_door"><option value="CO">Mở giữa (CO)</option><option value="2S">Mở một bên (2S)</option></select>') +
      f('Q', 'Tải trọng (kg)') + f('v', 'Vận tốc (m/s)') +
      f('BB', 'Cabin rộng (mm)') + f('DD', 'Cabin sâu (mm)') + f('CH', 'Cabin cao (mm)') +
      f('LL', 'Cửa rộng (mm)') + f('HH', 'Cửa cao (mm)') + f('WW', 'Hố rộng (mm)') +
      f('WD', 'Hố sâu (mm)') + f('PH', 'Pit (mm)') + f('OH', 'OH / SH (mm)') +
      f('TR', 'Hành trình max (m)', 'nếu có') + f('ST', 'Số dừng max', 'nếu có') +
      field('Phòng máy (ghi chú)', '<input type="text" id="io_mr" placeholder="vd. 2500×3700, cao 2200">') +
      field('Đối trọng', '<select id="io_cwt"><option value="">Chưa rõ</option><option value="B">Phía sau</option><option value="L">Bên trái</option><option value="R">Bên phải</option></select>', 'nhìn từ sảnh vào hố') +
      field('Lối vào cabin', '<select id="io_ent"><option value="1">1 lối</option><option value="2">2 lối (xuyên)</option></select>') +
      '</div>' + field('Nguồn (bắt buộc)', '<input type="text" id="io_src" placeholder="vd. KONE Studio – Specification ngày 18/11/2026, mã cấu hình …, dự án …">') +
      '<div class="btns" style="margin-top:8px"><button class="pri" data-act="importOne">Thêm cấu hình</button></div></div>';
  }
  function libCard(lib) {
    let h = '<div class="card noprint"><h2>Kho dữ liệu hãng</h2><table class="tbl small"><thead><tr><th>Hãng</th><th>Dòng máy</th><th>Loại</th><th>Số cấu hình</th><th>Nguồn</th><th></th></tr></thead><tbody>';
    Object.keys(lib).forEach(function (b) {
      if (!lib[b].length) h += '<tr><td>' + esc(b) + '</td><td colspan="5" class="warn">Chưa có dữ liệu — nạp từ planning guide bên dưới</td></tr>';
      lib[b].forEach(function (m) {
        h += '<tr><td>' + esc(b) + '</td><td>' + esc(m.model) + '</td><td>' + esc(m.typeLabel || m.type) + '</td><td class="num">' + m.rows.length + '</td><td><small>' + esc(m.source) + '</small></td><td>' +
          (m.builtin ? '<small>có sẵn</small>' : '<button class="del" data-act="delLib" data-id="' + esc(m.id) + '">Xoá</button>') + '</td></tr>';
      });
    });
    h += '</tbody></table>' + importOneForm(lib) + '<div class="sub"><h3>Nạp nhiều cấu hình từ planning guide (dán từ Excel)</h3>' +
      '<p class="hint">Mỗi dòng một cấu hình, các cột theo thứ tự: <b>Cửa (CO/2S) | Tải trọng kg | Số người | Vận tốc m/s | Rộng cabin BB | Sâu cabin DD | Rộng cửa LL | Rộng hố WW | Sâu hố WD | Pit PH | OH | Phòng máy (ghi chú) | Hành trình max m | Số dừng max</b>. Đơn vị mm. Nguồn bắt buộc ghi (tên tài liệu, ấn bản, trang).</p>' +
      '<div class="grid4">' + field('Hãng', '<input type="text" id="libBrand" list="dlBrands" value="Mitsubishi"><datalist id="dlBrands"><option value="Mitsubishi"><option value="Schindler"><option value="KONE"></datalist>') +
      field('Dòng máy', '<input type="text" id="libModel" placeholder="vd. NEXIEZ-MRL">') +
      field('Loại', '<select id="libType"><option value="MRL">Không phòng máy (MRL)</option><option value="MR">Có phòng máy (MR)</option></select>') +
      field('Nguồn (bắt buộc)', '<input type="text" id="libSrc" placeholder="Tên tài liệu, ấn bản, trang">') + '</div>' +
      '<textarea id="libRows" rows="6" placeholder="CO\t1000\t13\t1.75\t1600\t1500\t900\t2150\t2100\t1500\t4500\t\t75\t24"></textarea>' +
      '<div class="btns"><button class="pri" data-act="importLib">Nạp dữ liệu</button></div></div></div>';
    return h;
  }

  /* ---------- Chú giải ký hiệu ---------- */
  const GLOSS = [
    ['RTT', 'Round Trip Time – thời gian vòng chạy', 'Thời gian một vòng chạy của cabin: rời sảnh, chở khách lên, đảo chiều, quay về sảnh. Đại lượng gốc để tính INT và HC5.'],
    ['INT', 'Interval – khoảng cách giữa các chuyến', 'Thời gian trung bình giữa hai lần liên tiếp có cabin rời sảnh chính. INT = RTT / L. Càng nhỏ, khách chờ càng ít.'],
    ['HC5', 'Handling Capacity 5 min – năng lực vận chuyển 5 phút', 'Số người nhóm thang chở được trong 5 phút cao điểm. HC5 = 300·P·L / RTT (người/5 phút); %HC5 = HC5 / dân số × 100.'],
    ['AWT', 'Average Waiting Time – thời gian chờ trung bình', 'Từ lúc khách gọi thang đến lúc bước vào cabin. Bảng tính: AWT ≈ [0,4 + (1,8·P/CC − 0,77)²]·INT (Barney, tải 50–80%); mô phỏng: đo trực tiếp.'],
    ['ATT', 'Average Transit Time – thời gian trong cabin trung bình', 'Từ lúc vào cabin đến lúc ra ở tầng đích. Trong mô phỏng ký hiệu TT.'],
    ['AJT', 'Average Journey Time – thời gian đến đích trung bình', 'Từ lúc gọi thang đến khi tới tầng đích: AJT = AWT + ATT. Trong mô phỏng ký hiệu DT.'],
    ['CC', 'Car Capacity – sức chứa cabin', 'Số người theo tải trọng: Q/75 kg làm tròn xuống (EN 81-20 / ISO 8100-1).'],
    ['P', 'Số khách trung bình mỗi chuyến', 'Mặc định = CC × hệ số tải tính toán (80%). Tại nhu cầu: P cân bằng với lưu lượng khách đến.'],
    ['L', 'Số cabin trong nhóm', ''],
    ['S', 'Số điểm dừng kỳ vọng phía trên', 'Số tầng cabin dừng trả khách trung bình mỗi chuyến cao điểm lên.'],
    ['SE', 'Số điểm dừng kỳ vọng tại ga vào', 'Số ga vào (sảnh, tầng hầm) cabin dừng đón khách trung bình mỗi chuyến.'],
    ['H', 'Cao độ đảo chiều cao nhất kỳ vọng', 'Trung bình cabin chạy lên tới cao độ nào thì quay về.'],
    ['ts', 'Thời gian tổn thất mỗi lần dừng', 'ts = tf(df) − df/v + to + tc + tsd.'],
    ['WT', 'Waiting Time – thời gian chờ', 'Thời gian chờ của từng hành khách trong mô phỏng; AWT là trung bình.'],
    ['TT', 'Transit Time – thời gian trong cabin', 'Trong mô phỏng; trung bình là ATT.'],
    ['DT', 'Destination Time – thời gian đến đích', 'Trong mô phỏng; trung bình là AJT.'],
    ['LW', 'Long Wait – tỷ lệ chờ lâu', '% hành khách phải chờ quá 60 s (mô phỏng).'],
  ];
  const PHRASES = [
    [/Tải tại nhu cầu|Hệ số tải tại nhu cầu|Hệ số tải P\/CC/,'Hệ số tải P/CC khi lưu lượng khách đến bằng nhu cầu cao điểm; nên ≤ 80%. "Quá tải" = nhóm không chở kịp kể cả khi cabin đầy.'],
    [/Nhu cầu cao điểm/, 'Lưu lượng khách đến trong 5 phút cao điểm, tính theo % dân số phục vụ của nhóm. Là số liệu đầu vào — cần ghi rõ nguồn.'],
    [/Hành trình/, 'Khoảng cách từ ga vào thấp nhất đến tầng phục vụ cao nhất.'],
    [/Chạy thẳng/, 'Thời gian chạy không dừng từ ga vào thấp nhất đến tầng cao nhất.'],
    [/Dân số phục vụ/, 'Tổng dân số nhóm đảm nhận theo ma trận phân bổ (không cộng trùng giữa các nhóm).'],
    // --- tab Mô phỏng: ô nhập ---
    [/^Kịch bản giao thông/, 'Cao điểm lên: 100% khách từ ga vào đi lên, cabin rảnh tự về sảnh chính. Cao điểm xuống: 100% từ các tầng về ga vào. Hai chiều – giờ trưa: 45% lên / 45% xuống / 10% giữa các tầng. Hỗn hợp: tự nhập tỷ lệ.'],
    [/^Cường độ đến/, 'Lưu lượng khách sinh ra trong mô phỏng (% dân số phục vụ / 5 phút), đến ngẫu nhiên theo phân bố Poisson. Thường lấy bằng nhu cầu cao điểm. Đặt cao hơn năng lực để thử bão hoà: khi đó HC5 thực = năng lực tối đa của nhóm.'],
    [/^Đi lên từ ga vào/, 'Tỷ lệ chuyến từ ga vào (sảnh, tầng hầm) lên các tầng có dân số. Ba tỷ lệ lên / xuống / giữa tầng tự chuẩn hoá về tổng 100%.'],
    [/^Đi xuống ga vào/, 'Tỷ lệ chuyến từ các tầng có dân số xuống ga vào (sảnh, tầng hầm).'],
    [/^Giữa các tầng/, 'Tỷ lệ chuyến đi giữa hai tầng có dân số (không qua ga vào).'],
    [/^Thời gian đo/, 'Khoảng thời gian sinh khách được đưa vào thống kê, tính sau giai đoạn khởi động.'],
    [/^Khởi động bỏ qua/, 'Giai đoạn đầu hệ thống chưa ổn định (cabin còn ở vị trí ban đầu). Khách đến trong khoảng này vẫn được chở nhưng không tính vào thống kê.'],
    [/^Số lần chạy/, 'Số lần mô phỏng, mỗi lần một chuỗi khách ngẫu nhiên khác nhau. Kết quả là trung bình; cột "Khoảng" cho giá trị nhỏ nhất – lớn nhất giữa các lần.'],
    [/^Hạt giống/, 'Số khởi tạo bộ sinh ngẫu nhiên. Cùng hạt giống và cùng số liệu → cùng kết quả (tái lập được). Đổi hạt giống để kiểm tra độ ổn định.'],
    // --- tab Mô phỏng: bảng kết quả ---
    [/^Trung bình$/, 'Trung bình của các lần chạy.'],
    [/^Khoảng \d+ lần/, 'Giá trị nhỏ nhất – lớn nhất giữa các lần chạy: khoảng rộng nghĩa là kết quả dao động nhiều, nên tăng số lần chạy hoặc thời gian đo.'],
    [/^Số hành khách trong giai đoạn đo/, 'Số khách ảo sinh ra trong thời gian đo (không tính giai đoạn khởi động).'],
    [/^Nhu cầu thực sinh ra/, 'Lưu lượng khách thực tế đã sinh, quy về người/5 phút; dao động ngẫu nhiên quanh cường độ đến đã nhập.'],
    [/^Năng lực vận chuyển thực/, 'Số khách được trả tới tầng đích trong mỗi 5 phút của giai đoạn đo (trung bình). Nhỏ hơn nhu cầu → nhóm thang không chở kịp, hàng chờ tăng dần.'],
    [/^HC5 thực/, 'Năng lực vận chuyển thực tính theo % dân số phục vụ, để so sánh với HC5 của bảng tính.'],
    [/^Thời gian chờ trung vị/, '50% số khách chờ không quá giá trị này.'],
    [/^Thời gian chờ phân vị 90%/, '90% số khách chờ không quá giá trị này (10% chờ lâu hơn).'],
    [/^Thời gian chờ phân vị 95%/, '95% số khách chờ không quá giá trị này (5% chờ lâu hơn).'],
    [/^Thời gian chờ lớn nhất/, 'Thời gian chờ dài nhất của một khách trong giai đoạn đo.'],
    [/^Thời gian đến đích phân vị 95%/, '95% số khách tới tầng đích (tính từ lúc gọi thang) không quá giá trị này.'],
    [/^Khách chưa được phục vụ/, 'Số khách chưa tới tầng đích khi kết thúc mô phỏng (sau tối đa 1 giờ xả hàng chờ). Khác 0 → nhóm thang quá tải.'],
    [/^Thời gian xả hàng chờ/, 'Thời gian từ lúc ngừng sinh khách đến khi trả hết khách. Lớn hơn nhiều so với thời gian đến đích → hàng chờ đã tích tụ.'],
    [/^Số lần dừng\/cabin\/giờ/, 'Số lần dừng mở cửa trung bình của mỗi cabin trong một giờ — tham khảo cường độ làm việc của thang.'],
    [/^Phân bố thời gian chờ/, 'Tỷ lệ % khách theo từng khoảng thời gian chờ 5 s. Cột đỏ: chờ từ 60 s trở lên.'],
    [/^Số người đang chờ theo thời gian/, 'Tổng số khách đang đứng chờ ở các tầng, lấy mẫu mỗi 10 s (trung bình các lần chạy). Đường dao động quanh mức ổn định = đáp ứng; đường tăng liên tục = ùn tắc. Vạch vàng: hết giai đoạn khởi động.'],
    [/^Thời gian chờ trung bình theo tầng xuất phát/, 'AWT của khách xuất phát từ từng tầng. Cột đỏ: trên 60 s — tầng có nguy cơ phục vụ kém (thường là tầng hầm ít người).'],
    [/^Nguy cơ ùn tắc$|^Hệ thống đáp ứng$/, 'Đánh giá: "Nguy cơ ùn tắc" khi năng lực vận chuyển thực < 95% nhu cầu sinh ra, hoặc hơn 2% khách chưa được phục vụ khi kết thúc.'],
  ];
  function glossaryHtml() {
    return '<div class="glossary"><h3>Chú giải ký hiệu</h3><table>' + GLOSS.map(function (g) {
      return '<tr><td><b>' + g[0] + '</b></td><td>' + esc(g[1]) + (g[2] ? '. ' + esc(g[2]) : '') + '</td></tr>';
    }).join('') + '</table></div>';
  }
  /* Gắn chú thích khi rê chuột cho tiêu đề cột / nhãn chứa ký hiệu. */
  function tipify() {
    const re = new RegExp('(^|[^A-Za-z0-9])(' + GLOSS.filter(function (g) { return g[0].length > 1; }).map(function (g) { return g[0]; }).join('|') + ')(?![A-Za-z0-9])', 'g');
    document.querySelectorAll('#main th, #main .kv td:first-child, #main .tbl.small td:first-child, #main .fld > span, #main h4, #main span.b').forEach(function (el) {
      if (el.title) return;
      const txt = el.textContent.trim(), tips = [];
      let m; re.lastIndex = 0;
      while ((m = re.exec(txt))) {
        const g = GLOSS.find(function (x) { return x[0] === m[2]; });
        const line = g[0] + ' – ' + g[1] + (g[2] ? ': ' + g[2] : '');
        if (tips.indexOf(line) < 0) tips.push(line);
      }
      const exact = GLOSS.find(function (x) { return x[0] === txt.trim(); }); // tiêu đề chỉ là ký hiệu 1 chữ (L, P…)
      if (exact && !tips.length) tips.push(exact[0] + ' – ' + exact[1] + (exact[2] ? ': ' + exact[2] : ''));
      PHRASES.forEach(function (p) { if (p[0].test(txt)) tips.push(p[1]); });
      if (tips.length) { el.title = tips.join('\n'); el.classList.add('tip'); }
    });
  }

  function afterRender() { tipify(); if (tab === 'sim' || tab === 'report') { drawSim(); drawSweep(); } }

  /* ---------- sự kiện ---------- */
  function setBind(b, el) {
    const p = b.split('.');
    const val = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? 0 : +el.value) : el.value;
    if (p[0] === 'project') S.project[p[1]] = val;
    else if (p[0] === 'plan') { S.plan = S.plan || { marks: [] }; S.plan[p[1]] = val; }
    else if (p[0] === 'datum') S.datumId = val;
    else if (p[0] === 'floor') p[1].split(',').forEach(function (fid) { // dòng gộp: áp dụng cho mọi tầng trong dòng
      const f = S.floors.find(function (x) { return x.id === fid; });
      if (f) f[p[2]] = val;
      // nhập dân số cho tầng đã tích nhóm nhưng chưa phân bổ % → chia đều cho các nhóm đang dừng
      if (f && p[2] === 'pop' && +val > 0) {
        const gs = S.groups.filter(function (g) { return g.cells[f.id] && g.cells[f.id].s; });
        const sum = gs.reduce(function (s, g) { return s + (+g.cells[f.id].sh || 0); }, 0);
        if (gs.length && !sum) gs.forEach(function (g) { g.cells[f.id].sh = Math.round((100 / gs.length) * 100) / 100; });
      }
    });
    else if (p[0] === 'group') { const g = groupById(p[1]); g[p[2]] = val; if (p[2] === 'demand') g.demandSet = true; }
    else if (p[0] === 'demandSel') {
      const g = groupById(p[1]);
      if (val === 'custom') g.demandCustom = true;
      else { g.demandCustom = false; g.demand = +val; }
      g.demandSet = true;
    }
    else if (p[0] === 'crit') { groupById(p[1]).crit[p[2]] = val; groupById(p[1]).preset = 'custom'; }
    else if (p[0] === 'preset') {
      const g = groupById(p[1]); g.preset = val; const pr = PRESETS[val];
      if (pr.hc5 != null) { g.crit = { hc5: pr.hc5, int: pr.int, awt: pr.awt }; g.demand = pr.demand; g.demandSet = false; g.demandCustom = false; }
    } else if (p[0] === 'cell') {
      const g = groupById(p[1]);
      p[2].split(',').forEach(function (fid) { // dòng gộp: áp dụng cho mọi tầng trong dòng
        const c = g.cells[fid] || (g.cells[fid] = { s: false, sh: 0 });
        c[p[3]] = val;
        if (p[3] === 's' && val && !c.sh) {
          const f = S.floors.find(function (x) { return x.id === fid; });
          const others = S.groups.filter(function (x) { return x !== g && x.cells[fid] && x.cells[fid].s; }).length;
          if (f && +f.pop > 0 && !others) c.sh = 100;
        }
      });
    } else if (p[0] === 'sim') {
      S.sim[p[1]] = p[1] === 'midRoute' ? val === 'on' : val;
      if (p[1] === 'profile') { const pr = AL.PROFILES[val]; S.sim.inc = pr.inc; S.sim.out = pr.out; S.sim.inter = pr.inter; }
    } else if (p[0] === 'sizing') S.sizing[p[1]] = val;
    else if (p[0] === 'lift') {
      const L = (S.lifts || []).find(function (x) { return x.id === p[1]; });
      if (!L) return;
      const numF = ['Q', 'v', 'model', 'opt', 'stops', 'travel', 'CH', 'HH', 'wall', 'qty', 'ent'];
      L[p[2]] = numF.indexOf(p[2]) >= 0 ? +val : val;
      if (['brand', 'model', 'door', 'Q', 'v', 'cat', 'stretcher'].indexOf(p[2]) >= 0) L.opt = -1;
      if (p[2] === 'brand') L.model = 0;
      if (p[2] === 'cat') { L.stretcher = val === 'fire'; L.door = AL.LiftTab.CATS[val].door; }
      // giữ tải trọng / vận tốc / cửa hợp lệ với dòng máy đang chọn
      const res = AL.LiftTab.solve(S, L);
      if (res.doors && res.doors.length && res.doors.indexOf(L.door) < 0) L.door = res.doors[0];
      if (res.loads && res.loads.length && res.loads.indexOf(+L.Q) < 0) L.Q = res.loads.reduce(function (a, b) { return Math.abs(b - L.Q) < Math.abs(a - L.Q) ? b : a; });
      if (res.speeds && res.speeds.length && res.speeds.indexOf(+L.v) < 0) L.v = res.speeds[0];
      // tổ hợp vẫn không có trong tài liệu (khi đổi hãng/dòng máy/chức năng) → lấy cấu hình gần nhất cùng kiểu cửa
      if (['brand', 'model', 'cat'].indexOf(p[2]) >= 0 && !AL.LiftTab.solve(S, L).row) {
        const m = (AL.LiftTab.library(S)[L.brand] || [])[L.model];
        const rows = m ? m.rows.filter(function (r) { return r[0] === L.door; }) : [];
        const pick = (rows.length ? rows : (m ? m.rows : [])).slice().sort(function (a, b) { return Math.abs(a[1] - L.Q) - Math.abs(b[1] - L.Q); })[0];
        if (pick) { L.door = pick[0]; L.Q = pick[1]; L.v = pick[3]; }
      }
    }
  }
  document.addEventListener('change', function (ev) {
    const el = ev.target;
    if (el.dataset.gen) { ui.genP[el.dataset.gen] = el.type === 'number' ? +el.value : el.value; return; }
    if (el.id === 'planFile') { loadPlanImage(el.files[0]); return; }
    if (el.id === 'planKind') { ui.planKind = el.value; return; }
    if (/^pe-/.test(el.id)) { planEditApply(el); return; }
    if (!el.dataset.bind) return;
    setBind(el.dataset.bind, el);
    save();
    setTimeout(render, 0);
  });
  document.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id, a = b.dataset.act;
    const idx = function () { return S.floors.findIndex(function (f) { return f.id === id; }); };
    switch (a) {
      case 'tab': tab = id; break;
      case 'planClearMarks': if (!confirm('Xoá hết nhãn loại thang trên mặt bằng?')) return; S.plan.marks = []; ui.planEdit = null; break;
      case 'planEditClose': { const t = $('#pe-text'), m = S.plan.marks[ui.planEdit]; if (m && t && t.value.trim()) m.n = t.value.trim(); ui.planEdit = null; break; }
      case 'planEditDel': S.plan.marks.splice(ui.planEdit, 1); ui.planEdit = null; break;
      case 'planDelImg': if (!confirm('Xoá ảnh mặt bằng (và các nhãn)?')) return; S.plan = { marks: [], caption: (S.plan && S.plan.caption) || '' }; ui.planEdit = null; break;
      case 'mergeZoning': ui.mergeZoning = !ui.mergeZoning; try { localStorage.setItem(STORE + '.merge', ui.mergeZoning ? '1' : '0'); } catch (e) { /* bỏ qua */ } break;
      case 'mergeFloors': ui.mergeFloors = !ui.mergeFloors; try { localStorage.setItem(STORE + '.mergeF', ui.mergeFloors ? '1' : '0'); } catch (e) { /* bỏ qua */ } break;
      case 'mergeMatrix': ui.mergeMatrix = !ui.mergeMatrix; try { localStorage.setItem(STORE + '.mergeM', ui.mergeMatrix ? '1' : '0'); } catch (e) { /* bỏ qua */ } break;
      case 'toggleGen': ui.gen = !ui.gen; ui.paste = false; break;
      case 'togglePaste': ui.paste = !ui.paste; ui.gen = false; break;
      case 'addFloor': {
        const top = S.floors[S.floors.length - 1];
        const nf = { id: uid(), name: 'Tầng mới', func: top ? top.func : 'Khác', h: top ? top.h : 0, pop: 0, ent: 0 };
        S.floors.push(nf); inheritCells([nf.id], top, null);
        if (!S.datumId) S.datumId = S.floors[0].id; break;
      }
      case 'insF': {
        const i = idx(), above = S.floors[i], below = S.floors[i - 1] || null;
        const nf = { id: uid(), name: 'Tầng mới', func: 'Khác', h: above.h, pop: 0, ent: 0 };
        S.floors.splice(i, 0, nf); inheritCells([nf.id], below, above); break;
      }
      case 'delF': {
        const i = idx(); const f = S.floors[i];
        if (!confirm('Xoá tầng ' + f.name + '?')) return;
        S.floors.splice(i, 1); S.groups.forEach(function (g) { delete g.cells[id]; });
        if (S.datumId === id) S.datumId = S.floors.length ? S.floors[0].id : null; break;
      }
      case 'upF': { const i = idx(); if (i < S.floors.length - 1) { const t = S.floors[i]; S.floors[i] = S.floors[i + 1]; S.floors[i + 1] = t; } break; }
      case 'dnF': { const i = idx(); if (i > 0) { const t = S.floors[i]; S.floors[i] = S.floors[i - 1]; S.floors[i - 1] = t; } break; }
      case 'doGen': {
        if (S.floors.length && !confirm('Thay thế toàn bộ danh sách tầng hiện có?')) return;
        S.floors = genFloors(ui.genP);
        const t1 = S.floors[ui.genP.nB]; S.datumId = (t1 || S.floors[0]).id;
        S.groups.forEach(function (g) { g.cells = {}; });
        ui.gen = false; break;
      }
      case 'doPaste': {
        const lines = $('#pasteBox').value.split(/\r?\n/).filter(function (l) { return l.trim(); });
        let rows = lines.map(function (l) {
          const c = l.split('\t');
          const fn = (c[2] || '').trim();
          return { id: uid(), name: (c[0] || '').trim(), h: num(c[1]), func: FUNCS.indexOf(fn) >= 0 ? fn : (fn || 'Khác'), pop: num(c[3]), ent: num(c[4]) };
        }).filter(function (r) { return r.name; });
        if (!rows.length) { alert('Không đọc được dòng nào.'); return; }
        if ($('#pasteTop').checked) rows = rows.reverse();
        if (id === 'replace') { S.floors = rows; S.groups.forEach(function (g) { g.cells = {}; }); S.datumId = (rows.find(function (r) { return /^T1$|^tầng 1$/i.test(r.name); }) || rows[0]).id; }
        else { const top = S.floors[S.floors.length - 1]; S.floors = S.floors.concat(rows); inheritCells(rows.map(function (r) { return r.id; }), top, null); }
        if (!S.datumId) S.datumId = S.floors[0].id;
        ui.paste = false; break;
      }
      case 'addGroup': { const g = newGroup('Nhóm ' + (S.groups.length + 1)); S.groups.push(g); if (!S.sim.groupId) S.sim.groupId = g.id; if (!S.sizing.groupId) S.sizing.groupId = g.id; break; }
      case 'dupGroup': { const g = JSON.parse(JSON.stringify(groupById(id))); g.id = uid(); g.name += ' (PA2)'; S.groups.splice(S.groups.indexOf(groupById(id)) + 1, 0, g); break; }
      case 'delGroup': if (!confirm('Xoá nhóm ' + groupById(id).name + '?')) return; S.groups = S.groups.filter(function (g) { return g.id !== id; }); break;
      case 'setRange': case 'clearRange': {
        const g = groupById(id);
        const fl = AL.computeElevations(S);
        let i0 = +$('#rFrom-' + id).value, i1 = +$('#rTo-' + id).value;
        if (i0 > i1) { const t = i0; i0 = i1; i1 = t; }
        fl.forEach(function (f, i) {
          const c = g.cells[f.id] || (g.cells[f.id] = { s: false, sh: 0 });
          if (a === 'clearRange') { c.s = false; return; }
          if (i >= i0 && i <= i1) c.s = true;
        });
        break;
      }
      case 'autoShare':
        S.floors.forEach(function (f) {
          if (!(+f.pop > 0)) return;
          const gs = S.groups.filter(function (g) { return g.cells[f.id] && g.cells[f.id].s; });
          gs.forEach(function (g) { g.cells[f.id].sh = Math.round((100 / gs.length) * 100) / 100; });
        });
        break;
      case 'runSizing': {
        const g = groupById(S.sizing.groupId);
        const z = S.sizing;
        const r = AL.size(AL.buildGroupInput(S, g), g, { maxL: Math.max(1, Math.round(+z.maxL || 12)),
          loads: parseList(z.loads).filter(function (q) { return !(+z.qMin > 0) || q >= +z.qMin; }),
          speeds: parseList(z.speeds).filter(function (v) { return !(+z.vMax > 0) || v <= +z.vMax; }),
          tMax: +z.tMax > 0 ? +z.tMax : 0 });
        lastSizing = { gid: g.id, r: r }; break;
      }
      case 'applySizing': {
        const g = groupById(S.sizing.groupId), p = id.split('|');
        g.L = +p[0]; g.Q = +p[1]; g.v = +p[2]; tab = 'calc'; break;
      }
      case 'runSim': {
        const g = groupById(S.sim.groupId), gi = AL.buildGroupInput(S, g), e = AL.evaluate(gi, g);
        if (e.errors.length) { alert(e.errors.join('\n')); return; }
        const m = S.sim, cfg = simCfg(m);
        if (!cfg) { alert('Tỷ lệ lên/xuống/giữa tầng phải > 0.'); return; }
        $('#simStatus').textContent = 'Đang chạy…';
        setTimeout(function () {
          const t0 = performance.now();
          const r = AL.simulateRuns(gi, g, cfg, Math.max(1, Math.min(50, Math.round(+m.runs || 1))));
          lastSim = { gid: g.id, r: r, cfg: cfg, label: AL.PROFILES[m.profile].label,
            cfgText: simCfgText(cfg, g, true), ms: performance.now() - t0 };
          render();
        }, 30);
        return;
      }
      case 'runSweep': {
        const g = groupById(S.sim.groupId), gi = AL.buildGroupInput(S, g), e = AL.evaluate(gi, g);
        if (e.errors.length) { alert(e.errors.join('\n')); return; }
        const m = S.sim, cfg = simCfg(m);
        if (!cfg) { alert('Tỷ lệ lên/xuống/giữa tầng phải > 0.'); return; }
        const rates = parseList(m.sweep == null ? '4, 5, 6, 7, 8, 9, 10, 11, 12' : m.sweep).filter(function (x, i, a) { return a.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
        if (!rates.length) { alert('Nhập ít nhất một mức nhu cầu > 0, ví dụ: 5, 6, 7, 8.'); return; }
        if (rates.length > 40) { alert('Tối đa 40 mức nhu cầu.'); return; }
        const runs = Math.max(1, Math.min(50, Math.round(+m.runs || 1))), rows = [], st = $('#sweepStatus');
        const step = function (i) {
          if (i >= rates.length) {
            lastSweep = { gid: g.id, rows: rows, runs: runs, cfg: cfg, label: AL.PROFILES[m.profile].label, cfgText: simCfgText(cfg, g, false) };
            render(); return;
          }
          if (st) st.textContent = 'Đang chạy mức ' + fmt(rates[i], 1) + '% (' + (i + 1) + '/' + rates.length + ')…';
          setTimeout(function () {
            const r = AL.simulateRuns(gi, g, Object.assign({}, cfg, { rate: rates[i] }), runs);
            const k = satRuns(r);
            rows.push({ rate: rates[i], m: r.mean, sat: k > 0, satK: k, runs: r.runs });
            step(i + 1);
          }, 15);
        };
        step(0);
        return;
      }
      case 'print': window.print(); return;
      case 'addLift': { const d = AL.LiftTab.defaults()[0]; d.name = 'Thang mới'; (S.lifts = S.lifts || AL.LiftTab.defaults()).push(d); break; }
      case 'delLift': if (!confirm('Xoá thang này?')) return; S.lifts = S.lifts.filter(function (x) { return x.id !== id; }); break;
      case 'delLib': if (!confirm('Xoá dòng máy đã nạp?')) return; S.liftLib = (S.liftLib || []).filter(function (x) { return x.id !== id; }); break;
      case 'importOne': {
        const g = function (k) { return num($('#io_' + k).value); };
        const brand = $('#io_brand').value, model = $('#io_model').value.trim(), src = $('#io_src').value.trim();
        const need = ['Q', 'v', 'BB', 'DD', 'WW', 'WD'].filter(function (k) { return !(g(k) > 0); });
        if (!model || !src || need.length) { alert('Cần nhập Dòng máy, Nguồn' + (need.length ? ' và: ' + need.join(', ') : '') + '.'); return; }
        const row = [$('#io_door').value, g('Q'), AL.capacityFromLoad(g('Q')), g('v'), g('BB'), g('DD'), g('LL') || 0, g('WW'), g('WD'),
          g('PH') || null, g('OH') || null, $('#io_mr').value.trim() || null, g('TR') || null, g('ST') || null, g('CH') || null, g('HH') || null, 'Nguồn: ' + src, $('#io_cwt').value || null, +$('#io_ent').value || 1];
        const name = model + ' (nhập từ công cụ hãng)';
        S.liftLib = S.liftLib || [];
        let m = S.liftLib.find(function (x) { return x.brand === brand && x.model === name; });
        if (!m) {
          m = { id: uid(), brand: brand, model: name, type: $('#io_type').value, typeLabel: $('#io_type').selectedOptions[0].text,
            source: 'Nhập tay từ công cụ thiết kế online của hãng — nguồn ghi ở từng cấu hình', exactSpeed: true, rows: [] };
          S.liftLib.push(m);
        }
        m.rows.push(row);
        alert('Đã thêm cấu hình ' + row[1] + ' kg / ' + row[3] + ' m/s vào "' + name + '" (' + m.rows.length + ' cấu hình).');
        break;
      }
      case 'importLib': {
        const brand = $('#libBrand').value.trim(), model = $('#libModel').value.trim(), src = $('#libSrc').value.trim();
        if (!brand || !model || !src) { alert('Cần nhập Hãng, Dòng máy và Nguồn.'); return; }
        const rows = $('#libRows').value.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) {
          const c = l.split('\t');
          const door = (c[0] || '').trim().toUpperCase();
          return [door === 'CO' ? 'CO' : '2S', num(c[1]), num(c[2]), num(c[3]), num(c[4]), num(c[5]), num(c[6]), num(c[7]), num(c[8]), num(c[9]) || null, num(c[10]) || null, (c[11] || '').trim() || null, num(c[12]) || null, num(c[13]) || null];
        }).filter(function (r) { return r[1] > 0 && r[3] > 0 && r[7] > 0 && r[8] > 0; });
        if (!rows.length) { alert('Không đọc được dòng hợp lệ (cần ít nhất Tải trọng, Vận tốc, WW, WD).'); return; }
        (S.liftLib = S.liftLib || []).push({ id: uid(), brand: brand, model: model, type: $('#libType').value, typeLabel: $('#libType').selectedOptions[0].text, source: src, exactSpeed: true, rows: rows });
        alert('Đã nạp ' + rows.length + ' cấu hình cho ' + brand + ' ' + model + '.');
        break;
      }
      case 'csv': exportCsv(); return;
      case 'stopServer': stopServer(); return;
      case 'new': if (!confirm('Tạo dự án mới? Dữ liệu chưa lưu file .json sẽ mất.')) return; S = blank(); lastSim = lastSweep = lastSizing = null; tab = 'building'; break;
      case 'example': if (!confirm('Nạp dự án ví dụ (thay dữ liệu hiện tại)?')) return; S = example(); lastSim = lastSweep = lastSizing = null; tab = 'building'; break;
      case 'open': $('#fileIn').click(); return;
      case 'saveFile': {
        const name = (S.project.code ? S.project.code + '_' : '') + 'ArchiLift_' + new Date().toISOString().slice(0, 10) + '.json';
        download(name, JSON.stringify(S, null, 1), 'application/json'); return;
      }
      default: return;
    }
    save(); render();
  });
  $('#fileIn').addEventListener('change', function (ev) {
    const f = ev.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = function () {
      try { const s = JSON.parse(rd.result); if (!s.floors || !s.groups) throw new Error('Sai định dạng'); S = s; lastSim = lastSweep = lastSizing = null; save(); render(); }
      catch (e) { alert('Không đọc được file: ' + e.message); }
    };
    rd.readAsText(f, 'utf-8'); ev.target.value = '';
  });
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function exportCsv() {
    const rs = evalAll();
    const q = function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; };
    const n = function (x, d) { return x == null || !isFinite(x) ? '' : Number(x).toFixed(d).replace('.', ','); };
    const rows = [['Nhóm', 'Số cabin', 'Tải trọng (kg)', 'CC (người)', 'Vận tốc (m/s)', 'Dân số phục vụ', 'Hành trình (m)', 'P (người)', 'S', 'SE', 'H (m)', 'ts (s)', 'RTT (s)', 'INT (s)', 'HC5 (người/5ph)', 'HC5 (%)', 'AWT ước tính (s)', 'Nhu cầu (người/5ph)', 'Hệ số tải tại nhu cầu (%)', 'AWT tại nhu cầu (s)', 'Kết luận']];
    rs.forEach(function (r) {
      const e = r.e, g = r.g;
      if (e.errors.length) { rows.push([g.name, 'Lỗi: ' + e.errors.join(' ')]); return; }
      rows.push([g.name, e.L, g.Q, e.CC, n(+g.v, 2), n(e.pop, 0), n(e.travel, 2), n(e.cap.P, 2), n(e.cap.SU, 2), n(e.cap.SE, 2), n(e.cap.Htop, 2), n(e.cap.ts, 2), n(e.cap.rtt, 1), n(e.cap.int, 1), n(e.cap.hc5, 1), n(e.cap.hc5pct, 2), n(e.cap.awt, 1),
        e.dem ? n(e.dem.lam5, 1) : '', e.dem && !e.dem.overload ? n(e.dem.lf * 100, 1) : (e.dem ? 'Quá tải' : ''), e.dem && !e.dem.overload ? n(e.dem.awt, 1) : '', e.pass ? 'Đạt' : 'Không đạt']);
    });
    const name = (S.project.code ? S.project.code + '_' : '') + 'TK-ThangMay_' + new Date().toISOString().slice(0, 10) + '.csv';
    download(name, '﻿' + rows.map(function (r) { return r.map(q).join(';'); }).join('\r\n'), 'text/csv;charset=utf-8');
  }

  /* ---------- khởi động ---------- */
  document.getElementById('dlLoads').innerHTML = AL.LOADS.map(function (x) { return '<option value="' + x + '">'; }).join('');
  document.getElementById('dlSpeeds').innerHTML = AL.SPEEDS.map(function (x) { return '<option value="' + x + '">'; }).join('');
  S = load();
  try { ui.mergeZoning = localStorage.getItem(STORE + '.merge') !== '0'; } catch (e) { ui.mergeZoning = true; }
  try { ui.mergeFloors = localStorage.getItem(STORE + '.mergeF') !== '0'; } catch (e) { ui.mergeFloors = true; }
  try { ui.mergeMatrix = localStorage.getItem(STORE + '.mergeM') !== '0'; } catch (e) { ui.mergeMatrix = true; }
  render();
  shareInit();
  serverInit();
  window.addEventListener('resize', function () { if (tab === 'sim' || tab === 'report') { drawSim(); drawSweep(); } });

  /* ---------- mặt bằng công trình (tab 6): dán / kéo thả ảnh, đặt – dời – đổi tên – xoá nhãn ---------- */
  document.addEventListener('paste', function (ev) {
    if (tab !== 'report' || !ev.clipboardData) return;
    const it = Array.prototype.find.call(ev.clipboardData.items || [], function (x) { return /^image\//.test(x.type); });
    if (it) { ev.preventDefault(); loadPlanImage(it.getAsFile()); }
  });
  document.addEventListener('dragover', function (ev) { if (ev.target.closest && ev.target.closest('#planBox')) ev.preventDefault(); });
  document.addEventListener('drop', function (ev) {
    if (!(ev.target.closest && ev.target.closest('#planBox'))) return;
    ev.preventDefault();
    if (ev.dataTransfer.files[0]) loadPlanImage(ev.dataTransfer.files[0]);
  });
  const planRel = function (ev) {
    const r = document.querySelector('#planBox img').getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)) };
  };
  /* kéo: nhãn (label) — có mũi tên thì chỉ dời nhãn, không thì dời cả nhãn; đầu mũi tên (anchor); góc co kéo ảnh (resize) */
  let planDrag = null;
  const pct = function (v) { return (v * 100) + '%'; };
  document.addEventListener('mousedown', function (ev) {
    if (ev.button !== 0 || !ev.target.closest) return;
    const t = ev.target.closest('#planBox .pmark, #planBox .panchor, #planBox .presize');
    if (!t) return;
    ev.preventDefault();
    const type = t.classList.contains('pmark') ? 'label' : t.classList.contains('panchor') ? 'anchor' : 'resize';
    planDrag = { type: type, el: t, i: +t.dataset.i, moved: false, x0: ev.clientX, y0: ev.clientY };
  });
  document.addEventListener('mousemove', function (ev) {
    if (!planDrag) return;
    const d = planDrag;
    if (!d.moved && Math.abs(ev.clientX - d.x0) + Math.abs(ev.clientY - d.y0) < 4) return;   // bấm (không kéo) = mở bảng sửa
    d.moved = true;
    if (d.type === 'resize') {
      const box = $('#planBox'), wrap = box.parentElement.getBoundingClientRect();
      d.w = Math.round(Math.max(20, Math.min(100, (ev.clientX - box.getBoundingClientRect().left) / wrap.width * 100)));
      box.style.width = d.w + '%'; const lab = $('#planWv'); if (lab) lab.textContent = d.w + '%';
      return;
    }
    const p = planRel(ev), m = S.plan.marks[d.i], ln = document.getElementById('pl' + d.i);
    d.p = p;
    d.el.style.left = pct(p.x); d.el.style.top = pct(p.y);
    if (d.type === 'label' && !m.ar) return;
    if (ln && d.type === 'label') { ln.setAttribute('x1', pct(p.x)); ln.setAttribute('y1', pct(p.y)); }
    if (ln && d.type === 'anchor') { ln.setAttribute('x2', pct(p.x)); ln.setAttribute('y2', pct(p.y)); }
  });
  document.addEventListener('mouseup', function () {
    if (!planDrag) return;
    const d = planDrag; planDrag = null;
    if (d.type === 'resize') { if (d.moved) { S.plan.w = d.w; save(); render(); } return; }
    const m = S.plan.marks[d.i];
    if (!d.moved) { if (d.type === 'label') { ui.planEdit = d.i; render(); } return; }
    if (d.type === 'anchor' || !m.ar) { m.x = d.p.x; m.y = d.p.y; } else { m.lx = d.p.x; m.ly = d.p.y; }
    save(); render();
  });
  document.addEventListener('input', function (ev) {   // thanh trượt cỡ ảnh: xem trước khi kéo
    if (ev.target.dataset && ev.target.dataset.bind === 'plan.w') { const b = $('#planBox'); if (b) b.style.width = ev.target.value + '%'; const l = $('#planWv'); if (l) l.textContent = ev.target.value + '%'; }
  });
  document.addEventListener('click', function (ev) {
    if (!(ev.target.tagName === 'IMG' && ev.target.closest('#planBox'))) return;
    if (ui.planEdit != null) { ui.planEdit = null; render(); return; }   // đang mở bảng sửa: bấm ra ngoài = đóng
    const p = planRel(ev), k = ui.planKind || 'P', marks = S.plan.marks = S.plan.marks || [];
    const n = marks.filter(function (m) { return m.k === k; }).length + 1;
    marks.push({ x: p.x, y: p.y, k: k, n: k + n });
    save(); render();
  });
  document.addEventListener('contextmenu', function (ev) {
    const mk = ev.target.closest && ev.target.closest('#planBox .pmark');
    if (!mk) return;
    ev.preventDefault();
    S.plan.marks.splice(+mk.dataset.i, 1); ui.planEdit = null; save(); render();
  });
  /* bảng sửa nhãn */
  function planEditApply(el) {
    const m = S.plan.marks[ui.planEdit];
    if (!m) return;
    if (el.id === 'pe-text') { if (el.value.trim()) m.n = el.value.trim(); }
    else if (el.id === 'pe-kind') {
      // ký hiệu đang theo mẫu tự động (vd. P3) thì đổi tiền tố theo loại mới (VP3)
      if (!m.n || new RegExp('^' + m.k + '(\\d*)$').test(m.n)) m.n = el.value + (m.n ? m.n.slice(m.k.length) : '');
      m.k = el.value;
    } else if (el.id === 'pe-arrow') {
      m.ar = el.checked;
      if (m.ar && m.lx == null) { m.lx = Math.min(0.97, m.x + 0.08); m.ly = Math.max(0.03, m.y - 0.1); }
    }
    save(); render();
  }
  /* ---------- chia sẻ LAN (chỉ khi chạy bằng serve.py / ArchiLift_LAN.bat) ----------
     Một người sửa, những người khác chỉ xem và tự cập nhật ~3 s/lần. "Xin sửa" = trở thành người sửa duy nhất. */
  /* máy chủ chạy ẩn (ArchiLift.vbs / ArchiLift_LAN.vbs): hiện nút Tắt trên chính máy chạy */
  function serverInit() {
    if (location.protocol === 'file:') return;
    fetch('api/server', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (m) {
      if (m.canStop) $('#btnStop').hidden = false;
    }).catch(function () { /* server cũ (ArchiLift.bat): không có nút Tắt */ });
  }
  function stopServer() {
    if (!confirm(share.on ? 'Tắt ArchiLift? Các máy khác trong mạng LAN cũng sẽ mất kết nối.' : 'Tắt ArchiLift? Dữ liệu đã tự lưu trong trình duyệt của máy này.')) return;
    const done = function () {
      document.body.innerHTML = '<div style="max-width:520px;margin:15vh auto;font:16px/1.6 system-ui,sans-serif;text-align:center"><h2>Đã tắt ArchiLift</h2><p>Có thể đóng tab này. Mở lại bằng <b>ArchiLift.vbs</b> (hoặc <b>ArchiLift_LAN.vbs</b> khi chia sẻ).</p></div>';
    };
    const go = function () { fetch('api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(done, done); };
    if (share.on && share.isEditor) fetch('api/release', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: share.client }) }).then(go, go);
    else go();
  }
  function shareInit() {
    if (location.protocol === 'file:') return;
    // ArchiLift.vbs (serve.py --solo): dùng một mình nhưng vẫn lưu vào file dự án chung, tự nhận quyền sửa
    fetch('api/server', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }).then(function (sv) {
      share.solo = sv.mode === 'solo';
      return fetch('api/meta', { cache: 'no-store' });
    }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (m) {
      share.on = true;
      try {
        share.client = localStorage.getItem(STORE + '.client');
        if (!share.client) { share.client = Math.random().toString(36).slice(2, 10); localStorage.setItem(STORE + '.client', share.client); }
        share.name = localStorage.getItem(STORE + '.name') || '';
      } catch (e) { share.client = Math.random().toString(36).slice(2, 10); }
      if (share.solo) {
        // giữ một bản dự án đang có trong trình duyệt trước khi thay bằng dự án trong file chung
        try { const old = localStorage.getItem(STORE); if (old && m.hasData) localStorage.setItem(STORE + '.truocKhiDungChung', old); } catch (e) { /* bỏ qua */ }
        if (!share.name) share.name = 'Máy này';
        shareClaim();
      } else shareApplyMeta(m, true);
      setInterval(sharePoll, 3000);
      window.addEventListener('pagehide', function () {
        if (share.isEditor && navigator.sendBeacon) navigator.sendBeacon('api/release', new Blob([JSON.stringify({ client: share.client })], { type: 'application/json' }));
      });
    }).catch(function () { /* server thường (ArchiLift.bat) hoặc mở file: không chia sẻ */ });
  }
  function shareLoad() {
    return fetch('api/state', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (m) {
      if (m.data && m.data.floors) { S = m.data; lastSim = lastSweep = lastSizing = null; }
      share.rev = m.rev;
      return m;
    });
  }
  function shareApplyMeta(m, first) {
    const wasEditor = share.isEditor;
    share.editorName = m.editorName || ''; share.hasEditor = !!m.editor;
    share.isEditor = m.editor === share.client;
    if (wasEditor && !share.isEditor) alert('Người khác (' + (m.editorName || 'máy khác') + ') đã nhận quyền sửa — bạn chuyển sang chỉ xem.');
    if ((first || m.rev !== share.rev) && m.hasData && !share.isEditor) {
      const y = window.scrollY;
      return shareLoad().then(function () { render(); window.scrollTo(0, y); });
    }
    render();
  }
  function sharePoll() {
    if (share.pushing) return;
    fetch('api/meta?client=' + encodeURIComponent(share.client), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (m) {
      share.offline = false;
      if (m.rev !== share.rev || (m.editor === share.client) !== share.isEditor || (m.editorName || '') !== share.editorName || !!m.editor !== share.hasEditor) shareApplyMeta(m);
    }).catch(function () { if (!share.offline) { share.offline = true; renderShareBar(); } });
  }
  let pushTimer = null;
  function sharePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      share.pushing = true;
      fetch('api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: share.client, data: S }) })
        .then(function (r) { return r.json().then(function (m) { return { ok: r.ok, m: m }; }); })
        .then(function (x) { share.pushing = false; share.rev = x.m.rev; if (!x.ok) shareApplyMeta(x.m); else renderShareBar(); })
        .catch(function () { share.pushing = false; alert('Không lưu được lên máy chủ chia sẻ — kiểm tra cửa sổ ArchiLift_LAN.bat còn chạy.'); });
    }, 400);
  }
  function shareClaim() {
    let name = share.name;
    if (!name) {
      name = (prompt('Tên của bạn (hiện cho người khác biết ai đang sửa):', '') || '').trim() || ('Máy ' + share.client.slice(0, 4));
      share.name = name; try { localStorage.setItem(STORE + '.name', name); } catch (e) { /* bỏ qua */ }
    }
    const send = function (force) {
      return fetch('api/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: share.client, name: name, force: !!force }) })
        .then(function (r) { return r.json().then(function (m) { return { ok: r.ok, m: m }; }); });
    };
    send(false).then(function (x) {
      if (x.ok) return x.m;
      // người khác đang sửa: hỏi trước khi giành quyền (người kia sẽ chuyển sang chỉ xem)
      if (!confirm((x.m.editorName || 'Máy khác') + ' đang sửa dự án.\n\nVẫn giành quyền sửa? Người kia sẽ chuyển sang chỉ xem; thay đổi họ chưa kịp lưu có thể mất.')) { shareApplyMeta(x.m); return null; }
      return send(true).then(function (y) { return y.m; });
    }).then(function (m) {
        if (!m) return;
        share.isEditor = true; share.hasEditor = true; share.editorName = name;
        if (m.hasData) return shareLoad().then(function () { render(); });
        // chưa có dự án chia sẻ: đưa dự án đang mở trên máy này lên
        sharePush(); render();
      });
  }
  function shareRelease() {
    fetch('api/release', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client: share.client }) })
      .then(function (r) { return r.json(); }).then(function (m) { share.isEditor = false; shareApplyMeta(m); });
  }
  function renderShareBar() {
    const el = $('#shareBar');
    if (!el) return;
    if (!share.on) { el.innerHTML = ''; return; }
    document.body.classList.toggle('viewer', !share.isEditor);
    if (share.solo && share.isEditor && !share.offline) { el.innerHTML = ''; return; }   // dùng một mình: không cần thanh chia sẻ
    let h = '<span class="sh-dot' + (share.offline ? ' off' : '') + '"></span>';
    if (share.offline) h += '<span>Mất kết nối máy chủ chia sẻ</span>';
    else if (share.isEditor) h += '<span><b>Bạn đang sửa</b> — người khác xem trực tiếp</span><button data-act="shareRelease">Thôi sửa</button>';
    else h += '<span><b>Chỉ xem</b> — ' + (share.hasEditor ? esc(share.editorName || 'máy khác') + ' đang sửa' : 'chưa ai sửa') + '</span><button class="pri" data-act="shareClaim">Xin sửa</button>';
    el.innerHTML = h;
  }
  /* người xem: chặn mọi thao tác làm thay đổi dự án (bắt ở pha capture, trước các xử lý khác) */
  const VIEW_ACTS = ['tab', 'print', 'csv', 'saveFile', 'mergeZoning', 'mergeFloors', 'mergeMatrix', 'runSim', 'runSweep', 'runSizing', 'shareClaim', 'shareRelease', 'stopServer'];
  const viewer = function () { return share.on && !share.isEditor; };
  ['click', 'change', 'mousedown', 'contextmenu', 'paste', 'drop', 'dblclick'].forEach(function (type) {
    document.addEventListener(type, function (ev) {
      if (!viewer()) return;
      const t = ev.target;
      if (type === 'paste' && tab !== 'report') return;
      const act = t.closest && t.closest('[data-act]');
      if (act && VIEW_ACTS.indexOf(act.dataset.act) >= 0) return;
      const inPlan = t.closest && t.closest('#planBox, .plan-tools');
      if (act || inPlan || type === 'paste' || type === 'drop' || (type === 'change' && t.closest && t.closest('#main'))) { ev.stopImmediatePropagation(); ev.preventDefault(); }
    }, true);
  });
  document.addEventListener('click', function (ev) {
    const b = ev.target.closest && ev.target.closest('[data-act="shareClaim"], [data-act="shareRelease"]');
    if (!b) return;
    if (b.dataset.act === 'shareClaim') shareClaim(); else shareRelease();
  });
  window.ArchiLift = { get state() { return S; } };
})();
