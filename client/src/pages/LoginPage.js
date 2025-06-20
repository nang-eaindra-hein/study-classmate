import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage]   = useState('');
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/login', {
        method:  'POST',
        headers:{ 'Content-Type':'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || 'Login failed');
        return;
      }
      // store the current user
      localStorage.setItem('username', username);
      setMessage('Login successful ✅');
      setTimeout(() => navigate('/home2'), 1000);
    } catch (err) {
      console.error(err);
      setMessage('Login failed');
    }
  };

  return (
    <div className="hero" style={{
      background:`linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)),
                  url(${process.env.PUBLIC_URL}/photos/home1.jpg) center/cover no-repeat`
    }}>
      <div className="glass-card">
        <Link to="/" className="back-btn">← Back</Link>
        <img src={`${process.env.PUBLIC_URL}/photos/logo.png`} alt="Logo" className="logo-box" />
        <h2>Login</h2>
        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn">Login</button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Don’t have an account? <Link to="/signup" className="btn">Signup</Link>
        </p>
      </div>
    </div>
  );
}
