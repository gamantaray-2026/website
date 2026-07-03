"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { missionSteps } from "@/utils/dashboard-data";
import { Compass, ListChecks } from "lucide-react";

type NavData = {
  latitude: number;
  longitude: number;
  sog: number;
  sog_ms?: number;
  timestamp: string;
};

type CogData = {
  cog: number;
  timestamp: string;
};

type DataMission = {
  image_atas: string;
  image_bawah: string;
};

type NavigationPanelProps = {
  activeStepId: string;
  onStepChange: (stepId: string) => void;
  role?: "admin" | "viewer";
};

export function NavigationPanel({
  activeStepId,
  onStepChange,
  role = "viewer",
}: NavigationPanelProps) {
  const [navData, setNavData] = useState<NavData | null>(null);
  const [cogData, setCogData] = useState<CogData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: nav } = await supabase
        .from("nav_data")
        .select("latitude, longitude, timestamp, sog_ms")
        .order("timestamp", { ascending: false })
        .limit(1);
      setNavData((nav?.[0] ?? null) as any);

      const { data: cog } = await supabase
        .from("cog_data")
        .select("cog, timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);
      setCogData((cog?.[0] ?? null) as any);
    };

    loadData();

    const navCh = supabase
      .channel("nav_panel_gps_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nav_data" },
        (payload) => setNavData(payload.new as any)
      )
      .subscribe();

    const cogCh = supabase
      .channel("nav_panel_cog_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cog_data" },
        (payload) => setCogData(payload.new as any)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(navCh);
      supabase.removeChannel(cogCh);
    };
  }, []);

  // Auto-advance mission step saat gazebo selesaikan misi
  useEffect(() => {
    const loadMissionStatus = async () => {
      const { data } = await supabase
        .from("data_mission")
        .select("image_atas, image_bawah")
        .eq("id", 1)
        .limit(1);
      if (data?.[0]) {
        const m = data[0] as DataMission;
        if (m.image_bawah === "selesai") onStepChange("05");
        else if (m.image_atas === "selesai") onStepChange("04");
      }
    };
    loadMissionStatus();

    const missionCh = supabase
      .channel("nav_panel_mission_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "data_mission" },
        (payload) => {
          const m = payload.new as DataMission;
          if (m.image_bawah === "selesai") onStepChange("05");
          else if (m.image_atas === "selesai") onStepChange("04");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(missionCh);
    };
  }, [onStepChange]);

  const formatCoord = (coord?: number) => {
    if (coord === undefined || coord === null) return "—";
    return `${coord.toFixed(4)}°`;
  };

  const speed = navData?.sog ?? (navData?.sog_ms ? navData.sog_ms * 1.94384 : 0);
  const formattedSpeed = navData ? speed.toFixed(1) : "—";
  const formattedCog = (cogData?.cog !== undefined && cogData?.cog !== null) 
    ? cogData.cog.toFixed(0).padStart(3, "0") + "°" 
    : "—";

  const dynamicMetrics = [
    { label: "Latitude", value: formatCoord(navData?.latitude) },
    { label: "Longitude", value: formatCoord(navData?.longitude) },
    { label: "SoG", value: formattedSpeed },
    { label: "CoG", value: formattedCog },
  ];

  return (
    <aside className="flex min-h-0 flex-col gap-5">
      <section className="border border-border bg-surface-strong shadow-[0_0_0_1px_var(--border)_inset]">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4 text-[1.05rem] text-kapur-muda font-medium tracking-wide">
          <Compass className="h-4 w-4 text-lime-neon" />
          Navigation Data
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border">
          {dynamicMetrics.map((metric) => (
            <div key={metric.label} className="px-4 py-5">
              <p className="text-sm font-semibold text-sage-dingin">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl tracking-tight text-kapur-muda">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col border border-border bg-surface-strong shadow-[0_0_0_1px_var(--border)_inset]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-[1.05rem] text-kapur-muda font-medium tracking-wide">
            <ListChecks className="h-4 w-4 text-lime-neon" />
            Mission Log
          </h2>
          <span className="text-sm font-semibold text-sage-dingin">
            Tahap 1
          </span>
        </div>
        <ul className="divide-y divide-border overflow-y-auto">
          {missionSteps.map((step) => {
            const isActive = step.id === activeStepId;

            return (
              <li
                key={step.id}
                className={`flex items-center gap-3 px-5 py-4 text-lg transition-colors ${
                  isActive
                    ? "bg-lime-neon text-midnight-hitam"
                    : "text-kapur-muda/92 hover:bg-foreground/5"
                }`}
              >
                <button
                  type="button"
                  disabled={role === "viewer"}
                  onClick={() => onStepChange(step.id)}
                  className={`flex w-full items-center gap-3 text-left ${role === "viewer" ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-midnight-hitam" : "bg-foreground/20"
                    }`}
                  />
                  <span className="font-medium">{step.label}</span>
                  <span className="ml-auto text-sm opacity-70">{step.id}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
