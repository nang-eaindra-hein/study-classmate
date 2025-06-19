import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home2.css';

function Home2() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setDropdownOpen(prev => !prev);
  };

  const handleLogout = () => {
    navigate('/');
  };

  const bgStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/photos/home2.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backdropFilter: 'blur(8px)'
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="home2-container" style={bgStyle}>
      {/* Top-left logo */}
      <img
        src={`${process.env.PUBLIC_URL}/photos/logo.png`}
        alt="Logo"
        className="home2-logo"
      />

      {/* Top-right profile */}
      <div className="home2-profile">
        <img
          src={`${process.env.PUBLIC_URL}/photos/profile.jpg`}
          alt="Profile"
          onClick={handleProfileClick}
          style={{ cursor: 'pointer' }}
        />
        {dropdownOpen && (
          <div className="dropdown-glass">
            <button className="btn" onClick={() => handleNavigate('/account')}>Account</button>
            <button className="btn" onClick={() => handleNavigate('/saved')}>Saved</button>
            <button className="btn" onClick={() => handleNavigate('/purchase')}>Purchase</button>
            <button className="btn" onClick={() => handleNavigate('/settings')}>Setting</button>
            <button className="btn" onClick={() => handleNavigate('/about')}>About Developer</button>
            <button className="btn" onClick={handleLogout}>Log Out</button>
          </div>
        )}
      </div>

      {/* Center buttons */}
      <div className="home2-header">
        <button className="home2-btn" onClick={() => handleNavigate('/streak')}>Streak</button>
        <button className="home2-btn" onClick={() => handleNavigate('/media')}>Media</button>
        <button className="home2-btn" onClick={() => handleNavigate('/play')}>Play</button>
        <button className="home2-btn" onClick={() => handleNavigate('/study')}>Study</button>
      </div>
    </div>
  );
}

export default Home2;
