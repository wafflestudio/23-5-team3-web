import { FaComment, FaPlus, FaSearch, FaUser } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  const navLinks = [
    { path: '/search-room', icon: <FaSearch />, label: 'roomSearch' },
    { path: '/create-room', icon: <FaPlus />, label: 'roomCreate' },
    { path: '/my-chat', icon: <FaComment />, label: 'myChat' },
    { path: '/my-page', icon: <FaUser />, label: 'myPage' },
  ];

  return (
    <nav className="bottom-nav">
      {navLinks.map(({ path, icon, label }) => (
        <Link
          key={path}
          to={path}
          className={`nav-item ${location.pathname === path ? 'active' : ''}`}
        >
          <div className="icon">{icon}</div>
          <div className="label">{label}</div>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
