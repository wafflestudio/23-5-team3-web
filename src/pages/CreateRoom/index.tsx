import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../../api/room';
import { userState } from '../../common/user';
import './CreateRoom.css';

const landmarks = ['서울대입구역', '낙성대역', '자연대', '행정관'];

const CreateRoom = () => {
  const navigate = useNavigate();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [minCapacity, setMinCapacity] = useState(2);

  const handleCapacityChange = (amount: number) => {
    setMinCapacity((prev) => {
      const newValue = prev + amount;
      if (newValue >= 2 && newValue <= 4) {
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

    if (!userState.isLoggedIn) {
      alert('로그인이 필요합니다.');
      window.location.href = '/';
      return;
    }

    const departureId = landmarks.indexOf(start) + 1;
    const destinationId = landmarks.indexOf(end) + 1;

    const departureTimeISO = new Date(departureTime).toISOString();

    try {
      await createRoom({
        departureId,
        destinationId,
        departureTime: departureTimeISO,
        minCapacity,
        maxCapacity: 4,
        estimatedFee: 0, // Hardcoded placeholder for estimatedFee
      });

      alert('방이 성공적으로 개설되었습니다!');
      navigate('/search-room');
    } catch (error) {
      console.error('Error creating room:', error);
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
            {landmarks.map((landmark) => (
              <option key={`start-${landmark}`} value={landmark}>
                {landmark}
              </option>
            ))}
          </select>
        </div>
        <div className="arrow">→</div>
        <div className="location-select">
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            <option value="">도착지</option>
            {landmarks.map((landmark) => (
              <option key={`end-${landmark}`} value={landmark}>
                {landmark}
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
            <button onClick={() => handleCapacityChange(-1)}>-</button>
            <span>{minCapacity}명</span>
            <button onClick={() => handleCapacityChange(1)}>+</button>
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
