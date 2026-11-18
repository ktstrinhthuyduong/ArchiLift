/* Biểu đồ canvas tối giản (không cần thư viện ngoài, chạy offline). */
(function (global) {
  'use strict';
  const AL = global.AL;

  function css(name, fb) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  }
  function setup(canvas, h) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentNode.clientWidth || 600;
    canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '12px Segoe UI, Arial, sans-serif';
    return { ctx: ctx, w: w, h: h };
  }
  function niceMax(x) {
    if (!(x > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(x)));
    const m = x / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 4 ? 4 : m <= 6 ? 6 : m <= 8 ? 8 : 10) * p; // chia hết cho 4 vạch
  }
  function axes(c, pad, ymax, ylabel, xlabel) {
    const ctx = c.ctx, ink = css('--muted', '#666'), grid = css('--line', '#ddd');
    ctx.strokeStyle = grid; ctx.fillStyle = ink; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (c.h - pad.t - pad.b) * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(pad.l, y + 0.5); ctx.lineTo(c.w - pad.r, y + 0.5); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const val = ymax * i / 4;
      ctx.fillText(Number.isInteger(val) ? val : val.toFixed(1), pad.l - 6, y);
    }
    ctx.save(); ctx.translate(12, pad.t + (c.h - pad.t - pad.b) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText(ylabel || '', 0, 0); ctx.restore();
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(xlabel || '', pad.l + (c.w - pad.l - pad.r) / 2, c.h - 4);
  }

  /* Biểu đồ cột: labels[], values[], tô màu nhấn các cột có flag[i] */
  AL.barChart = function (canvas, labels, values, opt) {
    opt = opt || {};
    const c = setup(canvas, opt.height || 240), ctx = c.ctx;
    const pad = { l: 52, r: 12, t: 12, b: 42 };
    const ymax = niceMax(Math.max.apply(null, values.concat([opt.minMax || 0])));
    axes(c, pad, ymax, opt.ylabel, opt.xlabel);
    const n = values.length, pw = c.w - pad.l - pad.r, ph = c.h - pad.t - pad.b;
    const bw = pw / n;
    const every = Math.ceil(n / Math.max(1, Math.floor(pw / 46)));
    values.forEach(function (v, i) {
      const h = (v / ymax) * ph;
      ctx.fillStyle = opt.flag && opt.flag[i] ? css('--bad', '#c0392b') : css('--accent', '#1f6f8b');
      ctx.fillRect(pad.l + i * bw + 1, pad.t + ph - h, Math.max(1, bw - 2), h);
      if (i % every === 0) {
        ctx.fillStyle = css('--muted', '#666'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(labels[i], pad.l + i * bw + bw / 2, pad.t + ph + 4);
      }
    });
  };

  /* Biểu đồ đường: xs[], ys[] */
  AL.lineChart = function (canvas, xs, ys, opt) {
    opt = opt || {};
    const c = setup(canvas, opt.height || 240), ctx = c.ctx;
    const pad = { l: 52, r: 12, t: 12, b: 42 };
    const ymax = niceMax(Math.max.apply(null, ys.concat([1])));
    const xmax = xs.length ? xs[xs.length - 1] : 1;
    axes(c, pad, ymax, opt.ylabel, opt.xlabel);
    const pw = c.w - pad.l - pad.r, ph = c.h - pad.t - pad.b;
    const X = function (x) { return pad.l + (x / xmax) * pw; }, Y = function (y) { return pad.t + ph - (y / ymax) * ph; };
    ctx.fillStyle = css('--muted', '#666'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const stepX = niceMax(xmax / 6);
    for (let x = 0; x <= xmax; x += stepX) ctx.fillText(opt.xfmt ? opt.xfmt(x) : x, X(x), pad.t + ph + 4);
    if (opt.mark != null) {
      ctx.strokeStyle = css('--warn', '#d68910'); ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(X(opt.mark), pad.t); ctx.lineTo(X(opt.mark), pad.t + ph); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.strokeStyle = css('--accent', '#1f6f8b'); ctx.lineWidth = 2; ctx.beginPath();
    xs.forEach(function (x, i) { if (i) ctx.lineTo(X(x), Y(ys[i])); else ctx.moveTo(X(x), Y(ys[i])); });
    ctx.stroke();
  };
})(window);
