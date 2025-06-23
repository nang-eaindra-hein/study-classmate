// client/src/pages/PurchasePage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_SERVER_URL || 'http://127.0.0.1:5001';

export default function PurchasePage() {
  const username = localStorage.getItem('username');
  const PACKAGES = [30, 60, 90, 150, 200, 300];
  const CHESTS = [
    { id: 1, img: 'chest1.png', chance: 5, price: 0.99 },
    { id: 2, img: 'chest2.png', chance: 10, price: 1.99 },
    { id: 3, img: 'chest3.png', chance: 20, price: 3.99 },
    { id: 4, img: 'chest4.png', chance: 30, price: 5.99 },
    { id: 5, img: 'chest5.png', chance: 40, price: 8.99 },
    { id: 6, img: 'chest6.png', chance: 70, price: 13.85 },
  ];

  const [diamonds, setDiamonds] = useState(20);
  const [buyModal, setBuyModal] = useState({ show: false, amount: 0, price: 0 });
  const [buyPayment, setBuyPayment] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [chestModal, setChestModal] = useState({ show: false, chest: null, phase: 'confirm', reward: 0 });
  const [chestPayment, setChestPayment] = useState({ cardNumber: '', expiry: '', cvv: '' });

  useEffect(() => {
    fetch(`${API}/game-state?username=${username}`)
      .then(r => r.json())
      .then(({ diamonds }) => setDiamonds(diamonds))
      .catch(console.error);
  }, [username]);

  function openBuy(amount) {
    const price = parseFloat(((amount / 20) * 0.99).toFixed(2));
    setBuyModal({ show: true, amount, price });
    setBuyPayment({ cardNumber: '', expiry: '', cvv: '' });
  }
  function cancelBuy() {
    setBuyModal({ show: false, amount: 0, price: 0 });
  }
  function confirmBuy() {
    const newCount = diamonds + buyModal.amount;
    fetch(`${API}/update-diamonds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: newCount }),
    }).catch(console.error);
    setDiamonds(newCount);
    cancelBuy();
  }

  function openChest(chest) {
    setChestModal({ show: true, chest, phase: 'confirm', reward: 0 });
    setChestPayment({ cardNumber: '', expiry: '', cvv: '' });
  }
  function cancelChest() {
    setChestModal({ show: false, chest: null, phase: 'confirm', reward: 0 });
  }
  function confirmChest() {
    const { chance } = chestModal.chest;
    const got300 = Math.random() * 100 < chance;
    const reward = got300 ? 300 : 10;
    const newCount = diamonds + reward;
    fetch(`${API}/update-diamonds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, diamonds: newCount }),
    }).catch(console.error);
    setDiamonds(newCount);
    setChestModal(m => ({ ...m, phase: 'result', reward }));
  }

  const styles = {
    page: {
      position: 'relative',
      minHeight: '100vh',
      paddingTop: '5rem',
      fontFamily: "'Luckiest Guy', cursive",
      color: '#fff',
      backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages5.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    headerBar: {
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '4rem',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 1000,
    },
    homeLink: { position: 'absolute', left: '1rem', cursor: 'pointer' },
    homeImg: { width: 48, height: 48, borderRadius: 8 },
    headerCenter: { margin: '0 auto', textAlign: 'center' },
    headerTitle: { color: '#fff', fontSize: '2.2rem', margin: 0 },
    headerDiamonds: { color: '#fff', fontSize: '1.6rem', marginTop: 4 },
    sectionTitle: {
      textAlign: 'center', color: '#fff',
      margin: '2.5rem 0 1rem', fontSize: '1.8rem',
    },
    storeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
      gap: '1.5rem',
      width: '90%',
      maxWidth: 800,
      margin: '0 auto',
    },
    package: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    packagePic: { width: 80, height: 80, objectFit: 'contain' },
    labelUnder: { marginTop: 8, color: '#fff', fontWeight: 'bold' },
    buyBtn: {
      marginTop: 8,
      padding: '0.4rem 0.8rem',
      background: '#4caf50',
      color: '#fff',
      border: 'none',
      borderRadius: 4,
      cursor: 'pointer',
      position: 'relative',
      zIndex: 1,
    },
    chestGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))',
      gap: '1.5rem',
      width: '90%',
      maxWidth: 800,
      margin: '1rem auto 3rem',
    },
    chestOption: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    chestPic: { width: 70, height: 70, objectFit: 'contain' },
    chestInfo: { color: '#fff', marginTop: 4, textAlign: 'center', fontSize: '0.9rem' },
    chestPrice: { color: '#fff', marginTop: 4, textAlign: 'center', fontSize: '0.9rem' },
    modalOverlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    modalContent: {
      background: '#222',
      padding: '1.5rem',
      borderRadius: 6,
      textAlign: 'center',
      color: '#fff',
      width: '90%',
      maxWidth: 320,
    },
    paymentForm: { display: 'flex', flexDirection: 'column', gap: 8, margin: '1rem 0' },
    input: {
      padding: 8,
      borderRadius: 4,
      border: 'none',
      fontSize: '1rem',
    },
    modalButtons: { display: 'flex', gap: 12, justifyContent: 'center' },
    btn: {
      padding: '0.4rem 0.8rem',
      background: '#4caf50',
      color: '#fff',
      border: 'none',
      borderRadius: 4,
      cursor: 'pointer',
      position: 'relative',
      zIndex: 1,
    },
    btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.headerBar}>
        <Link to="/home2" style={styles.homeLink}>
          <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" style={styles.homeImg} />
        </Link>
        <div style={styles.headerCenter}>
          <h1 style={styles.headerTitle}>Store</h1>
          <div style={styles.headerDiamonds}>💎 {diamonds}</div>
        </div>
      </div>

      {/* BUY DIAMONDS */}
      <h2 style={styles.sectionTitle}>Buy Diamonds</h2>
      <div style={styles.storeGrid}>
        {PACKAGES.map((amt, i) => (
          <div key={i} style={styles.package}>
            <img
              src={`${process.env.PUBLIC_URL}/photos/gem${i + 1}.png`}
              alt={`${amt} diamonds`}
              style={styles.packagePic}
            />
            <div style={styles.labelUnder}>{amt} Diamonds</div>
            <button
              style={styles.buyBtn}
              onClick={() => openBuy(amt)}
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      {/* OPEN A CHEST */}
      <h2 style={styles.sectionTitle}>Open a Chest</h2>
      <div style={styles.chestGrid}>
        {CHESTS.map(c => (
          <div key={c.id} style={styles.chestOption}>
            <img
              src={`${process.env.PUBLIC_URL}/photos/${c.img}`}
              alt={`Chest ${c.id}`}
              style={styles.chestPic}
            />
            <div style={styles.chestInfo}>{c.chance}% chance to get 300 ♦</div>
            <div style={styles.chestPrice}>SGD ${c.price.toFixed(2)}</div>
            <button
              style={styles.buyBtn}
              onClick={() => openChest(c)}
            >
              Open Chest
            </button>
          </div>
        ))}
      </div>

      {/* BUY MODAL */}
      {buyModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <p>
              Buy <strong>{buyModal.amount}</strong> diamonds for{' '}
              <strong>SGD ${buyModal.price}</strong>?
            </p>
            <div style={styles.paymentForm}>
              <input
                type="text"
                placeholder="Card Number"
                value={buyPayment.cardNumber}
                onChange={e => setBuyPayment(bp => ({ ...bp, cardNumber: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="MM/YY"
                value={buyPayment.expiry}
                onChange={e => setBuyPayment(bp => ({ ...bp, expiry: e.target.value }))}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="CVV"
                value={buyPayment.cvv}
                onChange={e => setBuyPayment(bp => ({ ...bp, cvv: e.target.value }))}
                style={styles.input}
              />
            </div>
            <div style={styles.modalButtons}>
              <button
                style={styles.btn}
                onClick={cancelBuy}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.btn,
                  ...( !buyPayment.cardNumber || !buyPayment.expiry || !buyPayment.cvv
                    ? styles.btnDisabled
                    : {}
                  )
                }}
                onClick={confirmBuy}
                disabled={!buyPayment.cardNumber || !buyPayment.expiry || !buyPayment.cvv}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEST MODAL */}
      {chestModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {chestModal.phase === 'confirm' ? (
              <>
                <p>
                  Open Chest #{chestModal.chest.id} for{' '}
                  <strong>SGD ${chestModal.chest.price.toFixed(2)}</strong>?
                </p>
                <div style={styles.paymentForm}>
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={chestPayment.cardNumber}
                    onChange={e => setChestPayment(cp => ({ ...cp, cardNumber: e.target.value }))}
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={chestPayment.expiry}
                    onChange={e => setChestPayment(cp => ({ ...cp, expiry: e.target.value }))}
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={chestPayment.cvv}
                    onChange={e => setChestPayment(cp => ({ ...cp, cvv: e.target.value }))}
                    style={styles.input}
                  />
                </div>
                <div style={styles.modalButtons}>
                  <button style={styles.btn} onClick={cancelChest}>
                    Cancel
                  </button>
                  <button
                    style={{
                      ...styles.btn,
                      ...( !chestPayment.cardNumber || !chestPayment.expiry || !chestPayment.cvv
                        ? styles.btnDisabled
                        : {}
                      )
                    }}
                    onClick={confirmChest}
                    disabled={!chestPayment.cardNumber || !chestPayment.expiry || !chestPayment.cvv}
                  >
                    Open Chest
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>🎉 You got <strong>{chestModal.reward}</strong> diamonds!</p>
                <button style={styles.btn} onClick={cancelChest}>OK</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
