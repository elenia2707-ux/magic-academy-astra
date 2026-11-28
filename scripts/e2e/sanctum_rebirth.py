"""Rebirth must keep Arcane Sanctum imprints (fix after playtest review)."""
import json, time
from playwright.sync_api import sync_playwright
import os
D = os.path.join(os.path.dirname(__file__), "out") + "/"; os.makedirs(D, exist_ok=True)
s = json.load(open(os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")))
s.update(lastSavedAt=int(time.time()*1000), clearedActs=[1,2,3,4,5,6], rank=5, level=60,
         viewedStoryKeys=[f"{a}_{k}" for a in range(1,7) for k in ["intro","mid","boss","after"]],
         sanctum={"imprints": {"overdrive": 7, "aegis": 4, "insight": 3}, "totalStonesSpent": 123456})
s["settings"]["autoAdvance"] = False
blob = json.dumps(s); errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, service_workers="block")
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('magic_academy_astra_save_v1', {json.dumps(blob)});sessionStorage.setItem('seeded','1');}}")
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("dialog", lambda d: d.accept())
    pg.goto("http://localhost:4191/", wait_until="domcontentloaded"); pg.wait_for_timeout(2000)
    pg.locator(".bottom-nav button").nth(4).click(); pg.wait_for_timeout(400)
    pg.locator(".subtab-btn").nth(2).click(); pg.wait_for_timeout(400)
    pg.screenshot(path=D + "sanctum_rebirth_panel.png")
    pg.locator("button:has-text('시간 회귀 실행')").first.click(); pg.wait_for_timeout(800)
    for _ in range(8):
        inp = pg.locator("input:visible")
        if inp.count(): inp.first.fill("회귀자")
        c = pg.locator("button:visible:has-text('입학')")
        if c.count():
            c.first.click(); pg.wait_for_timeout(800)
        if pg.locator(".bottom-nav:visible").count(): break
    pg.wait_for_timeout(1500)
    st = json.loads(pg.evaluate("localStorage.getItem('magic_academy_astra_save_v1')"))
    print("rebirthCount", st["prestige"]["rebirthCount"], "level", st["level"], "sanctum", st.get("sanctum"))
    ok = st["prestige"]["rebirthCount"] == 1 and st["sanctum"]["imprints"]["overdrive"] == 7 and st["sanctum"]["totalStonesSpent"] == 123456
    for k in ["임무 출격", "닫기"]:
        c = pg.locator(f"button:visible:has-text('{k}')")
        if c.count(): c.first.click(); pg.wait_for_timeout(500)
    pg.locator(".bottom-nav button").nth(4).click(); pg.wait_for_timeout(400)
    pg.locator(".subtab-btn").nth(1).click(); pg.wait_for_timeout(500)
    pg.locator(".main-content").evaluate("e=>e.scrollTop=e.scrollHeight"); pg.wait_for_timeout(300)
    pg.screenshot(path=D + "sanctum_after_rebirth.png")
    b.close()
print("PASS" if ok and not errs else "FAIL", errs)
