"""P5-4 School Questline & Campus Noticeboard (학파 전승 & 교내 게시판) E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P5-4:
1. School Tab -> 과제 subtab:
   * `.daily-inner-tabs button` has 3 tabs (`오늘의 과제`, `학파 전승`, `교내 게시판`)
   * 0 horizontal overflow (`scrollWidth <= innerWidth + 1`)
2. School Questline (`학파 전승`):
   * `.school-quest-panel` renders 4 `.school-quest-card` cards
   * At least 2 `.school-quest-card.is-claimable` for rank 2 + Act 1/2 clear
   * Clicking `완료 보고` inside first `.school-quest-card.is-claimable` increases stones
     (`.top-header .curr-pill.gold`), yields `.school-quest-card.is-claimed` >= 1,
     and renders `.sq-epilogue` quote
3. Campus Noticeboard (`교내 게시판`):
   * `.noticeboard-panel` renders 10 `.campus-notice-card` items
     (both `.is-claimable` unlocked and `.is-locked` late-act notices)
   * Clicking first `.campus-notice-card.is-claimable` opens `.modal-backdrop .notice-reader-modal`
     with `.notice-body`, `.notice-margin-scribble`, and `.notice-claim-btn` visible and 0 overflow
   * Clicking `.notice-claim-btn` increases stones; clicking `닫기` closes modal cleanly
     and `.campus-notice-card.is-read` >= 1
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
EXPECTED_DAILY_INNER_TABS = ["오늘의 과제", "학파 전승", "교내 게시판"]


def build_save(**overrides) -> str:
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        s = json.load(f)
    now_ms = int(time.time() * 1000)
    s.update(
        lastSavedAt=now_ms,
        school="thunder",
        level=20,
        rank=2,
        clearedActs=[1, 2],
        highestAct=3,
        highestStageInAct=1,
        totalKills=60,
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
        schoolJournal={
            "claimedQuests": [],
            "readNotices": [],
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


def test_p5_4_school_journal(browser: Browser, errs: list[str]) -> dict:
    """Verify P5-4 school questline, campus noticeboard, reader modal, and reward claims."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p5_4_school_journal", errs)
    try:
        # 1) Initial page load & overflow check
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 학교 (index 1) -> click 과제 subtab
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".school-subtabs", timeout=6000)
        pg.locator(".school-subtabs .subtab-btn", has_text="과제").first.click()
        pg.wait_for_selector(".daily-inner-tabs", timeout=6000)

        # 3) Verify .daily-inner-tabs button has 3 tabs & 0 overflow
        inner_tabs = pg.locator(".daily-inner-tabs button")
        inner_tab_count = inner_tabs.count()
        assert inner_tab_count == 3, (
            f"Expected 3 .daily-inner-tabs button tabs, got {inner_tab_count}"
        )
        inner_tab_texts = [
            inner_tabs.nth(i).inner_text().strip() for i in range(inner_tab_count)
        ]
        for expected_tab in EXPECTED_DAILY_INNER_TABS:
            assert any(expected_tab in txt for txt in inner_tab_texts), (
                f"Expected tab '{expected_tab}' in .daily-inner-tabs, got {inner_tab_texts}"
            )
        assert_no_overflow(pg, "daily_inner_tabs")

        # 4) Click 학파 전승 inside .daily-inner-tabs
        pg.locator(".daily-inner-tabs button", has_text="학파 전승").first.click()
        quest_panel = pg.locator(".school-quest-panel")
        quest_panel.wait_for(state="visible", timeout=6000)
        pg.wait_for_selector(".school-quest-card", timeout=6000)

        # 5) Verify 4 .school-quest-card cards & >= 2 .is-claimable, 0 overflow, screenshot
        quest_cards_total = quest_panel.locator(".school-quest-card").count()
        quest_claimable_initial = quest_panel.locator(".school-quest-card.is-claimable").count()
        assert quest_cards_total == 4, (
            f"Expected 4 .school-quest-card cards in .school-quest-panel, got {quest_cards_total}"
        )
        assert quest_claimable_initial >= 2, (
            f"Expected >= 2 .school-quest-card.is-claimable, got {quest_claimable_initial}"
        )
        assert_no_overflow(pg, "school_quests_initial")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_4_01_school_quests.png"))

        # 6) Record stones, click 완료 보고 inside first .school-quest-card.is-claimable, verify reward & epilogue
        stones_before_quest = parse_stones(pg)
        first_claimable_quest = quest_panel.locator(".school-quest-card.is-claimable").first
        claim_quest_btn = first_claimable_quest.locator("button:has-text('완료 보고')").first
        assert claim_quest_btn.is_visible(), (
            "Expected '완료 보고' button to be visible inside first .school-quest-card.is-claimable"
        )
        claim_quest_btn.click()
        pg.wait_for_timeout(250)

        stones_after_quest = parse_stones(pg)
        assert stones_after_quest > stones_before_quest, (
            f"Expected stones to increase after claiming school quest: {stones_before_quest} -> {stones_after_quest}"
        )
        quest_claimed_after = quest_panel.locator(".school-quest-card.is-claimed").count()
        assert quest_claimed_after >= 1, (
            f"Expected >= 1 .school-quest-card.is-claimed after claiming, got {quest_claimed_after}"
        )
        epilogue = quest_panel.locator(".sq-epilogue").first
        assert epilogue.is_visible(), "Expected .sq-epilogue quote to appear after claiming quest"
        epilogue_text = epilogue.inner_text().strip()
        assert len(epilogue_text) > 0, "Expected non-empty .sq-epilogue quote"
        assert_no_overflow(pg, "school_quests_after_claim")

        # 7) Click 교내 게시판 inside .daily-inner-tabs
        pg.locator(".daily-inner-tabs button", has_text="교내 게시판").first.click()
        notice_panel = pg.locator(".noticeboard-panel")
        notice_panel.wait_for(state="visible", timeout=6000)
        pg.wait_for_selector(".campus-notice-card", timeout=6000)

        # 8) Verify 10 .campus-notice-card items (both .is-claimable and .is-locked), 0 overflow, screenshot
        notice_cards_total = notice_panel.locator(".campus-notice-card").count()
        notice_claimable_initial = notice_panel.locator(".campus-notice-card.is-claimable").count()
        notice_locked_initial = notice_panel.locator(".campus-notice-card.is-locked").count()
        assert notice_cards_total == 10, (
            f"Expected 10 .campus-notice-card items in .noticeboard-panel, got {notice_cards_total}"
        )
        assert notice_claimable_initial >= 1, (
            f"Expected >= 1 .campus-notice-card.is-claimable, got {notice_claimable_initial}"
        )
        assert notice_locked_initial >= 1, (
            f"Expected >= 1 .campus-notice-card.is-locked, got {notice_locked_initial}"
        )
        assert_no_overflow(pg, "noticeboard_initial")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_4_02_noticeboard.png"))

        # 9) Record stones & click first .campus-notice-card.is-claimable -> verify reader modal
        stones_before_notice = parse_stones(pg)
        notice_panel.locator(".campus-notice-card.is-claimable").first.click()
        modal = pg.locator(".modal-backdrop .notice-reader-modal")
        modal.wait_for(state="visible", timeout=6000)

        notice_body = modal.locator(".notice-body").first
        notice_scribble = modal.locator(".notice-margin-scribble").first
        notice_claim_btn = modal.locator(".notice-claim-btn").first
        assert notice_body.is_visible(), "Expected .notice-body to be visible in notice modal"
        assert len(notice_body.inner_text().strip()) > 0, (
            "Expected non-empty .notice-body"
        )
        assert notice_scribble.is_visible(), (
            "Expected .notice-margin-scribble to be visible in notice modal"
        )
        assert len(notice_scribble.inner_text().strip()) > 0, (
            "Expected non-empty .notice-margin-scribble"
        )
        assert notice_claim_btn.is_visible(), (
            "Expected .notice-claim-btn to be visible in notice modal"
        )
        assert_no_overflow(pg, "notice_reader_modal")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_4_03_notice_modal.png"))

        # 10) Click .notice-claim-btn -> wait 250ms -> verify stones increased -> close modal -> verify .is-read >= 1
        notice_claim_btn.click()
        pg.wait_for_timeout(250)
        stones_after_notice = parse_stones(pg)
        assert stones_after_notice > stones_before_notice, (
            f"Expected stones to increase after claiming notice: {stones_before_notice} -> {stones_after_notice}"
        )

        close_btn = modal.locator("button:has-text('닫기')").first
        assert close_btn.is_visible(), "Expected '닫기' button to be visible in notice modal"
        close_btn.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".modal-backdrop .notice-reader-modal").count() == 0, (
            "Expected notice reader modal to close cleanly after clicking 닫기"
        )
        notice_read_after = notice_panel.locator(".campus-notice-card.is-read").count()
        assert notice_read_after >= 1, (
            f"Expected >= 1 .campus-notice-card.is-read after claiming, got {notice_read_after}"
        )
        assert_no_overflow(pg, "noticeboard_after_claim")

        return {
            "daily_inner_tabs": inner_tab_texts,
            "quest_cards_total": quest_cards_total,
            "quest_claimable_initial": quest_claimable_initial,
            "stones_before_quest": stones_before_quest,
            "stones_after_quest": stones_after_quest,
            "quest_claimed_after": quest_claimed_after,
            "epilogue_preview": epilogue_text[:60],
            "notice_cards_total": notice_cards_total,
            "notice_claimable_initial": notice_claimable_initial,
            "notice_locked_initial": notice_locked_initial,
            "stones_before_notice": stones_before_notice,
            "stones_after_notice": stones_after_notice,
            "notice_read_after": notice_read_after,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p5_4_school_journal(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p5_4_school_journal": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
