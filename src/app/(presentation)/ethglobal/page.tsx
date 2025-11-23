'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================
// SLIDE CONTENT - Edit your slides here
// ============================================
const slides = [
  // SLIDE 1 - TITLE
  {
    type: "hero" as const,
    word: "parcelito",
    subtitle: "Crypto gift baskets for everyone",
  },
  // SLIDE 2 - PROBLEM
  {
    type: "problem" as const,
    title: "Crypto gifting is broken",
    problems: [
      { emoji: "😵", text: "Send 0x7a3b... to grandma?" },
      { emoji: "🤯", text: "Picking tokens = paralysis" },
      { emoji: "🚨", text: "Scam portfolios everywhere" },
    ],
  },
  // SLIDE 3 - SOLUTION
  {
    type: "solution" as const,
    title: "Parcelito: Curated token baskets",
    baskets: [
      { name: "Blue Chip DeFi", tokens: ["ETH", "USDC", "AAVE"], color: "from-blue-500 to-indigo-600" },
      { name: "Latin America", tokens: ["MXNB", "BRL", "ARS"], color: "from-green-500 to-emerald-600" },
      { name: "Bitcoin Maxi", tokens: ["BTC", "WBTC", "cbBTC"], color: "from-orange-500 to-amber-500" },
    ],
    note: "Only verified humans can create portfolios",
  },
  // SLIDE 4 - HOW IT WORKS
  {
    type: "steps" as const,
    title: "Buy. Create. Gift.",
    steps: [
      { emoji: "🛒", title: "Buy basket", desc: "Any token, any chain" },
      { emoji: "🎨", title: "Create basket", desc: "World ID required" },
      { emoji: "🎁", title: "Gift it", desc: "Via @username or link" },
    ],
  },
  // SLIDE 5 - TECH STACK
  {
    type: "techstack" as const,
    title: "Built on",
    techs: [
      { name: "World Chain", desc: "Free gas" },
      { name: "1inch", desc: "Best rates" },
      { name: "LayerZero", desc: "Cross-chain" },
      { name: "ENS", desc: "Usernames" },
    ],
    tagline: "23M World App users, instant distribution",
  },
];

