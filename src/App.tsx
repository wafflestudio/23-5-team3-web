import MyPage from './pages/MyPage/MyPage';
import RoomSearch from './pages/SearchRoom/RoomSearch';
import Router from './router/Router';

const App = () => {
  return (
    <div>
      <MyPage />
      <Router />
      <RoomSearch />
    </div>
  );
};

export default App;
