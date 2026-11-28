"""P4-3 Professor/NPC Escort & Act Side Stories E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P4-3:
1. Initial Load:
   * `.top-header` & `.bottom-nav` render cleanly with 0 pageerrors/console errors and 0 horizontal overflow
2. School Tab -> 교장실 subtab (`학교` -> `교장실`):
   * `.escort-panel-box` renders inside the Professor Affinity section
   * Clicking `.escort-select-btn` (`동행 요청`) updates the button to contain `동행 중`
   * 0 horizontal overflow and clean screenshot `p4_3_01_escort_school.png`
3. Act Side Stories (`외전` chips):
   * At least 2 unlocked unread `.act-side-story-row .act-side-chip.is-unread` exist
   * Clicking the first unread chip opens `.modal-backdrop .story-vn-modal` containing `외전` and `.side-story-reward-bar` (`최초 열람 보상`)
   * Closing the modal via `button.btn-gold` awards first-read stones (`stones_after > stones_before`) and marks at least one `.act-side-chip.is-viewed`
4. Battle Tab (`전투`) Escort Strip & Combat:
   * `.escort-battle-strip` is visible and contains `동행`
   * Combat runs smoothly for ~2.2s with 0 errors and 0 horizontal overflow
   * Clicking `.escort-clear-btn` (`해제`) inside `.escort-battle-strip` dismisses the strip cleanly
"""
import json
import os
import re
import time
from playwright.sync_api import Browser, Page, sync_playwright

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT_DIR, exist_ok=True)
SAVE_PATH = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
URL = os.environ.get("ASTRA_E2E_URL", "http://127.0.0.1:4190/")
STORAGE_KEY = "magic_academy_astra_save_v1"

ALL_STORIES = [f"{a}_{k}" for a in range(1, 7) for k in ("intro", "mid", "boss", "clear")]


