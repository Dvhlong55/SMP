import os
import re

def main():
    root_dir = "c:/Users/HOANG LONG/Desktop/wED/SMP"
    
    # We want to replace any href pointing to these files with the absolute path
    replacements = [
        (r'href="[^"]*?ThachThucKiNaySo42026\.html"', 'href="/SMP/challenges/ThachThucKiNaySo42026.html"'),
        (r'href="[^"]*?guibaidexuat\.html"', 'href="/SMP/challenges/guibaidexuat.html"'),
        (r'href="[^"]*?LaTeX\.html"', 'href="/SMP/tools/LaTeX.html"'),
        (r'href="[^"]*?GeoGebra\.html"', 'href="/SMP/tools/GeoGebra.html"'),
        (r'href="[^"]*?toanhoc\.html"', 'href="/SMP/pages/toanhoc.html"'),
        (r'href="[^"]*?nonmath\.html"', 'href="/SMP/pages/nonmath.html"'),
        (r'href="[^"]*?cuocsong\.html"', 'href="/SMP/pages/cuocsong.html"'),
        (r'href="[^"]*?vetoi\.html"', 'href="/SMP/pages/vetoi.html"'),
    ]

    for subdir, _, files in os.walk(root_dir):
        if '.git' in subdir:
            continue
        for file in files:
            if file.endswith('.html') or file.endswith('.js'):
                filepath = os.path.join(subdir, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for pattern, repl in replacements:
                        # Be careful with ?filter= parameters. The regex `href="[^"]*?toanhoc\.html"`
                        # would match `href="...toanhoc.html"`, but wait:
                        # if the original was `href="toanhoc.html?filter=vmo"`, the regex `href="[^"]*?toanhoc\.html"`
                        # matches exactly up to `.html"`. Wait, NO, the pattern ends with `"`.
                        # So `toanhoc.html?filter=vmo"` wouldn't match `toanhoc\.html"`.
                        # Let's fix the regex to capture any query string if present:
                        pass
                except Exception as e:
                    pass

if __name__ == "__main__":
    main()
