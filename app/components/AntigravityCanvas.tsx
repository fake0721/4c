'use client';

import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  z: number;
  cx: number;
  cy: number;
  t: number;
  speed: number;
  radiusOffset: number;
  colorIndex: number;
};

export default function AntigravityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = {
      count: 1200,
      magnetRadius: 140,
      ringRadius: 112,
      waveSpeed: 0.018,
      waveAmplitude: 10,
      lerpSpeed: 0.08,
      particleSize: 5.5,
      pulseSpeed: 0.08,
      autoAnimate: true,
    };

    const colors = ['rgba(0,0,0,1)', 'rgba(15,15,15,1)', 'rgba(30,30,30,1)'];
    const particles: Particle[] = [];
    const pointer = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.58 };
    const smoothPointer = { x: pointer.x, y: pointer.y };
    const lastPointer = { x: pointer.x, y: pointer.y, t: performance.now() };
    let animationId = 0;

    function random(min: number, max: number) {
      return min + Math.random() * (max - min);
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < config.count; i++) {
        const x = random(0, canvas!.width);
        const y = random(0, canvas!.height);
        particles.push({
          x,
          y,
          z: random(-120, 120),
          cx: x,
          cy: y,
          t: random(0, 100),
          speed: random(0.008, 0.02),
          radiusOffset: random(-10, 10),
          colorIndex: i % colors.length,
        });
      }
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(window.innerWidth * dpr);
      canvas!.height = Math.floor(window.innerHeight * dpr);
      canvas!.style.width = window.innerWidth + 'px';
      canvas!.style.height = window.innerHeight + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function onPointerMove(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      lastPointer.t = performance.now();
    }

    function draw(now: number) {
      const idleMs = now - lastPointer.t;
      if (config.autoAnimate && idleMs > 1800) {
        const t = now * 0.001;
        pointer.x = window.innerWidth * 0.5 + Math.sin(t * 0.8) * (window.innerWidth * 0.18);
        pointer.y = window.innerHeight * 0.58 + Math.cos(t * 1.1) * (window.innerHeight * 0.1);
      }

      smoothPointer.x += (pointer.x - smoothPointer.x) * 0.06;
      smoothPointer.y += (pointer.y - smoothPointer.y) * 0.06;

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.t += p.speed;

        const projection = 1 - p.z / 420;
        const tx = smoothPointer.x * projection;
        const ty = smoothPointer.y * projection;
        const dx = p.x - tx;
        const dy = p.y - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = p.x;
        let targetY = p.y;

        if (dist < config.magnetRadius) {
          const angle = Math.atan2(dy, dx);
          const wave = Math.sin(p.t / config.waveSpeed + angle) * config.waveAmplitude;
          const currentRing = config.ringRadius + wave + p.radiusOffset;
          targetX = tx + currentRing * Math.cos(angle);
          targetY = ty + currentRing * Math.sin(angle);
        }

        p.cx += (targetX - p.cx) * config.lerpSpeed;
        p.cy += (targetY - p.cy) * config.lerpSpeed;

        const ringDist = Math.abs(
          Math.sqrt((p.cx - tx) * (p.cx - tx) + (p.cy - ty) * (p.cy - ty)) - config.ringRadius
        );
        const nearRing = Math.max(0, 1 - ringDist / 60);
        const pulse = 0.8 + Math.sin(now * 0.001 * (3 + p.speed * 50) + p.t * config.pulseSpeed) * 0.3;
        const baseSize = Math.max(0.8, config.particleSize * nearRing * pulse * 0.6 + 0.6);

        ctx!.beginPath();
        ctx!.fillStyle = colors[p.colorIndex];
        ctx!.arc(p.cx, p.cy, baseSize, 0, Math.PI * 2);
        ctx!.fill();
      }

      animationId = requestAnimationFrame(draw);
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[2] pointer-events-none"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
