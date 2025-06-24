// client/src/pages/PlayPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';

export default function PlayPage() {
  const navigate = useNavigate();
  const TODAY = new Date().toDateString();
  const username = localStorage.getItem('username');

  // GENERAL
  const [activeTab, setActiveTab] = useState('Play');
  const [diamonds, setDiamonds] = useState(20);
  const [scores, setScores] = useState([]);

  // CARD SELECTION
  const [mode, setMode] = useState('select');
  const [cards, setCards] = useState([]);
  const [count, setCount] = useState(5);
  const [manualList, setManualList] = useState(
    Array.from({ length: 5 }, () => ({ word: '', definition: '' }))
  );
  const [loadingGen, setLoadingGen] = useState(false);

  // QUIZ
  const [quizCards, setQuizCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);
  const [guess, setGuess] = useState('');
  const [results, setResults] = useState([]);

  // MODALS
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showName, setShowName] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [sortBy, setSortBy] = useState('highest');

  // Load initial game state
  useEffect(() => {
    fetch(`${API}/game-state?username=${username}`)
      .then(r => r.json())
      .then(data => {
        setDiamonds(data.diamonds);
        setScores(data.scores);
      })
      .catch(console.error);
  }, [username]);

  // Timer logic
  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimer(15);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          promptSkip();
          return 15;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Answer or skip
  const handleAnswer = async (submitted, isSkip = false) => {
    clearInterval(timerRef.current);

    if (isSkip && diamonds < 10) {
      return setShowSkipConfirm(true);
    }
    if (isSkip) {
      const newD = diamonds - 10;
      setDiamonds(newD);
      await fetch(`${API}/update-diamonds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, diamonds: newD }),
      }).catch(console.error);
    }

    let correct = false;
    if (!isSkip && submitted.trim()) {
      correct =
        submitted.trim().toLowerCase() ===
        quizCards[currentIndex].word.toLowerCase();
    }

    const updated = [...results, { ...quizCards[currentIndex], correct }];
    setResults(updated);

    if (updated.length >= quizCards.length) {
      setShowName(true);
    } else {
      setCurrentIndex(i => i + 1);
      setGuess('');
      startTimer();
    }
  };

  // Skip helpers
  const promptSkip = () => setShowSkipConfirm(true);
  const confirmSkip = () => {
    setShowSkipConfirm(false);
    handleAnswer('', true);
  };

  // Generate via AI
  const handleGenerate = async () => {
    setLoadingGen(true);
    try {
      const setWords = new Set();
      while (setWords.size < count) {
        const r = await fetch(`${API}/generate-word`, { method: 'POST' });
        const { word } = await r.json();
        setWords.add(word);
      }
      const words = Array.from(setWords);
      const defs = await Promise.all(
        words.map(async w => {
          const res = await fetch(`${API}/define-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: w }),
          });
          const { content } = await res.json();
          const head = content.split(/Example sentence/i)[0];
          const m = head.match(/Definition:\s*([^-\n]+)/i);
          return { word: w, definition: m ? m[1].trim() : head.trim() };
        })
      );
      setCards(defs);
      setMode('review');
    } catch {
      console.error('AI generate failed');
    } finally {
      setLoadingGen(false);
    }
  };

  // Manual review
  const handleReviewManual = () => {
    setCards(manualList.slice(0, count));
    setMode('review');
  };

  // Start quiz
  const handleStartQuiz = () => {
    setQuizCards([...cards].sort(() => Math.random() - 0.5));
    setResults([]);
    setCurrentIndex(0);
    startTimer();
    setMode('quiz');
  };

  // Save score
  const saveScore = async () => {
    if (!playerName.trim()) return;
    const correctCount = results.filter(r => r.correct).length;
    const res = await fetch(`${API}/save-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name: playerName, score: correctCount }),
    });
    const { scores: updated } = await res.json();
    setScores(updated);
    setShowName(false);
    setMode('select');
    setPlayerName('');

    if (localStorage.getItem('lastQuizDate') !== TODAY) {
      localStorage.setItem('lastQuizDate', TODAY);
      const r1 = await fetch(`${API}/get-streak?username=${username}`);
      const { streakDays } = await r1.json();
      await fetch(`${API}/save-streak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, streakDays: (streakDays || 0) + 1 }),
      });
    }
  };

  // Sort scores
  const sorted = [...scores].sort((a, b) => {
    if (sortBy === 'highest') return b.score - a.score;
    if (sortBy === 'lowest') return a.score - b.score;
    if (sortBy === 'earliest') return new Date(a.time) - new Date(b.time);
    return new Date(b.time) - new Date(a.time);
  });

  // Inline styles for panels
  const panelStyle = {
    position: 'relative',
    zIndex: 10,
    margin: '4rem auto 2rem',
    maxWidth: 600,
    padding: '1.5rem 2rem',
    background: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  };

  const btnRow = { display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: 16 };

  return (
    <div
      style={{
        position: 'relative',
        fontFamily: "'Luckiest Guy', cursive",
        color: '#fff',
        minHeight: '100vh',
        backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages3.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3rem',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 999,
        }}
      >
        <div onClick={() => navigate('/home2')} style={{ cursor: 'pointer' }}>
          <img
            src={`${process.env.PUBLIC_URL}/photos/home.jpg`}
            alt="Home"
            style={{ width: 32, height: 32 }}
          />
        </div>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#4caf50' }}>Let’s Play</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: '1rem' }}>💎 {diamonds}</span>
          <button
            style={{
              padding: '.3rem .8rem',
              border: 'none',
              borderRadius: 6,
              background: '#4caf50',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
            onClick={() =>
              setActiveTab(t => (t === 'Play' ? 'Leaderboard' : 'Play'))
            }
          >
            {activeTab === 'Play' ? 'Leaderboard' : 'Back'}
          </button>
        </div>
      </div>

      {/* PLAY AREA */}
      {activeTab === 'Play' && (
        <div style={panelStyle}>
          {mode === 'select' && (
            <>
              <label>Number of Cards:</label>
              <select
                value={count}
                onChange={e => {
                  const n = +e.target.value;
                  setCount(n);
                  setManualList(Array.from({ length: n }, () => ({ word: '', definition: '' })));
                }}
                style={{ width: '100%', margin: '8px 0' }}
              >
                {[5, 10, 15].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>

              <button onClick={handleGenerate} disabled={loadingGen} style={{ width: '100%', margin: '8px 0' }}>
                {loadingGen ? 'Generating…' : 'Generate From AI'}
              </button>

              <h3>Or Manual Insert:</h3>
              {manualList.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                  <input
                    placeholder="Word"
                    value={c.word}
                    onChange={e => {
                      const copy = [...manualList];
                      copy[i].word = e.target.value;
                      setManualList(copy);
                    }}
                    style={{ flex: 1 }}
                  />
                  <input
                    placeholder="Meaning"
                    value={c.definition}
                    onChange={e => {
                      const copy = [...manualList];
                      copy[i].definition = e.target.value;
                      setManualList(copy);
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}

              <button
                onClick={handleReviewManual}
                disabled={!manualList.slice(0, count).every(x => x.word && x.definition)}
                style={{ width: '100%', marginTop: 8 }}
              >
                Review Manual Cards
              </button>
            </>
          )}

          {mode === 'review' && (
            <>
              <h2 style={{ textAlign: 'center' }}>Flashcards Preview</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent:'center' }}>
                {cards.map((c, i) => (
                  <div key={i} style={{ perspective: 1000 }}>
                    <div
                      style={{
                        width: 180,
                        height: 120,
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'rotateY(180deg)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'rotateY(0deg)'}
                    >
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(76,175,80,0.2)', borderRadius: 12,
                      }}>
                        {c.word}
                      </div>
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        backfaceVisibility: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(76,175,80,0.2)', borderRadius: 12,
                        transform: 'rotateY(180deg)',
                      }}>
                        {c.definition}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={btnRow}>
                <button onClick={() => setMode('select')}>Back</button>
                <button onClick={handleStartQuiz}>Start Quiz</button>
              </div>
            </>
          )}

          {mode === 'quiz' && (
            <>
              <p>Time left: {timer}s</p>
              <p>{quizCards[currentIndex]?.definition}</p>
              <input
                value={guess}
                placeholder="Your guess"
                onChange={e => setGuess(e.target.value)}
                style={{ width: '100%', margin: '8px 0' }}
              />
              <div style={btnRow}>
                <button onClick={() => handleAnswer(guess, false)}>Submit</button>
                <button onClick={promptSkip}>Skip</button>
                <button onClick={() => window.location.reload()}>Restart</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* LEADERBOARD */}
      {activeTab === 'Leaderboard' && (
        <div style={panelStyle}>
          <h2 style={{ textAlign: 'center' }}>Leaderboard</h2>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: '100%', margin: '8px 0' }}
          >
            <option value="highest">Highest</option>
            <option value="lowest">Lowest</option>
            <option value="earliest">Earliest</option>
            <option value="latest">Latest</option>
          </select>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sorted.map((s, i) => (
              <li key={i} style={{ margin: '4px 0' }}>
                {s.name} – {s.score} – {new Date(s.time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SKIP CONFIRMATION */}
      {showSkipConfirm && (
        <div style={{
          position:'fixed', top:0,left:0,right:0,bottom:0,
          background:'rgba(0,0,0,0.6)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:1000
        }}>
          <div style={{
            background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(255,255,255,0.4)', color:'#fff',
            padding:'1rem 2rem', borderRadius:8, textAlign:'center'
          }}>
            <p>To skip, use 10 diamonds.</p>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button onClick={confirmSkip} style={{flex:1}}>Use</button>
              <button onClick={()=>setShowSkipConfirm(false)} style={{flex:1}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER NAME PROMPT */}
      {showName && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(22,21,21,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,           // VERY high so it’s above everything
            pointerEvents: 'auto',  // ensure overlay itself can still pass clicks through to its children
          }}
        >
          <div
            style={{
              background: 'rgba(22,21,21,0.9)',
              padding: '1.5rem 2rem',
              borderRadius: 8,
              textAlign: 'center',
              maxWidth: '90%',
              position: 'relative',
              zIndex: 3001,           // above the overlay
              pointerEvents: 'auto',  // ensure this panel handles clicks
            }}
          >
            <h3 style={{ color: '#fff', margin: '0 0 1rem' }}>Game Over!</h3>
            <p style={{ color: '#fff', margin: '0 0 1rem' }}>
              Score: {results.filter(r => r.correct).length}
            </p>
            <input
              placeholder="Enter your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                margin: '0 0 1rem',
                padding: '0.5rem',
                borderRadius: 4,
                border: 'none',
                fontSize: '1rem',
                position: 'relative',
                zIndex: 3002,
                pointerEvents: 'auto',
              }}
            />
            <button
              onClick={saveScore}
              disabled={!playerName.trim()}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: 6,
                background: playerName.trim() ? '#3876D2' : '#555',
                color: '#fff',
                fontWeight: 'bold',
                cursor: playerName.trim() ? 'pointer' : 'not-allowed',
                position: 'relative',
                zIndex: 3002,
                pointerEvents: 'auto',
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
