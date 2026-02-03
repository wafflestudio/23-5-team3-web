import { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLandmarks } from '../../api/map';
import type { Pot } from '../../api/room';
import { getCurrentPot, leaveRoom } from '../../api/room';
import './MyChat.css';

const MyChat = () => {
  const [currentPot, setCurrentPot] = useState<Pot | null>(null);
  const [landmarks, setLandmarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  // 랜드마크 정보 가져오기
  const fetchLandmarksData = useCallback(async () => {
    try {
      const data = await getLandmarks();
      if (data && data.landmarks) {
        const landmarksMap: Record<number, string> = {};
        // biome-ignore lint/suspicious/noExplicitAny: API 응답 타입
        data.landmarks.forEach((l: any) => {
          landmarksMap[l.id] = l.name;
        });
        setLandmarks(landmarksMap);
      }
    } catch (error) {
      console.error('랜드마크 정보를 불러오지 못했습니다:', error);
    }
  }, []);

  // 현재 내 팟 정보 가져오기
  const fetchCurrentPot = useCallback(async () => {
    try {
      const pot = await getCurrentPot();
      // [수정] 받아온 pot이 null이나 빈 값이면 null로 상태 업데이트
      if (!pot) {
        setCurrentPot(null);
      } else {
        setCurrentPot(pot);
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Error fetching current pot:', error.response?.data);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      setCurrentPot(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLandmarksData(), fetchCurrentPot()]);
      setLoading(false);
    };
    init();
  }, [fetchLandmarksData, fetchCurrentPot]);

  const handleLeave = async () => {
    if (currentPot) {
      // eslint-disable-next-line no-restricted-globals
      if (confirm('정말로 현재 방에서 나가시겠습니까?')) {
        try {
          await leaveRoom(currentPot.id);
          alert('방에서 나갔습니다.');
          // 방 나가기 성공 후 상태 갱신
          fetchCurrentPot();
        } catch (_error: unknown) {
          alert('방에서 나가는 중 오류가 발생했습니다.');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="my-chat-container loading-container">
        <div className="loading-text">로딩 중...</div>
      </div>
    );
  }

  // 상태 텍스트 및 클래스 계산
  let statusText = '모집중';
  let statusClass = 'recruiting';

  if (currentPot) {
    if (currentPot.status === 'SUCCESS') {
      statusText = '모집완료';
      statusClass = 'success';
    } else if (currentPot.status === 'RECRUITING') {
      statusText = '모집중';
      statusClass = 'recruiting';
    } else {
      statusText = '마감';
      statusClass = 'closed';
    }
  }

  return (
    <div className="my-chat-container">
      {/* [수정] !currentPot 조건으로 변경하여 빈 문자열 등이 와도 처리되도록 함 */}
      {!currentPot ? (
        <div className="no-pot-message">현재 참여 중인 팟이 없습니다.</div>
      ) : (
        <>
          <h1 className="page-title">참여 중인 팟</h1>
          <div className="current-pot-card">
            <Link to={`/chat/${currentPot.id}`} className="pot-link">
              <div className="pot-details">
                <div className="pot-info">
                  <span className="location">
                    {landmarks[currentPot.departureId] || '알 수 없음'}
                  </span>{' '}
                  <span className="arrow">→</span>{' '}
                  <span className="location">
                    {landmarks[currentPot.destinationId] || '알 수 없음'}
                  </span>
                  {currentPot.unreadCount > 0 && (
                    <span className="unread-badge">
                      {currentPot.unreadCount}
                    </span>
                  )}
                </div>
                <div className="pot-meta">
                  <span className="time">
                    {new Date(currentPot.departureTime).toLocaleString(
                      'ko-KR',
                      {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </span>

                  <span className={`status-badge ${statusClass}`}>
                    {statusText}
                  </span>
                  <span className="headcount-fixed">
                    {currentPot.currentCount}/{currentPot.maxCapacity}
                  </span>
                </div>
              </div>
            </Link>
            <button className="leave-button" onClick={handleLeave}>
              나가기
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MyChat;