def build_save(**overrides) -> str:
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        s = json.load(f)
    now_ms = int(time.time() * 1000)
    s.update(
        lastSavedAt=now_ms,
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
        clearedActs=[1, 2],
        highestAct=3,
        highestStageInAct=2,
        rank=1,
        affinity={
            "points": {"lucia": 30, "karen": 25},
            "claimedEvents": [],
        },
        activeEscort=None,
        viewedSideStories=[],
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


def parse_stones(page: Page) -> int:
    raw = page.locator(".top-header .curr-pill.gold").inner_text().strip()
    digits = re.sub(r"[^\d]", "", raw)
    assert digits, f"Failed to parse stones from header currency pill: '{raw}'"
    return int(digits)


def test_p4_3_escort_story(browser: Browser, errs: list[str]) -> dict:
    """Verify P4-3 Professor Escort assignment, Act Side Story modal/rewards, and Battle Escort strip."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p4_3_escort_story", errs)
    try:
        # 1) Initial load overflow check
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 학교 (.bottom-nav button index 1) -> click 교장실 subtab
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".school-subtabs", timeout=6000)
        pg.locator(".school-subtabs .subtab-btn", has_text="교장실").first.click()

        # 3) Verify .escort-panel-box renders, click .escort-select-btn (동행 요청) -> updates to 동행 중
        escort_box = pg.locator(".escort-panel-box")
        escort_box.wait_for(state="visible", timeout=6000)

        escort_btn = escort_box.locator(".escort-select-btn").first
        assert escort_btn.is_visible(), "Expected .escort-select-btn inside .escort-panel-box to be visible"
        escort_btn_before = escort_btn.inner_text().strip()
        assert "동행 요청" in escort_btn_before, (
            f"Expected '동행 요청' in .escort-select-btn before click, got '{escort_btn_before}'"
        )

        escort_btn.click()
        pg.wait_for_timeout(200)
        escort_btn_after = escort_btn.inner_text().strip()
        assert "동행 중" in escort_btn_after, (
            f"Expected .escort-select-btn to update to contain '동행 중', got '{escort_btn_after}'"
        )

        escort_box.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "school_escort_panel")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_3_01_escort_school.png"))

        # 4) Record current stones from .top-header .curr-pill.gold
        stones_before = parse_stones(pg)

        # 5) Locate .act-side-story-row .act-side-chip.is-unread, assert >= 2 unlocked unread chips, click first
        pg.wait_for_selector(".act-side-story-row", timeout=6000)
        unread_chips = pg.locator(".act-side-story-row .act-side-chip.is-unread")
        unread_count_before = unread_chips.count()
        assert unread_count_before >= 2, (
            f"Expected at least 2 unlocked unread .act-side-chip.is-unread, got {unread_count_before}"
        )
        first_side_chip_text = unread_chips.first.inner_text().strip()
        unread_chips.first.click()

        # 6) Verify .modal-backdrop .story-vn-modal opens with 외전 and .side-story-reward-bar (최초 열람 보상)
        modal = pg.locator(".modal-backdrop .story-vn-modal")
        modal.wait_for(state="visible", timeout=6000)
        modal_text = modal.inner_text()
        assert "외전" in modal_text, f"Expected '외전' in side story modal, got '{modal_text}'"

        reward_bar = modal.locator(".side-story-reward-bar")
        reward_bar.wait_for(state="visible", timeout=4000)
        reward_bar_text = reward_bar.inner_text().strip()
        assert "최초 열람 보상" in reward_bar_text, (
            f"Expected '최초 열람 보상' in .side-story-reward-bar, got '{reward_bar_text}'"
        )
        assert_no_overflow(pg, "side_story_modal")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_3_02_side_story_modal.png"))

        # 7) Close StoryModal (button.btn-gold inside .story-vn-modal), wait 250ms, verify stones increased & .is-viewed exists
        modal.locator("button.btn-gold").first.click()
        pg.wait_for_timeout(250)
        assert pg.locator(".modal-backdrop .story-vn-modal").count() == 0, (
            "Expected .story-vn-modal to close cleanly after clicking button.btn-gold"
        )

        stones_after = parse_stones(pg)
        assert stones_after > stones_before, (
            f"Expected stones to increase after viewing first side story: {stones_before} -> {stones_after}"
        )
        viewed_count = pg.locator(".act-side-story-row .act-side-chip.is-viewed").count()
        assert viewed_count >= 1, (
            f"Expected at least 1 .act-side-chip.is-viewed after reading side story, got {viewed_count}"
        )

        # 8) Switch to 전투 tab (.bottom-nav button index 0), wait 400ms
        pg.locator(".bottom-nav button").nth(0).click()
        pg.wait_for_timeout(400)

        # 9) Verify .escort-battle-strip visible & contains 동행, wait ~2200ms for combat turns, 0 overflow, screenshot
        battle_strip = pg.locator(".escort-battle-strip")
        battle_strip.wait_for(state="visible", timeout=6000)
        battle_strip_text = battle_strip.inner_text().strip()
        assert "동행" in battle_strip_text, (
            f"Expected '동행' in .escort-battle-strip, got '{battle_strip_text}'"
        )

        pg.wait_for_timeout(2200)
        assert not errs, f"Errors detected during battle escort combat turns: {errs}"
        assert_no_overflow(pg, "battle_with_escort")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_3_03_battle_escort.png"))

        # 10) Click .escort-clear-btn (해제) inside .escort-battle-strip -> wait 200ms -> verify disappears cleanly
        clear_btn = battle_strip.locator(".escort-clear-btn").first
        assert clear_btn.is_visible(), "Expected .escort-clear-btn inside .escort-battle-strip to be visible"
        clear_btn_text = clear_btn.inner_text().strip()
        assert "해제" in clear_btn_text, (
            f"Expected '해제' in .escort-clear-btn, got '{clear_btn_text}'"
        )
        clear_btn.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".escort-battle-strip").count() == 0, (
            "Expected .escort-battle-strip to disappear cleanly after clicking 해제"
        )
        assert_no_overflow(pg, "battle_escort_cleared")

        return {
            "escort_btn_before": escort_btn_before,
            "escort_btn_after": escort_btn_after,
            "stones_before_side_story": stones_before,
            "stones_after_side_story": stones_after,
            "unread_side_chips_before": unread_count_before,
            "first_side_chip_clicked": first_side_chip_text,
            "reward_bar_text": reward_bar_text,
            "viewed_side_chips_after": viewed_count,
            "battle_escort_strip": battle_strip_text,
            "escort_cleared": True,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p4_3_escort_story(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p4_3_escort_story": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
