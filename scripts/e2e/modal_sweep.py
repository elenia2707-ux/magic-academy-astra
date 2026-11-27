import json, time
from playwright.sync_api import sync_playwright
import os; D = os.path.join(os.path.dirname(__file__), "out") + "/"; os.makedirs(D, exist_ok=True); SAVE = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
save = json.load(open(SAVE))
save.update(lastSavedAt=int(time.time()*1000), selectedStage=3, viewedStoryKeys=["1_mid", "1_boss", "1_intro"], stones=3674)
blob = json.dumps(save)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, service_workers="block")
    ctx.add_init_script(f"if(!sessionStorage.getItem('seeded')){{localStorage.setItem('magic_academy_astra_save_v1', {json.dumps(blob)});sessionStorage.setItem('seeded','1');}}")
    page = ctx.new_page(); page.goto("http://localhost:4190/")
    for i in range(60):
        if page.locator(".toast-float").count():
            page.screenshot(path=D+"p096_toast.png"); print("toast"); break
        page.wait_for_timeout(100)
    page.wait_for_timeout(1500)
    page.locator("button[title='막 스토리']").click(); page.wait_for_timeout(600)
    page.screenshot(path=D+"p096_story.png")
    # boss phase
    btns = page.locator(".story-phase-btn")
    btns.nth(2).click(); page.wait_for_timeout(400)
    page.screenshot(path=D+"p096_story_boss.png")
    page.locator(".story-vn-modal button.btn-gold").click(); page.wait_for_timeout(400)
    page.locator(".enemy-card .portrait-frame").click(); page.wait_for_timeout(600)
    page.screenshot(path=D+"p096_enemy_modal.png")
    b.close()
