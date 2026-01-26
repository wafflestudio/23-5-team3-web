import { AxiosError } from 'axios';
import { useAtomValue } from 'jotai'; // [수정] Jotai 훅 추가
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../api/constants';
import apiClient from '../../api/index';
import { isLoggedInAtom } from '../../common/user'; // [수정] atom import로 변경
import { type RoomData } from '../../types';
import RoomCard from './RoomCard';
import './RoomSearch.css';

// 서버 DB에 등록된 실제 ID 매핑
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

const getLandmarkName = (id: number) => {
  return LANDMARKS.find((l) => l.id === id)?.name || '알 수 없음';
};

// 서버 API 응답 데이터(PotDto)의 타입 정의
interface PotDto {
  id: number;
  ownerId: number;
  departureId: number;
  destinationId: number;
  departureTime: string;
  minCapacity: number;
  maxCapacity: number;
  currentCount: number;
  estimatedFee: number;
  status: string;
}

const RoomSearch = () => {
  const navigate = useNavigate();

  // [수정] 전역 상태(Atom)에서 로그인 여부 구독
  const isLoggedIn = useAtomValue(isLoggedInAtom);

  // --- 검색 필터 상태 ---
  const [departureId, setDepartureId] = useState<number>(0);
  const [destinationId, setDestinationId] = useState<number>(0);

  // --- 데이터 상태 ---
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- 모달 상태 ---
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // --- Refs ---
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- API 데이터 조회 함수 ---
  const fetchRooms = useCallback(
    async (pageNumber: number, isNewSearch: boolean) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        const params = {
          departureId: departureId === 0 ? null : departureId,
          destinationId: destinationId === 0 ? null : destinationId,
          page: pageNumber,
          size: 10,
          sort: 'departureTime,asc',
        };

        const response = await apiClient.get('/rooms/search', { params });
        const content = response.data.content || [];

        const newRooms: RoomData[] = content.map((item: PotDto) => ({
          roomId: item.id,
          departure: getLandmarkName(item.departureId),
          destination: getLandmarkName(item.destinationId),
          departureTime: item.departureTime,
          maxCapacity: item.maxCapacity,
          currentCapacity: item.currentCount,
          hostName: `학우 ${item.ownerId}`,
        }));

        const isLast = response.data.last ?? newRooms.length === 0;

        if (isNewSearch) {
          setRooms(newRooms);
        } else {
          setRooms((prev) => {
            const existingIds = new Set(prev.map((r) => r.roomId));
            const uniqueRooms = newRooms.filter(
              (r) => !existingIds.has(r.roomId)
            );
            return [...prev, ...uniqueRooms];
          });
        }

        setHasMore(!isLast);
      } catch (error) {
        console.error('방 목록 불러오기 실패:', error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [departureId, destinationId]
  );

  // --- Effect 1: 필터 변경 시 ---
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchRooms(0, true);
  }, [fetchRooms]);

  // --- Effect 2: 페이지 변경 시 ---
  useEffect(() => {
    if (page > 0) {
      fetchRooms(page, false);
    }
  }, [page, fetchRooms]);

  // --- Effect 3: 무한 스크롤 ---
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) observer.disconnect();
    };
  }, [loading, hasMore]);

  // --- 핸들러: 방 클릭 ---
  const handleRoomClick = (roomId: number) => {
    setSelectedRoomId(roomId);

    // [수정] atom 값(isLoggedIn)을 사용하여 분기 처리
    if (isLoggedIn) {
      // 로그인 상태 -> 참여 확인 모달
      setShowJoinModal(true);
    } else {
      // 비로그인 상태 -> 로그인 유도 모달
      setShowLoginModal(true);
    }
  };

  // --- 핸들러: 로그인 버튼 클릭 ---
  const handleLoginConfirm = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    const googleLoginUrl = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;
    window.location.href = googleLoginUrl;
  };

  // --- 핸들러: 참여하기 버튼 클릭 ---
  const handleJoinConfirm = async () => {
    if (!selectedRoomId) return;

    try {
      await apiClient.post(`/rooms/${selectedRoomId}/join`);
      navigate('/my-chat');
    } catch (error) {
      const axiosError = error as AxiosError<{ errMsg: string }>;
      const errMsg =
        axiosError.response?.data?.errMsg || '참여에 실패했습니다.';

      alert(errMsg);
      setShowJoinModal(false);
    }
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowJoinModal(false);
    setSelectedRoomId(null);
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setter: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setter(Number(e.target.value));
  };

  return (
    <div className="search-container">
      <div className="sticky-header">
        <h1>택시팟 찾기</h1>
        <div className="search-filter-card">
          <div className="filter-row">
            <select
              value={departureId}
              onChange={(e) => handleFilterChange(e, setDepartureId)}
            >
              <option value={0}>출발지 전체</option>
              {LANDMARKS.map((place) => (
                <option key={`start-${place.id}`} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
            <span className="arrow">→</span>
            <select
              value={destinationId}
              onChange={(e) => handleFilterChange(e, setDestinationId)}
            >
              <option value={0}>도착지 전체</option>
              {LANDMARKS.map((place) => (
                <option key={`end-${place.id}`} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="room-list-scroll">
        {rooms.length > 0
          ? rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onClick={handleRoomClick}
              />
            ))
          : !loading && (
              <div className="no-result">조건에 맞는 방이 없습니다.</div>
            )}

        {hasMore && (
          <div ref={loadMoreRef} className="loading-sentinel">
            {loading ? '로딩 중...' : ''}
          </div>
        )}
      </div>

      {/* --- 모달 UI (인라인 스타일 적용) --- */}
      {(showLoginModal || showJoinModal) && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {showLoginModal && (
              <>
                <p>택시팟에 참여하시려면 로그인이 필요합니다.</p>
                <div style={buttonGroupStyle}>
                  <button onClick={closeModals} style={cancelButtonStyle}>
                    뒤로가기
                  </button>
                  <button
                    onClick={handleLoginConfirm}
                    style={confirmButtonStyle}
                  >
                    로그인
                  </button>
                </div>
              </>
            )}
            {showJoinModal && (
              <>
                <p>택시팟에 참가하시겠습니까?</p>
                <div style={buttonGroupStyle}>
                  <button onClick={closeModals} style={cancelButtonStyle}>
                    뒤로가기
                  </button>
                  <button
                    onClick={handleJoinConfirm}
                    style={confirmButtonStyle}
                  >
                    참여하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 간단한 모달 스타일 (필요시 CSS 파일로 이동) ---
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '12px',
  width: '300px',
  textAlign: 'center',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px',
  gap: '10px',
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  backgroundColor: '#f5f5f5',
  cursor: 'pointer',
};

const confirmButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold',
};

export default RoomSearch;
