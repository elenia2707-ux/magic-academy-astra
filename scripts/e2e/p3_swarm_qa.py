"""P3 Round-1 Swarm QA E2E Suite (UI Polish + P3-2 Rune Awakening + P3-5 Tower Lords & Professor Affinity).

Target server: http://localhost:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract expected from integrated Round-1 build:
- UI Polish:
  * .stage-label (short act location e.g. '1-4 · 수정 광산', full actDef.location in title)
  * .combat-log-box.is-sparse (applied while combat.logs.length <= 2)
  * .abyss-roll-btn (hidden when activeNode is open)
  * .dice-pending-hint (status pill '아래 선택지를 골라주세요 ↓' when activeNode is open)
  * Abyss -> 시간 회귀 locked button text: '4막 클리어 또는 5계급(심연 마도사)부터 회귀 가능'
- P3-2 Rune Awakening (SchoolTab):
  * .rune-awaken-box (rendered on Lv10+ awakenable skill cards)
  * .rune-branch-btn (2 branch buttons A / B inside .rune-awaken-box; active branch has .is-active)
  * .rune-awakened-badge (displayed once a branch is awakened)
- P3-5 Tower Lords & Professor Affinity:
  * .tower-lord-preview (named 5F lord preview card in Abyss -> 무한 탑 when towerFloor % 5 == 0)
  * .boss-quote-strip (encounter quote banner during 5F named lord combat)
  * Professor Affinity section in SchoolTab: subtab matching /호감도|교수|인연/ (or direct .affinity-section)
  * .affinity-card, .affinity-gift-btn, .affinity-milestone.is-unlocked
"""
import json
import os
import re
import time
from playwright.sync_api import Browser, Page, sync_playwright

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT_DIR, exist_ok=True)
SAVE_PATH = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
URL = os.environ.get("ASTRA_E2E_URL", "http://localhost:4190/")
STORAGE_KEY = "magic_academy_astra_save_v1"

ALL_STORIES = [f"{a}_{k}" for a in range(1, 7) for k in ("intro", "mid", "boss", "after")]


def build_save(**overrides) -> str:
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        s = json.load(f)
    now_ms = int(time.time() * 1000)
    s.update(
        lastSavedAt=now_ms,
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
    )
    if "abyss" in s:
        s["abyss"]["lastLanternTick"] = now_ms
        s["abyss"]["activeNode"] = None
        s["abyss"]["lastResult"] = None
    s["settings"]["autoAdvance"] = False
    s["settings"]["speed"] = 1
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
    page.on("pageerror", lambda e: errs.append(f"{tag}:{e}"))
    page.goto(URL, wait_until="domcontentloaded")
    page.wait_for_selector(".bottom-nav", timeout=10000)
    return ctx, page


def assert_no_overflow(page: Page, label: str) -> None:
    metrics = page.evaluate(
        "() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})"
    )
    assert metrics["sw"] <= metrics["cw"], (
        f"Horizontal overflow on {label}: scrollWidth={metrics['sw']} > clientWidth={metrics['cw']}"
    )


