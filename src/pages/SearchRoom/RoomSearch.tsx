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

const RoomSearch = () => {
  // --- 검색 필터 상태 ---
  // 0은 '전체'를 의미 (초기값 0으로 설정하여 전체 검색 상태로 시작 가능)
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
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);

      try {
        // 1. 검색 대상 ID 목록 생성
        // 0(전체)이면 LANDMARKS의 모든 ID를, 아니면 선택된 ID 하나만 배열에 담음
        const targetDepIds =
          departureId === 0 ? LANDMARKS.map((l) => l.id) : [departureId];
        const targetDestIds =
          destinationId === 0 ? LANDMARKS.map((l) => l.id) : [destinationId];

        // 2. 요청할 모든 조합 생성 (최악의 경우 15 x 15 = 225개 요청이므로 주의 필요)
        // 실제로는 사용자가 한쪽만 '전체'로 두는 경우가 많을 것임
        const requestPromises = [];

        for (const depId of targetDepIds) {
          for (const destId of targetDestIds) {
            // 출발지와 도착지가 같으면 굳이 조회할 필요 없음 (서버 로직상 불가능할 수 있음)
            if (depId === destId) continue;

            requestPromises.push(
              apiClient.get('/rooms/search', {
                params: {
                  departureId: depId,
                  destinationId: destId,
                  page: pageNumber,
                  size: 10, // 각 요청당 10개씩 (합치면 많아질 수 있음)
                  sort: ['departureTime,asc'],
                },
              })
            );
          }
        }

        // 3. 모든 API 요청 병렬 실행
        const responses = await Promise.all(requestPromises);

        // 4. 결과 취합 및 데이터 매핑
        let aggregatedRooms: RoomData[] = [];
        let isAllLast = true; // 모든 요청이 마지막 페이지인지 확인

        for (const res of responses) {
          const content = res.data.content || [];
          // 하나라도 마지막 페이지가 아니면(데이터가 더 있으면) hasMore는 true
          if (res.data.last === false) {
            isAllLast = false;
          }

          // biome-ignore lint/suspicious/noExplicitAny: API 응답 처리
          const mapped = content.map((item: any) => ({
            roomId: item.id,
            departure: getLandmarkName(item.departureId),
            destination: getLandmarkName(item.destinationId),
            departureTime: item.departureTime,
            maxCapacity: item.maxCapacity,
            currentCapacity: item.currentCount,
            hostName: `학우 ${item.ownerId}`,
          }));
          aggregatedRooms = [...aggregatedRooms, ...mapped];
        }

        // 5. 시간순 정렬 (여러 API 결과를 합쳤으므로 순서가 섞여있을 수 있음)
        aggregatedRooms.sort(
          (a, b) =>
            new Date(a.departureTime).getTime() -
            new Date(b.departureTime).getTime()
        );

        // 6. 상태 업데이트
        if (isNewSearch) {
          setRooms(aggregatedRooms);
        } else {
          setRooms((prev) => {
            // 중복 제거 (여러 페이지 요청 시 겹칠 수 있는 가능성 대비)
            const existingIds = new Set(prev.map((r) => r.roomId));
            const uniqueNewRooms = aggregatedRooms.filter(
              (r) => !existingIds.has(r.roomId)
            );
            return [...prev, ...uniqueNewRooms].sort(
              (a, b) =>
                new Date(a.departureTime).getTime() -
                new Date(b.departureTime).getTime()
            );
          });
        }

        // 데이터가 하나도 없거나, 모든 요청이 마지막 페이지라면 더 이상 불러올 게 없음
        setHasMore(!isAllLast && aggregatedRooms.length > 0);
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
