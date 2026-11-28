"""P6-1 All 32 Skill Icons Watercolor Gothic Rework E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector & Asset contract verified for P6-1:
1. Direct HTTP 200 & non-empty bytes check for all 32 skill WebP assets:
   - flame_1..5, frost_1..5, thunder_1..5, earth_1..5
   - ward_1..4, holy_1..4, dark_1..4
2. Initial page load (`.top-header`, `.bottom-nav`), `pageerror` & `console` error capture,
   and 0 horizontal overflow (`scrollWidth <= innerWidth + 1`).
3. Battle Tab (`전투`):
   - `.rot-icon-wrap img.skill-icon-img` loaded cleanly (`complete && naturalWidth >= 64`, `broken == 0`)
   - `.rot-icon-wrap .skill-rune-pip` renders `'A'` on awakened `연쇄 낙뢰`
   - 0 overflow, screenshot `scripts/e2e/out/p6_1_01_battle_coins.png`
4. School Tab (`학교`, index 1) -> `마법 교실`:
   - Classroom `img.skill-icon-img` loaded cleanly (`count >= 8`, `broken == 0`)
   - `.skill-rune-pip` renders `'A'` on awakened `연쇄 낙뢰`
   - 0 overflow, screenshot `scripts/e2e/out/p6_1_02_classroom_icons.png`
5. School Tab -> `금서고` subtab:
   - All 4 dark skill `img.skill-icon-img` loaded cleanly (`count == 4`, `broken == 0`)
   - 0 overflow
6. Deck & Gear Tab (`덱·장비`, index 2) -> `스킬 덱`:
   - Deck & learned skill `img.skill-icon-img` loaded cleanly (`count >= 10`, `broken == 0`)
   - `.skill-rune-pip` renders `'A'`
   - 0 overflow, screenshot `scripts/e2e/out/p6_1_03_deck_icons.png`
"""
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from playwright.sync_api import Browser, Page, sync_playwright

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT_DIR, exist_ok=True)
SAVE_PATH = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
URL = os.environ.get("ASTRA_E2E_URL", "http://127.0.0.1:4190/")
STORAGE_KEY = "magic_academy_astra_save_v1"

ALL_STORIES = [f"{a}_{k}" for a in range(1, 7) for k in ("intro", "mid", "boss", "clear")]

ALL_SKILL_IDS = (
    [f"flame_{i}" for i in range(1, 6)]
    + [f"frost_{i}" for i in range(1, 6)]
    + [f"thunder_{i}" for i in range(1, 6)]
    + [f"earth_{i}" for i in range(1, 6)]
    + [f"ward_{i}" for i in range(1, 5)]
    + [f"holy_{i}" for i in range(1, 5)]
    + [f"dark_{i}" for i in range(1, 5)]
)


def verify_all_skill_webp_assets() -> dict:
    """Directly check HTTP 200 and non-empty bytes for all 32 skill WebP URLs."""
    base = URL if URL.endswith("/") else f"{URL}/"
    checked = 0
    sizes: dict[str, int] = {}
    failures: list[str] = []

    for sid in ALL_SKILL_IDS:
        asset_url = urllib.parse.urljoin(base, f"art/skills/{sid}.webp")
        try:
            req = urllib.request.Request(asset_url, method="GET")
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = getattr(resp, "status", resp.getcode())
                body = resp.read()
                if status != 200:
                    failures.append(f"{sid}: HTTP {status} ({asset_url})")
                elif not body or len(body) == 0:
                    failures.append(f"{sid}: empty response ({asset_url})")
                else:
                    checked += 1
                    sizes[sid] = len(body)
        except urllib.error.HTTPError as exc:
            failures.append(f"{sid}: HTTPError {exc.code} ({asset_url})")
        except Exception as exc:
            failures.append(f"{sid}: {type(exc).__name__}: {exc} ({asset_url})")

    assert not failures, f"Skill WebP asset check failed: {failures}"
    assert checked == 32, f"Expected 32/32 skill WebP assets, got {checked}/32"
    return {
        "total": len(ALL_SKILL_IDS),
        "ok": checked,
        "min_bytes": min(sizes.values()),
        "max_bytes": max(sizes.values()),
    }