def test_ui_polish(browser: Browser, errs: list[str]) -> dict:
    """1) Stage label compact name, sparse battle log, dice hint pill, and rebirth lock at Act 3 / Rank 2."""
    blob = build_save(
        school="thunder",
        level=24,
        rank=2,
        selectedAct=1,
        selectedStage=3,
        highestAct=4,
        highestStageInAct=2,
        clearedActs=[1, 2, 3],
        abyss={
            "lanterns": 6,
            "maxLanterns": 8,
            "lastLanternTick": int(time.time() * 1000),
            "depth": 0,
            "boardPos": 0,
            "laps": 0,
            "lastRoll": None,
            "activeNode": None,
            "lastResult": None,
        },
    )
    ctx, pg = open_seeded_page(browser, blob, "ui_polish", errs)
    try:
        pg.wait_for_selector(".stage-label", timeout=8000)

        # (a) Stage label shows compact location without truncation
        stage_el = pg.locator(".stage-label")
        stage_text = stage_el.inner_text().strip()
        stage_title = stage_el.get_attribute("title") or ""
        assert "1-4 · 수정 광산" == stage_text, f"Expected compact stage label '1-4 · 수정 광산', got '{stage_text}'"
        assert "아스트라 외곽 & 수정 광산" in stage_title, f"Expected full location in title, got '{stage_title}'"
        clipped = stage_el.evaluate("el => el.scrollWidth > el.clientWidth")
        assert not clipped, f"Stage label still clips on 390px viewport: '{stage_text}'"

        # (b) Sparse combat log check right at battle start (click prev stage to guarantee fresh T0 spawn <= 2 logs)
        pg.locator("button[aria-label='이전 스테이지']").click()
        pg.wait_for_timeout(120)
        log_box = pg.locator(".combat-log-box")
        log_cls = log_box.get_attribute("class") or ""
        log_lines = log_box.locator(".log-line").count()
        assert log_lines <= 2, f"Expected <=2 log lines right after stage switch, got {log_lines}"
        assert "is-sparse" in log_cls, f"Expected .combat-log-box.is-sparse when log_lines={log_lines}, got class='{log_cls}'"
        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_01_battle_polish.png"))
        assert_no_overflow(pg, "battle_polish")

        # (c) Abyss dice board: roll -> shows choice card + .dice-pending-hint, NO disabled '선택지 확인' button
        pg.locator(".bottom-nav button").nth(4).click()
        pg.wait_for_selector(".abyss-board", timeout=6000)
        roll_btn = pg.locator(".abyss-roll-btn")
        assert roll_btn.is_visible(), "Expected .abyss-roll-btn before rolling"
        roll_btn.click()

        # Wait for roll animation (~280ms) and activeNode choice card
        pg.wait_for_selector(".abyss-event-card", timeout=6000)
        pending_hint = pg.locator(".dice-pending-hint")
        assert pending_hint.is_visible(), "Expected .dice-pending-hint when activeNode is open"
        hint_text = pending_hint.inner_text().strip()
        assert "아래 선택지" in hint_text, f"Unexpected dice-pending-hint text: '{hint_text}'"
        dup_btn_count = pg.locator("button:has-text('선택지 확인')").count()
        assert dup_btn_count == 0, "Duplicate disabled '선택지 확인' button should be removed"
        assert pg.locator(".abyss-roll-btn").count() == 0, "Roll button should not render while activeNode is open"
        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_02_abyss_dice_hint.png"))
        assert_no_overflow(pg, "abyss_dice_hint")

        # Resolve choice to ensure roll button returns cleanly (avoid elite fight if non-combat choice exists)
        choices = pg.locator(".abyss-choice-btn")
        assert choices.count() >= 1, "Expected at least one abyss choice button"
        choices.last.click()
        pg.wait_for_timeout(300)

        # (d) Rebirth threshold: locked at Act 3 cleared & Rank 2
        if pg.locator(".subtab-btn").count() == 0:
            pg.locator(".bottom-nav button").nth(4).click()
            pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn").nth(2).click()
        pg.wait_for_timeout(300)

        expected_lock = "4막 클리어 또는 5계급(심연 마도사)부터 회귀 가능"
        rebirth_btn = pg.locator(f"button:has-text('{expected_lock}')")
        assert rebirth_btn.count() == 1, f"Expected locked rebirth button with text '{expected_lock}'"
        assert rebirth_btn.is_disabled(), "Rebirth button must be disabled at Act 3 / Rank 2"
        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_03_rebirth_locked.png"))
        assert_no_overflow(pg, "rebirth_locked")

        return {
            "stage_text": stage_text,
            "sparse_log_lines": log_lines,
            "dice_hint": hint_text,
            "rebirth_lock_text": expected_lock,
        }
    finally:
        ctx.close()


