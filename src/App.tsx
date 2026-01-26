import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { User, getMe } from './api/auth';
import {
  emailAtom,
  isLoggedInAtom,
  nicknameAtom,
  profileImageAtom,
} from './common/user';
import Router from './router/Router';

const App = () => {
  const setIsLoggedIn = useSetAtom(isLoggedInAtom);
  const setEmail = useSetAtom(emailAtom);
  const setNickname = useSetAtom(nicknameAtom);
  const setProfileImage = useSetAtom(profileImageAtom);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user: User = await getMe();
        setIsLoggedIn(true);
        setEmail(user.email);
        setNickname(user.username);
        setProfileImage(user.profileImageUrl);
      } catch (_error) {
        setIsLoggedIn(false);
      }
    };
    checkUser();
  }, [setIsLoggedIn, setEmail, setNickname, setProfileImage]);

  return <Router />;
};

export default App;
