export interface RoomData {
  roomId: number;
  departure: string; // 출발지 (한글 변환됨)
  destination: string; // 도착지 (한글 변환됨)
  departureTime: string; // 출발 시간 (ISO String)
  currentCapacity: number; // 현재 인원
  maxCapacity: number; // 최대 인원
  hostName: string; // 방장 이름 (또는 익명 ID)
}
