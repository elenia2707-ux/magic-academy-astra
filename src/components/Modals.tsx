import React from 'react';
import { ACTS } from '../data/acts';
import { formatDuration } from '../engine/offline';
import type { OfflineSummary } from '../types/game';

export const OfflineModal: React.FC<{
  summary: OfflineSummary;
  onClose: () => void;
}> = ({ summary, onClose }) => (
  <div className="modal-backdrop">
    <div className="modal-card">
      <h3 className="modal-title">오프라인 방치 정산</h3>
      <div style={{ fontSize: 12, color: '#9a9386', marginBottom: 10 }}>
        부재중 <strong>{formatDuration(summary.elapsedSec)}</strong> 동안 아스트라에서 자동
        전투와 수련이 진행되었습니다.
      </div>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat-box">
          <span>토벌 수</span>
          <strong>{summary.kills.toLocaleString()}체</strong>
        </div>
        <div className="stat-box">
          <span>획득 경험치</span>
          <strong>+{summary.expGained.toLocaleString()}</strong>
        </div>
        <div className="stat-box">
          <span>획득 마석</span>
          <strong style={{ color: '#e3c481' }}>+{summary.stonesGained.toLocaleString()}</strong>
        </div>
        <div className="stat-box">
          <span>획득 마도구</span>
          <strong>{summary.itemsFound}개</strong>
        </div>
      </div>
      {summary.lanternsRecovered > 0 && (
        <div style={{ fontSize: 12, color: '#c5bdb0', marginBottom: 6 }}>
          심연 탐험 등불 +{summary.lanternsRecovered} 회복
        </div>
      )}
      {summary.trainedSkills.length > 0 && (
        <div className="list-card" style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: '#e3c481', fontWeight: 700, marginBottom: 4 }}>
            교실 수련 성과
          </div>
          <div style={{ fontSize: 12, color: '#ede7da' }}>{summary.trainedSkills.join(', ')}</div>
        </div>
      )}
      <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
        보상 수령하고 복귀하기
      </button>
    </div>
  </div>
);

export const StoryModal: React.FC<{
  actNumber: number;
  phase: 'intro' | 'clear';
  onClose: () => void;
}> = ({ actNumber, phase, onClose }) => {
  const actDef = ACTS[Math.max(0, Math.min(ACTS.length - 1, actNumber - 1))];
  const lines = phase === 'intro' ? actDef.introLines : actDef.clearLines;
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div style={{ fontSize: 11, color: '#9a9386', marginBottom: 2 }}>{actDef.location}</div>
        <h3 className="modal-title">
          {actDef.title} {phase === 'clear' ? '· 완결' : ''}
        </h3>
        <div style={{ margin: '12px 0' }}>
          {lines.map((line, idx) => (
            <div key={idx} className="dialogue-box">
              <div className="dialogue-speaker">{line.speaker}</div>
              <div className="dialogue-text">“{line.text}”</div>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-gold btn-block" onClick={onClose}>
          {phase === 'intro' ? '임무 출격하기' : '계속 진행하기'}
        </button>
      </div>
    </div>
  );
};
