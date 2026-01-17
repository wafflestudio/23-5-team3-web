import { FaComment, FaPlus, FaSearch, FaUser } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { logout } from '../../api/auth';
import { BACKEND_URL } from '../../api/constants';
import { userState } from '../../common/user';
import './navBar.css';

const NavBar = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/search-room', icon: <FaSearch />, label: 'roomSearch' },
    { path: '/create-room', icon: <FaPlus />, label: 'roomCreate' },
    { path: '/my-chat', icon: <FaComment />, label: 'myChat' },
    { path: '/my-page', icon: <FaUser />, label: 'myPage' },
  ];

  const isLinkActive = (path: string) => {
    if (path === '/search-room' && location.pathname === '/') {
      return true;
    }
    return location.pathname === path;
  };

  const handleGoogleLogin = () => {
    const frontendRedirectUri = window.location.origin;

    const encodedUri = encodeURIComponent(frontendRedirectUri);
    const googleLoginUrl = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;

    window.location.href = googleLoginUrl;
  };

  const handleLogout = async () => {
    try {
      await logout();
      userState.isLoggedIn = false;
      userState.email = null;
      userState.nickname = '학부생';
      userState.profileImage = null;
      localStorage.removeItem('accessToken');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="nav-wrapper">
      <nav className="navBar">
        <div className="logo">
          <Link to="/">
            <img src="/snuxi-logo.png" alt="SNUXI Logo" />
          </Link>
        </div>
        <div className="nav-links">
          {navLinks.map(({ path, icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${isLinkActive(path) ? 'active' : ''}`}
            >
              <div className="icon">{icon}</div>
              <div className="label">{label}</div>
            </Link>
          ))}
        </div>
        <div className="login">
          {userState.isLoggedIn ? (
            <button type="button" onClick={handleLogout} className="login-button">
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="login-button"
            >
              로그인
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
