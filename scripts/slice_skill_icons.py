#!/usr/bin/env python3
"""Slice the two 4x4 watercolor-gothic skill icon sheets into 32 128x128 WebP icons.

Source sheets (1024x1024 JPG):
- Elemental sheet: flame_1..4, frost_1..4, thunder_1..4, earth_1..4
- Arcane sheet:    flame_5, frost_5, thunder_5, earth_5, ward_1..4, holy_1..4, dark_1..4

Automatically detects the exact inner boundaries of all 16 square cells per sheet
(supporting both bright-gutter and hairline-bordered dark-gutter grid layouts),
applies a safety inset so zero grid lines or anti-aliased border bleed remain,
center-crops to an exact square, resizes with Lanczos to 128x128 WebP, and saves
an 8x4 contact sheet at /tmp/skill_icons_contact.png for visual verification.
"""

from __future__ import annotations

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "art" / "skills"
CONTACT_PATH = Path("/tmp/skill_icons_contact.png")

CELL_INSET = 4
ICON_SIZE = 128

ELEMENTAL_SHEET = Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/"
    "9368712e-e1a0-42b3-840b-f4776bab7ffe/skill_icons_elemental_1795872549476.jpg"
)
ARCANE_SHEET = Path(
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/"
    "9368712e-e1a0-42b3-840b-f4776bab7ffe/skill_icons_arcane_1795872549118.jpg"
)

ELEMENTAL_GRID = [
    ["flame_1", "flame_2", "flame_3", "flame_4"],
    ["frost_1", "frost_2", "frost_3", "frost_4"],
    ["thunder_1", "thunder_2", "thunder_3", "thunder_4"],
    ["earth_1", "earth_2", "earth_3", "earth_4"],
]

ARCANE_GRID = [
    ["flame_5", "frost_5", "thunder_5", "earth_5"],
    ["ward_1", "ward_2", "ward_3", "ward_4"],
    ["holy_1", "holy_2", "holy_3", "holy_4"],
    ["dark_1", "dark_2", "dark_3", "dark_4"],
]


def _find_edge_offset(profile: np.ndarray) -> int:
    """Return pixels inward from the nominal gutter center to the clean cell interior."""
    if profile[0] > 40.0:
        # Bright gutter (e.g. elemental sheet): find transition into dark cell interior
        for i in range(len(profile) - 3):
            if profile[i] > 38.0 and profile[i + 1] < 36.0 and profile[i + 2] < 36.0:
                return i + 1
        return 14

    # Dark gutter with bright cell hairline (e.g. arcane sheet):
    # scan from outer gutter across the ~2px bright hairline into the cell interior
    for i in range(len(profile) - 3):
        if profile[i] >= 45.0:
            pk = i
            if profile[i + 1] > profile[pk] and (profile[i + 1] - profile[i] < 45.0):
                pk = i + 1
            return pk + 2
    return 18


def detect_cell_box(gray: np.ndarray, row: int, col: int, inset: int = CELL_INSET) -> tuple[int, int, int, int]:
    """Detect the clean inner square crop box (x0, y0, x1, y1) for cell (row, col)."""
    h, w = gray.shape
    stride_y = h // 4
    stride_x = w // 4

    gy0 = 2 if row == 0 else row * stride_y
    gy1 = h - 3 if row == 3 else (row + 1) * stride_y
    gx0 = 2 if col == 0 else col * stride_x
    gx1 = w - 3 if col == 3 else (col + 1) * stride_x

    xs = slice(col * stride_x + 40, (col + 1) * stride_x - 40)
    ys = slice(row * stride_y + 40, (row + 1) * stride_y - 40)

    top_prof = np.median(gray[gy0 : gy0 + 28, xs], axis=1)
    bot_prof = np.median(gray[gy1 - 27 : gy1 + 1, xs], axis=1)[::-1]
    left_prof = np.median(gray[ys, gx0 : gx0 + 28], axis=0)
    right_prof = np.median(gray[ys, gx1 - 27 : gx1 + 1], axis=0)[::-1]

    x0 = gx0 + _find_edge_offset(left_prof) + inset
    x1 = gx1 - _find_edge_offset(right_prof) + 1 - inset
    y0 = gy0 + _find_edge_offset(top_prof) + inset
    y1 = gy1 - _find_edge_offset(bot_prof) + 1 - inset

    # Make the crop an exact square centered within the detected cell interior
    cw = x1 - x0
    ch = y1 - y0
    side = min(cw, ch)
    dx = (cw - side) // 2
    dy = (ch - side) // 2
    return (x0 + dx, y0 + dy, x0 + dx + side, y0 + dy + side)


def slice_sheet(sheet_path: Path, grid: list[list[str]]) -> list[tuple[str, Path, tuple[int, int, int, int]]]:
    img = Image.open(sheet_path).convert("RGB")
    gray = np.asarray(img, dtype=np.float32).mean(axis=2)
    results: list[tuple[str, Path, tuple[int, int, int, int]]] = []

    for r, row_ids in enumerate(grid):
        for c, skill_id in enumerate(row_ids):
            box = detect_cell_box(gray, r, c)
            cropped = img.crop(box)
            resized = cropped.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
            out_path = OUT_DIR / f"{skill_id}.webp"
            resized.save(out_path, format="WEBP", quality=88, method=6)
            results.append((skill_id, out_path, box))
    return results


def build_contact_sheet(items: list[tuple[str, Path, tuple[int, int, int, int]]], dest: Path) -> None:
    cols, rows = 8, 4
    pad = 6
    cell_w = ICON_SIZE + pad
    cell_h = ICON_SIZE + pad
    sheet = Image.new("RGB", (cols * cell_w + pad, rows * cell_h + pad), (18, 16, 20))
    draw = ImageDraw.Draw(sheet)

    for idx, (skill_id, path, _) in enumerate(items):
        r = idx // cols
        c = idx % cols
        x = pad + c * cell_w
        y = pad + r * cell_h
        tile = Image.open(path).convert("RGB")
        sheet.paste(tile, (x, y))
        draw.text((x + 4, y + 3), skill_id, fill=(235, 220, 190))

    sheet.save(dest)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    elem_items = slice_sheet(ELEMENTAL_SHEET, ELEMENTAL_GRID)
    arc_items = slice_sheet(ARCANE_SHEET, ARCANE_GRID)
    all_items = elem_items + arc_items
    build_contact_sheet(all_items, CONTACT_PATH)

    total_bytes = sum(p.stat().st_size for _, p, _ in all_items)
    print(f"Sliced {len(all_items)} icons -> {OUT_DIR}")
    print(f"Total size: {total_bytes} bytes ({total_bytes / 1024:.1f} KB)")
    for skill_id, path, box in all_items:
        w, h = box[2] - box[0], box[3] - box[1]
        print(f"  {skill_id:10s} crop={box} ({w}x{h}) -> {path.stat().st_size:5d} B")
    print(f"Contact sheet saved -> {CONTACT_PATH}")


if __name__ == "__main__":
    main()
