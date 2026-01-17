import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://3.39.210.8.nip.io:8080',
});

export default apiClient;
