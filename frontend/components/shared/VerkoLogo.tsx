"use client";
import { useEffect, useState } from "react";

interface LogoProps { size?: number; className?: string; }

export function VerkoLogoMark({ size = 36, className = "" }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="vk-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brown-400)" />
          <stop offset="100%" stopColor="var(--brown-700)" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="36" height="36" rx="9" fill="url(#vk-g)" />
      {/* Sharp V — miter join for the crisp point at the bottom */}
      <polyline
        points="7,10 18,26 29,10"
        stroke="white"
        strokeWidth="4.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeMiterlimit="20"
        fill="none"
      />
    </svg>
  );
}

export function VerkoWordMark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap: size * 0.2 }}>
      <VerkoLogoMark size={size} />
      <span style={{
        fontFamily: "var(--font-telegraf),'Space Grotesk',sans-serif",
        fontWeight: 700,
        fontSize: size * 0.55,
        letterSpacing: "-0.03em",
        color: "var(--text-heading)",
        lineHeight: 1,
      }}>Verko</span>
    </div>
  );
}

export function VerkoLoader() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4"
      style={{ background: "var(--bg-primary)" }}>
      <div style={{ animation: "vk-loader 1.4s ease-in-out infinite" }}>
        <VerkoLogoMark size={52} />
      </div>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-telegraf)", fontSize: "0.65rem", letterSpacing: "0.18em" }}>
        VERKO{"...".slice(0, frame)}
      </p>
      <style>{`@keyframes vk-loader{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.65;transform:scale(0.9)}}`}</style>
    </div>
  );
}