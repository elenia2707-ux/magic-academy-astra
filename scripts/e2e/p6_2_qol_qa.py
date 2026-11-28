"""P6-2 Game System QoL (Skill Deck 3 Presets, Gear Delta Compare/Sort, Battle Telemetry, Frontier Jump) E2E QA Suite.

Target server: http://127.0.0.1:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector & behavior contract verified for P6-2:
1. Initial page load (`.top-header`, `.bottom-nav`), `pageerror` & `console` error capture,
   and 0 horizontal overflow (`scrollWidth <= innerWidth + 1`).
2. Battle Tab (`전투`):
   - `.battle-preset-row .battle-preset-btn` has 3 buttons (`1 사냥`, `2 보스`, `3 심연`),
     `.battle-telemetry-strip` is visible, and `.frontier-jump-btn` (`최고 사냥터`) is visible with 0 overflow.
   - Click `2 보스` preset button -> wait 200ms -> `.battle-preset-btn.is-active` contains `보스`.
   - Click `.frontier-jump-btn` -> wait 300ms -> `.stage-label` contains `3-4`.
   - Wait 1500ms for turns/telemetry, assert 0 overflow, screenshot `scripts/e2e/out/p6_2_01_battle_qol.png`.
3. Deck & Gear Tab (`덱·장비`, index 2) -> `스킬 덱`:
   - `.deck-preset-bar` has 3 `.deck-preset-btn` buttons and `보스 추천` button.
   - Click `보스 추천` -> wait 250ms -> deck list contains a defensive/heal skill (`실디의 방패` or `빛의 손길`),
     assert 0 overflow, screenshot `scripts/e2e/out/p6_2_02_deck_presets.png`.
4. `마도구` subtab:
   - `.inv-sort-pills .inv-sort-btn` has 3 sort modes (`점수순`, `희귀도`, `부위`).
   - `.gear-delta-row .gear-delta-chip` renders on inventory items (`count >= 3`, including `.is-up`),
     click `희귀도` sort pill -> wait 200ms -> active pill changes and 0 overflow,
     screenshot `scripts/e2e/out/p6_2_03_gear_compare.png`.
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

    skills: dict[str, dict] = {}
    for i in range(1, 5):
        sid = f"thunder_{i}"
        skills[sid] = {"id": sid, "level": 6, "exp": 0, "unlocked": True}
    for i in range(1, 3):
        sid = f"ward_{i}"
        skills[sid] = {"id": sid, "level": 5, "exp": 0, "unlocked": True}
    for i in range(1, 3):
        sid = f"holy_{i}"
        skills[sid] = {"id": sid, "level": 5, "exp": 0, "unlocked": True}

    equipped = {
        "staff": {
            "uid": "eq_p62_equipped_staff",
            "name": "수련생의 번개 지팡이",
            "slot": "staff",
            "rarity": "rare",
            "tier": 2,
            "enhance": 1,
            "stats": {
                "magic": 24,
                "maxHp": 95,
                "maxMp": 20,
                "def": 6,
                "critRate": 3,
                "critDmg": 10,
                "mpRegen": 1,
            },
        },
        "robe": {
            "uid": "eq_p62_equipped_robe",
            "name": "견습 마법사의 비단 로브",
            "slot": "robe",
            "rarity": "rare",
            "tier": 2,
            "enhance": 0,
            "stats": {
                "magic": 8,
                "maxHp": 120,
                "maxMp": 15,
                "def": 14,
                "critRate": 0,
                "critDmg": 0,
                "mpRegen": 1,
            },
        },
        "grimoire": {
            "uid": "eq_p62_equipped_grimoire",
            "name": "고딕 양피지 마도서",
            "slot": "grimoire",
            "rarity": "rare",
            "tier": 2,
            "enhance": 0,
            "stats": {
                "magic": 18,
                "maxHp": 30,
                "maxMp": 40,
                "def": 4,
                "critRate": 2,
                "critDmg": 5,
                "mpRegen": 3,
            },
        },
        "relic": {
            "uid": "eq_p62_equipped_relic",
            "name": "청동 성좌의 부적",
            "slot": "relic",
            "rarity": "common",
            "tier": 1,
            "enhance": 0,
            "stats": {
                "magic": 9,
                "maxHp": 45,
                "maxMp": 0,
                "def": 4,
                "critRate": 2,
                "critDmg": 0,
                "mpRegen": 0,
            },
        },
    }

    inventory = [
        {
            "uid": "eq_p62_inv_staff_epic",
            "name": "폭풍 첨탑의 흑요석 지팡이",
            "slot": "staff",
            "rarity": "epic",
            "tier": 3,
            "enhance": 2,
            "stats": {
                "magic": 56,
                "maxHp": 35,
                "maxMp": 30,
                "def": 2,
                "critRate": 8,
                "critDmg": 22,
                "mpRegen": 2,
                "elementBonus": {"category": "thunder", "pct": 20},
            },
        },
        {
            "uid": "eq_p62_inv_robe_ancient",
            "name": "고대 성좌의 칠흑 예복",
            "slot": "robe",
            "rarity": "ancient",
            "tier": 3,
            "enhance": 3,
            "stats": {
                "magic": 18,
                "maxHp": 290,
                "maxMp": 40,
                "def": 38,
                "critRate": 2,
                "critDmg": 0,
                "mpRegen": 3,
            },
        },
        {
            "uid": "eq_p62_inv_relic_rare",
            "name": "심야 수정의 벼락 인장",
            "slot": "relic",
            "rarity": "rare",
            "tier": 2,
            "enhance": 1,
            "stats": {
                "magic": 22,
                "maxHp": 95,
                "maxMp": 15,
                "def": 9,
                "critRate": 6,
                "critDmg": 12,
                "mpRegen": 1,
            },
        },
    ]

    s.update(
        lastSavedAt=now_ms,
        school="thunder",
        level=22,
        rank=2,
        clearedActs=[1, 2],
        highestAct=3,
        highestStageInAct=3,
        selectedAct=1,
        selectedStage=0,
        viewedStoryKeys=ALL_STORIES,
        viewedStoryActs=[1, 2, 3, 4, 5, 6],
        skills=skills,
        deck=["thunder_1", "thunder_2", "thunder_3", "thunder_4"],
        equipped=equipped,
        inventory=inventory,
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


def test_p6_2_qol(browser: Browser, errs: list[str]) -> dict:
    blob = build_save()
    ctx, pg = open_seeded_page(browser, blob, "p6_2_qol", errs)
    try:
        assert_no_overflow(pg, "initial_load")

        # 2) Battle tab: 3 presets, telemetry strip, frontier jump button
        pg.wait_for_selector(".battle-preset-row .battle-preset-btn", timeout=6000)
        preset_btns = pg.locator(".battle-preset-row .battle-preset-btn")
        preset_count = preset_btns.count()
        assert preset_count == 3, f"Expected 3 .battle-preset-btn, got {preset_count}"

        preset_texts = [preset_btns.nth(i).inner_text().strip() for i in range(preset_count)]
        for expected_kw in ("1 사냥", "2 보스", "3 심연"):
            assert any(expected_kw in txt for txt in preset_texts), (
                f"Expected battle preset '{expected_kw}' in {preset_texts}"
            )

        telemetry = pg.locator(".battle-telemetry-strip").first
        assert telemetry.count() == 1 and telemetry.is_visible(), (
            "Expected .battle-telemetry-strip to be visible on battle tab"
        )

        frontier_btn = pg.locator(".frontier-jump-btn").first
        assert frontier_btn.count() == 1 and frontier_btn.is_visible(), (
            "Expected .frontier-jump-btn ('최고 사냥터') to be visible when selectedStage=1-1 and highest=3-4"
        )
        frontier_btn_text = frontier_btn.inner_text().strip()
        assert "최고 사냥터" in frontier_btn_text, (
            f"Expected '최고 사냥터' in .frontier-jump-btn text, got '{frontier_btn_text}'"
        )
        assert_no_overflow(pg, "battle_initial")

        # Click '2 보스' preset -> wait 200ms -> verify active preset contains '보스'
        pg.locator(".battle-preset-row .battle-preset-btn", has_text="2 보스").first.click()
        pg.wait_for_timeout(200)
        active_preset_text = (
            pg.locator(".battle-preset-row .battle-preset-btn.is-active").first.inner_text().strip()
        )
        assert "보스" in active_preset_text, (
            f"Expected active battle preset to contain '보스', got '{active_preset_text}'"
        )

        # Click .frontier-jump-btn -> wait 300ms -> verify .stage-label contains '3-4'
        frontier_btn.click()
        pg.wait_for_timeout(300)
        stage_label_text = pg.locator(".stage-label").first.inner_text().strip()
        assert "3-4" in stage_label_text, (
            f"Expected .stage-label to contain '3-4' after frontier jump, got '{stage_label_text}'"
        )

        # Wait 1500ms for a couple turns/telemetry updates
        pg.wait_for_timeout(1500)
        telemetry_text = telemetry.inner_text().strip()
        assert_no_overflow(pg, "battle_qol_after_turns")
        pg.screenshot(path=os.path.join(OUT_DIR, "p6_2_01_battle_qol.png"))

        # 3) Click 덱·장비 (index 2) -> 스킬 덱
        pg.locator(".bottom-nav button").nth(2).click()
        pg.wait_for_selector(".subtabs", timeout=6000)
        pg.locator(".subtabs .subtab-btn", has_text="스킬 덱").first.click()
        pg.wait_for_selector(".deck-preset-bar", timeout=6000)

        deck_preset_btns = pg.locator(".deck-preset-bar .deck-preset-btn")
        deck_preset_count = deck_preset_btns.count()
        assert deck_preset_count == 3, (
            f"Expected 3 .deck-preset-btn in .deck-preset-bar, got {deck_preset_count}"
        )
        boss_rec_btn = pg.locator(".deck-preset-bar button", has_text="보스 추천").first
        assert boss_rec_btn.count() == 1 and boss_rec_btn.is_visible(), (
            "Expected '보스 추천' button in .deck-preset-bar"
        )

        boss_rec_btn.click()
        pg.wait_for_timeout(250)
        deck_area_text = pg.locator(".item-list").first.inner_text()
        assert ("실디의 방패" in deck_area_text) or ("빛의 손길" in deck_area_text), (
            "Expected defensive/heal skill ('실디의 방패' or '빛의 손길') in deck list after clicking '보스 추천'"
        )
        assert_no_overflow(pg, "deck_presets")
        pg.screenshot(path=os.path.join(OUT_DIR, "p6_2_02_deck_presets.png"))

        # 4) Click 마도구 subtab
        pg.locator(".subtabs .subtab-btn", has_text="마도구").first.click()
        pg.wait_for_selector(".inv-sort-pills .inv-sort-btn", timeout=6000)

        sort_btns = pg.locator(".inv-sort-pills .inv-sort-btn")
        sort_count = sort_btns.count()
        assert sort_count == 3, f"Expected 3 .inv-sort-btn pills, got {sort_count}"
        sort_texts = [sort_btns.nth(i).inner_text().strip() for i in range(sort_count)]
        for expected_mode in ("점수순", "희귀도", "부위"):
            assert any(expected_mode in t for t in sort_texts), (
                f"Expected sort mode '{expected_mode}' in {sort_texts}"
            )

        delta_chips = pg.locator(".gear-delta-row .gear-delta-chip")
        delta_count = delta_chips.count()
        assert delta_count >= 3, (
            f"Expected >= 3 .gear-delta-row .gear-delta-chip elements, got {delta_count}"
        )
        up_chips = pg.locator(".gear-delta-row .gear-delta-chip.is-up")
        down_chips = pg.locator(".gear-delta-row .gear-delta-chip.is-down")
        assert up_chips.count() >= 1, "Expected at least 1 .gear-delta-chip.is-up chip"
        assert down_chips.count() >= 1, "Expected at least 1 .gear-delta-chip.is-down chip"

        before_active_sort = (
            pg.locator(".inv-sort-pills .inv-sort-btn.is-active").first.inner_text().strip()
        )
        pg.locator(".inv-sort-pills .inv-sort-btn", has_text="희귀도").first.click()
        pg.wait_for_timeout(200)
        after_active_sort = (
            pg.locator(".inv-sort-pills .inv-sort-btn.is-active").first.inner_text().strip()
        )
        assert "희귀도" in after_active_sort and after_active_sort != before_active_sort, (
            f"Expected active sort pill to change from '{before_active_sort}' to '희귀도', got '{after_active_sort}'"
        )
        assert_no_overflow(pg, "gear_compare_sort")
        pg.screenshot(path=os.path.join(OUT_DIR, "p6_2_03_gear_compare.png"))

        return {
            "battle": {
                "preset_count": preset_count,
                "preset_texts": preset_texts,
                "active_preset": active_preset_text,
                "frontier_btn_text": frontier_btn_text,
                "stage_after_jump": stage_label_text,
                "telemetry_sample": telemetry_text,
            },
            "deck_presets": {
                "preset_count": deck_preset_count,
                "has_sildy_shield": "실디의 방패" in deck_area_text,
                "has_light_touch": "빛의 손길" in deck_area_text,
            },
            "gear_compare": {
                "sort_modes": sort_texts,
                "active_sort_before": before_active_sort,
                "active_sort_after": after_active_sort,
                "delta_chip_count": delta_count,
                "up_chip_count": up_chips.count(),
                "down_chip_count": down_chips.count(),
            },
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p6_2_qol(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Page/console errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p6_2_qol": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
