import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import CreateRoom from '../pages/CreateRoom';

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
