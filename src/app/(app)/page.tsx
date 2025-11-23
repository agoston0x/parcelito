'use client';

import { useEffect, useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useBuyParcelito } from '@/hooks/useBuyParcelito';
import { PARCELITO_COMPOSITIONS } from '@/lib/ens';

type Tab = 'home' | 'buy' | 'create' | 'gift';

// Simple pie chart component
const PieChart = ({ tokens, allocations, colors }: { tokens: string[], allocations: number[], colors: string[] }) => {
  let cumulativePercent = 0;
  const segments = allocations.map((percent, i) => {
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    const startAngle = (startPercent / 100) * 360;
    const endAngle = (cumulativePercent / 100) * 360;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
    return (
      <path
        key={i}
        d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
        fill={colors[i % colors.length]}
      />
    );
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-20 h-20">
        {segments}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="flex flex-wrap gap-2">
        {tokens.map((token, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="text-gray-600">{token} {allocations[i]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PIE_COLORS = ['#FF7A00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

// Parcelito data with allocations
const bestValueParcelitos = [
  { id: '1', icon: 'L1', name: 'Layer 1s', tokens: ['ETH', 'SOL', 'AVAX'], allocations: [50, 30, 20], return: 24.5, buyers: 1243, bg: 'linear-gradient(135deg, #627EEA, #3B82F6)' },
  { id: '2', icon: 'RWA', name: 'Real World', tokens: ['PAXG', 'ONDO', 'RWA'], allocations: [40, 35, 25], return: 12.1, buyers: 856, bg: 'linear-gradient(135deg, #F7931A, #FCD535)' },
  { id: '3', icon: 'DeFi', name: 'DeFi Blue', tokens: ['UNI', 'AAVE', 'MKR'], allocations: [35, 35, 30], return: 18.7, buyers: 2105, bg: 'linear-gradient(135deg, #00D395, #10B981)' },
];

const moreParcelitos = [
  { id: '4', icon: 'AI', name: 'AI Tokens', tokens: ['RENDER', 'FET', 'OCEAN'], allocations: [40, 35, 25], return: 34.2, buyers: 567, bg: 'linear-gradient(135deg, #8B5CF6, #A855F7)' },
  { id: '5', icon: 'Meme', name: 'Top Memes', tokens: ['DOGE', 'SHIB', 'PEPE'], allocations: [40, 30, 30], return: -5.2, buyers: 3421, bg: 'linear-gradient(135deg, #FF6B6B, #EE5A5A)' },
  { id: '6', icon: 'L2', name: 'Layer 2s', tokens: ['ARB', 'OP', 'MATIC'], allocations: [40, 35, 25], return: 15.8, buyers: 1892, bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
];

const classicCommunity = [
  { id: 'c1', creator: '@alphacrypto', name: 'AI Picks', tokens: ['RENDER', 'FET', 'OCEAN'], allocations: [40, 35, 25], return: 34.2, followers: 423 },
  { id: 'c2', creator: '@safeyields', name: 'Stable Yield', tokens: ['USDC', 'DAI', 'FRAX'], allocations: [40, 30, 30], return: 8.4, followers: 892 },
  { id: 'c3', creator: '@indexfund', name: 'Blue Chips', tokens: ['BTC', 'ETH', 'SOL'], allocations: [40, 35, 25], return: 22.1, followers: 1205 },
];

const degenCommunity = [
  { id: 'd1', creator: '@moonshot', name: 'Moon Bets', tokens: ['PEPE', 'WIF', 'BONK'], allocations: [40, 35, 25], return: 156.3, followers: 3421 },
  { id: 'd2', creator: '@degen_plays', name: 'Leverage Long', tokens: ['BTC-3X', 'ETH-3X'], allocations: [50, 50], return: -42.5, followers: 567 },
  { id: 'd3', creator: '@ape_in', name: 'New Launches', tokens: ['???', '???', '???'], allocations: [34, 33, 33], return: 89.2, followers: 234 },
];

export default function Home() {
  const [isWorldApp, setIsWorldApp] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [giftAmount, setGiftAmount] = useState('25');
  const [recipientType, setRecipientType] = useState<'world' | 'email'>('world');
  const [isVerified, setIsVerified] = useState(false);
  const [selectedGiftParcelito, setSelectedGiftParcelito] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [showMoreParcelitos, setShowMoreParcelitos] = useState(false);
  const [expandedParcelito, setExpandedParcelito] = useState<string | null>(null);
  const [communityMode, setCommunityMode] = useState<'classic' | 'degen'>('classic');
  const [worldUserSearch, setWorldUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{username: string, name: string}[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [buyModal, setBuyModal] = useState<{open: boolean, parcelito: string | null, amount: string}>({open: false, parcelito: null, amount: '100'});
  const [degenModal, setDegenModal] = useState(false);

  const { recordPurchase, isLoading: isBuying } = useBuyParcelito();

  // Mock World users for search
  const mockWorldUsers = [
    { username: 'alice', name: 'Alice Chen' },
    { username: 'bob', name: 'Bob Smith' },
    { username: 'carlos', name: 'Carlos Rodriguez' },
    { username: 'diana', name: 'Diana Kim' },
    { username: 'emma', name: 'Emma Wilson' },
    { username: 'frank', name: 'Frank Lee' },
  ];

  // Search World users
  useEffect(() => {
    if (worldUserSearch.length >= 2) {
      const results = mockWorldUsers.filter(u =>
        u.username.toLowerCase().includes(worldUserSearch.toLowerCase()) ||
        u.name.toLowerCase().includes(worldUserSearch.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [worldUserSearch]);

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
          <div className="section-header">
            <h2>Best Value</h2>
            <span className="badge">By Parcelito</span>
          </div>

          <div className="parcelito-list">
            {bestValueParcelitos.map((item) => (
              <div
                key={item.id}
                className="parcelito-card-expandable"
                onClick={() => setExpandedParcelito(expandedParcelito === item.id ? null : item.id)}
              >
                <div className="card-main">
                  <div className="parcelito-icon" style={{background: item.bg}}>
                    <span>{item.icon}</span>
                  </div>
                  <div className="parcelito-info">
                    <div className="parcelito-name">{item.name}</div>
                    <div className="parcelito-tokens">{item.tokens.join(', ')}</div>
                  </div>
                  <div className="parcelito-stats">
                    <div className={`parcelito-return ${item.return >= 0 ? 'positive' : 'negative'}`}>
                      {item.return >= 0 ? '+' : ''}{item.return}%
                    </div>
                    <div className="parcelito-buyers">{item.buyers.toLocaleString()} buyers</div>
                  </div>
                  <svg className={`chevron ${expandedParcelito === item.id ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expandedParcelito === item.id && (
                  <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
                    <PieChart tokens={item.tokens} allocations={item.allocations} colors={PIE_COLORS} />
                    <button className="buy-btn-full" style={{marginTop: '12px'}} onClick={() => setBuyModal({open: true, parcelito: item.name, amount: '100'})}>
                      Buy {item.name}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {showMoreParcelitos && moreParcelitos.map((item) => (
              <div
                key={item.id}
                className="parcelito-card-expandable"
                onClick={() => setExpandedParcelito(expandedParcelito === item.id ? null : item.id)}
              >
                <div className="card-main">
                  <div className="parcelito-icon" style={{background: item.bg}}>
                    <span>{item.icon}</span>
                  </div>
                  <div className="parcelito-info">
                    <div className="parcelito-name">{item.name}</div>
                    <div className="parcelito-tokens">{item.tokens.join(', ')}</div>
                  </div>
                  <div className="parcelito-stats">
                    <div className={`parcelito-return ${item.return >= 0 ? 'positive' : 'negative'}`}>
                      {item.return >= 0 ? '+' : ''}{item.return}%
                    </div>
                    <div className="parcelito-buyers">{item.buyers.toLocaleString()} buyers</div>
                  </div>
                  <svg className={`chevron ${expandedParcelito === item.id ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expandedParcelito === item.id && (
                  <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
                    <PieChart tokens={item.tokens} allocations={item.allocations} colors={PIE_COLORS} />
                    <button className="buy-btn-full" style={{marginTop: '12px'}} onClick={() => setBuyModal({open: true, parcelito: item.name, amount: '100'})}>
                      Buy {item.name}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!showMoreParcelitos && (
            <button className="show-more-btn" onClick={() => setShowMoreParcelitos(true)}>
              Show more
            </button>
          )}

          <div className="section-header" style={{marginTop: '16px'}}>
            <h2>Community</h2>
            <div className="swipe-toggle">
              <button
                className={`swipe-option ${communityMode === 'classic' ? 'active' : ''}`}
                onClick={() => setCommunityMode('classic')}
              >Classic</button>
              <button
                className={`swipe-option ${communityMode === 'degen' ? 'active degen' : ''}`}
                onClick={() => setCommunityMode('degen')}
              >Degen</button>
            </div>
          </div>

          <div className="parcelito-list compact">
            {(communityMode === 'classic' ? classicCommunity : degenCommunity).map((item) => (
              <div
                key={item.id}
                className="parcelito-card-expandable compact"
                onClick={() => setExpandedParcelito(expandedParcelito === item.id ? null : item.id)}
              >
                <div className="card-main">
                  <div className={`creator-avatar ${communityMode === 'degen' ? 'degen' : ''}`}>
                    {item.creator.charAt(1).toUpperCase()}
                  </div>
                  <div className="parcelito-info">
                    <div className="parcelito-name">{item.name}</div>
                    <div className="parcelito-tokens">by {item.creator}</div>
                  </div>
                  <div className="parcelito-stats">
                    <div className={`parcelito-return ${item.return >= 0 ? 'positive' : 'negative'}`}>
                      {item.return >= 0 ? '+' : ''}{item.return}%
                    </div>
                    <div className="parcelito-buyers">{item.followers} followers</div>
                  </div>
                  <svg className={`chevron ${expandedParcelito === item.id ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {expandedParcelito === item.id && (
                  <div className="card-expanded" onClick={(e) => e.stopPropagation()}>
                    <PieChart tokens={item.tokens} allocations={item.allocations} colors={communityMode === 'degen' ? ['#EF4444', '#DC2626', '#B91C1C'] : PIE_COLORS} />
                    <button className={`buy-btn-full ${communityMode === 'degen' ? 'degen' : ''}`} style={{marginTop: '12px'}} onClick={() => {
                      if (communityMode === 'degen') {
                        setDegenModal(true);
                      } else {
                        showToast(`Following ${item.name}...`);
                      }
                    }}>
                      Follow & Buy
                    </button>
                  </div>
                )}
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
                onClick={() => { setRecipientType('world'); setSelectedRecipient(null); }}
              >
                World User
              </button>
              <button
                className={`recipient-tab ${recipientType === 'email' ? 'active' : ''}`}
                onClick={() => { setRecipientType('email'); setSelectedRecipient(null); }}
              >
                Email
              </button>
            </div>

            {recipientType === 'world' ? (
              <div className="world-search-section">
                {selectedRecipient ? (
                  <div className="selected-recipient">
                    <div className="recipient-avatar">{selectedRecipient.charAt(0).toUpperCase()}</div>
                    <span>@{selectedRecipient}</span>
                    <button className="clear-recipient" onClick={() => { setSelectedRecipient(null); setWorldUserSearch(''); }}>×</button>
                  </div>
                ) : (
                  <>
                    <div className="recipient-input-wrapper">
                      <span className="at-symbol">@</span>
                      <input
                        type="text"
                        placeholder="Search World users..."
                        className="recipient-input"
                        value={worldUserSearch}
                        onChange={(e) => setWorldUserSearch(e.target.value)}
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="search-results">
                        {searchResults.map((user) => (
                          <div
                            key={user.username}
                            className="search-result-item"
                            onClick={() => { setSelectedRecipient(user.username); setWorldUserSearch(''); setSearchResults([]); }}
                          >
                            <div className="recipient-avatar">{user.username.charAt(0).toUpperCase()}</div>
                            <div>
                              <div className="result-name">{user.name}</div>
                              <div className="result-username">@{user.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="recipient-input-wrapper">
                <input
                  type="email"
                  placeholder="friend@email.com"
                  className="recipient-input"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="gift-message-section">
            <label>Add a message (optional)</label>
            <textarea placeholder="Happy birthday!" className="gift-message"></textarea>
          </div>

          <button
            className="send-gift-btn"
            disabled={isSending || (recipientType === 'world' ? !selectedRecipient : !emailAddress)}
            onClick={async () => {
              setIsSending(true);
              const parcelitoName = ['Layer 1s', 'Real World', 'DeFi Blue'][selectedGiftParcelito];

              if (recipientType === 'email') {
                try {
                  const res = await fetch('/api/send-gift-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailAddress, amount: giftAmount, parcelito: parcelitoName }),
                  });
                  if (res.ok) {
                    showToast(`Gift email sent to ${emailAddress}!`);
                    setEmailAddress('');
                  } else {
                    showToast('Failed to send email');
                  }
                } catch {
                  showToast('Failed to send email');
                }
              } else {
                // Open World Chat with pre-filled message
                const appId = process.env.NEXT_PUBLIC_WLD_APP_ID || 'app_staging_placeholder';
                const message = `Hey! I'm sending you a $${giftAmount} ${parcelitoName} Parcelito gift! 🎁 Claim it here: https://parcelito.app/claim`;
                const encodedPath = encodeURIComponent(`/${selectedRecipient}/draft`);
                const worldChatUrl = `https://worldcoin.org/mini-app?app_id=${appId}&path=${encodedPath}&message=${encodeURIComponent(message)}`;

                // Open World Chat
                window.open(worldChatUrl, '_blank');
                showToast(`Opening chat with @${selectedRecipient}...`);
              }
              setIsSending(false);
            }}
          >
            {isSending ? 'Sending...' : recipientType === 'email' ? 'Send Gift Email' : 'Send via World Chat'}
          </button>
        </div>
      </main>

      {/* Buy Modal */}
      {buyModal.open && (
        <div className="modal-overlay" onClick={() => setBuyModal({...buyModal, open: false})}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buy {buyModal.parcelito}</h3>
              <button className="modal-close" onClick={() => setBuyModal({...buyModal, open: false})}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Amount (USD)</label>
                <div className="amount-input-wrapper">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    value={buyModal.amount}
                    onChange={e => setBuyModal({...buyModal, amount: e.target.value})}
                    className="amount-input"
                  />
                </div>
                <div className="quick-amounts">
                  {['50', '100', '250', '500'].map(amt => (
                    <button
                      key={amt}
                      className={`quick-amount ${buyModal.amount === amt ? 'active' : ''}`}
                      onClick={() => setBuyModal({...buyModal, amount: amt})}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="token-preview">
                <label>You will receive:</label>
                <div className="token-chips">
                  {buyModal.parcelito && PARCELITO_COMPOSITIONS[buyModal.parcelito as keyof typeof PARCELITO_COMPOSITIONS]?.tokens.map((token, i) => (
                    <span key={token} className="token-chip selected">
                      {token} ({PARCELITO_COMPOSITIONS[buyModal.parcelito as keyof typeof PARCELITO_COMPOSITIONS].allocations[i]}%)
                    </span>
                  ))}
                </div>
              </div>

              <p className="form-hint" style={{marginTop: '12px', textAlign: 'center'}}>
                Payment via USDC on World Chain (gas sponsored)
              </p>
            </div>

            <button
              className="buy-btn-full"
              disabled={isBuying || !buyModal.amount}
              onClick={async () => {
                if (!buyModal.parcelito) return;
                // TODO: Get username from World App auth
                const result = await recordPurchase(
                  'demo-user', // Will be replaced with actual username from World App
                  buyModal.parcelito as keyof typeof PARCELITO_COMPOSITIONS,
                  parseFloat(buyModal.amount)
                );
                if (result.success) {
                  showToast(`Purchased ${buyModal.parcelito}! Tx: ${result.transactionId?.slice(0, 10)}...`);
                  setBuyModal({open: false, parcelito: null, amount: '100'});
                } else {
                  showToast(result.error || 'Purchase failed');
                }
              }}
            >
              {isBuying ? 'Processing...' : `Buy $${buyModal.amount} of ${buyModal.parcelito}`}
            </button>
          </div>
        </div>
      )}

      {/* Degen Eligibility Modal */}
      {degenModal && (
        <div className="modal-overlay" onClick={() => setDegenModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{color: '#EF4444'}}>Degen Mode Locked</h3>
              <button className="modal-close" onClick={() => setDegenModal(false)}>×</button>
            </div>

            <div className="modal-body" style={{textAlign: 'center'}}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🔒</div>
              <p style={{color: 'var(--gray-600)', marginBottom: '20px', lineHeight: 1.5}}>
                Degen portfolios are high-risk and require eligibility verification to protect users.
              </p>

              <div style={{background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', textAlign: 'left'}}>
                <p style={{fontWeight: 600, marginBottom: '12px', color: 'var(--gray-700)'}}>Unlock by completing:</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{color: 'var(--green)'}}>✓</span>
                    <span style={{color: 'var(--gray-600)'}}>Verify with World ID (Orb)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{color: 'var(--gray-400)'}}>○</span>
                    <span style={{color: 'var(--gray-600)'}}>Hold 500+ USDC balance</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{color: 'var(--gray-400)'}}>○</span>
                    <span style={{color: 'var(--gray-600)'}}>Complete 3+ classic trades</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{color: 'var(--gray-400)'}}>○</span>
                    <span style={{color: 'var(--gray-600)'}}>Acknowledge risk disclaimer</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="buy-btn-full"
              style={{background: 'linear-gradient(135deg, #EF4444, #DC2626)'}}
              onClick={() => {
                setDegenModal(false);
                showToast('Complete eligibility steps to unlock degen mode');
              }}
            >
              View Requirements
            </button>
          </div>
        </div>
      )}

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
