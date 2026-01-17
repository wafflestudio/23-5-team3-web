import { useEffect } from 'react';
import Router from './router/Router';
import { getMe } from './api/auth';
import apiClient from './api';
import { userState } from './common/user';

const App = () => {
  useEffect(() => {
    const checkUser = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');

      if (urlToken) {
        localStorage.setItem('accessToken', urlToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;
        // Clean up the URL
        window.history.replaceState({}, document.title, '/');
      }

      const token = localStorage.getItem('accessToken');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const user = await getMe();
          userState.isLoggedIn = true;
          userState.email = user.email;
          userState.nickname = user.username; // Changed from nickname to username
          userState.profileImage = user.profileImageUrl; // Changed from profileImage to profileImageUrl
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('accessToken');
        }
      }
    };
    checkUser();
  }, []);

  return <Router />;
};

export default App;
