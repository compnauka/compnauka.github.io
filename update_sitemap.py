import re
import os

BASE_URL = "https://itnauka.org/"
DATA_FILE = "d:/GIT/compnauka.github.io/data.js"
SITEMAP_FILE = "d:/GIT/compnauka.github.io/sitemap.xml"

# Core pages with high priority
CORE_PAGES = [
    {"loc": BASE_URL, "priority": "1.0"},
    {"loc": BASE_URL + "404.html", "priority": "0.8"},
    {"loc": BASE_URL + "apps/", "priority": "0.8"},
    {"loc": BASE_URL + "course/", "priority": "0.8"},
    {"loc": BASE_URL + "edexpo/", "priority": "0.8"},
    {"loc": BASE_URL + "edinfo/", "priority": "0.8"},
    {"loc": BASE_URL + "games/", "priority": "0.8"},
    {"loc": BASE_URL + "microbit/", "priority": "0.8"},
    {"loc": BASE_URL + "outer/", "priority": "0.8"},
    {"loc": BASE_URL + "services/", "priority": "0.8"},
    {"loc": BASE_URL + "vartovi/", "priority": "0.8"},
]

def generate_sitemap():
    print(f"Reading data from {DATA_FILE}...")
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File {DATA_FILE} not found.")
        return

    # Extract links using regex
    # Looking for: link: "..." or link: '...'
    links = re.findall(r'link:\s*["\']([^"\']+)["\']', content)

    print(f"Found {len(links)} links in data.js.")

    # Remove duplicates and sort
    links = sorted(list(set(links)))

    # Generate XML
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    # Add core pages
    for page in CORE_PAGES:
        xml_lines.append(f'  <url><loc>{page["loc"]}</loc><priority>{page["priority"]}</priority></url>')

    # Add pages from data.js
    added_count = 0
    for link in links:
        # Determine full URL
        if link.startswith("http"):
             full_url = link
        else:
             full_url = BASE_URL + link
        
        # Check if this URL is already in CORE_PAGES to avoid duplication
        is_core = False
        for core in CORE_PAGES:
            if core["loc"] == full_url:
                is_core = True
                break
        
        if not is_core:
             xml_lines.append(f'  <url><loc>{full_url}</loc><priority>0.6</priority></url>')
             added_count += 1

    xml_lines.append('</urlset>')

    print(f"Generating sitemap with {len(CORE_PAGES) + added_count} URLs ({len(CORE_PAGES)} core, {added_count} from data.js).")

    # Write sitemap.xml
    try:
        with open(SITEMAP_FILE, 'w', encoding='utf-8') as f:
            f.write('\n'.join(xml_lines))
        print(f"Successfully wrote to {SITEMAP_FILE}")
    except Exception as e:
        print(f"Error writing sitemap: {e}")

if __name__ == "__main__":
    generate_sitemap()
