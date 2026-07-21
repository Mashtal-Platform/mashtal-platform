import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Floating control that appears after scrolling down; scrolls window back to top. */
export function ScrollToTopButton({ threshold = 280 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-24 end-6 z-[200] flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-xl ring-2 ring-white/80 transition-all hover:bg-green-700 hover:scale-105 active:scale-95"
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
