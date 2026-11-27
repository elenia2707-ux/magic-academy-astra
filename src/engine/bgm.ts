/**
 * P1-6: 《마법학교 아스트라》 BGM 오디오 엔진
 * - Web Audio API (AudioBufferSourceNode + GainNode) 기반으로 구현하여:
 *   1) iOS Safari에서 볼륨 슬라이더 & 부드러운 크로스페이드가 100% 동작 (HTMLAudioElement.volume은 iOS에서 읽기 전용)
 *   2) MP3 루프 경계의 미세 갭을 최소화한 심리스 루프 재생
 *   3) iOS 자동재생 정책 대응 (첫 사용자 제스처에서 AudioContext.resume() 후 즉시 시작)
 *   4) 앱 백그라운드/화면 잠금(visibilitychange) 시 자동 일시정지 & 복귀 재개
 */

export type BgmTrackId = 'academy' | 'battle' | 'boss';

export interface BgmTrackMeta {
  id: BgmTrackId;
  title: string;
  subtitle: string;
  filename: string;
}

export const BGM_TRACKS: Record<BgmTrackId, BgmTrackMeta> = {
  academy: {
    id: 'academy',
    title: '달빛이 머무는 교정',
    subtitle: '아스트라 마법학교 · 몽환 오르골 테마',
    filename: 'audio/bgm_academy.mp3',
  },
  battle: {
    id: 'battle',
    title: '빗방울 숲의 모험가',
    subtitle: '모험 · 사냥터 · 심연 필드 테마',
    filename: 'audio/bgm_battle.mp3',
  },
  boss: {
    id: 'boss',
    title: '시간이 멈춘 회랑',
    subtitle: '보스 · 승급 시험 · 시간의 시련 테마',
    filename: 'audio/bgm_boss.mp3',
  },
};

const FADE_SEC = 0.65;
// LAME MP3 encoder delay + padding trim for tight seamless looping
const MP3_TRIM_START = 0.026;
const MP3_TRIM_END = 0.032;

interface ActiveVoice {
  trackId: BgmTrackId;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

class BgmEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache = new Map<BgmTrackId, AudioBuffer>();
  private loadingPromises = new Map<BgmTrackId, Promise<AudioBuffer | null>>();
  private activeVoice: ActiveVoice | null = null;

  private desiredTrack: BgmTrackId = 'academy';
  private enabled = true;
  private volume = 0.55;
  private unlocked = false;
  private hidden = false;
  private transitionSeq = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.enabled ? this.volume : 0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getTrackUrl(trackId: BgmTrackId): string {
    const base = import.meta.env.BASE_URL || './';
    const normalized = base.endsWith('/') ? base : `${base}/`;
    return `${normalized}${BGM_TRACKS[trackId].filename}`;
  }

  private async loadBuffer(trackId: BgmTrackId): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(trackId);
    if (cached) return cached;
    const inflight = this.loadingPromises.get(trackId);
    if (inflight) return inflight;

    const ctx = this.ensureContext();
    if (!ctx) return null;

    const promise = (async () => {
      try {
        const res = await fetch(this.getTrackUrl(trackId));
        if (!res.ok) return null;
        const arr = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr);
        this.bufferCache.set(trackId, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        this.loadingPromises.delete(trackId);
      }
    })();

    this.loadingPromises.set(trackId, promise);
    return promise;
  }

  /** iOS/브라우저 첫 사용자 제스처에서 호출하여 오디오 잠금 해제 */
  public unlockFromGesture(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.unlocked = true;
    if (ctx.state === 'suspended' && !this.hidden) {
      ctx.resume().catch(() => undefined);
    }
    if (this.enabled && !this.hidden) {
      void this.syncPlayback();
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    const ctx = this.ctx;
    if (!enabled) {
      this.stopActiveVoice(0.28);
      return;
    }
    if (ctx && ctx.state === 'suspended' && this.unlocked && !this.hidden) {
      ctx.resume().catch(() => undefined);
    }
    if (this.unlocked && !this.hidden) {
      void this.syncPlayback();
    }
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.enabled ? clamped : 0, now, 0.05);
    }
  }

  public setTrack(trackId: BgmTrackId): void {
    if (this.desiredTrack === trackId && this.activeVoice?.trackId === trackId) return;
    this.desiredTrack = trackId;
    if (this.enabled && this.unlocked && !this.hidden) {
      void this.syncPlayback();
    }
  }

  public setDocumentHidden(hidden: boolean): void {
    this.hidden = hidden;
    if (!this.ctx) return;
    if (hidden) {
      if (this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => undefined);
      }
    } else if (this.enabled && this.unlocked) {
      this.ctx.resume().catch(() => undefined);
      void this.syncPlayback();
    }
  }

  private stopActiveVoice(fadeSec: number): void {
    const prev = this.activeVoice;
    this.activeVoice = null;
    if (!prev || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      prev.gain.gain.cancelScheduledValues(now);
      prev.gain.gain.setValueAtTime(prev.gain.gain.value, now);
      prev.gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
      prev.source.stop(now + fadeSec + 0.04);
    } catch {
      // 이미 종료된 노드 무시
    }
  }

  private async syncPlayback(): Promise<void> {
    if (!this.enabled || !this.unlocked || this.hidden) return;
    const targetTrack = this.desiredTrack;
    if (this.activeVoice?.trackId === targetTrack) return;

    const seq = ++this.transitionSeq;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    const buffer = await this.loadBuffer(targetTrack);
    // 로딩 도중 트랙이 바뀌었거나 비활성화됐으면 중단
    if (seq !== this.transitionSeq || !this.enabled || this.hidden || !buffer) return;
    if (this.activeVoice?.trackId === targetTrack) return;

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(this.volume, now, 0.04);

    // 이전 곡 페이드아웃
    this.stopActiveVoice(FADE_SEC);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    if (buffer.duration > MP3_TRIM_START + MP3_TRIM_END + 1) {
      source.loopStart = MP3_TRIM_START;
      source.loopEnd = buffer.duration - MP3_TRIM_END;
    }

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.linearRampToValueAtTime(1.0, now + FADE_SEC);

    source.connect(voiceGain);
    voiceGain.connect(this.masterGain);
    source.start(now, buffer.duration > MP3_TRIM_START + 1 ? MP3_TRIM_START : 0);

    this.activeVoice = { trackId: targetTrack, source, gain: voiceGain };
  }
}

export const bgmEngine = new BgmEngine();
