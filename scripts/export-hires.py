#!/usr/bin/env python3
"""P0-10: re-export monster/boss/exam art at 1024px WebP from source watercolor JPGs.

Usage:
  python3 scripts/export-hires.py            # SRC defaults to the Antigravity artifact dir
  ART_SRC=/path/to/jpgs python3 scripts/export-hires.py
  DRY=1 python3 scripts/export-hires.py      # only print the mapping

Source JPGs are 1024x1024 and named like mob_1_1_mist_slime_wc_<ts>.jpg.
Only the files listed in MAP are exported (rejected art like candelabra_mimic is skipped).
"""
import glob
import os
import sys

from PIL import Image

SRC = os.environ.get(
    "ART_SRC",
    "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/"
    "3f5ed9df-de73-4242-8e5b-7ab6de3d64a9",
)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "art")
SIZE = int(os.environ.get("SIZE", "1024"))
QUALITY = int(os.environ.get("Q", "80"))

# source prefix -> output path (relative to public/art)
MAP = {
    "mob_1_1_mist_slime": "monsters/m1_1_slime.webp",
    "mob_1_2_ash_bats": "monsters/m1_2_bats.webp",
    "mob_1_3_mine_kobold": "monsters/m1_3_kobold.webp",
    "mob_1_4_crystal_guardian": "monsters/m1_4_guardian.webp",
    "mob_2_1_parchment_wraith": "monsters/m2_1_parchment.webp",
    "mob_2_2_candelabra_spirit": "monsters/m2_2_candelabra.webp",
    "mob_2_3_cursed_apprentice": "monsters/m2_3_apprentice.webp",
    "mob_2_4_iron_archive_warden": "monsters/m2_4_warden.webp",
    "mob_3_1_thorn_beastkin": "monsters/m3_1_thorn.webp",
    "mob_3_2_corrupted_flame_spirit": "monsters/m3_2_flame.webp",
    "mob_3_3_blood_alpha_wolf": "monsters/m3_3_wolf.webp",
    "mob_3_4_obsidian_gargoyle": "monsters/m3_4_gargoyle.webp",
    "mob_4_1_spectral_infantry": "monsters/m4_1_infantry.webp",
    "mob_4_2_plague_alchemist": "monsters/m4_2_alchemist.webp",
    "mob_4_3_black_iron_knight": "monsters/m4_3_knight.webp",
    "mob_4_4_royal_guard_lich": "monsters/m4_4_lich.webp",
    "mob_5_1_abyssal_hound": "monsters/m5_1_hound.webp",
    "mob_5_2_eye_of_void": "monsters/m5_2_eye.webp",
    "mob_5_3_calamity_flame_giant": "monsters/m5_3_giant.webp",
    "mob_5_4_fallen_star_apostle": "monsters/m5_4_apostle.webp",
    "mob_6_1_obsidian_throne_knight": "monsters/m6_1_obsidian_knight.webp",
    "mob_6_2_star_eater_wyrm": "monsters/m6_2_wyrm.webp",
    "mob_6_3_eternal_high_priest": "monsters/m6_3_priest.webp",
    "mob_6_4_apocalypse_orthrus": "monsters/m6_4_orthrus.webp",
    "boss_act1_rakelle": "bosses/boss_golem.webp",
    "boss_act2_knos": "bosses/boss_wraith.webp",
    "boss_act3_morgana": "bosses/boss_witch.webp",
    "boss_act4_aldrich": "bosses/boss_knight.webp",
    "boss_act5_malegos": "bosses/boss_demon.webp",
    "boss_act6_balvar": "bosses/demon_lord.webp",
    "exam_1_kalion": "bosses/exam_1_kalion.webp",
    "exam_2_malaki": "bosses/exam_2_malaki.webp",
    "exam_3_isolde": "bosses/exam_3_isolde.webp",
    "exam_4_vesper": "bosses/exam_4_vesper.webp",
    "exam_5_astien": "bosses/exam_5_astien.webp",
}


def main() -> int:
    missing = []
    total_before = total_after = 0
    for prefix, rel in MAP.items():
        hits = sorted(glob.glob(os.path.join(SRC, f"{prefix}_wc_*.jpg")))
        if not hits:
            missing.append(prefix)
            continue
        src = hits[-1]  # newest timestamp wins
        dst = os.path.normpath(os.path.join(OUT, rel))
        before = os.path.getsize(dst) if os.path.exists(dst) else 0
        if os.environ.get("DRY"):
            print(f"{os.path.basename(src)} -> {rel}")
            continue
        im = Image.open(src).convert("RGB")
        if im.size != (SIZE, SIZE):
            im = im.resize((SIZE, SIZE), Image.LANCZOS)
        im.save(dst, "WEBP", quality=QUALITY, method=6)
        after = os.path.getsize(dst)
        total_before += before
        total_after += after
        print(f"{rel:38s} {before // 1024:5d}KB -> {after // 1024:5d}KB  ({SIZE}px)")
    if missing:
        print("MISSING sources:", ", ".join(missing), file=sys.stderr)
    if not os.environ.get("DRY"):
        print(f"TOTAL {total_before // 1024}KB -> {total_after // 1024}KB")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
