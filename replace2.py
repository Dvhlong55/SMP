import os
import re

def main():
    root_dir = "c:/Users/HOANG LONG/Desktop/wED/SMP"
    
    # literal strings in JS and HTML (breadcrumbs)
    literal_replacements = [
        ('"/SMP/Math/toanhoc.html?filter=', '"/SMP/pages/toanhoc.html?filter='),
        ('"/SMP/Non-Math/nonmath.html?filter=', '"/SMP/pages/nonmath.html?filter='),
        ('"/SMP/My-Life/cuocsong.html?filter=', '"/SMP/pages/cuocsong.html?filter='),
        ('"/SMP/About-Me/vetoi.html?filter=', '"/SMP/pages/vetoi.html?filter='),
        ('href="/SMP/Math/toanhoc.html"', 'href="/SMP/pages/toanhoc.html"'),
        ('href="/SMP/Non-Math/nonmath.html"', 'href="/SMP/pages/nonmath.html"'),
        ('href="/SMP/My-Life/cuocsong.html"', 'href="/SMP/pages/cuocsong.html"'),
        ('href="/SMP/About-Me/vetoi.html"', 'href="/SMP/pages/vetoi.html"')
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
                    
                    for old_str, new_str in literal_replacements:
                        new_content = new_content.replace(old_str, new_str)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except Exception as e:
                    print(f"Failed to process {filepath}: {e}")

if __name__ == "__main__":
    main()
