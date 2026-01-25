import re
import json

def parse_logs(log_file_path, output_file_path):
    with open(log_file_path, 'r', encoding='utf-8') as f:
        log_content = f.read()

    urls = re.findall(r'https://uwu-logs.xyz/reports/[\w\d\-/]+', log_content)
    
    # Remove duplicates and query parameters
    unique_urls = sorted(list(set([url.split('?')[0] for url in urls])))

    output_data = {
        "guild": "NOXUS",
        "source": "data/noxus/log.md",
        "raids": ["Icecrown", "Ruby Sanctum"],
        "logs": [{"url": url} for url in unique_urls],
        "totalLogs": len(unique_urls),
        "dateRange": {"from": "2025-08-30", "to": "2026-01-18"}
    }

    with open(output_file_path, 'w') as f:
        json.dump(output_data, f, indent=2)

if __name__ == '__main__':
    parse_logs('c:/Users/pc/Desktop/G/wawaa/data/noxus/log.md', 'c:/Users/pc/Desktop/G/wawaa/data/noxus/noxus-raid-logs.json')
    print(f"Successfully parsed logs and created noxus-raid-logs.json")
