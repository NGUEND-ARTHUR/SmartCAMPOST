from __future__ import annotations

import re
from pathlib import Path

from docx import Document


def _slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text.strip("-")


def convert_docx_to_markdown(docx_path: Path) -> str:
    doc = Document(str(docx_path))

    lines: list[str] = []
    last_was_blank = True

    for p in doc.paragraphs:
        text = (p.text or "").rstrip()
        if not text:
            if not last_was_blank:
                lines.append("")
                last_was_blank = True
            continue

        style = (p.style.name or "").strip()
        heading_level: int | None = None
        if style.startswith("Heading"):
            m = re.search(r"Heading\s+(\d+)", style)
            if m:
                heading_level = max(1, min(6, int(m.group(1))))

        if heading_level is not None:
            prefix = "#" * heading_level
            lines.append(f"{prefix} {text}")
            lines.append("")
            last_was_blank = True
            continue

        # Basic list detection (Word often stores list items as normal paragraphs)
        if style.lower().startswith("list") or text.lstrip().startswith(("- ", "• ")):
            cleaned = text.lstrip("• ").strip()
            lines.append(f"- {cleaned}")
            last_was_blank = False
            continue

        lines.append(text)
        last_was_blank = False

    content = "\n".join(lines).strip() + "\n"
    # Ensure there is at least a top title anchor for navigation
    if content and not content.startswith("#"):
        title = docx_path.stem
        content = f"# {title}\n\n" + content

    return content


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    spec_dir = repo_root / "docs" / "Used for front end Development"
    candidates = sorted(spec_dir.glob("SMARTCAMPOST*WEB UI SPECIFICATION*.docx"))
    docx_path = candidates[0] if candidates else (spec_dir / "SMARTCAMPOST — WEB UI SPECIFICATION (FINAL • UNIFIED • COMPLETE • ENGLISH).docx")
    out_path = repo_root / "docs" / "ui-spec.md"

    if not docx_path.exists():
        raise SystemExit(
            "UI spec .docx not found. Expected a file matching 'SMARTCAMPOST*WEB UI SPECIFICATION*.docx' in: "
            + str(spec_dir)
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(convert_docx_to_markdown(docx_path), encoding="utf-8")
    print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()
