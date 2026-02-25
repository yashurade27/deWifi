import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './index.css';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Placeholder routes for now */}
        <Route path="/login" element={<div className="p-10">Login Page</div>} />
        <Route path="/explore" element={<div className="p-10">Explore Page</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;