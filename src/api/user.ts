import apiClient from './index';

interface UsernameUpdateRequest {
  username: string;
}

export const updateProfilePicture = async (file: File) => {
  const formData = new FormData();
  formData.append('picture', file);

  const response = await apiClient.post('/user/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const updateUsername = async (username: string) => {
  const response = await apiClient.patch<UsernameUpdateRequest>(
    '/user/profile',
    { username }
  );
  return response.data;
};
