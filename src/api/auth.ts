import apiClient from './index';

interface User {
  // id: number;
  email: string;
  username: string;
  profileImageUrl: string | null;
  role: 'USER' | 'ADMIN';
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/user/profile');
  return response.data;
};
