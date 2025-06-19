import React, { useState, useEffect } from 'react';
import { Link }            from 'react-router-dom';
import './PurchasePage.css';

export default function PurchasePage() {
  const username = localStorage.getItem('username');
  const PACKAGES = [30, 60, 90, 150, 200, 300];
  const CHESTS   = [
    { id: 1, img: 'chest1.png', chance:  5, price:  0.99 },
    { id: 2, img: 'chest2.png', chance: 10, price:  1.99 },
    { id: 3, img: 'chest3.png', chance: 20, price:  3.99 },
    { id: 4, img: 'chest4.png', chance: 30, price:  5.99 },
    { id: 5, img: 'chest5.png', chance: 40, price:  8.99 },
    { id: 6, img: 'chest6.png', chance: 70, price: 13.85 },
  ];

  const [diamonds, setDiamonds]         = useState(20);
  const [buyModal, setBuyModal]         = useState({ show:false, amount:0, price:0 });
  const [buyPayment, setBuyPayment]     = useState({ cardNumber:'', expiry:'', cvv:'' });
  const [chestModal, setChestModal]     = useState({ show:false, chest:null, phase:'confirm', reward:0 });
  const [chestPayment, setChestPayment] = useState({ cardNumber:'', expiry:'', cvv:'' });

  // fetch initial diamond count for this user
  useEffect(() => {
    fetch(`http://127.0.0.1:5001/game-state?username=${username}`)
      .then(r => r.json())
      .then(({ diamonds }) => setDiamonds(diamonds))
      .catch(console.error);
  }, [username]);

  function openBuy(amount) {
    const price = parseFloat(((amount/20)*0.99).toFixed(2));
    setBuyModal({ show:true, amount, price });
    setBuyPayment({ cardNumber:'', expiry:'', cvv:'' });
  }
  function cancelBuy() {
    setBuyModal({ show:false, amount:0, price:0 });
  }
  function confirmBuy() {
    const newCount = diamonds + buyModal.amount;

    // persist to backend
    fetch('http://127.0.0.1:5001/update-diamonds', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, diamonds: newCount }),
    }).catch(console.error);

    // update local state
    setDiamonds(newCount);
    cancelBuy();
  }

  function openChest(chest) {
    setChestModal({ show:true, chest, phase:'confirm', reward:0 });
    setChestPayment({ cardNumber:'', expiry:'', cvv:'' });
  }
  function cancelChest() {
    setChestModal({ show:false, chest:null, phase:'confirm', reward:0 });
  }
  function confirmChest() {
    const { chance } = chestModal.chest;
    const got300 = Math.random()*100 < chance;
    const reward = got300 ? 300 : 10;
    const newCount = diamonds + reward;

    // persist to backend
    fetch('http://127.0.0.1:5001/update-diamonds', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, diamonds: newCount }),
    }).catch(console.error);

    // update local
    setDiamonds(newCount);
    setChestModal(m => ({ ...m, phase:'result', reward }));
  }

  return (
    <div
      className="common-page purchase-page"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/photos/pages5.jpg)` }}
    >
      {/* HEADER */}
      <div className="header-bar">
        <Link to="/home2" className="home-link">
          <img src={`${process.env.PUBLIC_URL}/photos/home.jpg`} alt="Home" />
        </Link>
        <div className="header-center">
          <h1>Store</h1>
          <div className="header-diamonds">💎 {diamonds}</div>
        </div>
      </div>

      {/* BUY DIAMONDS */}
      <h2 className="section-title">Buy Diamonds</h2>
      <div className="store-grid">
        {PACKAGES.map((amt,i) => (
          <div key={i} className="package">
            <img
              src={`${process.env.PUBLIC_URL}/photos/gem${i+1}.png`}
              alt={`${amt} diamonds`}
              className="package-pic"
            />
            <div className="label-under">{amt} Diamonds</div>
            <button className="buy-btn" onClick={()=>openBuy(amt)}>Buy</button>
          </div>
        ))}
      </div>

      {/* OPEN A CHEST */}
      <h2 className="section-title">Open a Chest</h2>
      <div className="chest-grid">
        {CHESTS.map(c => (
          <div key={c.id} className="chest-option">
            <img
              src={`${process.env.PUBLIC_URL}/photos/${c.img}`}
              alt={`Chest ${c.id}`}
              className="chest-pic"
            />
            <div className="chest-info">
              {c.chance}% chance to get 300 ♦
            </div>
            <div className="chest-price">SGD ${c.price.toFixed(2)}</div>
            <button className="buy-btn" onClick={()=>openChest(c)}>Open Chest</button>
          </div>
        ))}
      </div>

      {/* BUY MODAL */}
      {buyModal.show && (
        <div className="modal">
          <div className="modal-content">
            <p>
              Buy <strong>{buyModal.amount}</strong> diamonds for{' '}
              <strong>SGD ${buyModal.price}</strong>?
            </p>
            <div className="payment-form">
              <input
                type="text"
                placeholder="Card Number (4111 1111 1111 1111)"
                value={buyPayment.cardNumber}
                onChange={e=>setBuyPayment(bp=>({...bp,cardNumber:e.target.value}))}
              />
              <input
                type="text"
                placeholder="MM/YY"
                value={buyPayment.expiry}
                onChange={e=>setBuyPayment(bp=>({...bp,expiry:e.target.value}))}
              />
              <input
                type="text"
                placeholder="CVV"
                value={buyPayment.cvv}
                onChange={e=>setBuyPayment(bp=>({...bp,cvv:e.target.value}))}
              />
            </div>
            <div className="modal-buttons">
              <button className="btn" onClick={cancelBuy}>Cancel</button>
              <button
                className="btn"
                onClick={confirmBuy}
                disabled={!buyPayment.cardNumber||!buyPayment.expiry||!buyPayment.cvv}
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEST MODAL */}
      {chestModal.show && (
        <div className="modal">
          <div className="modal-content">
            {chestModal.phase==='confirm' ? (
              <>
                <p>
                  Open Chest #{chestModal.chest.id} for{' '}
                  <strong>SGD ${chestModal.chest.price.toFixed(2)}</strong>?
                </p>
                <div className="payment-form">
                  <input
                    type="text"
                    placeholder="Card Number (4111 1111 1111 1111)"
                    value={chestPayment.cardNumber}
                    onChange={e=>setChestPayment(cp=>({...cp,cardNumber:e.target.value}))}
                  />
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={chestPayment.expiry}
                    onChange={e=>setChestPayment(cp=>({...cp,expiry:e.target.value}))}
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={chestPayment.cvv}
                    onChange={e=>setChestPayment(cp=>({...cp,cvv:e.target.value}))}
                  />
                </div>
                <div className="modal-buttons">
                  <button className="btn" onClick={cancelChest}>Cancel</button>
                  <button
                    className="btn"
                    onClick={confirmChest}
                    disabled={!chestPayment.cardNumber||!chestPayment.expiry||!chestPayment.cvv}
                  >
                    Open Chest
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>🎉 You got <strong>{chestModal.reward}</strong> diamonds!</p>
                <button className="btn" onClick={cancelChest}>OK</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
