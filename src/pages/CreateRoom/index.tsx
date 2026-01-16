import axios from 'axios';
import { useState } from 'react';
import { userState } from '../../common/user';
import './CreateRoom.css';

const landmarks = ['서울대입구역', '낙성대역', '자연대', '행정관'];

const CreateRoom = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [roomName, setRoomName] = useState('');
  const [minParticipants, setMinParticipants] = useState(2);

  const handleParticipantChange = (amount: number) => {
    setMinParticipants((prev) => {
      const newValue = prev + amount;
      if (newValue >= 2 && newValue <= 4) {
        return newValue;
      }
      return prev;
    });
  };

  const handleCreateRoom = async () => {
    if (!start || !end || !dateTime || !roomName) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    // check for development
    if (!userState.isLoggedIn) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
      return;
    }
    if (import.meta.env.DEV) {
      userState.email = 'dev@snu.ac.kr';
    }

    try {
      const response = await axios.post('/room', {
        name: roomName,
        from: start,
        to: end,
        time: dateTime,
        minHeadcount: minParticipants,
        user: userState.email, // Send user's email
      });

      if (response.status === 201 || response.status === 200) {
        alert('방이 성공적으로 개설되었습니다!');
        // Redirect to the new room's page?
        // window.location.href = `/rooms/${response.data.roomId}`;
      } else {
        alert('방 개설에 실패했습니다.');
      }
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
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="input-group">
          <label>방 이름</label>
          <input
            type="text"
            placeholder="방 이름을 입력하세요"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="input-group">
          <label>최소 인원</label>
          <div className="participant-control">
            <button onClick={() => handleParticipantChange(-1)}>-</button>
            <span>{minParticipants}명</span>
            <button onClick={() => handleParticipantChange(1)}>+</button>
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
