"""
Generate a Mermaid ER diagram from the SQLAlchemy models
and write it to docs/schema.md.

Usage:
    python scripts/generate_schema.py
"""

import sys
from pathlib import Path

_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from app.db.base import Base
from sqlalchemy import ForeignKey

OUTPUT = Path(__file__).resolve().parent.parent / "docs" / "schema.md"


def _type_name(col) -> str:
    return type(col.type).__name__.lower()


def generate() -> str:
    metadata = Base.metadata
    lines = ["# Database Schema", "", "```mermaid", "erDiagram"]

    # Build FK relationships
    for table in metadata.sorted_tables:
        for fk in table.foreign_keys:
            parent = fk.column.table.name
            child = table.name
            lines.append(f"    {parent} ||--o{{ {child} : has")

    # Build table definitions
    for table in metadata.sorted_tables:
        lines.append(f"    {table.name} {{")
        for col in table.columns:
            parts = [_type_name(col), col.name]
            if col.primary_key:
                parts.append("PK")
            if col.foreign_keys:
                parts.append("FK")
            if col.nullable and not col.primary_key and not col.foreign_keys:
                parts.append("nullable")
            if col.unique and not col.primary_key:
                parts.append("unique")
            lines.append("        " + " ".join(parts))
        lines.append("    }")

    lines.append("```")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    content = generate()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content)
    print(f"Schema written to {OUTPUT}")
