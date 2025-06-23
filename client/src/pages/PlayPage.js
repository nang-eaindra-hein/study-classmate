import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayPage.css';
const API = process.env.REACT_APP_API_URL;


export default function PlayPage() {
  const navigate = useNavigate();
  const TODAY = new Date().toDateString();
  const username = localStorage.getItem('username');
  const API = process.env.REACT_APP_API_URL;

  // GENERAL
  const [activeTab, setActiveTab] = useState('Play');
  const [diamonds, setDiamonds]   = useState(20);
  const [scores, setScores]       = useState([]);

  // CARD SELECTION
  const [mode, setMode]       = useState('select');
  const [cards, setCards]     = useState([]);
  const [count, setCount]     = useState(5);
  const [manualList, setManualList] = useState(
    Array.from({ length: 5 }, () => ({ word:'', definition:'' }))
  );
  const [loadingGen, setLoadingGen] = useState(false);

  // FLIP STATE
  // (not needed—hover handles it)

  // QUIZ
  const [quizCards, setQuizCards]   = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer]           = useState(15);
  const timerRef                    = useRef(null);
  const [guess, setGuess]           = useState('');
  const [results, setResults]       = useState([]);

  // MODALS
  const [showSkip, setShowSkip]     = useState(false);
  const [showNoDiamonds, setShowNoDiamonds] = useState(false);
  const [showName, setShowName]     = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [sortBy, setSortBy]         = useState('highest');

  // LOAD STATE
  useEffect(() => {
    fetch(`${API}/game-state?username=${username}`)
      .then(r => r.json())
      .then(data => {
        setDiamonds(data.diamonds);
        setScores(data.scores);
      })
      .catch(console.error);
  }, [username]);

  // TIMER HANDLING
  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimer(15);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswer(false, true);
          return 15;
        }
        return t - 1;
      });
    }, 1000);
  };

  // HANDLE ANSWER & SKIP
  const handleAnswer = (submitted, isSkip = false) => {
    clearInterval(timerRef.current);
    // If skipping but no diamonds
    if (isSkip && diamonds < 10) {
      setShowNoDiamonds(true);
      return;
    }

    // Compute correctness
    let correct = false;
    if (!isSkip) {
      if (!submitted.trim()) {
        // empty guess → treat as wrong but no skip-charge
        correct = false;
      } else {
        correct = submitted.trim().toLowerCase() === quizCards[currentIndex].word.toLowerCase();
      }
    }

    // Deduct diamonds on skip
    if (isSkip) {
      const newD = diamonds - 10;
      setDiamonds(newD);
      fetch('${API}/update-diamonds', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, diamonds: newD })
      }).catch(console.error);
    }

    // Record result
    const entry = { ...quizCards[currentIndex], correct };
    const updated = [...results, entry];
    setResults(updated);

    // Next or End
    if (updated.length >= quizCards.length) {
      setShowName(true);
    } else {
      setCurrentIndex(idx => idx + 1);
      setGuess('');
      startTimer();
    }
  };

  // GENERATE WITH AI
  const handleGenerate = async () => {
    setLoadingGen(true);
    try {
      const setWords = new Set();
      while (setWords.size < count) {
        const r = await fetch('${API}/generate-word', { method:'POST' });
        const { word } = await r.json();
        setWords.add(word);
      }
      const words = Array.from(setWords);
      const defs = await Promise.all(words.map(async w => {
        const r = await fetch('${API}/define-word', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ word: w })
        });
        const { content } = await r.json();
        const head = content.split(/Example sentence/i)[0];
        const m = head.match(/Definition:\s*([^-\n]+)/i);
        return { word: w, definition: m ? m[1].trim() : head.trim() };
      }));
      setCards(defs);
      setMode('review');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGen(false);
    }
  };

  // MANUAL REVIEW
  const handleReviewManual = () => {
    setCards(manualList.slice(0, count));
    setMode('review');
  };

  // START QUIZ
  const handleStartQuiz = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setQuizCards(shuffled);
    setResults([]);
    setCurrentIndex(0);
    startTimer();
    setMode('quiz');
  };

  // SAVE SCORE
  const saveScore = () => {
    if (!playerName.trim()) return;
    const correctCount = results.filter(r => r.correct).length;
    fetch('${API}/save-score', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, name: playerName, score: correctCount })
    })
      .then(r => r.json())
      .then(({ scores: updated }) => {
        setScores(updated);
        setShowName(false);
        setMode('select');
        setPlayerName('');
        if (localStorage.getItem('lastQuizDate') !== TODAY) {
          localStorage.setItem('lastQuizDate', TODAY);
          // bump streak
          fetch(`${API}/get-streak?username=${username}`)
            .then(r => r.json())
            .then(({ streakDays }) => {
              return fetch('${API}/save-streak', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({ username, streakDays: (streakDays||0) + 1 })
              });
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  };

  // SORT LEADERBOARD
  const sorted = [...scores].sort((a,b) => {
    if (sortBy==='highest')  return b.score - a.score;
    if (sortBy==='lowest')   return a.score - b.score;
    if (sortBy==='earliest') return new Date(a.time) - new Date(b.time);
    return new Date(b.time) - new Date(a.time);
  });

  return (
    <div
      className="common-page"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages3.jpg)` }}
    >
      {/* HEADER */}
      <div className="header-bar">
        <div className="inner">
          <div className="home-link" onClick={() => navigate('/home2')}>
            <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
          </div>
          <h1>Let’s Play</h1>
          <div className="right-bar">
            <span className="diamonds">💎 {diamonds}</span>
            <button
              onClick={() =>
                setActiveTab(prev => (prev === 'Play' ? 'Leaderboard' : 'Play'))
              }
            >
              {activeTab === 'Play' ? 'Leaderboard' : 'Back'}
            </button>
          </div>
        </div>
      </div>

      {/* PLAY AREA */}
      {activeTab === 'Play' && (
        <div className="play-area panel">
          {mode === 'select' && (
            <div className="select-panel">
              <label>Number of Cards:</label>
              <select
                value={count}
                onChange={e => {
                  const n = +e.target.value;
                  setCount(n);
                  setManualList(Array.from({ length: n }, () => ({ word:'', definition:'' })));
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
                <div key={i} style={{ display:'flex', gap:'0.5rem', margin:'0.5rem 0' }}>
                  <input
                    placeholder="Word"
                    value={c.word}
                    onChange={e => {
                      const copy = [...manualList];
                      copy[i].word = e.target.value;
                      setManualList(copy);
                    }}
                  />
                  <input
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
                disabled={!manualList.slice(0,count).every(x => x.word && x.definition)}
              >
                Review Manual Cards
              </button>
            </div>
          )}

          {mode === 'review' && (
            <div className="review-panel">
              <h2>Flashcards Preview</h2>
              <div className="flashcard-list">
                {cards.map((c,i) => (
                  <div key={i} className="flashcard">
                    <div className="inner">
                      <div className="front">{c.word}</div>
                      <div className="back">{c.definition}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="review-buttons">
                <button onClick={() => setMode('select')}>Back</button>
                <button onClick={handleStartQuiz}>Start Quiz</button>
              </div>
            </div>
          )}

          {mode === 'quiz' && (
            <div className="quiz-panel">
              <p>Time left: {timer}s</p>
              <p>{quizCards[currentIndex]?.definition}</p>
              <input
                value={guess}
                onChange={e => setGuess(e.target.value)}
                placeholder="Your guess"
              />
              <div className="quiz-buttons">
                <button onClick={() => handleAnswer(guess, false)}>Submit</button>
                <button onClick={() => handleAnswer('', true)}>Skip</button>
                <button onClick={() => window.location.reload()}>Restart</button>
              </div>
            </div>
          )}

          {/* MODALS */}
          {showNoDiamonds && (
            <div className="modal">
              <div className="modal-content warning">
                <p>No more diamonds</p>
                <button onClick={() => navigate('/purchase')}>Store</button>
                <button onClick={() => setShowNoDiamonds(false)}>Cancel</button>
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
                  onChange={e => setPlayerName(e.target.value)}
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
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="highest">Highest</option>
            <option value="lowest">Lowest</option>
            <option value="earliest">Earliest</option>
            <option value="latest">Latest</option>
          </select>
          <ul>
            {sorted.map((s,i) => (
              <li key={i}>
                {s.name} – {s.score} – {new Date(s.time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
