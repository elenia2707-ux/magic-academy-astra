"""P3 Round-2 Swarm QA E2E Suite (P3-3 Boss Gimmicks & Grimoire Seals + P3-4 Rebirth Cycle Vows).

Target server: http://localhost:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified by this suite:
- P3-3 Boss Gimmick & Grimoire Seal Counterplay:
  * .boss-gimmick-bar (uncountered on Act 2 Boss '크노스', .is-countered once countered)
  * .gimmick-counter-cta ('인장 대응 ›' button jumping to Deck/Gear -> gear subtab)
  * .grimoire-seal-panel (inside DeckGearTab gear subtab)
  * .loaner-grimoire-btn (equips starter loaner grimoire when none is equipped)
  * Act 2 counter seal button ('정화의 서표' / seal_ward)
  * .gimmick-status-badge.is-ok ('✦ 인장 파훼 중')
- P3-4 Rebirth Cycle Vow (성좌 서약):
  * .rebirth-vow-summary & .rebirth-vow-preview-list (in AbyssTab -> 시간 회귀)
  * .rebirth-vow-panel & 4x .vow-choice-card (on CharacterCreation during rebirth)
  * #player-name-input & #start-academy-btn
  * .arena-banner .active-vow-pill ('핏빛 달의 맹약')
"""
import json
import os
import time
from playwright.sync_api import Browser, Page, sync_playwright

OUT_DIR = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT_DIR, exist_ok=True)
SAVE_PATH = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
URL = os.environ.get("ASTRA_E2E_URL", "http://localhost:4190/")
STORAGE_KEY = "magic_academy_astra_save_v1"

ALL_STORIES = [f"{a}_{k}" for a in range(1, 7) for k in ("intro", "mid", "boss", "clear", "after")]


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
    page.on("dialog", lambda d: d.accept())
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


