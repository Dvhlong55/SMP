import os
import re

def main():
    root_dir = "c:/Users/HOANG LONG/Desktop/wED/SMP"
    
    # regex patterns and their replacements
    replacements = [
        (r'href="[^"]*?css/shared\.css"', 'href="/SMP/core/css/shared.css"'),
        (r'src="[^"]*?js/layout\.js"', 'src="/SMP/core/js/layout.js"'),
        (r'src="[^"]*?js/shared\.js"', 'src="/SMP/core/js/shared.js"'),
        (r'src="[^"]*?js/sidebar-data\.js"', 'src="/SMP/core/js/sidebar-data.js"'),
        (r'href="[^"]*?image/favicon\.png"', 'href="/SMP/core/image/favicon.png"'),
        (r'src="[^"]*?image/image_49b1a4\.png"', 'src="/SMP/core/image/image_49b1a4.png"'),
        
        (r'href="[^"]*?Math/toanhoc\.html"', 'href="/SMP/pages/toanhoc.html"'),
        (r'href="[^"]*?Non-Math/nonmath\.html"', 'href="/SMP/pages/nonmath.html"'),
        (r'href="[^"]*?My-Life/cuocsong\.html"', 'href="/SMP/pages/cuocsong.html"'),
        (r'href="[^"]*?About-Me/vetoi\.html"', 'href="/SMP/pages/vetoi.html"'),
        
        (r'href="[^"]*?Math/LaTeX\.html"', 'href="/SMP/tools/LaTeX.html"'),
        (r'href="[^"]*?Math/GeoGebra\.html"', 'href="/SMP/tools/GeoGebra.html"'),
        
        (r'href="[^"]*?Math/ThachThucKiNaySo42026\.html"', 'href="/SMP/challenges/ThachThucKiNaySo42026.html"'),
        (r'href="[^"]*?Math/guibaidexuat\.html"', 'href="/SMP/challenges/guibaidexuat.html"'),

        (r'href="[^"]*?KhoaSoHoc\.html"', 'href="/SMP/posts/math/KhoaSoHoc.html"'),
        (r'href="[^"]*?ThiThuLan2HSGS2526\.html"', 'href="/SMP/posts/math/ThiThuLan2HSGS2526.html"'),
        (r'href="[^"]*?SoHocTrongDeThiThuToanDKHSGS2526\.html"', 'href="/SMP/posts/math/SoHocTrongDeThiThuToanDKHSGS2526.html"'),
        (r'href="[^"]*?DeThiThuLan2ToanDKHSGS\.html"', 'href="/SMP/posts/math/DeThiThuLan2ToanDKHSGS.html"'),
        (r'href="[^"]*?toa_do_cuc\.html"', 'href="/SMP/posts/math/toa_do_cuc.html"'),
        (r'href="[^"]*?HCMUS_Olympic_Team_Selection_Test_Algebra\.html"', 'href="/SMP/posts/math/HCMUS_Olympic_Team_Selection_Test_Algebra.html"'),
        (r'href="[^"]*?On_a_Counting_Problem_From_HCMUS_TST\.html"', 'href="/SMP/posts/math/On_a_Counting_Problem_From_HCMUS_TST.html"'),
        (r'href="[^"]*?Về_Một_Bài_Phương_Trình_Hàm\.html"', 'href="/SMP/posts/math/Về_Một_Bài_Phương_Trình_Hàm.html"'),
        (r'href="[^"]*?polandNumber\.html"', 'href="/SMP/posts/math/polandNumber.html"'),
        (r'href="[^"]*?dongnai-2025\.html"', 'href="/SMP/posts/math/dongnai-2025.html"'),
        
        (r'href="[^"]*?seas-quantum1\.html"', 'href="/SMP/posts/non-math/seas-quantum1.html"'),
        (r'href="[^"]*?seas-quantum2\.html"', 'href="/SMP/posts/non-math/seas-quantum2.html"'),
        (r'href="[^"]*?seas\.html"', 'href="/SMP/posts/life/seas.html"'),
    ]

    # literal strings in JS
    literal_replacements = [
        ('"/SMP/Math/toanhoc.html"', '"/SMP/pages/toanhoc.html"'),
        ('"/SMP/Non-Math/nonmath.html"', '"/SMP/pages/nonmath.html"'),
        ('"/SMP/My-Life/cuocsong.html"', '"/SMP/pages/cuocsong.html"'),
        ('"/SMP/About-Me/vetoi.html"', '"/SMP/pages/vetoi.html"')
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
                        new_content = re.sub(pattern, repl, new_content)
                    
                    for old_str, new_str in literal_replacements:
                        new_content = new_content.replace(old_str, new_str)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                except Exception as e:
                    print(f"Failed to process {filepath}: {e}")

if __name__ == "__main__":
    main()
