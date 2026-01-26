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
