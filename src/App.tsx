import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { getMe } from './api/auth';
import { getUserId } from './api/user';
import {
  emailAtom,
  isLoggedInAtom,
  nicknameAtom,
  profileImageAtom,
  userIdAtom,
} from './common/user';
import Router from './router/Router';

const App = () => {
  const [loading, setLoading] = useState(true);
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setUserId = useSetAtom(userIdAtom);
  const setEmail = useSetAtom(emailAtom);
  const setNickname = useSetAtom(nicknameAtom);
  const setProfileImage = useSetAtom(profileImageAtom);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const [user, userId] = await Promise.all([getMe(), getUserId()]);
        setIsLoggedIn(true);
        setUserId(userId);
        setEmail(user.email);
        setNickname(user.username);
        setProfileImage(user.profileImageUrl);
      } catch (_error) {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [setIsLoggedIn, setUserId, setEmail, setNickname, setProfileImage]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Router />;
};

export default App;
