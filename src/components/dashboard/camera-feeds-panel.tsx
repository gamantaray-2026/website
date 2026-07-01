"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CameraIcon } from "./camera-icon";

type CameraFeed = {
  title: string;
  code: string;
  label: string;
  imageUrl?: string;
};

const CAMERA_BASE_DATA = [
  { title: "SL", label: "Surface Left" },
  { title: "UL", label: "Upper Left" },
  { title: "SR", label: "Surface Right" },
  { title: "UR", label: "Upper Right" },
];

function formatWIBTime(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return formatter.format(now).replace(/\./g, ":");
}

function CameraCard({
  title,
  code,
  label,
  isSelected,
  onSelect,
  imageUrl,
  refreshKey,
}: {
  title: string;
  code: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
  imageUrl?: string;
  refreshKey: number;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`border px-4 py-3 text-left shadow-[0_0_0_1px_rgba(26,58,56,0.45)_inset] transition-colors ${
        isSelected
          ? "border-lime-neon bg-surface"
          : "border-white/10 bg-surface hover:bg-white/5"
      }`}
    >
      <div className="mb-8 flex items-center justify-between text-sm text-sage-dingin relative z-10">
        <span className="font-semibold tracking-[0.16em] text-kapur-muda/80 drop-shadow-md">
          {title}
        </span>
        <span className="drop-shadow-md">{code}</span>
      </div>
      <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-sage-dingin relative overflow-hidden bg-black/20 rounded-md">
        {imageUrl ? (
          <img
            src={`${imageUrl}?t=${refreshKey}`}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover opacity-90"
          />
        ) : (
          <>
            <CameraIcon className="h-16 w-16 text-sage-dingin/80" />
            <span className="text-sm uppercase tracking-[0.24em]">{label}</span>
          </>
        )}
      </div>
    </button>
  );
}

type CameraFeedsPanelProps = {
  selectedFeedTitle: string;
  onFeedSelect: (title: string) => void;
};

export function CameraFeedsPanel({
  selectedFeedTitle,
  onFeedSelect,
}: CameraFeedsPanelProps) {
  const [currentTime, setCurrentTime] = useState<string>("00:00:00");
  const [refreshKey, setRefreshKey] = useState<number>(Date.now());
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentTime(formatWIBTime());
    const interval = setInterval(() => {
      setCurrentTime(formatWIBTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const imgInterval = setInterval(() => {
      setRefreshKey(Date.now());
    }, 2000);
    return () => clearInterval(imgInterval);
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const { data, error } = await supabase
        .from("image_mission")
        .select("image_url, image_slot_name")
        .order("id", { ascending: false });
      if (!error && data) {
        const newMap: Record<string, string> = {};
        data.forEach((row: any) => {
          if (!newMap[row.image_slot_name]) {
            newMap[row.image_slot_name] = row.image_url;
          }
        });
        setImageMap(newMap);
      }
    };
    loadImages();

    const imgCh = supabase
      .channel("image_mission_feeds")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "image_mission" },
        (payload) => {
          const row = payload.new as any;
          setImageMap((prev) => ({ ...prev, [row.image_slot_name]: row.image_url }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(imgCh);
    };
  }, []);

  const getImgUrl = (title: string) => {
    // Handling fallback exactly like magang does
    if (title === "SL") return imageMap["SL"] ?? imageMap["atas"];
    if (title === "UL") return imageMap["UL"] ?? imageMap["bawah"];
    return imageMap[title];
  };

  return (
    <aside className="flex flex-col gap-0 border border-white/10 bg-surface-strong shadow-[0_0_0_1px_rgba(26,58,56,0.28)_inset]">
      <div className="border-b border-white/10 px-5 py-4 text-[1.05rem] text-kapur-muda">
        Camera Feeds
      </div>
      <div className="grid gap-px bg-white/10">
        {CAMERA_BASE_DATA.map((feed) => (
          <CameraCard
            key={feed.title}
            title={feed.title}
            label={feed.label}
            code={currentTime}
            imageUrl={getImgUrl(feed.title)}
            refreshKey={refreshKey}
            isSelected={feed.title === selectedFeedTitle}
            onSelect={() => onFeedSelect(feed.title)}
          />
        ))}
      </div>
    </aside>
  );
}
