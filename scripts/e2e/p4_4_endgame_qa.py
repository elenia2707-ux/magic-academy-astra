"""P4-4 Endgame Infinite Tower Depth & Gear Set Effects / Reforging E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P4-4:
1. Initial Load:
   * `.top-header` & `.bottom-nav` render cleanly with 0 pageerrors/console errors and 0 horizontal overflow
2. Deck·Gear Tab -> 마도구 subtab (`덱·장비` -> `마도구`):
   * `.gear-set-panel` & `.gear-set-workshop` are visible with 0 horizontal overflow
   * Inscribing `폭풍 첨탑` (`storm_spire`) on `지팡이` (default slot) and `로브` (via `.gear-set-slot-tabs`)
   * `.gear-set-active-list` shows `2세트 활성` (or `2/4`) and at least 2 `.gear-set-tag` badges exist on equipped gear
   * Clean screenshot `p4_4_01_gear_sets.png`
3. Abyss Tab -> 무한 탑 subtab (`심연` -> `무한 탑`):
   * `.tower-depth-card` shows `제1심층`, `.tower-jump-btn` shows `11층`, and at least 3 `.tower-milestone-card.is-claimable` (5F, 10F, 15F) are visible with 0 horizontal overflow
   * Clicking `.tower-jump-btn` updates `.tower-depth-card` to `제2심층`
   * Claiming the first 2 claimable milestones (`5층` & `10층`) results in `.tower-milestone-card.is-claimed` count >= 2
   * Clean screenshot `p4_4_02_tower_depth.png`
4. Tower Battle (`11층 도전`):
   * Clicking `button:has-text('무한 심연 탑')` containing `11층 도전` opens Battle tab with `.stage-label` containing `무한 심연 탑 · 11층` and 0 horizontal overflow
   * Clean screenshot `p4_4_03_tower_battle.png`
"""
import json
import os
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
        level=55,
        rank=3,
        clearedActs=[1, 2, 3, 4, 5, 6],
        highestAct=6,
        highestStageInAct=4,
        stones=25000,
        arcaneDust=600,
        towerFloor=1,
        highestTowerFloor=15,
        claimedTowerMilestones=[],
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


