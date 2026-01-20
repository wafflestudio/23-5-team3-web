import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://snuxi.com',
  withCredentials: true,
});

export default apiClient;
