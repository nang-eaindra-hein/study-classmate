// src/pages/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SettingsPage.css';

const labels = {
  en: {
    title:          'Settings',
    notifications:  'Enable Notifications',
    darkMode:       'Dark Mode',
    soundEffects:   'Sound Effects',
    language:       'Language',
    about:          'About Developer',
    support:        'Contact Support',
    reset:          'Reset All Data',
  },
  es: {
    title:          'Ajustes',
    notifications:  'Habilitar Notificaciones',
    darkMode:       'Modo Oscuro',
    soundEffects:   'Efectos de Sonido',
    language:       'Idioma',
    about:          'Acerca del Desarrollador',
    support:        'Contactar Soporte',
    reset:          'Restablecer Todo',
  },
  fr: {
    title:          'Paramètres',
    notifications:  'Activer Notifications',
    darkMode:       'Mode Sombre',
    soundEffects:   'Effets Sonores',
    language:       'Langue',
    about:          'À propos du Développeur',
    support:        'Contacter le Support',
    reset:          'Tout Réinitialiser',
  },
};

export default function SettingsPage() {
  const bgUrl = `${process.env.PUBLIC_URL}/photos/pages5.jpg`;

  // — load from localStorage or default —
  const [notifications, setNotifications] = useState(
    () => JSON.parse(localStorage.getItem('settings_notif')) ?? true
  );
  const [darkMode, setDarkMode] = useState(
    () => JSON.parse(localStorage.getItem('settings_dark')) ?? false
  );
  const [soundEffects, setSoundEffects] = useState(
    () => JSON.parse(localStorage.getItem('settings_sound')) ?? true
  );
  const [language, setLanguage] = useState(
    () => localStorage.getItem('settings_lang') || 'en'
  );

  // — persist settings whenever they change —
  useEffect(() => {
    localStorage.setItem('settings_notif', JSON.stringify(notifications));
    localStorage.setItem('settings_dark',   JSON.stringify(darkMode));
    localStorage.setItem('settings_sound',  JSON.stringify(soundEffects));
    localStorage.setItem('settings_lang',   language);
  }, [notifications, darkMode, soundEffects, language]);

  // — apply dark mode class on <body> —
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // — set <html lang="…"> —
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const handleReset = () => {
    if (window.confirm('This will clear all your local data. Proceed?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const t = labels[language];

  return (
    <div
      className="settings-page"
      style={{
        backgroundImage:   `url(${bgUrl})`,
        backgroundSize:    'cover',
        backgroundPosition:'center',
        backgroundRepeat:  'no-repeat',
      }}
    >
      <Link to="/home2" className="home-link">
        <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
      </Link>

      <h1>{t.title}</h1>

      <div className="settings-content">
        <div className="setting-item">
          <label htmlFor="notif">{t.notifications}</label>
          <input
            id="notif"
            type="checkbox"
            checked={notifications}
            onChange={() => setNotifications(n => !n)}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="darkMode">{t.darkMode}</label>
          <input
            id="darkMode"
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(d => !d)}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="sound">{t.soundEffects}</label>
          <input
            id="sound"
            type="checkbox"
            checked={soundEffects}
            onChange={() => setSoundEffects(s => !s)}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="language">{t.language}</label>
          <select
            id="language"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="setting-item">
          <label>{t.about}</label>
          <Link to="/about" className="settings-link">
            {t.about}
          </Link>
        </div>

        <div className="setting-item">
          <label>{t.support}</label>
          <a href="mailto:support@example.com" className="settings-link">
            {t.support}
          </a>
        </div>

        <button className="btn reset-btn" onClick={handleReset}>
          {t.reset}
        </button>
      </div>
    </div>
  );
}
