import json
import os
import sys
import tempfile
from pathlib import Path
from markitdown import MarkItDown

MAX_BYTES = 12 * 1024 * 1024
MAX_MARKDOWN_CHARS = 120_000

SUPPORTED_EXTENSIONS = {'.pdf', '.docx', '.pptx', '.xlsx', '.xls', '.csv', '.txt', '.md', '.html', '.htm'}


def fail(message, code=1):
    print(json.dumps({'error': message}, ensure_ascii=False))
    raise SystemExit(code)


def main():
    raw = sys.stdin.buffer.read()
    file_name = sys.argv[1] if len(sys.argv) > 1 else 'upload.bin'
    suffix = Path(file_name).suffix.lower()

    if len(raw) > MAX_BYTES:
        fail('That file is larger than 12 MB. Please use a smaller syllabus.')
    if not raw:
        fail('No file was uploaded.')
    if suffix not in SUPPORTED_EXTENSIONS:
        fail('Unsupported file type. Use PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, or HTML.')

    path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(raw)
            path = tmp.name

        markdown = (MarkItDown().convert(path).text_content or '').strip()
        if len(markdown) < 80:
            fail('The file has little or no extractable text. Try a text-based syllabus.')

        print(json.dumps({
            'data': {
                'markdown': markdown[:MAX_MARKDOWN_CHARS],
                'file_name': file_name,
                'source_type': suffix.lstrip('.') or 'file'
            }
        }, ensure_ascii=False))
    except SystemExit:
        raise
    except Exception as exc:
        fail(f'MarkItDown could not convert this file: {exc}')
    finally:
        if path:
            try:
                os.unlink(path)
            except OSError:
                pass


if __name__ == '__main__':
    main()
