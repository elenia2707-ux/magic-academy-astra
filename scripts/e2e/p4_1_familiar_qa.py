"""P4-1 Familiar School Resonance & Battle Cut-in VFX E2E QA Suite.

Target server: http://localhost:4190/ (override with ASTRA_E2E_URL)
Viewport: 390x844 (iPhone mobile), device_scale_factor=1

Selector contract verified for P4-1:
1. Familiar Tab — School Resonance UI (`FamiliarTab.tsx`):
   * `.familiar-synergy-banner` (visible; hints recommended '흑염 박쥐' when non-resonant 'wolf' is active on flame school)
   * `.familiar-synergy-box.is-match` (present on '흑염 박쥐', '검은 까마귀', '영혼불')
   * Deploying '흑염 박쥐' (`출전`) -> `.familiar-synergy-banner.is-active` shows '혈월의 화로 계약'
   * Clicking '흑염 박쥐' portrait (`.wc-familiar-thumb`) -> `.familiar-lore-box` renders dry dark-comedy lore text -> closes via `닫기`
2. Battle Tab — Familiar Cut-in VFX & Synergy Trigger (`BattleTab.tsx` + `combat.ts`):
   * Switch back to `전투` tab, speed up combat (2x/3x), watch until `.familiar-cutin-strip` appears
   * Verify `.familiar-cutin-strip` has `.familiar-cutin-syn` ('✦ 공명'), `.familiar-cutin-name`, `.familiar-cutin-effect`
   * Verify combat log contains '혈월의 화로 계약'
   * Verify 0 pageerrors and 0 horizontal overflow on every view
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


def test_p4_1_familiar_resonance_and_cutin(browser: Browser, errs: list[str]) -> dict:
    """Verify Familiar school resonance UI, lore modal, and battle cut-in VFX."""
    blob = build_save(
        school="flame",
        level=25,
        rank=2,
        stones=15000,
        eggShards=10,
        selectedAct=2,
        selectedStage=4,
        highestAct=3,
        highestStageInAct=0,
        clearedActs=[1, 2],
        equipped={
            "staff": {
                "uid": "eq_p41_staff",
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
                "uid": "eq_p41_robe",
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
            "flame_1": {"id": "flame_1", "level": 6, "exp": 0, "unlocked": True},
            "flame_2": {"id": "flame_2", "level": 6, "exp": 0, "unlocked": True},
            "ward_1": {"id": "ward_1", "level": 5, "exp": 0, "unlocked": True},
        },
        deck=["flame_2", "ward_1", "flame_1"],
        trainingSlots=["ward_1"],
        familiars={
            "bat": {"id": "bat", "level": 5, "evolution": 1},
            "wolf": {"id": "wolf", "level": 5, "evolution": 0},
        },
        activeFamiliar="wolf",
    )

    ctx, pg = open_seeded_page(browser, blob, "p4_1_familiar", errs)
    try:
        # Verify initial Battle view has no overflow
        pg.wait_for_selector(".arena-card", timeout=8000)
        assert_no_overflow(pg, "battle_initial")

        # 1) Open 사역마 tab (.bottom-nav button nth 3)
        pg.locator(".bottom-nav button").nth(3).click()
        pg.wait_for_selector(".familiar-synergy-banner", timeout=6000)
        assert_no_overflow(pg, "familiar_tab_before_swap")

        banner = pg.locator(".familiar-synergy-banner")
        assert banner.is_visible(), "Expected .familiar-synergy-banner to be visible"
        banner_cls_before = banner.get_attribute("class") or ""
        assert "is-active" not in banner_cls_before, (
            f"Expected inactive resonance banner while wolf is active on flame school, got class='{banner_cls_before}'"
        )
        banner_text_before = banner.inner_text().strip()
        assert "흑염 박쥐" in banner_text_before, (
            f"Expected .familiar-synergy-banner to recommend '흑염 박쥐', got '{banner_text_before}'"
        )

        # Verify .familiar-synergy-box.is-match is present on 흑염 박쥐, 검은 까마귀, 영혼불
        matched_cards = pg.locator(".list-card:has(.familiar-synergy-box.is-match)")
        matched_count = matched_cards.count()
        assert matched_count == 3, (
            f"Expected 3 familiar cards with .familiar-synergy-box.is-match for flame school, got {matched_count}"
        )
        matched_texts = [matched_cards.nth(i).inner_text() for i in range(matched_count)]
        for expected_name in ("흑염 흡혈 박쥐", "검은 까마귀", "영혼불"):
            assert any(expected_name in t for t in matched_texts), (
                f"Expected '{expected_name}' card to have .familiar-synergy-box.is-match, got {matched_texts}"
            )

        # Verify '흑염 박쥐' (bat evo 1 -> '흑염 흡혈 박쥐') card has .familiar-synergy-box.is-match and deploy it
        bat_card = pg.locator(".list-card").filter(has_text="흑염 흡혈 박쥐").first
        assert bat_card.locator(".familiar-synergy-box.is-match").count() == 1, (
            "Expected .familiar-synergy-box.is-match on bat card"
        )
        bat_card.locator("button:has-text('출전')").click()
        pg.wait_for_timeout(250)

        active_banner = pg.locator(".familiar-synergy-banner.is-active")
        assert active_banner.count() == 1 and active_banner.is_visible(), (
            "Expected .familiar-synergy-banner.is-active after deploying 흑염 박쥐"
        )
        banner_text_after = active_banner.inner_text().strip()
        assert "혈월의 화로 계약" in banner_text_after, (
            f"Expected '혈월의 화로 계약' in .familiar-synergy-banner.is-active, got '{banner_text_after}'"
        )

        pg.screenshot(path=os.path.join(OUT_DIR, "p4_1_01_familiar_synergy.png"))
        assert_no_overflow(pg, "familiar_tab_synergy_active")

        # Click bat portrait (.wc-familiar-thumb) -> verify .familiar-lore-box -> close modal
        bat_card.locator(".wc-familiar-thumb").click()
        pg.wait_for_selector(".familiar-lore-box", timeout=6000)
        lore_box = pg.locator(".familiar-lore-box")
        assert lore_box.is_visible(), "Expected .familiar-lore-box in familiar showcase modal"
        lore_text = lore_box.inner_text().strip()
        assert len(lore_text) >= 15, f"Expected substantial lore text in .familiar-lore-box, got '{lore_text}'"

        pg.screenshot(path=os.path.join(OUT_DIR, "p4_1_02_familiar_modal.png"))
        assert_no_overflow(pg, "familiar_modal_lore")

        pg.locator(".hero-showcase-modal button:has-text('닫기')").click()
        pg.wait_for_timeout(200)
        assert pg.locator(".familiar-lore-box").count() == 0, "Expected familiar modal to close after clicking 닫기"

        # 2) Return to 전투 tab (.bottom-nav button nth 0), set speed 2x/3x, wait for .familiar-cutin-strip
        pg.locator(".bottom-nav button").nth(0).click()
        pg.wait_for_selector(".arena-card", timeout=6000)
        assert_no_overflow(pg, "battle_return_before_cutin")

        speed_btn = pg.locator("button[title='전투 배속']")
        speed_btn.click()  # 1x -> 2x
        pg.wait_for_timeout(100)
        speed_btn.click()  # 2x -> 3x

        # Poll up to ~8 seconds for .familiar-cutin-strip to appear during Act 2 Boss combat
        cutin = pg.locator(".familiar-cutin-strip")
        cutin_seen = False
        for _ in range(80):
            if cutin.count() > 0 and cutin.first.is_visible():
                cutin_seen = True
                break
            pg.wait_for_timeout(100)

        assert cutin_seen, "Expected .familiar-cutin-strip to appear within 8 seconds at 3x speed"

        syn_badge = cutin.locator(".familiar-cutin-syn")
        cutin_name = cutin.locator(".familiar-cutin-name")
        cutin_effect = cutin.locator(".familiar-cutin-effect")

        assert syn_badge.count() == 1 and syn_badge.is_visible(), "Expected .familiar-cutin-syn inside .familiar-cutin-strip"
        assert "공명" in syn_badge.inner_text(), (
            f"Expected '✦ 공명' in .familiar-cutin-syn, got '{syn_badge.inner_text()}'"
        )
        assert cutin_name.count() == 1 and cutin_name.is_visible(), "Expected .familiar-cutin-name"
        assert cutin_effect.count() == 1 and cutin_effect.is_visible(), "Expected .familiar-cutin-effect"

        cutin_name_text = cutin_name.inner_text().strip()
        cutin_effect_text = cutin_effect.inner_text().strip()
        assert len(cutin_name_text) > 0 and len(cutin_effect_text) > 0, (
            f"Cut-in name/effect should be non-empty: name='{cutin_name_text}', effect='{cutin_effect_text}'"
        )

        # Verify combat log contains '혈월의 화로 계약'
        log_texts = pg.locator(".combat-log-box .log-line").all_inner_texts()
        synergy_logs = [t for t in log_texts if "혈월의 화로 계약" in t]
        assert len(synergy_logs) >= 1, (
            f"Expected combat log to contain '혈월의 화로 계약', logs={log_texts}"
        )

        pg.screenshot(path=os.path.join(OUT_DIR, "p4_1_03_battle_familiar_cutin.png"))
        assert_no_overflow(pg, "battle_familiar_cutin")

        return {
            "banner_before": banner_text_before,
            "banner_after": banner_text_after,
            "matched_familiar_cards": matched_count,
            "lore_excerpt": lore_text[:40],
            "cutin_syn": syn_badge.inner_text().strip(),
            "cutin_name": cutin_name_text,
            "cutin_effect": cutin_effect_text,
            "synergy_log_sample": synergy_logs[0],
        }
    finally:
        ctx.close()


def main() -> None:
    errs: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        try:
            res = test_p4_1_familiar_resonance_and_cutin(browser, errs)
        finally:
            browser.close()

    assert not errs, f"Page errors detected: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "p4_1_familiar": res,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