def test_p3_3_boss_gimmick_and_grimoire_seal(browser: Browser, errs: list[str]) -> dict:
    """1) P3-3 Boss Gimmick & Grimoire Seal Counterplay on Act 2 Boss ('망령 대사서 크노스')."""
    blob = build_save(
        school="flame",
        level=20,
        rank=2,
        stones=12000,
        selectedAct=2,
        selectedStage=4,
        highestAct=3,
        highestStageInAct=0,
        clearedActs=[1, 2],
        grimoireSeal=None,
        inventory=[],
        equipped={
            "staff": {
                "uid": "eq_r2_staff",
                "name": "홍련의 룬 지팡이",
                "slot": "staff",
                "rarity": "rare",
                "tier": 2,
                "enhance": 2,
                "stats": {
                    "magic": 48,
                    "maxHp": 0,
                    "maxMp": 20,
                    "def": 0,
                    "critRate": 5,
                    "critDmg": 15,
                    "mpRegen": 2,
                },
            },
            "robe": {
                "uid": "eq_r2_robe",
                "name": "서고 수호자의 예복",
                "slot": "robe",
                "rarity": "rare",
                "tier": 2,
                "enhance": 2,
                "stats": {
                    "magic": 12,
                    "maxHp": 260,
                    "maxMp": 20,
                    "def": 28,
                    "critRate": 0,
                    "critDmg": 0,
                    "mpRegen": 1,
                },
            },
            "grimoire": None,
            "relic": None,
        },
        skills={
            "flame_1": {"id": "flame_1", "level": 8, "exp": 0, "unlocked": True},
            "flame_2": {"id": "flame_2", "level": 8, "exp": 0, "unlocked": True},
            "ward_1": {"id": "ward_1", "level": 6, "exp": 0, "unlocked": True},
        },
        deck=["flame_2", "flame_1", "ward_1"],
        trainingSlots=["ward_1"],
    )
    ctx, pg = open_seeded_page(browser, blob, "p3_3_gimmick", errs)
    try:
        pg.wait_for_selector(".arena-card", timeout=8000)

        enemy_name = pg.locator(".enemy-card .combatant-name").inner_text().strip()
        assert "크노스" in enemy_name, f"Expected Act 2 Boss '크노스', got '{enemy_name}'"

        gimmick_bar = pg.locator(".boss-gimmick-bar")
        assert gimmick_bar.count() == 1 and gimmick_bar.is_visible(), (
            "Expected .boss-gimmick-bar on Act 2 Boss"
        )
        bar_cls_before = gimmick_bar.get_attribute("class") or ""
        assert "is-countered" not in bar_cls_before, (
            f"Expected uncountered .boss-gimmick-bar initially, got class='{bar_cls_before}'"
        )
        gimmick_text_before = gimmick_bar.inner_text().strip()
        assert "보스 기믹" in gimmick_text_before, (
            f"Expected boss gimmick label in .boss-gimmick-bar, got '{gimmick_text_before}'"
        )

        cta_btn = gimmick_bar.locator(".gimmick-counter-cta")
        assert cta_btn.count() == 1 and cta_btn.is_visible(), (
            "Expected visible .gimmick-counter-cta ('인장 대응 ›') when uncountered"
        )
        assert "인장 대응" in cta_btn.inner_text(), (
            f"Unexpected .gimmick-counter-cta text: '{cta_btn.inner_text()}'"
        )

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_r2_01_boss_gimmick_uncountered.png"))
        assert_no_overflow(pg, "battle_boss_gimmick_uncountered")

        # Click .gimmick-counter-cta -> jumps to Deck/Gear tab (gear subtab) showing .grimoire-seal-panel
        cta_btn.click()
        pg.wait_for_selector(".grimoire-seal-panel", timeout=6000)
        assert_no_overflow(pg, "deck_gear_grimoire_seal_before")

        # Click .loaner-grimoire-btn to equip starter loaner grimoire
        loaner_btn = pg.locator(".loaner-grimoire-btn")
        assert loaner_btn.count() >= 1 and loaner_btn.first.is_visible(), (
            "Expected .loaner-grimoire-btn when equipped.grimoire is null"
        )
        loaner_btn.first.click()
        pg.wait_for_timeout(250)

        # Select Act 2 counter seal ('정화의 서표' / seal_ward)
        seal_panel = pg.locator(".grimoire-seal-panel")
        ward_seal_btn = seal_panel.locator("button:has-text('정화의 서표')").first
        assert ward_seal_btn.is_visible(), "Expected '정화의 서표' (seal_ward) button in .grimoire-seal-panel"
        ward_seal_btn.click()
        pg.wait_for_timeout(250)

        saved_mid = json.loads(pg.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        assert saved_mid.get("equipped", {}).get("grimoire") is not None, (
            "Expected equipped.grimoire to be populated after clicking .loaner-grimoire-btn"
        )
        assert saved_mid.get("grimoireSeal") == "seal_ward", (
            f"Expected grimoireSeal=='seal_ward', got {saved_mid.get('grimoireSeal')}"
        )

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_r2_02_grimoire_seal_panel.png"))
        assert_no_overflow(pg, "deck_gear_grimoire_seal_after")

        # Return to Battle tab -> verify .boss-gimmick-bar.is-countered ('✦ 인장 파훼 중')
        pg.locator(".bottom-nav button").nth(0).click()
        pg.wait_for_selector(".boss-gimmick-bar.is-countered", timeout=6000)

        ok_badge = pg.locator(".boss-gimmick-bar.is-countered .gimmick-status-badge.is-ok")
        assert ok_badge.count() == 1 and ok_badge.is_visible(), (
            "Expected .gimmick-status-badge.is-ok when gimmick is countered"
        )
        badge_text = ok_badge.inner_text().strip()
        assert "인장 파훼 중" in badge_text, f"Unexpected countered badge text: '{badge_text}'"

        # Speed up combat and verify turns execute cleanly with 0 errors
        pg.locator("button[title='전투 배속']").click()
        pg.wait_for_timeout(1800)
        log_count = pg.locator(".combat-log-box .log-line").count()
        assert log_count >= 2, f"Expected combat logs to progress, got {log_count}"

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_r2_03_boss_gimmick_countered.png"))
        assert_no_overflow(pg, "battle_boss_gimmick_countered")

        return {
            "boss_name": enemy_name,
            "loaner_grimoire": saved_mid["equipped"]["grimoire"]["name"],
            "active_seal": saved_mid["grimoireSeal"],
            "countered_badge": badge_text,
            "combat_log_lines": log_count,
        }
    finally:
        ctx.close()


def test_p3_4_rebirth_cycle_vow(browser: Browser, errs: list[str]) -> dict:
    """2) P3-4 Rebirth Cycle Vow: Abyss summary -> rebirth flow -> vow selection -> active vow pill in battle."""
    blob = build_save(
        school="thunder",
        level=60,
        rank=5,
        stones=90000,
        selectedAct=6,
        selectedStage=3,
        highestAct=6,
        highestStageInAct=4,
        clearedActs=[1, 2, 3, 4, 5, 6],
        towerFloor=6,
        highestTowerFloor=5,
        skills={
            "thunder_1": {"id": "thunder_1", "level": 10, "exp": 0, "unlocked": True},
            "thunder_2": {"id": "thunder_2", "level": 10, "exp": 0, "unlocked": True},
            "ward_1": {"id": "ward_1", "level": 10, "exp": 0, "unlocked": True},
        },
        deck=["thunder_2", "thunder_1", "ward_1"],
        trainingSlots=["ward_1"],
    )
    ctx, pg = open_seeded_page(browser, blob, "p3_4_rebirth_vow", errs)
    try:
        # Go to Abyss -> 시간 회귀
        pg.locator(".bottom-nav button").nth(4).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn:has-text('시간 회귀')").click()
        pg.wait_for_selector(".rebirth-vow-summary", timeout=6000)

        vow_summary = pg.locator(".rebirth-vow-summary")
        summary_text = vow_summary.inner_text().strip()
        assert "현재 회차 서약" in summary_text and "평온한 회귀" in summary_text, (
            f"Expected default vow '평온한 회귀' in .rebirth-vow-summary, got '{summary_text}'"
        )

        preview_list = pg.locator(".rebirth-vow-preview-list")
        assert preview_list.count() == 1 and preview_list.is_visible(), (
            "Expected .rebirth-vow-preview-list in Abyss -> 시간 회귀"
        )
        preview_text = preview_list.inner_text()
        for expected_snippet in ("핏빛 달의 맹약", "+30% 잔재", "+40% 잔재", "+35% 잔재"):
            assert expected_snippet in preview_text, (
                f"Expected '{expected_snippet}' inside .rebirth-vow-preview-list, got '{preview_text}'"
            )

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_r2_04_rebirth_vow_summary.png"))
        assert_no_overflow(pg, "abyss_rebirth_vow_summary")

        # Click 시간 회귀 실행 (dialog auto-accepted if triggered)
        pg.locator("button:has-text('시간 회귀 실행')").first.click()
        pg.wait_for_selector(".rebirth-vow-panel", timeout=8000)

        vow_cards = pg.locator(".rebirth-vow-panel .vow-choice-card")
        assert vow_cards.count() == 4, (
            f"Expected 4 .vow-choice-card options in .rebirth-vow-panel, got {vow_cards.count()}"
        )

        # Select crimson_moon ('핏빛 달의 맹약')
        crimson_card = pg.locator(".vow-choice-card:has-text('핏빛 달의 맹약')").first
        crimson_card.scroll_into_view_if_needed()
        crimson_card.click()
        pg.wait_for_timeout(200)
        crimson_cls = crimson_card.get_attribute("class") or ""
        assert "selected" in crimson_cls or crimson_card.get_attribute("aria-pressed") == "true", (
            f"Expected crimson_moon .vow-choice-card to be selected, class='{crimson_cls}'"
        )

        name_input = pg.locator("#player-name-input")
        name_input.fill("혈월회귀자")

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_r2_05_creation_vow_choice.png"))
        assert_no_overflow(pg, "character_creation_rebirth_vow")

        # Enroll into NG+ cycle
        start_btn = pg.locator("#start-academy-btn")
        start_btn.scroll_into_view_if_needed()
        start_btn.click()

        # Dismiss Act 1 intro StoryModal
        pg.wait_for_timeout(400)
        for label in ("임무 출격", "계속 진행", "닫기"):
            modal_btn = pg.locator(f".story-vn-modal button:has-text('{label}')")
            if modal_btn.count() > 0 and modal_btn.first.is_visible():
                modal_btn.first.click()
                pg.wait_for_timeout(300)
                break

        pg.wait_for_selector(".arena-banner", timeout=8000)

        saved_after = json.loads(pg.evaluate(f"localStorage.getItem('{STORAGE_KEY}')"))
        active_vow = saved_after.get("prestige", {}).get("activeVow")
        rebirth_count = saved_after.get("prestige", {}).get("rebirthCount")
        assert rebirth_count == 1, f"Expected prestige.rebirthCount == 1, got {rebirth_count}"
        assert active_vow == "crimson_moon", (
            f"Expected prestige.activeVow == 'crimson_moon', got '{active_vow}'"
        )

        vow_pill = pg.locator(".arena-banner .active-vow-pill")
        assert vow_pill.count() == 1 and vow_pill.is_visible(), (
            "Expected .active-vow-pill inside .arena-banner after rebirth with crimson_moon"
        )
        vow_pill_text = vow_pill.inner_text().strip()
        assert "핏빛 달의 맹약" in vow_pill_text, (
            f"Expected '핏빛 달의 맹약' in .active-vow-pill, got '{vow_pill_text}'"
        )

        pg.screenshot(path=os.path.join(OUT_DIR, "p3_r2_06_battle_active_vow.png"))
        assert_no_overflow(pg, "battle_active_vow")

        # Verify Abyss -> 시간 회귀 now highlights +30% remnant bonus
        pg.locator(".bottom-nav button").nth(4).click()
        pg.wait_for_selector(".subtab-btn", timeout=6000)
        pg.locator(".subtab-btn:has-text('시간 회귀')").click()
        pg.wait_for_selector(".rebirth-vow-summary", timeout=6000)
        post_summary = pg.locator(".rebirth-vow-summary").inner_text().strip()
        assert "핏빛 달의 맹약" in post_summary and "+30%" in post_summary, (
            f"Expected active vow +30% bonus in .rebirth-vow-summary, got '{post_summary}'"
        )
        assert_no_overflow(pg, "abyss_rebirth_active_vow_summary")

        return {
            "rebirth_count": rebirth_count,
            "active_vow": active_vow,
            "vow_pill_text": vow_pill_text,
            "player_name": saved_after.get("playerName"),
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            r_gimmick = test_p3_3_boss_gimmick_and_grimoire_seal(browser, errs)
            r_vow = test_p3_4_rebirth_cycle_vow(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Page errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p3_3_boss_gimmick": r_gimmick,
                "p3_4_rebirth_vow": r_vow,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