def build_save(**overrides) -> str:
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        s = json.load(f)
    now_ms = int(time.time() * 1000)

    skills: dict[str, dict] = {}
    for i in range(1, 6):
        sid = f"thunder_{i}"
        if sid == "thunder_2":
            skills[sid] = {
                "id": sid,
                "level": 10,
                "exp": 0,
                "unlocked": True,
                "rune": "a",
                "runeAwakened": True,
            }
        else:
            skills[sid] = {"id": sid, "level": 5, "exp": 0, "unlocked": True}
    for cat in ("ward", "holy", "dark"):
        for i in range(1, 5):
            sid = f"{cat}_{i}"
            skills[sid] = {"id": sid, "level": 5, "exp": 0, "unlocked": True}

    s.update(
        lastSavedAt=now_ms,
        school="thunder",
        level=30,
        rank=3,
        clearedActs=[1, 2, 3],
        highestAct=4,
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
        skills=skills,
        deck=["thunder_2", "thunder_4", "ward_1", "holy_1", "thunder_1"],
    )
    if "abyss" in s:
        s["abyss"]["lastLanternTick"] = now_ms
        s["abyss"]["activeNode"] = None
        s["abyss"]["lastResult"] = None
    s["settings"]["autoAdvance"] = False
    s.update(overrides)
    return json.dumps(s, ensure_ascii=False)


def open_seeded_page(browser: Browser, save_blob: str, tag: str, errs: list[str]):
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=1,
        service_workers="block",
    )
    ctx.add_init_script(
        f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('{STORAGE_KEY}',{json.dumps(save_blob)});sessionStorage.setItem('seeded','1');}}"
    )
    page = ctx.new_page()
    page.on("pageerror", lambda e: errs.append(f"{tag}:pageerror:{e}"))
    page.on(
        "console",
        lambda m: errs.append(f"{tag}:console:{m.text}") if m.type == "error" else None,
    )
    page.on("dialog", lambda d: d.accept())
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_selector(".top-header", timeout=10000)
    page.wait_for_selector(".bottom-nav", timeout=10000)
    return ctx, page


def assert_no_overflow(page: Page, label: str) -> None:
    metrics = page.evaluate(
        "() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth})"
    )
    assert metrics["sw"] <= metrics["iw"] + 1, (
        f"Horizontal overflow on {label}: scrollWidth={metrics['sw']} > innerWidth+1={metrics['iw'] + 1}"
    )


def inspect_skill_images(page: Page, selector: str, label: str, min_natural_width: int = 64) -> dict:
    """Wait for matching img.skill-icon-img elements to finish decoding and verify naturalWidth."""
    page.wait_for_selector(selector, timeout=8000)
    page.wait_for_function(
        """({ sel }) => {
            const imgs = Array.from(document.querySelectorAll(sel));
            return imgs.length > 0 && imgs.every((img) => img.complete);
        }""",
        arg={"sel": selector},
        timeout=10000,
    )
    report = page.evaluate(
        """({ sel, minW }) => {
            const imgs = Array.from(document.querySelectorAll(sel));
            const broken = [];
            const srcs = [];
            for (const img of imgs) {
                const src = img.getAttribute('src') || '';
                srcs.push(src);
                if (!img.complete || img.naturalWidth < minW) {
                    broken.push({ src, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
                }
            }
            return { count: imgs.length, broken, srcs };
        }""",
        {"sel": selector, "minW": min_natural_width},
    )
    assert len(report["broken"]) == 0, (
        f"Broken skill icon images on {label} ({selector}): {report['broken']}"
    )
    return {
        "count": report["count"],
        "broken": len(report["broken"]),
        "sample_srcs": report["srcs"][:6],
    }


