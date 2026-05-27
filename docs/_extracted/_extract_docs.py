from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET
from pypdf import PdfReader

base = Path(r"c:/Users/Nguend Arthur Johann/Desktop/SmartCAMPOST")
out_dir = base / "docs" / "_extracted"
out_dir.mkdir(parents=True, exist_ok=True)

errors = []

def safe_name(path: Path) -> str:
    rel = path.relative_to(base).as_posix()
    return rel.replace("/", "__") + ".txt"

def extract_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as zf:
        xml_bytes = zf.read("word/document.xml")
    root = ET.fromstring(xml_bytes)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    lines = []
    for para in root.findall(".//w:p", ns):
        texts = [t.text for t in para.findall(".//w:t", ns) if t.text]
        if texts:
            lines.append("".join(texts))
        else:
            lines.append("")
    return "\n".join(lines).strip()

def extract_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    parts = []
    for page in reader.pages:
        text = page.extract_text() or ""
        parts.append(text)
    return "\n\n".join(parts).strip()

for docx_path in base.rglob("*.docx"):
    try:
        text = extract_docx(docx_path)
        out_path = out_dir / safe_name(docx_path)
        out_path.write_text(text, encoding="utf-8")
    except Exception as exc:
        errors.append(f"DOCX: {docx_path} -> {exc}")

for pdf_path in base.rglob("*.pdf"):
    try:
        text = extract_pdf(pdf_path)
        out_path = out_dir / safe_name(pdf_path)
        out_path.write_text(text, encoding="utf-8")
    except Exception as exc:
        errors.append(f"PDF: {pdf_path} -> {exc}")

doc_files = list(base.rglob("*.doc"))

report_lines = [
    f"DOCX files: {len(list(base.rglob('*.docx')))}",
    f"PDF files: {len(list(base.rglob('*.pdf')))}",
    f"DOC files: {len(doc_files)}",
]
if errors:
    report_lines.append("\nErrors:")
    report_lines.extend(errors)

(out_dir / "extraction_report.txt").write_text("\n".join(report_lines), encoding="utf-8")
print("Extraction complete.")
print("Report:", out_dir / "extraction_report.txt")
