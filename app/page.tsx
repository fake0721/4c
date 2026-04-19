'use client';

import Link from 'next/link';
import AntigravityCanvas from './components/AntigravityCanvas';
import ShinyText from './components/ShinyText';
import NavBar from './components/NavBar';
import AuroraBackground from './components/AuroraBackground';

export default function Home() {
  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        backgroundColor: '#F3F5F8',
      }}
    >
      <AuroraBackground />
      <NavBar />
      <AntigravityCanvas />

      <main className="relative pt-32">
      <section className="relative z-20 max-w-5xl mx-auto px-6 text-center pb-24">
        <h1 className="font-headline font-extrabold text-[48px] md:text-[80px] leading-[1.1] tracking-tight mb-6 mt-4">
          <span className="block">
            <ShinyText speed={2} delay={0.2} pauseOnHover>
              您的愿景
            </ShinyText>
          </span>
          <ShinyText speed={2.3} delay={0.35} pauseOnHover>
            我们的数字现实
          </ShinyText>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-[#5F6B7A] font-body mb-10 leading-relaxed">
          从海量日志中挖掘价值，在复杂系统里精准排障。
          <br />
          实时监控、智能分析、可视化决策，让运维更简单，让系统更可靠。
        </p>

        <div className="mt-12 flex justify-center">
          <div className="p-[1px] rounded-full bg-gradient-to-r from-white/20 to-transparent">
            <Link
              href="/dashboard"
              className="bg-white hover:bg-white/90 text-black px-10 py-4 rounded-full font-headline font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center gap-2"
            >
              开始你的日志分析
              <span className="material-symbols-outlined text-xl">trending_flat</span>
            </Link>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}





