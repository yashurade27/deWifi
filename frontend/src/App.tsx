import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import OwnerDashboard from './pages/OwnerDashboard';
import WifiSetup from './pages/WifiSetup';
import BookWifi from './pages/BookWifi';
import WifiSession from './pages/WifiSession';
import UserDashboard from './pages/UserDashboard';
import CaptivePortal from './pages/CaptivePortal';
import SpotDetails from './pages/SpotDetails';
import HowItWorksPage from './pages/HowItWorksPage';
import { AuthProvider } from './context/AuthContext';
import './index.css';

export function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/spots/:id" element={<SpotDetails />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/spots/new" element={<WifiSetup />} />
        <Route path="/owner/spots/:id/edit" element={<WifiSetup />} />
        <Route path="/book/:spotId" element={<BookWifi />} />
        <Route path="/session/:id" element={<WifiSession />} />
        {/* Captive Portal - redirected to when connecting to WiFi */}
        <Route path="/portal" element={<CaptivePortal />} />
        <Route path="/captive" element={<CaptivePortal />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;