import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage]   = useState(null);
  const navigate = useNavigate();

  const handleSignup = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:5001/signup', {
        method:  'POST',
        headers:{ 'Content-Type':'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.message });
        return;
      }
      // store user and go to home
      localStorage.setItem('username', username);
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => navigate('/home2'), 1000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Signup failed' });
    }
  };

  return (
    <div className="hero" style={{
      background:`linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),
                  url(${process.env.PUBLIC_URL}/photos/home1.jpg) center/cover no-repeat`
    }}>
      <div className="glass-card">
        <Link to="/" className="back-btn">← Back</Link>
        <img src={`${process.env.PUBLIC_URL}/photos/logo.png`} alt="Logo" className="logo-box" />
        <h2>Sign Up</h2>
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSignup}>
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
          <button className="btn" type="submit">Sign Up</button>
        </form>
        <p style={{ marginTop: 10 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
