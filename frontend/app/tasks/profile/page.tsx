"use client";
import { useState } from "react";
import { useAppKitAccount, useAppKit, useDisconnect } from "@reown/appkit/react";
import { User, Shield, Trophy, Copy, ExternalLink, LogOut } from "lucide-react";

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0,6)}…${addr.slice(-4)}`;
}

const TIERS = [
  { tier:0, label:"Newcomer", color:"var(--text-muted)",  min:0,  desc:"Complete your first task to start building reputation" },
  { tier:1, label:"Trusted",  color:"var(--brown-400)",   min:5,  desc:"5+ approved submissions" },
  { tier:2, label:"Expert",   color:"var(--gold)",        min:20, desc:"20+ approved submissions" },
  { tier:3, label:"Elite",    color:"#a78bfa",            min:50, desc:"50+ approved submissions" },
];

export default function Profile() {
  const { address, isConnected } = useAppKitAccount();
  const { open }       = useAppKit();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const currentTier  = TIERS[0];
  const approvedCount = 0;

  function copyAddr() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)]">
          <User className="w-7 h-7 text-[var(--text-muted)]" />
        </div>
        <p className="font-bold text-base text-[var(--text-heading)]"
          style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
          Connect your wallet to view your profile
        </p>
        <button onClick={() => open()}
          className="px-6 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer bg-[var(--brown-500)] text-[var(--cream-100)] hover:bg-[var(--brown-400)] transition-colors"
          style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full pb-12 px-4 sm:px-8">
      <div className="w-full max-w-[600px] flex flex-col gap-5">

        {/* Title */}
        <div>
          <h2 className="font-bold text-[clamp(1.4rem,3vw,1.75rem)] text-[var(--text-heading)]"
            style={{ fontFamily:"var(--font-telegraf),'Space Grotesk',sans-serif" }}>
            Profile
          </h2>
          <p className="text-xs mt-1 text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
            Your on-chain identity and reputation
          </p>
        </div>

        {/* Identity card */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-7">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--bg-secondary)] border-2 border-[var(--border)]">
              <User className="w-7 h-7 text-[var(--text-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <p className="font-bold text-base text-[var(--text-heading)]"
                  style={{ fontFamily:"var(--font-telegraf)" }}>
                  {shortAddr(address ?? "")}
                </p>
                <button onClick={copyAddr}
                  className="flex items-center gap-1 text-[0.72rem] text-[var(--text-muted)] bg-transparent border-none cursor-pointer p-0 hover:text-[var(--text-heading)] transition-colors">
                  <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
                </button>
                <a href={`https://celo-sepolia.blockscout.com/address/${address}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[0.72rem] text-[var(--text-muted)] no-underline hover:text-[var(--text-heading)] transition-colors">
                  <ExternalLink className="w-3 h-3" />Blockscout
                </a>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-bold border"
                  style={{ background:"rgba(74,124,89,0.1)", borderColor:"rgba(74,124,89,0.25)", color:"var(--success)" }}>
                  <Shield className="w-3 h-3" />GoodDollar Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-bold"
                  style={{ background:`${currentTier.color}18`, color:currentTier.color }}>
                  <Trophy className="w-3 h-3" />{currentTier.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reputation tiers */}
        <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color:"var(--gold)" }} />
              <p className="font-bold text-[0.95rem] text-[var(--text-heading)]"
                style={{ fontFamily:"var(--font-telegraf)" }}>
                Reputation Tiers
              </p>
            </div>
            <span className="text-[0.72rem] text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
              {approvedCount} approved tasks
            </span>
          </div>

          {TIERS.map((t, i) => {
            const isActive = currentTier.tier === t.tier;
            const isPast   = currentTier.tier > t.tier;
            return (
              <div key={t.tier}
                className={`flex items-center gap-3.5 px-5 py-3.5 ${i < TIERS.length - 1 ? "border-b border-[var(--border)]" : ""} ${isPast ? "opacity-50" : ""}`}
                style={{ background: isActive ? `${t.color}06` : "transparent" }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background:`${t.color}14`, border:`1.5px solid ${isActive ? t.color : "var(--border)"}` }}>
                  <Trophy className="w-4 h-4" style={{ color:t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm text-[var(--text-heading)]"
                      style={{ fontFamily:"var(--font-telegraf)" }}>
                      {t.label}
                    </p>
                    {isActive && (
                      <span className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full"
                        style={{ background:`${t.color}18`, color:t.color }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[0.75rem] text-[var(--text-muted)]" style={{ fontFamily:"var(--font-roboto)" }}>
                    {t.desc}
                  </p>
                </div>
                <p className="text-[0.8rem] font-bold shrink-0" style={{ fontFamily:"var(--font-telegraf)", color:t.color }}>
                  {t.min}+
                </p>
              </div>
            );
          })}
        </div>

        {/* Log out */}
        <div className="flex justify-center">
          <button onClick={() => disconnect()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] bg-transparent text-[var(--text-muted)] cursor-pointer hover:text-[var(--error)] hover:border-[var(--error)] transition-colors"
            style={{ fontFamily:"var(--font-nunito),sans-serif" }}>
            <LogOut className="w-4 h-4" />Log Out
          </button>
        </div>

      </div>
    </div>
  );
}