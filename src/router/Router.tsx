import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import NavBar from '../components/NavBar';
import CreateRoom from '../pages/CreateRoom';
import Login from '../pages/Login';
import MyChat from '../pages/MyChat';
import MyPage from '../pages/MyPage/MyPage';
import RoomSearch from '../pages/SearchRoom/RoomSearch';

const MainLayout = () => {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/search-room" element={<RoomSearch />} />
          <Route path="/create-room" element={<CreateRoom />} />
          <Route path="/my-chat" element={<MyChat />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/" element={<RoomSearch />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
