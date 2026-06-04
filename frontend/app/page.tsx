"use client";

import { useRouter } from "next/navigation";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";

const STATS = [
  { value:"12,450+", label:"Tasks done" },
  { value:"3,200+",  label:"Verified workers" },
  { value:"890K G$", label:"Paid out" },
  { value:"47",      label:"Countries" },
  { value:"94%",     label:"Approval rate" },
];

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Hero />
      <div style={{ borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background:"var(--bg-card)", overflow:"hidden", padding:"14px 0" }}>
        <div style={{ display:"flex", width:"max-content", animation:"var(--animate-glide)" }}>
          {[...STATS,...STATS].map((s,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"0 clamp(20px,4vw,40px)", borderRight:"1px solid var(--border)", whiteSpace:"nowrap" }}>
              <span style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif", fontWeight:700, fontSize:"clamp(0.95rem,2vw,1.2rem)", color:"var(--brown-500)" }}>{s.value}</span>
              <span style={{ fontSize:"clamp(0.7rem,1.5vw,0.875rem)", color:"var(--text-muted)", fontFamily:"var(--font-roboto)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <HowItWorks />
    </>
  );
}