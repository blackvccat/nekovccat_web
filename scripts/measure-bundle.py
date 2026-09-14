"""Measure scripts referenced by production HTML; excludes subsequently lazy-loaded code.

Usage: python3 scripts/measure-bundle.py frontend/.next
The gzip figure is reproducible local compression, not a browser transfer measurement.
"""
import gzip
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'frontend/.next')
result = {}
for route, name in [('/', 'index'), ('/my-world', 'my-world')]:
    page = (root / 'server/app' / (name + '.html')).read_text()
    paths = sorted(set(re.findall(r'<script[^>]+src="([^"?]+)"', page)))
    scripts = []
    for path in paths:
        if not path.startswith('/_next/static/'):
            continue
        data = (root / path[len('/_next/'):]).read_bytes()
        scripts.append({'url': path, 'bytes': len(data), 'gzip_bytes': len(gzip.compress(data, mtime=0))})
    result[route] = {
        'html_bytes': len(page.encode()),
        'scripts': scripts,
        'script_bytes': sum(item['bytes'] for item in scripts),
        'script_gzip_bytes': sum(item['gzip_bytes'] for item in scripts),
    }
print(json.dumps(result, indent=2))
