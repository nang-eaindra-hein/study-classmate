import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './StreakPage.css';

// Earned skins
import streak1 from '../lottie/streak1.json';
import streak2 from '../lottie/streak2.json';
import streak3 from '../lottie/streak3.json';
import streak4 from '../lottie/streak4.json';
import streak5 from '../lottie/streak5.json';
// Premium skins
import streakPre1 from '../lottie/streakpre1.json';
import streakPre2 from '../lottie/streakpre2.json';
import streakPre3 from '../lottie/streakpre3.json';
import streakPre4 from '../lottie/streakpre4.json';
import streakPre5 from '../lottie/streakpre5.json';

const earnedSkins = [
  { id: 1, level:   0, animation: streak1, label: 'Baby Basic'    },
  { id: 2, level:  30, animation: streak2, label: 'Toddler Common'},
  { id: 3, level:  60, animation: streak3, label: 'Teen Rare'     },
  { id: 4, level:  90, animation: streak4, label: 'Adult Iconic'  },
  { id: 5, level: 120, animation: streak5, label: 'Legend Ager'   },
];
const premiumSkins = [
  { id: 'p1', animation: streakPre1, label: 'Gamer Grapes',  cost: 140 },
  { id: 'p2', animation: streakPre2, label: 'Gamer Orange',  cost: 140 },
  { id: 'p3', animation: streakPre3, label: 'Player Pastel', cost: 180 },
  { id: 'p4', animation: streakPre4, label: 'Player Citrus', cost: 180 },
  { id: 'p5', animation: streakPre5, label: '404 User',      cost: 260 },
];

