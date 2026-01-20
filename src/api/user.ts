import apiClient from './index';

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
