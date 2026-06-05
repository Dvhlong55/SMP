import os
import re

GISCUS_HTML_BLOCK = '''
            <!-- Thảo Luận & Góp Ý (Giscus) -->
            <div class="giscus-section-outer fade-up" style="max-width: 900px; margin: 0 auto 48px auto; padding: 0 24px;">
                <h2 style="font-family: 'Playfair Display', serif; font-size: 1.6rem; margin-bottom: 24px; color: var(--text-main);">Thảo Luận &amp; Góp Ý</h2>
                <div id="giscus-container"></div>
            </div>

'''

def main():
    count = 0
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d != '.git']
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    content = fh.read()
            except Exception as e:
                print(f"Error reading {path}: {e}")
                continue
            
            original = content
            
            # Step 1: Remove <div class="comment-section fade-up"> ... </div>
            # To be safe, we match <div class="comment-section fade-up"> up to </aside>
            # But wait, we shouldn't delete </aside>.
            # Let's match from <div class="comment-section" to the end of its div, but since we can't reliably parse HTML with regex, we can match to </aside> and keep </aside>.
            pattern_remove = re.compile(r'<div class="comment-section[^>]*>.*?</aside>', re.DOTALL)
            content = pattern_remove.sub('</aside>', content)
            
            # Step 2: Insert Giscus before stats-strip
            # Match <div class="stats-strip fade-up"> and replace with GISCUS + <div class="stats-strip fade-up">
            # Ensure we don't insert it twice if already present
            if '<!-- Thảo Luận & Góp Ý (Giscus) -->' not in content:
                pattern_insert = re.compile(r'<div class="stats-strip fade-up">')
                # Only insert if stats-strip exists
                if pattern_insert.search(content):
                    content = pattern_insert.sub(GISCUS_HTML_BLOCK + r'<div class="stats-strip fade-up">', content, count=1)

            if content != original:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(content)
                print(f'Updated: {path}')
                count += 1
                
    print(f'Done! {count} files updated.')

if __name__ == '__main__':
    main()
