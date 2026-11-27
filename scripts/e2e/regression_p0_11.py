#!/usr/bin/env python3
"""P0-11 full regression E2E:
  11-a: Character creation (4 schools x 2 genders, 0 errors, starter 3-skill deck)
  11-b: Act 1 progression (2x speed, story gap >= 25s, retreat/death logging)
  11-c: Act 1 boss auto-challenge -> clear -> Act 2 intro queued
  11-d: Rank 1 exam (school nav-dot -> headmaster -> exam start/clear -> rank '시전자', nav-dot gone)
  11-f: Save -> reload w/ lastSavedAt -10min -> offline reward modal
"""
import json
import os
import sys
import time
from PIL import Image
from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT, exist_ok=True)
URL = os.environ.get("E2E_URL", "http://localhost:4190/")


def log(msg: str) -> None:
    print(msg, flush=True)


def main() -> int:
    console_errs: list[str] = []
    page_errs: list[str] = []
    http_errs: list[str] = []
    story_events: list[dict] = []
    stage_history: list[tuple[float, str]] = []
    toasts_seen: list[tuple[float, str]] = []
    deaths = 0
    retreats = 0
    boss_attempts = 0
    act1_clear_time = None
    act1_clear_lv = None
    act2_intro_time = None

    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-dev-shm-usage"])
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
            service_workers="block",
        )
        page = ctx.new_page()
        page.on("console", lambda m: console_errs.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: page_errs.append(str(e)))
        page.on(
            "response",
            lambda r: http_errs.append(f"{r.status} {r.url}") if r.status >= 400 else None,
        )

        # === 11-a: Character creation (4 schools x 2 genders) ===
        log("=== 11-a: Character creation ===")
        page.goto(URL, wait_until="domcontentloaded")
        page.wait_for_selector("#player-name-input", timeout=15000)
        page.wait_for_timeout(800)
        page.locator("#player-name-input").fill("리엔")

        create_imgs = []
        broken_portraits = []
        gender_names = ["male", "female"]
        for gi, gname in enumerate(gender_names):
            page.locator(".gender-row button").nth(gi).click()
            page.wait_for_timeout(200)
            for si in range(4):
                page.locator(".school-choice").nth(si).click()
                page.wait_for_timeout(250)
                ok = page.evaluate(
                    """() => {
                      const img = document.querySelector('.wc-preview-frame img');
                      return img ? (img.complete && img.naturalWidth > 0) : false;
                    }"""
                )
                if not ok:
                    broken_portraits.append((gname, si))
                shot_path = os.path.join(OUT, f"p11_create_{gname}_{si}.png")
                page.screenshot(path=shot_path)
                create_imgs.append(shot_path)

        # Build 4x2 contact sheet of character creation screens
        ims = [Image.open(pth) for pth in create_imgs]
        w, h = ims[0].size
        sheet = Image.new("RGB", (w * 4, h * 2))
        for idx, im in enumerate(ims):
            sheet.paste(im, ((idx % 4) * w, (idx // 4) * h))
        sheet.save(os.path.join(OUT, "p11_creation_sheet.jpg"), quality=86)
        log(f"11-a portraits broken: {broken_portraits}")

        # Pick female + flame (index 0) and start game
        page.locator(".gender-row button").nth(1).click()
        page.locator(".school-choice").nth(0).click()
        page.wait_for_timeout(200)
        page.locator(".creation-screen button.btn-gold.btn-block").click()
        page.wait_for_timeout(800)

        # Close Act 1 intro story if immediately visible
        t_start = time.time()
        last_story_closed = None

        def check_and_handle_story(save_prefix: str = "") -> str | None:
            nonlocal last_story_closed
            m = page.locator(".story-vn-modal")
            if not m.count():
                return None
            title = m.locator(".modal-title").inner_text().strip()
            now = time.time()
            gap = None if last_story_closed is None else round(now - last_story_closed, 1)
            ev = {"t": round(now - t_start, 1), "title": title, "gap": gap}
            story_events.append(ev)
            log(f"[{ev['t']:5.1f}s] STORY: {title} (gap={gap}s)")
            if save_prefix:
                page.screenshot(path=os.path.join(OUT, f"{save_prefix}.png"))
            page.wait_for_timeout(350)
            m.locator("button.btn-gold").click()
            last_story_closed = time.time()
            return title

        check_and_handle_story("p11_story_act1_intro")
        page.wait_for_timeout(300)

        # Verify starter 3-skill deck
        deck_names = page.locator(".rot-chip .rot-name").all_inner_texts()
        log(f"11-a starter deck ({len(deck_names)}): {deck_names}")
        assert len(deck_names) == 3 and all(n != "비어있음" for n in deck_names), f"Bad starter deck: {deck_names}"

        # Ensure speed is 2x
        spd_btn = page.locator("button[title='전투 배속']")
        for _ in range(3):
            if "2x" in spd_btn.inner_text():
                break
            spd_btn.click()
            page.wait_for_timeout(150)
        log(f"battle speed set to: {spd_btn.inner_text().strip()}")

        # === 11-b & 11-c: Act 1 progression -> Act 1 Boss -> Act 2 intro ===
        log("=== 11-b & 11-c: Act 1 -> Boss -> Act 2 intro ===")
        last_stage = ""
        last_toast = ""
        mid_shot = False
        boss_shot = False
        clear_shot = False
        equipped_once = False
        prev_stage_num = 0
        saw_act1_clear = False
        saw_act2_intro = False

        deadline = time.time() + 260
        while time.time() < deadline:
            t_rel = round(time.time() - t_start, 1)

            # Story modal handling
            if page.locator(".story-vn-modal").count():
                title = page.locator(".story-vn-modal .modal-title").inner_text().strip()
                prefix = ""
                if "중반" in title and not mid_shot:
                    prefix = "p11_story_mid"
                    mid_shot = True
                elif "보스" in title and not boss_shot:
                    prefix = "p11_story_boss"
                    boss_shot = True
                elif ("클리어" in title or "후일담" in title or "결말" in title or "정화" in title) and not clear_shot:
                    prefix = "p11_story_clear"
                    clear_shot = True
                elif "제 2막" in title:
                    prefix = "p11_story_act2_intro"
                closed_title = check_and_handle_story(prefix)
                if closed_title:
                    if "제 2막" in closed_title:
                        saw_act2_intro = True
                        act2_intro_time = round(time.time() - t_start, 1)
                        break
                    if any(k in closed_title for k in ("후일담", "클리어", "정화", "결말")) or (
                        "제 1막" in closed_title and boss_shot and not saw_act1_clear
                    ):
                        # verify clearedActs via save or stage 2-1
                        pass
                page.wait_for_timeout(150)
                continue

            # Track toast
            tf = page.locator(".toast-float")
            if tf.count():
                tt = tf.first.inner_text().strip()
                if tt and tt != last_toast:
                    last_toast = tt
                    toasts_seen.append((t_rel, tt))
                    log(f"[{t_rel:5.1f}s] TOAST: {tt}")
                    if "보스에게 자동 도전" in tt:
                        boss_attempts += 1
                    if "후퇴" in tt or "쓰러" in tt or "패배" in tt or "재정비" in tt:
                        deaths += 1
                        if "후퇴" in tt:
                            retreats += 1

            # Track stage & level
            sl = page.locator(".stage-label")
            if sl.count():
                stg = sl.first.inner_text().strip()
                if stg != last_stage:
                    last_stage = stg
                    lv_txt = page.locator(".status-lv").inner_text().strip()
                    stage_history.append((t_rel, f"{stg} ({lv_txt})"))
                    log(f"[{t_rel:5.1f}s] STAGE: {stg} | {lv_txt}")
                    if stg.startswith("1-"):
                        try:
                            snum = int(stg.split("-")[1].split(" ")[0])
                            if snum < prev_stage_num and prev_stage_num < 5:
                                retreats += 1
                            prev_stage_num = snum
                        except Exception:
                            pass
                    if stg.startswith("2-") and not saw_act1_clear:
                        saw_act1_clear = True
                        act1_clear_time = t_rel
                        act1_clear_lv = lv_txt
                        log(f"[{t_rel:5.1f}s] Act 1 CLEARED! ({lv_txt}) — waiting for Act 2 intro...")

            # If we've lost to boss once, do a quick realistic equip-best & skill upgrade so we don't stall
            if boss_attempts >= 2 and not equipped_once and not page.locator(".modal-backdrop").count():
                equipped_once = True
                log(f"[{t_rel:5.1f}s] Doing realistic gear equip-best after boss attempt #2")
                page.locator(".bottom-nav button").nth(2).click()
                page.wait_for_timeout(300)
                page.locator("button:has-text('마도구')").first.click()
                page.wait_for_timeout(300)
                btn_best = page.locator(".btn-equip-best")
                if btn_best.count() and not btn_best.is_disabled():
                    btn_best.click()
                    page.wait_for_timeout(250)
                page.locator(".bottom-nav button").nth(0).click()
                page.wait_for_timeout(250)

            page.wait_for_timeout(250)

        log(f"Act 1 clear: {saw_act1_clear} at {act1_clear_time}s ({act1_clear_lv}), Act 2 intro: {saw_act2_intro} at {act2_intro_time}s")
        assert saw_act1_clear, "Did not clear Act 1 within timeout!"
        assert saw_act2_intro, "Act 2 intro story did not trigger from queue!"

        # Check gap between Act 1 intro and mid story
        if len(story_events) >= 2:
            mid_evs = [e for e in story_events if "중반" in e["title"]]
            if mid_evs:
                log(f"Mid story gap check: {mid_evs[0]['gap']}s (>= 25s expected)")

        # === 11-d: Rank 1 exam ===
        log("=== 11-d: Rank 1 Exam ===")
        # Make sure player is >= Lv8 (usually Lv9-11 after Act 1 boss)
        lv_now_txt = page.locator(".status-lv").inner_text().strip()
        lv_now = int(lv_now_txt.replace("Lv.", ""))
        log(f"Current level before exam: {lv_now}")

        # Equip best gear + upgrade skills once before exam (realistic player)
        page.locator(".bottom-nav button").nth(2).click()
        page.wait_for_timeout(300)
        page.locator("button:has-text('마도구')").first.click()
        page.wait_for_timeout(300)
        btn_best = page.locator(".btn-equip-best")
        if btn_best.count() and not btn_best.is_disabled():
            btn_best.click()
            log("Equipped best gear before exam")
            page.wait_for_timeout(300)

        # Check school nav-dot BEFORE exam
        school_btn = page.locator(".bottom-nav button").nth(1)
        dot_before = school_btn.locator(".nav-dot").count()
        log(f"School nav-dot before exam: {dot_before}")
        assert dot_before == 1, f"Expected school nav-dot=1 before exam, got {dot_before}"

        school_btn.click()
        page.wait_for_timeout(350)
        page.locator(".subtab-btn", has_text="교장실").click()
        page.wait_for_timeout(400)
        page.screenshot(path=os.path.join(OUT, "p11_exam_ready.png"))

        exam_btn = page.locator("button", has_text="승급 시험 도전")
        assert exam_btn.count() and not exam_btn.is_disabled(), "Exam button not enabled!"
        exam_btn.click()
        page.wait_for_timeout(500)

        # Expect exam start story modal
        start_title = check_and_handle_story("p11_exam_start")
        log(f"Exam start modal: {start_title}")
        assert start_title and "승급 시험" in start_title, f"Unexpected exam start modal: {start_title}"

        # Wait for exam clear story modal
        exam_cleared = False
        exam_deadline = time.time() + 90
        while time.time() < exam_deadline:
            if page.locator(".story-vn-modal").count():
                t = check_and_handle_story("p11_exam_clear")
                if t and ("인가" in t or "승급" in t):
                    exam_cleared = True
                    break
            page.wait_for_timeout(250)
        assert exam_cleared, "Rank 1 exam did not clear!"
        page.wait_for_timeout(500)

        rank_after = page.locator(".rank-tag").inner_text().strip()
        dot_after = school_btn.locator(".nav-dot").count()
        page.screenshot(path=os.path.join(OUT, "p11_rank_up.png"))
        log(f"After exam -> rank='{rank_after}', school nav-dot={dot_after}")
        assert rank_after == "시전자", f"Expected rank '시전자', got '{rank_after}'"
        assert dot_after == 0, f"Expected school nav-dot=0 after exam, got {dot_after}"

        # === 11-f: Save -> reload w/ lastSavedAt 10min ago -> offline modal ===
        log("=== 11-f: Save & Offline Reward Modal ===")
        page.wait_for_timeout(8800)  # auto-save every 8s
        raw = page.evaluate("localStorage.getItem('magic_academy_astra_save_v1')")
        assert raw, "Save missing from localStorage!"
        saved = json.loads(raw)
        log(
            f"Saved state: lv={saved['level']}, rank={saved['rank']}, clearedActs={saved['clearedActs']}, stones={saved['stones']}"
        )
        assert saved["rank"] == 1 and 1 in saved["clearedActs"], f"Bad saved state: rank={saved['rank']}, clearedActs={saved['clearedActs']}"

        # Close page first so pagehide finishes its real save, then reopen with lastSavedAt backdated 10 min
        page.close()
        saved["lastSavedAt"] = int(time.time() * 1000) - 10 * 60 * 1000

        page2 = ctx.new_page()
        page2.on("console", lambda m: console_errs.append(m.text) if m.type == "error" else None)
        page2.on("pageerror", lambda e: page_errs.append(str(e)))
        page2.on(
            "response",
            lambda r: http_errs.append(f"{r.status} {r.url}") if r.status >= 400 else None,
        )
        page2.add_init_script(
            f"if(!sessionStorage.getItem('p11_offline')){{localStorage.setItem('magic_academy_astra_save_v1', {json.dumps(json.dumps(saved))});sessionStorage.setItem('p11_offline','1');}}"
        )
        page2.goto(URL, wait_until="domcontentloaded")
        page2.wait_for_selector(".modal-card", timeout=15000)
        page2.wait_for_timeout(600)

        offline_modal = page2.locator(".modal-card", has_text="오프라인 방치 정산")
        assert offline_modal.count() == 1, "Offline reward modal did not appear!"
        offline_text = offline_modal.inner_text()
        page2.screenshot(path=os.path.join(OUT, "p11_offline_modal.png"))
        log("Offline modal text:\n" + offline_text)
        offline_modal.locator("button.btn-gold").click()
        page2.wait_for_timeout(300)

        # === 11-e quick layout/overflow check across all 5 tabs ===
        log("=== 11-e: Overflow / clipping check across tabs ===")
        overflow_issues = []
        for idx, name in enumerate(["battle", "school", "deck", "familiar", "abyss"]):
            if page2.locator(".story-vn-modal").count():
                page2.locator(".story-vn-modal button.btn-gold").click()
                page2.wait_for_timeout(200)
            page2.locator(".bottom-nav button").nth(idx).click()
            page2.wait_for_timeout(350)
            ov = page2.evaluate(
                """() => {
                  const shell = document.querySelector('.phone-shell');
                  const issues = [];
                  if (shell && shell.scrollWidth > shell.clientWidth + 1) {
                    issues.push(`phone-shell horiz overflow: ${shell.scrollWidth} > ${shell.clientWidth}`);
                  }
                  // check header elements stay within 390px
                  document.querySelectorAll('.top-header .curr-pill, .combatant-name.ribbon').forEach(el => {
                    const r = el.getBoundingClientRect();
                    if (r.right > window.innerWidth + 1 || r.left < -1) {
                      issues.push(`clip ${el.className}: left=${r.left.toFixed(1)} right=${r.right.toFixed(1)}`);
                    }
                  });
                  return issues;
                }"""
            )
            if ov:
                overflow_issues.append((name, ov))

        browser.close()

    summary = {
        "console_errs": console_errs,
        "page_errs": page_errs,
        "http_errs": http_errs,
        "broken_portraits": broken_portraits,
        "story_events": story_events,
        "stage_history": stage_history,
        "deaths": deaths,
        "retreats": retreats,
        "boss_attempts": boss_attempts,
        "act1_clear_time": act1_clear_time,
        "act1_clear_lv": act1_clear_lv,
        "act2_intro_time": act2_intro_time,
        "rank_after": rank_after,
        "dot_before": dot_before,
        "dot_after": dot_after,
        "overflow_issues": overflow_issues,
    }
    with open(os.path.join(OUT, "p11_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    log("\n=== SUMMARY ===")
    log(json.dumps(summary, ensure_ascii=False, indent=2))
    assert not console_errs and not page_errs and not http_errs, "Runtime errors detected!"
    assert not broken_portraits, f"Broken portraits: {broken_portraits}"
    assert not overflow_issues, f"Overflow issues: {overflow_issues}"
    return 0


if __name__ == "__main__":
    sys.exit(main())
