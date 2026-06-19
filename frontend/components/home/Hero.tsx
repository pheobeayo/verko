"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAppKit } from "@reown/appkit/react";
import { ArrowRight, Shield } from "lucide-react";

const LINES = [
  { l1: "Earn G$",         l2: "doing real tasks.",  c: "var(--brown-500)" },
  { l1: "Get paid for",    l2: "verified work.",     c: "var(--brown-400)" },
  { l1: "Real humans.",    l2: "Real rewards.",      c: "#c9a227"          },
  { l1: "Complete tasks,", l2: "earn instantly.",    c: "var(--brown-500)" },
];


const HERO_IMAGES = [
  "/heroImage.png",
  "/heroImageThree.png",
];

export default function Hero() {
  const { open } = useAppKit();
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(i => (i + 1) % LINES.length); setVis(true); }, 300);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const h = LINES[idx];
 
  const heroImage = HERO_IMAGES[idx % HERO_IMAGES.length];

  return (
    <section className="relative overflow-hidden flex items-center min-h-[100svh] pt-20 pb-10">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 55% 65% at 25% 55%,rgba(168,101,42,0.07) 0%,transparent 65%)" }} />

      <div className="section-container w-full px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="hero-grid">

          {/* LEFT */}
          <div className="hero-left">
            <div className="mb-5" style={{ animation: "vk-up 0.5s ease both" }}>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.72rem] font-bold border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)]"
                style={{ fontFamily: "var(--font-roboto)" }}>
                <Shield className="w-[11px] h-[11px] text-[var(--success)]" />
                Face-verified humans only
              </span>
            </div>

            <h1 className="font-bold mb-5"
              style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif", fontSize: "clamp(2.6rem,5.5vw,5.2rem)", lineHeight: 1.02, letterSpacing: "-0.03em", animation: "vk-up 0.5s ease 0.1s both" }}>
              <span className="block text-[var(--text-heading)] transition-all duration-300"
                style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)" }}>
                {h.l1}
              </span>
              <span className="block transition-all duration-300"
                style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(10px)", transitionDelay: "0.06s", color: h.c }}>
                {h.l2}
              </span>
            </h1>

            <p className="leading-relaxed text-[var(--text-muted)] max-w-[420px] mb-8"
              style={{ fontFamily: "var(--font-roboto)", fontSize: "clamp(0.92rem,1.6vw,1.05rem)", animation: "vk-up 0.5s ease 0.2s both" }}>
              Complete verified micro-tasks and get paid in G$ directly to your MiniPay wallet. No bank account needed.
            </p>

            <div className="flex gap-3 flex-wrap" style={{ animation: "vk-up 0.5s ease 0.3s both" }}>
              <button onClick={() => open()}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[0.95rem] font-bold cursor-pointer border-0 bg-[var(--brown-500)] text-[var(--cream-100)] transition-all duration-200 hover:bg-[var(--brown-400)] hover:-translate-y-0.5"
                style={{ fontFamily: "var(--font-nunito),sans-serif", boxShadow: "0 4px 18px rgba(168,101,42,0.32)" }}>
                Start Earning <ArrowRight className="w-[17px] h-[17px]" />
              </button>
              <a href="#how-it-works"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-[0.9rem] font-semibold border border-[var(--border)] text-[var(--text-secondary)] no-underline transition-all duration-200 hover:border-[var(--brown-400)] hover:text-[var(--brown-500)]"
                style={{ fontFamily: "var(--font-nunito),sans-serif" }}>
                How it works
              </a>
            </div>

            <div className="flex gap-6 mt-10 flex-wrap" style={{ animation: "vk-up 0.5s ease 0.4s both" }}>
              {[
                { n: "500K+", l: "GoodDollar users" },
                { n: "G$",    l: "instant payouts"  },
                { n: "0",     l: "bank account needed" },
              ].map(s => (
                <div key={s.l}>
                  <p className="font-bold leading-none text-[var(--text-heading)]"
                    style={{ fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif", fontSize: "1.5rem" }}>{s.n}</p>
                  <p className="text-[0.72rem] text-[var(--text-muted)] mt-0.5"
                    style={{ fontFamily: "var(--font-roboto)" }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: rotating hero image */}
          <div className="hero-right" aria-hidden="true">
            <HeroImageStack src={heroImage} />
          </div>
        </div>

        {/* Mobile hero image */}
        <div className="hero-mobile-row" aria-hidden="true">
          <HeroImageStack src={heroImage} mobile />
        </div>
      </div>

      <style>{`
        @keyframes vk-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .hero-grid{display:grid;grid-template-columns:1fr;gap:24px;align-items:center}
        .hero-right{display:none}
        .hero-mobile-row{width:100%;padding:16px 0 8px}
        @media(min-width:860px){
          .hero-grid{grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px)}
          .hero-right{display:flex;align-items:center;justify-content:center}
          .hero-mobile-row{display:none}
        }
      `}</style>
    </section>
  );
}


function HeroImageStack({ src, mobile = false }: { src: string; mobile?: boolean }) {
  return (
    <div
      className="relative w-full"
      style={{
        maxWidth: mobile ? 480 : 540,
        aspectRatio: "1 / 1",
      }}
    >
      <Image
        key={src}
        src={src}
        alt="Verko — verified micro-task marketplace"
        fill
        priority
        sizes={mobile ? "(max-width: 860px) 90vw" : "(min-width: 860px) 45vw"}
        style={{
          objectFit: "contain",
          animation: "vk-fade 0.5s ease both",
        }}
      />
      <style>{`
        @keyframes vk-fade { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}