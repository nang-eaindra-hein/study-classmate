// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';           // Your welcome screen with quote
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Home2 from './pages/Home2';         // The new screen after login
import './App.css';
import StreakPage from './pages/StreakPage';
import MediaPage from './pages/MediaPage';
import PlayPage from './pages/PlayPage';
import StudyPage from './pages/StudyPage';
import AccountPage from './pages/AccountPage';
import SavedPage from './pages/SavedPage';
import PurchasePage from './pages/PurchasePage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<Home />} />            {/* Correct landing page */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home2" element={<Home2 />} />       {/* After login page */}
        <Route path="/streak" element={<StreakPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  );
}