export default function StreakPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  // — CORE STATE —
  const [streakDays, setStreakDays]       = useState(40);
  const [diamonds, setDiamonds]           = useState(20);
  const [purchasedSkins, setPurchased]    = useState([]);
  const [selectedSkinId, setSelectedSkinId]   = useState(null);
  const [previewSkinId, setPreviewSkinId]     = useState(null);

  // — UI —
  const [showHelp, setShowHelp]             = useState(false);
  const [showRestore, setShowRestore]       = useState(false);
  const [showNoDiamonds, setShowNoDiamonds] = useState(false);
  const [showProgress, setShowProgress]     = useState(false);
  const [showSkins, setShowSkins]           = useState(false);

  // — FETCH INITIAL DATA —
  useEffect(() => {
    // get streak + selected skin
    fetch(`https://study-classmate-server.onrender.com/get-streak?username=${username}`)
      .then(r => r.json())
      .then(({ streakDays, selectedSkinId }) => {
        setStreakDays(streakDays);
        setSelectedSkinId(selectedSkinId);
        setPreviewSkinId(selectedSkinId);
      })
      .catch(console.error);

    // get diamonds + purchased skins
    fetch(`https://study-classmate-server.onrender.com/game-state?username=${username}`)
      .then(r => r.json())
      .then(({ diamonds, purchasedSkins }) => {
        setDiamonds(diamonds);
        setPurchased(purchasedSkins || []);
      })
      .catch(console.error);
  }, [username]);

  // — SAVE STREAK WHEN IT CHANGES —
  useEffect(() => {
    fetch(`https://study-classmate-server.onrender.com/save-streak?username=${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streakDays }),
    }).catch(console.error);
  }, [streakDays, username]);

  // — HELP / RESTORE —
  const handleRestore = () => {
    if (diamonds < 40) return setShowNoDiamonds(true);
    const nd = diamonds - 40;
    setDiamonds(nd);

    fetch('https://study-classmate-server.onrender.com/update-diamonds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: nd }),
    }).catch(console.error);

    setPreviewSkinId(selectedSkinId);
    setShowRestore(false);
  };

  // — BUY PREMIUM —
  const buySkin = (skin) => {
    if (diamonds < skin.cost) return setShowNoDiamonds(true);
    const nd = diamonds - skin.cost;
    setDiamonds(nd);

    // update diamonds first
    fetch('https://study-classmate-server.onrender.com/update-diamonds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: nd }),
    }).catch(console.error);

    // then buy
    fetch('https://study-classmate-server.onrender.com/buy-skin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, skinId: skin.id }),
    })
      .then(r => r.json())
      .then(({ purchasedSkins }) => {
        setPurchased(purchasedSkins);
        setSelectedSkinId(skin.id);
        setPreviewSkinId(skin.id);

        // finally save equipped skin
        return fetch('https://study-classmate-server.onrender.com/save-skin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, skinId: skin.id }),
        });
      })
      .catch(console.error);
  };

  // — CHOOSE ANIMATION —
  const getDefaultSkinId = () => {
    for (let i = earnedSkins.length - 1; i >= 0; i--) {
      if (streakDays >= earnedSkins[i].level) return earnedSkins[i].id;
    }
    return 1;
  };
  const equippedAnimation = () => {
    const e = earnedSkins.find(s => s.id === previewSkinId);
    if (e) return e.animation;
    const p = premiumSkins.find(s => s.id === previewSkinId);
    if (p && purchasedSkins.includes(p.id)) return p.animation;
    return earnedSkins.find(s => s.id === getDefaultSkinId()).animation;
  };

  return (
    <div
      className="streak-container"
      style={{
        backgroundImage:   `url(${process.env.PUBLIC_URL}/photos/pages0.jpg)`,
        backgroundSize:    'cover',
        backgroundPosition:'center',
        backgroundRepeat:  'no-repeat',
      }}
    >
      {/* HEADER */}
      <div className="streak-header">
        <img
          src={`${process.env.PUBLIC_URL}/photos/home.jpg`}
          className="streak-home"
          alt="Home"
          onClick={() => navigate('/home2')}
        />
        <span
          className="streak-diamonds"
          style={{
            position:  'absolute',
            top:       '1rem',
            left:      '50%',
            transform: 'translateX(-50%)',
            fontSize:  '1.8rem',
          }}
        >
          💎 {diamonds}
        </span>
      </div>

      {/* HELP & RESTORE */}
      <div className="streak-help">
        <button onClick={() => setShowHelp(true)}>❓</button>
        <button onClick={() => setShowRestore(true)}>Restore</button>
      </div>
      {showHelp && (
        <div className="streak-popup-glass">
          <p>Play one quiz per day to keep your streak!</p>
          <button onClick={() => setShowHelp(false)}>Close</button>
        </div>
      )}
      {showRestore && (
        <div className="streak-popup-glass">
          <p>Spend 40 diamonds to restore your streak?</p>
          <button onClick={handleRestore}>Yes</button>
          <button onClick={() => navigate('/purchase')}>Buy Diamonds</button>
          <button onClick={() => setShowRestore(false)}>Cancel</button>
        </div>
      )}
      {showNoDiamonds && (
        <div className="streak-popup-glass">
          <p>Not enough diamonds</p>
          <button onClick={() => setShowNoDiamonds(false)}>Close</button>
        </div>
      )}

      {/* STREAK INFO */}
      <h1 className="streak-title">Streak Days</h1>
      <div className="streak-count">{streakDays}</div>
      <div className="streak-pet">
        <Lottie animationData={equippedAnimation()} loop style={{ width: 220, height: 220 }} />
      </div>

      {/* PROGRESS */}
      <button
        className="btn"
        onClick={() => {
          setShowProgress(p => !p);
          setPreviewSkinId(selectedSkinId);
        }}
      >
        Progress
      </button>
      {showProgress && (
        <div className="progress-section">
          <div className="streak-bar">
            <div
              className="streak-fill"
              style={{ width: `${((streakDays % 30) / 30) * 100}%` }}
            />
          </div>
          <div className="streak-progress-list">
            {earnedSkins.map(skin => {
              const start = skin.level;
              const end   = skin.level + 30;
              return (
                <div key={skin.id} className="streak-box">
                  <strong>{start}–{end} days</strong><br />
                  {skin.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SKINS */}
      <button
        className="btn"
        onClick={() => {
          setShowSkins(s => {
            if (s) setPreviewSkinId(selectedSkinId);
            return !s;
          });
        }}
      >
        Skins
      </button>
      {showSkins && (
        <div className="streak-skin-selector">
          <h3>Earned Skins</h3>
          <div className="skin-row">
            {earnedSkins.map(skin => {
              const unlocked = streakDays >= skin.level;
              return (
                <div
                  key={skin.id}
                  className={`skin-option ${unlocked ? 'unlocked' : 'locked'}`}
                >
                  <Lottie
                    animationData={skin.animation}
                    loop
                    style={{
                      width:100,
                      height:100,
                      opacity: unlocked ? 1 : 0.4,
                    }}
                  />
                  <div className="skin-select">{skin.label}</div>
                  {unlocked ? (
                    <button
                      className="btn"
                      onClick={() => {
                        fetch('https://study-classmate-server.onrender.com/save-skin', {
                          method: 'POST',
                          headers:{ 'Content-Type':'application/json' },
                          body: JSON.stringify({ username, skinId: skin.id }),
                        }).then(() => {
                          setSelectedSkinId(skin.id);
                          setPreviewSkinId(skin.id);
                        });
                      }}
                    >
                      Wear
                    </button>
                  ) : (
                    <button className="btn" onClick={() => setPreviewSkinId(skin.id)}>
                      Try
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <h3>Premium Skins</h3>
          <div className="skin-row">
            {premiumSkins.map(skin => {
              const owned = purchasedSkins.includes(skin.id);
              return (
                <div
                  key={skin.id}
                  className={`skin-option ${owned ? 'unlocked' : 'locked'}`}
                >
                  <Lottie
                    animationData={skin.animation}
                    loop
                    style={{
                      width:100,
                      height:100,
                      opacity: owned ? 1 : 0.4,
                    }}
                  />
                  <div className="skin-select">{skin.label}</div>
                  <div className="skin-select">{skin.cost} ♦</div>

                  {owned ? (
                    <button
                      className="btn"
                      onClick={() => {
                        fetch('https://study-classmate-server.onrender.com/save-skin', {
                          method:'POST',
                          headers:{ 'Content-Type':'application/json' },
                          body: JSON.stringify({ username, skinId: skin.id }),
                        }).then(() => {
                          setSelectedSkinId(skin.id);
                          setPreviewSkinId(skin.id);
                        });
                      }}
                    >
                      Wear
                    </button>
                  ) : (
                    <>
                      <button className="btn" onClick={() => buySkin(skin)}>
                        Buy
                      </button>
                      <button className="btn" onClick={() => setPreviewSkinId(skin.id)}>
                        Try
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
