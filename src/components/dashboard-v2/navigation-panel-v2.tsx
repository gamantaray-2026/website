"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { missionSteps } from "@/utils/dashboard-data";
import { Compass, ListChecks, Battery, Zap } from "lucide-react";

type NavData = {
  latitude: number;
  longitude: number;
  sog_ms: number;
  timestamp: string;
};

type CogData = {
  cog: number;
  timestamp: string;
};

type BatteryData = {
  voltage: number;
  percentage: number;
  timestamp: string;
};

type DataMission = {
  image_atas: string;
  image_bawah: string;
  docking: string;
  floating_ball_set: string;
  finish: string;
  start: string;
  preparation: string;
  surface_imaging: string;
  underwater_imaging: string;
  delay_point: string;
  loiter_time: string;
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
  const [batteryData, setBatteryData] = useState<BatteryData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: nav } = await supabase
        .from("nav_data")
        .select("latitude, longitude, timestamp, sog_ms")
        .order("timestamp", { ascending: false })
        .limit(1);
      setNavData((nav?.[0] ?? null) as NavData | null);

      const { data: cog } = await supabase
        .from("cog_data")
        .select("cog, timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);
      setCogData((cog?.[0] ?? null) as CogData | null);
      
      const { data: bat } = await supabase
        .from("battery_data")
        .select("voltage, percentage, timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);
      setBatteryData((bat?.[0] ?? null) as BatteryData | null);
    };

    loadData();

    const navCh = supabase
      .channel("nav_panel_gps_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nav_data" },
        (payload) => setNavData(payload.new as NavData)
      )
      .subscribe();

    const cogCh = supabase
      .channel("nav_panel_cog_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cog_data" },
        (payload) => setCogData(payload.new as CogData)
      )
      .subscribe();
      
    const batCh = supabase
      .channel("nav_panel_battery_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "battery_data" },
        (payload) => setBatteryData(payload.new as BatteryData)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(navCh);
      supabase.removeChannel(cogCh);
      supabase.removeChannel(batCh);
    };
  }, []);

  // Auto-advance mission step saat gazebo selesaikan misi
  useEffect(() => {
    const resolveActiveStep = (m: DataMission): string | null => {
      if (m.finish === "selesai") return "07";
      if (m.docking === "proses" || m.docking === "selesai") return "06";
      if (m.surface_imaging === "proses" || m.surface_imaging === "selesai") return "05";
      if (m.underwater_imaging === "proses" || m.underwater_imaging === "selesai") return "04";
      if (m.floating_ball_set === "proses" || m.floating_ball_set === "selesai") return "03";
      if (m.start === "proses" || m.start === "selesai") return "02";
      if (m.preparation === "proses" || m.preparation === "selesai") return "01";
      return null;
    };

    const loadMissionStatus = async () => {
      const { data } = await supabase
        .from("data_mission")
        .select("preparation, start, floating_ball_set, underwater_imaging, surface_imaging, docking, finish")
        .eq("id", 1)
        .limit(1);
      if (data?.[0]) {
        const nextStep = resolveActiveStep(data[0] as DataMission);
        if (nextStep) onStepChange(nextStep);
      }
    };
    loadMissionStatus();

    const missionCh = supabase
      .channel("nav_panel_mission_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "data_mission" },
        (payload) => {
          const nextStep = resolveActiveStep(payload.new as DataMission);
          if (nextStep) onStepChange(nextStep);
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

  const formattedSpeed = navData?.sog_ms != null ? `${navData.sog_ms.toFixed(1)} m/s` : "—";
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
          {/* Battery section inside the grid */}
          <div className="px-4 py-5 col-span-2 border-t border-border flex justify-between items-center bg-foreground/5">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-sage-dingin">
                <Battery className="h-4 w-4 text-lime-neon" />
                Battery Level
              </p>
              <p className="mt-1 text-2xl tracking-tight text-kapur-muda">
                {batteryData?.percentage != null ? `${batteryData.percentage.toFixed(0)}%` : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="flex justify-end items-center gap-1 text-sm font-semibold text-sage-dingin">
                <Zap className="h-3.5 w-3.5" />
                Voltage
              </p>
              <p className="mt-1 text-xl tracking-tight text-kapur-muda">
                {batteryData?.voltage != null ? `${batteryData.voltage.toFixed(2)} V` : "—"}
              </p>
            </div>
          </div>
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