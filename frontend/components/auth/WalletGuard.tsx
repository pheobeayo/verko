"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAppKitAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const onTasksRoute = pathname.startsWith("/tasks");

    if (!onTasksRoute && isConnected) {
      router.replace("/tasks");
    }

    if (onTasksRoute && !isConnected) {
      router.replace("/");
    }
  }, [ready, isConnected, pathname, router]);

  return <>{children}</>;
}