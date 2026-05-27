import json
from collections import OrderedDict

def remove_duplicate_keys(ordered_pairs):
    d = OrderedDict()
    for k, v in ordered_pairs:
        if k not in d:
            d[k] = v
    return d

file_path = 'c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST/smartcampost-frontend/src/i18n/locales/fr.json'
new_file_path = 'c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST/smartcampost-frontend/src/i18n/locales/fr_fixed.json'

with open(file_path, 'r', encoding='utf-8') as f:
    try:
        data = json.load(f, object_pairs_hook=remove_duplicate_keys)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        # Attempt to fix the JSON by removing the problematic parts
        f.seek(0)
        lines = f.readlines()
        # Simple fix: remove the line with the error and the previous one if it's a comma
        if e.lineno > 1 and lines[e.lineno - 2].strip().endswith(','):
            lines.pop(e.lineno - 2)
            lines.pop(e.lineno - 2)
        else:
            lines.pop(e.lineno - 1)
        
        try:
            data = json.loads("".join(lines), object_pairs_hook=remove_duplicate_keys)
            print("Successfully parsed JSON after attempting to fix it.")
        except json.JSONDecodeError as e2:
            print(f"Still failed to parse JSON after fix attempt: {e2}")
            data = None

if data:
    with open(new_file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Duplicate keys removed and file saved to fr_fixed.json")

