// src/pages/StudyPage.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudyPage.css';

export default function StudyPage() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const fileInputRef = useRef(null);

  const bgStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages4.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const [rawNotes, setRawNotes] = useState('');
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [loadingSum, setLoadingSum] = useState(false);

  const [text, setText] = useState('');
  const [tone, setTone] = useState('casual');
  const [paraphrase, setParaphrase] = useState('');
  const [loadingPara, setLoadingPara] = useState(false);

  const [searchWord, setSearchWord] = useState('');
  const [vocabDef, setVocabDef] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [generatedWord, setGeneratedWord] = useState('');




  const [manualWord, setManualWord] = useState('');
  const [manualMeaning, setManualMeaning] = useState('');

  const [manualText, setManualText] = useState('');
  const [extractedManual, setExtractedManual] = useState([]);
  const [loadingExtractManual, setLoadingExtractManual] = useState(false);

  const [aiParagraph, setAiParagraph] = useState('');
  const [extractedAi, setExtractedAi] = useState([]);
  const [loadingGenAiPara, setLoadingGenAiPara] = useState(false);
  const [loadingExtractAi, setLoadingExtractAi] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  const showPopup = (msg = '✅ Saved Successfully!') => {
    setMessage(msg);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 1500);
  };

  const saveToServer = async (url, body) => {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showPopup();
    } catch {
      showPopup('❌ Error saving');
    }
  };

  const genNotes = async () => {
    setLoadingSum(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/generate-note', { method: 'POST' });
      const { note } = await res.json();
      setRawNotes(note || '');
    } catch {
      showPopup('❌ Error generating');
    } finally {
      setLoadingSum(false);
    }
  };

  const doSumm = async () => {
    if (!rawNotes.trim() && !file) return showPopup('❌ Paste text or upload file');
    setLoadingSum(true);
    try {
      let data;
      if (rawNotes.trim()) {
        data = await (await fetch('https://study-classmate-server.onrender.com/summarize-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawNotes })
        })).json();
      } else {
        const form = new FormData();
        form.append('file', file);
        data = await (await fetch('https://study-classmate-server.onrender.com/summarize', {
          method: 'POST',
          body: form
        })).json();
      }
      setSummary(data.summary || '⚠️ No summary generated');
    } catch {
      showPopup('❌ Error summarising');
      setSummary('❌ Error occurred');
    } finally {
      setLoadingSum(false);
    }
  };

  const saveSum = () => {
    if (!summary) return showPopup('❌ Nothing to save');
    saveToServer('https://study-classmate-server.onrender.com/save-summary', { username, content: summary });
  };

  const genExample = async () => {
    setLoadingPara(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/generate-note', { method: 'POST' });
      const { note } = await res.json();
      setText(note || '');
    } catch {
      showPopup('❌ Error generating');
    } finally {
      setLoadingPara(false);
    }
  };

  const doPara = async () => {
    if (!text.trim()) return showPopup('❌ Enter or generate text');
    setLoadingPara(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/paraphrase-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone })
      });
      const { content } = await res.json();
      setParaphrase(content || '⚠️ No paraphrase result');
    } catch {
      showPopup('❌ Error paraphrasing');
      setParaphrase('❌ Error occurred');
    } finally {
      setLoadingPara(false);
    }
  };

  const savePara = () => {
    if (!paraphrase) return showPopup('❌ Nothing to save');
    saveToServer('https://study-classmate-server.onrender.com/save-paraphrase', { username, content: paraphrase, tone });
  };

  const searchDefinition = async () => {
    if (!searchWord) return;
    setLoadingSearch(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/define-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: searchWord })
      });
      const data = await res.json();
      if (data.content) {
        setVocabDef(data.content);
        setGeneratedWord(searchWord);
      } else {
        setVocabDef('No definition found.');
      }
    } catch (err) {
      console.error(err);
      setVocabDef('Error fetching definition.');
    } finally {
      setLoadingSearch(false);
    }
  };


  const saveSearchedVocab = async () => {
    if (!searchWord.trim() || !vocabDef.trim()) {
      return showPopup('❌ Nothing to save');
    }

    try {
      await saveToServer(
        'https://study-classmate-server.onrender.com/save-vocab',
        { username, word: searchWord, definition: vocabDef }
      );
      // saveToServer already calls showPopup('✅ ...') on success
    } catch {
      showPopup('❌ Error saving');  // fallback (rarely fired)
    }
  };


  const saveManualVocab = () => {
    if (!manualWord || !manualMeaning) return showPopup('❌ Fill both fields');
    saveToServer('https://study-classmate-server.onrender.com/save-vocab', {
      username, word: manualWord, definition: manualMeaning
    });
  };

  const extractManual = async () => {
    if (!manualText.trim()) return showPopup('❌ Enter text');
    setLoadingExtractManual(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/extract-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: manualText })
      });
      const resJson = await res.json();
      const extracted = resJson.words?.words || [];
      setExtractedManual(extracted.length > 0 ? extracted : ['⚠️ No vocab found']);

    } catch {
      showPopup('❌ Extract failed');
      setExtractedManual(['❌ Error occurred']);
    } finally {
      setLoadingExtractManual(false);
    }
  };

  const generateAIPara = async () => {
    setLoadingGenAiPara(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/generate-note', { method: 'POST' });
      const { note } = await res.json();
      setAiParagraph(note || '');
    } catch {
      showPopup('❌ Error generating AI paragraph');
    } finally {
      setLoadingGenAiPara(false);
    }
  };

  const extractFromAI = async () => {
    if (!aiParagraph.trim()) return showPopup('❌ No AI paragraph yet');
    setLoadingExtractAi(true);
    try {
      const res = await fetch('https://study-classmate-server.onrender.com/extract-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiParagraph })
      });
      
      const resJson = await res.json();
      const extracted = resJson.words?.words || [];
      setExtractedAi(extracted.length > 0 ? extracted : ['⚠️ No vocab found']);

    } catch {
      showPopup('❌ Extract failed');
      setExtractedAi(['❌ Error occurred']);
    } finally {
      setLoadingExtractAi(false);
    }
  };
