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

export const createRoom = async (
  roomDetails: RoomCreationRequest
): Promise<RoomCreationResponse> => {
  const response = await apiClient.post<RoomCreationResponse>(
    '/room',
    roomDetails
  );
  return response.data;
};
