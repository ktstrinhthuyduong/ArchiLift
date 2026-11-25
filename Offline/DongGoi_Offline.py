# -*- coding: utf-8 -*-
r"""Đóng gói ArchiLift bản offline thành một file .zip nhỏ nhất để mang sang máy khác.

Chạy:  python Offline\DongGoi_Offline.py
Kết quả: ArchiLift_Offline_<yyyy-mm-dd>.zip (đã có thì _v02, _v03…) ở thư mục ArchiLift, chứa:
  ArchiLift_Offline\
    ArchiLift.vbs                  mở thành cửa sổ ứng dụng (Edge/Chrome --app)
    Tao loi tat ArchiLift.vbs      tạo lối tắt Desktop + Start Menu
    HUONG_DAN.txt
    app\                           chỉ các file giao diện cần thiết (html, css, js, img)
Không đóng gói: serve.py, _shared (dữ liệu dự án chung), docs, Catalog hãng, bộ cài máy chủ.
"""
import datetime
import os
import re
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
APP = os.path.join(ROOT, 'app')
TOP = 'ArchiLift_Offline'
KEEP = {'.html', '.css', '.js', '.ico', '.png'}          # chỉ lấy loại file giao diện dùng tới


def out_name():
    base = 'ArchiLift_Offline_' + datetime.date.today().isoformat()
    p = os.path.join(ROOT, base + '.zip')
    n = 1
    while os.path.exists(p):           # không ghi đè gói cũ
        n += 1
        p = os.path.join(ROOT, '%s_v%02d.zip' % (base, n))
    return p


def main():
    with open(os.path.join(APP, 'index.html'), encoding='utf-8') as f:
        m = re.search(r'\?v=(\d{8}\w*)', f.read())
    ver = m.group(1) if m else '?'
    files = []
    for d, _, fs in os.walk(APP):
        for fn in sorted(fs):
            if os.path.splitext(fn)[1].lower() in KEEP:
                full = os.path.join(d, fn)
                files.append((full, TOP + '/app/' + os.path.relpath(full, APP).replace('\\', '/')))
    for fn in ('ArchiLift.vbs', 'Tao loi tat ArchiLift.vbs'):
        files.append((os.path.join(HERE, fn), TOP + '/' + fn))
    with open(os.path.join(HERE, 'HUONG_DAN.txt'), encoding='utf-8-sig') as f:
        guide = f.read()
    guide = guide.replace('=' * 69, '=' * 69 + '\nPhiên bản code: %s – đóng gói ngày %s' % (ver, datetime.date.today().strftime('%d/%m/%Y')), 1)

    out = out_name()
    raw = 0
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for src, arc in files:
            z.write(src, arc)
            raw += os.path.getsize(src)
        z.writestr(TOP + '/HUONG_DAN.txt', ('﻿' + guide).encode('utf-8'))
    print('Đã tạo:', out)
    print('Phiên bản code: %s | %d file | gốc %.0f KB -> nén %.0f KB' % (ver, len(files) + 1, raw / 1024, os.path.getsize(out) / 1024))


if __name__ == '__main__':
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass
    main()
