"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, PlusCircle, Wallet, User } from "lucide-react";

interface Tab {
  value: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: number;
}
interface Props { alertCount?: number; }

export default function TasksDashboardNav({ alertCount = 0 }: Props) {
  const pathname = usePathname();

  function isActive(value: string) {
    if (value === "browse"   && pathname === "/tasks")          return true;
    if (value === "my-tasks" && pathname.includes("my-tasks"))  return true;
    if (value === "post"     && pathname.includes("post"))      return true;
    if (value === "earnings" && pathname.includes("earnings"))  return true;
    if (value === "profile"  && pathname.includes("profile"))   return true;
    return false;
  }

  const tabs: Tab[] = [
    { value: "browse",   href: "/tasks",           label: "Browse Tasks", icon: <LayoutGrid  className="w-[15px] h-[15px]" />, color: "#c47a3a" },
    { value: "my-tasks", href: "/tasks/my-tasks",  label: "My Tasks",     icon: <ListChecks  className="w-[15px] h-[15px]" />, color: "#a78bfa" },
    { value: "post",     href: "/tasks/post",      label: "Post a Task",  icon: <PlusCircle  className="w-[15px] h-[15px]" />, color: "#34d399" },
    { value: "earnings", href: "/tasks/earnings",  label: "Earnings",     icon: <Wallet      className="w-[15px] h-[15px]" />, color: "#fbbf24", badge: alertCount },
    { value: "profile",  href: "/tasks/profile",   label: "Profile",      icon: <User        className="w-[15px] h-[15px]" />, color: "#f472b6" },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b mt-3"
      style={{ borderColor: "var(--border)" }}>
      {tabs.map(tab => {
        const active = isActive(tab.value);
        return (
          <Link key={tab.value} href={tab.href}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-all duration-200 no-underline"
            style={{
              borderBottomColor: active ? tab.color : "transparent",
              color: active ? "var(--text-heading)" : "var(--text-muted)",
              fontFamily: "var(--font-nunito),sans-serif",
              marginBottom: "-1px",
            }}>
            <span style={{ color: tab.color, filter: active ? `drop-shadow(0 0 5px ${tab.color})` : "none", transition: "filter 0.2s" }}>
              {tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge != null && tab.badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                style={{ background: "rgba(196,66,26,0.12)", color: "var(--error)", border: "1px solid rgba(196,66,26,0.3)" }}>
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}