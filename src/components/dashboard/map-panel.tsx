"use client";

import { supabase } from "@/lib/supabaseClient";
import { Check, PenTool, RefreshCw, X, Maximize } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { CogData, MapState, NavData, Waypoints, WaypointType } from "./MapLeaflet";
import type { DashboardRoute } from "./types";

const MapLeaflet = dynamic(() => import("./MapLeaflet"), { ssr: false });

const MISSION_NAMES = ["lintasan1", "lintasan2"] as const;
type MissionName = (typeof MISSION_NAMES)[number];

const waypointTypes: WaypointType[] = ["start", "buoys", "finish", "image_surface", "image_underwater"];

const fallbackCenters: Record<MissionName, [number, number]> = {
  lintasan1: [-7.7715, 110.3778],
  lintasan2: [-7.7711, 110.3780],
};

function makeDefaultWaypoints(center: [number, number]): Waypoints {
  return { start: center, buoys: center, finish: center, image_surface: center, image_underwater: center };
}

function ensureWaypoints(wp: Partial<Waypoints> | undefined, center: [number, number]): Waypoints {
  const base = wp ?? {};
  return {
    start: base.start ?? center, buoys: base.buoys ?? center, finish: base.finish ?? center,
    image_surface: base.image_surface ?? center, image_underwater: base.image_underwater ?? center,
  };
}

type MapPanelProps = {
  activeRoute: DashboardRoute;
  onRouteChange: (route: DashboardRoute) => void;
};

