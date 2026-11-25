# -*- coding: utf-8 -*-
r"""ArchiLift – server nội bộ có chia sẻ dự án trong mạng LAN.

Chạy:  python serve.py [cổng] [địa chỉ bind] [file chia sẻ] [--solo]   (mặc định 8765, 0.0.0.0, _shared\ArchiLift_chung.json)
- --solo: dùng một mình trên máy này (ArchiLift.vbs). Vẫn đọc/ghi CÙNG file dự án chia sẻ như chế độ LAN;
  trình duyệt tự nhận quyền sửa, không hiện thanh "Xin sửa".
- Chạy ẩn bằng pythonw (ArchiLift.vbs / ArchiLift_LAN.vbs): không có cửa sổ, log ghi vào %TEMP%\ArchiLift_server.log.
- Phục vụ thư mục app\ như trước (không cache, trình duyệt luôn lấy code mới).
- Dự án chia sẻ lưu tại _shared\ArchiLift_chung.json (cạnh file này).
- Mỗi lúc chỉ MỘT người sửa ("Xin sửa"); những người khác chỉ xem, tự cập nhật.

API (JSON):
  GET  /api/meta     -> {rev, editor, editorName, hasData}
  GET  /api/state    -> {rev, editor, editorName, data}
  POST /api/claim    {client, name, force?}  -> trở thành người sửa; đang có người khác sửa -> 409 'busy'
                     (gửi lại với force=true sau khi người dùng xác nhận). Máy đang sửa không liên lạc
                     quá 10 phút thì quyền sửa tự được thả.
  Mỗi lần lưu: bản cũ được chép vào _shared\backup (tối đa 1 bản / 5 phút, giữ 10 bản mới nhất).
  POST /api/release  {client}        -> thôi sửa
  PUT  /api/state    {client, data}  -> lưu (chỉ người sửa), trả {rev}
  GET  /api/server   -> {app:'ArchiLift', mode:'solo'|'lan', canStop}   (canStop = yêu cầu từ chính máy chạy)
  POST /api/stop     -> tắt server (chỉ nhận từ chính máy chạy)
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

BACKUP_KEEP = 10           # số bản sao lưu giữ lại trong _shared\backup
BACKUP_EVERY = 5 * 60      # giây: tối đa một bản sao lưu mỗi 5 phút (mỗi lần gõ đều lưu, không sao lưu từng lần)
EDITOR_IDLE = 10 * 60      # giây: máy đang sửa không còn liên lạc quá lâu thì tự thả quyền sửa

lock = threading.Lock()
last_backup = [0.0]
SOLO = False
SRV = None
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


def backup_shared():
    """Chép file dự án chung hiện có sang _shared\\backup trước khi ghi đè; giữ BACKUP_KEEP bản mới nhất."""
    if not os.path.exists(SHARED) or time.time() - last_backup[0] < BACKUP_EVERY:
        return
    try:
        import shutil
        bdir = os.path.join(SHARED_DIR, 'backup')
        os.makedirs(bdir, exist_ok=True)
        stem = os.path.splitext(os.path.basename(SHARED))[0]
        shutil.copy2(SHARED, os.path.join(bdir, '%s_%s_rev%d.json' % (stem, time.strftime('%Y%m%d-%H%M%S'), st['rev'] - 1)))
        last_backup[0] = time.time()
        old = sorted(f for f in os.listdir(bdir) if f.startswith(stem + '_') and f.endswith('.json'))
        for f in old[:-BACKUP_KEEP]:
            os.remove(os.path.join(bdir, f))
    except Exception as e:   # sao lưu lỗi thì vẫn lưu dự án bình thường
        print('Không sao lưu được', e)


def editor_alive():
    """Có người đang sửa và máy đó còn liên lạc (thăm dò /api/meta 3 s một lần) trong EDITOR_IDLE giây."""
    if st['editor'] and time.time() - st['ts'] > EDITOR_IDLE:
        print('Tự thả quyền sửa của', st['editorName'] or st['editor'], '(không liên lạc quá', EDITOR_IDLE // 60, 'phút)')
        st['editor'] = None; st['editorName'] = ''
    return bool(st['editor'])


def write_shared():
    backup_shared()
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

    def _local(self):
        return self.client_address[0] in ('127.0.0.1', '::1', '::ffff:127.0.0.1')

    def do_GET(self):
        p = self.path.split('?')[0]
        if p == '/api/server':
            return self._json(200, {'app': 'ArchiLift', 'mode': 'solo' if SOLO else 'lan', 'canStop': self._local()})
        if p == '/api/meta':
            from urllib.parse import parse_qs
            client = (parse_qs(self.path.partition('?')[2]).get('client') or [None])[0]
            with lock:
                if client and client == st['editor']:
                    st['ts'] = time.time()   # máy đang sửa còn mở trang
                editor_alive()
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
        if p == '/api/stop':
            if not self._local():
                return self._json(403, {'error': 'Chỉ tắt được từ máy đang chạy ArchiLift'})
            self._json(200, {'ok': True})
            threading.Thread(target=SRV.shutdown, daemon=True).start()
            return
        with lock:
            if p == '/api/claim':
                # đang có người khác sửa và máy đó còn liên lạc: phải xác nhận (force) mới giành quyền
                if editor_alive() and st['editor'] != b.get('client') and not b.get('force'):
                    return self._json(409, dict(self._meta(), error='busy'))
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
            st['data'] = b.get('data'); st['rev'] += 1; st['ts'] = time.time()
            write_shared()
            return self._json(200, self._meta())


def main():
    global SOLO, SRV, SHARED, SHARED_DIR
    if sys.stdout is None or sys.stderr is None:   # chạy ẩn bằng pythonw: không có cửa sổ, ghi log ra file
        import tempfile
        log = open(os.path.join(tempfile.gettempdir(), 'ArchiLift_server.log'), 'a', encoding='utf-8', buffering=1)
        sys.stdout = sys.stderr = log
        print('---', time.strftime('%Y-%m-%d %H:%M:%S'))
    args = [a for a in sys.argv[1:] if a != '--solo']
    SOLO = len(args) != len(sys.argv) - 1
    for s in (sys.stdout, sys.stderr):   # cửa sổ lệnh không phải UTF-8: không để lỗi in chữ có dấu làm dừng server
        try:
            s.reconfigure(errors='replace')
        except Exception:
            pass
    port = int(args[0]) if len(args) > 0 else 8765
    bind = args[1] if len(args) > 1 else '0.0.0.0'
    if len(args) > 2:   # file chia sẻ khác (dùng khi chạy thử)
        SHARED = os.path.abspath(args[2]); SHARED_DIR = os.path.dirname(SHARED)
    load_shared()
    srv = SRV = ThreadingHTTPServer((bind, port), Handler)
    print('ArchiLift (%s) chạy tại' % ('một máy' if SOLO else 'chia sẻ LAN'), 'http://%s:%d/index.html' % ('localhost' if bind in ('0.0.0.0', '127.0.0.1') else bind, port))
    print('Dự án:', SHARED, '(rev %d)' % st['rev'] if st['data'] is not None else '(chưa có)')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    print('Đã tắt', time.strftime('%H:%M:%S'))


if __name__ == '__main__':
    main()
