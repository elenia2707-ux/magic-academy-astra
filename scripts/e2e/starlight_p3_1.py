"""P3-1 Starlight Intervention E2E: charging, carryover, normal cast, & boss telegraph perfect counter."""
import json
import os
import time
from playwright.sync_api import sync_playwright

D = os.path.join(os.path.dirname(__file__), "out") + "/"
os.makedirs(D, exist_ok=True)
SAVE_PATH = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
URL = "http://localhost:4190/"

ALL_STORIES = [f"{a}_{k}" for a in range(1, 7) for k in ("intro", "mid", "boss", "after")]


def make_save(school: str, act: int, stage: int, level: int, rank: int, speed: int = 3):
    s = json.load(open(SAVE_PATH))
    now_ms = int(time.time() * 1000)
    s.update(
        school=school,
        level=level,
        rank=rank,
        selectedAct=act,
        selectedStage=stage,
        highestAct=max(act, s.get("highestAct", 1)),
        highestStageInAct=4,
        clearedActs=list(range(1, act)),
        viewedStoryKeys=ALL_STORIES,
        lastSavedAt=now_ms,
    )
    if "abyss" in s:
        s["abyss"]["lastLanternTick"] = now_ms
    s["settings"]["autoAdvance"] = False
    s["settings"]["speed"] = speed
    return json.dumps(s)


def main():
    errs = []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])

        # 1) Normal stage (Act 2-3): charge from 0% -> 100% -> trigger normal Starlight
        blob1 = make_save("thunder", act=2, stage=2, level=13, rank=1, speed=2)
        ctx1 = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            service_workers="block",
        )
        ctx1.add_init_script(
            f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('magic_academy_astra_save_v1',{json.dumps(blob1)});sessionStorage.setItem('seeded','1');}}"
        )
        pg = ctx1.new_page()
        pg.on("pageerror", lambda e: errs.append(f"p1:{e}"))
        pg.goto(URL, wait_until="domcontentloaded")
        pg.wait_for_timeout(1400)

        btn = pg.locator(".starlight-btn")
        assert btn.count() == 1, "starlight-btn missing"
        cta_start = btn.locator(".starlight-cta").inner_text().strip()
        pg.screenshot(path=D + "p31_charging.png")

        # Wait until ready (100%)
        ready_seen = False
        for _ in range(55):
            if "is-ready" in (btn.get_attribute("class") or ""):
                ready_seen = True
                break
            pg.wait_for_timeout(250)
        assert ready_seen, f"starlight never reached 100% (started at {cta_start})"
        pg.screenshot(path=D + "p31_ready.png")

        # Fire normal Starlight
        btn.click()
        pg.wait_for_timeout(120)
        normal_logs = pg.locator(".combat-log-box .log-line.starlight").all_inner_texts()
        normal_ribbon = pg.locator(".starlight-flash-ribbon").count()
        pg.screenshot(path=D + "p31_fired_normal.png")
        assert normal_ribbon == 1, "missing starlight flash ribbon"
        assert any("성좌 심판의 낙뢰" in t for t in normal_logs), f"missing thunder starlight log: {normal_logs}"

        # Check horizontal overflow
        overflow = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not overflow, "horizontal overflow detected on BattleTab"
        ctx1.close()

        # 2) Boss fight (Act 2 boss, Lv14 flame): charge to 100%, hold until telegraph -> PERFECT COUNTER!
        blob2 = make_save("flame", act=2, stage=4, level=14, rank=1, speed=2)
        ctx2 = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            service_workers="block",
        )
        ctx2.add_init_script(
            f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('magic_academy_astra_save_v1',{json.dumps(blob2)});sessionStorage.setItem('seeded','1');}}"
        )
        pg2 = ctx2.new_page()
        pg2.on("pageerror", lambda e: errs.append(f"p2:{e}"))
        pg2.goto(URL, wait_until="domcontentloaded")
        pg2.wait_for_timeout(1200)

        btn2 = pg2.locator(".starlight-btn")
        perfect_seen = False
        for _ in range(90):
            cls = btn2.get_attribute("class") or ""
            if "is-perfect" in cls:
                perfect_seen = True
                break
            pg2.wait_for_timeout(200)
        assert perfect_seen, "boss telegraph perfect-counter window never appeared"
        assert pg2.locator(".telegraph-pill").count() == 1, "telegraph pill should be visible"
        pg2.screenshot(path=D + "p31_boss_perfect_ready.png")

        # Trigger perfect counter!
        btn2.click()
        pg2.wait_for_timeout(150)
        pg2.screenshot(path=D + "p31_boss_perfect_fired.png")

        telegraph_after = pg2.locator(".telegraph-pill").count()
        cta_after = btn2.locator(".starlight-cta").inner_text().strip()
        perf_logs = pg2.locator(".combat-log-box .log-line.starlight").all_inner_texts()
        assert telegraph_after == 0, "perfect counter did not cancel enemy telegraph"
        assert "25%" in cta_after or int(cta_after.replace("%", "")) >= 25 if "%" in cta_after else True, (
            f"expected >=25% gauge refund, got {cta_after}"
        )
        assert any("완벽 개입!" in t for t in perf_logs), f"missing perfect counter log: {perf_logs}"
        assert any("잿빛 연옥의 낙인" in t for t in perf_logs), f"missing flame starlight log: {perf_logs}"
        ctx2.close()
        browser.close()

    assert not errs, f"page errors: {errs}"
    print(
        json.dumps(
            {
                "status": "PASS",
                "cta_start": cta_start,
                "normal_logs": normal_logs,
                "telegraph_after_perfect": telegraph_after,
                "cta_after_perfect": cta_after,
                "perfect_logs": perf_logs,
                "errors": errs,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
