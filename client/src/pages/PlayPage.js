import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayPage.css';

export default function PlayPage() {
  const navigate = useNavigate();
  const TODAY = new Date().toDateString();
  const username = localStorage.getItem('username');

  // — GENERAL STATE —
  const [activeTab, setActiveTab] = useState('Play');
  const [diamonds, setDiamonds] = useState(20);
  const [scores, setScores] = useState([]);

  // — CARD SELECTION STATE —
  const [mode, setMode] = useState('select');
  const [cards, setCards] = useState([]);
  const [count, setCount] = useState(5);
  const [loadingGen, setLoadingGen] = useState(false);
  const [manualList, setManualList] = useState(
    Array.from({ length: count }, () => ({ word: '', definition: '' }))
  );

  // — QUIZ STATE —
  const [quizCards, setQuizCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const timerRef = useRef(null);
  const [guess, setGuess] = useState('');
  const [results, setResults] = useState([]);

  // — MODALS & GAME OVER —
  const [showSkip, setShowSkip] = useState(false);
  const [showNoDiamonds, setShowNoDiamonds] = useState(false);
  const [showFillModal, setShowFillModal] = useState(false);
  const [showName, setShowName] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [sortBy, setSortBy] = useState('highest');

  // 0) ON MOUNT: load diamonds & scores
  useEffect(() => {
    fetch(`https://study-classmate-server.onrender.com/game-state?username=${username}`)
      .then(res => res.json())
      .then(({ diamonds, scores }) => {
        setDiamonds(diamonds);
        setScores(scores);
      })
      .catch(console.error);
  }, [username]);

  // 1) GENERATE WORDS & DEFINITIONS
  const handleGenerate = async () => {
    setLoadingGen(true);
    try {
      const unique = new Set();
      while (unique.size < count) {
        const res = await fetch('https://study-classmate-server.onrender.com/generate-word', { method: 'POST' });
        const { word } = await res.json();
        unique.add(word);
      }
      const words = Array.from(unique);

      const defs = await Promise.all(
        words.map(async (word) => {
          const r = await fetch('https://study-classmate-server.onrender.com/define-word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word }),
          });
          const { content } = await r.json();
          const head = content.split(/Example sentence/i)[0];
          const m = head.match(/Definition:\s*([^ -\n]+)/i);
          const definition = m ? m[1].trim() : head.replace(/[-]/g, '').trim();
          return { word, definition };
        })
      );

      setCards(defs);
      setMode('review');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGen(false);
    }
  };

  // 2) MANUAL REVIEW
  const handleReviewManual = () => {
    setCards(manualList.slice(0, count));
    setMode('review');
  };

  // 3) START QUIZ
  const handleStartQuiz = () => {
    setQuizCards([...cards].sort(() => Math.random() - 0.5));
    setResults([]);
    setCurrentIndex(0);
    setTimer(15);
    setGuess('');
    setMode('quiz');
  };

  // 4) SUBMIT ANSWER
  const submitAnswer = useCallback(() => {
    if (!guess.trim()) {
      setShowFillModal(true);
      return;
    }
    clearInterval(timerRef.current);
    const card = quizCards[currentIndex];
    const correct = guess.trim().toLowerCase() === card.word.toLowerCase();
    setResults(r => [...r, { ...card, correct }]);
    setGuess('');
    if (currentIndex + 1 < quizCards.length) {
      setCurrentIndex(i => i + 1);
      setTimer(15);
    } else {
      setShowName(true);
    }
  }, [guess, quizCards, currentIndex]);

  // TIMER EFFECT
  useEffect(() => {
    if (mode === 'quiz') {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            submitAnswer();
            return 15;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [mode, currentIndex, submitAnswer]);

  // 5) SKIP (–10 diamonds)
  const confirmSkip = () => {
    diamonds >= 10 ? setShowSkip(true) : setShowNoDiamonds(true);
  };
  const doSkip = () => {
    clearInterval(timerRef.current);
    const newD = diamonds - 10;
    setDiamonds(newD);
    fetch('https://study-classmate-server.onrender.com/update-diamonds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: newD }),
    }).catch(console.error);

    setShowSkip(false);
    setResults(r => [...r, { ...quizCards[currentIndex], correct: false }]);
    if (currentIndex + 1 < quizCards.length) {
      setCurrentIndex(i => i + 1);
      setTimer(15);
    } else {
      setShowName(true);
    }
  };

  // 6) SAVE SCORE + BUMP STREAK
  const saveScore = () => {
    if (!playerName.trim()) return;
    const correctCount = results.filter(r => r.correct).length;

    fetch('https://study-classmate-server.onrender.com/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, name: playerName, score: correctCount }),
    })
      .then(res => res.json())
      .then(({ scores: updated }) => {
        setScores(updated);
        setShowName(false);
        setMode('select');
        setPlayerName('');

        const last = localStorage.getItem('lastQuizDate');
        if (last !== TODAY) {
          localStorage.setItem('lastQuizDate', TODAY);
          fetch(`https://study-classmate-server.onrender.com/get-streak?username=${username}`)
            .then(r => r.json())
            .then(({ streakDays }) => {
              const next = (streakDays || 0) + 1;
              return fetch('https://study-classmate-server.onrender.com/save-streak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, streakDays: next }),
              });
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  };

  // SORTED LEADERBOARD
  const sorted = [...scores].sort((a, b) => {
    if (sortBy === 'highest')  return b.score - a.score;
    if (sortBy === 'lowest')   return a.score - b.score;
    if (sortBy === 'earliest') return new Date(a.time) - new Date(b.time);
    return new Date(b.time) - new Date(a.time);
  });

  return (
    <div className="common-page"
         style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages3.jpg)` }}
    >
      {/* HEADER */}
      <div className="header-bar">
        <div className="inner">
          <div className="home-link" onClick={() => navigate('/home2')}>
            <img
              src={`${process.env.PUBLIC_URL}/photos/home.jpg`}  
              alt="Home"
            />
          </div>
          <h1>Let’s Play</h1>
          <div className="right-bar">
            <span className="diamonds">💎 {diamonds}</span>
            {activeTab === 'Play'
              ? <button onClick={() => setActiveTab('Leaderboard')}>
                  Leaderboard
                </button>
              : <button onClick={() => setActiveTab('Play')}>Back</button>}
          </div>
        </div>
      </div>

      {/* PLAY AREA */}
      {activeTab === 'Play' && (
        <div className="play-area panel">
          {/* SELECT MODE */}
          {mode === 'select' && (
            <div className="select-panel">
              <label>Number of Cards:</label>
              <select
                value={count}
                onChange={e => {
                  const n = +e.target.value;
                  setCount(n);
                  setManualList(Array.from({ length: n }, () => ({ word:'',definition:'' })));  
                }}
              >
                {[5,10,15].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button onClick={handleGenerate} disabled={loadingGen}>
                {loadingGen ? 'Generating…' : 'Generate From AI'}
              </button>

              <h3>Or Manual Insert:</h3>
              {manualList.map((c,i) => (
                <div key={i} className="manual-row" style={{ display:'flex', gap:'0.75rem' }}>
                  <input
                    style={{ flex: 1 }}
                    placeholder="Word"
                    value={c.word}
                    onChange={e => {
                      const copy = [...manualList];
                      copy[i].word = e.target.value;
                      setManualList(copy);
                    }}
                  />
                  <input
                    style={{ flex: 1 }}
                    placeholder="Meaning"
                    value={c.definition}
                    onChange={e => {
                      const copy = [...manualList];
                      copy[i].definition = e.target.value;
                      setManualList(copy);
                    }}
                  />
                </div>
              ))}

              <button
                onClick={handleReviewManual}
                disabled={!manualList.slice(0,count).every(c=>c.word&&c.definition)}
              >
                Review Manual Cards
              </button>
            </div>
          )}

          {/* REVIEW MODE */}
          {mode === 'review' && (
            <div className="review-panel">
              <h2>Flashcards Preview</h2>
              <div className="flashcard-list">
                {cards.map((c,i)=>(
                  <div key={i} className="flashcard">
                    <div className="inner">
                      <div className="front">{c.word}</div>
                      <div className="back">{c.definition}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="review-buttons">
                <button onClick={()=>setMode('select')}>Back</button>
                <button onClick={handleStartQuiz}>Start Quiz</button>
              </div>
            </div>
          )}

          {/* QUIZ MODE */}
          {mode === 'quiz' && (
            <div className="quiz-panel">
              <p>Time left: {timer}s</p>
              <p>{quizCards[currentIndex]?.definition}</p>
              <input value={guess} onChange={e=>setGuess(e.target.value)} />
              <div className="quiz-buttons">
                <button onClick={submitAnswer}>Submit</button>
                <button onClick={confirmSkip}>Skip</button>
                <button onClick={()=>window.location.reload()}>Restart</button>
              </div>
            </div>
          )}

          {/* MODALS */}
          {showSkip && (
            <div className="modal">
              <div className="modal-content">
                <p>Use 10 diamonds to skip?</p>
                <button onClick={doSkip}>Yes</button>
                <button onClick={()=>setShowSkip(false)}>No</button>
              </div>
            </div>
          )}

          {showNoDiamonds && (
            <div className="modal">
              <div className="modal-content warning">
                <p>No more diamonds</p>
                <button onClick={()=>navigate('/purchase')}>Store</button>
                <button onClick={()=>setShowNoDiamonds(false)}>Cancel</button>
              </div>
            </div>
          )}

          {showFillModal && (
            <div className="modal">
              <div className="modal-content">
                <p>Fill the blank</p>
                <button onClick={()=>setShowFillModal(false)}>OK</button>
              </div>
            </div>
          )}

          {showName && (
            <div className="modal">
              <div className="modal-content">
                <h3>Game Over!</h3>
                <p>Score: {results.filter(r=>r.correct).length}</p>
                <input
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={e=>setPlayerName(e.target.value)}
                />
                <button onClick={saveScore}>Save</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD */}
      {activeTab === 'Leaderboard' && (
        <div className="leaderboard panel">
          <h2>Leaderboard</h2>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="highest">Highest Score</option>
            <option value="lowest">Lowest Score</option>
            <option value="earliest">Earliest</option>
            <option value="latest">Latest</option>
          </select>
          <ul>
            {sorted.map((s,i)=>(
              <li key={i}>{s.name} – {s.score} – {s.time}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}