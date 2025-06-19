import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MediaPage.css';

function MediaPage() {
  const username = localStorage.getItem('username');
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [avatars, setAvatars] = useState({});
  const [sortOrder, setSortOrder] = useState('latest');

  const bgUrl = `${process.env.PUBLIC_URL}/photos/pages2.jpg`;
function getTimeAgo(timestamp) {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diff = Math.floor((now - postTime) / 1000); // in seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return postTime.toLocaleDateString(); // fallback
}

  // ✅ Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5001/media-posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    }
  };

  // ✅ Fetch avatars AFTER posts are loaded
  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;

    const fetchAvatars = async () => {
      const usernames = [...new Set(posts.map(p => p.username))];
      const result = {};
      for (const name of usernames) {
        try {
          const res = await fetch(`http://127.0.0.1:5001/profile?username=${name}`);
          const data = await res.json();
          result[name] = data.avatarUrl;
        } catch {
          result[name] = '';
        }
      }
      setAvatars(result);
    };

    fetchAvatars();
  }, [posts]);

  const handlePost = async () => {
    if (!text.trim() || !username) {
      setMessage('❌ Please enter text and log in');
      return;
    }

    try {
      await fetch('http://127.0.0.1:5001/media-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text })
      });
      setText('');
      fetchPosts();
      setMessage('✅ Posted!');
    } catch {
      setMessage('❌ Failed to post');
    }

    setTimeout(() => setMessage(''), 1500);
  };

  const handleSave = async (postId) => {
    try {
      await fetch('http://127.0.0.1:5001/save-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, postId })
      });
      setMessage('✅ Saved!');
    } catch {
      setMessage('❌ Failed to save');
    }

    setTimeout(() => setMessage(''), 1500);
  };

  const handleDelete = async (postId) => {
    try {
      await fetch(`http://127.0.0.1:5001/media-posts/${postId}`, {
        method: 'DELETE'
      });
      fetchPosts();
      setMessage('🗑️ Post deleted');
    } catch {
      setMessage('❌ Failed to delete post');
    }

    setTimeout(() => setMessage(''), 1500);
  };

  return (
    <div
      className="media-page"
      style={{
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
      }}
    >
      <Link to="/home2" className="media-home">
        <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
      </Link>

      <h1 className="media-title">Media Wall</h1>

      <div className="new-post-box">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
        />
        <button onClick={handlePost}>Post</button>
        {message && (
          <div className="modal show">
            <div className="modal-content">{message}</div>
          </div>
        )}
      </div>

      <div className="sort-bar">
        <button onClick={() => setSortOrder(prev => prev === 'latest' ? 'oldest' : 'latest')}>
          Sort: {sortOrder === 'latest' ? '⬇️ Latest' : '⬆️ Oldest'}
        </button>
      </div>

      <div className="post-list">
        {[...posts]
          .sort((a, b) => {
            const d1 = new Date(a.createdAt);
            const d2 = new Date(b.createdAt);
            return sortOrder === 'latest' ? d2 - d1 : d1 - d2;
          })
          .map((p, i) => (
            <div className="post-card" key={i}>
              <div className="post-header">
                <img
                  src={
                    avatars[p.username]
                      ? `http://127.0.0.1:5001${avatars[p.username]}`
                      : `${process.env.PUBLIC_URL}/photos/default-avatar.png`
                  }
                  alt="avatar"
                  className="post-avatar"
                />
                <div className="post-username">@{p.username}</div>
                <div className="post-time">{getTimeAgo(p.createdAt)}</div>

              </div>
              <div className="post-content">{p.text}</div>
              <div className="post-actions">
                <button className="save-btn" onClick={() => handleSave(p._id)}>💾 Save</button>
                {p.username === username && (
                  <button className="delete-btn" onClick={() => handleDelete(p._id)}>🗑️ Delete</button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default MediaPage;
