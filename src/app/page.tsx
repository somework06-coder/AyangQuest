import Link from 'next/link';
import { ScrollText, Sword, Gift } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--neo-yellow)] flex flex-col font-sans overflow-hidden relative">

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Marquee Top */}
      <div className="bg-black text-white py-2 overflow-hidden border-b-4 border-black z-10">
        <div className="whitespace-nowrap animate-marquee flex gap-8 font-bold uppercase tracking-widest text-sm sm:text-base">
          <span>❤️ Bikin Baper Pasanganmu</span>
          <span>🎮 Game RPG Simpel</span>
          <span>✨ 100% Gratis</span>
          <span>🚫 No Coding Required</span>
          <span>❤️ Bikin Baper Pasanganmu</span>
          <span>🎮 Game RPG Simpel</span>
          <span>✨ 100% Gratis</span>
          <span>🚫 No Coding Required</span>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-4xl mx-auto">
        <div className="text-center w-full space-y-12 mt-10 sm:mt-0">

          {/* Hero Section */}
          <div className="relative inline-block group">
            {/* Abstract Shapes behind */}
            <div className="absolute -top-6 -left-6 w-20 h-20 bg-white border-4 border-black rounded-full animate-bounce-soft opacity-100 z-0"></div>
            <div className="absolute -bottom-4 -right-8 w-full h-full bg-[var(--neo-pink)] border-4 border-black -z-10 translate-x-2 translate-y-2 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>

            <div className="relative z-10 bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_#000]">
              <h1 className="text-5xl sm:text-7xl font-black text-black leading-none tracking-tighter">
                AYANG<br />
                <span className="text-[var(--neo-pink)] text-outline text-white">QUEST</span>
              </h1>
              <p className="mt-4 font-bold text-lg sm:text-xl bg-black text-white inline-block px-3 py-1 -rotate-1">
                Game Cinta No. #1
              </p>
            </div>
          </div>

          {/* Description Box */}
          <div className="max-w-xl mx-auto bg-white border-4 border-black p-6 shadow-[6px_6px_0px_#000] text-lg font-medium relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-[var(--neo-pink)]"></div>
            <p>
              Tantang ayangmu jawab <span className="font-black bg-yellow-300 px-1 border-2 border-black">5 pertanyaan</span> buat dapetin hadiah spesial!
              <br />
              <span className="text-sm text-gray-500 font-bold mt-2 block">(Dijamin makin sayang 100%)</span>
            </p>
          </div>

          {/* Features Grid - Neater */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] hover:-translate-y-1 transition-transform flex flex-col items-center">
              <ScrollText size={48} strokeWidth={2.5} className="mb-2" />
              <h3 className="font-black text-lg">BIKIN SOAL</h3>
              <p className="text-sm font-bold text-gray-500">Tes seberapa kenal dia sama kamu</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] hover:-translate-y-1 transition-transform flex flex-col items-center">
              <Sword size={48} strokeWidth={2.5} className="mb-2" />
              <h3 className="font-black text-lg">PILIH AVATAR</h3>
              <p className="text-sm font-bold text-gray-500">Karakter lucu buat kalian berdua</p>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] hover:-translate-y-1 transition-transform flex flex-col items-center">
              <Gift size={48} strokeWidth={2.5} className="mb-2" />
              <h3 className="font-black text-lg">KASIH HADIAH</h3>
              <p className="text-sm font-bold text-gray-500">Reward spesial kalau dia menang</p>
            </div>
          </div>

          {/* CTA Button - EYE CATCHING */}
          <div className="pt-6 mb-20 animate-pulse-glow">
            <Link href="/create" className="relative group inline-block">
              <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 rounded-xl group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
              <div className="relative bg-[var(--neo-pink)] border-4 border-black text-white px-8 py-4 rounded-xl text-2xl sm:text-3xl font-black uppercase tracking-wider flex items-center gap-3 hover:-translate-y-1 transition-transform">
                <span>🚀 GAS BIKIN GAME!</span>
              </div>
            </Link>
            <div className="mt-6">
              <span className="bg-white border-2 border-black px-3 py-1 rounded-full text-xs font-bold shadow-[2px_2px_0px_#000]">
                🔥 1.250+ Pasangan udah cobain
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 font-bold text-sm border-t-4 border-black bg-white relative z-10">
        DIBUAT DENGAN ☕ & 💻 OLEH <span className="bg-black text-white px-2">althur.somework.</span>
      </footer>

    </div>
  );
}
