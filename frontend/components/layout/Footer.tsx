"use client";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

const LINKS = [
  { label: "Browse Tasks", href: "/tasks" },
  { label: "GoodDollar",   href: "https://gooddollar.org", ext: true },
  { label: "Celo",         href: "https://celo.org",       ext: true },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--bg-primary)" }}>
      <div className="section-container py-5">
        <div className="flex items-center justify-between gap-6 flex-wrap">

          {/* Logo */}
          <Link href="/" className="outline-none flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Verko"
              height={100}
              width={500}
              style={{ objectFit: "contain", height: 40, width: "auto" }}
            />
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-5 flex-wrap">
            {LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                target={"ext" in l && l.ext ? "_blank" : undefined}
                rel="noreferrer"
                className="text-xs flex items-center gap-1 transition-opacity duration-150 hover:opacity-100"
                style={{
                  color:          "var(--text-muted)",
                  fontFamily:     "var(--font-roboto)",
                  opacity:        0.7,
                  textDecoration: "none",
                }}
              >
                {l.label}
                {"ext" in l && l.ext && <ExternalLink className="w-2.5 h-2.5" />}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <span
            className="text-xs"
            style={{
              color:      "var(--text-muted)",
              opacity:    0.6,
              fontFamily: "var(--font-roboto)",
            }}
          >
            © {new Date().getFullYear()} Verko. All Rights Reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}