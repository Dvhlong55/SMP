import os
import re

def convert_post(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return

    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    title = title_match.group(1) if title_match else "SMP — Bài viết"

    # Extract Giscus ID
    giscus_match = re.search(r"Comments\.init\(['\"](.*?)['\"]\);", content)
    giscus_id = giscus_match.group(1) if giscus_match else ""

    # Extract Breadcrumbs
    breadcrumb_match = re.search(r'<span class="exam-tag">(.*?)</span>', content, re.DOTALL)
    cat_name = "HOME"
    cat_url = "/SMP/index.html"
    sub_name = ""
    sub_filter = ""
    
    if breadcrumb_match:
        bc_content = breadcrumb_match.group(1)
        # Tìm tất cả thẻ <a>
        a_tags = re.findall(r'<a href="([^"]+)"[^>]*>(.*?)</a>', bc_content)
        if len(a_tags) >= 1:
            cat_url = a_tags[0][0]
            # Loại bỏ mọi thẻ HTML khỏi cat_name nếu có
            cat_name = re.sub(r'<[^>]+>', '', a_tags[0][1]).strip()
        if len(a_tags) >= 2:
            sub_url = a_tags[1][0]
            sub_name = re.sub(r'<[^>]+>', '', a_tags[1][1]).strip()
            # Extract filter from ?filter=vmo
            filter_match = re.search(r'\?filter=([^&"]+)', sub_url)
            if filter_match:
                sub_filter = filter_match.group(1)

    # Extract actual post content
    # Look for <div class="exam-paper fade-up"> and extract until <!-- Thảo Luận & Góp Ý (Giscus) --> or the end
    paper_start = content.find('<div class="exam-paper')
    if paper_start == -1:
        print("Could not find exam-paper in file")
        return
    
    # Bỏ qua dòng `<div class="exam-paper ...">`
    paper_inner_start = content.find('>', paper_start) + 1
    
    giscus_start = content.find('<!-- Thảo Luận')
    if giscus_start == -1:
        # Nếu không có giscus, tìm </div></div></div> hoặc </div> </div>
        end_match = re.search(r'(</div>\s*)+$', content[:content.rfind('</body>')])
        if end_match:
            paper_inner_end = end_match.start()
        else:
            paper_inner_end = content.rfind('</div>')
    else:
        # Lùi lại một chút để bỏ qua các thẻ </div> bao bọc
        chunk = content[paper_inner_start:giscus_start]
        # Xoá các </div> thừa ở cuối chunk
        paper_inner_end = paper_inner_start + len(chunk)
        # Trim trailing </div>
        chunk_stripped = re.sub(r'(\s*</div>\s*)+$', '', chunk)
        paper_inner_end = paper_inner_start + len(chunk_stripped)

    post_html = content[paper_inner_start:paper_inner_end].strip()

    # Xây dựng template mới
    new_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    
    <meta name="post-id" content="{giscus_id}">
    <meta name="category-name" content="{cat_name}">
    <meta name="category-url" content="{cat_url}">
    <meta name="subcategory-name" content="{sub_name}">
    <meta name="subcategory-filter" content="{sub_filter}">

    <script src="/SMP/core/js/post-layout.js"></script>
</head>
<body>
    <div id="smp-post-content" style="display: none;">
{post_html}
    </div>
</body>
</html>"""

    # Ghi lại file
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("Converted file successfully")
    except Exception as e:
        print(f"Error writing file: {e}")

def main():
    root_dirs = [
        "c:/Users/HOANG LONG/Desktop/wED/SMP/posts",
        "c:/Users/HOANG LONG/Desktop/wED/SMP/challenges"
    ]
    
    for d in root_dirs:
        for subdir, _, files in os.walk(d):
            for file in files:
                if file.endswith('.html'):
                    filepath = os.path.join(subdir, file)
                    convert_post(filepath)

if __name__ == "__main__":
    main()