export function MapPanel({ activeRoute, onRouteChange }: MapPanelProps) {
  const [navData, setNavData] = useState<NavData | null>(null);
  const [cogData, setCogData] = useState<CogData | null>(null);
  const [latestImages, setLatestImages] = useState<{ [key: string]: string }>({});
  const [isSignalLost, setIsSignalLost] = useState(false);

  const [centers, setCenters] = useState<Record<string, [number, number]>>({ ...fallbackCenters });
  const [missionWaypoints, setMissionWaypoints] = useState<Record<string, Waypoints>>(() => {
    const init: Record<string, Waypoints> = {};
    MISSION_NAMES.forEach((m) => (init[m] = makeDefaultWaypoints(fallbackCenters[m])));
    return init;
  });

  const viewType: MissionName = activeRoute === "A" ? "lintasan1" : "lintasan2";
  const [mapState, setMapState] = useState<MapState>({ view_type: viewType, is_refreshed: false });

  useEffect(() => {
    setMapState(prev => ({ ...prev, view_type: viewType }));
  }, [viewType]);

  const [centerEditMode, setCenterEditMode] = useState(false);
  const [centerDraft, setCenterDraft] = useState<[number, number] | null>(null);

  useEffect(() => {
    setMissionWaypoints((prev) => {
      const updated = { ...prev };
      MISSION_NAMES.forEach((m) => {
        const newCenter = centers[m] ?? fallbackCenters[m];
        updated[m] = ensureWaypoints(prev[m], newCenter);
      });
      return updated;
    });
  }, [centers]);

  useEffect(() => {
    const loadAll = async () => {
      const { data: cData } = await supabase.from("Center_Lintasan").select('"Lintasan","Latitude","Longititude"');
      if (cData) {
        const next: Record<string, [number, number]> = { ...fallbackCenters };
        cData.forEach((row: any) => {
          if (row.Latitude != null && row.Longititude != null) next[row.Lintasan] = [row.Latitude, row.Longititude];
        });
        setCenters(next);
      }

      const { data: wData } = await supabase.from("mission_waypoints").select("mission_name, waypoint_type, latitude, longitude");
      if (wData) {
        const partial: Record<string, Partial<Waypoints>> = {};
        for (const row of wData as any[]) {
          partial[row.mission_name] ??= {};
          partial[row.mission_name]![row.waypoint_type as WaypointType] = [row.latitude, row.longitude];
        }
        const nextWp: Record<string, Waypoints> = {};
        MISSION_NAMES.forEach((m) => {
          const c = (nextWp[m] ? nextWp[m].start : fallbackCenters[m]) as [number, number];
          const c2 = (centers[m] ?? fallbackCenters[m]) as [number, number];
          nextWp[m] = ensureWaypoints(partial[m], c2 ?? c);
        });
        setMissionWaypoints(nextWp);
      }

      const { data: nav } = await supabase.from("nav_data").select("latitude, longitude, timestamp, sog_ms").order("timestamp", { ascending: false }).limit(1);
      setNavData((nav?.[0] ?? null) as any);

      const { data: cog } = await supabase.from("cog_data").select("cog, timestamp").order("timestamp", { ascending: false }).limit(1);
      setCogData((cog?.[0] ?? null) as any);

      const { data: imgData } = await supabase.from("image_mission").select("image_url, image_slot_name").order("created_at", { ascending: false }).limit(10);
      if (imgData) {
        const imgs: { [key: string]: string } = {};
        imgData.forEach((row: any) => {
          if (!imgs[row.image_slot_name]) imgs[row.image_slot_name] = row.image_url;
        });
        setLatestImages(imgs);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const navCh = supabase.channel("gps_logs_changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "nav_data" }, (payload) => setNavData(payload.new as any)).subscribe();
    const cogCh = supabase.channel("cog_data_changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "cog_data" }, (payload) => setCogData(payload.new as any)).subscribe();
    const imgCh = supabase.channel("image_mission_changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "image_mission" }, (payload) => {
      const newRow = payload.new as any;
      setLatestImages((prev) => ({ ...prev, [newRow.image_slot_name]: newRow.image_url }));
    }).subscribe();

    return () => { supabase.removeChannel(navCh); supabase.removeChannel(cogCh); supabase.removeChannel(imgCh); };
  }, []);

  useEffect(() => {
    const checkSignal = () => {
      if (!navData?.timestamp) { setIsSignalLost(true); return; }
      const lastUpdate = new Date(navData.timestamp).getTime();
      const now = Date.now();
      setIsSignalLost(now - lastUpdate > 10000);
    };
    const interval = setInterval(checkSignal, 2000);
    checkSignal();
    return () => clearInterval(interval);
  }, [navData]);

  const handleWaypointsChange = async (missionType: string, newWaypoints: Waypoints) => {
    setMissionWaypoints((prev) => ({ ...prev, [missionType]: newWaypoints }));
    const rows = waypointTypes.map((t) => ({
      mission_name: missionType, waypoint_type: t, latitude: newWaypoints[t][0], longitude: newWaypoints[t][1],
    }));
    const { error } = await supabase.from("mission_waypoints").upsert(rows, { onConflict: "mission_name,waypoint_type" });
    if (error) console.error("Gagal upsert mission_waypoints:", error);
  };

  const refreshTrack = () => {
    setMapState((prev) => ({ ...prev, is_refreshed: true }));
    // reset flag so it can be refreshed again
    setTimeout(() => {
      setMapState((prev) => ({ ...prev, is_refreshed: false }));
    }, 100);
  };

  const startEditCenter = () => {
    setCenterEditMode(true);
    const c = centers[viewType] ?? fallbackCenters[viewType];
    setCenterDraft([c[0], c[1]]);
  };

  const confirmCenter = async () => {
    if (!centerDraft) return;
    const [lat, lon] = centerDraft;
    const lintasan = viewType;
    const { error } = await supabase.from("Center_Lintasan").upsert({ Lintasan: lintasan, Latitude: lat, Longititude: lon }, { onConflict: "Lintasan" });
    if (error) { console.error("Gagal update Center_Lintasan:", error); return; }

    const newCenter: [number, number] = [lat, lon];
    setCenters((prev) => ({ ...prev, [lintasan]: newCenter }));
    setMissionWaypoints((prev) => ({ ...prev, [lintasan]: makeDefaultWaypoints(newCenter) }));
    setCenterEditMode(false);
    setCenterDraft(null);
  };

  const mapStateMemo = useMemo(() => mapState, [mapState]);
  const routeLabel = activeRoute === "A" ? "Lintasan A" : "Lintasan B";

  return (
    <section className="flex min-w-0 flex-col border border-white/10 bg-surface-strong shadow-[0_0_0_1px_rgba(26,58,56,0.28)_inset]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-[1.05rem] text-kapur-muda">Real-Time Map</h2>
        </div>

        <div className="flex gap-2 text-sm">
          {!centerEditMode ? (
            <button
              className="inline-flex items-center justify-center rounded-sm text-sm transition-colors border border-white/10 text-kapur-muda/80 hover:bg-white/5 px-3 py-1.5 gap-2"
              onClick={startEditCenter}
            >
              <PenTool className="h-3 w-3" />
              <span className="hidden sm:inline">Set Origin</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center rounded-sm text-sm transition-colors bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 gap-2"
                onClick={confirmCenter}
              >
                <Check className="h-3 w-3" />
                <span>Confirm</span>
              </button>
              <button
                className="inline-flex items-center justify-center rounded-sm text-sm transition-colors border border-white/10 text-kapur-muda/80 hover:bg-white/5 px-3 py-1.5 gap-2"
                onClick={() => {
                  setCenterEditMode(false);
                  setCenterDraft(null);
                }}
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          <div className="w-px h-6 bg-white/10 my-auto mx-2" />

          <button
            type="button"
            onClick={() => onRouteChange("A")}
            className={`border px-4 py-1.5 transition-colors ${
              activeRoute === "A"
                ? "border-lime-neon bg-lime-neon text-midnight-hitam"
                : "border-white/10 text-kapur-muda/80 hover:bg-white/5"
            }`}
          >
            Lintasan A
          </button>
          <button
            type="button"
            onClick={() => onRouteChange("B")}
            className={`border px-4 py-1.5 transition-colors ${
              activeRoute === "B"
                ? "border-lime-neon bg-lime-neon text-midnight-hitam"
                : "border-white/10 text-kapur-muda/80 hover:bg-white/5"
            }`}
          >
            Lintasan B
          </button>
        </div>
      </div>

      <div className="relative flex min-h-[calc(100vh-13rem)] flex-1 overflow-hidden bg-[#dfeccf] p-5">
        <div id="map-wrapper" className="absolute inset-5 border border-white/30 z-10">
          <MapLeaflet
            supabase={supabase}
            navData={navData}
            cogData={cogData}
            mapState={mapStateMemo}
            centers={centers}
            missionWaypoints={missionWaypoints}
            centerEditMode={centerEditMode}
            centerDraft={centerDraft}
            onCenterDraftChange={(lat, lng) => setCenterDraft([lat, lng])}
            onWaypointsChange={handleWaypointsChange}
          />
        </div>
        
        <div className="absolute left-8 top-8 z-20 inline-flex bg-lime-neon px-3 py-1 text-sm text-midnight-hitam shadow-[0_0_0_1px_rgba(1,9,11,0.05)_inset]">
          {routeLabel}
        </div>

        {/* Map controls bottom left */}
        <div className="absolute bottom-8 left-8 z-20 flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-sm text-black hover:bg-white/90 h-10 px-4 transition-colors border border-black/10 bg-white shadow-md gap-2"
            onClick={refreshTrack}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-semibold">Reset Track</span>
          </button>

          <button
            className="inline-flex items-center justify-center rounded-sm text-black hover:bg-white/90 h-10 w-10 transition-colors border border-black/10 bg-white shadow-md"
            title="Toggle Fullscreen"
            onClick={() => {
              const mapEl = document.getElementById("map-wrapper");
              if (!document.fullscreenElement && mapEl) {
                mapEl.requestFullscreen();
              } else if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }}
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
