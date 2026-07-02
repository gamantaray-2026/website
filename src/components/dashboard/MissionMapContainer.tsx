"use client";

import { supabase } from "@/lib/supabaseClient";
import {
  Check,
  Clock,
  Compass,
  Gauge,
  Grid3x3,
  MapPin,
  Maximize,
  Maximize2,
  Navigation,
  PenTool,
  RefreshCw,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type {
  CogData,
  MapState,
  NavData,
  Waypoints,
  WaypointType,
} from "./MapLeaflet";

const MapLeaflet = dynamic(() => import("./MapLeaflet"), { ssr: false });

const MISSION_NAMES = ["lintasan1", "lintasan2"] as const;
type MissionName = (typeof MISSION_NAMES)[number];

const waypointTypes: WaypointType[] = [
  "start",
  "buoys",
  "finish",
  "image_surface",
  "image_underwater",
];

const fallbackCenters: Record<MissionName, [number, number]> = {
  lintasan1: [-7.9154834, 112.5891244],
  lintasan2: [-7.9150524, 112.5888965],
};

function makeDefaultWaypoints(center: [number, number]): Waypoints {
  return {
    start: center,
    buoys: center,
    finish: center,
    image_surface: center,
    image_underwater: center,
  };
}

function ensureWaypoints(
  wp: Partial<Waypoints> | undefined,
  center: [number, number]
): Waypoints {
  const base = wp ?? {};
  return {
    start: base.start ?? center,
    buoys: base.buoys ?? center,
    finish: base.finish ?? center,
    image_surface: base.image_surface ?? center,
    image_underwater: base.image_underwater ?? center,
  };
}

export default function MissionMapContainer() {
  const [navData, setNavData] = useState<NavData | null>(null);
  const [cogData, setCogData] = useState<CogData | null>(null);
  const [latestImages, setLatestImages] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSignalLost, setIsSignalLost] = useState(false);

  const [centers, setCenters] = useState<Record<string, [number, number]>>({
    ...fallbackCenters,
  });

  const [missionWaypoints, setMissionWaypoints] = useState<
    Record<string, Waypoints>
  >(() => {
    const init: Record<string, Waypoints> = {};
    MISSION_NAMES.forEach(
      (m) => (init[m] = makeDefaultWaypoints(fallbackCenters[m]))
    );
    return init;
  });

  const [mapState, setMapState] = useState<MapState>({
    view_type: "lintasan1",
    is_refreshed: false,
  });

  // center edit
  const [centerEditMode, setCenterEditMode] = useState(false);
  const [centerDraft, setCenterDraft] = useState<[number, number] | null>(null);

  const viewType = mapState.view_type;

  // Update waypoints when centers change
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
      // centers
      const { data: cData } = await supabase
        .from("Center_Lintasan")
        .select('"Lintasan","Latitude","Longititude"');
      if (cData) {
        const next: Record<string, [number, number]> = { ...fallbackCenters };
        cData.forEach((row: any) => {
          if (row.Latitude != null && row.Longititude != null)
            next[row.Lintasan] = [row.Latitude, row.Longititude];
        });
        setCenters(next);
      }

      // waypoints
      const { data: wData } = await supabase
        .from("mission_waypoints")
        .select("mission_name, waypoint_type, latitude, longitude");

      if (wData) {
        const partial: Record<string, Partial<Waypoints>> = {};
        for (const row of wData as any[]) {
          partial[row.mission_name] ??= {};
          partial[row.mission_name]![row.waypoint_type as WaypointType] = [
            row.latitude,
            row.longitude,
          ];
        }

        const nextWp: Record<string, Waypoints> = {};
        MISSION_NAMES.forEach((m) => {
          const c = (nextWp[m] ? nextWp[m].start : fallbackCenters[m]) as [
            number,
            number
          ];
          const c2 = (centers[m] ?? fallbackCenters[m]) as [number, number];
          nextWp[m] = ensureWaypoints(partial[m], c2 ?? c);
        });
        setMissionWaypoints(nextWp);
      }

      // nav latest
      const { data: nav } = await supabase
        .from("nav_data")
        .select("latitude, longitude, timestamp, sog_ms")
        .order("timestamp", { ascending: false })
        .limit(1);
      setNavData((nav?.[0] ?? null) as any);

      // cog latest
      const { data: cog } = await supabase
        .from("cog_data")
        .select("cog, timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);
      setCogData((cog?.[0] ?? null) as any);

      // images
      const { data: imgData } = await supabase
        .from("image_mission")
        .select("image_url, image_slot_name")
        .order("created_at", { ascending: false })
        .limit(10); // Get last 10 to likely cover both slots

      if (imgData) {
        const imgs: { [key: string]: string } = {};
        imgData.forEach((row: any) => {
          // Only set if not already set (simple way to get latest unique)
          // or just rely on the order.
          // Better: fetch distinct on slot if possible, or just parse locally.
          if (!imgs[row.image_slot_name]) {
            imgs[row.image_slot_name] = row.image_url;
          }
        });
        setLatestImages(imgs);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // realtime nav/cog
  useEffect(() => {
    const navCh = supabase
      .channel("gps_logs_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nav_data" },
        (payload) => {
          setNavData(payload.new as any);
        }
      )
      .subscribe();

    const cogCh = supabase
      .channel("cog_data_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cog_data" },
        (payload) => {
          setCogData(payload.new as any);
        }
      )
      .subscribe();

    const imgCh = supabase
      .channel("image_mission_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "image_mission" },
        (payload) => {
          const newRow = payload.new as any;
          setLatestImages((prev) => ({
            ...prev,
            [newRow.image_slot_name]: newRow.image_url,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(navCh);
      supabase.removeChannel(cogCh);
      supabase.removeChannel(imgCh);
    };
  }, []);

  // Check signal loss
  useEffect(() => {
    const checkSignal = () => {
      if (!navData?.timestamp) {
         setIsSignalLost(true);
         return;
      }
      const lastUpdate = new Date(navData.timestamp).getTime();
      const now = Date.now();
      // If older than 10 seconds, consider lost
      if (now - lastUpdate > 10000) {
        setIsSignalLost(true);
      } else {
        setIsSignalLost(false);
      }
    };

    const interval = setInterval(checkSignal, 2000);
    checkSignal(); // initial check

    return () => clearInterval(interval);
  }, [navData]);

  // drag waypoint -> upsert
  const handleWaypointsChange = async (
    missionType: string,
    newWaypoints: Waypoints
  ) => {
    setMissionWaypoints((prev) => ({ ...prev, [missionType]: newWaypoints }));

    const rows = waypointTypes.map((t) => ({
      mission_name: missionType,
      waypoint_type: t,
      latitude: newWaypoints[t][0],
      longitude: newWaypoints[t][1],
    }));

    const { error } = await supabase.from("mission_waypoints").upsert(rows, {
      onConflict: "mission_name,waypoint_type",
    });

    if (error) console.error("Gagal upsert mission_waypoints:", error);
  };

  const setLintasan = (m: MissionName) =>
    setMapState({ view_type: m, is_refreshed: false });
  const refreshTrack = () =>
    setMapState((prev) => ({ ...prev, is_refreshed: true }));

  const startEditCenter = () => {
    setCenterEditMode(true);
    const c = centers[viewType] ?? fallbackCenters[viewType];
    setCenterDraft([c[0], c[1]]);
  };

  const confirmCenter = async () => {
    if (!centerDraft) return;

    const [lat, lon] = centerDraft;
    const lintasan = viewType;

    const { error } = await supabase
      .from("Center_Lintasan")
      .upsert(
        { Lintasan: lintasan, Latitude: lat, Longititude: lon },
        { onConflict: "Lintasan" }
      );

    if (error) {
      console.error("Gagal update Center_Lintasan:", error);
      return;
    }

    const newCenter: [number, number] = [lat, lon];
    setCenters((prev) => ({ ...prev, [lintasan]: newCenter }));

    // Reset all waypoints to new center
    setMissionWaypoints((prev) => ({
      ...prev,
      [lintasan]: makeDefaultWaypoints(newCenter),
    }));

    setCenterEditMode(false);
    setCenterDraft(null);
  };

  const mapStateMemo = useMemo(() => mapState, [mapState]);

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white relative h-full">
      <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-normal tracking-tight text-black">
            Real-Time Map
          </h2>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500 ${
              isSignalLost
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            }`}
          >
            <div className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSignalLost ? "bg-red-400" : "bg-emerald-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSignalLost ? "bg-red-500" : "bg-emerald-500"
                }`}
              ></span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isSignalLost ? "Signal Lost" : "Live Link"}
            </span>
          </div>
        </div>

        {!centerEditMode ? (
          <button
            className="group inline-flex items-center justify-center rounded-lg text-sm font-bold transition-colors border border-gray-300 bg-white hover:bg-gray-100 text-black h-10 px-4 gap-2"
            onClick={startEditCenter}
          >
            <PenTool className="h-4 w-4" />
            <span className="hidden sm:inline">Set Origin</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="inline-flex items-center justify-center rounded-lg text-sm font-bold transition-colors bg-green-600 hover:bg-green-700 text-white h-10 px-4 gap-2"
              onClick={confirmCenter}
            >
              <Check className="h-4 w-4" />
              <span>Confirm</span>
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg text-sm font-bold transition-colors border border-gray-300 bg-white hover:bg-gray-100 text-black h-10 px-4 gap-2"
              onClick={() => {
                setCenterEditMode(false);
                setCenterDraft(null);
              }}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[400px] relative overflow-hidden">
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
          mapCommand={null}
        />
      </div>

      <div className="border-t border-gray-300 p-5 flex gap-4 bg-white">
        <div className="flex-1 flex gap-2">
          <button
            className={`flex-1 inline-flex items-center justify-center rounded-full text-sm font-bold transition-colors h-12 px-6 border ${
              viewType === "lintasan1"
                ? "bg-black border-black text-white"
                : "bg-white border-gray-300 text-black hover:bg-gray-100"
            }`}
            onClick={() => setLintasan("lintasan1")}
          >
            <span>Lintasan A</span>
          </button>

          <button
            className={`flex-1 inline-flex items-center justify-center rounded-full text-sm font-bold transition-colors h-12 px-6 border ${
              viewType === "lintasan2"
                ? "bg-black border-black text-white"
                : "bg-white border-gray-300 text-black hover:bg-gray-100"
            }`}
            onClick={() => setLintasan("lintasan2")}
          >
            <span>Lintasan B</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-full text-sm font-bold transition-colors border border-gray-300 bg-white hover:bg-gray-100 text-black h-12 px-5 gap-2"
            onClick={refreshTrack}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden md:inline">Reset Track</span>
          </button>

          <button
            className="inline-flex items-center justify-center rounded-full text-black hover:bg-gray-100 h-12 w-12 transition-colors border border-gray-300 bg-white"
            title="Toggle Grid"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>

          <button
            className="inline-flex items-center justify-center rounded-full text-black hover:bg-gray-100 h-12 w-12 transition-colors border border-gray-300 bg-white"
            title="Toggle Fullscreen"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                if (document.exitFullscreen) {
                  document.exitFullscreen();
                }
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
