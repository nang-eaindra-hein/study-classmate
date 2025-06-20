import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AccountPage.css';

export default function AccountPage() {
  const username = localStorage.getItem('username');

  // Diamonds count
  const [diamonds, setDiamonds] = useState(0);

  // User profile data
  const [profile, setProfile] = useState({ username: '', bio: '', avatarUrl: '' });

  // Avatar upload temp state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Modals and inputs
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [showBioModal, setShowBioModal] = useState(false);
  const [newBio, setNewBio] = useState('');

  // Generic message modal
  const [messageModal, setMessageModal] = useState({ show: false, text: '', type: 'info' });

  // Load diamonds and profile on mount
  useEffect(() => {
    fetch(`https://study-classmate-server.onrender.com/game-state?username=${username}`)
      .then(res => res.json())
      .then(({ diamonds }) => setDiamonds(diamonds))
      .catch(console.error);

    fetch(`https://study-classmate-server.onrender.com/profile?username=${username}`)
      .then(res => res.json())
      .then(data => setProfile({
        username:  data.username || username,
        bio:       data.bio || '',
        avatarUrl: data.avatarUrl || ''
      }))
      .catch(console.error);
  }, [username]);

  // Handle avatar file selection
  const handleAvatarSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Confirm avatar upload
  const confirmAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('avatar', avatarFile);
      const res = await fetch('http/study-classmate-server.onrender.com/upload-avatar', { method: 'POST', body: form });
      const { avatarUrl: newUrl } = await res.json();
      setProfile(p => ({ ...p, avatarUrl: newUrl }));
      setAvatarFile(null);
      setAvatarPreview('');
      setMessageModal({ show: true, text: 'Avatar updated!', type: 'success' });
    } catch {
      setMessageModal({ show: true, text: 'Upload failed.', type: 'error' });
    }
  };

  // Confirm username change
  const confirmUsernameChange = () => {
    if (diamonds < 30) return setMessageModal({ show: true, text: 'Not enough diamonds', type: 'error' });
    if (!newUsername.trim()) return;
    const nd = diamonds - 30;
    setDiamonds(nd);
    fetch('http/study-classmate-server.onrender.com/update-diamonds', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: nd })
    }).catch(console.error);

    setProfile(p => ({ ...p, username: newUsername.trim() }));
    localStorage.setItem('username', newUsername.trim());
    setShowUsernameModal(false);
    setMessageModal({ show: true, text: 'Username updated!', type: 'success' });
  };

  // Confirm password change
  const confirmPasswordChange = () => {
    if (!passwords.old || !passwords.new) return setMessageModal({ show: true, text: 'Fill both fields', type: 'error' });
    fetch('http/study-classmate-server.onrender.com/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, oldPassword: passwords.old, newPassword: passwords.new })
    })
    .then(res => {
      if (!res.ok) throw new Error('Password change failed');
      setShowPasswordModal(false);
      setPasswords({ old: '', new: '' });
      setMessageModal({ show: true, text: 'Password changed!', type: 'success' });
    })
    .catch(err => setMessageModal({ show: true, text: err.message, type: 'error' }));
  };

  // Confirm bio change
  const confirmBioChange = () => {
    setProfile(p => ({ ...p, bio: newBio }));
    fetch('http/study-classmate-server.onrender.com/update-bio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, bio: newBio })
    }).catch(console.error);
    setShowBioModal(false);
    setMessageModal({ show: true, text: 'Bio updated!', type: 'success' });
  };

  return (
    <div className="account-page" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages5.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <Link to="/home2" className="home-link">
        <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
      </Link>

      <span className="account-diamonds">💎 {diamonds}</span>
      <h1>My Account</h1>

      <div className="account-content">
        {/* Avatar Section */}
        <div className="avatar-section">
          <img
            src={profile.avatarUrl ? `http/study-classmate-server.onrender.com${profile.avatarUrl}` : `${process.env.PUBLIC_URL}/photos/default-avatar.png`}
            alt="Avatar"
            className="avatar-img"
          />
          <input type="file" accept="image/*" onChange={handleAvatarSelect} />
          {avatarPreview && (
            <div className="avatar-preview-container">
              <img src={avatarPreview} alt="Preview" className="avatar-preview" />
              <button className="btn" onClick={confirmAvatarUpload}>Upload</button>
            </div>
          )}
        </div>

        {/* Username Field */}
        <div className="field">
          <label>Username:</label>
          <span>{profile.username}</span>
          <button className="btn" onClick={() => { setNewUsername(profile.username); setShowUsernameModal(true); }}>
            Edit (30💎)
          </button>
        </div>

        {/* Password Field */}
        <div className="field">
          <label>Password:</label>
          <button className="btn" onClick={() => setShowPasswordModal(true)}>Change Password</button>
        </div>

        {/* Bio Field */}
        <div className="field">
          <label>Bio:</label>
          <span className="bio-text">{profile.bio}</span>
          <button className="btn" onClick={() => { setNewBio(profile.bio); setShowBioModal(true); }}>
            Edit
          </button>
        </div>
      </div>

      {/* Username Modal */}
      {showUsernameModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Change Username</h3>
            <p>This costs 30 diamonds.</p>
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={confirmUsernameChange}>Save</button>
              <button onClick={() => setShowUsernameModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Change Password</h3>
            <input type="password" placeholder="Old password" value={passwords.old} onChange={e => setPasswords(p => ({ ...p, old: e.target.value }))} />
            <input type="password" placeholder="New password" value={passwords.new} onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))} />
            <div className="modal-buttons">
              <button onClick={confirmPasswordChange}>Save</button>
              <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Bio Modal */}
      {showBioModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Bio</h3>
            <textarea rows="4" value={newBio} onChange={e => setNewBio(e.target.value)} />
            <div className="modal-buttons">
              <button onClick={confirmBioChange}>Save</button>
              <button onClick={() => setShowBioModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal.show && (
        <div className="modal">
          <div className={`modal-content message-${messageModal.type}`}> 
            <p>{messageModal.text}</p>
            <button onClick={() => setMessageModal({ show: false, text: '', type: 'info' })}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
