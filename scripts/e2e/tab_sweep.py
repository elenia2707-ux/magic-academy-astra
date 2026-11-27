import json, time
from playwright.sync_api import sync_playwright
import os; D = os.path.join(os.path.dirname(__file__), "out") + "/"; os.makedirs(D, exist_ok=True); SAVE = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
save = json.load(open(SAVE))
save.update(lastSavedAt=int(time.time()*1000), selectedStage=1, viewedStoryKeys=["1_mid", "1_boss", "1_intro"], stones=3674); save["settings"]["autoAdvance"]=False
blob = json.dumps(save)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, service_workers="block")
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('magic_academy_astra_save_v1', {json.dumps(blob)});sessionStorage.setItem('seeded','1');}}")
    page = ctx.new_page(); page.goto("http://localhost:4190/"); page.wait_for_timeout(1500)
    def nav(i): page.locator(".bottom-nav button").nth(i).click(); page.wait_for_timeout(500)
    nav(1); page.screenshot(path=D+"p095_school.png")
    page.locator(".main-content").evaluate("e=>e.scrollTop=380"); page.wait_for_timeout(200); page.screenshot(path=D+"p095_school2.png")
    page.locator(".subtab-btn").nth(2).click(); page.wait_for_timeout(400); page.screenshot(path=D+"p095_head.png")
    nav(2); page.screenshot(path=D+"p095_deck.png")
    page.locator("button:has-text('마도구')").first.click(); page.wait_for_timeout(400); page.screenshot(path=D+"p095_gear.png")
    nav(3); page.screenshot(path=D+"p095_fam.png")
    nav(4); page.screenshot(path=D+"p095_abyss.png")
    b.close()
