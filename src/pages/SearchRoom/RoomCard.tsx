import React from 'react';
import './RoomCard.css'; // 스타일은 별도 파일 또는 기존 CSS 활용
import { type RoomData } from '../../types'; // 위에서 정의한 타입 import

interface RoomCardProps {
  room: RoomData;
  onClick: (roomId: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  // 날짜 포맷팅 (보기 좋게 변환)
  const formattedDate = new Date(room.time).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="room-card" onClick={() => onClick(room.roomId)}>
      <div className="room-header">
        <span className="room-name">{room.name}</span>
        <span className="room-user">방장: {room.user}</span>
      </div>

      <div className="room-route">
        <span className="location">{room.from}</span>
        <span className="arrow">→</span>
        <span className="location">{room.to}</span>
      </div>

      <div className="room-details">
        <span className="room-time">🕒 {formattedDate}</span>
        <span
          className={`room-headcount ${room.currentHeadcount === room.maxHeadcount ? 'full' : ''}`}
        >
          👤 {room.currentHeadcount} / {room.maxHeadcount}
        </span>
      </div>
    </div>
  );
};

export default RoomCard;