// Inner component that uses useSearchParams
function PresentationContent() {
  const searchParams = useSearchParams();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenter, setIsPresenter] = useState(false);
  const [presenterToken, setPresenterToken] = useState('');

  // Check if presenter mode from URL
  useEffect(() => {
    const token = searchParams.get('presenter');
    if (token) {
      setIsPresenter(true);
      setPresenterToken(token);
    }
  }, [searchParams]);

  // Poll for slide updates (only when tab visible)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const fetchSlide = async () => {
      if (document.hidden) return; // Skip if tab not visible
      try {
        const res = await fetch('/api/presentation');
        const data = await res.json();
        setCurrentSlide(data.slide);
      } catch (err) {
        console.error('Failed to fetch slide:', err);
      }
    };

    const startPolling = () => {
      fetchSlide();
      interval = setInterval(fetchSlide, isPresenter ? 1000 : 500);
    };

    const stopPolling = () => {
      if (interval) clearInterval(interval);
    };

    const handleVisibility = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isPresenter]);

  // Update slide (presenter only)
  const updateSlide = useCallback(async (newSlide: number) => {
    if (!isPresenter) return;
    if (newSlide < 0 || newSlide >= slides.length) return;

    setCurrentSlide(newSlide);

    try {
      await fetch('/api/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide: newSlide, token: presenterToken }),
      });
    } catch (err) {
      console.error('Failed to update slide:', err);
    }
  }, [isPresenter, presenterToken]);

  // Keyboard navigation (presenter only)
  useEffect(() => {
    if (!isPresenter) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        updateSlide(currentSlide + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateSlide(currentSlide - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenter, currentSlide, updateSlide]);

  const slide = slides[currentSlide];
  const presenterClass = isPresenter ? 'hidden' : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex flex-col font-sans">
      {/* Presenter indicator */}
      {isPresenter && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
          PRESENTER MODE
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full text-center text-white">
          {/* SLIDE 1 - HERO/TITLE */}
          {slide.type === 'hero' && (
            <div className="flex flex-col items-center justify-center">
              <img src="/parcelito.png" alt="Parcelito" className="w-40 h-40 md:w-56 md:h-56 rounded-3xl shadow-2xl mb-8" />
              <h1 className="text-5xl md:text-8xl font-bold mb-4">{slide.word}</h1>
              <p className="text-2xl md:text-3xl opacity-90">{slide.subtitle || "Crypto gift baskets for everyone"}</p>
            </div>
          )}

          {/* SLIDE 2 - PROBLEM */}
          {slide.type === 'problem' && (
            <div className="space-y-12">
              <h1 className="text-4xl md:text-7xl font-bold">{slide.title}</h1>
              <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch">
                {slide.problems?.map((p: {emoji: string, text: string}, i: number) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-8 flex-1 max-w-xs">
                    <div className="text-6xl mb-4">{p.emoji}</div>
                    <p className="text-xl md:text-2xl font-medium">{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 3 - SOLUTION */}
          {slide.type === 'solution' && (
            <div className="space-y-10">
              <h1 className="text-3xl md:text-5xl font-bold">{slide.title}</h1>
              <div className="flex flex-col md:flex-row gap-6 justify-center">
                {slide.baskets?.map((b: {name: string, tokens: string[], color: string}, i: number) => (
                  <div key={i} className={`bg-gradient-to-br ${b.color} rounded-2xl p-6 w-64 shadow-xl`}>
                    <h3 className="text-xl font-bold mb-3">{b.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {b.tokens.map((t: string, j: number) => (
                        <span key={j} className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xl opacity-80 mt-6">✓ {slide.note}</p>
            </div>
          )}

          {/* SLIDE 4 - STEPS */}
          {slide.type === 'steps' && (
            <div className="space-y-12">
              <h1 className="text-4xl md:text-7xl font-bold">{slide.title}</h1>
              <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                {slide.steps?.map((s: {emoji: string, title: string, desc: string}, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center w-56">
                      <div className="text-5xl mb-3">{s.emoji}</div>
                      <h3 className="text-2xl font-bold mb-1">{s.title}</h3>
                      <p className="text-lg opacity-80">{s.desc}</p>
                    </div>
                    {i < (slide.steps?.length || 0) - 1 && (
                      <div className="text-4xl opacity-50 hidden md:block">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 5 - TECH STACK */}
          {slide.type === 'techstack' && (
            <div className="space-y-10">
              <h1 className="text-4xl md:text-6xl font-bold">{slide.title}</h1>
              <div className="flex flex-wrap gap-6 justify-center">
                {slide.techs?.map((t: {name: string, desc: string}, i: number) => (
                  <div key={i} className="bg-white/20 backdrop-blur rounded-xl px-8 py-6 text-center">
                    <h3 className="text-2xl font-bold">{t.name}</h3>
                    <p className="text-lg opacity-80">{t.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-2xl font-medium mt-8">{slide.tagline}</p>
            </div>
          )}

        </div>
      </div>

      {/* Presenter controls - big touch-friendly buttons */}
      {isPresenter && (
        <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-between items-center bg-black/20">
          <button
            onClick={() => updateSlide(currentSlide - 1)}
            disabled={currentSlide === 0}
            className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center disabled:opacity-30 active:bg-white/40 transition"
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-white text-2xl font-bold">
            {currentSlide + 1} / {slides.length}
          </div>

          <button
            onClick={() => updateSlide(currentSlide + 1)}
            disabled={currentSlide === slides.length - 1}
            className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center disabled:opacity-30 active:bg-white/40 transition"
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Logo */}
      <div className={"absolute bottom-4 left-4 " + presenterClass}>
        <img src="/parcelito.png" alt="Parcelito" className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function EthGlobalPresentation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    }>
      <PresentationContent />
    </Suspense>
  );
}
