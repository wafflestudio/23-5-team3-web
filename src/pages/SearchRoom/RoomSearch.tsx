import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from '../../api/index';
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

// [추가] 서버 API 응답 데이터(PotDto)의 타입 정의
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
  // --- 검색 필터 상태 ---
  // 0은 '전체'를 의미합니다.
  const [departureId, setDepartureId] = useState<number>(0);
  const [destinationId, setDestinationId] = useState<number>(0);

  // --- 데이터 상태 ---
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- Refs ---
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- API 데이터 조회 함수 ---
  const fetchRooms = useCallback(
    async (pageNumber: number, isNewSearch: boolean) => {
      // 로딩 중이면 중복 요청 방지
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        // 단일 API 요청
        // 0(전체)인 경우 null을 보내 서버가 전체 검색으로 인식하게 함
        const params = {
          departureId: departureId === 0 ? null : departureId,
          destinationId: destinationId === 0 ? null : destinationId,
          page: pageNumber,
          size: 10,
          sort: 'departureTime,asc',
        };

        const response = await apiClient.get('/rooms/search', { params });

        // 데이터 매핑
        const content = response.data.content || [];

        // [수정] any 대신 PotDto 타입 사용
        const newRooms: RoomData[] = content.map((item: PotDto) => ({
          roomId: item.id,
          departure: getLandmarkName(item.departureId),
          destination: getLandmarkName(item.destinationId),
          departureTime: item.departureTime,
          maxCapacity: item.maxCapacity,
          currentCapacity: item.currentCount,
          hostName: `학우 ${item.ownerId}`,
        }));

        // 마지막 페이지 여부 확인
        const isLast = response.data.last ?? newRooms.length === 0;

        if (isNewSearch) {
          setRooms(newRooms);
        } else {
          setRooms((prev) => {
            // 중복 방지
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

  // --- Effect 1: 필터 변경 시 (페이지 0부터 재검색) ---
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchRooms(0, true);
  }, [fetchRooms]);

  // --- Effect 2: 페이지 변경 시 (추가 로드) ---
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

  const handleRoomClick = (_roomId: number) => {
    // console.log(`${roomId}번 방 클릭`);
    // navigate(`/room/${roomId}`);
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
    </div>
  );
};

export default RoomSearch;
