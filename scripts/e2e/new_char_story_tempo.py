import time
from playwright.sync_api import sync_playwright
import os; D = os.path.join(os.path.dirname(__file__), "out") + "/"; os.makedirs(D, exist_ok=True); SAVE = os.path.join(os.path.dirname(__file__), "save_lv13_thunder.json")
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1, service_workers="block")
    page = ctx.new_page(); page.goto("http://localhost:4190/"); page.wait_for_timeout(1200)
    page.locator("input").first.fill("리엔")
    page.locator("button.btn-gold, button.btn-block").last.click(); page.wait_for_timeout(800)
    t0 = None; events = []; shots = 0; stage_seen = set()
    start = time.time()
    while time.time() - start < 135:
        m = page.locator(".story-vn-modal")
        if m.count():
            title = m.locator(".modal-title").inner_text()
            now = time.time()
            gap = None if t0 is None else round(now - t0, 1)
            events.append((title, gap))
            print(f"[{now-start:5.1f}s] 모달: {title}  (직전 스토리 닫은 뒤 {gap}s)")
            if shots < 2 and t0 is not None:
                page.screenshot(path=D + f"p07_story_{shots}.png"); shots += 1
            page.wait_for_timeout(600)
            m.locator("button.btn-gold").click()
            t0 = time.time()
        else:
            try:
                stg = page.locator(".battle-stage-title, h2").first.inner_text(timeout=300)
                if stg not in stage_seen:
                    stage_seen.add(stg); print(f"[{time.time()-start:5.1f}s] 구역: {stg}")
            except Exception:
                pass
        page.wait_for_timeout(250)
    b.close()
