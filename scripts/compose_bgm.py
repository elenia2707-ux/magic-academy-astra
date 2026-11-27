#!/usr/bin/env python3
"""
《마법학교 아스트라》 오리지널 OST 3곡 생성기 v2 (P1-6)
- 2005~2009 한국 판타지 RPG 황금기 감성 (엘리니아 · 에레브 정원/필드 · 시간의 신전 오마주)
- 3곡 구성:
  1) bgm_academy.mp3 : 「달빛이 머무는 교정」 (E minor / G major, 4/4 서정 발라드, 100 BPM)
     - 엘리니아 + 에레브 정원 감성: 오르골/첼레스타 · 피아노 add9 아르페지오 · 몽환적 뉴에이지 패드 · 플루트 · 하프 · 스트링
  2) bgm_battle.mp3  : 「빗방울 숲의 모험가」 (B minor / D major, 4/4 서정 모험 필드, 122 BPM)
     - 에레브 필드(빗방울 꽃/수련의 숲) + 엘리니아 필드 감성: 빗방울 피아노 · 글로켄슈필 · 피치카토 · 플루트/바이올린 · 경쾌한 라이트 퍼커션
  3) bgm_boss.mp3    : 「시간이 멈춘 회랑」 (D minor / F major, 4/4 비장한 시계탑 오케스트라, 128 BPM)
     - 시간의 신전 감성: 튜뷸러 벨 종소리 · 시계태엽 피아노 오스티나토 · 합창 · 솔로 바이올린 · 팀파니 · 스트링 & 오르간
- 32마디 풀 폼을 2회 연속 렌더링한 뒤 2회차(32~64마디)만 정확히 잘라
  리버브 잔향이 자연스럽게 이어지는 완벽한 심리스 루프(tail-wrap)로 마스터링한다.
"""
import math
import os
import random
import struct
import subprocess
import tempfile

PPQ = 480  # ticks per quarter note
SF2_CANDIDATES = [
    "/usr/share/sounds/sf2/FluidR3_GM.sf2",
    "/usr/share/sounds/sf2/default-GM.sf2",
    "/usr/share/sounds/sf2/TimGM6mb.sf2",
]


def find_sf2() -> str:
    for p in SF2_CANDIDATES:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("No GM SoundFont found in /usr/share/sounds/sf2/")


# ==================== Pure-Python MIDI Type 1 Writer ====================
def vlq(n: int) -> bytes:
    buf = [n & 0x7F]
    n >>= 7
    while n > 0:
        buf.append((n & 0x7F) | 0x80)
        n >>= 7
    buf.reverse()
    return bytes(buf)


class MidiTrack:
    def __init__(
        self,
        channel: int,
        program: int | None = None,
        name: str = "",
        volume: int = 100,
        pan: int = 64,
        reverb: int = 60,
        chorus: int = 24,
    ):
        self.channel = channel
        self.events: list[tuple[int, int, bytes]] = []  # (tick, order, bytes)
        if name:
            nb = name.encode("ascii", errors="ignore")
            self.events.append((0, 0, bytes([0xFF, 0x03]) + vlq(len(nb)) + nb))
        if program is not None and channel != 9:
            self.events.append((0, 1, bytes([0xC0 | channel, program & 0x7F])))
        self.cc(0, 7, volume)    # Main Volume
        self.cc(0, 10, pan)      # Pan
        self.cc(0, 91, reverb)   # Reverb Send
        self.cc(0, 93, chorus)   # Chorus Send
        self.cc(0, 11, 116)      # Expression

    def cc(self, tick: int, ctrl: int, val: int) -> None:
        self.events.append(
            (max(0, int(tick)), 2, bytes([0xB0 | self.channel, ctrl & 0x7F, max(0, min(127, int(val)))]))
        )

    def cc_beat(self, beat: float, ctrl: int, val: int) -> None:
        self.cc(int(round(beat * PPQ)), ctrl, val)

    def swell(self, start_beat: float, dur_beat: float, low: int = 86, peak: int = 120, steps: int = 8) -> None:
        """Gentle musical expression (CC11) arch over a sustained pad/string phrase."""
        for i in range(steps + 1):
            frac = i / steps
            arch = math.sin(frac * math.pi)
            val = int(round(low + (peak - low) * arch))
            self.cc_beat(start_beat + dur_beat * frac, 11, val)

    def note(
        self,
        start_beat: float,
        dur_beat: float,
        pitch: int,
        vel: int = 80,
        humanize_tick: int = 0,
    ) -> None:
        if pitch < 0 or pitch > 127 or dur_beat <= 0:
            return
        s = max(0, int(round(start_beat * PPQ)) + humanize_tick)
        e = max(s + 12, int(round((start_beat + dur_beat) * PPQ)) + humanize_tick)
        v = max(1, min(127, int(vel)))
        self.events.append((s, 4, bytes([0x90 | self.channel, pitch, v])))
        self.events.append((e, 3, bytes([0x80 | self.channel, pitch, 0])))

    def to_bytes(self, end_tick: int) -> bytes:
        evs = sorted(self.events, key=lambda x: (x[0], x[1]))
        out = bytearray()
        prev = 0
        for t, _, raw in evs:
            delta = max(0, t - prev)
            out.extend(vlq(delta))
            out.extend(raw)
            prev = t
        tail = max(0, end_tick - prev)
        out.extend(vlq(tail))
        out.extend(b"\xFF\x2F\x00")
        return b"MTrk" + struct.pack(">I", len(out)) + bytes(out)


def write_midi(path: str, bpm: float, num: int, den: int, tracks: list[MidiTrack], total_beats: float) -> None:
    tempo_us = int(round(60_000_000 / bpm))
    meta = bytearray()
    den_pow = {1: 0, 2: 1, 4: 2, 8: 3}[den]
    meta.extend(vlq(0) + bytes([0xFF, 0x58, 0x04, num, den_pow, 24, 8]))
    meta.extend(
        vlq(0)
        + bytes([0xFF, 0x51, 0x03, (tempo_us >> 16) & 0xFF, (tempo_us >> 8) & 0xFF, tempo_us & 0xFF])
    )
    end_tick = int(round(total_beats * PPQ))
    meta.extend(vlq(end_tick) + b"\xFF\x2F\x00")
    meta_chunk = b"MTrk" + struct.pack(">I", len(meta)) + bytes(meta)

    header = b"MThd" + struct.pack(">IHHH", 6, 1, 1 + len(tracks), PPQ)
    with open(path, "wb") as f:
        f.write(header)
        f.write(meta_chunk)
        for tr in tracks:
            f.write(tr.to_bytes(end_tick))


NOTE_BASE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def N(name: str) -> int:
    letter = name[0].upper()
    rest = name[1:]
    acc = 0
    if rest.startswith("#"):
        acc = 1
        rest = rest[1:]
    elif rest.startswith("b"):
        acc = -1
        rest = rest[1:]
    octave = int(rest)
    return (octave + 1) * 12 + NOTE_BASE[letter] + acc


def chord_notes(names: list[str]) -> list[int]:
    return [N(x) for x in names]


