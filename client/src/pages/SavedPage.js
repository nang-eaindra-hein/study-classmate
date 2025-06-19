import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './SavedPage.css';

const endpoints = {
  Summaries: 'summaries',
  Paraphrases: 'paraphrases',
  Vocab: 'vocab-list',
  Media: 'saved-media',
  Delete: {
    Summaries: 'delete-summary',
    Paraphrases: 'delete-paraphrase',
    Vocab: 'delete-vocab',
    Media: 'delete-media'
  }
};

export default function SavePage() {
  const username = localStorage.getItem('username');
  const tabs = ['Summaries', 'Paraphrases', 'Vocab', 'Media'];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!username && activeTab !== 'Media') {
      setMessage('Not logged in.');
      return;
    }
    setLoading(true);
    setMessage('');
    setItems([]);
    fetch(`http://127.0.0.1:5001/${endpoints[activeTab]}?username=${username}`)

      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => setItems(data))
      .catch(err => {
        console.error(err);
        setMessage(`Failed to load ${activeTab.toLowerCase()}.`);
      })
      .finally(() => setLoading(false));
  }, [activeTab, username]);

  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setShowConfirm(true);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setShowConfirm(false);
  };

  const handleDelete = async () => {
    const id = deleteTarget;
    const endpoint = endpoints.Delete[activeTab];
    try {
      const res = await fetch(`http://127.0.0.1:5001/${endpoint}/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed');
      setItems(prev => prev.filter(i => i._id !== id));
      setShowConfirm(false);
    } catch (err) {
      console.error('Delete failed:', err);
      setShowConfirm(false);
      setMessage('❌ Failed to delete.');
    }
  };

  return (
    <div className="savepage-container" style={{
      backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages4.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Link to="/home2" className="media-home">
        <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
      </Link>
      

      <h1>Saved Items</h1>

      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="content-area">
        {loading ? (
          <p className="status-text">Loading {activeTab.toLowerCase()}…</p>
        ) : message ? (
          <p className="status-text error">{message}</p>
        ) : items.length === 0 ? (
          <p className="status-text">No {activeTab.toLowerCase()} saved yet.</p>
        ) : activeTab === 'Media' ? (
          <ul className="item-list">
            {items.map(i => (
              <li key={i._id} className="item">
                <div className="item-content">
                  <strong>@{i.postId?.username || 'Unknown'}</strong><br />
                  {i.postId?.text || '⚠️ Content not found'}
                </div>
                <span className="item-date">{new Date(i.createdAt).toLocaleString()}</span>
                <button className="unsave-btn" onClick={() => confirmDelete(i._id)}>✖ Unsave</button>
              </li>
            ))}
          </ul>
        ) : (
          ['manual', 'ai', 'file', 'random', 'extract-manual', 'extract-ai'].map(source =>
            items.some(i => i.source === source) && (
              <div key={source}>
                <h3 className="source-label">{source.replace('-', ' ').toUpperCase()}</h3>
                <ul className="item-list">
                  {items
                    .filter(i => i.source === source)
                    .map(i => (
                      <li key={i._id} className="item">
                        {activeTab === 'Vocab' ? (
                          <>
                            <strong>{i.word}</strong>: <span>{i.definition}</span>
                          </>
                        ) : (
                          <div className="item-content" dangerouslySetInnerHTML={{ __html: i.content }} />
                        )}
                        <span className="item-date">{new Date(i.createdAt).toLocaleString()}</span>
                        <button className="unsave-btn" onClick={() => confirmDelete(i._id)}>✖ Unsave</button>
                      </li>
                    ))}
                </ul>
              </div>
            )
          )
        )}
      </div>

      {showConfirm && (
        <div className="modal show">
          <div className="modal-content">
            <p>❗ Are you sure you want to delete this item?</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={handleDelete} className="unsave-btn">Yes, Delete</button>
              <button onClick={cancelDelete} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
