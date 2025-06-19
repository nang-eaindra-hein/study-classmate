import React from 'react';

function Home() {
  const bgUrl = `${process.env.PUBLIC_URL}/photos/home1.jpg`;

  return (
    <div
      className="hero"
      style={{
        background: `
          linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)),
          url(${bgUrl}) center/cover no-repeat
        `,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        flexDirection: 'column',
        padding: '0 1rem'
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/photos/logo.png`}
        alt="Logo"
        className="logo-box"
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.6)',
          marginBottom: '1rem',
          objectFit: 'contain',
          background: 'rgba(255,255,255,0.2)'
        }}
      />

      <h1 style={{ color: '#deb075', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
        Welcome to Ai Classmate
      </h1>

      <p className="quote" style={{
        color: '#fff',
        fontSize: '1.1rem',
        lineHeight: '1.5',
        maxWidth: '600px',
        marginBottom: '1.5rem'
      }}>
        “Study without desire spoils the memory, and it retains nothing that it takes in.”<br />
      </p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <a href="/login" className="btn">Login</a>
        <a href="/signup" className="btn">Signup</a>
      </div>
    </div>
  );
}

export default Home;
