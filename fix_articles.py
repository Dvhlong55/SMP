import os, re

CORRECT_BLOCK = '''                    </div>

                </div>
                
            </div>

            <!-- Thảo Luận & Góp Ý (Giscus) -->
            <div style="max-width: 900px; margin: 0 auto 48px auto; padding: 32px 24px 0 24px; border-top: 1px solid rgba(255,255,255,0.08);">
                <h2 style="font-family: 'Playfair Display', serif; font-size: 1.6rem; margin-bottom: 24px; color: var(--text-main);">Thảo Luận &amp; Góp Ý</h2>
                <div id="giscus-container"></div>
            </div>

            <div class="stats-strip fade-up">
                <div class="stat-item"><div class="stat-number">$\\Sigma$</div><div class="stat-label">Bài Viết</div></div>
                <div class="stat-item"><div class="stat-number">$\\Phi$</div><div class="stat-label">Chủ Đề</div></div>
                <div class="stat-item"><div class="stat-number">2026</div><div class="stat-label">Năm Hoạt Động</div></div>
                <div class="stat-item"><div class="stat-number">$\\infty$</div><div class="stat-label">Đam Mê</div></div>
            </div>

            <footer class="site-footer fade-up">'''

def main():
    count = 0
    skip = {'index.html', 'ThiThuLan2HSGS2526.html', 
            'dongnai-2025.html', 'HCMUS_Olympic_Team_Selection_Test_Algebra.html',
            'KhoaSoHoc.html', 'On_a_Counting_Problem_From_HCMUS_TST.html',
            'polandNumber.html', 'SoHocTrongDeThiThuToanDKHSGS2526.html',
            'toa_do_cuc.html'}  # already fixed
    
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d != '.git']
        for f in files:
            if not f.endswith('.html') or f in skip:
                continue
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    content = fh.read()
            except:
                continue
            
            original = content
            
            # Pattern: </div></div></div> (with optional whitespace/newlines) then stats-strip ... giscus ... <footer
            pattern = re.compile(
                r'</div>\s*</div>\s*</div>\s*'   # 3 closing divs
                r'(<div class="stats-strip.*?</div>)'  # stats-strip block
                r'(.*?)'                               # giscus or whitespace
                r'<footer',
                re.DOTALL
            )
            
            new_content = pattern.sub(CORRECT_BLOCK, content)
            
            if new_content != original:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new_content)
                print(f'OK: {path}')
                count += 1
            else:
                print(f'SKIP: {path}')
    
    print(f'\nDone! {count} files updated.')

if __name__ == '__main__':
    main()