def test_p6_1_skill_icons(browser: Browser, errs: list[str]) -> dict:
    """Verify all 32 skill WebP icons across Battle, Classroom, Forbidden Library, and Deck views."""
    http_assets = verify_all_skill_webp_assets()

    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p6_1_skill_icons", errs)
    try:
        assert_no_overflow(pg, "initial_load")

        # 3) Battle tab: verify .rot-icon-wrap img.skill-icon-img & awakened 'A' pip on 연쇄 낙뢰
        battle_imgs = inspect_skill_images(pg, ".rot-icon-wrap img.skill-icon-img", "battle_coins")
        assert battle_imgs["count"] >= 5, (
            f"Expected >= 5 battle coin skill images, got {battle_imgs['count']}"
        )
        thunder2_chip = pg.locator(".rot-chip", has_text="연쇄 낙뢰").first
        assert thunder2_chip.count() == 1, "Expected '연쇄 낙뢰' chip in battle rotation strip"
        battle_pip = thunder2_chip.locator(".rot-icon-wrap .skill-rune-pip").first
        assert battle_pip.count() == 1 and battle_pip.is_visible(), (
            "Expected .rot-icon-wrap .skill-rune-pip on awakened '연쇄 낙뢰'"
        )
        battle_pip_text = battle_pip.inner_text().strip()
        assert battle_pip_text == "A", (
            f"Expected battle rune pip text 'A' on 연쇄 낙뢰, got '{battle_pip_text}'"
        )
        assert_no_overflow(pg, "battle_coins")
        pg.screenshot(path=os.path.join(OUT_DIR, "p6_1_01_battle_coins.png"))

        # 4) Click 학교 (index 1) -> 마법 교실
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".school-subtabs", timeout=6000)
        pg.locator(".school-subtabs .subtab-btn", has_text="마법 교실").first.click()
        pg.wait_for_selector(".classroom-filter-row", timeout=6000)

        classroom_imgs = inspect_skill_images(pg, ".item-list img.skill-icon-img", "school_classroom")
        assert classroom_imgs["count"] >= 8, (
            f"Expected >= 8 classroom skill images, got {classroom_imgs['count']}"
        )
        thunder2_card = pg.locator(".list-card", has_text="연쇄 낙뢰").first
        assert thunder2_card.count() == 1, "Expected '연쇄 낙뢰' card in classroom"
        classroom_pip = thunder2_card.locator(".skill-rune-pip").first
        assert classroom_pip.count() == 1 and classroom_pip.is_visible(), (
            "Expected .skill-rune-pip on awakened '연쇄 낙뢰' in classroom"
        )
        classroom_pip_text = classroom_pip.inner_text().strip()
        assert classroom_pip_text == "A", (
            f"Expected classroom rune pip text 'A' on 연쇄 낙뢰, got '{classroom_pip_text}'"
        )
        assert_no_overflow(pg, "school_classroom")
        pg.screenshot(path=os.path.join(OUT_DIR, "p6_1_02_classroom_icons.png"))

        # 5) Click 금서고 subtab -> verify all 4 dark skill images
        pg.locator(".school-subtabs .subtab-btn", has_text="금서고").first.click()
        pg.wait_for_selector(".item-list", timeout=6000)
        forbidden_imgs = inspect_skill_images(pg, ".item-list img.skill-icon-img", "school_forbidden")
        assert forbidden_imgs["count"] == 4, (
            f"Expected 4 dark skill images in 금서고, got {forbidden_imgs['count']}"
        )
        assert_no_overflow(pg, "school_forbidden")

        # 6) Click 덱·장비 (index 2) -> 스킬 덱
        pg.locator(".bottom-nav button").nth(2).click()
        pg.wait_for_selector(".subtabs", timeout=6000)
        pg.locator(".subtabs .subtab-btn", has_text="스킬 덱").first.click()
        pg.wait_for_selector(".item-list img.skill-icon-img", timeout=6000)

        deck_imgs = inspect_skill_images(pg, ".item-list img.skill-icon-img", "deck_skills")
        assert deck_imgs["count"] >= 10, (
            f"Expected >= 10 deck & learned skill images, got {deck_imgs['count']}"
        )
        deck_pip = pg.locator(".item-list .skill-rune-pip").first
        assert deck_pip.count() == 1 and deck_pip.is_visible(), (
            "Expected .skill-rune-pip in deck/learned skills view"
        )
        deck_pip_text = deck_pip.inner_text().strip()
        assert deck_pip_text == "A", (
            f"Expected deck rune pip text 'A', got '{deck_pip_text}'"
        )
        assert_no_overflow(pg, "deck_skills")
        pg.screenshot(path=os.path.join(OUT_DIR, "p6_1_03_deck_icons.png"))

        return {
            "http_webp_assets": http_assets,
            "battle_coins": {**battle_imgs, "rune_pip": battle_pip_text},
            "classroom": {**classroom_imgs, "rune_pip": classroom_pip_text},
            "forbidden_library": forbidden_imgs,
            "deck": {**deck_imgs, "rune_pip": deck_pip_text},
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p6_1_skill_icons(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Page/console errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p6_1_skill_icons": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
