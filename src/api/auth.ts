import apiClient from './index';

// export 키워드 제거 (이 파일 내부에서만 참조 가능)
interface User {
  // id: number;
  email: string;
  username: string;
  profileImageUrl: string | null;
  role: 'USER';
}

export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/user/profile');
  return response.data;
};
