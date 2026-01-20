import React from 'react';
import './RoomCard.css';
import { type RoomData } from '../../types';

interface RoomCardProps {
  room: RoomData;
  onClick: (roomId: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  // 날짜 포맷팅 (예: 1월 20일 오후 07:30)
  const formattedTime = new Date(room.departureTime).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // 모집 상태 계산
  const isFull = room.currentCapacity >= room.maxCapacity;

  return (
    <div className="room-card" onClick={() => onClick(room.roomId)}>
      {/* 1. 경로 정보 (가장 크게 강조) */}
      <div className="room-route-row">
        <span className="location departure">{room.departure}</span>
        <span className="arrow">→</span>
        <span className="location destination">{room.destination}</span>
      </div>

      {/* 2. 시간 및 방장 정보 */}
      <div className="room-info-row">
        <span className="time-badge">🕒 {formattedTime}</span>
        <span className="host-name">👑 {room.hostName}</span>
      </div>

      {/* 3. 하단 상태 (모집중/완료 및 인원) */}
      <div className="room-status-row">
        <div className={`status-badge ${isFull ? 'full' : 'open'}`}>
          {isFull ? '모집완료' : '모집중'}
        </div>
        <span className={`headcount ${isFull ? 'full-text' : ''}`}>
          👤 {room.currentCapacity} / {room.maxCapacity}
        </span>
      </div>
    </div>
  );
};

export default RoomCard;
