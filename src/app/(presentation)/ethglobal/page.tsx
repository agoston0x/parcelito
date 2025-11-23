'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================
// SLIDE CONTENT - 6 Slides for EthGlobal
// ============================================
const slides = [
  // SLIDE 1 - TITLE
  {
    type: "hero" as const,
    word: "parcelito",
    subtitle: "Crypto gift baskets for anyone",
  },
  // SLIDE 2 - PROBLEM
  {
    type: "confused" as const,
    title: "Non crypto natives are confused",
    emoji: "😕",
    question: "What to buy?",
  },
  // SLIDE 3 - SOLUTION
  {
    type: "solution" as const,
    title: "Token baskets curated by Parcelito, and by community",
    baskets: [
      { name: "Blue Chip DeFi", tokens: "ETH USDC AAVE" },
      { name: "Latin America", tokens: "MXNB BRL ARS" },
      { name: "Bitcoin Maxi", tokens: "BTC WBTC cBTC" },
    ],
    note: "Only verified users can create, to prevent scams",
  },
  // SLIDE 4 - HOW IT WORKS
  {
    type: "steps" as const,
    title: "Buy. Create. Gift.",
    steps: [
      { emoji: "🛒", desc: "Any token\nAny chain" },
      { emoji: "🎨", desc: "World ID\nrequired" },
      { emoji: "🎁", desc: "@username\nor link" },
    ],
  },
  // SLIDE 5 - TECH STACK
  {
    type: "techstack" as const,
    title: "Built on",
    techs: ["World Chain", "1inch", "World ID", "ENS"],
    tagline: "23M World App users • Instant distribution • Good use of World ID",
  },
  // SLIDE 6 - DEMO
  {
    type: "demo" as const,
    title: "Demo",
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
      if (document.hidden) return;
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

  return (
    <div className="min-h-screen bg-[#FF6B00] flex flex-col font-sans">
      {/* Presenter indicator */}
      {isPresenter && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full z-50">
          PRESENTER MODE
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-8 left-8 text-white/70 text-lg">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-5xl w-full text-center text-white">

          {/* SLIDE 1 - HERO/TITLE with Logo */}
          {slide.type === 'hero' && (
            <div className="flex flex-col items-center justify-center gap-5">
              <div className="w-48 h-48 md:w-52 md:h-52 bg-white rounded-[40px] p-3 flex items-center justify-center">
                <img src="/parcelito.png" alt="Parcelito" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-6xl md:text-8xl font-bold">{slide.word}</h1>
              <p className="text-3xl md:text-4xl opacity-90">{slide.subtitle}</p>
            </div>
          )}

          {/* SLIDE 2 - CONFUSED/PROBLEM */}
          {slide.type === 'confused' && (
            <div className="flex flex-col items-center gap-10">
              <h1 className="text-4xl md:text-6xl font-bold">{slide.title}</h1>
              <div className="text-[200px] leading-none">{slide.emoji}</div>
              <p className="text-4xl md:text-5xl font-semibold">{slide.question}</p>
            </div>
          )}

          {/* SLIDE 3 - SOLUTION */}
          {slide.type === 'solution' && (
            <div className="flex flex-col items-center gap-12">
              <h1 className="text-3xl md:text-5xl font-bold">{slide.title}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
                {slide.baskets?.map((b, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-8 text-center"
                    style={{
                      backgroundColor: i === 0 ? '#FF8533' : i === 1 ? '#FFA366' : '#FFB380'
                    }}
                  >
                    <h3 className="text-2xl font-bold mb-4">{b.name}</h3>
                    <p className="text-xl">{b.tokens}</p>
                  </div>
                ))}
              </div>
              <p className="text-2xl md:text-3xl font-medium">{slide.note}</p>
            </div>
          )}

          {/* SLIDE 4 - STEPS */}
          {slide.type === 'steps' && (
            <div className="flex flex-col items-center gap-12">
              <h1 className="text-4xl md:text-6xl font-bold">{slide.title}</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-4xl">
                {slide.steps?.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[100px] leading-none mb-4">{s.emoji}</div>
                    <p className="text-xl md:text-2xl whitespace-pre-line">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 5 - TECH STACK */}
          {slide.type === 'techstack' && (
            <div className="flex flex-col items-center gap-12">
              <h1 className="text-4xl md:text-6xl font-bold">{slide.title}</h1>
              <div className="grid grid-cols-2 gap-8 w-full max-w-3xl">
                {slide.techs?.map((t, i) => (
                  <div
                    key={i}
                    className="bg-white/10 rounded-2xl p-10 text-center"
                  >
                    <h3 className="text-3xl md:text-4xl font-bold">{t}</h3>
                  </div>
                ))}
              </div>
              <p className="text-xl md:text-2xl font-medium">{slide.tagline}</p>
            </div>
          )}

          {/* SLIDE 6 - DEMO */}
          {slide.type === 'demo' && (
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-6xl md:text-8xl font-bold">{slide.title}</h1>
            </div>
          )}

        </div>
      </div>

      {/* Navigation hint */}
      {!isPresenter && (
        <div className="absolute bottom-8 right-8 text-white/70 text-lg">
          Press ← → to navigate
        </div>
      )}

      {/* Presenter controls */}
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
    </div>
  );
}

// Main export with Suspense wrapper
export default function EthGlobalPresentation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FF6B00] flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    }>
      <PresentationContent />
    </Suspense>
  );
}
