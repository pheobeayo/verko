"use client";
import { VerkoWordMark } from "@/components/shared/VerkoLogo";
import { ExternalLink } from "lucide-react";

const LINKS = [
  { label: "Browse Tasks", href: "/tasks" },
  { label: "GoodDollar",   href: "https://gooddollar.org", ext: true },
  { label: "Celo",         href: "https://celo.org", ext: true },
];

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-primary)" }}>
      <div className="section-container py-5">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <VerkoWordMark size={26} />
          <div className="flex items-center gap-5 flex-wrap">
            {LINKS.map(l => (
              <a key={l.label} href={l.href}
                target={"ext" in l && l.ext ? "_blank" : undefined} rel="noreferrer"
                className="text-xs flex items-center gap-1 transition-opacity duration-150 hover:opacity-100"
                style={{ color: "var(--text-muted)", fontFamily: "var(--font-roboto)", opacity: 0.7, textDecoration: "none" }}>
                {l.label}{"ext" in l && l.ext && <ExternalLink className="w-2.5 h-2.5" />}
              </a>
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6, fontFamily: "var(--font-roboto)" }}>
            © All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}