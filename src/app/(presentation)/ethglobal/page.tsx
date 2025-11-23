'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================
// SLIDE CONTENT - Edit your slides here
// ============================================
const slides = [
  {
    title: "Parcelito",
    subtitle: "Token baskets for everyone",
    content: "ETHGlobal Buenos Aires 2025",
    type: "title" as const,
  },
  {
    title: "The Problem",
    content: "Crypto is intimidating for newcomers. Too many tokens, too much complexity, too much risk.",
    type: "text" as const,
  },
  {
    title: "Our Solution",
    content: "Parcelitos: curated token baskets that anyone can buy, create, or gift.",
    bullets: [
      "One-click diversification",
      "Community-curated strategies",
      "Gift crypto to friends via World ID",
    ],
    type: "bullets" as const,
  },
  {
    title: "How It Works",
    content: "",
    bullets: [
      "1. Browse curated baskets or create your own",
      "2. Buy with one transaction (Uniswap)",
      "3. Each basket is an NFT (ERC-6551 TBA)",
      "4. Gift baskets to World ID verified users",
    ],
    type: "bullets" as const,
  },
  {
    title: "Tech Stack",
    content: "",
    bullets: [
      "World Chain - free gas for verified users",
      "World MiniKit - native World App integration",
      "ERC-6551 TBAs - NFTs that own tokens",
      "Uniswap - decentralized token swaps",
    ],
    type: "bullets" as const,
  },
  {
    title: "Demo",
    subtitle: "Let's see it in action",
    content: "",
    type: "title" as const,
  },
  {
    title: "Thank You!",
    subtitle: "Questions?",
    content: "github.com/anthropics/parcelito",
    type: "title" as const,
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
          {slide.type === 'title' && (
            <div className="space-y-6">
              <h1 className="text-5xl md:text-8xl font-bold">{slide.title}</h1>
              {slide.subtitle && (
                <p className="text-2xl md:text-4xl opacity-90">{slide.subtitle}</p>
              )}
              {slide.content && (
                <p className="text-xl md:text-2xl opacity-70 mt-8">{slide.content}</p>
              )}
            </div>
          )}

          {slide.type === 'text' && (
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold">{slide.title}</h2>
              <p className="text-xl md:text-3xl opacity-90 leading-relaxed">{slide.content}</p>
            </div>
          )}

          {slide.type === 'bullets' && (
            <div className="space-y-8 text-left max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-center">{slide.title}</h2>
              <ul className="space-y-4">
                {slide.bullets?.map((bullet, i) => (
                  <li key={i} className="text-xl md:text-2xl flex items-start gap-4">
                    <span className="text-orange-200">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
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