# ==================== SONG 1: 달빛이 머무는 교정 (Ellinia + Ereve Queen's Garden) ====================
# E minor -> G major -> E minor | 4/4 Dreamy Ballad | 100 BPM | 32 bars (128 beats = 76.80s loop)
def build_academy(midi_path: str) -> tuple[float, float]:
    rng = random.Random(200501)
    bpm = 100.0
    beats_per_bar = 4
    bars = 32
    loop_beats = bars * beats_per_bar  # 128 beats -> 76.8s

    # Lush add9 / maj7 / sus2 harmony — pure Ellinia & Ereve Queen's Garden airiness
    # (bass, [4-note piano/harp voicing low->high], [3-note warm pad voicing])
    prog = [
        # A (0..7): E minor — 달빛 아래 고요한 마법학교 정원 (오르골 + 피아노 + 뉴에이지 패드)
        ("E2", ["E3", "B3", "F#4", "G4"], ["E4", "G4", "B4"]),       # Em9
        ("C2", ["C3", "G3", "D4", "E4"], ["E4", "G4", "B4"]),        # Cmaj9
        ("D2", ["D3", "A3", "E4", "F#4"], ["D4", "F#4", "A4"]),      # Dadd9
        ("B1", ["B2", "F#3", "A3", "D4"], ["D4", "F#4", "B4"]),      # Bm7
        ("C2", ["C3", "G3", "B3", "E4"], ["C4", "E4", "G4"]),        # Cmaj7
        ("A2", ["A2", "E3", "B3", "C4"], ["C4", "E4", "A4"]),        # Am9
        ("B1", ["B2", "F#3", "B3", "E4"], ["E4", "F#4", "B4"]),      # Bsus4
        ("B1", ["B2", "F#3", "A3", "D#4"], ["D#4", "F#4", "B4"]),    # B7
        # A' (8..15): 플루트와 하프가 어우러지며 피어나는 그리움
        ("E2", ["E3", "B3", "F#4", "G4"], ["E4", "G4", "B4"]),       # Em9
        ("D2", ["D3", "A3", "D4", "F#4"], ["D4", "F#4", "A4"]),      # D
        ("C2", ["C3", "G3", "D4", "E4"], ["E4", "G4", "B4"]),        # Cmaj9
        ("G2", ["G2", "D3", "A3", "B3"], ["D4", "G4", "B4"]),        # Gadd9
        ("A2", ["A2", "E3", "B3", "C4"], ["C4", "E4", "G4"]),        # Am9
        ("B1", ["B2", "F#3", "A3", "D4"], ["D4", "F#4", "A4"]),      # Bm7
        ("C2", ["C3", "G3", "B3", "E4"], ["E4", "G4", "B4"]),        # Cmaj7
        ("D2", ["D3", "A3", "D4", "G4"], ["D4", "G4", "A4"]),        # Dsus4 -> G Major!
        # B (16..23): G Major — 에레브 여제의 정원처럼 맑고 눈부신 추억
        ("G2", ["G2", "D3", "A3", "B3"], ["D4", "G4", "B4"]),        # Gadd9
        ("D2", ["D3", "A3", "E4", "F#4"], ["D4", "F#4", "A4"]),      # Dadd9/F#
        ("E2", ["E3", "B3", "F#4", "G4"], ["E4", "G4", "B4"]),       # Em9
        ("B1", ["B2", "F#3", "A3", "D4"], ["D4", "F#4", "B4"]),      # Bm7
        ("C2", ["C3", "G3", "D4", "E4"], ["E4", "G4", "B4"]),        # Cmaj9
        ("G2", ["G2", "D3", "G3", "B3"], ["D4", "G4", "B4"]),        # G/B
        ("A2", ["A2", "E3", "B3", "C4"], ["C4", "E4", "G4"]),        # Am9
        ("D2", ["D3", "A3", "C4", "F#4"], ["C4", "F#4", "A4"]),      # D7
        # B' (24..31): 아련하게 부풀어 오른 뒤 달빛 고요 속으로 귀환
        ("C2", ["C3", "G3", "D4", "E4"], ["E4", "G4", "B4"]),        # Cmaj9
        ("D2", ["D3", "A3", "E4", "F#4"], ["D4", "F#4", "A4"]),      # Dadd9
        ("B1", ["B2", "F#3", "A3", "D4"], ["D4", "F#4", "B4"]),      # Bm7
        ("E2", ["E3", "B3", "F#4", "G4"], ["E4", "G4", "B4"]),       # Em9
        ("A2", ["A2", "E3", "B3", "C4"], ["C4", "E4", "G4"]),        # Am9
        ("C2", ["C3", "G3", "B3", "E4"], ["C4", "E4", "G4"]),        # Cmaj7
        ("B1", ["B2", "F#3", "B3", "E4"], ["E4", "F#4", "B4"]),      # Bsus4
        ("B1", ["B2", "F#3", "A3", "D#4"], ["D#4", "F#4", "B4"]),    # B7 -> Em9
    ]

    # Singing, nostalgic melody — delicate leaps & gentle syncopation (Ellinia / Queen's Garden feel)
    melody = [
        # A (0..7) — played tenderly by Flute + Music Box sparkle
        (0, 0.5, 1.0, "B4", 72), (0, 1.5, 0.5, "E5", 76), (0, 2.0, 1.5, "F#5", 80), (0, 3.5, 0.5, "G5", 78),
        (1, 0.0, 2.0, "F#5", 78), (1, 2.0, 1.0, "E5", 74), (1, 3.0, 1.0, "D5", 72),
        (2, 0.0, 1.5, "E5", 76), (2, 1.5, 0.5, "F#5", 78), (2, 2.0, 2.0, "A5", 82),
        (3, 0.0, 2.5, "F#5", 76), (3, 3.0, 1.0, "D5", 70),
        (4, 0.0, 1.5, "E5", 78), (4, 1.5, 0.5, "G5", 82), (4, 2.0, 1.5, "B5", 84), (4, 3.5, 0.5, "A5", 80),
        (5, 0.0, 1.5, "G5", 78), (5, 1.5, 0.5, "F#5", 74), (5, 2.0, 2.0, "E5", 74),
        (6, 0.0, 2.0, "F#5", 76), (6, 2.0, 1.5, "E5", 72), (6, 3.5, 0.5, "F#5", 70),
        (7, 0.0, 3.0, "D#5", 72), (7, 3.5, 0.5, "E5", 70),
        # A' (8..15) — warm expansion, Flute + Violin echo
        (8, 0.0, 1.5, "G5", 82), (8, 1.5, 0.5, "F#5", 80), (8, 2.0, 1.5, "E5", 78), (8, 3.5, 0.5, "B4", 74),
        (9, 0.0, 1.5, "A5", 86), (9, 1.5, 0.5, "G5", 82), (9, 2.0, 2.0, "F#5", 80),
        (10, 0.0, 1.5, "G5", 84), (10, 1.5, 0.5, "A5", 86), (10, 2.0, 1.5, "B5", 88), (10, 3.5, 0.5, "A5", 84),
        (11, 0.0, 2.5, "G5", 82), (11, 2.5, 0.5, "F#5", 78), (11, 3.0, 1.0, "D5", 74),
        (12, 0.0, 1.5, "E5", 80), (12, 1.5, 0.5, "F#5", 82), (12, 2.0, 1.5, "G5", 84), (12, 3.5, 0.5, "E5", 78),
        (13, 0.0, 2.0, "F#5", 82), (13, 2.0, 1.5, "D5", 76), (13, 3.5, 0.5, "E5", 74),
        (14, 0.0, 1.5, "G5", 84), (14, 1.5, 0.5, "F#5", 82), (14, 2.0, 2.0, "E5", 80),
        (15, 0.0, 2.5, "A5", 86), (15, 3.0, 1.0, "G5", 82),
        # B (16..23) — G Major sunlit Ereve Queen's Garden bloom
        (16, 0.0, 1.5, "B5", 90), (16, 1.5, 0.5, "A5", 88), (16, 2.0, 1.5, "G5", 86), (16, 3.5, 0.5, "D5", 80),
        (17, 0.0, 1.5, "A5", 88), (17, 1.5, 0.5, "G5", 86), (17, 2.0, 2.0, "F#5", 84),
        (18, 0.0, 1.5, "G5", 86), (18, 1.5, 0.5, "F#5", 84), (18, 2.0, 1.5, "E5", 82), (18, 3.5, 0.5, "B4", 76),
        (19, 0.0, 2.5, "F#5", 84), (19, 3.0, 1.0, "D5", 78),
        (20, 0.0, 1.0, "E5", 82), (20, 1.0, 1.0, "G5", 86), (20, 2.0, 1.5, "B5", 90), (20, 3.5, 0.5, "C6", 88),
        (21, 0.0, 2.0, "B5", 88), (21, 2.0, 1.5, "G5", 84), (21, 3.5, 0.5, "D5", 78),
        (22, 0.0, 1.5, "E5", 84), (22, 1.5, 0.5, "G5", 86), (22, 2.0, 2.0, "F#5", 84),
        (23, 0.0, 2.5, "A5", 88), (23, 3.0, 1.0, "B5", 86),
        # B' (24..31) — heartfelt peak then drifting back into Ellinia moonlight
        (24, 0.0, 1.5, "C6", 90), (24, 1.5, 0.5, "B5", 88), (24, 2.0, 1.5, "G5", 84), (24, 3.5, 0.5, "E5", 80),
        (25, 0.0, 1.5, "A5", 88), (25, 1.5, 0.5, "G5", 84), (25, 2.0, 2.0, "F#5", 82),
        (26, 0.0, 1.5, "B5", 88), (26, 1.5, 0.5, "A5", 84), (26, 2.0, 1.5, "F#5", 80), (26, 3.5, 0.5, "D5", 76),
        (27, 0.0, 2.5, "G5", 82), (27, 3.0, 1.0, "E5", 76),
        (28, 0.0, 1.5, "F#5", 80), (28, 1.5, 0.5, "G5", 82), (28, 2.0, 1.5, "E5", 78), (28, 3.5, 0.5, "C5", 74),
        (29, 0.0, 2.0, "E5", 78), (29, 2.0, 2.0, "G5", 78),
        (30, 0.0, 2.0, "F#5", 76), (30, 2.0, 2.0, "E5", 72),
        (31, 0.0, 3.0, "D#5", 70),
    ]

    # Instruments: Ellinia / Ereve signature crystalline + warm airy palette
    piano = MidiTrack(0, 0, "Piano", volume=92, pan=54, reverb=76, chorus=18)
    flute = MidiTrack(1, 73, "Flute", volume=92, pan=68, reverb=84, chorus=26)
    musicbox = MidiTrack(2, 10, "MusicBox", volume=74, pan=36, reverb=92, chorus=34)
    celesta = MidiTrack(3, 8, "Celesta", volume=72, pan=92, reverb=90, chorus=30)
    harp = MidiTrack(4, 46, "Harp", volume=84, pan=82, reverb=82, chorus=18)
    newage = MidiTrack(5, 88, "NewAgePad", volume=64, pan=64, reverb=96, chorus=42)
    strings = MidiTrack(6, 49, "SlowStrings", volume=68, pan=60, reverb=92, chorus=32)
    violin = MidiTrack(7, 40, "SoloViolin", volume=74, pan=58, reverb=84, chorus=22)
    cello = MidiTrack(8, 42, "Cello", volume=74, pan=42, reverb=80, chorus=18)

    for cycle in range(2):
        base = cycle * loop_beats
        for bar_i, (bass_n, arp_names, pad_names) in enumerate(prog):
            b0 = base + bar_i * beats_per_bar
            arp = chord_notes(arp_names)
            pad = chord_notes(pad_names)
            bass_p = N(bass_n)

            # 1) Flowing Ellinia Piano 8th-note dewdrop arpeggio (gentle 1-5-9-10 wave)
            p_seq = [arp[0], arp[1], arp[2], arp[3], arp[2], arp[1], arp[3], arp[2]]
            piano.note(b0, 3.85, bass_p, 62 + rng.randint(-3, 3))
            for step_i, p in enumerate(p_seq):
                vel = (64 if step_i % 4 == 0 else 50 + (step_i % 2) * 6) + rng.randint(-3, 3)
                piano.note(b0 + step_i * 0.5, 1.15, p, vel, rng.randint(-6, 6))

            # 2) Dreamy New Age Pad (that unmistakable 2005 Ellinia forest magic)
            pad_vel = 52 if bar_i < 16 else 58
            for p in pad:
                newage.note(b0, 3.92, p, pad_vel)
            if bar_i % 2 == 0:
                newage.swell(b0, 7.8, low=82, peak=116, steps=10)

            # 3) Music Box crystalline droplets (bars 0..7 exposed & B' nostalgia return)
            if bar_i < 8 or bar_i >= 24 or bar_i in (16, 20):
                mb_notes = [arp[3] + 12, arp[2] + 12, arp[1] + 12, arp[3] + 12]
                for i, off in enumerate((0.0, 1.0, 2.5, 3.5)):
                    if bar_i >= 16 and i in (1, 3):
                        continue
                    musicbox.note(b0 + off, 1.4, mb_notes[i], 58 + rng.randint(-4, 4), rng.randint(-5, 5))

            # 4) Celesta high starlight chimes on phrase openings
            if bar_i in (0, 4, 8, 12, 15, 16, 20, 24, 28, 30):
                for idx, p in enumerate((arp[2] + 12, arp[3] + 12, arp[1] + 24)):
                    celesta.note(b0 + idx * 0.5, 1.8, p, 54 - idx * 4, rng.randint(-4, 4))

            # 5) Harp graceful upward sweeps from A' onward
            if bar_i >= 8:
                if bar_i % 2 == 0:
                    h_seq = [arp[0], arp[1], arp[2], arp[3], arp[1] + 12, arp[2] + 12]
                    for idx, p in enumerate(h_seq):
                        harp.note(b0 + idx * 0.25, 1.4, p, 58 + idx * 2, rng.randint(-4, 4))
                else:
                    harp.note(b0 + 2.0, 1.6, arp[2] + 12, 54)
                    harp.note(b0 + 3.0, 1.4, arp[3] + 12, 52)

            # 6) Warm Slow Strings blooming in A' & B
            if bar_i >= 8:
                s_vel = 62 if bar_i >= 16 else 52
                for p in pad:
                    strings.note(b0, 3.9, p + (12 if bar_i >= 16 and p == pad[-1] else 0), s_vel)
                if bar_i % 2 == 0:
                    strings.swell(b0, 7.8, low=78, peak=118, steps=10)

            # 7) Warm Cello lyrical bass line
            if bar_i >= 8:
                cello.note(b0, 3.8, bass_p + 12, 62 if bar_i >= 16 else 54)

        # Melody voicing: Flute leads tenderly; Solo Violin enters in B for Queen's Garden elegance
        for bar_i, beat_in, dur, note_name, vel in melody:
            t = base + bar_i * beats_per_bar + beat_in
            p = N(note_name)
            if bar_i < 8:
                # Section A: delicate Flute + Music Box unison shimmer
                flute.note(t, dur * 0.94, p, int(vel * 0.90) + rng.randint(-2, 2), rng.randint(-5, 5))
                musicbox.note(t, min(dur, 1.2), p, int(vel * 0.62))
            elif bar_i < 16:
                # Section A': fuller Flute + light Celesta kiss on strong beats
                flute.note(t, dur * 0.95, p, vel + rng.randint(-2, 2), rng.randint(-4, 4))
                if beat_in in (0.0, 2.0):
                    celesta.note(t, 1.1, p, int(vel * 0.56))
            elif bar_i < 24:
                # Section B: Flute + Solo Violin warm duet
                flute.note(t, dur * 0.95, p, int(vel * 0.92) + rng.randint(-2, 2))
                violin.note(t, dur * 0.93, p, int(vel * 0.78) + rng.randint(-2, 2))
            else:
                # Section B': Violin leads bars 24..27, then Flute + Music Box fade softly home
                if bar_i < 28:
                    violin.note(t, dur * 0.94, p, int(vel * 0.84))
                    flute.note(t, dur * 0.94, p, int(vel * 0.84))
                else:
                    flute.note(t, dur * 0.94, p, int(vel * 0.88))
                    musicbox.note(t, min(dur, 1.3), p, int(vel * 0.68))

    write_midi(
        midi_path,
        bpm,
        4,
        4,
        [piano, flute, musicbox, celesta, harp, newage, strings, violin, cello],
        loop_beats * 2,
    )
    loop_sec = loop_beats * (60.0 / bpm)
    return loop_sec, loop_sec * 2


