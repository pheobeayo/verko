"use client";
import { useEffect, useRef, useState } from "react";
import { UserCheck, Search, Send, Wallet, BarChart3, PlusCircle, Eye, CheckCircle } from "lucide-react";

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const WORKER_STEPS = [
  { icon:<UserCheck className="w-5 h-5"/>, step:"01", title:"Verify Once",        desc:"GoodDollar face verification. One real person, one account — no duplicates." },
  { icon:<Search    className="w-5 h-5"/>, step:"02", title:"Browse Tasks",       desc:"Filter by category, time needed, and G$ reward. Pick tasks that match your skills." },
  { icon:<Send      className="w-5 h-5"/>, step:"03", title:"Submit Proof",       desc:"Complete the task and submit your proof — photo, form, translation, or audio." },
  { icon:<Wallet    className="w-5 h-5"/>, step:"04", title:"Get Paid Instantly", desc:"Once approved, G$ lands in your MiniPay wallet. No bank account needed." },
  { icon:<BarChart3 className="w-5 h-5"/>, step:"05", title:"Build Reputation",   desc:"Your soul-bound NFT tier upgrades with every approved task." },
];

const POSTER_STEPS = [
  { icon:<PlusCircle  className="w-5 h-5"/>, step:"01", title:"Post a Task",       desc:"Define your task, set the bounty in G$, choose the verification method." },
  { icon:<Eye         className="w-5 h-5"/>, step:"02", title:"Workers Join",      desc:"Face-verified workers find your task and start submitting proof." },
  { icon:<CheckCircle className="w-5 h-5"/>, step:"03", title:"Approve & Release", desc:"Review submissions, approve the good ones, G$ releases from escrow instantly." },
];

// Colors stay as objects — they contain rgba values that can't be Tailwind utilities
const WORKER_COLORS = [
  { bg:"rgba(168,101,42,0.08)",  icon:"var(--brown-600)", border:"rgba(168,101,42,0.18)" },
  { bg:"rgba(201,162,39,0.09)",  icon:"var(--gold)",      border:"rgba(201,162,39,0.2)"  },
  { bg:"rgba(74,124,89,0.08)",   icon:"var(--success)",   border:"rgba(74,124,89,0.18)"  },
  { bg:"rgba(196,122,58,0.08)",  icon:"var(--brown-400)", border:"rgba(196,122,58,0.18)" },
  { bg:"rgba(167,139,250,0.09)", icon:"#7c6ff5",          border:"rgba(167,139,250,0.2)" },
];
const POSTER_COLORS = [
  { bg:"rgba(168,101,42,0.08)",  icon:"var(--brown-500)", border:"rgba(168,101,42,0.18)" },
  { bg:"rgba(74,124,89,0.09)",   icon:"var(--success)",   border:"rgba(74,124,89,0.2)"   },
  { bg:"rgba(201,162,39,0.09)",  icon:"var(--gold)",      border:"rgba(201,162,39,0.2)"  },
];

function StepCard({ icon, step, title, desc, index, visible, color }: {
  icon:React.ReactNode; step:string; title:string; desc:string;
  index:number; visible:boolean; color:typeof WORKER_COLORS[0];
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-4 sm:p-6 transition-all duration-[600ms]"
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        transitionDelay: `${index * 110}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {/* Watermark step number */}
      <span
        className="absolute -top-2 right-2 text-[4rem] font-black leading-none select-none pointer-events-none"
        style={{ color:"rgba(0,0,0,0.05)", fontFamily:"var(--font-telegraf)" }}
      >
        {step}
      </span>

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5"
        style={{ background:"rgba(255,255,255,0.7)", border:`1px solid ${color.border}`, color:color.icon }}
      >
        {icon}
      </div>

      <h3
        className="font-bold text-[0.92rem] text-[var(--text-heading)] mb-1.5"
        style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-[0.8rem] text-[var(--text-muted)] leading-relaxed" style={{ fontFamily:"var(--font-roboto)" }}>
        {desc}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px w-7 shrink-0 bg-[var(--brown-300)]" />
      <span
        className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[var(--brown-400)] whitespace-nowrap"
        style={{ fontFamily:"var(--font-nunito)" }}
      >
        {children}
      </span>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}

export default function HowItWorks() {
  const { ref:titleRef,  visible:titleVis  } = useReveal(0.2);
  const { ref:workerRef, visible:workerVis } = useReveal(0.1);
  const { ref:posterRef, visible:posterVis } = useReveal(0.1);

  return (
    <section id="how-it-works" className="py-24 bg-[var(--bg-primary)]">
      <div className="section-container">

        {/* Title */}
        <div
          ref={titleRef}
          className="text-center mb-14 transition-all duration-700"
          style={{ opacity:titleVis?1:0, transform:titleVis?"translateY(0)":"translateY(24px)" }}
        >
          <span
            className="block text-[0.7rem] font-bold tracking-[0.12em] uppercase text-[var(--brown-400)] mb-3"
            style={{ fontFamily:"var(--font-nunito)" }}
          >
            How it works
          </span>
          <h2
            className="font-bold text-[var(--text-heading)] mb-3.5"
            style={{
              fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif",
              fontSize:"clamp(2rem,4vw,3rem)",
              letterSpacing:"-0.02em",
            }}
          >
            Simple for everyone.
          </h2>
          <p
            className="text-[0.95rem] text-[var(--text-muted)] max-w-[500px] mx-auto leading-[1.7]"
            style={{ fontFamily:"var(--font-roboto)" }}
          >
            Verified humans complete tasks and get paid in G$. Task posters get real, trustworthy results.
          </p>
        </div>

        {/* For Workers */}
        <div className="mb-14">
          <SectionLabel>For Workers</SectionLabel>
          <div
            ref={workerRef}
            className="grid gap-3.5 mx-auto"
            style={{ gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,100%),1fr))", maxWidth:1000 }}
          >
            {WORKER_STEPS.map((s,i) => (
              <StepCard key={i} {...s} index={i} visible={workerVis} color={WORKER_COLORS[i]} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mb-11">
          <div className="h-px w-[60px]" style={{ background:"linear-gradient(to right,transparent,var(--brown-300))" }} />
          <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 border-[var(--brown-300)]">
            <span className="text-[0.72rem] text-[var(--brown-400)]">↕</span>
          </div>
          <div className="h-px w-[60px]" style={{ background:"linear-gradient(to left,transparent,var(--brown-300))" }} />
        </div>

        {/* For Posters */}
        <div>
          <SectionLabel>For Task Posters</SectionLabel>
          <div
            ref={posterRef}
            className="grid gap-3.5 mx-auto"
            style={{ gridTemplateColumns:"repeat(auto-fill,minmax(min(220px,100%),1fr))", maxWidth:820 }}
          >
            {POSTER_STEPS.map((s,i) => (
              <StepCard key={i} {...s} index={i} visible={posterVis} color={POSTER_COLORS[i]} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}