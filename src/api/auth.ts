import apiClient from './index';

// export interface User {
//   email: string;
//   username: string;
//   profileImageUrl: string | null;
//   role: 'USER';
// }

// export const getMe = async (): Promise<User> => {
//   const response = await apiClient.get<User>('/user/profile');
//   return response.data;
// };

export const logout = async () => {
  await apiClient.post('/logout');
  localStorage.removeItem('accessToken');
  delete apiClient.defaults.headers.common['Authorization'];
};
