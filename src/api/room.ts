import apiClient from './index';

interface RoomCreationRequest {
  departureId: number;
  destinationId: number;
  departureTime: string;
  minCapacity: number;
  maxCapacity: number;
  estimatedFee: number;
}

interface RoomCreationResponse {
  createdPotId: number;
}

// 서버 Enum과 일치하는 상태값 정의
export interface Pot {
  id: number;
  ownerId: number;
  departureId: number;
  destinationId: number;
  departureTime: string;
  minCapacity: number;
  maxCapacity: number;
  currentCount: number;
  estimatedFee: number;
  status: 'RECRUITING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  unreadCount: number;
}

export interface Message {
  id: number;
  potId: number;
  senderId: number;
  text: string;
  datetimeSendAt: string;
  senderUsername: string;
  senderProfileImageUrl: string | null;
}

interface GetMessagesResponse {
  items: Message[];
  nextCursor: number | null;
  hasNext: boolean;
  readStatuses: Record<number, number>;
}

export const createRoom = async (
  roomDetails: RoomCreationRequest
): Promise<RoomCreationResponse> => {
  const response = await apiClient.post<RoomCreationResponse>(
    '/room',
    roomDetails
  );
  return response.data;
};

// [수정] 응답이 비어있으면 null을 반환하도록 처리
export const getCurrentPot = async (): Promise<Pot | null> => {
  const response = await apiClient.get<Pot>('/users/me/pot');
  // axios는 body가 비어있으면 빈 문자열("")을 줄 수 있음
  if (!response.data) {
    return null;
  }
  return response.data;
};

// export const deleteRoom = async (roomId: number): Promise<void> => {
//   await apiClient.delete(`/rooms/${roomId}`);
// };

// 방 나가기 API
export const leaveRoom = async (roomId: number): Promise<void> => {
  await apiClient.post(`/rooms/${roomId}/leave`);
};

export const getMessages = async (
  roomId: number,
  cursor: number | null,
  size = 20
): Promise<GetMessagesResponse> => {
  const response = await apiClient.get<GetMessagesResponse>(
    `/rooms/${roomId}/messages`,
    {
      params: { cursor, size },
    }
  );
  return response.data;
};
/*
export const markAsRead = async (
  roomId: number,
  messageId: number
): Promise<void> => {
  await apiClient.patch(`/rooms/${roomId}/read`, { messageId });
};
*/

// export const getMessages = async (
//   roomId: number,
//   cursor: number,
//   size = 20
// ): Promise<GetMessagesResponse> => {
//   const response = await apiClient.get<GetMessagesResponse>(
//     `/rooms/${roomId}/messages`,
//     {
//       params: { cursor, size },
//     }
//   );
//   return response.data;
// };
