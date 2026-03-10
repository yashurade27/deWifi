import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Explore from './pages/Explore';
import Enterprise from './pages/Enterprise';
import OwnerDashboard from './pages/OwnerDashboard';
import WifiSetup from './pages/WifiSetup';
import BookWifi from './pages/BookWifi';
import WifiSession from './pages/WifiSession';
import UserDashboard from './pages/UserDashboard';
import CaptivePortal from './pages/CaptivePortal';
import SpotDetails from './pages/SpotDetails';
import HowItWorksPage from './pages/HowItWorksPage';
import Community from './pages/Community';
import Profile from './pages/Profile';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Web3Provider } from './context/Web3Context';
import './index.css';

export function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/community" element={<Community />} />
            <Route path="/spots/:id" element={<SpotDetails />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/profile" element={<Profile />} />
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
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;