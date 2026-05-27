from pathlib import Path
import re

base = Path(r"c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST/docs/_extracted")
index_path = base / "_index.md"
log_path = base / "_index.log"

file_paths = sorted(p for p in base.glob("*.txt") if p.name not in {"_index.md", "extraction_report.txt"})

heading_re = re.compile(r"^(?:\s{0,3}(?:#+\s+|[A-Z][A-Z0-9 \-]{4,}|\d+\.|[IVXLC]+\.))")

def summarize(text: str) -> str:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    sample = lines[:12]
    return "\n".join(sample)

try:
    with index_path.open("w", encoding="utf-8") as f:
        f.write("# Extracted Documents Index\n\n")
        for path in file_paths:
            rel = path.name
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except Exception as exc:
                f.write(f"## {rel}\n\nERROR: {exc}\n\n")
                continue
            headings = []
            for line in text.splitlines():
                if heading_re.match(line.strip()):
                    headings.append(line.strip())
                if len(headings) >= 8:
                    break
            f.write(f"## {rel}\n\n")
            if headings:
                f.write("**Headings (first 8):**\n")
                for h in headings:
                    f.write(f"- {h}\n")
                f.write("\n")
            f.write("**Sample (first 12 non-empty lines):**\n")
            f.write(summarize(text) or "(empty)")
            f.write("\n\n")
except Exception as exc:
    log_path.write_text(f"Failed to write index: {exc}", encoding="utf-8")
else:
    log_path.write_text("Index written OK", encoding="utf-8")