# ==================== SONG 2: 빗방울 숲의 모험가 (Ereve Field — Raindrop Flower / Drill Hall) ====================
# B minor -> D major -> B minor | 4/4 Lyrical Adventure Field | 122 BPM | 32 bars (128 beats = 62.95s loop)
def build_battle(midi_path: str) -> tuple[float, float]:
    rng = random.Random(200702)
    bpm = 122.0
    beats_per_bar = 4
    bars = 32
    loop_beats = bars * beats_per_bar  # 128 beats -> 62.95s

    # Bright-yet-wistful Ereve Field / Raindrop Flower harmony (Bm -> D Major)
    # (bass, [4-note raindrop piano/pizz chord], [3-note string pad])
    prog = [
        # A (0..7): B minor — 빗방울 떨어지는 에레브 외곽 숲길, 경쾌하고 신비로운 모험의 시작
        ("B2", ["B3", "D4", "F#4", "A4"], ["B3", "D4", "F#4"]),      # Bm7
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("A2", ["A3", "C#4", "E4", "A4"], ["A3", "C#4", "E4"]),      # A
        ("F#2", ["F#3", "A3", "C#4", "F#4"], ["A3", "C#4", "F#4"]),  # F#m7
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("E2", ["E3", "G3", "B3", "D4"], ["G3", "B3", "E4"]),        # Em7
        ("F#2", ["F#3", "B3", "C#4", "F#4"], ["B3", "C#4", "F#4"]),  # F#sus4
        ("F#2", ["F#3", "A#3", "C#4", "E4"], ["A#3", "C#4", "F#4"]), # F#7
        # A' (8..15): 바이올린 합류, 숲을 달리는 발걸음에 바람이 실림
        ("B2", ["B3", "D4", "F#4", "A4"], ["B3", "D4", "F#4"]),      # Bm7
        ("A2", ["A3", "C#4", "E4", "G4"], ["A3", "C#4", "E4"]),      # A/C#
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("D2", ["D3", "F#3", "A3", "D4"], ["A3", "D4", "F#4"]),      # D
        ("E2", ["E3", "G3", "B3", "D4"], ["G3", "B3", "E4"]),        # Em7
        ("F#2", ["F#3", "A3", "C#4", "E4"], ["A3", "C#4", "F#4"]),   # F#m7
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("A2", ["A3", "D4", "E4", "A4"], ["A3", "D4", "E4"]),        # Asus4 -> D Major!
        # B (16..23): D Major — 구름 사이로 햇살이 쏟아지는 에레브 필드의 모험 후렴!
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("A2", ["A3", "C#4", "E4", "G4"], ["A3", "C#4", "E4"]),      # A6/7
        ("F#2", ["F#3", "A3", "C#4", "E4"], ["A3", "C#4", "F#4"]),   # F#m7
        ("B2", ["B3", "D4", "F#4", "A4"], ["B3", "D4", "F#4"]),      # Bm7
        ("E2", ["E3", "G3", "B3", "D4"], ["G3", "B3", "E4"]),        # Em7
        ("A2", ["A3", "C#4", "E4", "G4"], ["A3", "C#4", "E4"]),      # A7
        ("D2", ["D3", "F#3", "A3", "C#4"], ["A3", "D4", "F#4"]),     # Dmaj7
        ("F#2", ["F#3", "A#3", "C#4", "E4"], ["A#3", "C#4", "F#4"]), # F#7
        # B' (24..31): 가슴 벅찬 도약과 서정적 회귀
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("A2", ["A3", "C#4", "E4", "A4"], ["A3", "C#4", "E4"]),      # A
        ("B2", ["B3", "D4", "F#4", "A4"], ["B3", "D4", "F#4"]),      # Bm7
        ("F#2", ["F#3", "A3", "C#4", "E4"], ["A3", "C#4", "F#4"]),   # F#m7
        ("E2", ["E3", "G3", "B3", "D4"], ["G3", "B3", "E4"]),        # Em7
        ("G2", ["G3", "B3", "D4", "F#4"], ["B3", "D4", "G4"]),       # Gmaj7
        ("F#2", ["F#3", "B3", "C#4", "F#4"], ["B3", "C#4", "F#4"]),  # F#sus4
        ("F#2", ["F#3", "A#3", "C#4", "E4"], ["A#3", "C#4", "F#4"]), # F#7 -> Bm7
    ]

    # Catchy, skipping, bittersweet-bright Ereve field melody
    melody = [
        # A (0..7) — Flute singing above raindrop piano & pizzicato
        (0, 0.0, 0.75, "F#5", 82), (0, 0.75, 0.75, "B5", 86), (0, 1.5, 0.5, "A5", 84), (0, 2.0, 1.0, "F#5", 82), (0, 3.0, 1.0, "D5", 78),
        (1, 0.0, 1.5, "E5", 82), (1, 1.5, 0.5, "F#5", 84), (1, 2.0, 1.5, "D5", 80), (1, 3.5, 0.5, "B4", 76),
        (2, 0.0, 0.75, "C#5", 80), (2, 0.75, 0.75, "E5", 84), (2, 1.5, 0.5, "A5", 88), (2, 2.0, 2.0, "G5", 84),
        (3, 0.0, 2.0, "F#5", 82), (3, 2.0, 1.0, "E5", 78), (3, 3.0, 1.0, "C#5", 76),
        (4, 0.0, 0.75, "D5", 82), (4, 0.75, 0.75, "F#5", 86), (4, 1.5, 0.5, "B5", 90), (4, 2.0, 1.0, "A5", 86), (4, 3.0, 1.0, "F#5", 82),
        (5, 0.0, 1.5, "G5", 84), (5, 1.5, 0.5, "F#5", 82), (5, 2.0, 1.5, "E5", 80), (5, 3.5, 0.5, "D5", 78),
        (6, 0.0, 2.0, "F#5", 82), (6, 2.0, 1.0, "E5", 78), (6, 3.0, 1.0, "D5", 76),
        (7, 0.0, 2.5, "C#5", 80), (7, 3.0, 0.5, "D5", 78), (7, 3.5, 0.5, "E5", 80),
        # A' (8..15) — Violin joins Flute with brighter momentum
        (8, 0.0, 0.75, "F#5", 86), (8, 0.75, 0.75, "B5", 90), (8, 1.5, 0.5, "C#6", 92), (8, 2.0, 1.0, "B5", 88), (8, 3.0, 1.0, "F#5", 84),
        (9, 0.0, 1.5, "A5", 88), (9, 1.5, 0.5, "G5", 84), (9, 2.0, 2.0, "E5", 82),
        (10, 0.0, 0.75, "F#5", 86), (10, 0.75, 0.75, "G5", 88), (10, 1.5, 0.5, "B5", 92), (10, 2.0, 1.5, "A5", 88), (10, 3.5, 0.5, "F#5", 84),
        (11, 0.0, 2.5, "D5", 82), (11, 3.0, 0.5, "E5", 80), (11, 3.5, 0.5, "F#5", 82),
        (12, 0.0, 0.75, "G5", 86), (12, 0.75, 0.75, "B5", 90), (12, 1.5, 0.5, "A5", 86), (12, 2.0, 1.5, "G5", 84), (12, 3.5, 0.5, "E5", 80),
        (13, 0.0, 1.5, "F#5", 86), (13, 1.5, 0.5, "G5", 86), (13, 2.0, 2.0, "A5", 88),
        (14, 0.0, 1.0, "B5", 90), (14, 1.0, 1.0, "A5", 88), (14, 2.0, 1.0, "G5", 86), (14, 3.0, 1.0, "F#5", 84),
        (15, 0.0, 2.5, "E5", 86), (15, 3.0, 0.5, "F#5", 86), (15, 3.5, 0.5, "A5", 88),
        # B (16..23) — D Major radiant Ereve adventure chorus!
        (16, 0.0, 0.75, "B5", 94), (16, 0.75, 0.75, "A5", 90), (16, 1.5, 0.5, "F#5", 88), (16, 2.0, 1.0, "D5", 84), (16, 3.0, 1.0, "F#5", 88),
        (17, 0.0, 1.5, "A5", 92), (17, 1.5, 0.5, "B5", 94), (17, 2.0, 2.0, "A5", 90),
        (18, 0.0, 0.75, "A5", 90), (18, 0.75, 0.75, "F#5", 88), (18, 1.5, 0.5, "E5", 86), (18, 2.0, 1.5, "C#5", 84), (18, 3.5, 0.5, "E5", 84),
        (19, 0.0, 2.0, "F#5", 88), (19, 2.0, 1.0, "B5", 92), (19, 3.0, 1.0, "A5", 88),
        (20, 0.0, 0.75, "G5", 90), (20, 0.75, 0.75, "A5", 92), (20, 1.5, 0.5, "B5", 94), (20, 2.0, 1.5, "G5", 88), (20, 3.5, 0.5, "E5", 84),
        (21, 0.0, 1.5, "A5", 92), (21, 1.5, 0.5, "G5", 88), (21, 2.0, 2.0, "E5", 86),
        (22, 0.0, 1.5, "F#5", 90), (22, 1.5, 0.5, "A5", 92), (22, 2.0, 2.0, "D6", 94),
        (23, 0.0, 2.5, "C#6", 90), (23, 3.0, 1.0, "A#5", 86),
        # B' (24..31) — glorious soaring melody -> wistful return to Bm raindrop forest
        (24, 0.0, 0.75, "B5", 94), (24, 0.75, 0.75, "D6", 96), (24, 1.5, 0.5, "B5", 92), (24, 2.0, 1.5, "A5", 90), (24, 3.5, 0.5, "F#5", 86),
        (25, 0.0, 1.5, "A5", 92), (25, 1.5, 0.5, "B5", 92), (25, 2.0, 2.0, "E5", 86),
        (26, 0.0, 0.75, "F#5", 90), (26, 0.75, 0.75, "B5", 94), (26, 1.5, 0.5, "A5", 90), (26, 2.0, 1.5, "F#5", 86), (26, 3.5, 0.5, "D5", 82),
        (27, 0.0, 2.0, "E5", 86), (27, 2.0, 2.0, "C#5", 82),
        (28, 0.0, 0.75, "G5", 88), (28, 0.75, 0.75, "F#5", 86), (28, 1.5, 0.5, "E5", 84), (28, 2.0, 1.5, "D5", 82), (28, 3.5, 0.5, "B4", 78),
        (29, 0.0, 1.5, "D5", 84), (29, 1.5, 0.5, "F#5", 86), (29, 2.0, 2.0, "B5", 88),
        (30, 0.0, 2.0, "F#5", 84), (30, 2.0, 2.0, "E5", 80),
        (31, 0.0, 2.5, "C#5", 80), (31, 3.0, 0.5, "D5", 78), (31, 3.5, 0.5, "E5", 80),
    ]

    # Ereve Field instrument palette: sparkling, crisp, airy, never fatiguing!
    piano = MidiTrack(0, 0, "RaindropPiano", volume=92, pan=50, reverb=68, chorus=16)
    flute = MidiTrack(1, 73, "Flute", volume=92, pan=70, reverb=74, chorus=22)
    violin = MidiTrack(2, 40, "SoloViolin", volume=80, pan=56, reverb=72, chorus=20)
    glock = MidiTrack(3, 9, "Glockenspiel", volume=66, pan=90, reverb=84, chorus=26)
    pizz = MidiTrack(4, 45, "Pizzicato", volume=84, pan=36, reverb=56, chorus=12)
    harp = MidiTrack(5, 46, "Harp", volume=78, pan=84, reverb=74, chorus=16)
    strings = MidiTrack(6, 48, "Strings", volume=70, pan=64, reverb=82, chorus=26)
    cello = MidiTrack(7, 42, "Cello", volume=78, pan=44, reverb=66, chorus=14)
    drums = MidiTrack(9, None, "LightPerc", volume=70, pan=64, reverb=42, chorus=0)

    for cycle in range(2):
        base = cycle * loop_beats
        for bar_i, (bass_n, ch_names, pad_names) in enumerate(prog):
            b0 = base + bar_i * beats_per_bar
            ch = chord_notes(ch_names)
            pad = chord_notes(pad_names)
            bass_p = N(bass_n)

            # 1) Signature "Raindrop Flower" sparkling piano pattern (crisp 8th-note skipping motif!)
            # Low bass anchor + sparkling upper-register raindrops
            piano.note(b0, 1.85, bass_p, 68 + rng.randint(-3, 3))
            piano.note(b0 + 2.0, 1.85, bass_p + 7, 60 + rng.randint(-3, 3))
            drop_seq = [ch[0], ch[2], ch[3], ch[1], ch[2], ch[3], ch[0] + 12, ch[2]]
            for step_i, p in enumerate(drop_seq):
                accent = 66 if step_i in (0, 3, 6) else 54
                piano.note(b0 + step_i * 0.5, 0.58, p, accent + rng.randint(-3, 3), rng.randint(-5, 5))

            # 2) Bouncy Ereve Pizzicato stride (quarter + offbeat bounce)
            pizz.note(b0 + 0.0, 0.35, bass_p + 12, 74)
            pizz.note(b0 + 0.5, 0.30, ch[1], 56)
            pizz.note(b0 + 1.0, 0.35, ch[2], 64)
            pizz.note(b0 + 1.5, 0.30, ch[0], 54)
            pizz.note(b0 + 2.0, 0.35, bass_p + 12, 72)
            pizz.note(b0 + 2.5, 0.30, ch[2], 58)
            pizz.note(b0 + 3.0, 0.35, ch[3], 64)
            pizz.note(b0 + 3.5, 0.30, ch[1], 56)

            # 3) Glockenspiel crystalline raindrop sparkles (classic Ereve charm!)
            if bar_i % 2 == 0 or bar_i >= 16:
                glock.note(b0 + 0.5, 0.85, ch[3] + 12, 54 + rng.randint(-3, 3))
                glock.note(b0 + 2.5, 0.85, ch[2] + 12, 50 + rng.randint(-3, 3))
                if bar_i in (0, 4, 8, 16, 20, 24, 28):
                    glock.note(b0 + 3.5, 0.9, ch[1] + 24, 48)

            # 4) Harp uplifting glissando accent on phrase transitions
            if bar_i in (0, 7, 8, 15, 16, 23, 24, 31):
                h_notes = [ch[0], ch[1], ch[2], ch[3], ch[1] + 12, ch[2] + 12]
                for idx, p in enumerate(h_notes):
                    harp.note(b0 + (2.5 if bar_i in (7, 15, 23, 31) else 0.0) + idx * 0.18, 0.9, p, 58 + idx * 2)

            # 5) Cello warm walking/sustained foundation
            cello.note(b0, 1.9, bass_p, 72 if bar_i >= 16 else 64)
            cello.note(b0 + 2.0, 1.9, bass_p + (7 if bar_i % 2 == 0 else 12), 66 if bar_i >= 16 else 58)

            # 6) Sweeping String Ensemble blooming in A' & full glory in B
            if bar_i >= 8:
                s_vel = 68 if bar_i >= 16 else 54
                for p in pad:
                    strings.note(b0, 3.9, p + 12, s_vel)
                if bar_i % 2 == 0:
                    strings.swell(b0, 7.8, low=82, peak=120, steps=10)

            # 7) Light, crisp Ereve adventure percussion (NO heavy metal stomp — breezy tambourine/shaker/rim!)
            # Soft kick on 1 & 3, gentle sidestick/snare brush, crisp tambourine & shaker!
            drums.note(b0 + 0.0, 0.25, 36, 68 if bar_i >= 8 else 56)   # Soft Kick
            drums.note(b0 + 2.0, 0.25, 36, 64 if bar_i >= 8 else 52)
            if bar_i >= 8:
                drums.note(b0 + 2.5, 0.2, 36, 52)
            # Crisp rimshot / light snare
            snare_note = 38 if bar_i >= 16 else 37  # 37=Side Stick (gentle forest tap), 38=Light Snare in chorus
            snare_vel = 56 if bar_i >= 16 else 62
            drums.note(b0 + 1.0, 0.2, snare_note, snare_vel)
            drums.note(b0 + 3.0, 0.2, snare_note, snare_vel + 4)
            # Breezy 8th-note shaker (70=Maracas / 82=Shaker) + Tambourine (54) on offbeats
            for h_i in range(8):
                drums.note(b0 + h_i * 0.5, 0.15, 70, 44 if h_i % 2 == 0 else 32)
            if bar_i >= 8:
                drums.note(b0 + 1.0, 0.25, 54, 52)
                drums.note(b0 + 3.0, 0.25, 54, 54)
            if bar_i in (15, 23, 31):
                # Light delicate fill (triangle 81 + soft snare pickup)
                drums.note(b0 + 3.0, 0.4, 81, 56)
                drums.note(b0 + 3.5, 0.2, 38, 52)
                drums.note(b0 + 3.75, 0.2, 38, 60)

        # Lead Melody: Flute crystal-clear lead + Violin joins in A' and soars in B
        for bar_i, beat_in, dur, note_name, vel in melody:
            t = base + bar_i * beats_per_bar + beat_in
            p = N(note_name)
            flute.note(t, dur * 0.93, p, int(vel * 0.94) + rng.randint(-2, 2), rng.randint(-4, 4))
            if bar_i >= 8:
                v_scale = 0.84 if bar_i >= 16 else 0.66
                violin.note(t, dur * 0.92, p, int(vel * v_scale) + rng.randint(-2, 2))
            if bar_i < 8 and beat_in == 0.0:
                glock.note(t, min(dur, 0.8), p, int(vel * 0.55))

    write_midi(
        midi_path,
        bpm,
        4,
        4,
        [piano, flute, violin, glock, pizz, harp, strings, cello, drums],
        loop_beats * 2,
    )
    loop_sec = loop_beats * (60.0 / bpm)
    return loop_sec, loop_sec * 2


