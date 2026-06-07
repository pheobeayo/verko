"use client";
import { useState, useEffect } from "react";
import { VerkoLoader } from "@/components/shared/VerkoLogo";
import TasksDashboardNav from "@/components/tasks/TasksDashboardNav";
import { WalletGuard } from "@/components/auth/WalletGuard";

export default function TasksLayout({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120);
    return () => clearTimeout(t);
  }, []);

  if (!loaded) return <VerkoLoader />;

  return (
    <WalletGuard>
      <div className="min-h-screen flex flex-col pt-16 bg-[var(--bg-primary)]">
        <div className="w-[93%] mx-auto flex flex-col flex-1 py-6">

          {/* Nav header — slides down on load */}
          <div
            className="transition-all duration-500"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(-10px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <p
              className="text-xs mt-0.5 mb-1 text-[var(--text-muted)]"
              style={{ fontFamily: "var(--font-roboto)" }}
            >
              Verified micro-task marketplace
            </p>
            <TasksDashboardNav />
          </div>

          {/* Page content — fades up after nav */}
          <div
            className="flex-1 mt-6 transition-all duration-500"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(8px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              transitionDelay: "120ms",
            }}
          >
            {children}
          </div>

        </div>
      </div>
    </WalletGuard>
  );
}