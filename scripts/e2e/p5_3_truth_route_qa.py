"""P5-3 Rebirth (NG+) Truth Route & Hidden Epilogue E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P5-3:
1. Initial Load:
   * `.top-header` & `.bottom-nav` render cleanly with 0 pageerrors/console errors and 0 horizontal overflow
2. Abyss Tab -> 시간 회귀 subtab (`심연` -> `시간 회귀`):
   * `.truth-route-panel` shows `4 / 5` progress, 4 `.truth-letter-card.is-opened`,
     1 `.truth-letter-card.is-claimable` (`루시아`), and `.true-ending-card` does not have an enabled `.true-ending-btn` yet
   * Clean screenshot `p5_3_01_truth_panel.png` with 0 horizontal overflow
3. Initial `별의 잔재`:
   * Rebirth panel shows `별의 잔재: 10`
4. Opening the 5th Truth Letter (`루시아`):
   * Clicking `.truth-letter-card.is-claimable` opens `.modal-backdrop .truth-letter-modal`
   * `.truth-letter-body` and `.truth-letter-claim-btn` are visible with 0 horizontal overflow
   * Clean screenshot `p5_3_02_truth_letter.png`
5. Claiming the 5th Truth Letter:
   * Clicking `.truth-letter-claim-btn` and closing via `button:has-text('닫기')` updates `.truth-route-panel` to `5 / 5`,
     increases `별의 잔재` (`10 -> 14`), and enables `.true-ending-btn`
6. Hidden Epilogue / True Ending VN Modal:
   * Clicking `.true-ending-btn` opens `.modal-backdrop .story-vn-modal`
   * `.modal-title` contains `별빛이 돌아온 아침`, `.true-ending-seal-banner` is visible,
     6 `.dialogue-vn` rows exist, and strictly 1 `button.btn-gold` exists inside `.story-vn-modal`
   * Clean screenshot `p5_3_03_true_ending.png` with 0 horizontal overflow
7. Claiming True Ending Reward:
   * Closing via `button.btn-gold` increases `별의 잔재` (`14 -> 24`)
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
        level=65,
        rank=5,
        clearedActs=[1, 2, 3, 4, 5, 6],
        highestAct=6,
        highestStageInAct=4,
        truthRoute={
            "openedLetters": [
                "truth_knoss",
                "truth_irene_rose",
                "truth_aldrich_oath",
                "truth_bernard_confession",
            ],
            "epilogueClaimed": False,
        },
    )
    if "abyss" in s:
        s["abyss"]["lastLanternTick"] = now_ms
        s["abyss"]["activeNode"] = None
        s["abyss"]["lastResult"] = None
    if "prestige" not in s:
        s["prestige"] = {}
    s["prestige"]["rebirthCount"] = 1
    s["prestige"]["starRemnants"] = 10
    s["prestige"]["totalRemnantsEarned"] = 20
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


def parse_star_remnants(page: Page) -> int:
    el = page.locator(".panel-sub", has_text="별의 잔재:").first
    el.wait_for(state="visible", timeout=6000)
    raw = el.inner_text().strip()
    match = re.search(r"별의 잔재:\s*([\d,]+)", raw)
    assert match, f"Failed to parse 별의 잔재 count from '{raw}'"
    return int(match.group(1).replace(",", ""))


def test_p5_3_truth_route(browser: Browser, errs: list[str]) -> dict:
    """Verify P5-3 NG+ Truth Route letter claiming and Hidden Epilogue modal flow."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p5_3_truth_route", errs)
    try:
        # 1) Initial load overflow check
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 심연 (index 4) -> click 시간 회귀 subtab
        pg.locator(".bottom-nav button").nth(4).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn", has_text="시간 회귀").first.click()

        # 3) Verify .truth-route-panel shows 4/5 progress, 4 opened, 1 claimable (루시아), locked true ending
        truth_panel = pg.locator(".truth-route-panel")
        truth_panel.wait_for(state="visible", timeout=6000)
        panel_text_before = truth_panel.inner_text().strip()
        assert "4 / 5" in panel_text_before or "4/5" in panel_text_before, (
            f"Expected '4 / 5' progress in .truth-route-panel, got '{panel_text_before}'"
        )

        opened_count_before = truth_panel.locator(".truth-letter-card.is-opened").count()
        assert opened_count_before == 4, (
            f"Expected 4 .truth-letter-card.is-opened, got {opened_count_before}"
        )

        claimable_cards = truth_panel.locator(".truth-letter-card.is-claimable")
        claimable_count_before = claimable_cards.count()
        assert claimable_count_before == 1, (
            f"Expected 1 .truth-letter-card.is-claimable, got {claimable_count_before}"
        )
        claimable_card_text = claimable_cards.first.inner_text().strip()
        assert "루시아" in claimable_card_text, (
            f"Expected claimable letter card to be for '루시아', got '{claimable_card_text}'"
        )

        true_ending_card = pg.locator(".true-ending-card")
        true_ending_card.wait_for(state="visible", timeout=6000)
        true_ending_btn_before = true_ending_card.locator(".true-ending-btn")
        assert (
            true_ending_btn_before.count() == 0
            or true_ending_btn_before.first.is_disabled()
        ), "Expected .true-ending-btn inside .true-ending-card to not be enabled before 5/5"

        truth_panel.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "truth_panel_4_of_5")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_3_01_truth_panel.png"))

        # 4) Read initial 별의 잔재 count from Rebirth panel
        remnants_initial = parse_star_remnants(pg)
        assert remnants_initial == 10, (
            f"Expected initial 별의 잔재 == 10, got {remnants_initial}"
        )

        # 5) Click .truth-letter-card.is-claimable -> wait for .modal-backdrop .truth-letter-modal
        claimable_cards.first.click()
        letter_modal = pg.locator(".modal-backdrop .truth-letter-modal")
        letter_modal.wait_for(state="visible", timeout=6000)

        # 6) Verify .truth-letter-body & .truth-letter-claim-btn visible, 0 overflow, screenshot
        letter_body = letter_modal.locator(".truth-letter-body")
        letter_body.wait_for(state="visible", timeout=4000)
        assert letter_body.is_visible(), "Expected .truth-letter-body to be visible"
        letter_body_text = letter_body.inner_text().strip()
        assert len(letter_body_text) > 0, "Expected non-empty .truth-letter-body text"

        claim_btn = letter_modal.locator(".truth-letter-claim-btn")
        claim_btn.wait_for(state="visible", timeout=4000)
        assert claim_btn.is_visible() and claim_btn.is_enabled(), (
            "Expected .truth-letter-claim-btn to be visible and enabled"
        )
        assert_no_overflow(pg, "truth_letter_modal")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_3_02_truth_letter.png"))

        # 7) Click .truth-letter-claim-btn -> wait 250ms -> close modal -> wait 200ms
        claim_btn.click()
        pg.wait_for_timeout(250)
        close_letter_btn = letter_modal.locator("button:has-text('닫기')").first
        close_letter_btn.wait_for(state="visible", timeout=4000)
        close_letter_btn.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".modal-backdrop .truth-letter-modal").count() == 0, (
            "Expected .truth-letter-modal to close after clicking 닫기"
        )

        # 8) Verify 5/5 progress, 별의 잔재 increased (10 -> 14), and .true-ending-btn visible & enabled
        panel_text_after = truth_panel.inner_text().strip()
        assert "5 / 5" in panel_text_after or "5/5" in panel_text_after, (
            f"Expected '5 / 5' progress in .truth-route-panel after claim, got '{panel_text_after}'"
        )
        opened_count_after = truth_panel.locator(".truth-letter-card.is-opened").count()
        assert opened_count_after == 5, (
            f"Expected 5 .truth-letter-card.is-opened after claim, got {opened_count_after}"
        )

        remnants_after_letter = parse_star_remnants(pg)
        assert remnants_after_letter == 14, (
            f"Expected 별의 잔재 to increase from 10 to 14, got {remnants_after_letter}"
        )

        true_ending_btn = true_ending_card.locator(".true-ending-btn")
        true_ending_btn.wait_for(state="visible", timeout=4000)
        assert true_ending_btn.is_visible() and true_ending_btn.is_enabled(), (
            "Expected .true-ending-btn to be visible and enabled at 5/5"
        )

        # 9) Click .true-ending-btn -> wait for .modal-backdrop .story-vn-modal
        true_ending_btn.click()
        vn_modal = pg.locator(".modal-backdrop .story-vn-modal")
        vn_modal.wait_for(state="visible", timeout=6000)

        # 10) Verify title, .true-ending-seal-banner, 6 .dialogue-vn rows, strictly 1 button.btn-gold, 0 overflow
        vn_title = vn_modal.locator(".modal-title").first.inner_text().strip()
        assert "별빛이 돌아온 아침" in vn_title, (
            f"Expected .story-vn-modal title to contain '별빛이 돌아온 아침', got '{vn_title}'"
        )

        seal_banner = vn_modal.locator(".true-ending-seal-banner")
        seal_banner.wait_for(state="visible", timeout=4000)
        assert seal_banner.is_visible(), "Expected .true-ending-seal-banner to be visible"

        dialogue_count = vn_modal.locator(".dialogue-vn").count()
        assert dialogue_count == 6, (
            f"Expected 6 .dialogue-vn rows in True Ending modal, got {dialogue_count}"
        )

        gold_btn_count = vn_modal.locator("button.btn-gold").count()
        assert gold_btn_count == 1, (
            f"Expected strictly 1 button.btn-gold inside .story-vn-modal, got {gold_btn_count}"
        )

        assert_no_overflow(pg, "true_ending_modal")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_3_03_true_ending.png"))

        # 11) Close True Ending modal via button.btn-gold -> wait 250ms -> verify 별의 잔재 (14 -> 24)
        vn_modal.locator("button.btn-gold").first.click()
        pg.wait_for_timeout(250)
        assert pg.locator(".modal-backdrop .story-vn-modal").count() == 0, (
            "Expected .story-vn-modal to close cleanly after clicking button.btn-gold"
        )

        remnants_after_ending = parse_star_remnants(pg)
        assert remnants_after_ending == 24, (
            f"Expected 별의 잔재 to increase from 14 to 24 after True Ending, got {remnants_after_ending}"
        )
        assert_no_overflow(pg, "truth_panel_after_ending")

        return {
            "opened_before": opened_count_before,
            "claimable_card": claimable_card_text.replace("\n", " "),
            "opened_after": opened_count_after,
            "remnants_initial": remnants_initial,
            "remnants_after_letter": remnants_after_letter,
            "remnants_after_ending": remnants_after_ending,
            "true_ending_title": vn_title,
            "dialogue_rows": dialogue_count,
            "gold_btn_count": gold_btn_count,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p5_3_truth_route(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p5_3_truth_route": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