const saveExtractedManual = () => {
  if (extractedManual.length === 0 || extractedManual[0].startsWith('⚠️') || extractedManual[0].startsWith('❌')) {
    return showPopup('❌ Nothing to save');
  }
  saveToServer('https://study-classmate-server.onrender.com/save-vocab', {
    username,
    word: 'Manual Extract',
    definition: extractedManual.join(', ')
  });
};

const saveExtractedAi = () => {
  if (extractedAi.length === 0 || extractedAi[0].startsWith('⚠️') || extractedAi[0].startsWith('❌')) {
    return showPopup('❌ Nothing to save');
  }
  saveToServer('https://study-classmate-server.onrender.com/save-vocab', {
    username,
    word: 'AI Extract',
    definition: extractedAi.join(', ')
  });
};

  return (
    <div className="study-page" style={bgStyle}>
      <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" className="study-home" onClick={() => navigate('/home2')} />
      <h1 className="main-header">Let's Study</h1>
      {showModal && message && (
        <div className="modal show">
          <div className="modal-content">
            <span className="close-btn" onClick={() => setShowModal(false)}>×</span>
            
            {message}
          </div>
        </div>
      )}

      {/* Summarise Section */}
      <div className="top-row">
        <section className="section">
          <h2>Summarise Note <button onClick={saveSum}>Save</button></h2>
          <textarea rows="4" value={rawNotes} onChange={e => setRawNotes(e.target.value)} placeholder="Paste notes..." />
          <input type="file" ref={fileInputRef} accept=".txt,.pdf" onChange={e => setFile(e.target.files[0])} />
          <button onClick={genNotes} disabled={loadingSum}>{loadingSum ? 'Generating...' : 'Generate'}</button>
          <button onClick={doSumm} disabled={loadingSum}>{loadingSum ? 'Summarising...' : 'Summarise'}</button>
          {summary && <div className="generated-output">{summary}</div>}
        </section>

        {/* Paraphrase Section */}
        <section className="section">
          <h2>Paraphrase Note <button onClick={savePara}>Save</button></h2>
          <textarea rows="4" value={text} onChange={e => setText(e.target.value)} placeholder="Type here..." />
          <select value={tone} onChange={e => setTone(e.target.value)}>
            <option value="casual">Casual</option>
            <option value="academic">Academic</option>
          </select>
          <button onClick={genExample} disabled={loadingPara}>{loadingPara ? 'Generating...' : 'Generate Example'}</button>
          <button onClick={doPara} disabled={loadingPara}>{loadingPara ? 'Paraphrasing...' : 'Paraphrase'}</button>
          {paraphrase && <div className="generated-output">{paraphrase}</div>}
        </section>
      </div>

      {/* Vocab Section */}
      <div className="middle-row">
        
        <section className="section">
          <h2>Vocab Search <button onClick={saveSearchedVocab}>Save</button></h2>

            <button
              onClick={async () => {
                setLoadingSearch(true);
                try {
                  const res = await fetch('https://study-classmate-server.onrender.com/generate-word', {
                    method: 'POST'
                  });
                  const data = await res.json();
                  if (data.word) {
                    setSearchWord(data.word);
                    setGeneratedWord(data.word);

                    // Immediately call searchDefinition with new word
                    const defRes = await fetch('https://study-classmate-server.onrender.com/define-word', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ word: data.word })
                    });
                    const defData = await defRes.json();
                    setVocabDef(defData.content || 'No definition found.');
                  }
                } catch (err) {
                  setMessage('❌ Failed to generate word');
                  setVocabDef('Error fetching definition.');
                } finally {
                  setLoadingSearch(false);
                  setTimeout(() => setMessage(''), 1500);
                }
              }}
              disabled={loadingSearch}
            >
              {loadingSearch ? 'Generating...' : '🎲 Generate Word'}
            </button>

        
          <input type="text" value={searchWord} onChange={e => setSearchWord(e.target.value)} placeholder="Enter word..." />
            <button onClick={searchDefinition} disabled={loadingSearch}>
              {loadingSearch ? 'Searching...' : 'Search'}
          
          </button>
          {vocabDef && (
            <div className="answer-box">
              <p><strong>{generatedWord}</strong>: {vocabDef}</p>
            </div>
          )}

        </section>


        <section className="section">
          <h2>Manual Vocab</h2>
          <input type="text" value={manualWord} onChange={e => setManualWord(e.target.value)} placeholder="Word" />
          <textarea rows="2" value={manualMeaning} onChange={e => setManualMeaning(e.target.value)} placeholder="Meaning" />
          <button onClick={saveManualVocab}>Save</button>
        </section>
      </div>

      {/* Extract Section */}
      <div className="extract-row">
        {/* Manual Extract Section */}
        <section className="section">
          <h2>Extract from Manual Text <button onClick={saveExtractedManual}>Save</button></h2>
          <textarea rows="4" value={manualText} onChange={e => setManualText(e.target.value)} placeholder="Enter text..." />
          <button onClick={extractManual} disabled={loadingExtractManual}>
            {loadingExtractManual ? 'Extracting...' : 'Extract'}
          </button>
          {extractedManual.length > 0 && (
            <ul className="extracted-list">
              {extractedManual.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </section>

        {/* AI Extract Section */}
        <section className="section">
          <h2>Extract from AI Paragraph <button onClick={saveExtractedAi}>Save</button></h2>
          <button onClick={generateAIPara} disabled={loadingGenAiPara}>
            {loadingGenAiPara ? 'Generating...' : 'Generate AI Paragraph'}
          </button>
          {aiParagraph && <div className="generated-output">{aiParagraph}</div>}
          <button onClick={extractFromAI} disabled={loadingExtractAi}>
            {loadingExtractAi ? 'Extracting...' : 'Extract Vocab'}
          </button>
          {extractedAi.length > 0 && (
            <ul className="extracted-list">
              {extractedAi.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </section>
      </div>

     
    </div>
  );
}
