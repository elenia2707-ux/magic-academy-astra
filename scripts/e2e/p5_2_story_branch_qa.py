"""P5-2 Main Story Acts 1-6 Expansion (Choices, School Variants, Deep Epilogues) E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P5-2:
1. Initial Load:
   * `.top-header` & `.bottom-nav` render cleanly with 0 pageerrors/console errors and 0 horizontal overflow
2. School Tab -> 교장실 subtab (`학교` -> `교장실`):
   * Act 1 card shows `.act-choice-tag` containing `분기 0/2` with 0 horizontal overflow
3. Act 1 Story Modal & Compatibility Check:
   * Clicking `스토리` on Act 1 card opens `.modal-backdrop .story-vn-modal`
   * Exactly 1 `button.btn-gold` exists inside `.story-vn-modal` (critical compatibility with `regression_p0_11.py`)
4. Act 1 Mid-Phase Story Choice:
   * Clicking `중반` inside `.story-phase-tabs` reveals `.story-choice-box` with 2 `.story-choice-btn` buttons
   * Screenshot `p5_2_01_story_choice.png` with 0 overflow
   * Clicking the first `.story-choice-btn` selects it (`.story-choice-btn.is-selected` == 1),
     shows `.story-reaction-wrap` with reaction dialogue text, and preserves/updates stones cleanly
5. Act 1 Clear Epilogue & Choice:
   * Clicking `후일담` inside `.story-phase-tabs` displays `.act-epilogue-memo`
     (`아스트라 학사 공보` or `사후 기록`) and `.story-choice-box` with 2 `.story-choice-btn` buttons
   * Clicking the first `.story-choice-btn` renders `.story-reaction-wrap`
   * Screenshot `p5_2_02_story_epilogue.png` with 0 overflow
6. Choice Progress Tag Update:
   * Closing StoryModal via `button.btn-gold` updates Act 1 card `.act-choice-tag` to contain `분기 2/2`
7. Act 2 School-Specific Dialogue (`thunder` -> `볼타`):
   * Opening Act 2 story (`스토리` button on Act 2 card) and scanning phases (`도입`/`중반`/`보스`/`후일담`)
     finds the thunder school mentor (`볼타`) variant line with 0 overflow
   * Screenshot `p5_2_03_act2_school_line.png` and close modal cleanly
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
        school="thunder",
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
        clearedActs=[1, 2],
        highestAct=3,
        highestStageInAct=2,
        rank=1,
        storyChoices={},
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


def test_p5_2_story_branch(browser: Browser, errs: list[str]) -> dict:
    """Verify P5-2 Main Story choices, reaction lines, epilogue memos, and school-specific mentor lines."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p5_2_story_branch", errs)
    try:
        # 1) Initial load overflow check
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 학교 (index 1) -> click 교장실 subtab
        pg.locator(".bottom-nav button").nth(1).click()
        pg.wait_for_selector(".school-subtabs", timeout=6000)
        pg.locator(".school-subtabs .subtab-btn", has_text="교장실").first.click()

        # 3) Verify Act 1 card shows .act-choice-tag containing '분기 0/2', with 0 overflow
        choice_tags = pg.locator(".act-choice-tag")
        choice_tags.first.wait_for(state="visible", timeout=6000)
        act1_tag_before = choice_tags.first.inner_text().strip()
        assert "분기 0/2" in act1_tag_before, (
            f"Expected Act 1 .act-choice-tag to contain '분기 0/2', got '{act1_tag_before}'"
        )
        choice_tags.first.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "headmaster_episode_list")

        # 4) Click 스토리 button on Act 1 card -> wait for .modal-backdrop .story-vn-modal
        story_btns = pg.locator(".list-card button", has_text="스토리")
        assert story_btns.count() >= 2, (
            f"Expected at least 2 '스토리' buttons in episode list, got {story_btns.count()}"
        )
        story_btns.nth(0).click()
        modal = pg.locator(".modal-backdrop .story-vn-modal")
        modal.wait_for(state="visible", timeout=6000)

        # 5) Assert EXACTLY 1 button.btn-gold inside .story-vn-modal (regression_p0_11.py compatibility)
        gold_btn_count = modal.locator("button.btn-gold").count()
        assert gold_btn_count == 1, (
            f"Expected EXACTLY 1 button.btn-gold inside .story-vn-modal, got {gold_btn_count}"
        )

        # 6) Click 중반 button inside .story-phase-tabs
        phase_tabs = modal.locator(".story-phase-tabs")
        phase_tabs.wait_for(state="visible", timeout=4000)
        phase_tabs.locator("button", has_text="중반").first.click()
        pg.wait_for_timeout(150)

        # 7) Verify .story-choice-box and 2 .story-choice-btn buttons are visible, 0 overflow, screenshot
        choice_box = modal.locator(".story-choice-box").first
        choice_box.wait_for(state="visible", timeout=4000)
        mid_choice_btns = choice_box.locator(".story-choice-btn")
        mid_choice_count = mid_choice_btns.count()
        assert mid_choice_count == 2, (
            f"Expected 2 .story-choice-btn buttons in Act 1 mid phase, got {mid_choice_count}"
        )
        assert mid_choice_btns.nth(0).is_visible() and mid_choice_btns.nth(1).is_visible(), (
            "Expected both .story-choice-btn buttons in Act 1 mid phase to be visible"
        )
        choice_box.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "act1_mid_story_choice")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_2_01_story_choice.png"))

        # 8) Record stones, click first .story-choice-btn, wait 250ms, verify selection & reaction
        stones_before = parse_stones(pg)
        mid_choice_label = mid_choice_btns.nth(0).inner_text().strip()
        mid_choice_btns.nth(0).click()
        pg.wait_for_timeout(250)

        selected_count_mid = choice_box.locator(".story-choice-btn.is-selected").count()
        assert selected_count_mid == 1, (
            f"Expected .story-choice-btn.is-selected count == 1 after clicking choice, got {selected_count_mid}"
        )
        mid_reaction = modal.locator(".story-reaction-wrap").first
        mid_reaction.wait_for(state="visible", timeout=4000)
        mid_reaction_text = mid_reaction.inner_text().strip()
        assert len(mid_reaction_text) > 0, (
            "Expected non-empty reaction dialogue text in .story-reaction-wrap"
        )
        stones_after_mid = parse_stones(pg)
        assert stones_after_mid >= stones_before, (
            f"Expected stones_after >= stones_before after mid choice: {stones_before} -> {stones_after_mid}"
        )

        # 9) Click 후일담 button inside .story-phase-tabs
        phase_tabs.locator("button", has_text="후일담").first.click()
        pg.wait_for_timeout(150)

        # 10) Verify .act-epilogue-memo & 2 .story-choice-btn, click first, verify reaction, 0 overflow, screenshot
        epilogue_memo = modal.locator(".act-epilogue-memo").first
        epilogue_memo.wait_for(state="visible", timeout=4000)
        epilogue_memo_text = epilogue_memo.inner_text().strip()
        assert "아스트라 학사 공보" in epilogue_memo_text or "사후 기록" in epilogue_memo_text, (
            f"Expected .act-epilogue-memo to contain '아스트라 학사 공보' or '사후 기록', got '{epilogue_memo_text}'"
        )

        clear_choice_box = modal.locator(".story-choice-box").first
        clear_choice_box.wait_for(state="visible", timeout=4000)
        clear_choice_btns = clear_choice_box.locator(".story-choice-btn")
        clear_choice_count = clear_choice_btns.count()
        assert clear_choice_count == 2, (
            f"Expected 2 .story-choice-btn buttons in Act 1 clear phase, got {clear_choice_count}"
        )
        clear_choice_label = clear_choice_btns.nth(0).inner_text().strip()
        clear_choice_btns.nth(0).click()
        pg.wait_for_timeout(250)

        clear_reaction = modal.locator(".story-reaction-wrap").first
        clear_reaction.wait_for(state="visible", timeout=4000)
        clear_reaction_text = clear_reaction.inner_text().strip()
        assert len(clear_reaction_text) > 0, (
            "Expected non-empty reaction dialogue text in Act 1 clear .story-reaction-wrap"
        )
        stones_after_clear = parse_stones(pg)
        assert stones_after_clear >= stones_after_mid, (
            f"Expected stones after clear choice >= stones after mid: {stones_after_mid} -> {stones_after_clear}"
        )
        epilogue_memo.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "act1_clear_epilogue")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_2_02_story_epilogue.png"))

        # 11) Close StoryModal via button.btn-gold -> wait 200ms -> verify .act-choice-tag now contains '분기 2/2'
        assert modal.locator("button.btn-gold").count() == 1, (
            "Expected exactly 1 button.btn-gold before closing Act 1 modal"
        )
        modal.locator("button.btn-gold").first.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".modal-backdrop .story-vn-modal").count() == 0, (
            "Expected .story-vn-modal to close cleanly after clicking button.btn-gold"
        )

        act1_tag_after = choice_tags.first.inner_text().strip()
        assert "분기 2/2" in act1_tag_after, (
            f"Expected Act 1 .act-choice-tag to update to '분기 2/2', got '{act1_tag_after}'"
        )

        # 12) Open Act 2 story (2nd 스토리 button) & find thunder mentor ('볼타') variant line
        story_btns.nth(1).click()
        modal = pg.locator(".modal-backdrop .story-vn-modal")
        modal.wait_for(state="visible", timeout=6000)
        assert modal.locator("button.btn-gold").count() == 1, (
            "Expected exactly 1 button.btn-gold inside Act 2 .story-vn-modal"
        )

        act2_phase_tabs = modal.locator(".story-phase-tabs")
        act2_phase_tabs.wait_for(state="visible", timeout=4000)

        volta_phase = None
        volta_line_text = None
        for phase_label in ("도입", "중반", "보스", "후일담"):
            act2_phase_tabs.locator("button", has_text=phase_label).first.click()
            pg.wait_for_timeout(150)
            dialogue_rows = modal.locator(".dialogue-vn")
            for i in range(dialogue_rows.count()):
                row = dialogue_rows.nth(i)
                row_txt = row.inner_text().strip()
                if "볼타" in row_txt:
                    volta_phase = phase_label
                    volta_line_text = row_txt
                    row.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
                    pg.wait_for_timeout(100)
                    break
            if volta_phase:
                break

        assert volta_phase is not None and volta_line_text is not None, (
            "Expected to find thunder school mentor ('볼타') variant line across Act 2 phases (도입/중반/보스/후일담)"
        )
        assert_no_overflow(pg, "act2_school_variant_line")
        pg.screenshot(path=os.path.join(OUT_DIR, "p5_2_03_act2_school_line.png"))

        modal.locator("button.btn-gold").first.click()
        pg.wait_for_timeout(200)
        assert pg.locator(".modal-backdrop .story-vn-modal").count() == 0, (
            "Expected Act 2 .story-vn-modal to close cleanly"
        )
        assert_no_overflow(pg, "after_act2_modal_close")

        return {
            "act1_choice_tag_before": act1_tag_before,
            "act1_choice_tag_after": act1_tag_after,
            "story_modal_gold_btn_count": gold_btn_count,
            "mid_choice_count": mid_choice_count,
            "mid_choice_clicked": mid_choice_label,
            "mid_reaction_preview": mid_reaction_text[:80],
            "stones_before": stones_before,
            "stones_after_mid": stones_after_mid,
            "stones_after_clear": stones_after_clear,
            "epilogue_memo_preview": epilogue_memo_text[:80],
            "clear_choice_count": clear_choice_count,
            "clear_choice_clicked": clear_choice_label,
            "clear_reaction_preview": clear_reaction_text[:80],
            "act2_volta_phase": volta_phase,
            "act2_volta_line_preview": volta_line_text[:100],
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p5_2_story_branch(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p5_2_story_branch": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