def test_p4_4_endgame(browser: Browser, errs: list[str]) -> dict:
    """Verify P4-4 Gear Set inscription/activation and Infinite Tower depth/milestones/challenge."""
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p4_4_endgame", errs)
    try:
        # 1) Initial load overflow check
        assert_no_overflow(pg, "battle_initial")

        # 2) Click bottom nav 덱·장비 (.bottom-nav button index 2) -> click 마도구 subtab
        pg.locator(".bottom-nav button").nth(2).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn", has_text="마도구").first.click()

        # 3) Verify .gear-set-panel & .gear-set-workshop are visible with 0 overflow
        gear_set_panel = pg.locator(".gear-set-panel")
        gear_set_panel.wait_for(state="visible", timeout=6000)
        gear_set_workshop = pg.locator(".gear-set-workshop")
        gear_set_workshop.wait_for(state="visible", timeout=6000)
        assert gear_set_panel.is_visible(), "Expected .gear-set-panel to be visible"
        assert gear_set_workshop.is_visible(), "Expected .gear-set-workshop to be visible"
        assert_no_overflow(pg, "gear_set_initial")

        # 4) Inscribe 폭풍 첨탑 on 지팡이 (default slot)
        storm_card_staff = pg.locator(".gear-set-option-card", has_text="폭풍 첨탑").first
        storm_card_staff.wait_for(state="visible", timeout=6000)
        inscribe_staff_btn = storm_card_staff.locator("button", has_text="각인").first
        assert inscribe_staff_btn.is_visible(), (
            "Expected '각인' button inside .gear-set-option-card for 폭풍 첨탑 (지팡이)"
        )
        inscribe_staff_btn.click()
        pg.wait_for_timeout(200)

        # 5) Switch .gear-set-slot-tabs to 로브, then inscribe 폭풍 첨탑
        robe_slot_tab = pg.locator(".gear-set-slot-tabs button", has_text="로브").first
        robe_slot_tab.wait_for(state="visible", timeout=6000)
        robe_slot_tab.click()
        pg.wait_for_timeout(100)

        storm_card_robe = pg.locator(".gear-set-option-card", has_text="폭풍 첨탑").first
        storm_card_robe.wait_for(state="visible", timeout=6000)
        inscribe_robe_btn = storm_card_robe.locator("button", has_text="각인").first
        assert inscribe_robe_btn.is_visible(), (
            "Expected '각인' button inside .gear-set-option-card for 폭풍 첨탑 (로브)"
        )
        inscribe_robe_btn.click()
        pg.wait_for_timeout(250)

        # 6) Verify .gear-set-active-list shows 2세트 활성 (or 2/4) and >= 2 .gear-set-tag badges
        active_list = pg.locator(".gear-set-active-list")
        active_list.wait_for(state="visible", timeout=6000)
        active_list_text = active_list.inner_text().strip()
        assert "2세트 활성" in active_list_text or "2/4" in active_list_text, (
            f"Expected '2세트 활성' or '2/4' in .gear-set-active-list, got '{active_list_text}'"
        )

        gear_set_tags = pg.locator(".gear-set-tag")
        gear_set_tag_count = gear_set_tags.count()
        assert gear_set_tag_count >= 2, (
            f"Expected at least 2 .gear-set-tag badges on equipped gear, got {gear_set_tag_count}"
        )

        gear_set_panel.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "gear_sets_inscribed")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_4_01_gear_sets.png"))

        # 7) Click bottom nav 심연 (.bottom-nav button index 4) -> click 무한 탑 subtab
        pg.locator(".bottom-nav button").nth(4).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn", has_text="무한 탑").first.click()

        # 8) Verify .tower-depth-card shows 제1심층, .tower-jump-btn visible (11층), >= 3 claimable milestones
        depth_card = pg.locator(".tower-depth-card")
        depth_card.wait_for(state="visible", timeout=6000)
        depth_before_text = depth_card.inner_text().strip()
        assert "제1심층" in depth_before_text, (
            f"Expected '제1심층' in .tower-depth-card initially, got '{depth_before_text}'"
        )

        jump_btn = pg.locator(".tower-jump-btn").first
        jump_btn.wait_for(state="visible", timeout=6000)
        assert jump_btn.is_visible(), "Expected .tower-jump-btn to be visible"
        jump_btn_text = jump_btn.inner_text().strip()
        assert "11층" in jump_btn_text, (
            f"Expected '11층' in .tower-jump-btn, got '{jump_btn_text}'"
        )

        claimable_cards = pg.locator(".tower-milestone-card.is-claimable")
        claimable_count_before = claimable_cards.count()
        assert claimable_count_before >= 3, (
            f"Expected at least 3 .tower-milestone-card.is-claimable (5F, 10F, 15F), got {claimable_count_before}"
        )
        for i in range(3):
            assert claimable_cards.nth(i).is_visible(), (
                f"Expected .tower-milestone-card.is-claimable index {i} to be visible"
            )
        assert_no_overflow(pg, "tower_depth_initial")

        # 9) Click .tower-jump-btn -> wait 250ms -> verify .tower-depth-card updates to 제2심층
        jump_btn.click()
        pg.wait_for_timeout(250)
        depth_after_text = depth_card.inner_text().strip()
        assert "제2심층" in depth_after_text, (
            f"Expected .tower-depth-card to update to '제2심층', got '{depth_after_text}'"
        )

        # 10) Claim first 2 claimable milestones (5층 & 10층) -> verify .tower-milestone-card.is-claimed >= 2
        for idx in range(2):
            card = pg.locator(".tower-milestone-card.is-claimable").first
            card.wait_for(state="visible", timeout=4000)
            claim_btn = card.locator("button", has_text="수령").first
            assert claim_btn.is_visible(), (
                f"Expected '수령' button in claimable milestone card #{idx + 1}"
            )
            claim_btn.click()
            pg.wait_for_timeout(250)

        claimed_count = pg.locator(".tower-milestone-card.is-claimed").count()
        assert claimed_count >= 2, (
            f"Expected .tower-milestone-card.is-claimed count >= 2, got {claimed_count}"
        )

        depth_card.evaluate("el => el.scrollIntoView({block: 'center', behavior: 'instant'})")
        pg.wait_for_timeout(100)
        assert_no_overflow(pg, "tower_depth_claimed")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_4_02_tower_depth.png"))

        # 11) Click Tower challenge button (무한 심연 탑 ... 11층 도전) -> wait 400ms -> verify Battle tab .stage-label
        challenge_btn = pg.locator("button:has-text('무한 심연 탑')").first
        challenge_btn.wait_for(state="visible", timeout=6000)
        challenge_btn_text = challenge_btn.inner_text().strip()
        assert "11층 도전" in challenge_btn_text, (
            f"Expected '11층 도전' in Tower challenge button, got '{challenge_btn_text}'"
        )
        challenge_btn.click()
        pg.wait_for_timeout(400)

        stage_label = pg.locator(".stage-label").first
        stage_label.wait_for(state="visible", timeout=6000)
        stage_label_text = stage_label.inner_text().strip()
        assert "무한 심연 탑 · 11층" in stage_label_text, (
            f"Expected '.stage-label' to contain '무한 심연 탑 · 11층', got '{stage_label_text}'"
        )
        assert_no_overflow(pg, "tower_battle_11f")
        pg.screenshot(path=os.path.join(OUT_DIR, "p4_4_03_tower_battle.png"))

        return {
            "gear_set_active_text": active_list_text,
            "gear_set_tag_count": gear_set_tag_count,
            "tower_depth_before": depth_before_text,
            "tower_jump_btn": jump_btn_text,
            "tower_depth_after": depth_after_text,
            "claimable_milestones_before": claimable_count_before,
            "claimed_milestones_after": claimed_count,
            "tower_challenge_btn": challenge_btn_text,
            "battle_stage_label": stage_label_text,
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p4_4_endgame(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Runtime errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p4_4_endgame": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
