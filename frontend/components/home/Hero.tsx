"use client";
import { useState, useEffect } from "react";
import { useAppKit } from "@reown/appkit/react";
import { ArrowRight, Shield } from "lucide-react";

const LINES = [
  { l1: "Earn G$",         l2: "doing real tasks.",  c: "var(--brown-500)" },
  { l1: "Get paid for",    l2: "verified work.",     c: "var(--brown-400)" },
  { l1: "Real humans.",    l2: "Real rewards.",      c: "#c9a227"          },
  { l1: "Complete tasks,", l2: "earn instantly.",    c: "var(--brown-500)" },
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

          {/* RIGHT: SVG illustration */}
          <div className="hero-right" aria-hidden="true">
            <VerkoIllustration />
          </div>
        </div>

        {/* Mobile illustration */}
        <div className="hero-mobile-row" aria-hidden="true">
          <VerkoIllustrationMobile />
        </div>
      </div>

      <style>{`
        @keyframes vk-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .hero-grid{display:grid;grid-template-columns:1fr;gap:24px;align-items:center}
        .hero-right{display:none}
        .hero-mobile-row{width:100%;padding:16px 0 8px;overflow-x:auto}
        @media(min-width:860px){
          .hero-grid{grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px)}
          .hero-right{display:flex;align-items:center;justify-content:center}
          .hero-mobile-row{display:none}
        }
      `}</style>
    </section>
  );
}

