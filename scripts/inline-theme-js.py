#!/usr/bin/env python3
"""Inline apps/frontend/public/theme.js into apps/frontend/dist/index.html.

Vite has a quirk where .js files in public/ are not auto-copied to dist/.
This is fine for production (where the backend serves theme.js from
public/) but breaks on GitHub Pages where the deployed site is just
the dist/ directory and theme.js 404s, blocking the SPA from booting.

This script reads theme.js from source and substitutes the external
<script src="/theme.js"></script> reference in the built index.html
with an inline <script>...</script> containing the same content.
"""
import os
import re
import sys

SOURCE = 'apps/frontend/public/theme.js'
TARGET = 'apps/frontend/dist/index.html'


def main() -> int:
    if not os.path.exists(SOURCE):
        print(f'No theme.js at {SOURCE} — skipping inline')
        return 0
    if not os.path.exists(TARGET):
        print(f'No index.html at {TARGET} — skipping inline')
        return 0
    with open(SOURCE) as f:
        theme_js = f.read()
    with open(TARGET) as f:
        html = f.read()
    # Replace the external reference with the inline content
    pattern = r'<script\s+src="/theme\.js"\s*></script>'
    inline = '<script>\n' + theme_js + '\n</script>'
    new = re.sub(pattern, inline, html, count=1)
    if new == html:
        # Already inlined or pattern not found
        print('theme.js inline: no change (already inlined or pattern not found)')
    else:
        with open(TARGET, 'w') as f:
            f.write(new)
        print(f'theme.js inlined into index.html ({len(theme_js)} bytes)')
    return 0


if __name__ == '__main__':
    sys.exit(main())