# ==================== SONG 3: 시간이 멈춘 회랑 (Temple of Time — Remembrance / Oblivion Boss) ====================
# D minor (harmonic/natural) -> F major tragic peak -> D minor | 4/4 | 128 BPM | 32 bars (128 beats = 60.00s loop)
def build_boss(midi_path: str) -> tuple[float, float]:
    rng = random.Random(200803)
    bpm = 128.0
    beats_per_bar = 4
    bars = 32
    loop_beats = bars * beats_per_bar  # 128 beats -> exact 60.00s

    # Temple of Time solemn, tragic, chilling progression (Dm descending bass + harmonic minor tension)
    # (bass, [4-note clockwork piano ostinato], [3-note choir/string voicing], bell_note_or_None)
    prog = [
        # A (0..7): 시간이 멈춘 회랑 — 튜뷸러 벨, 시계태엽 피아노, 차가운 바이올린
        ("D2", ["D3", "A3", "D4", "F4"], ["D4", "F4", "A4"], "D5"),        # Dm
        ("C2", ["C3", "A3", "D4", "F4"], ["C4", "F4", "A4"], None),        # Dm/C
        ("Bb1", ["Bb2", "F3", "C4", "D4"], ["D4", "F4", "Bb4"], "Bb4"),    # Bbmaj9
        ("A1", ["A2", "E3", "G3", "C#4"], ["C#4", "E4", "A4"], "A4"),      # A7
        ("G2", ["G2", "D3", "A3", "Bb3"], ["D4", "G4", "Bb4"], "G4"),      # Gm9
        ("F2", ["F2", "D3", "A3", "D4"], ["D4", "F4", "A4"], None),        # Dm/F
        ("E2", ["E2", "Bb2", "D3", "G3"], ["D4", "G4", "Bb4"], "E5"),      # Em7b5 (Gm/E)
        ("A1", ["A2", "E3", "A3", "C#4"], ["C#4", "E4", "A4"], "A4"),      # A7
        # A' (8..15): 합창과 팀파니, 시계바늘이 가속되는 긴장감
        ("D2", ["D3", "A3", "D4", "F4"], ["D4", "F4", "A4"], "D5"),        # Dm
        ("C2", ["C3", "G3", "C4", "E4"], ["C4", "E4", "G4"], None),        # C
        ("Bb1", ["Bb2", "F3", "Bb3", "D4"], ["D4", "F4", "Bb4"], "F5"),    # Bb
        ("A1", ["A2", "E3", "A3", "C#4"], ["C#4", "E4", "A4"], "E5"),      # A
        ("G2", ["G2", "D3", "G3", "Bb3"], ["D4", "G4", "Bb4"], "D5"),      # Gm
        ("A1", ["A2", "E3", "A3", "C4"], ["C4", "E4", "A4"], None),        # Am
        ("Bb1", ["Bb2", "F3", "Bb3", "D4"], ["D4", "F4", "Bb4"], "Bb4"),   # Bb
        ("A1", ["A2", "E3", "G3", "C#4"], ["C#4", "E4", "A4"], "A4"),      # A7
        # B (16..23): 추억과 망각의 절정 — 비장하고 눈물 나는 오케스트라 + 대성당 합창
        ("Bb1", ["Bb2", "F3", "C4", "D4"], ["D4", "F4", "Bb4"], "F5"),     # Bbmaj9
        ("C2", ["C3", "G3", "D4", "E4"], ["E4", "G4", "C5"], "G5"),        # Cadd9
        ("A1", ["A2", "E3", "A3", "C4"], ["C4", "E4", "A4"], "E5"),        # Am7
        ("D2", ["D3", "A3", "D4", "F4"], ["D4", "F4", "A4"], "D5"),        # Dm
        ("G2", ["G2", "D3", "A3", "Bb3"], ["D4", "G4", "Bb4"], "G5"),      # Gm9
        ("C2", ["C3", "G3", "C4", "E4"], ["C4", "E4", "G4"], None),        # C
        ("F2", ["F2", "C3", "G3", "A3"], ["C4", "F4", "A4"], "F5"),        # Fmaj9
        ("A1", ["A2", "E3", "G3", "C#4"], ["C#4", "E4", "A4"], "E5"),      # A7
        # C (24..31): 심판의 시계탑 — 하강 베이스와 절규하는 바이올린 후 영원의 루프로
        ("D2", ["D3", "A3", "D4", "F4"], ["D4", "F4", "A4"], "A5"),        # Dm
        ("C2", ["C3", "A3", "D4", "F4"], ["C4", "F4", "A4"], None),        # Dm/C
        ("Bb1", ["Bb2", "F3", "Bb3", "D4"], ["D4", "F4", "Bb4"], "F5"),    # Bb
        ("A1", ["A2", "E3", "A3", "C#4"], ["C#4", "E4", "A4"], "E5"),      # A
        ("G2", ["G2", "D3", "G3", "Bb3"], ["D4", "G4", "Bb4"], "D5"),      # Gm
        ("E2", ["E2", "Bb2", "D3", "G3"], ["D4", "G4", "Bb4"], None),      # Em7b5
        ("A1", ["A2", "E3", "A3", "D4"], ["D4", "E4", "A4"], "A4"),        # Asus4
        ("A1", ["A2", "E3", "G3", "C#4"], ["C#4", "E4", "A4"], "E5"),      # A7 -> Dm
    ]

    # Haunting, tragic, unforgettable Temple-of-Time boss melody
    melody = [
        # A (0..7) — solitary, icy, aching Solo Violin
        (0, 0.0, 1.5, "A5", 86), (0, 1.5, 0.5, "Bb5", 88), (0, 2.0, 1.5, "A5", 86), (0, 3.5, 0.5, "F5", 82),
        (1, 0.0, 2.0, "G5", 84), (1, 2.0, 1.5, "F5", 82), (1, 3.5, 0.5, "E5", 80),
        (2, 0.0, 1.5, "F5", 86), (2, 1.5, 0.5, "G5", 88), (2, 2.0, 2.0, "D5", 82),
        (3, 0.0, 2.5, "E5", 84), (3, 3.0, 1.0, "C#5", 80),
        (4, 0.0, 1.5, "D5", 84), (4, 1.5, 0.5, "F5", 86), (4, 2.0, 1.5, "Bb5", 90), (4, 3.5, 0.5, "A5", 86),
        (5, 0.0, 2.0, "A5", 88), (5, 2.0, 1.5, "F5", 84), (5, 3.5, 0.5, "D5", 80),
        (6, 0.0, 1.5, "G5", 86), (6, 1.5, 0.5, "F5", 84), (6, 2.0, 2.0, "E5", 82),
        (7, 0.0, 3.0, "A5", 88), (7, 3.5, 0.5, "G5", 84),
        # A' (8..15) — rising urgency as Choir & Timpani enter
        (8, 0.0, 1.0, "F5", 88), (8, 1.0, 1.0, "A5", 92), (8, 2.0, 1.5, "D6", 96), (8, 3.5, 0.5, "C6", 92),
        (9, 0.0, 1.5, "C6", 92), (9, 1.5, 0.5, "Bb5", 90), (9, 2.0, 2.0, "G5", 88),
        (10, 0.0, 1.5, "Bb5", 92), (10, 1.5, 0.5, "C6", 94), (10, 2.0, 1.5, "D6", 96), (10, 3.5, 0.5, "Bb5", 90),
        (11, 0.0, 2.5, "A5", 92), (11, 3.0, 1.0, "G5", 88),
        (12, 0.0, 1.5, "G5", 90), (12, 1.5, 0.5, "A5", 92), (12, 2.0, 1.5, "Bb5", 94), (12, 3.5, 0.5, "G5", 88),
        (13, 0.0, 2.0, "A5", 90), (13, 2.0, 2.0, "E5", 86),
        (14, 0.0, 1.5, "F5", 88), (14, 1.5, 0.5, "G5", 90), (14, 2.0, 2.0, "A5", 92),
        (15, 0.0, 2.5, "C#6", 94), (15, 3.0, 1.0, "A5", 90),
        # B (16..23) — soaring, heartbreaking Temple of Time climax!
        (16, 0.0, 1.5, "D6", 98), (16, 1.5, 0.5, "C6", 94), (16, 2.0, 1.5, "Bb5", 94), (16, 3.5, 0.5, "F5", 88),
        (17, 0.0, 1.5, "C6", 96), (17, 1.5, 0.5, "D6", 98), (17, 2.0, 2.0, "G5", 92),
        (18, 0.0, 1.5, "A5", 94), (18, 1.5, 0.5, "C6", 96), (18, 2.0, 1.5, "E6", 98), (18, 3.5, 0.5, "C6", 94),
        (19, 0.0, 2.5, "D6", 96), (19, 3.0, 1.0, "A5", 90),
        (20, 0.0, 1.5, "Bb5", 94), (20, 1.5, 0.5, "C6", 96), (20, 2.0, 1.5, "D6", 98), (20, 3.5, 0.5, "Bb5", 92),
        (21, 0.0, 1.5, "C6", 94), (21, 1.5, 0.5, "Bb5", 92), (21, 2.0, 2.0, "G5", 90),
        (22, 0.0, 1.5, "A5", 94), (22, 1.5, 0.5, "C6", 96), (22, 2.0, 2.0, "F6", 98),
        (23, 0.0, 2.5, "E6", 96), (23, 3.0, 1.0, "C#6", 92),
        # C (24..31) — tragic, relentless boss culmination returning to frozen corridor
        (24, 0.0, 1.0, "D6", 98), (24, 1.0, 1.0, "A5", 94), (24, 2.0, 1.0, "F5", 90), (24, 3.0, 1.0, "D6", 96),
        (25, 0.0, 1.5, "C6", 94), (25, 1.5, 0.5, "Bb5", 92), (25, 2.0, 2.0, "A5", 90),
        (26, 0.0, 1.5, "Bb5", 94), (26, 1.5, 0.5, "A5", 92), (26, 2.0, 1.5, "F5", 88), (26, 3.5, 0.5, "D5", 84),
        (27, 0.0, 2.0, "E5", 88), (27, 2.0, 2.0, "A5", 92),
        (28, 0.0, 1.0, "Bb5", 92), (28, 1.0, 1.0, "A5", 90), (28, 2.0, 1.0, "G5", 88), (28, 3.0, 1.0, "F5", 86),
        (29, 0.0, 2.0, "G5", 88), (29, 2.0, 2.0, "Bb5", 90),
        (30, 0.0, 2.0, "A5", 90), (30, 2.0, 2.0, "G5", 86),
        (31, 0.0, 3.0, "E5", 86), (31, 3.5, 0.5, "G5", 84),
    ]

    # Temple of Time instrument palette: crystalline bells + hypnotic piano + tragic strings + cathedral choir
    piano = MidiTrack(0, 0, "ClockworkPiano", volume=92, pan=52, reverb=78, chorus=16)
    violin = MidiTrack(1, 40, "SoloViolin", volume=92, pan=62, reverb=78, chorus=20)
    strings = MidiTrack(2, 48, "Strings", volume=82, pan=64, reverb=84, chorus=26)
    bells = MidiTrack(3, 14, "TubularBells", volume=74, pan=34, reverb=96, chorus=24)
    celesta = MidiTrack(4, 8, "Celesta", volume=72, pan=92, reverb=92, chorus=28)
    choir = MidiTrack(5, 52, "ChoirAahs", volume=70, pan=64, reverb=96, chorus=34)
    organ = MidiTrack(6, 19, "CathedralOrgan", volume=52, pan=60, reverb=92, chorus=18)
    timpani = MidiTrack(7, 47, "Timpani", volume=86, pan=44, reverb=74, chorus=0)
    bass = MidiTrack(8, 43, "Contrabass", volume=84, pan=48, reverb=66, chorus=10)
    drums = MidiTrack(9, None, "ClockPerc", volume=72, pan=64, reverb=46, chorus=0)

    for cycle in range(2):
        base = cycle * loop_beats
        for bar_i, (bass_n, ch_names, pad_names, bell_n) in enumerate(prog):
            b0 = base + bar_i * beats_per_bar
            ch = chord_notes(ch_names)
            pad = chord_notes(pad_names)
            bass_p = N(bass_n)

            # 1) Hypnotic Temple of Time clockwork 8th-note Piano ostinato
            # Persistent, haunting broken-chord pulse driving the entire piece!
            piano.note(b0, 3.8, bass_p, 72 + rng.randint(-3, 3))
            clock_seq = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[3], ch[2]]
            for step_i, p in enumerate(clock_seq):
                vel = (72 if step_i % 4 == 0 else 58 + (step_i % 2) * 5) + rng.randint(-3, 3)
                piano.note(b0 + step_i * 0.5, 0.72, p, vel, rng.randint(-4, 4))

            # 2) Iconic Tubular Bells tolling across frozen time!
            if bell_n is not None:
                b_vel = 72 if bar_i >= 16 else 64
                bells.note(b0, 3.6, N(bell_n), b_vel)

            # 3) Crystalline Celesta ticking counter-sparkle (adds eerie Temple of Time shimmer)
            if bar_i < 8 or bar_i >= 24 or bar_i in (16, 20):
                celesta.note(b0 + 1.0, 0.9, ch[3] + 12, 54)
                celesta.note(b0 + 3.0, 0.9, ch[2] + 12, 50)
                if bar_i % 4 == 0:
                    celesta.note(b0 + 2.0, 1.1, ch[1] + 24, 52)

            # 4) Deep Contrabass solemn anchor
            bass.note(b0, 3.85, bass_p, 78 if bar_i >= 16 else 68)

            # 5) Timpani majestic heartbeat (enters gently in A, drives hard in A'/B/C)
            if bar_i < 8:
                if bar_i % 2 == 0:
                    timpani.note(b0, 1.2, bass_p + 12, 66)
            else:
                timpani.note(b0 + 0.0, 0.8, bass_p + 12, 84 if bar_i >= 16 else 74)
                timpani.note(b0 + 2.5, 0.6, bass_p + 12, 68)
                if bar_i in (7, 15, 23, 31):
                    for fi in range(4):
                        timpani.note(b0 + 3.0 + fi * 0.25, 0.3, bass_p + 12, 68 + fi * 8)

            # 6) Ethereal Cathedral Choir Aahs (soft halo in A', soaring tragedy in B & C)
            if bar_i >= 8:
                c_vel = 68 if bar_i >= 16 else 52
                for p in (pad[0] + 12, pad[2] + 12):
                    choir.note(b0, 3.9, p, c_vel)
                if bar_i % 2 == 0:
                    choir.swell(b0, 7.8, low=80, peak=120, steps=10)

            # 7) Subtle Pipe Organ cathedral depth (only in B & C, never overwhelming)
            if bar_i >= 16:
                for p in (bass_p + 12, pad[0], pad[2]):
                    organ.note(b0, 3.85, p, 56 if bar_i >= 24 else 48)

            # 8) String Ensemble harmonic bed beneath solo violin
            if bar_i >= 8:
                s_vel = 68 if bar_i >= 16 else 56
                for p in pad:
                    strings.note(b0, 3.9, p, s_vel)

            # 9) Clockwork Percussion: crisp ticking hi-hat/woodblock + driving solemn beat
            # Ticking hourglass pulse from bar 0!
            for h_i in range(8):
                # Subtle clock-tick hi-hat (42)
                drums.note(b0 + h_i * 0.5, 0.14, 42, 42 if h_i % 2 == 0 else 28)
            if bar_i < 8:
                # Sparse, hypnotic clockwork rim on beats 2 & 4
                drums.note(b0 + 1.0, 0.2, 37, 50)
                drums.note(b0 + 3.0, 0.2, 37, 54)
            else:
                # Urgent orchestral boss pulse
                drums.note(b0 + 0.0, 0.25, 36, 82 if bar_i >= 16 else 72)
                drums.note(b0 + 1.0, 0.22, 38, 66 if bar_i >= 16 else 58)
                drums.note(b0 + 2.0, 0.25, 36, 78 if bar_i >= 16 else 68)
                drums.note(b0 + 2.5, 0.20, 36, 64)
                drums.note(b0 + 3.0, 0.22, 38, 70 if bar_i >= 16 else 62)
                if bar_i in (16, 24):
                    drums.note(b0, 1.2, 49, 72)  # Crash on grand entrances
                if bar_i in (15, 23, 31):
                    for fi in range(4):
                        drums.note(b0 + 3.0 + fi * 0.25, 0.2, 38, 60 + fi * 6)

        # Tragic, singing Solo Violin + Strings octave bloom (tame >D6 for silky iPhone playback)
        for bar_i, beat_in, dur, note_name, vel in melody:
            t = base + bar_i * beats_per_bar + beat_in
            p = N(note_name)
            v_adj = vel - 12 if p >= N("E6") else (vel - 5 if p >= N("D6") else vel)
            violin.note(t, dur * 0.95, p, int(v_adj * 0.90) + rng.randint(-2, 2), rng.randint(-4, 4))
            if bar_i >= 8:
                s_p = p - 12 if p >= N("E6") else p
                strings.note(t, dur * 0.94, s_p, int(vel * (0.80 if bar_i >= 16 else 0.64)))
            if bar_i >= 16:
                strings.note(t, dur * 0.94, p - 12, int(vel * 0.66))

    write_midi(
        midi_path,
        bpm,
        4,
        4,
        [piano, violin, strings, bells, celesta, choir, organ, timpani, bass, drums],
        loop_beats * 2,
    )
    loop_sec = loop_beats * (60.0 / bpm)
    return loop_sec, loop_sec * 2


