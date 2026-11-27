#!/usr/bin/env python3
"""
《마법학교 아스트라》 오리지널 OST 3곡 생성기 (P1-6)
- 2005~2007 한국 판타지 RPG(아스티넬·아르피아·테일즈위버·라그나로크) 감성 오마주
- 3곡이 공통의 '아스트라 별빛 모티프'를 변주하며 연결됨:
  1) bgm_academy.mp3 : 「별빛이 내리는 교정」 (D minor / F major, 3/4 왈츠, 104 BPM)
  2) bgm_battle.mp3  : 「검은 안개를 가르는 발걸음」 (E minor / G major, 4/4 모험, 132 BPM)
  3) bgm_boss.mp3    : 「붉은 달의 심판」 (C minor / Eb major, 4/4 고딕 오케스트라, 148 BPM)
- 32마디 풀 폼을 2회 연속 렌더링한 뒤 2회차(32~64마디)만 정확히 추출해
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
    def __init__(self, channel: int, program: int | None = None, name: str = "",
                 volume: int = 100, pan: int = 64, reverb: int = 55, chorus: int = 20):
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
        self.cc(0, 11, 118)      # Expression

    def cc(self, tick: int, ctrl: int, val: int) -> None:
        self.events.append((max(0, int(tick)), 2, bytes([0xB0 | self.channel, ctrl & 0x7F, max(0, min(127, int(val)))])))

    def note(self, start_beat: float, dur_beat: float, pitch: int, vel: int = 80,
             humanize_tick: int = 0) -> None:
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
    # Time signature
    den_pow = {1: 0, 2: 1, 4: 2, 8: 3}[den]
    meta.extend(vlq(0) + bytes([0xFF, 0x58, 0x04, num, den_pow, 24, 8]))
    # Tempo
    meta.extend(vlq(0) + bytes([0xFF, 0x51, 0x03, (tempo_us >> 16) & 0xFF, (tempo_us >> 8) & 0xFF, tempo_us & 0xFF]))
    end_tick = int(round(total_beats * PPQ))
    meta.extend(vlq(end_tick) + b"\xFF\x2F\x00")
    meta_chunk = b"MTrk" + struct.pack(">I", len(meta)) + bytes(meta)

    header = b"MThd" + struct.pack(">IHHH", 6, 1, 1 + len(tracks), PPQ)
    with open(path, "wb") as f:
        f.write(header)
        f.write(meta_chunk)
        for tr in tracks:
            f.write(tr.to_bytes(end_tick))


# Note name helper: "D4" -> 62, "Bb3" -> 58, "F#5" -> 78
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


# ==================== SONG 1: 별빛이 내리는 교정 (Academy / Town Waltz) ====================
# D minor -> F major -> D minor | 3/4 Waltz | 104 BPM | 32 bars (96 beats = 55.385s loop)
def build_academy(midi_path: str) -> tuple[float, float]:
    rng = random.Random(2005)
    bpm = 104.0
    beats_per_bar = 3
    bars = 32
    loop_beats = bars * beats_per_bar  # 96 beats

    # 32-bar progression: (bass, [chord tones low->high])
    prog = [
        # A (1-8): D minor — 아련한 입학식 밤, 별빛 아래 교정
        ("D3", ["D4", "F4", "A4"]),
        ("E3", ["C4", "E4", "G4"]),
        ("F3", ["C4", "F4", "A4"]),
        ("C3", ["C4", "E4", "G4"]),
        ("Bb2", ["D4", "F4", "Bb4"]),
        ("A2", ["C4", "F4", "A4"]),
        ("G2", ["D4", "G4", "Bb4"]),
        ("A2", ["C#4", "E4", "A4"]),
        # A' (9-16): 현악기 합류, 그리움의 변주
        ("D3", ["D4", "F4", "A4"]),
        ("C3", ["C4", "E4", "A4"]),
        ("Bb2", ["D4", "F4", "Bb4"]),
        ("A2", ["C4", "F4", "A4"]),
        ("G2", ["D4", "G4", "Bb4"]),
        ("F2", ["D4", "F4", "A4"]),
        ("E2", ["D4", "G4", "Bb4"]),
        ("A2", ["C#4", "E4", "G4"]),
        # B (17-24): F Major — 모험의 설렘과 따뜻한 추억 (아르피아/테일즈위버 향수!)
        ("F3", ["C4", "F4", "A4"]),
        ("E3", ["C4", "E4", "G4"]),
        ("D3", ["C4", "F4", "A4"]),
        ("A2", ["C4", "E4", "A4"]),
        ("Bb2", ["D4", "F4", "Bb4"]),
        ("A2", ["C4", "F4", "A4"]),
        ("G2", ["D4", "G4", "Bb4"]),
        ("C3", ["C4", "E4", "G4"]),
        # B' (25-32): 가슴 벅찬 고조 후 별빛 아래 고요히 회귀
        ("Bb2", ["D4", "F4", "Bb4"]),
        ("C3", ["E4", "G4", "Bb4"]),
        ("A2", ["C4", "E4", "A4"]),
        ("D3", ["D4", "F4", "A4"]),
        ("G2", ["D4", "G4", "Bb4"]),
        ("C3", ["D4", "G4", "Bb4"]),
        ("D3", ["D4", "E4", "A4"]),
        ("A2", ["C#4", "E4", "A4"]),
    ]

    # Melody: list of (bar_0idx, beat_in_bar, dur, note_name, vel)
    # '아스트라 별빛 모티프' D5 -> A5 -> Bb5 -> A5 -> G5 -> F5 -> E5 -> D5
    melody = [
        # A (bars 0..7)
        (0, 0.0, 1.5, "A4", 76), (0, 1.5, 0.5, "D5", 80), (0, 2.0, 1.0, "F5", 84),
        (1, 0.0, 2.0, "E5", 82), (1, 2.0, 1.0, "C5", 76),
        (2, 0.0, 1.5, "D5", 80), (2, 1.5, 0.5, "C5", 76), (2, 2.0, 1.0, "A4", 74),
        (3, 0.0, 2.5, "G4", 74), (3, 2.5, 0.5, "A4", 74),
        (4, 0.0, 1.5, "Bb4", 82), (4, 1.5, 0.5, "C5", 84), (4, 2.0, 1.0, "D5", 86),
        (5, 0.0, 2.0, "C5", 82), (5, 2.0, 1.0, "A4", 76),
        (6, 0.0, 1.5, "Bb4", 80), (6, 1.5, 0.5, "A4", 76), (6, 2.0, 1.0, "G4", 74),
        (7, 0.0, 2.5, "A4", 78),
        # A' (bars 8..15) — higher, more expressive
        (8, 0.0, 1.5, "D5", 84), (8, 1.5, 0.5, "F5", 88), (8, 2.0, 1.0, "A5", 92),
        (9, 0.0, 1.5, "G5", 88), (9, 1.5, 0.5, "F5", 84), (9, 2.0, 1.0, "E5", 82),
        (10, 0.0, 1.5, "F5", 88), (10, 1.5, 0.5, "G5", 90), (10, 2.0, 1.0, "F5", 86),
        (11, 0.0, 2.0, "C5", 80), (11, 2.0, 1.0, "A4", 76),
        (12, 0.0, 1.0, "Bb4", 82), (12, 1.0, 1.0, "D5", 86), (12, 2.0, 1.0, "G5", 90),
        (13, 0.0, 2.0, "F5", 86), (13, 2.0, 1.0, "D5", 80),
        (14, 0.0, 1.5, "E5", 84), (14, 1.5, 0.5, "F5", 82), (14, 2.0, 1.0, "E5", 80),
        (15, 0.0, 2.5, "C#5", 78), (15, 2.5, 0.5, "E5", 80),
        # B (bars 16..23) — warm F Major adventure nostalgia!
        (16, 0.0, 1.5, "F5", 90), (16, 1.5, 0.5, "G5", 92), (16, 2.0, 1.0, "A5", 96),
        (17, 0.0, 2.0, "G5", 90), (17, 2.0, 1.0, "E5", 84),
        (18, 0.0, 1.5, "F5", 88), (18, 1.5, 0.5, "E5", 84), (18, 2.0, 1.0, "D5", 82),
        (19, 0.0, 2.0, "C5", 82), (19, 2.0, 1.0, "A4", 78),
        (20, 0.0, 1.0, "Bb4", 84), (20, 1.0, 1.0, "D5", 88), (20, 2.0, 1.0, "F5", 92),
        (21, 0.0, 2.0, "C5", 86), (21, 2.0, 1.0, "F5", 88),
        (22, 0.0, 1.5, "G5", 90), (22, 1.5, 0.5, "F5", 86), (22, 2.0, 1.0, "D5", 82),
        (23, 0.0, 2.5, "E5", 86), (23, 2.5, 0.5, "G5", 88),
        # B' (bars 24..31) — soaring peak then gentle return to D minor
        (24, 0.0, 1.5, "Bb5", 94), (24, 1.5, 0.5, "A5", 92), (24, 2.0, 1.0, "G5", 90),
        (25, 0.0, 2.0, "G5", 88), (25, 2.0, 1.0, "E5", 84),
        (26, 0.0, 1.5, "A5", 92), (26, 1.5, 0.5, "G5", 88), (26, 2.0, 1.0, "F5", 86),
        (27, 0.0, 2.0, "D5", 82), (27, 2.0, 1.0, "F5", 84),
        (28, 0.0, 1.5, "G5", 86), (28, 1.5, 0.5, "F5", 84), (28, 2.0, 1.0, "D5", 80),
        (29, 0.0, 2.0, "E5", 82), (29, 2.0, 1.0, "C5", 78),
        (30, 0.0, 2.5, "D5", 80), (30, 2.5, 0.5, "E5", 76),
        (31, 0.0, 2.5, "A4", 74),
    ]

    flute = MidiTrack(0, 73, "Flute", volume=96, pan=68, reverb=78, chorus=22)
    celesta = MidiTrack(1, 8, "Celesta", volume=84, pan=44, reverb=84, chorus=30)
    harp = MidiTrack(2, 46, "Harp", volume=92, pan=84, reverb=74, chorus=16)
    piano = MidiTrack(3, 0, "Piano", volume=86, pan=56, reverb=68, chorus=12)
    strings = MidiTrack(4, 48, "Strings", volume=74, pan=64, reverb=88, chorus=28)
    cello = MidiTrack(5, 42, "Cello", volume=80, pan=40, reverb=76, chorus=18)

    # Render 2 full cycles (0..192 beats) for seamless tail-wrapped loop!
    for cycle in range(2):
        base_beat = cycle * loop_beats
        for bar_i, (bass_n, ch_names) in enumerate(prog):
            b0 = base_beat + bar_i * beats_per_bar
            ch = chord_notes(ch_names)
            bass_p = N(bass_n)

            # Harp flowing 3/4 waltz arpeggio (6 eighth notes per bar)
            arp_seq = [bass_p, ch[0], ch[1], ch[2], ch[1], ch[0]]
            for step_i, p in enumerate(arp_seq):
                vel = (72 if step_i == 0 else 58 + (step_i % 2) * 6) + rng.randint(-3, 3)
                harp.note(b0 + step_i * 0.5, 0.72, p, vel, rng.randint(-6, 6))

            # Piano gentle waltz accompaniment (om-pa-pa)
            piano.note(b0, 2.6, bass_p - 12 if bass_p >= 48 else bass_p, 64 + rng.randint(-3, 3))
            for beat_off in (1.0, 2.0):
                for p in ch:
                    piano.note(b0 + beat_off, 0.85, p, 52 + rng.randint(-4, 3), rng.randint(-5, 5))

            # Celesta starlight sparkles on key phrase openings & B section
            if bar_i in (0, 2, 4, 7, 8, 12, 16, 20, 24, 28, 30, 31):
                spark = [ch[2] + 12, ch[1] + 12, ch[0] + 12]
                for si, sp in enumerate(spark):
                    celesta.note(b0 + si * 1.0, 1.3, sp, 64 - si * 5, rng.randint(-4, 4))

            # Strings warm cushion (enters softly in A', blooms in B & B')
            if bar_i >= 8:
                s_vel = 52 if bar_i < 16 else (66 if bar_i < 28 else 56)
                for p in ch:
                    strings.note(b0, 2.95, p, s_vel)

            # Cello soulful bass line & subtle rising passing notes
            cello_vel = 68 if bar_i < 16 else 78
            cello.note(b0, 2.0, bass_p, cello_vel)
            cello.note(b0 + 2.0, 0.95, ch[0], cello_vel - 8)

        # Melody on Flute (+ delicate Celesta/Piano doubling in B section)
        for bar_i, beat_in, dur, note_name, vel in melody:
            t = base_beat + bar_i * beats_per_bar + beat_in
            p = N(note_name)
            flute.note(t, dur * 0.96, p, vel + rng.randint(-3, 3), rng.randint(-5, 5))
            if bar_i >= 16:
                celesta.note(t, dur * 0.85, p + 12 if p <= 76 else p, int(vel * 0.62), rng.randint(-4, 4))
            elif bar_i >= 8:
                piano.note(t, dur * 0.9, p - 12, int(vel * 0.58), rng.randint(-4, 4))

    write_midi(midi_path, bpm, 3, 4, [flute, celesta, harp, piano, strings, cello], loop_beats * 2)
    loop_sec = loop_beats * (60.0 / bpm)
    return loop_sec, loop_sec * 2


# ==================== SONG 2: 검은 안개를 가르는 발걸음 (Adventure Battle) ====================
# E minor -> G major chorus -> E minor | 4/4 | 132 BPM | 32 bars (128 beats = 58.182s loop)
def build_battle(midi_path: str) -> tuple[float, float]:
    rng = random.Random(2007)
    bpm = 132.0
    beats_per_bar = 4
    bars = 32
    loop_beats = bars * beats_per_bar  # 128 beats

    prog = [
        # A (0..7): E minor — 경쾌하고 긴장감 있는 모험의 시작
        ("E2", ["E3", "G3", "B3"]),
        ("F#2", ["D3", "F#3", "A3"]),
        ("G2", ["D3", "G3", "B3"]),
        ("D2", ["D3", "F#3", "A3"]),
        ("C2", ["C3", "E3", "G3"]),
        ("B2", ["D3", "G3", "B3"]),
        ("A2", ["C3", "E3", "A3"]),
        ("B2", ["D#3", "F#3", "B3"]),
        # A' (8..15): 가속하는 하프시코드 & 바이올린 도약
        ("E2", ["E3", "G3", "B3"]),
        ("D2", ["D3", "F#3", "B3"]),
        ("C2", ["C3", "E3", "G3"]),
        ("B2", ["D3", "G3", "B3"]),
        ("A2", ["C3", "E3", "A3"]),
        ("G2", ["E3", "G3", "B3"]),
        ("F#2", ["E3", "A3", "C4"]),
        ("B2", ["D#3", "F#3", "A3"]),
        # B (16..23): G Major — 가슴 벅찬 2000년대 RPG 모험 코러스!
        ("C2", ["C3", "E3", "G3"]),
        ("D2", ["D3", "F#3", "A3"]),
        ("B2", ["D3", "F#3", "B3"]),
        ("E2", ["E3", "G3", "B3"]),
        ("C2", ["C3", "E3", "G3"]),
        ("D2", ["D3", "F#3", "A3"]),
        ("G2", ["D3", "G3", "B3"]),
        ("B2", ["D#3", "F#3", "B3"]),
        # C (24..31): 클라이맥스 + 별빛 모티프 인용 후 E minor 귀환
        ("C2", ["C3", "E3", "G3"]),
        ("D2", ["D3", "F#3", "A3"]),
        ("B2", ["D3", "F#3", "B3"]),
        ("E2", ["E3", "G3", "B3"]),
        ("A2", ["C3", "E3", "A3"]),
        ("B2", ["D#3", "F#3", "B3"]),
        ("E2", ["E3", "G3", "B3"]),
        ("B2", ["D#3", "F#3", "A3"]),
    ]

    melody = [
        # A (0..7) — crisp, heroic adventure motif
        (0, 0.0, 0.75, "E5", 92), (0, 0.75, 0.25, "F#5", 86), (0, 1.0, 1.0, "G5", 96), (0, 2.0, 1.0, "B5", 100), (0, 3.0, 1.0, "A5", 92),
        (1, 0.0, 1.5, "F#5", 92), (1, 1.5, 0.5, "G5", 88), (1, 2.0, 1.5, "A5", 94), (1, 3.5, 0.5, "F#5", 86),
        (2, 0.0, 1.0, "G5", 94), (2, 1.0, 0.5, "A5", 90), (2, 1.5, 0.5, "B5", 96), (2, 2.0, 1.5, "D6", 100), (2, 3.5, 0.5, "B5", 92),
        (3, 0.0, 2.5, "A5", 92), (3, 3.0, 1.0, "G5", 86),
        (4, 0.0, 1.0, "E5", 90), (4, 1.0, 0.5, "G5", 92), (4, 1.5, 0.5, "A5", 94), (4, 2.0, 1.0, "G5", 90), (4, 3.0, 1.0, "E5", 86),
        (5, 0.0, 1.5, "D5", 88), (5, 1.5, 0.5, "E5", 86), (5, 2.0, 2.0, "G5", 92),
        (6, 0.0, 1.0, "A5", 94), (6, 1.0, 1.0, "G5", 90), (6, 2.0, 1.0, "F#5", 88), (6, 3.0, 1.0, "E5", 86),
        (7, 0.0, 3.0, "F#5", 92), (7, 3.0, 1.0, "B4", 84),
        # A' (8..15)
        (8, 0.0, 0.75, "E5", 94), (8, 0.75, 0.25, "G5", 90), (8, 1.0, 1.0, "B5", 100), (8, 2.0, 1.0, "C6", 102), (8, 3.0, 1.0, "B5", 96),
        (9, 0.0, 1.5, "A5", 94), (9, 1.5, 0.5, "B5", 92), (9, 2.0, 2.0, "F#5", 90),
        (10, 0.0, 1.0, "G5", 96), (10, 1.0, 1.0, "A5", 98), (10, 2.0, 1.0, "B5", 100), (10, 3.0, 1.0, "G5", 94),
        (11, 0.0, 2.5, "D5", 90), (11, 3.0, 1.0, "G5", 92),
        (12, 0.0, 1.0, "A5", 96), (12, 1.0, 0.5, "B5", 96), (12, 1.5, 0.5, "C6", 100), (12, 2.0, 1.0, "B5", 96), (12, 3.0, 1.0, "A5", 92),
        (13, 0.0, 1.5, "G5", 92), (13, 1.5, 0.5, "A5", 90), (13, 2.0, 2.0, "B5", 96),
        (14, 0.0, 1.0, "A5", 94), (14, 1.0, 1.0, "G5", 90), (14, 2.0, 1.0, "F#5", 88), (14, 3.0, 1.0, "E5", 86),
        (15, 0.0, 3.0, "F#5", 94), (15, 3.0, 1.0, "B5", 96),
        # B (16..23) — soaring G Major chorus!
        (16, 0.0, 1.5, "C6", 104), (16, 1.5, 0.5, "B5", 98), (16, 2.0, 1.0, "G5", 96), (16, 3.0, 1.0, "E5", 92),
        (17, 0.0, 1.5, "A5", 100), (17, 1.5, 0.5, "B5", 98), (17, 2.0, 2.0, "F#5", 94),
        (18, 0.0, 1.0, "B5", 102), (18, 1.0, 0.5, "A5", 96), (18, 1.5, 0.5, "G5", 94), (18, 2.0, 1.0, "F#5", 94), (18, 3.0, 1.0, "D5", 90),
        (19, 0.0, 2.5, "E5", 94), (19, 3.0, 1.0, "B5", 98),
        (20, 0.0, 1.5, "C6", 104), (20, 1.5, 0.5, "D6", 106), (20, 2.0, 1.0, "C6", 102), (20, 3.0, 1.0, "G5", 96),
        (21, 0.0, 1.5, "A5", 100), (21, 1.5, 0.5, "B5", 102), (21, 2.0, 2.0, "D6", 106),
        (22, 0.0, 2.5, "B5", 102), (22, 2.5, 0.5, "A5", 96), (22, 3.0, 1.0, "G5", 94),
        (23, 0.0, 3.0, "F#5", 96), (23, 3.0, 1.0, "B5", 98),
        # C (24..31) — triumphant climax & dark-fantasy turn back to Em
        (24, 0.0, 1.0, "C6", 104), (24, 1.0, 1.0, "B5", 100), (24, 2.0, 1.0, "A5", 98), (24, 3.0, 1.0, "G5", 96),
        (25, 0.0, 1.5, "A5", 100), (25, 1.5, 0.5, "G5", 96), (25, 2.0, 2.0, "F#5", 94),
        (26, 0.0, 1.5, "B5", 102), (26, 1.5, 0.5, "A5", 98), (26, 2.0, 1.0, "G5", 96), (26, 3.0, 1.0, "F#5", 94),
        (27, 0.0, 2.5, "E5", 96), (27, 3.0, 1.0, "G5", 94),
        (28, 0.0, 1.0, "A5", 98), (28, 1.0, 1.0, "C6", 102), (28, 2.0, 1.0, "B5", 98), (28, 3.0, 1.0, "A5", 94),
        (29, 0.0, 1.5, "F#5", 96), (29, 1.5, 0.5, "G5", 94), (29, 2.0, 2.0, "B5", 98),
        (30, 0.0, 3.0, "E5", 96), (30, 3.0, 1.0, "G5", 90),
        (31, 0.0, 2.0, "F#5", 92), (31, 2.0, 1.0, "D#5", 88), (31, 3.0, 1.0, "B4", 86),
    ]

    violin = MidiTrack(0, 40, "Violin", volume=96, pan=58, reverb=74, chorus=26)
    harpsi = MidiTrack(1, 6, "Harpsichord", volume=68, pan=86, reverb=62, chorus=16)
    flute = MidiTrack(2, 73, "Flute", volume=88, pan=42, reverb=76, chorus=22)
    strings = MidiTrack(3, 48, "Strings", volume=74, pan=64, reverb=80, chorus=24)
    pizz = MidiTrack(4, 45, "Pizzicato", volume=84, pan=74, reverb=56, chorus=10)
    bass = MidiTrack(5, 43, "Contrabass", volume=90, pan=58, reverb=46, chorus=8)
    horn = MidiTrack(6, 60, "FrenchHorn", volume=76, pan=46, reverb=78, chorus=16)
    oboe = MidiTrack(7, 68, "Oboe", volume=64, pan=66, reverb=74, chorus=18)
    drums = MidiTrack(9, None, "Drums", volume=76, pan=64, reverb=46, chorus=0)

    for cycle in range(2):
        base_beat = cycle * loop_beats
        for bar_i, (bass_n, ch_names) in enumerate(prog):
            b0 = base_beat + bar_i * beats_per_bar
            ch = chord_notes(ch_names)
            bp = N(bass_n)
            is_chorus = bar_i >= 16

            # Driving Harpsichord 8th-note gothic arpeggio (classic TalesWeaver/Arpia feel!)
            arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]
            for s_i, ap in enumerate(arp):
                vel = (70 if s_i % 4 == 0 else 56) + (6 if is_chorus else 0) + rng.randint(-3, 3)
                harpsi.note(b0 + s_i * 0.5, 0.44, ap, vel, rng.randint(-4, 4))

            # Contrabass + Pizzicato rhythmic bassline
            for beat_i in range(4):
                p_b = bp if beat_i % 2 == 0 else bp + 7
                bass.note(b0 + beat_i, 0.45, p_b, 84 if beat_i == 0 else 72)
                pizz.note(b0 + beat_i + 0.5, 0.3, ch[beat_i % 3], 68)

            # Strings harmonic bed
            str_v = 68 if is_chorus else 52
            for p in ch:
                strings.note(b0, 3.9, p + 12, str_v)

            # French Horn heroic swells in B & C chorus
            if is_chorus:
                horn.note(b0, 3.8, ch[0] + 12, 72)
                if bar_i % 2 == 0:
                    horn.note(b0, 3.8, ch[2] + 12, 66)

            # Adventure Percussion: Kick(36), Snare(38), ClosedHat(42), Tambourine(54), Crash(49), LowTom(45)
            drums.note(b0 + 0.0, 0.25, 36, 86 if is_chorus else 76)
            drums.note(b0 + 1.0, 0.25, 38, 72 if is_chorus else 62)
            drums.note(b0 + 2.0, 0.25, 36, 80 if is_chorus else 70)
            drums.note(b0 + 2.5, 0.25, 36, 64)
            drums.note(b0 + 3.0, 0.25, 38, 76 if is_chorus else 66)
            for h_i in range(8):
                drums.note(b0 + h_i * 0.5, 0.15, 42, 46 if h_i % 2 == 0 else 34)
                if is_chorus and h_i % 2 == 1:
                    drums.note(b0 + h_i * 0.5, 0.15, 54, 44)
            if bar_i in (0, 8, 16, 24):
                drums.note(b0, 0.8, 49, 68)
            if bar_i in (7, 15, 23, 31):
                drums.note(b0 + 3.0, 0.2, 38, 74)
                drums.note(b0 + 3.25, 0.2, 38, 70)
                drums.note(b0 + 3.5, 0.2, 45, 78)
                drums.note(b0 + 3.75, 0.2, 43, 80)

        # Violin + Oboe warm blend lead, Flute sparkling doubling in chorus
        for bar_i, beat_in, dur, note_name, vel in melody:
            t = base_beat + bar_i * beats_per_bar + beat_in
            p = N(note_name)
            violin.note(t, dur * 0.96, p, vel + rng.randint(-3, 3), rng.randint(-4, 4))
            if bar_i < 16:
                oboe.note(t, dur * 0.92, p - 12 if p >= 78 else p, int(vel * 0.66), rng.randint(-3, 3))
            if bar_i >= 16:
                flute.note(t, dur * 0.94, p, int(vel * 0.84), rng.randint(-3, 3))
            elif bar_i >= 8 and beat_in in (0.0, 2.0):
                flute.note(t, dur * 0.88, p, int(vel * 0.58))

    write_midi(midi_path, bpm, 4, 4, [violin, harpsi, flute, strings, pizz, bass, horn, oboe, drums], loop_beats * 2)
    loop_sec = loop_beats * (60.0 / bpm)
    return loop_sec, loop_sec * 2


# ==================== SONG 3: 붉은 달의 심판 (Gothic Boss Battle) ====================
# C minor (Harmonic minor) -> Eb major heroic clash -> C minor | 4/4 | 148 BPM | 32 bars (51.892s loop)
def build_boss(midi_path: str) -> tuple[float, float]:
    rng = random.Random(2012)
    bpm = 148.0
    beats_per_bar = 4
    bars = 32
    loop_beats = bars * beats_per_bar  # 128 beats

    prog = [
        # A (0..7): C minor — 압도적인 고딕 오르간과 팀파니
        ("C2", ["C3", "Eb3", "G3"]),
        ("Bb1", ["C3", "Eb3", "G3"]),
        ("Ab1", ["C3", "Eb3", "Ab3"]),
        ("G1", ["B2", "D3", "G3"]),
        ("F2", ["C3", "F3", "Ab3"]),
        ("Eb2", ["C3", "Eb3", "G3"]),
        ("D2", ["C3", "F3", "Ab3"]),
        ("G1", ["B2", "D3", "G3"]),
        # A' (8..15): 16분음표 바로크 하프시코드 폭풍
        ("C2", ["C3", "Eb3", "G3"]),
        ("B1", ["D3", "G3", "B3"]),
        ("Bb1", ["D3", "F3", "Bb3"]),
        ("A1", ["C3", "F3", "A3"]),
        ("Ab1", ["C3", "Eb3", "Ab3"]),
        ("G1", ["Eb3", "G3", "C4"]),
        ("F2", ["C3", "F3", "Ab3"]),
        ("G1", ["B2", "D3", "F3"]),
        # B (16..23): 비장한 영웅의 반격 (Ab -> Bb -> Gm -> Cm -> Eb)
        ("Ab1", ["C3", "Eb3", "Ab3"]),
        ("Bb1", ["D3", "F3", "Bb3"]),
        ("G1", ["D3", "G3", "Bb3"]),
        ("C2", ["C3", "Eb3", "G3"]),
        ("F2", ["C3", "F3", "Ab3"]),
        ("Bb1", ["D3", "F3", "Ab3"]),
        ("Eb2", ["Eb3", "G3", "Bb3"]),
        ("G1", ["B2", "D3", "G3"]),
        # C (24..31): 대성당 합창 클라이맥스 + 피날레
        ("Ab1", ["C3", "Eb3", "Ab3"]),
        ("Bb1", ["D3", "F3", "Bb3"]),
        ("G1", ["D3", "G3", "Bb3"]),
        ("C2", ["C3", "Eb3", "G3"]),
        ("F2", ["C3", "F3", "Ab3"]),
        ("D2", ["C3", "F3", "Ab3"]),
        ("G1", ["C3", "D3", "G3"]),
        ("G1", ["B2", "D3", "G3"]),
    ]

    melody = [
        # A (0..7) — dramatic Gothic harmonic minor motif
        (0, 0.0, 1.5, "C5", 104), (0, 1.5, 0.5, "D5", 98), (0, 2.0, 1.0, "Eb5", 106), (0, 3.0, 1.0, "G5", 110),
        (1, 0.0, 1.5, "G5", 108), (1, 1.5, 0.5, "F5", 100), (1, 2.0, 2.0, "Eb5", 102),
        (2, 0.0, 1.0, "Ab5", 110), (2, 1.0, 1.0, "G5", 106), (2, 2.0, 1.0, "F5", 102), (2, 3.0, 1.0, "Eb5", 100),
        (3, 0.0, 3.0, "D5", 104), (3, 3.0, 1.0, "B4", 98),
        (4, 0.0, 1.5, "F5", 106), (4, 1.5, 0.5, "G5", 104), (4, 2.0, 1.0, "Ab5", 110), (4, 3.0, 1.0, "F5", 102),
        (5, 0.0, 2.0, "G5", 108), (5, 2.0, 2.0, "Eb5", 102),
        (6, 0.0, 1.0, "F5", 104), (6, 1.0, 1.0, "Eb5", 100), (6, 2.0, 1.0, "D5", 100), (6, 3.0, 1.0, "C5", 98),
        (7, 0.0, 2.5, "D5", 106), (7, 3.0, 1.0, "G5", 108),
        # A' (8..15) — higher, fierce duel
        (8, 0.0, 1.0, "C6", 112), (8, 1.0, 0.5, "B5", 106), (8, 1.5, 0.5, "C6", 110), (8, 2.0, 1.0, "G5", 106), (8, 3.0, 1.0, "Eb5", 102),
        (9, 0.0, 1.5, "D6", 112), (9, 1.5, 0.5, "C6", 106), (9, 2.0, 2.0, "B5", 108),
        (10, 0.0, 1.5, "Bb5", 110), (10, 1.5, 0.5, "A5", 104), (10, 2.0, 1.0, "F5", 102), (10, 3.0, 1.0, "D5", 98),
        (11, 0.0, 2.0, "C6", 110), (11, 2.0, 2.0, "A5", 104),
        (12, 0.0, 1.5, "Ab5", 110), (12, 1.5, 0.5, "Bb5", 108), (12, 2.0, 1.0, "C6", 112), (12, 3.0, 1.0, "Ab5", 106),
        (13, 0.0, 2.0, "G5", 108), (13, 2.0, 2.0, "Eb5", 102),
        (14, 0.0, 1.0, "F5", 104), (14, 1.0, 1.0, "G5", 106), (14, 2.0, 1.0, "Ab5", 110), (14, 3.0, 1.0, "F5", 104),
        (15, 0.0, 3.0, "G5", 110), (15, 3.0, 1.0, "B5", 112),
        # B (16..23) — heroic counterattack
        (16, 0.0, 1.5, "C6", 114), (16, 1.5, 0.5, "Bb5", 108), (16, 2.0, 1.0, "Ab5", 108), (16, 3.0, 1.0, "Eb5", 102),
        (17, 0.0, 1.5, "Bb5", 112), (17, 1.5, 0.5, "C6", 112), (17, 2.0, 2.0, "F5", 104),
        (18, 0.0, 1.5, "Bb5", 112), (18, 1.5, 0.5, "A5", 106), (18, 2.0, 1.0, "G5", 106), (18, 3.0, 1.0, "D5", 100),
        (19, 0.0, 2.5, "Eb5", 106), (19, 3.0, 1.0, "G5", 108),
        (20, 0.0, 1.0, "Ab5", 110), (20, 1.0, 1.0, "Bb5", 112), (20, 2.0, 1.0, "C6", 114), (20, 3.0, 1.0, "Ab5", 108),
        (21, 0.0, 1.5, "Bb5", 112), (21, 1.5, 0.5, "C6", 112), (21, 2.0, 2.0, "D6", 116),
        (22, 0.0, 2.5, "Eb6", 116), (22, 2.5, 0.5, "D6", 110), (22, 3.0, 1.0, "C6", 110),
        (23, 0.0, 3.0, "B5", 112), (23, 3.0, 1.0, "G5", 108),
        # C (24..31) — choir & organ grand climax
        (24, 0.0, 1.5, "C6", 114), (24, 1.5, 0.5, "Bb5", 110), (24, 2.0, 1.0, "Ab5", 110), (24, 3.0, 1.0, "G5", 108),
        (25, 0.0, 1.5, "F5", 106), (25, 1.5, 0.5, "G5", 108), (25, 2.0, 2.0, "Bb5", 112),
        (26, 0.0, 1.5, "G5", 110), (26, 1.5, 0.5, "Ab5", 110), (26, 2.0, 1.0, "Bb5", 112), (26, 3.0, 1.0, "D6", 116),
        (27, 0.0, 2.5, "C6", 116), (27, 3.0, 1.0, "G5", 108),
        (28, 0.0, 1.0, "Ab5", 112), (28, 1.0, 1.0, "G5", 108), (28, 2.0, 1.0, "F5", 106), (28, 3.0, 1.0, "Eb5", 104),
        (29, 0.0, 1.5, "F5", 108), (29, 1.5, 0.5, "Eb5", 104), (29, 2.0, 2.0, "D5", 106),
        (30, 0.0, 2.0, "G5", 110), (30, 2.0, 2.0, "F5", 108),
        (31, 0.0, 2.0, "G5", 112), (31, 2.0, 1.0, "B5", 114), (31, 3.0, 1.0, "G5", 110),
    ]

    strings = MidiTrack(0, 48, "StringsLead", volume=96, pan=54, reverb=74, chorus=22)
    violin = MidiTrack(7, 40, "SoloViolin", volume=94, pan=68, reverb=72, chorus=20)
    organ = MidiTrack(1, 19, "ChurchOrgan", volume=66, pan=64, reverb=84, chorus=16)
    harpsi = MidiTrack(2, 6, "Harpsichord", volume=62, pan=92, reverb=54, chorus=12)
    brass = MidiTrack(3, 61, "BrassSection", volume=74, pan=36, reverb=72, chorus=14)
    choir = MidiTrack(4, 52, "ChoirAahs", volume=68, pan=64, reverb=92, chorus=28)
    timpani = MidiTrack(5, 47, "Timpani", volume=94, pan=48, reverb=62, chorus=0)
    bass = MidiTrack(6, 43, "Contrabass", volume=92, pan=60, reverb=46, chorus=8)
    drums = MidiTrack(9, None, "Drums", volume=84, pan=64, reverb=48, chorus=0)

    for cycle in range(2):
        base_beat = cycle * loop_beats
        for bar_i, (bass_n, ch_names) in enumerate(prog):
            b0 = base_beat + bar_i * beats_per_bar
            ch = chord_notes(ch_names)
            bp = N(bass_n)
            intense = bar_i >= 16

            # Relentless 8th-note Contrabass ostinato
            for s_i in range(8):
                vel = (90 if s_i % 2 == 0 else 72) + rng.randint(-3, 3)
                bass.note(b0 + s_i * 0.5, 0.42, bp + (12 if s_i == 7 else 0), vel)

            # Church Organ gothic cathedral chords (keep spacious in A, fuller in B/C)
            organ.note(b0, 3.85, bp, 74 if intense else 64)
            organ.note(b0, 3.85, ch[0], 68 if intense else 56)
            organ.note(b0, 3.85, ch[2], 66 if intense else 54)

            # Baroque Harpsichord runs (castlevania / dark fantasy boss signature!)
            run = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]
            for s_i, hp in enumerate(run):
                harpsi.note(b0 + s_i * 0.5, 0.42, hp, 68 if s_i % 4 == 0 else 56)

            # Timpani dramatic thunder
            timp_p = bp + 12 if bp < 38 else bp
            timpani.note(b0 + 0.0, 0.45, timp_p, 100)
            timpani.note(b0 + 1.5, 0.35, timp_p, 80)
            timpani.note(b0 + 2.0, 0.45, timp_p, 92)
            if bar_i % 2 == 1:
                timpani.note(b0 + 3.0, 0.3, timp_p, 88)
                timpani.note(b0 + 3.5, 0.3, timp_p, 94)

            # Brass heroic accents (short punchy hits instead of constant wall)
            if intense or bar_i % 2 == 0:
                b_vel = 84 if intense else 68
                for p in (ch[0] + 12, ch[2] + 12):
                    brass.note(b0, 0.85, p, b_vel)
                if intense:
                    brass.note(b0 + 2.0, 0.85, ch[1] + 12, b_vel - 6)
                    brass.note(b0 + 2.0, 0.85, ch[2] + 12, b_vel - 6)

            # Gothic Choir Aahs (enters softly in A', grand cathedral bloom in B & C)
            if bar_i >= 16:
                c_vel = 74 if bar_i >= 24 else 62
                for p in (ch[0] + 12, ch[2] + 12):
                    choir.note(b0, 3.85, p, c_vel)

            # Heavy Battle Percussion
            drums.note(b0 + 0.0, 0.25, 36, 94)
            drums.note(b0 + 1.0, 0.25, 38, 82)
            drums.note(b0 + 2.0, 0.25, 36, 90)
            drums.note(b0 + 2.5, 0.25, 36, 76)
            drums.note(b0 + 3.0, 0.25, 38, 86)
            for h_i in range(8):
                drums.note(b0 + h_i * 0.5, 0.15, 42, 48 if h_i % 2 == 0 else 36)
            if bar_i in (0, 8, 16, 24):
                drums.note(b0, 1.0, 49, 82)
            if bar_i in (7, 15, 23, 31):
                for fi in range(4):
                    drums.note(b0 + 3.0 + fi * 0.25, 0.2, 38, 76 + fi * 6)

        # Crisp Solo Violin + Strings lead cutting cleanly over gothic orchestra
        for bar_i, beat_in, dur, note_name, vel in melody:
            t = base_beat + bar_i * beats_per_bar + beat_in
            p = N(note_name)
            violin.note(t, dur * 0.95, p, vel + rng.randint(-2, 2))
            strings.note(t, dur * 0.94, p, int(vel * 0.86))
            if bar_i >= 16:
                strings.note(t, dur * 0.94, p - 12, int(vel * 0.68))

    write_midi(midi_path, bpm, 4, 4, [strings, violin, organ, harpsi, brass, choir, timpani, bass, drums], loop_beats * 2)
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
                "-g", "0.72",
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
        # Master: gentle sub cut, warm nostalgic sheen, soft compression, -16 LUFS normalization, 128k stereo MP3
        af = (
            "highpass=f=32,"
            "equalizer=f=240:t=q:w=1.2:g=1.5,"
            "equalizer=f=3200:t=q:w=1.5:g=-1.2,"
            "equalizer=f=9500:t=q:w=1.4:g=1.8,"
            "acompressor=threshold=-16dB:ratio=2.2:attack=15:release=140,"
            "loudnorm=I=-16:TP=-1.5:LRA=9"
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
