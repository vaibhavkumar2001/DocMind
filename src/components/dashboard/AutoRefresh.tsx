"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 3000;

export default function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      // Do not waste requests while the tab is in the background
      if (!document.hidden) router.refresh();
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, [active, router]);

  return null;
}