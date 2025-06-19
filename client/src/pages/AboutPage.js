// src/pages/AboutPage.js
import React from 'react';
import './AboutPage.css';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  const bgUrl = `${process.env.PUBLIC_URL}/photos/pages4.jpg`;

  return (
    <div
      className="common-page"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize:    'cover',
        backgroundPosition:'center',
        backgroundRepeat:  'no-repeat'
      }}
    >
      <Link to="/home2" className="home-link">
        <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
      </Link>

      <h1>About the Developer</h1>

      <div className="about-content">
        <h2>Nang Eaindra Hein</h2>
        <p><strong>Education:</strong> Bachelor of Computer Science</p>
        <p>
          Hi there! I'm Nang Eaindra Hein, a Computer Science graduate with a passion for
          building tools that make learning fun and accessible. This app grew out of my own
          struggles memorizing vocabulary and tracking progress—so I decided to craft a quiz
          game that’s both engaging and rewarding.
        </p>
        <p>
          With features like daily streaks, diamond-powered skips, and collectible skins,
          my goal is to give learners a playful way to build confidence and consistency.
          I hope this little project inspires you to keep growing—one word (and one day)
          at a time!
        </p>
      </div>
    </div>
  );
}