def test_rune_awakening(browser: Browser, errs: list[str]) -> dict:
    """2) P3-2 Rune Awakening: Lv30 save with Lv10 thunder_2, awaken branch A, free-swap to branch B, run battle."""
    blob = build_save(
        school="thunder",
        level=30,
        rank=3,
        stones=50000,
        arcaneDust=500,
        selectedAct=3,
        selectedStage=1,
        highestAct=3,
        highestStageInAct=4,
        clearedActs=[1, 2],
        skills={
            "thunder_1": {"id": "thunder_1", "level": 10, "exp": 0, "unlocked": True},
            "thunder_2": {"id": "thunder_2", "level": 10, "exp": 0, "unlocked": True},
            "ward_1": {"id": "ward_1", "level": 6, "exp": 0, "unlocked": True},
        },
        deck=["thunder_2", "thunder_1", "ward_1"],
        trainingSlots=["ward_1"],
    )
    ctx, pg = open_seeded_page(browser, blob, "rune_awaken", errs)
    try:
        # Open School tab
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".rune-awaken-box", timeout=8000)
        assert_no_overflow(pg, "school_rune_awaken_before")

        # Locate thunder_2's rune awakening box (or first .rune-awaken-box if scoped to Lv10 skills)
        awaken_box = pg.locator(".rune-awaken-box").first
        branch_btns = awaken_box.locator(".rune-branch-btn")
        assert branch_btns.count() >= 2, f"Expected 2 rune branch buttons inside .rune-awaken-box, got {branch_btns.count()}"

        # Awaken Branch A
        branch_btns.nth(0).click()
        pg.wait_for_timeout(350)

        badge = awaken_box.locator(".rune-awakened-badge")
        branch_a_cls = branch_btns.nth(0).get_attribute("class") or ""
        assert badge.count() >= 1 or "is-active" in branch_a_cls, (
            "Expected .rune-awakened-badge or .rune-branch-btn.is-active after awakening Branch A"
        )
        state_after_a = json.loads(pg.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        stones_after_a = state_after_a.get("stones", 0)
        dust_after_a = state_after_a.get("arcaneDust", 0)

        # Swap to Branch B for free
        branch_btns.nth(1).click()
        pg.wait_for_timeout(350)
        branch_b_cls = branch_btns.nth(1).get_attribute("class") or ""
        assert "is-active" in branch_b_cls, f"Expected Branch B to become active on free swap, class='{branch_b_cls}'"

        state_after_b = json.loads(pg.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        assert state_after_b.get("stones", 0) >= stones_after_a, "Free rune branch swap should not spend stones"
        assert state_after_b.get("arcaneDust", 0) >= dust_after_a, "Free rune branch swap should not spend arcaneDust"

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_04_rune_awakening.png"))
        assert_no_overflow(pg, "school_rune_awaken_after")

        # Return to Battle tab and confirm combat runs cleanly
        pg.locator(".bottom-nav button").nth(0).click()
        pg.wait_for_selector(".arena-card", timeout=6000)
        pg.locator("button[title='전투 배속']").click()
        pg.wait_for_timeout(2000)
        battle_logs = pg.locator(".combat-log-box .log-line").count()
        assert battle_logs >= 2, f"Expected combat to progress after awakening, got {battle_logs} log lines"
        assert_no_overflow(pg, "battle_after_rune_awaken")

        return {
            "branch_a_stones_left": stones_after_a,
            "branch_a_dust_left": dust_after_a,
            "free_swap_verified": True,
            "post_awaken_battle_logs": battle_logs,
        }
    finally:
        ctx.close()


def test_p3_5_tower_lords_and_affinity(browser: Browser, errs: list[str]) -> dict:
    """3) P3-5 Named 5F Tower Lord preview + battle encounter quote + School Professor Affinity gift & milestone."""
    blob = build_save(
        school="flame",
        level=60,
        rank=5,
        stones=120000,
        arcaneDust=800,
        tomeShards=25,
        eggShards=25,
        selectedAct=6,
        selectedStage=3,
        highestAct=6,
        highestStageInAct=4,
        clearedActs=[1, 2, 3, 4, 5, 6],
        towerFloor=5,
        highestTowerFloor=4,
        skills={
            "flame_1": {"id": "flame_1", "level": 10, "exp": 0, "unlocked": True},
            "flame_2": {"id": "flame_2", "level": 10, "exp": 0, "unlocked": True},
            "ward_1": {"id": "ward_1", "level": 10, "exp": 0, "unlocked": True},
        },
        deck=["flame_2", "flame_1", "ward_1"],
        trainingSlots=["ward_1"],
    )
    ctx, pg = open_seeded_page(browser, blob, "p3_5_content", errs)
    try:
        # (a) Abyss -> Infinite Tower 5F Named Lord preview
        pg.locator(".bottom-nav button").nth(4).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn").nth(1).click()
        pg.wait_for_timeout(350)

        lord_preview = pg.locator(".tower-lord-preview")
        assert lord_preview.count() >= 1 and lord_preview.first.is_visible(), (
            "Expected .tower-lord-preview card on Infinite Tower 5F"
        )
        lord_preview_text = lord_preview.first.inner_text().strip()
        assert len(lord_preview_text) > 5, "Tower lord preview card should contain named lord details"
        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_05_tower_lord_preview.png"))
        assert_no_overflow(pg, "tower_5f_preview")

        # Challenge 5F -> verify named Tower Lord spawns with encounter quote
        pg.locator("button:has-text('무한 심연 탑 5층 도전')").click()
        pg.wait_for_selector(".arena-card", timeout=6000)
        pg.wait_for_timeout(350)

        stage_lbl = pg.locator(".stage-label").inner_text().strip()
        assert "5층" in stage_lbl, f"Expected tower 5F stage label, got '{stage_lbl}'"
        assert pg.locator(".enemy-card.boss").count() == 1, "5F Tower Lord should render as boss card"
        lord_name = pg.locator(".enemy-card .combatant-name").inner_text().strip()
        quote_strip = pg.locator(".boss-quote-strip")
        assert quote_strip.count() == 1 and quote_strip.is_visible(), (
            "Expected .boss-quote-strip encounter quote on 5F Tower Lord"
        )
        lord_quote = quote_strip.inner_text().strip()
        assert len(lord_quote) > 4, f"Encounter quote unexpectedly empty: '{lord_quote}'"
        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_06_tower_lord_battle.png"))
        assert_no_overflow(pg, "tower_5f_battle")

        # (b) School tab -> Professor Affinity section (gift & milestone unlock)
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)

        # Navigate to affinity subtab if present (e.g. '교수 인연' / '호감도'), else look inside current/headmaster view
        subtabs = pg.locator(".subtab-btn")
        clicked_affinity_tab = False
        for i in range(subtabs.count()):
            txt = subtabs.nth(i).inner_text().strip()
            if re.search(r"호감|인연|교수", txt):
                subtabs.nth(i).click()
                clicked_affinity_tab = True
                pg.wait_for_timeout(350)
                break
        if not clicked_affinity_tab and pg.locator(".affinity-section").count() == 0:
            # Fallback: check headmaster / faculty subtab (nth 2)
            if subtabs.count() >= 3:
                subtabs.nth(2).click()
                pg.wait_for_timeout(350)

        pg.wait_for_selector(".affinity-gift-btn", timeout=8000)
        gift_btn = pg.locator(".affinity-gift-btn").first
        assert gift_btn.is_visible() and not gift_btn.is_disabled(), "Expected enabled .affinity-gift-btn"

        before_unlocked = pg.locator(".affinity-milestone.is-unlocked").count()
        # Click gift button up to 10 times until a milestone unlocks
        after_unlocked = before_unlocked
        gifts_given = 0
        for _ in range(10):
            if gift_btn.is_disabled():
                break
            gift_btn.click()
            gifts_given += 1
            pg.wait_for_timeout(180)
            after_unlocked = pg.locator(".affinity-milestone.is-unlocked").count()
            if after_unlocked > before_unlocked:
                break

        assert gifts_given >= 1, "Failed to give any gift to professor"
        assert after_unlocked > before_unlocked, (
            f"Expected at least one .affinity-milestone.is-unlocked after {gifts_given} gifts (was {before_unlocked}, now {after_unlocked})"
        )
        pg.screenshot(path=os.path.join(OUT_DIR, "p3_swarm_07_professor_affinity.png"))
        assert_no_overflow(pg, "professor_affinity")

        return {
            "tower_lord_name": lord_name,
            "tower_lord_quote": lord_quote,
            "gifts_given": gifts_given,
            "milestones_unlocked": after_unlocked,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            r_polish = test_ui_polish(browser, errs)
            r_rune = test_rune_awakening(browser, errs)
            r_content = test_p3_5_tower_lords_and_affinity(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Page errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "ui_polish": r_polish,
                "rune_awakening": r_rune,
                "p3_5_content": r_content,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
