import json
import os
import tempfile
from pathlib import Path
from http.server import BaseHTTPRequestHandler
from markitdown import MarkItDown

MAX_BYTES = 12 * 1024 * 1024
MAX_MARKDOWN_CHARS = 120_000
SUPPORTED_EXTENSIONS = {'.pdf', '.docx', '.pptx', '.xlsx', '.xls', '.csv', '.txt', '.md', '.html', '.htm'}


def convert(raw: bytes, file_name: str) -> dict:
    if not raw:
        raise ValueError('No file was uploaded.')
    if len(raw) > MAX_BYTES:
        raise ValueError('That file is larger than 12 MB. Please use a smaller syllabus.')
    suffix = Path(file_name).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError('Unsupported file type. Use PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, or HTML.')
    path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(raw)
            path = tmp.name
        markdown = (MarkItDown().convert(path).text_content or '').strip()
        if len(markdown) < 80:
            raise ValueError('The file has little or no extractable text. Try a text-based syllabus.')
        return {'markdown': markdown[:MAX_MARKDOWN_CHARS], 'file_name': file_name, 'source_type': suffix[1:]}
    finally:
        if path:
            try: os.unlink(path)
            except OSError: pass


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('content-length', '0'))
        except ValueError:
            self._send({'error': 'Invalid upload size.'}, 400); return
        if length > MAX_BYTES:
            self._send({'error': 'That file is larger than 12 MB. Please use a smaller syllabus.'}, 413); return
        raw = self.rfile.read(length)
        try:
            data = convert(raw, self.headers.get('x-file-name', 'upload.bin'))
            self._send({'data': data}, 200)
        except ValueError as exc:
            self._send({'error': str(exc)}, 400)
        except Exception:
            self._send({'error': 'MarkItDown could not convert this file. Check the file format and Python dependencies.'}, 500)

    def do_GET(self): self._send({'error': 'Method not allowed.'}, 405)

    def _send(self, payload, status):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args): return