function VerkoIllustration() {
  return (
    <svg viewBox="0 0 540 560" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 540 }}>
      <defs>
        <marker id="varr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <style>{`
          @keyframes vflow{0%{stroke-dashoffset:18}100%{stroke-dashoffset:0}}
          @keyframes vpulse{0%,100%{opacity:1}50%{opacity:0.25}}
          @keyframes vbob1{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
          @keyframes vbob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
          .vfl{animation:vflow 1.5s linear infinite}
          .vp{animation:vpulse 2.2s ease-in-out infinite}
          .vb1{animation:vbob1 4.5s ease-in-out infinite}
          .vb2{animation:vbob2 5.5s ease-in-out 0.7s infinite}
          .vb3{animation:vbob2 5s ease-in-out 1.4s infinite}
          .vb4{animation:vbob1 4.8s ease-in-out 2s infinite}
        `}</style>
      </defs>

      <circle cx="270" cy="275" r="215" stroke="#e8d5bf" strokeWidth="0.5" strokeDasharray="7 5" opacity="0.5"/>
      <circle cx="270" cy="275" r="158" stroke="#e8d5bf" strokeWidth="0.5" opacity="0.35"/>

      {/* Center worker */}
      <g className="vb1" style={{ transformOrigin: "270px 275px" }}>
        <circle cx="270" cy="275" r="72" fill="#fdf6f0" stroke="#c47a3a" strokeWidth="1.5"/>
        <ellipse cx="270" cy="249" rx="22" ry="13" fill="#4a240b"/>
        <rect x="247" y="249" width="46" height="9" fill="#4a240b"/>
        <ellipse cx="270" cy="268" rx="22" ry="24" fill="#f5e6d8"/>
        <circle cx="261" cy="265" r="3.5" fill="#2d1508"/>
        <circle cx="279" cy="265" r="3.5" fill="#2d1508"/>
        <circle cx="262.5" cy="264" r="1.2" fill="white"/>
        <circle cx="280.5" cy="264" r="1.2" fill="white"/>
        <path d="M262 275 Q270 282 278 275" stroke="#8b4513" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <rect x="264" y="289" width="12" height="8" rx="3" fill="#f5e6d8"/>
        <path d="M236 312 Q253 300 270 300 Q287 300 304 312" stroke="#6b3410" strokeWidth="9" strokeLinecap="round" fill="none"/>
        <rect x="283" y="292" width="20" height="30" rx="4" fill="#2d1508" stroke="#c47a3a" strokeWidth="1"/>
        <rect x="286" y="296" width="14" height="19" rx="2" fill="#fdf6f0"/>
        <circle cx="293" cy="304" r="4.5" fill="none" stroke="#8b4513" strokeWidth="1.5"/>
        <circle cx="293" cy="304" r="1.8" fill="#8b4513"/>
        <rect x="289" y="310" width="8" height="2.5" rx="1.2" fill="#c47a3a"/>
        <circle cx="270" cy="210" r="14" fill="#4a7c59" stroke="white" strokeWidth="2"/>
        <path d="M264 210 L268 214 L277 205" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="270" cy="210" r="20" fill="none" stroke="#4a7c59" strokeWidth="1" className="vp"/>
      </g>

      {/* Animated flow lines */}
      <path d="M152 145 Q188 185 210 230" fill="none" stroke="#4a7c59" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#varr)" className="vfl"/>
      <path d="M390 130 Q360 180 330 228" fill="none" stroke="#8b4513" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#varr)" className="vfl" style={{ animationDelay: "0.4s" }}/>
      <path d="M316 316 Q358 355 386 385" fill="none" stroke="#4a7c59" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#varr)" className="vfl" style={{ animationDelay: "0.8s" }}/>
      <path d="M226 318 Q190 358 168 388" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#varr)" className="vfl" style={{ animationDelay: "1.2s" }}/>

      {/* GD identity card */}
      <g className="vb2">
        <rect x="26" y="72" width="188" height="108" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
        <rect x="26" y="72" width="188" height="34" rx="12" fill="#2d1508"/>
        <rect x="26" y="94" width="188" height="12" fill="#2d1508"/>
        <text x="120" y="94" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="sans-serif">GoodDollar identity</text>
        <circle cx="58" cy="132" r="11" fill="#4a7c59" opacity="0.15"/>
        <circle cx="58" cy="132" r="6.5" fill="#4a7c59"/>
        <path d="M55 132 L57.5 134.5 L62 129" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <text x="76" y="127" fontSize="12" fontWeight="600" fill="#2d1508" fontFamily="sans-serif">Verified human</text>
        <text x="76" y="141" fontSize="10" fill="#8b7355" fontFamily="sans-serif">0xff39…76DC</text>
        <rect x="158" y="149" width="42" height="16" rx="7" fill="#fdf6f0" stroke="#c47a3a" strokeWidth="0.5"/>
        <text x="179" y="161" textAnchor="middle" fontSize="10" fill="#8b4513" fontFamily="sans-serif" fontWeight="600">Celo ✓</text>
      </g>

      {/* Task card */}
      <g className="vb2" style={{ animationDelay: "0.5s" }}>
        <rect x="326" y="58" width="194" height="118" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
        <rect x="326" y="58" width="194" height="34" rx="12" fill="#8b4513"/>
        <rect x="326" y="80" width="194" height="12" fill="#8b4513"/>
        <text x="398" y="80" fontSize="11" fontWeight="700" fill="white" fontFamily="sans-serif">📸  Photo task</text>
        <text x="508" y="80" fontSize="10" fill="rgba(255,255,255,0.7)" fontFamily="sans-serif">2d left</text>
        <text x="342" y="108" fontSize="12" fontWeight="600" fill="#2d1508" fontFamily="sans-serif">Verify First Bank</text>
        <text x="342" y="122" fontSize="10" fill="#8b7355" fontFamily="sans-serif">Lagos, Broad Street</text>
        <rect x="342" y="128" width="58" height="17" rx="7" fill="#fdf6f0" stroke="#c47a3a" strokeWidth="0.5"/>
        <text x="371" y="140" textAnchor="middle" fontSize="11" fontWeight="700" fill="#8b4513" fontFamily="sans-serif">25 G$</text>
        <rect x="408" y="128" width="96" height="17" rx="7" fill="#e8f5ed" stroke="#4a7c59" strokeWidth="0.5"/>
        <text x="456" y="140" textAnchor="middle" fontSize="10" fill="#4a7c59" fontFamily="sans-serif">7 / 10 joined</text>
        <rect x="342" y="154" width="162" height="5" rx="2.5" fill="#f0e4d4"/>
        <rect x="342" y="154" width="113" height="5" rx="2.5" fill="#c47a3a"/>
      </g>

      {/* Payout card */}
      <g className="vb3">
        <rect x="348" y="374" width="184" height="98" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
        <rect x="348" y="374" width="184" height="32" rx="12" fill="#4a7c59"/>
        <rect x="348" y="394" width="184" height="12" fill="#4a7c59"/>
        <text x="440" y="394" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="sans-serif">✓  Payment sent</text>
        <text x="440" y="430" textAnchor="middle" fontSize="28" fontWeight="700" fill="#8b4513" fontFamily="sans-serif">25 G$</text>
        <text x="440" y="448" textAnchor="middle" fontSize="10" fill="#8b7355" fontFamily="sans-serif">Sent to MiniPay wallet</text>
        <circle cx="418" cy="460" r="3.5" fill="#c47a3a" className="vp"/>
        <circle cx="432" cy="460" r="3.5" fill="#c47a3a" style={{ animation: "vpulse 2.2s ease-in-out 0.3s infinite" }}/>
        <circle cx="446" cy="460" r="3.5" fill="#4a7c59" style={{ animation: "vpulse 2.2s ease-in-out 0.6s infinite" }}/>
        <circle cx="460" cy="460" r="3.5" fill="#4a7c59" style={{ animation: "vpulse 2.2s ease-in-out 0.9s infinite" }}/>
      </g>

      {/* NFT card */}
      <g className="vb4">
        <rect x="28" y="376" width="180" height="100" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
        <rect x="28" y="376" width="180" height="32" rx="12" fill="#c9a227"/>
        <rect x="28" y="396" width="180" height="12" fill="#c9a227"/>
        <text x="118" y="396" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="sans-serif">🏅  Reputation NFT</text>
        <circle cx="72" cy="430" r="20" fill="#fdf6f0" stroke="#c47a3a" strokeWidth="1.5"/>
        <text x="72" y="425" textAnchor="middle" fontSize="9" fill="#8b7355" fontFamily="sans-serif">Tier</text>
        <text x="72" y="441" textAnchor="middle" fontSize="18" fontWeight="700" fill="#8b4513" fontFamily="sans-serif">2</text>
        <text x="106" y="418" fontSize="10" fill="#8b7355" fontFamily="sans-serif">Tasks done</text>
        <text x="106" y="432" fontSize="16" fontWeight="600" fill="#2d1508" fontFamily="sans-serif">18</text>
        <text x="106" y="447" fontSize="10" fill="#8b7355" fontFamily="sans-serif">Total earned</text>
        <text x="106" y="461" fontSize="13" fontWeight="600" fill="#4a7c59" fontFamily="sans-serif">112 G$</text>
        <rect x="130" y="453" width="68" height="14" rx="5" fill="rgba(201,162,39,0.12)" stroke="rgba(201,162,39,0.35)" strokeWidth="0.5"/>
        <text x="164" y="464" textAnchor="middle" fontSize="9" fill="#c9a227" fontFamily="sans-serif">soul-bound</text>
      </g>
    </svg>
  );
}

function VerkoIllustrationMobile() {
  return (
    <svg viewBox="0 0 640 158" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ minWidth: 380, width: "100%", maxWidth: 640 }}>
      <defs>
        <marker id="marr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        <style>{`@keyframes mflow{0%{stroke-dashoffset:12}100%{stroke-dashoffset:0}}.mfl{animation:mflow 1.2s linear infinite}`}</style>
      </defs>
      {/* Step 1 */}
      <rect x="8" y="16" width="120" height="126" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
      <rect x="8" y="16" width="120" height="30" rx="12" fill="#2d1508"/>
      <rect x="8" y="34" width="120" height="12" fill="#2d1508"/>
      <text x="68" y="35" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="sans-serif">① Verify</text>
      <circle cx="68" cy="92" r="24" fill="#f5e6d8" stroke="#c47a3a" strokeWidth="1.5"/>
      <ellipse cx="68" cy="84" rx="12" ry="13" fill="#f5e6d8"/>
      <ellipse cx="68" cy="76" rx="11" ry="7" fill="#4a240b"/>
      <circle cx="63" cy="83" r="2.5" fill="#2d1508"/>
      <circle cx="73" cy="83" r="2.5" fill="#2d1508"/>
      <path d="M63 90 Q68 95 73 90" stroke="#8b4513" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="68" cy="70" r="7" fill="#4a7c59" stroke="white" strokeWidth="1.5"/>
      <path d="M65 70 L67.5 72.5 L72 67" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <text x="68" y="128" textAnchor="middle" fontSize="9" fill="#8b7355" fontFamily="sans-serif">GoodDollar ID</text>
      <path d="M136 79 L156 79" stroke="#c47a3a" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#marr)" className="mfl"/>
      {/* Step 2 */}
      <rect x="162" y="16" width="120" height="126" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
      <rect x="162" y="16" width="120" height="30" rx="12" fill="#8b4513"/>
      <rect x="162" y="34" width="120" height="12" fill="#8b4513"/>
      <text x="222" y="35" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="sans-serif">② Join task</text>
      <text x="222" y="72" textAnchor="middle" fontSize="22" fontFamily="sans-serif">📸</text>
      <text x="222" y="90" textAnchor="middle" fontSize="11" fontWeight="600" fill="#2d1508" fontFamily="sans-serif">Photo task</text>
      <text x="222" y="102" textAnchor="middle" fontSize="9" fill="#8b7355" fontFamily="sans-serif">Lagos branch</text>
      <rect x="178" y="108" width="88" height="18" rx="7" fill="#8b4513"/>
      <text x="222" y="121" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="sans-serif">25 G$ bounty</text>
      <path d="M290 79 L310 79" stroke="#c47a3a" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#marr)" className="mfl" style={{ animationDelay: "0.4s" }}/>
      {/* Step 3 */}
      <rect x="316" y="16" width="120" height="126" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
      <rect x="316" y="16" width="120" height="30" rx="12" fill="#4a7c59"/>
      <rect x="316" y="34" width="120" height="12" fill="#4a7c59"/>
      <text x="376" y="35" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="sans-serif">③ Get paid</text>
      <circle cx="376" cy="88" r="28" fill="#e8f5ed" stroke="#4a7c59" strokeWidth="1.5"/>
      <text x="376" y="84" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4a7c59" fontFamily="sans-serif">25</text>
      <text x="376" y="98" textAnchor="middle" fontSize="13" fontWeight="700" fill="#4a7c59" fontFamily="sans-serif">G$</text>
      <text x="376" y="125" textAnchor="middle" fontSize="9" fill="#4a7c59" fontFamily="sans-serif">MiniPay wallet</text>
      <text x="376" y="136" textAnchor="middle" fontSize="9" fill="#8b7355" fontFamily="sans-serif">instant payout</text>
      <path d="M444 79 L464 79" stroke="#4a7c59" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#marr)" className="mfl" style={{ animationDelay: "0.8s" }}/>
      {/* Step 4 */}
      <rect x="470" y="16" width="120" height="126" rx="12" fill="white" stroke="#e8d5bf" strokeWidth="1"/>
      <rect x="470" y="16" width="120" height="30" rx="12" fill="#c9a227"/>
      <rect x="470" y="34" width="120" height="12" fill="#c9a227"/>
      <text x="530" y="35" textAnchor="middle" fontSize="10" fontWeight="700" fill="white" fontFamily="sans-serif">④ Earn rep</text>
      <circle cx="530" cy="88" r="24" fill="#fdf6f0" stroke="#c9a227" strokeWidth="1.5"/>
      <text x="530" y="83" textAnchor="middle" fontSize="9" fill="#8b7355" fontFamily="sans-serif">Tier</text>
      <text x="530" y="99" textAnchor="middle" fontSize="22" fontWeight="700" fill="#8b4513" fontFamily="sans-serif">2</text>
      <text x="530" y="122" textAnchor="middle" fontSize="9" fill="#8b7355" fontFamily="sans-serif">Soul-bound NFT</text>
      <text x="530" y="133" textAnchor="middle" fontSize="9" fill="#c9a227" fontFamily="sans-serif">on-chain</text>
    </svg>
  );
}