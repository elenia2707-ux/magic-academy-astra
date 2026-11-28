"""P4-2 Astra Archive (도감 & 업적·칭호) E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P4-2:
1. School Tab -> 기록실 subtab:
   * All 5 `.school-subtabs .subtab-btn` exist (including `기록실`)
   * 0 horizontal overflow (`scrollWidth <= innerWidth + 1`)
2. Bestiary (마물 도감):
   * `.archive-summary-card` renders with discovered count (> 0)
   * `.archive-claim-all-btn` (`미수령 도감 일괄 기록`) is visible and claims all discovered entries
   * Clicking `.archive-claim-all-btn` increases stones and hides `.archive-claim-all-btn`
   * Clicking a discovered `.bestiary-card` opens `.modal-backdrop .hero-showcase-modal` containing `아스트라 박물 연구 메모`, and `닫기` closes it cleanly
3. Achievements & Titles (업적 · 칭호):
   * Clicking `업적 · 칭호` inside `.archive-mode-tabs` switches to achievements view
   * Claimable achievement cards (`.achievement-card.is-claimable`) appear
   * Claiming at least 2 achievements (preferring `완벽한 별빛` or first claimable cards) and equipping a title (`칭호 장착`)
   * `.top-header .player-sub` renders the equipped title wrapped in `「...」` with 0 horizontal overflow
   * Switching back to `전투` tab keeps the equipped title in `.top-header .player-sub` with 0 horizontal overflow
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
        totalKills=120,
        clearedActs=[1, 2],
        highestAct=3,
        highestStageInAct=2,
        rank=1,
        archive={
            "killCounts": {
                "m1_1_slime": 28,
                "m1_2_bats": 15,
                "boss_golem": 2,
                "exam_1": 1,
            },
            "claimedBestiary": [],
            "claimedAchievements": [],
            "equippedTitle": None,
            "perfectInterventions": 1,
        },
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


def test_p4_2_archive(browser: Browser, errs: list[str]) -> dict:
    """Verify P4-2 Astra Archive Bestiary, Achievements, and Equipped Title in Header."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p4_2_archive", errs)
    try:
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 학교 (.bottom-nav button index 1)
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".school-subtabs", timeout=6000)

        # 3) Assert all 5 .school-subtabs .subtab-btn exist (including 기록실) & 0 overflow
        subtab_btns = pg.locator(".school-subtabs .subtab-btn")
        subtab_count = subtab_btns.count()
        assert subtab_count == 5, f"Expected 5 .school-subtabs .subtab-btn, got {subtab_count}"
        subtab_texts = [subtab_btns.nth(i).inner_text().strip() for i in range(subtab_count)]
        assert any("기록실" in t for t in subtab_texts), (
            f"Expected '기록실' in school subtabs, got {subtab_texts}"
        )
        assert_no_overflow(pg, "school_subtabs")

        # 4) Click the 기록실 subtab button
        pg.locator(".school-subtabs .subtab-btn", has_text="기록실").first.click()
        pg.wait_for_selector(".archive-summary-card", timeout=6000)
        assert_no_overflow(pg, "archive_bestiary_initial")

        # 5) Verify .archive-summary-card renders with discovered count (> 0) & .archive-claim-all-btn visible
        summary_text = pg.locator(".archive-summary-card").inner_text().strip()
        assert len(summary_text) > 0, "Expected non-empty .archive-summary-card"
        m = re.search(r"(\d+)\s*/\s*(\d+)", summary_text)
        assert m, f"Expected discovered count 'X / Y' in .archive-summary-card, got '{summary_text}'"
        discovered_count = int(m.group(1))
        total_bestiary = int(m.group(2))
        assert discovered_count > 0, (
            f"Expected discovered count > 0 in .archive-summary-card, got {discovered_count}"
        )

        claim_all_btn = pg.locator(".archive-claim-all-btn")
        assert claim_all_btn.count() >= 1 and claim_all_btn.first.is_visible(), (
            "Expected .archive-claim-all-btn ('미수령 도감 일괄 기록') to be visible"
        )
        assert "미수령 도감 일괄 기록" in claim_all_btn.first.inner_text(), (
            f"Unexpected claim-all button text: '{claim_all_btn.first.inner_text()}'"
        )

        # 6) Screenshot Bestiary grid & claim-all button
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_2_01_bestiary.png"))

        # 7) Click .archive-claim-all-btn -> stones increase & .archive-claim-all-btn disappears
        stones_before = parse_stones(pg)
        claim_all_btn.first.click()
        pg.wait_for_timeout(300)
        stones_after = parse_stones(pg)
        assert stones_after > stones_before, (
            f"Expected stones to increase after claiming all bestiary entries: {stones_before} -> {stones_after}"
        )
        assert pg.locator(".archive-claim-all-btn").count() == 0, (
            "Expected .archive-claim-all-btn to disappear after claiming all discovered bestiary entries"
        )

        # 8) Click a discovered .bestiary-card -> verify .modal-backdrop .hero-showcase-modal
        discovered_cards = pg.locator(".bestiary-card:not(.is-locked)")
        assert discovered_cards.count() > 0, "Expected at least one unlocked .bestiary-card"
        discovered_cards.first.click()
        modal = pg.locator(".modal-backdrop .hero-showcase-modal")
        modal.wait_for(state="visible", timeout=6000)
        modal_text = modal.inner_text()
        assert "아스트라 박물 연구 메모" in modal_text, (
            f"Expected '아스트라 박물 연구 메모' in bestiary modal, got '{modal_text}'"
        )
        assert_no_overflow(pg, "bestiary_modal")

        close_btn = modal.locator("button:has-text('닫기')").first
        assert close_btn.is_visible(), "Expected '닫기' button to be visible in bestiary modal"
        close_btn.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".modal-backdrop .hero-showcase-modal").count() == 0, (
            "Expected bestiary modal to close cleanly after clicking 닫기"
        )

        # 9) Click 업적 · 칭호 button inside .archive-mode-tabs
        mode_tabs = pg.locator(".archive-mode-tabs")
        mode_tabs.wait_for(state="visible", timeout=6000)
        mode_tabs.locator("button", has_text="업적 · 칭호").first.click()
        pg.wait_for_selector(".achievement-card.is-claimable", timeout=6000)
        assert_no_overflow(pg, "archive_achievements_initial")

        # 10) Verify claimable achievement cards appear, claim >= 2 (including 완벽한 별빛 if present), then click 칭호 장착
        claimable_cards = pg.locator(".achievement-card.is-claimable")
        initial_claimable = claimable_cards.count()
        assert initial_claimable >= 2, (
            f"Expected at least 2 .achievement-card.is-claimable, got {initial_claimable}"
        )

        claimed_titles: list[str] = []
        perfect_card = pg.locator(".achievement-card.is-claimable", has_text="완벽한 별빛")
        if perfect_card.count() > 0:
            claimed_titles.append("완벽한 별빛")
            perfect_card.first.locator("button").first.click()
            pg.wait_for_timeout(200)

        while len(claimed_titles) < 2 and pg.locator(".achievement-card.is-claimable").count() > 0:
            next_card = pg.locator(".achievement-card.is-claimable").first
            claimed_titles.append(next_card.inner_text().splitlines()[0].strip())
            next_card.locator("button").first.click()
            pg.wait_for_timeout(200)

        assert len(claimed_titles) >= 2, f"Failed to claim >= 2 achievements: {claimed_titles}"

        equip_btn = pg.locator(".achievement-card button:has-text('칭호 장착')").first
        assert equip_btn.is_visible(), "Expected a '칭호 장착' button on a claimed achievement"
        equip_btn.click()
        pg.wait_for_timeout(250)

        # 11) Screenshot claimed achievements + equipped title state
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_2_02_achievements.png"))

        # 12) Assert .top-header .player-sub contains 「 and 」 AND 0 overflow
        player_sub_school = pg.locator(".top-header .player-sub").inner_text().strip()
        assert "「" in player_sub_school and "」" in player_sub_school, (
            f"Expected equipped title in .top-header .player-sub wrapped in 「...」, got '{player_sub_school}'"
        )
        assert_no_overflow(pg, "archive_achievements_equipped")

        # 13) Click bottom nav 전투 (.bottom-nav button index 0), wait 300ms, verify title & 0 overflow, screenshot
        pg.locator(".bottom-nav button").nth(0).click()
        pg.wait_for_timeout(300)
        pg.wait_for_selector(".arena-card", timeout=6000)

        player_sub_battle = pg.locator(".top-header .player-sub").inner_text().strip()
        assert "「" in player_sub_battle and "」" in player_sub_battle, (
            f"Expected equipped title to persist on Battle tab in .top-header .player-sub, got '{player_sub_battle}'"
        )
        assert_no_overflow(pg, "battle_with_equipped_title")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_2_03_header_title.png"))

        return {
            "subtab_count": subtab_count,
            "subtab_texts": subtab_texts,
            "discovered_count": discovered_count,
            "total_bestiary": total_bestiary,
            "stones_before_claim_all": stones_before,
            "stones_after_claim_all": stones_after,
            "initial_claimable_achievements": initial_claimable,
            "claimed_achievements": claimed_titles,
            "player_sub_school": player_sub_school,
            "player_sub_battle": player_sub_battle,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p4_2_archive(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p4_2_archive": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
