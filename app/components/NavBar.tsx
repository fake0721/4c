'use client';

import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/88 backdrop-blur-xl border-b border-[#D7E2F0] shadow-[0_10px_30px_rgba(29,33,41,0.08)]">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#1F2A37] uppercase font-headline flex items-center hover:opacity-80 transition">
          <span className="material-symbols-outlined text-[#165DFF] mr-2" style={{ fontSize: '24px' }}>
            bolt
          </span>
          运维智析平台
        </Link>

        <div className="hidden md:flex items-center gap-8 font-label text-sm uppercase tracking-widest"></div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-[#165DFF] hover:bg-[#0E42D2] transition-all duration-300 px-6 py-2 rounded-lg font-label font-bold text-xs uppercase tracking-wider text-white border border-[#165DFF] shadow-[0_8px_18px_rgba(22,93,255,0.26)] active:scale-95 inline-block"
          >
            登录/注册
          </Link>
        </div>
      </div>
    </nav>
  );
}
