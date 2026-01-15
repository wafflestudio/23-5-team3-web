import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CreateRoom from '../pages/CreateRoom';
import Login from '../pages/Login';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<CreateRoom />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
