import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { type Pot, getCurrentPot, leaveRoom } from '../../api/room';
import './MyChat.css';

const landmarks = {
  1: '서울대입구역',
  2: '낙성대역',
  3: '자연대',
  4: '행정관',
};

const MyChat = () => {
  const [currentPot, setCurrentPot] = useState<Pot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentPot = useCallback(async () => {
    setLoading(true);
    try {
      const pot = await getCurrentPot();
      setCurrentPot(pot);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Error fetching current pot:', error.response?.data);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      setCurrentPot(null); // Ensure currentPot is null on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentPot();
  }, [fetchCurrentPot]);

  const handleDelete = async () => {
    if (currentPot) {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('정말로 현재 방에서 나가시겠습니까?')) {
        try {
          await leaveRoom(currentPot.id);
          alert('방에서 나갔습니다.');
          fetchCurrentPot(); // Refresh pot data
        } catch (error: unknown) {
          if (isAxiosError(error)) {
            console.error('Error deleting room:', error.response?.data);
          } else {
            console.error('An unexpected error occurred:', error);
          }
          alert('방에서 나가는 중 오류가 발생했습니다.');
        }
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="my-chat-container">
      <h1>My Current Pot</h1>
      {currentPot === null ? (
        <p>You are not currently in any pot.</p>
      ) : (
        <div className="current-pot-card">
          <Link to={`/chat/${currentPot.id}`} className="pot-link">
            <div className="pot-details">
              <div className="pot-info">
                <span>
                  {landmarks[currentPot.departureId as keyof typeof landmarks]}
                </span>{' '}
                →{' '}
                <span>
                  {
                    landmarks[
                      currentPot.destinationId as keyof typeof landmarks
                    ]
                  }
                </span>
              </div>
              <div className="pot-meta">
                <span>
                  {new Date(currentPot.departureTime).toLocaleString()}
                </span>
                <span>
                  {currentPot.currentCount}/{currentPot.maxCapacity}
                </span>
                <span>Status: {currentPot.status}</span>
              </div>
            </div>
          </Link>
          <button className="delete-button" onClick={handleDelete}>
            나가기
          </button>
        </div>
      )}
    </div>
  );
};

export default MyChat;
