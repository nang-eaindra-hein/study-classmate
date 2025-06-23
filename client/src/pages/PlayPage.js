import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PlayPage.css';

const API = 'https://study-classmate-server.onrender.com';

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
          promptSkip(); // auto-skip when time’s up
          return 15;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Answer or skip
  const handleAnswer = async (submitted, isSkip = false) => {
    clearInterval(timerRef.current);

    // check diamonds on skip
    if (isSkip && diamonds < 10) {
      return setShowSkipConfirm(true);
    }

    // deduct if skipping
    if (isSkip) {
      const newD = diamonds - 10;
      setDiamonds(newD);
      await fetch(`${API}/update-diamonds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, diamonds: newD }),
      }).catch(console.error);
    }

    // check correct
    let correct = false;
    if (!isSkip && submitted.trim()) {
      correct =
        submitted.trim().toLowerCase() ===
        quizCards[currentIndex].word.toLowerCase();
    }

    // record
    const updated = [...results, { ...quizCards[currentIndex], correct }];
    setResults(updated);

    // next or end
    if (updated.length >= quizCards.length) {
      setShowName(true);
    } else {
      setCurrentIndex(i => i + 1);
      setGuess('');
      startTimer();
    }
  };

  // Skip flow
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
    } catch (e) {
      console.error(e);
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
      body: JSON.stringify({
        username,
        name: playerName,
        score: correctCount,
      }),
    });
    const { scores: updated } = await res.json();
    setScores(updated);
    setShowName(false);
    setMode('select');
    setPlayerName('');

    if (localStorage.getItem('lastQuizDate') !== TODAY) {
      localStorage.setItem('lastQuizDate', TODAY);
      // bump streak
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

  return (
    <div
      className="common-page"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages3.jpg)`,
      }}
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
            <button
              onClick={() =>
                setActiveTab(t => (t === 'Play' ? 'Leaderboard' : 'Play'))
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
                  setManualList(
                    Array.from({ length: n }, () => ({
                      word: '',
                      definition: '',
                    }))
                  );
                }}
              >
                {[5, 10, 15].map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button onClick={handleGenerate} disabled={loadingGen}>
                {loadingGen ? 'Generating…' : 'Generate From AI'}
              </button>

              <h3>Or Manual Insert:</h3>
              {manualList.map((c, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: '.5rem', margin: '.5rem 0' }}
                >
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
                disabled={
                  !manualList
                    .slice(0, count)
                    .every(x => x.word && x.definition)
                }
              >
                Review Manual Cards
              </button>
            </div>
          )}

          {mode === 'review' && (
            <div className="review-panel">
              <h2>Flashcards Preview</h2>
              <div className="flashcard-list">
                {cards.map((c, i) => (
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
                <button onClick={() => handleAnswer(guess, false)}>
                  Submit
                </button>
                <button onClick={promptSkip}>Skip</button>
                <button onClick={() => window.location.reload()}>
                  Restart
                </button>
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
            {sorted.map((s, i) => (
              <li key={i}>
                {s.name} – {s.score} –{' '}
                {new Date(s.time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SKIP CONFIRMATION */}
      {showSkipConfirm && (
        <div className="modal">
          <div className="modal-content confirm">
            <p>To skip, use 10 diamonds.</p>
            <div className="confirm-buttons">
              <button onClick={confirmSkip}>Use</button>
              <button onClick={() => setShowSkipConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAME / SAVE SCORE */}
      {showName && (
        <div className="modal">
          <div className="modal-content">
            <h3>Game Over!</h3>
            <p>Score: {results.filter(r => r.correct).length}</p>
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
  );
}
