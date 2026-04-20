'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/10 backdrop-blur-xl shadow-[0_32px_64px_rgba(255,255,255,0.06)]">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#1F2A37] uppercase font-headline flex items-center hover:opacity-80 transition">
          <span className="material-symbols-outlined text-[#1F4E79] mr-2" style={{ fontSize: '24px' }}>
            bolt
          </span>
          运维智析平台
        </Link>

        <div className="hidden md:flex items-center gap-8 font-label text-sm uppercase tracking-widest"></div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-[#FFFFFF] hover:bg-[#E9EDF3] transition-all duration-300 px-6 py-2 rounded-lg font-label font-bold text-xs uppercase tracking-wider text-[#1F4E79] border border-[#3A6A9A]/50 shadow-[0_6px_16px_rgba(31,78,121,0.18)] active:scale-95 inline-block"
          >
            登录/注册
          </Link>
        </div>
      </div>
    </nav>
  );
}
