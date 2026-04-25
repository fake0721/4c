'use client';

import { useEffect, useRef } from 'react';

interface ShinyTextProps {
  children: React.ReactNode;
  speed?: number;
  delay?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

export default function ShinyText({
  children,
  speed = 2,
  delay = 0,
  direction = 'left',
  pauseOnHover = false,
  className = '',
}: ShinyTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let elapsed = 0;
    let last: number | null = null;
    let paused = false;
    const animationDuration = speed * 1000;
    const delayDuration = delay * 1000;
    const dir = direction === 'right' ? -1 : 1;

    const handleMouseEnter = () => { paused = true; last = null; };
    const handleMouseLeave = () => { paused = false; last = null; };

    if (pauseOnHover) {
      node.addEventListener('mouseenter', handleMouseEnter);
      node.addEventListener('mouseleave', handleMouseLeave);
    }

    function updateBackground(progress: number) {
      const bgPos = 150 - progress * 2;
      node!.style.backgroundPosition = `${bgPos}% center`;
    }

    function tick(time: number) {
      if (paused) {
        requestAnimationFrame(tick);
        return;
      }

      if (last === null) {
        last = time;
        requestAnimationFrame(tick);
        return;
      }

      elapsed += time - last;
      last = time;

      const cycleDuration = animationDuration + delayDuration;
      const cycleTime = elapsed % cycleDuration;
      let progress = 0;

      if (cycleTime < animationDuration) {
        const p = (cycleTime / animationDuration) * 100;
        progress = dir === 1 ? p : 100 - p;
      } else {
        progress = dir === 1 ? 100 : 0;
      }

      updateBackground(progress);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    return () => {
      if (pauseOnHover) {
        node.removeEventListener('mouseenter', handleMouseEnter);
        node.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [speed, delay, direction, pauseOnHover]);

  return (
    <span
      ref={ref}
      className={`shiny-text ${className}`}
      style={{
        backgroundImage: `linear-gradient(
          120deg,
          #1D2129 0%,
          #1D2129 34%,
          #69B1FF 49%,
          #FF7D00 54%,
          #1D2129 68%,
          #1D2129 100%
        )`,
        backgroundSize: '200% auto',
        backgroundPosition: '150% center',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        display: 'inline-block',
        willChange: 'background-position',
      }}
    >
      {children}
    </span>
  );
}
