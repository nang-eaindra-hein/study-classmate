// client/src/pages/AccountPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_SERVER_URL || 'http://127.0.0.1:5001';

const styles = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '4rem',
    fontFamily: "'Luckiest Guy', cursive",
    color: '#fff',
    textAlign: 'center',
    backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages5.jpg)`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  },
  homeLink: {
    position: 'absolute',
    top: '1rem',
    left: '1rem',
    zIndex: 10,
    cursor: 'pointer',
  },
  diamonds: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '1.5rem',
    zIndex: 10,
  },
  title: {
    marginTop: '1rem',
    fontSize: '2.5rem',
    color: '#4caf50',
    zIndex: 5,
  },
  content: {
    marginTop: '2rem',
    width: '90%',
    maxWidth: 500,
    background: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: '1.5rem',
    backdropFilter: 'blur(6px)',
    zIndex: 1,
  },
  avatarSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
    zIndex: 2,
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '0.5rem',
  },
  inputFile: {
    cursor: 'pointer',
    zIndex: 2,
  },
  avatarPreviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: '0.5rem',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    zIndex: 2,
  },
  label: {
    flex: 1,
    textAlign: 'left',
  },
  text: {
    flex: 2,
    textAlign: 'left',
  },
  btn: {
    padding: '0.4rem 1rem',
    background: '#4caf50',
    border: 'none',
    borderRadius: 6,
    color: '#fff',
    cursor: 'pointer',
    zIndex: 2,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#222',
    padding: '1.5rem',
    borderRadius: 8,
    textAlign: 'center',
    color: '#fff',
    width: '90%',
    maxWidth: 400,
    zIndex: 1001,
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '1rem',
  },
  modalButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: 6,
    background: '#4caf50',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default function AccountPage() {
  const username = localStorage.getItem('username') || '';

  const [diamonds, setDiamonds] = useState(0);
  const [profile, setProfile] = useState({ username: '', bio: '', avatarUrl: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [showBioModal, setShowBioModal] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [messageModal, setMessageModal] = useState({ show: false, text: '', type: 'info' });

  useEffect(() => {
    fetch(`${API}/game-state?username=${username}`)
      .then(r => r.ok ? r.json() : Promise.reject('game state'))
      .then(data => typeof data.diamonds === 'number' && setDiamonds(data.diamonds))
      .catch(() => setMessageModal({ show: true, text: 'Could not load game state.', type: 'error' }));

    fetch(`${API}/profile?username=${username}`)
      .then(r => r.ok ? r.json() : Promise.reject('profile'))
      .then(data => setProfile({
        username: data.username || username,
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
      }))
      .catch(() => setMessageModal({ show: true, text: 'Could not load profile.', type: 'error' }));
  }, [username]);

  const handleAvatarSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const confirmAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('avatar', avatarFile);
      const res = await fetch(`${API}/upload-avatar`, { method: 'POST', body: form });
      const { avatarUrl: newUrl } = await res.json();
      setProfile(p => ({ ...p, avatarUrl: newUrl }));
      setAvatarFile(null); setAvatarPreview('');
      setMessageModal({ show: true, text: 'Avatar updated!', type: 'success' });
    } catch {
      setMessageModal({ show: true, text: 'Avatar upload failed.', type: 'error' });
    }
  };

  const confirmUsernameChange = () => {
    if (diamonds < 30) return setMessageModal({ show: true, text: 'Not enough diamonds.', type: 'error' });
    if (!newUsername.trim()) return;
    const updated = diamonds - 30;
    setDiamonds(updated);
    fetch(`${API}/update-diamonds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: updated }),
    }).catch(console.error);
    setProfile(p => ({ ...p, username: newUsername.trim() }));
    localStorage.setItem('username', newUsername.trim());
    setShowUsernameModal(false);
    setMessageModal({ show: true, text: 'Username updated!', type: 'success' });
  };

    const confirmPasswordChange = async () => {
    const { old, new: np } = passwords;
    if (!old || !np) {
      return setMessageModal({ show: true, text: 'Please fill both fields.', type: 'error' });
    }

    try {
      console.log('👉 Changing password for', username, { old, new: np });

      const res = await fetch(`${API}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          oldPassword: old,
          newPassword: np
        }),
      });

      console.log('👈 Response status:', res.status);
      const data = await res.json();
      console.log('👈 Response JSON:', data);

      if (!res.ok) {
        // show server-sent error if available
        throw new Error(data.message || 'Password change failed');
      }

      // success!
      setShowPasswordModal(false);
      setPasswords({ old: '', new: '' });
      setMessageModal({ show: true, text: 'Password changed!', type: 'success' });

    } catch (err) {
      console.error('🚨 change-password error:', err);
      setMessageModal({ show: true, text: err.message, type: 'error' });
    }
  };


  const confirmBioChange = () => {
    setProfile(p => ({ ...p, bio: newBio }));
    fetch(`${API}/update-bio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, bio: newBio }),
    }).catch(console.error);
    setShowBioModal(false);
    setMessageModal({ show: true, text: 'Bio updated!', type: 'success' });
  };

  return (
    <div style={styles.page}>
      <Link to="/home2" style={styles.homeLink}>
        <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" width={48} height={48}/>
      </Link>

      <span style={styles.diamonds}>💎 {diamonds}</span>
      <h1 style={styles.title}>My Account</h1>

      <div style={styles.content}>
        {/* Avatar */}
        <div style={styles.avatarSection}>
          <img
            src={profile.avatarUrl ? `${API}${profile.avatarUrl}` : `${process.env.PUBLIC_URL}/photos/default-avatar.png`}
            alt="Avatar"
            style={styles.avatarImg}
          />
          <input type="file" accept="image/*" onChange={handleAvatarSelect} style={styles.inputFile} />
          {avatarPreview && (
            <div style={styles.avatarPreviewContainer}>
              <img src={avatarPreview} alt="Preview" style={styles.avatarPreview} />
              <button style={styles.btn} onClick={confirmAvatarUpload}>Upload</button>
            </div>
          )}
        </div>

        {/* Username */}
        <div style={styles.field}>
          <label style={styles.label}>Username:</label>
          <span style={styles.text}>{profile.username}</span>
          <button
            style={styles.btn}
            onClick={() => { setNewUsername(profile.username); setShowUsernameModal(true); }}
          >
            Edit (30💎)
          </button>
        </div>

        {/* Password */}
        <div style={styles.field}>
          <label style={styles.label}>Password:</label>
          <button style={styles.btn} onClick={() => setShowPasswordModal(true)}>
            Change Password
          </button>
        </div>

        {/* Bio */}
        <div style={styles.field}>
          <label style={styles.label}>Bio:</label>
          <span style={styles.text}>{profile.bio}</span>
          <button
            style={styles.btn}
            onClick={() => { setNewBio(profile.bio); setShowBioModal(true); }}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Modals */}
      {showUsernameModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Change Username</h3>
            <p>This costs 30 diamonds.</p>
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} style={{ width:'100%', padding:8, margin:'0.5rem 0' }} />
            <div style={styles.modalButtons}>
              <button style={styles.modalButton} onClick={confirmUsernameChange}>Save</button>
              <button style={styles.modalButton} onClick={() => setShowUsernameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Change Password</h3>
            <input
              type="password"
              placeholder="Old password"
              value={passwords.old}
              onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))}
              style={{ width:'100%', padding:8, margin:'0.5rem 0' }}
            />
            <input
              type="password"
              placeholder="New password"
              value={passwords.new}
              onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
              style={{ width:'100%', padding:8, margin:'0.5rem 0' }}
            />
            <div style={styles.modalButtons}>
              <button style={styles.modalButton} onClick={confirmPasswordChange}>Save</button>
              <button style={styles.modalButton} onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBioModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Edit Bio</h3>
            <textarea
              rows={4}
              value={newBio}
              onChange={e => setNewBio(e.target.value)}
              style={{ width:'100%', padding:8, margin:'0.5rem 0' }}
            />
            <div style={styles.modalButtons}>
              <button style={styles.modalButton} onClick={confirmBioChange}>Save</button>
              <button style={styles.modalButton} onClick={() => setShowBioModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {messageModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <p>{messageModal.text}</p>
            <button style={styles.modalButton} onClick={() => setMessageModal({ show: false, text: '', type: 'info' })}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
