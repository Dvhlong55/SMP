import os
import re

manifest_tags = """
    <link rel="manifest" href="/SMP/manifest.json">
    <meta name="theme-color" content="#121212">"""

directory = r"c:\Users\HOANG LONG\Desktop\wED\SMP"

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            if 'rel="manifest"' not in content:
                new_content = re.sub(r'(<head[^>]*>)', r'\1' + manifest_tags, content, flags=re.IGNORECASE)
                with open(filepath, "w", encoding="utf-8", newline="") as f:
                    f.write(new_content)
                try:
                    print(f"Updated {file}")
                except UnicodeEncodeError:
                    print("Updated a file with special characters")
