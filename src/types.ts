// types.ts (별도 파일로 관리하거나 컴포넌트 상단에 정의)
export interface RoomData {
  roomId: number; // 고유 ID
  name: string;
  from: string;
  to: string;
  time: string; // ISO String or datetime string
  maxHeadcount: number;
  currentHeadcount: number; // 현재 인원 (보통 검색시 필요함)
  user: string; // 방장
}
