# -*- coding: utf-8 -*-
r"""ArchiLift – server nội bộ có chia sẻ dự án trong mạng LAN.

Chạy:  python serve.py [cổng] [địa chỉ bind] [file chia sẻ]   (mặc định 8765, 0.0.0.0, _shared\ArchiLift_chung.json)
- Phục vụ thư mục app\ như trước (không cache, trình duyệt luôn lấy code mới).
- Dự án chia sẻ lưu tại _shared\ArchiLift_chung.json (cạnh file này).
- Mỗi lúc chỉ MỘT người sửa ("Xin sửa"); những người khác chỉ xem, tự cập nhật.

API (JSON):
  GET  /api/meta     -> {rev, editor, editorName, hasData}
  GET  /api/state    -> {rev, editor, editorName, data}
  POST /api/claim    {client, name}  -> trở thành người sửa
  POST /api/release  {client}        -> thôi sửa
  PUT  /api/state    {client, data}  -> lưu (chỉ người sửa), trả {rev}
"""
import json
import os
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(ROOT, 'app')
SHARED_DIR = os.path.join(ROOT, '_shared')
SHARED = os.path.join(SHARED_DIR, 'ArchiLift_chung.json')
MAX_BODY = 60 * 1024 * 1024   # ảnh mặt bằng đã thu nhỏ; giới hạn an toàn

lock = threading.Lock()
st = {'rev': 0, 'data': None, 'editor': None, 'editorName': '', 'ts': 0}


def load_shared():
    if os.path.exists(SHARED):
        try:
            with open(SHARED, encoding='utf-8') as f:
                d = json.load(f)
            st['data'] = d.get('data')
            st['rev'] = int(d.get('rev') or 1)
        except Exception as e:  # file hỏng: giữ nguyên, không ghi đè
            print('Không đọc được', SHARED, e)


def write_shared():
    os.makedirs(SHARED_DIR, exist_ok=True)
    tmp = SHARED + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump({'rev': st['rev'], 'savedAt': time.strftime('%Y-%m-%d %H:%M:%S'), 'data': st['data']}, f, ensure_ascii=False)
    os.replace(tmp, SHARED)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=APP, **kw)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):  # chỉ ghi các lệnh API thay đổi dữ liệu
        if self.command in ('POST', 'PUT'):
            sys.stderr.write('%s %s\n' % (time.strftime('%H:%M:%S'), fmt % args))

    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _body(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n > MAX_BODY:
            raise ValueError('Dữ liệu quá lớn')
        return json.loads(self.rfile.read(n).decode('utf-8') or '{}')

    def _meta(self):
        return {'rev': st['rev'], 'editor': st['editor'], 'editorName': st['editorName'], 'hasData': st['data'] is not None}

    def do_GET(self):
        p = self.path.split('?')[0]
        if p == '/api/meta':
            with lock:
                return self._json(200, self._meta())
        if p == '/api/state':
            with lock:
                m = self._meta(); m['data'] = st['data']
                return self._json(200, m)
        return super().do_GET()

    def do_POST(self):
        p = self.path.split('?')[0]
        try:
            b = self._body()
        except Exception as e:
            return self._json(400, {'error': str(e)})
        with lock:
            if p == '/api/claim':
                st['editor'] = b.get('client'); st['editorName'] = (b.get('name') or '')[:40]; st['ts'] = time.time()
                return self._json(200, self._meta())
            if p == '/api/release':
                if st['editor'] and st['editor'] == b.get('client'):
                    st['editor'] = None; st['editorName'] = ''
                return self._json(200, self._meta())
        return self._json(404, {'error': 'not found'})

    def do_PUT(self):
        if self.path.split('?')[0] != '/api/state':
            return self._json(404, {'error': 'not found'})
        try:
            b = self._body()
        except Exception as e:
            return self._json(400, {'error': str(e)})
        with lock:
            if not st['editor'] or b.get('client') != st['editor']:
                return self._json(409, dict(self._meta(), error='Bạn không còn là người sửa'))
            st['data'] = b.get('data'); st['rev'] += 1
            write_shared()
            return self._json(200, self._meta())


def main():
    for s in (sys.stdout, sys.stderr):   # cửa sổ lệnh không phải UTF-8: không để lỗi in chữ có dấu làm dừng server
        try:
            s.reconfigure(errors='replace')
        except Exception:
            pass
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    bind = sys.argv[2] if len(sys.argv) > 2 else '0.0.0.0'
    global SHARED, SHARED_DIR
    if len(sys.argv) > 3:   # file chia sẻ khác (dùng khi chạy thử)
        SHARED = os.path.abspath(sys.argv[3]); SHARED_DIR = os.path.dirname(SHARED)
    load_shared()
    srv = ThreadingHTTPServer((bind, port), Handler)
    print('ArchiLift (chia sẻ LAN) chạy tại http://%s:%d/index.html' % ('localhost' if bind in ('0.0.0.0', '127.0.0.1') else bind, port))
    print('Dự án chia sẻ:', SHARED, '(rev %d)' % st['rev'] if st['data'] is not None else '(chưa có)')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
