"""P5-1 Astra Worldview Bible, Chronicle & Glossary Codex (연대기·사전) E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P5-1:
1. School Tab -> 기록실 subtab:
   * `.archive-mode-tabs button` has 3 tabs (`몬스터 도감`, `업적 · 칭호`, `연대기·사전`)
   * 0 horizontal overflow (`scrollWidth <= innerWidth + 1`)
2. Codex (연대기·사전):
   * Clicking `연대기·사전` in `.archive-mode-tabs` renders `.codex-filter-row` pills
     (`전체`, `연대기`, `학파·마법`, `용어 사전`, `극비 기록`)
   * Unlocked `.codex-card.is-claimable` count >= 8 and locked `.codex-card.is-locked` count >= 1
3. Codex Reader Modal & Claim Flow:
   * Clicking first `.codex-card.is-claimable` opens `.modal-backdrop .codex-reader-modal`
   * `.codex-manuscript-body`, `.codex-curator-note`, and `.codex-claim-btn` are visible with 0 overflow
   * Clicking `.codex-claim-btn` increases stones (`.top-header .curr-pill.gold`)
   * Closing modal (`button:has-text('닫기')`) closes cleanly and `.codex-card.is-claimed` count >= 1
4. Codex Filtering (`극비 기록`):
   * Clicking `극비 기록` in `.codex-filter-row` displays 3 secret entries
     (including unlocked Act-3 secret & locked Act-6 secret) with 0 horizontal overflow
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
EXPECTED_ARCHIVE_TABS = ["몬스터 도감", "업적 · 칭호", "연대기·사전"]
EXPECTED_CODEX_FILTERS = ["전체", "연대기", "학파·마법", "용어 사전", "극비 기록"]


def build_save(**overrides) -> str:
    with open(SAVE_PATH, "r", encoding="utf-8") as f:
        s = json.load(f)
    now_ms = int(time.time() * 1000)
    s.update(
        lastSavedAt=now_ms,
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
        clearedActs=[1, 2, 3],
        highestAct=4,
        highestStageInAct=1,
        rank=2,
        archive={
            "killCounts": {"m1_1_slime": 10},
            "claimedBestiary": [],
            "claimedAchievements": [],
            "claimedCodex": [],
            "equippedTitle": None,
            "perfectInterventions": 0,
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


def test_p5_1_codex(browser: Browser, errs: list[str]) -> dict:
    """Verify P5-1 Astra Archive Codex tabs, reader modal, claim reward, and filtering."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p5_1_codex", errs)
    try:
        # 1) Initial page load & overflow check
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 학교 (index 1) -> click 기록실 subtab
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".school-subtabs", timeout=6000)
        pg.locator(".school-subtabs .subtab-btn", has_text="기록실").first.click()
        pg.wait_for_selector(".archive-mode-tabs", timeout=6000)

        # 3) Verify .archive-mode-tabs button has 3 tabs & 0 overflow
        mode_btns = pg.locator(".archive-mode-tabs button")
        mode_tab_count = mode_btns.count()
        assert mode_tab_count == 3, (
            f"Expected 3 .archive-mode-tabs button tabs, got {mode_tab_count}"
        )
        mode_tab_texts = [
            mode_btns.nth(i).inner_text().strip() for i in range(mode_tab_count)
        ]
        for expected_tab in EXPECTED_ARCHIVE_TABS:
            assert any(expected_tab in txt for txt in mode_tab_texts), (
                f"Expected tab '{expected_tab}' in .archive-mode-tabs, got {mode_tab_texts}"
            )
        assert_no_overflow(pg, "archive_mode_tabs")

        # 4) Click 연대기·사전 inside .archive-mode-tabs
        pg.locator(".archive-mode-tabs button", has_text="연대기·사전").first.click()
        pg.wait_for_selector(".codex-filter-row", timeout=6000)
        pg.wait_for_selector(".codex-card", timeout=6000)

        # 5) Verify .codex-filter-row pills, claimable >= 8, locked >= 1, 0 overflow
        filter_pills = pg.locator(".codex-filter-row button, .codex-filter-row .filter-pill")
        pill_count = filter_pills.count()
        pill_texts = [filter_pills.nth(i).inner_text().strip() for i in range(pill_count)]
        for expected_pill in EXPECTED_CODEX_FILTERS:
            assert any(expected_pill in txt for txt in pill_texts), (
                f"Expected filter pill '{expected_pill}' in .codex-filter-row, got {pill_texts}"
            )

        claimable_count_initial = pg.locator(".codex-card.is-claimable").count()
        locked_count_initial = pg.locator(".codex-card.is-locked").count()
        assert claimable_count_initial >= 8, (
            f"Expected >= 8 .codex-card.is-claimable, got {claimable_count_initial}"
        )
        assert locked_count_initial >= 1, (
            f"Expected >= 1 .codex-card.is-locked, got {locked_count_initial}"
        )
        assert_no_overflow(pg, "codex_list_initial")

        # 6) Screenshot codex list
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_1_01_codex_list.png"))

        # 7) Record stones & click first .codex-card.is-claimable to open reader modal
        stones_before = parse_stones(pg)
        pg.locator(".codex-card.is-claimable").first.click()
        modal = pg.locator(".modal-backdrop .codex-reader-modal")
        modal.wait_for(state="visible", timeout=6000)

        # 8) Verify .codex-manuscript-body, .codex-curator-note, .codex-claim-btn visible & 0 overflow
        manuscript_body = modal.locator(".codex-manuscript-body").first
        curator_note = modal.locator(".codex-curator-note").first
        claim_btn = modal.locator(".codex-claim-btn").first
        assert manuscript_body.is_visible(), "Expected .codex-manuscript-body to be visible"
        assert len(manuscript_body.inner_text().strip()) > 0, (
            "Expected non-empty .codex-manuscript-body"
        )
        assert curator_note.is_visible(), "Expected .codex-curator-note to be visible"
        assert len(curator_note.inner_text().strip()) > 0, (
            "Expected non-empty .codex-curator-note"
        )
        assert claim_btn.is_visible(), "Expected .codex-claim-btn to be visible"
        assert_no_overflow(pg, "codex_reader_modal")

        pg.screenshot(path=os.path.join(OUT_DIR, "p5_1_02_codex_modal.png"))

        # 9) Click .codex-claim-btn -> wait 250ms -> verify stones increased -> close modal -> verify claimed
        claim_btn.click()
        pg.wait_for_timeout(250)
        stones_after = parse_stones(pg)
        assert stones_after > stones_before, (
            f"Expected stones to increase after claiming codex entry: {stones_before} -> {stones_after}"
        )

        close_btn = modal.locator("button:has-text('닫기')").first
        assert close_btn.is_visible(), "Expected '닫기' button to be visible in codex modal"
        close_btn.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".modal-backdrop .codex-reader-modal").count() == 0, (
            "Expected codex reader modal to close cleanly after clicking 닫기"
        )
        claimed_count = pg.locator(".codex-card.is-claimed").count()
        assert claimed_count >= 1, (
            f"Expected >= 1 .codex-card.is-claimed after claiming, got {claimed_count}"
        )
        assert_no_overflow(pg, "codex_after_claim")

        # 10) Filter by 극비 기록 -> verify 3 secret entries (unlocked + locked), 0 overflow, screenshot
        pg.locator(".codex-filter-row", has_text="극비 기록").locator(
            "button, .filter-pill", has_text="극비 기록"
        ).first.click()
        pg.wait_for_timeout(150)

        secret_cards = pg.locator(".codex-card")
        secret_total = secret_cards.count()
        secret_unlocked = pg.locator(".codex-card:not(.is-locked)").count()
        secret_locked = pg.locator(".codex-card.is-locked").count()
        assert secret_total == 3, (
            f"Expected 3 secret codex entries under '극비 기록', got {secret_total}"
        )
        assert secret_unlocked >= 1 and secret_locked >= 1, (
            f"Expected both unlocked (>=1) and locked (>=1) secret entries, got unlocked={secret_unlocked}, locked={secret_locked}"
        )
        assert_no_overflow(pg, "codex_secrets_filter")

        pg.screenshot(path=os.path.join(OUT_DIR, "p5_1_03_codex_secrets.png"))

        return {
            "archive_mode_tabs": mode_tab_texts,
            "codex_filter_pills": pill_texts,
            "claimable_count_initial": claimable_count_initial,
            "locked_count_initial": locked_count_initial,
            "stones_before_claim": stones_before,
            "stones_after_claim": stones_after,
            "claimed_count_after": claimed_count,
            "secret_entries_total": secret_total,
            "secret_entries_unlocked": secret_unlocked,
            "secret_entries_locked": secret_locked,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p5_1_codex(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p5_1_codex": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
