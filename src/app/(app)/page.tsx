'use client';

import { useEffect, useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

type Tab = 'home' | 'buy' | 'create' | 'gift';

export default function Home() {
  const [isWorldApp, setIsWorldApp] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [giftAmount, setGiftAmount] = useState('25');
  const [recipientType, setRecipientType] = useState<'world' | 'email'>('world');
  const [isVerified, setIsVerified] = useState(false);
  const [selectedGiftParcelito, setSelectedGiftParcelito] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setIsWorldApp(MiniKit.isInstalled());
    // Hide splash after animation completes
    const timer = setTimeout(() => setShowSplash(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  const showToast = useCallback((message: string) => {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }, []);

  const handleVerify = () => {
    showToast('World ID verification...');
    setTimeout(() => setIsVerified(true), 1500);
  };

  return (
    <div id="app">
      {/* Splash Screen */}
      {showSplash && (
        <div className="splash-screen">
          <img src="/parcelito.png" alt="Parcelito" className="splash-logo" />
        </div>
      )}

      {/* Header */}
      <header className="header">
        <img src="/parcelito.png" alt="Parcelito" className="logo" />
        <span className="header-title">parcelito</span>
        <button className="profile-btn" onClick={() => showToast(isWorldApp ? 'World App connected!' : 'Open in World App')}>
          <div className="avatar">T</div>
        </button>
      </header>

      {/* Main Content */}
      <main className="content">
        {/* Home Tab */}
        <div className={`tab-content ${activeTab === 'home' ? 'active' : ''}`}>
          <div className="balance-card">
            <div className="balance-label">Total Balance</div>
            <div className="balance-amount">$1,247.83</div>
            <div className="balance-change positive">+12.4% all time</div>
          </div>

          <div className="section-header">
            <h2>My Parcelitos</h2>
          </div>

          <div className="parcelito-list">
            <div className="parcelito-card" onClick={() => showToast('Opening Blue Chips...')}>
              <div className="parcelito-icon" style={{background: 'linear-gradient(135deg, #627EEA, #8B5CF6)'}}>
                <span>ETH</span>
              </div>
              <div className="parcelito-info">
                <div className="parcelito-name">Blue Chips</div>
                <div className="parcelito-tokens">ETH, BTC, SOL</div>
              </div>
              <div className="parcelito-value">
                <div className="parcelito-amount">$847.50</div>
                <div className="parcelito-change positive">+8.2%</div>
              </div>
            </div>

            <div className="parcelito-card" onClick={() => showToast('Opening Real World...')}>
              <div className="parcelito-icon" style={{background: 'linear-gradient(135deg, #F7931A, #FFD700)'}}>
                <span>RWA</span>
              </div>
              <div className="parcelito-info">
                <div className="parcelito-name">Real World</div>
                <div className="parcelito-tokens">PAXG, ONDO, RWA</div>
              </div>
              <div className="parcelito-value">
                <div className="parcelito-amount">$400.33</div>
                <div className="parcelito-change positive">+3.1%</div>
              </div>
            </div>
          </div>

          <div className="section-header">
            <h2>Recent Activity</h2>
          </div>

          <div className="activity-list">
            <div className="activity-item" onClick={() => showToast('Viewing purchase...')}>
              <div className="activity-icon buy">+</div>
              <div className="activity-info">
                <div className="activity-title">Bought Blue Chips</div>
                <div className="activity-time">2 hours ago</div>
              </div>
              <div className="activity-amount">$200.00</div>
            </div>
            <div className="activity-item" onClick={() => showToast('Viewing gift...')}>
              <div className="activity-icon gift">G</div>
              <div className="activity-info">
                <div className="activity-title">Gift from @alice</div>
                <div className="activity-time">Yesterday</div>
              </div>
              <div className="activity-amount">$50.00</div>
            </div>
          </div>
        </div>

        {/* Buy Tab */}
        <div className={`tab-content ${activeTab === 'buy' ? 'active' : ''}`}>
          <div className="search-bar">
            <input type="text" placeholder="Search parcelitos..." className="search-input" />
          </div>

          <div className="section-header">
            <h2>Classic Parcelitos</h2>
            <span className="badge">By Parcelito</span>
          </div>

          <div className="parcelito-grid">
            {[
              { icon: 'L1', name: 'Layer 1s', tokens: 'ETH, SOL, AVAX', change: '+24.5%', buyers: '1.2k', bg: 'linear-gradient(135deg, #627EEA, #3B82F6)' },
              { icon: 'RWA', name: 'Real World', tokens: 'PAXG, ONDO', change: '+12.1%', buyers: '856', bg: 'linear-gradient(135deg, #F7931A, #FCD535)' },
              { icon: 'DeFi', name: 'DeFi Blue', tokens: 'UNI, AAVE, MKR', change: '+18.7%', buyers: '2.1k', bg: 'linear-gradient(135deg, #00D395, #10B981)' },
              { icon: 'Meme', name: 'Top Memes', tokens: 'DOGE, SHIB, PEPE', change: '-5.2%', buyers: '3.4k', bg: 'linear-gradient(135deg, #FF6B6B, #EE5A5A)', negative: true },
            ].map((item, i) => (
              <div key={i} className="buy-card">
                <div className="buy-card-icon" style={{background: item.bg}}>{item.icon}</div>
                <div className="buy-card-name">{item.name}</div>
                <div className="buy-card-tokens">{item.tokens}</div>
                <div className="buy-card-stats">
                  <span className={item.negative ? 'negative' : 'positive'}>{item.change}</span>
                  <span className="buyers">{item.buyers} buyers</span>
                </div>
                <button className="buy-btn" onClick={(e) => { e.stopPropagation(); showToast(`Buying ${item.name}...`); }}>Buy</button>
              </div>
            ))}
          </div>

          <div className="section-header">
            <h2>Community Parcelitos</h2>
            <div className="mode-toggle">
              <button className="mode-btn active">Normie</button>
              <button className="mode-btn locked" onClick={() => showToast('Complete 3 actions to unlock!')}>Degen</button>
            </div>
          </div>

          <div className="community-list">
            {[
              { avatar: 'A', name: 'AI Picks', creator: '@alphacrypto', tokens: 'RENDER, FET, OCEAN', return: '+34.2%', followers: '423' },
              { avatar: 'M', name: 'Gaming Giants', creator: '@metaverse_max', tokens: 'IMX, GALA, AXS', return: '+21.8%', followers: '287' },
              { avatar: 'S', name: 'Stablecoin Yield', creator: '@safeyields', tokens: 'USDC, DAI, FRAX', return: '+8.4%', followers: '892' },
            ].map((item, i) => (
              <div key={i} className="community-card" onClick={() => showToast(`Opening ${item.name}...`)}>
                <div className="creator-avatar">{item.avatar}</div>
                <div className="community-info">
                  <div className="community-name">{item.name}</div>
                  <div className="community-creator">by {item.creator}</div>
                  <div className="community-tokens">{item.tokens}</div>
                </div>
                <div className="community-stats">
                  <div className="community-return positive">{item.return}</div>
                  <div className="community-followers">{item.followers} followers</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Tab */}
        <div className={`tab-content ${activeTab === 'create' ? 'active' : ''}`}>
          <div className="create-header">
            <h2>Create Parcelito</h2>
            <p>Build your own token basket for others to follow</p>
          </div>

          {!isVerified ? (
            <div className="verification-required">
              <div className="verification-icon">W</div>
              <h3>World ID Required</h3>
              <p>Verify your identity to create parcelitos and protect the community from scams.</p>
              <button className="verify-btn" onClick={handleVerify}>Verify with World ID</button>
            </div>
          ) : (
            <div className="create-form">
              <div className="form-group">
                <label>Parcelito Name</label>
                <input type="text" placeholder="e.g., My DeFi Picks" className="form-input" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe your strategy..." className="form-textarea"></textarea>
              </div>
              <div className="form-group">
                <label>Select Tokens</label>
                <div className="token-selector">
                  <div className="token-chip selected">ETH <span>40%</span></div>
                  <div className="token-chip selected">UNI <span>30%</span></div>
                  <div className="token-chip selected">AAVE <span>30%</span></div>
                  <div className="token-chip add" onClick={() => showToast('Token selector...')}>+ Add token</div>
                </div>
              </div>
              <div className="form-group">
                <label>Mode</label>
                <div className="mode-selector">
                  <button className="mode-option active">
                    <span className="mode-icon">N</span>
                    <span>Normie</span>
                  </button>
                  <button className="mode-option disabled">
                    <span className="mode-icon">D</span>
                    <span>Degen</span>
                    <span className="lock-badge">500 followers needed</span>
                  </button>
                </div>
              </div>
              <button className="create-submit-btn" onClick={() => showToast('Creating parcelito...')}>Create Parcelito</button>
            </div>
          )}
        </div>

        {/* Gift Tab */}
        <div className={`tab-content ${activeTab === 'gift' ? 'active' : ''}`}>
          <div className="gift-header">
            <h2>Send a Gift</h2>
            <p>Share crypto with friends & family</p>
          </div>

          <div className="gift-amount-section">
            <label>Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency">$</span>
              <input
                type="number"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                className="amount-input"
              />
            </div>
            <div className="quick-amounts">
              {['10', '25', '50', '100'].map((amt) => (
                <button
                  key={amt}
                  className={`quick-amount ${giftAmount === amt ? 'active' : ''}`}
                  onClick={() => setGiftAmount(amt)}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          <div className="gift-parcelito-section">
            <label>Select Parcelito</label>
            <div className="gift-parcelito-selector">
              {[
                { icon: 'L1', name: 'Layer 1s', bg: 'linear-gradient(135deg, #627EEA, #3B82F6)' },
                { icon: 'RWA', name: 'Real World', bg: 'linear-gradient(135deg, #F7931A, #FCD535)' },
                { icon: 'DeFi', name: 'DeFi Blue', bg: 'linear-gradient(135deg, #00D395, #10B981)' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`gift-option ${selectedGiftParcelito === i ? 'selected' : ''}`}
                  onClick={() => setSelectedGiftParcelito(i)}
                >
                  <div className="gift-option-icon" style={{background: item.bg}}>{item.icon}</div>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="recipient-section">
            <label>Send to</label>
            <div className="recipient-tabs">
              <button
                className={`recipient-tab ${recipientType === 'world' ? 'active' : ''}`}
                onClick={() => setRecipientType('world')}
              >
                World Username
              </button>
              <button
                className={`recipient-tab ${recipientType === 'email' ? 'active' : ''}`}
                onClick={() => setRecipientType('email')}
              >
                Email
              </button>
            </div>
            {recipientType === 'world' ? (
              <div className="recipient-input-wrapper">
                <span className="at-symbol">@</span>
                <input type="text" placeholder="username" className="recipient-input" />
              </div>
            ) : (
              <div className="recipient-input-wrapper">
                <input type="email" placeholder="friend@email.com" className="recipient-input" />
              </div>
            )}
          </div>

          <div className="gift-message-section">
            <label>Add a message (optional)</label>
            <textarea placeholder="Happy birthday!" className="gift-message"></textarea>
          </div>

          <button className="send-gift-btn" onClick={() => showToast(`Sending $${giftAmount} gift...`)}>
            Send Gift
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {[
          { id: 'home', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, icon2: <polyline points="9 22 9 12 15 12 15 22"/>, label: 'Home' },
          { id: 'buy', icon: <><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></>, label: 'Buy' },
          { id: 'create', icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>, label: 'Create' },
          { id: 'gift', icon: <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></>, label: 'Gift' },
        ].map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id as Tab)}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {item.icon}
              {item.icon2}
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
