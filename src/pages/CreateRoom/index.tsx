import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../api/room';
import { isLoggedInAtom } from '../../common/user';
import './CreateRoom.css';

const LANDMARKS = [
  { id: 1, name: '서울대입구역 3번 출구' },
  { id: 2, name: '낙성대역 버스정류장' },
  { id: 3, name: '낙성대입구 버스정류장' },
  { id: 4, name: '대학동고시촌입구(녹두)' },
  { id: 5, name: '사당역 4번 출구' },
  { id: 6, name: '경영대.행정대학원' },
  { id: 7, name: '자연대.행정관입구' },
  { id: 8, name: '법대.사회대입구' },
  { id: 9, name: '농생대' },
  { id: 10, name: '공대입구(글로벌공학)' },
  { id: 11, name: '제2공학관(302동)' },
  { id: 12, name: '학부생활관' },
  { id: 13, name: '수의대입구.보건대학원' },
  { id: 14, name: '기숙사 삼거리' },
  { id: 15, name: '국제대학원' },
];

const CreateRoom = () => {
  const navigate = useNavigate();
  const [start, setStart] = useState('1');
  const [end, setEnd] = useState('2');
  const [departureTime, setDepartureTime] = useState('');
  const [minCapacity, setMinCapacity] = useState(2);
  const [isLoggedIn] = useAtom(isLoggedInAtom);

  const handleMinCapacityChange = (amount: number) => {
    setMinCapacity((prev) => {
      const newValue = prev + amount;
      if (newValue >= 2 && newValue <= 4) {
        // Max capacity is 4
        return newValue;
      }
      return prev;
    });
  };

  const handleCreateRoom = async () => {
    // Adjusted validation
    if (!start || !end || !departureTime || !minCapacity) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      window.location.href = '/';
      return;
    }

    const departureId = parseInt(start, 10);
    const destinationId = parseInt(end, 10);

    const departureTimeISO = new Date(departureTime).toISOString();

    const roomDetails = {
      departureId,
      destinationId,
      departureTime: departureTimeISO,
      minCapacity,
      maxCapacity: 4, // Hardcoded
      estimatedFee: 0, // Hardcoded
    };

    try {
      const _response = await createRoom(roomDetails);

      alert('방이 성공적으로 개설되었습니다! ID: ' + _response.createdPotId);
      navigate('/search-room');
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Error creating room:', error.response?.data);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      alert('방 개설 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container">
      <h1>방 개설하기</h1>

      <div className="card location-box">
        <div className="location-select">
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            <option value="">출발지</option>
            {LANDMARKS.map((landmark) => (
              <option key={`start-${landmark.id}`} value={landmark.id}>
                {landmark.name}
              </option>
            ))}
          </select>
        </div>
        <div className="arrow">→</div>
        <div className="location-select">
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            <option value="">도착지</option>
            {LANDMARKS.map((landmark) => (
              <option key={`end-${landmark.id}`} value={landmark.id}>
                {landmark.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="input-group">
          <label>날짜 및 시간</label>
          <input
            type="datetime-local"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="input-group">
          <label>최소 인원</label>
          <div className="participant-control">
            <button onClick={() => handleMinCapacityChange(-1)}>-</button>
            <span>{minCapacity}명</span>
            <button onClick={() => handleMinCapacityChange(1)}>+</button>
          </div>
        </div>
      </div>

      <button className="create-button" onClick={handleCreateRoom}>
        방 개설하기
      </button>
    </div>
  );
};

export default CreateRoom;
