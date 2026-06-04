"use client";
import { useState, useEffect } from "react";
import { useAppKit } from "@reown/appkit/react";
import { ArrowRight, Shield, MapPin, Clock, Users, CheckCircle2, Star, Zap } from "lucide-react";

const LINES = [
  { l1:"Earn G$",         l2:"doing real tasks.",  l2Color:"var(--brown-500)" },
  { l1:"Get paid for",    l2:"verified work.",     l2Color:"var(--brown-400)" },
  { l1:"Real humans.",    l2:"Real rewards.",      l2Color:"var(--gold)"      },
  { l1:"Complete tasks,", l2:"earn instantly.",    l2Color:"var(--brown-500)" },
];

const META = [
  { icon:<MapPin  className="w-[11px] h-[11px]" />, v:"Lagos, NG"   },
  { icon:<Clock   className="w-[11px] h-[11px]" />, v:"2 days left" },
  { icon:<Users   className="w-[11px] h-[11px]" />, v:"3 spots"     },
];

const STREAK_DOTS = [1,1,1,1,1,1,1,0];

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

  return (
    <section className="relative overflow-hidden flex items-center min-h-screen pt-20 pb-10">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:"radial-gradient(ellipse 55% 65% at 25% 55%,rgba(168,101,42,0.07) 0%,transparent 65%)" }} />

      <div className="section-container w-full">
        <div className="hero-layout">

          {/* ── LEFT ── */}
          <div className="hero-left">

            {/* Verified badge */}
            <div className="mb-5" style={{ animation:"vk-up 0.5s ease both" }}>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.72rem] font-bold border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-muted)]"
                style={{ fontFamily:"var(--font-roboto)" }}>
                <Shield className="w-[11px] h-[11px] text-[var(--success)]" />
                Face-verified humans only
              </span>
            </div>

            {/* Rotating headline */}
            <h1
              className="font-bold mb-5"
              style={{
                fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif",
                fontSize:"clamp(2.8rem,6vw,5.5rem)",
                lineHeight:1.02, letterSpacing:"-0.03em",
                animation:"vk-up 0.5s ease 0.1s both",
              }}
            >
              <span
                className="block text-[var(--text-heading)] transition-all duration-300"
                style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(10px)" }}
              >{h.l1}</span>
              <span
                className="block transition-all duration-300"
                style={{ opacity:vis?1:0, transform:vis?"translateY(0)":"translateY(10px)", transitionDelay:"0.06s", color:h.l2Color }}
              >{h.l2}</span>
            </h1>

            {/* Subtext */}
            <p
              className="leading-relaxed text-[var(--text-muted)] max-w-[420px] mb-8"
              style={{
                fontFamily:"var(--font-roboto)",
                fontSize:"clamp(0.92rem,1.6vw,1.05rem)",
                animation:"vk-up 0.5s ease 0.2s both",
              }}
            >
              Complete verified micro-tasks and get paid in G$ directly to your MiniPay wallet. No bank account needed.
            </p>

            {/* CTAs */}
            <div className="flex gap-3 flex-wrap" style={{ animation:"vk-up 0.5s ease 0.3s both" }}>
              <button
                onClick={() => open()}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[0.95rem] font-bold border-none cursor-pointer bg-[var(--brown-500)] text-[var(--cream-100)] transition-all duration-200 hover:bg-[var(--brown-400)] hover:-translate-y-0.5"
                style={{ fontFamily:"var(--font-nunito),sans-serif", boxShadow:"0 4px 18px rgba(168,101,42,0.32)" }}
              >
                Start Earning <ArrowRight className="w-[17px] h-[17px]" />
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-[0.9rem] font-semibold border border-[var(--border)] text-[var(--text-secondary)] no-underline transition-all duration-200 hover:border-[var(--brown-400)] hover:text-[var(--brown-500)]"
                style={{ fontFamily:"var(--font-nunito),sans-serif" }}
              >
                How it works
              </a>
            </div>
          </div>

          {/* ── RIGHT — desktop overlapping cards ── */}
          <div className="hero-right">
            {/* Glow */}
            <div className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background:"radial-gradient(circle at 60% 50%,rgba(168,101,42,0.1) 0%,transparent 65%)", filter:"blur(40px)" }} />

            {/* Live badge */}
            <div className="absolute top-[2%] right-[2%] z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)]"
              style={{ boxShadow:"0 3px 12px rgba(45,26,10,0.07)", animation:"vk-float 5s ease-in-out 0.3s infinite" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] inline-block shrink-0" />
              <span className="text-[0.68rem] font-bold text-[var(--text-muted)] whitespace-nowrap" style={{ fontFamily:"var(--font-roboto)" }}>
                Live on Celo
              </span>
            </div>

            {/* Badge card — top left */}
            <div
              className="absolute top-[2%] left-[2%] z-[4] w-[210px] rounded-[18px] p-4 bg-[var(--bg-card)] border border-[var(--border)]"
              style={{ boxShadow:"0 10px 32px rgba(45,26,10,0.12)", transform:"rotate(-5deg)", animation:"vk-float-slow 7s ease-in-out 0.6s infinite" }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background:"rgba(201,162,39,0.14)" }}>
                  <Star className="w-[17px] h-[17px]" style={{ color:"var(--gold)" }} />
                </div>
                <div>
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] mb-0.5"
                    style={{ fontFamily:"var(--font-roboto)" }}>Badge Earned</p>
                  <p className="text-[0.88rem] font-bold text-[var(--text-heading)]"
                    style={{ fontFamily:"var(--font-telegraf)" }}>Trusted Worker</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[9px] px-3 py-1.5 border"
                style={{ background:"rgba(201,162,39,0.1)", borderColor:"rgba(201,162,39,0.2)" }}>
                <span className="text-[0.72rem] font-semibold" style={{ color:"var(--gold)", fontFamily:"var(--font-roboto)" }}>
                  +25 G$ earned
                </span>
                <CheckCircle2 className="w-[13px] h-[13px]" style={{ color:"var(--gold)" }} />
              </div>
            </div>

            {/* Streak card — bottom left */}
            <div
              className="absolute bottom-[5%] left-[5%] z-[4] w-[185px] rounded-[18px] p-4 bg-[var(--bg-card)] border border-[var(--border)]"
              style={{ boxShadow:"0 10px 32px rgba(45,26,10,0.12)", transform:"rotate(3deg)", animation:"vk-float 8s ease-in-out 1.2s infinite" }}
            >
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.09em] text-[var(--text-muted)] mb-2"
                style={{ fontFamily:"var(--font-roboto)" }}>🔥 Earning Streak</p>
              <p className="font-bold leading-none mb-1" style={{ fontFamily:"var(--font-telegraf)", fontSize:"2rem", color:"var(--brown-500)" }}>12</p>
              <p className="text-[0.72rem] text-[var(--text-muted)] mb-2.5" style={{ fontFamily:"var(--font-roboto)" }}>days · keep it up!</p>
              <div className="flex gap-1">
                {STREAK_DOTS.map((v,i) => (
                  <div key={i} className="flex-1 h-[5px] rounded-full"
                    style={{ background: v ? "var(--brown-400)" : "var(--border)" }} />
                ))}
              </div>
            </div>

            {/* Main task card — bottom right */}
            <div
              className="absolute bottom-0 right-0 z-[3] rounded-[20px] overflow-hidden border border-[var(--border)]"
              style={{ width:"min(340px,90%)", boxShadow:"0 24px 64px rgba(45,26,10,0.22)", animation:"vk-float 6s ease-in-out infinite" }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-[18px] py-3.5 bg-[var(--brown-500)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center"
                    style={{ background:"rgba(255,255,255,0.18)" }}>
                    <Zap className="w-[15px] h-[15px] text-white" />
                  </div>
                  <span className="text-white font-bold text-[0.95rem]" style={{ fontFamily:"var(--font-telegraf)" }}>
                    Active Task
                  </span>
                </div>
                <span className="text-[0.75rem]" style={{ color:"rgba(255,255,255,0.75)", fontFamily:"var(--font-roboto)" }}>
                  2d left
                </span>
              </div>
              {/* Card body */}
              <div className="px-5 pt-[18px] pb-5 bg-[var(--bg-card)]">
                <div className="flex items-start justify-between gap-3.5 mb-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.67rem] text-[var(--text-muted)] mb-1.5" style={{ fontFamily:"var(--font-roboto)" }}>
                      📸 Photo Verification
                    </p>
                    <p className="font-bold text-[1.05rem] text-[var(--text-heading)] leading-snug"
                      style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
                      Photograph First Bank Branch — Broad Street Lagos
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold leading-none text-[var(--brown-500)]"
                      style={{ fontFamily:"var(--font-telegraf)", fontSize:"2.2rem" }}>25</p>
                    <p className="text-[0.62rem] text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
                      G$ / worker
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[0.65rem] text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
                      Workers joined
                    </span>
                    <span className="text-[0.65rem] font-bold text-[var(--brown-500)]" style={{ fontFamily:"var(--font-roboto)" }}>
                      7 / 10
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
                    <div className="h-full w-[70%] rounded-full"
                      style={{ background:"linear-gradient(90deg,var(--brown-500),var(--brown-300))" }} />
                  </div>
                </div>
                {/* Meta row */}
                <div className="flex gap-3.5 mb-4">
                  {META.map(m => (
                    <span key={m.v} className="flex items-center gap-1 text-[0.68rem] text-[var(--text-muted)]"
                      style={{ fontFamily:"var(--font-roboto)" }}>
                      {m.icon}{m.v}
                    </span>
                  ))}
                </div>
                {/* CTA */}
                <div
                  className="rounded-xl py-2.5 text-center bg-[var(--brown-500)] cursor-pointer transition-colors duration-200 hover:bg-[var(--brown-400)]"
                >
                  <span className="text-[var(--cream-100)] text-[0.85rem] font-bold" style={{ fontFamily:"var(--font-nunito)" }}>
                    View &amp; Join
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile scroll row ── */}
      <div className="hero-mobile">
        <div className="hero-mobile-scroll">
          {/* Main card mobile */}
          <div className="shrink-0 rounded-[18px] overflow-hidden border border-[var(--border)]"
            style={{ width:"clamp(260px,82vw,320px)", boxShadow:"0 10px 32px rgba(45,26,10,0.13)" }}>
            <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--brown-500)]">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold text-[0.85rem]" style={{ fontFamily:"var(--font-telegraf)" }}>Active Task</span>
              </div>
              <span className="text-[0.7rem]" style={{ color:"rgba(255,255,255,0.75)" }}>2d left</span>
            </div>
            <div className="px-4 pt-3.5 pb-4 bg-[var(--bg-card)]">
              <p className="text-[0.62rem] text-[var(--text-muted)] mb-1">📸 Photo Verification</p>
              <div className="flex items-start justify-between gap-2.5 mb-2.5">
                <p className="flex-1 font-bold text-[0.9rem] text-[var(--text-heading)] leading-snug"
                  style={{ fontFamily:"var(--font-telegraf)" }}>
                  Photograph First Bank Branch — Broad Street Lagos
                </p>
                <div className="text-right shrink-0">
                  <p className="font-bold leading-none text-[var(--brown-500)]"
                    style={{ fontFamily:"var(--font-telegraf)", fontSize:"1.6rem" }}>25</p>
                  <p className="text-[0.58rem] text-[var(--text-muted)]">G$</p>
                </div>
              </div>
              <div className="h-[5px] rounded-full mb-2 bg-[var(--border)]">
                <div className="h-full w-[70%] rounded-full bg-[var(--brown-400)]" />
              </div>
              <p className="text-[0.62rem] text-[var(--text-muted)]">7 / 10 workers joined · 3 spots left</p>
            </div>
          </div>

          {/* Badge card mobile */}
          <div className="shrink-0 rounded-2xl p-3.5 bg-[var(--bg-card)] border border-[var(--border)]"
            style={{ width:"clamp(190px,58vw,220px)", boxShadow:"0 8px 24px rgba(45,26,10,0.1)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
                style={{ background:"rgba(201,162,39,0.14)" }}>
                <Star className="w-4 h-4" style={{ color:"var(--gold)" }} />
              </div>
              <div>
                <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Badge Earned</p>
                <p className="text-[0.82rem] font-bold text-[var(--text-heading)]" style={{ fontFamily:"var(--font-telegraf)" }}>
                  Trusted Worker
                </p>
              </div>
            </div>
            <div className="flex justify-between rounded-lg px-2.5 py-1.5" style={{ background:"rgba(201,162,39,0.1)" }}>
              <span className="text-[0.65rem] font-semibold" style={{ color:"var(--gold)" }}>+25 G$ earned</span>
              <CheckCircle2 className="w-3 h-3" style={{ color:"var(--gold)" }} />
            </div>
          </div>

          {/* Streak card mobile */}
          <div className="shrink-0 rounded-2xl p-3.5 bg-[var(--bg-card)] border border-[var(--border)]"
            style={{ width:"clamp(160px,50vw,195px)", boxShadow:"0 8px 24px rgba(45,26,10,0.1)" }}>
            <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-1.5">🔥 Earning Streak</p>
            <p className="font-bold leading-none mb-0.5 text-[var(--brown-500)]"
              style={{ fontFamily:"var(--font-telegraf)", fontSize:"1.8rem" }}>12</p>
            <p className="text-[0.68rem] text-[var(--text-muted)] mb-2.5">days · keep it up!</p>
            <div className="flex gap-1">
              {STREAK_DOTS.map((v,i) => (
                <div key={i} className="flex-1 h-1 rounded-full"
                  style={{ background: v ? "var(--brown-400)" : "var(--border)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vk-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes vk-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes vk-float-slow{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-9px) rotate(-4deg)}}

        .hero-layout{display:grid;grid-template-columns:1fr;gap:32px;align-items:center}
        .hero-right{display:none}
        .hero-mobile{width:100%;padding:0 0 24px}
        .hero-mobile-scroll{display:flex;gap:14px;overflow-x:auto;padding:8px 0 12px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
        .hero-mobile-scroll::-webkit-scrollbar{display:none}

        @media(min-width:900px){
          .hero-layout{grid-template-columns:1fr 1fr;gap:clamp(40px,6vw,80px)}
          .hero-right{display:block;position:relative;height:520px;overflow:visible}
          .hero-mobile{display:none}
        }
      `}</style>
    </section>
  );
}