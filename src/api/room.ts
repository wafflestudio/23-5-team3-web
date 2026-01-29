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
  status: 'RECRUITING' | 'WAITING' | 'DEPARTED' | 'COMPLETED' | 'CANCELLED';
}

export interface Message {
  id: number;
  potId: number;
  senderId: number;
  text: string;
  datetimeSendAt: string;
}

// [수정] export 제거: 이 파일 내부에서만 사용됨
interface GetMessagesResponse {
  items: Message[];
  nextCursor: number;
  hasNext: boolean;
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

export const getCurrentPot = async (): Promise<Pot> => {
  const response = await apiClient.get<Pot>('/users/me/pot');
  return response.data;
};

export const deleteRoom = async (roomId: number): Promise<void> => {
  await apiClient.delete(`/rooms/${roomId}`);
};

export const getMessages = async (
  roomId: number,
  cursor: number,
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
