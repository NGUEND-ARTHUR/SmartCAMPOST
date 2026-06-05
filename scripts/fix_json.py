import json
from collections import OrderedDict

def remove_duplicate_keys(ordered_pairs):
    d = OrderedDict()
    for k, v in ordered_pairs:
        if k not in d:
            d[k] = v
    return d

file_path = 'c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST/smartcampost-frontend/src/i18n/locales/fr.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f, object_pairs_hook=remove_duplicate_keys)

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Duplicate keys removed successfully.")
