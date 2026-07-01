"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function DashboardHeader() {
  const [timeStr, setTimeStr] = useState<string>("Memuat waktu...");
  const [isoStr, setIsoStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const dateFormatter = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      const datePart = dateFormatter.format(now);
      
      const timeFormatter = new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      // Replace colon with dot just in case it formats with colon
      const timePart = timeFormatter.format(now).replace(/:/g, ".");
      
      setTimeStr(`${datePart} · ${timePart} WIB`);
      setIsoStr(now.toISOString());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-4 text-kapur-muda/90">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm">
          <Image
            src="/logo.png"
            alt="Safinah One"
            width={80}
            height={48}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-medium tracking-[0.02em] text-kapur-muda">
            Safinah One
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-5 text-sm text-sage-dingin">
        <time dateTime={isoStr} className="font-medium" suppressHydrationWarning>
          {timeStr}
        </time>
        <button className="inline-flex items-center gap-2 border border-white/10 bg-black/30 px-4 py-2 text-sm text-kapur-muda transition-colors hover:border-lime-neon/40 hover:bg-black/45 hover:text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 12a8 8 0 0 1 13.66-5.66L20 9" />
            <path d="M20 4v5h-5" />
            <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15" />
            <path d="M4 20v-5h5" />
          </svg>
          Refresh
        </button>
      </div>
    </header>
  );
}
