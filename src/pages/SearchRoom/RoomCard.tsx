import React from 'react';
import './RoomCard.css';
import { type RoomData } from '../../types';

interface RoomCardProps {
  room: RoomData;
  onClick: (roomId: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  // 날짜 포맷팅 (예: 1/20 19:30)
  const formattedTime = new Date(room.departureTime).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // 모집 상태 계산
  const isFull = room.currentCapacity >= room.maxCapacity;

  // 요금 포맷팅 (무료 표기 대신 항상 "원" 표기)
  const feeDisplay = `${room.estimatedFee.toLocaleString()}원`;

  return (
    <div className="room-card" onClick={() => onClick(room.roomId)}>
      {/* 1. 경로 정보 */}
      <div className="room-route-row">
        <div className="location departure">{room.departure}</div>
        <div className="arrow">→</div>
        <div className="location destination">{room.destination}</div>
      </div>

      {/* 2. 상세 정보 (시간 | 요금) */}
      <div className="room-details-row">
        <span className="info-item time">🕒 {formattedTime}</span>
        <span className="info-divider">|</span>
        <span className="info-item fee">💸 {feeDisplay}</span>
      </div>

      {/* 3. 하단 (방장 이름, 상태) */}
      <div className="room-footer-row">
        <div className="host-info">
          {/* '방장' 라벨 제거됨 */}
          <span className="host-name">{room.hostName}</span>
        </div>

        <div className="status-container">
          <span className={`status-badge ${isFull ? 'full' : 'open'}`}>
            {isFull ? '완료' : '모집중'}
          </span>
          <span className={`headcount ${isFull ? 'full-text' : ''}`}>
            {room.currentCapacity}/{room.maxCapacity}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