def render_track(name: str, builder, sf2: str, out_dir: str) -> None:
    os.makedirs(out_dir, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        mid = os.path.join(td, f"{name}.mid")
        wav = os.path.join(td, f"{name}.wav")
        mp3 = os.path.join(out_dir, f"{name}.mp3")

        loop_sec, total_sec = builder(mid)
        print(f"[{name}] MIDI written (loop={loop_sec:.3f}s, 2x={total_sec:.3f}s) -> rendering FluidSynth...")

        subprocess.run(
            [
                "fluidsynth",
                "-ni",
                "-g", "0.70",
                "-R", "1",
                "-C", "1",
                "-r", "44100",
                "-F", wav,
                sf2,
                mid,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Tail-wrap seamless loop slice: cut [loop_sec, 2 * loop_sec]
        # Master: clean sub, warm body, gentle upper-mid de-harsh, crystalline MapleStory sheen, -16 LUFS
        af = (
            "highpass=f=30,"
            "equalizer=f=220:t=q:w=1.1:g=1.2,"
            "equalizer=f=2800:t=q:w=1.4:g=-1.5,"
            "equalizer=f=8500:t=q:w=1.3:g=2.2,"
            "acompressor=threshold=-16dB:ratio=2.1:attack=18:release=160,"
            "loudnorm=I=-16:TP=-1.5:LRA=10"
        )
        subprocess.run(
            [
                "ffmpeg", "-y",
                "-ss", f"{loop_sec:.4f}",
                "-t", f"{loop_sec:.4f}",
                "-i", wav,
                "-af", af,
                "-c:a", "libmp3lame",
                "-b:a", "128k",
                "-ar", "44100",
                "-ac", "2",
                mp3,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        kb = os.path.getsize(mp3) / 1024
        print(f"[{name}] Mastered -> {mp3} ({kb:.1f} KB, {loop_sec:.2f}s seamless loop)")


def main() -> None:
    sf2 = find_sf2()
    print(f"Using SoundFont: {sf2}")
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
    render_track("bgm_academy", build_academy, sf2, out_dir)
    render_track("bgm_battle", build_battle, sf2, out_dir)
    render_track("bgm_boss", build_boss, sf2, out_dir)


if __name__ == "__main__":
    main()
