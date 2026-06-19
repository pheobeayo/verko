"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";

const navLinks = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "For Posters",  href: "/#posters" },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const { isConnected } = useAppKitAccount();
  const { open }        = useAppKit();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [isConnected]);

  const logoHref = isConnected ? "/tasks" : "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b shadow-sm" : ""
      }`}
      style={{
        background:    scrolled ? "rgba(250,243,234,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderColor:   "var(--border)",
      }}
    >
      <div className="w-[90%] mx-auto py-3">
        <div className="flex items-center justify-between h-12">

          {/* Logo */}
          <Link href={logoHref} className="outline-none flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Verko"
              height={100}
              width={500}
              style={{ objectFit: "contain", height: 48, width: "auto" }}
              priority
            />
          </Link>

          {/* Desktop nav links — only when not connected */}
          {!isConnected && (
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium transition-colors duration-200 relative group"
                  style={{
                    color:      "var(--text-muted)",
                    fontFamily: "var(--font-nunito),sans-serif",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-heading)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
                >
                  {l.label}
                  <span
                    className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                    style={{ background: "var(--brown-400)" }}
                  />
                </Link>
              ))}
            </nav>
          )}

          {/* Right controls — desktop */}
          <div className="hidden md:block">
            {isConnected ? (
              <w3m-button size="sm" />
            ) : (
              <button
                onClick={() => open()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                style={{
                  background: "var(--brown-500)",
                  color:      "var(--cream-100)",
                  fontFamily: "var(--font-nunito),sans-serif",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--brown-400)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--brown-500)"; }}
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Burger — mobile */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg border"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
        <div
          className="px-4 py-3 border-t space-y-1"
          style={{
            borderColor:    "var(--border)",
            background:     "rgba(254,249,238,0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          {!isConnected && (
            <nav>
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-nunito),sans-serif" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="pt-1">
            {isConnected ? (
              <w3m-button />
            ) : (
              <button
                onClick={() => open()}
                className="w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "var(--brown-500)", color: "var(--cream-100)" }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}