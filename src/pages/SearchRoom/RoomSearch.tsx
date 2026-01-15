// import axios from 'axios';
// import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { type RoomData } from '../../types';
import RoomCard from './RoomCard';
import './RoomSearch.css'; // 스타일 파일

const landmarks = ['서울대입구역', '낙성대역', '자연대', '행정관'];

// 테스트용 가짜 데이터 생성 (API 연결 전 확인용)
const MOCK_DATA: RoomData[] = Array.from({ length: 35 }).map((_, i) => ({
  roomId: i + 1,
  name: `집에 가고 싶다 ${i + 1}`,
  from: landmarks[i % landmarks.length],
  to: landmarks[(i + 1) % landmarks.length],
  time: new Date(Date.now() + i * 3600000).toISOString(), // 1시간 간격
  maxHeadcount: 4,
  currentHeadcount: (i % 3) + 1,
  user: `user${i}@snu.ac.kr`,
}));

const RoomSearch = () => {
  // --- 검색 필터 상태 ---
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [searchDate, setSearchDate] = useState(''); // 날짜 검색
  const [keyword, setKeyword] = useState(''); // 방 이름 검색

  // --- 데이터 및 페이지네이션 상태 ---
  const [rooms, setRooms] = useState<RoomData[]>([]); // 화면에 보여줄 방 목록
  const [totalItems, setTotalItems] = useState(0); // 전체 아이템 수
  const [page, setPage] = useState(1); // 현재 페이지
  const PAGE_SIZE = 5; // 한 페이지당 보여줄 개수

  // 방 검색 함수 (Mock 데이터 사용 / API 주석 포함)
  // useCallback으로 감싸서 의존성 값이 변할 때만 함수가 재생성되도록 수정
  const searchRooms = useCallback(
    async (pageNumber: number) => {
      try {
        // API 연결 시 아래 코드를 사용하세요.
        /*
      const response = await axios.get('/room/search', {
        params: {
          from: start || undefined,
          to: end || undefined,
          date: searchDate || undefined,
          name: keyword || undefined,
          page: pageNumber,
          size: PAGE_SIZE
        }
      });
      setRooms(response.data.content);
      setTotalItems(response.data.totalElements);
      */

        // --- Mock 데이터 필터링 로직 (API 없이 테스트용) ---
        const filtered = MOCK_DATA.filter((room) => {
          const matchStart = start ? room.from === start : true;
          const matchEnd = end ? room.to === end : true;
          const matchName = keyword ? room.name.includes(keyword) : true;

          // 날짜 비교 (선택한 날짜와 같은 날인지)
          let matchDate = true;
          if (searchDate) {
            const roomDate = new Date(room.time).toISOString().slice(0, 10);
            matchDate = roomDate === searchDate;
          }

          return matchStart && matchEnd && matchName && matchDate;
        });

        // 최신순 정렬 (ID 역순 등)
        filtered.sort((a, b) => b.roomId - a.roomId);

        setTotalItems(filtered.length);

        // 페이지네이션 슬라이싱
        const startIndex = (pageNumber - 1) * PAGE_SIZE;
        const paginatedItems = filtered.slice(
          startIndex,
          startIndex + PAGE_SIZE
        );

        setRooms(paginatedItems);
        // ---------------------------------------------------
      } catch (error) {
        console.error('검색 실패:', error);
        alert('방 목록을 불러오는데 실패했습니다.');
      }
    },
    [start, end, searchDate, keyword]
  ); // 의존성 배열 추가

  // 필터가 바뀌면 1페이지부터 다시 검색하도록 설정
  // searchRooms가 start, end 등이 바뀔 때마다 갱신되므로 의존성에 searchRooms만 넣음
  useEffect(() => {
    setPage(1);
    searchRooms(1);
  }, [searchRooms]);

  // 페이지 변경 시 데이터 갱신
  useEffect(() => {
    searchRooms(page);
  }, [page, searchRooms]);

  const handleSearchClick = () => {
    setPage(1);
    searchRooms(1);
  };

  const handleRoomClick = (_roomId: number) => {
    // 상세 페이지 이동 로직
    // console.log(`${roomId}번 방으로 이동`);
    // navigate(`/rooms/${roomId}`);
  };

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className="container">
      <h1>택시팟 찾기</h1>

      {/* --- 검색 조건 섹션 --- */}
      <div className="search-filter-card">
        <div className="filter-row">
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            <option value="">출발지 전체</option>
            {landmarks.map((landmark) => (
              <option key={`start-${landmark}`} value={landmark}>
                {landmark}
              </option>
            ))}
          </select>
          <span className="arrow">→</span>
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            <option value="">도착지 전체</option>
            {landmarks.map((landmark) => (
              <option key={`end-${landmark}`} value={landmark}>
                {landmark}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-row">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="방 이름 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
          />
          <button className="search-btn" onClick={handleSearchClick}>
            검색
          </button>
        </div>
      </div>

      {/* --- 방 목록 리스트 섹션 --- */}
      <div className="room-list">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <RoomCard key={room.roomId} room={room} onClick={handleRoomClick} />
          ))
        ) : (
          <div className="no-result">조건에 맞는 방이 없습니다.</div>
        )}
      </div>

      {/* --- 페이지네이션 컨트롤 --- */}
      {totalItems > 0 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            &lt;
          </button>

          {/* 페이지 번호 표시 (간단한 버전) */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                className={page === pageNum ? 'active' : ''}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            )
          )}

          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomSearch;
