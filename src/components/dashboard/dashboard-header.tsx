"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function DashboardHeader() {
  const [timeStr, setTimeStr] = useState<string>("Memuat waktu...");
  const [isoStr, setIsoStr] = useState<string>("");
  const [isLightMode, setIsLightMode] = useState<boolean>(false);

  useEffect(() => {
    // Check initial mode
    if (document.body.classList.contains("light-mode")) {
      setIsLightMode(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsLightMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.body.classList.add("light-mode");
      } else {
        document.body.classList.remove("light-mode");
      }
      return newMode;
    });
  };

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
    <header className="flex shrink-0 items-center justify-between border-b border-border pb-4">
      <div className="flex items-center gap-5">
        <div className="flex h-12 w-16 shrink-0 items-center justify-center">
          <Image
            src="/logo.png"
            alt="Safinah One"
            width={80}
            height={48}
            className={`h-full w-full object-contain drop-shadow-[0_0_8px_rgba(217,242,26,0.3)] transition-all duration-500 ${isLightMode ? 'brightness-[0.25] sepia-[0.5] hue-rotate-[120deg]' : ''}`}
            priority
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="bg-gradient-to-r from-kapur-muda to-sage-dingin bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Safinah One
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          className="group relative flex h-10 w-10 items-center justify-center text-sage-dingin transition-all duration-500 hover:text-lime-neon focus:outline-none"
          title="Toggle Theme"
        >
          <Sun className={`absolute h-6 w-6 transition-all duration-500 ${isLightMode ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 group-hover:rotate-[360deg]"}`} />
          <Moon className={`absolute h-6 w-6 transition-all duration-500 ${isLightMode ? "rotate-0 scale-100 opacity-100 group-hover:-rotate-12" : "-rotate-90 scale-0 opacity-0"}`} />
        </button>

        <div className="flex flex-col items-end text-right">
          <time dateTime={isoStr} className="text-sm font-medium tracking-wider text-kapur-muda" suppressHydrationWarning>
            {timeStr.split('·')[1]}
          </time>
          <span className="text-xs font-medium text-sage-dingin" suppressHydrationWarning>
            {timeStr.split('·')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
