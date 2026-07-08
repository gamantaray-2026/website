"use client";

import { supabase } from "@/lib/supabaseClient";
import { Check, PenTool, RefreshCw, X, Maximize, Minimize, Map, Navigation, Target } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CogData, MapState, NavData, Waypoints, WaypointType } from "./MapLeaflet";
import type { DashboardRoute } from "./types";

const MapLeaflet = dynamic(() => import("./MapLeaflet"), { ssr: false });

const MISSION_NAMES = ["lintasan1", "lintasan2"] as const;
type MissionName = (typeof MISSION_NAMES)[number];

const waypointTypes: WaypointType[] = ["start", "buoys", "finish", "image_surface", "image_underwater"];

const fallbackCenters: Record<MissionName, [number, number]> = {
  lintasan1: [-7.769386, 110.382935], // Wisdom Park
  lintasan2: [-7.769617, 110.382935], // Wisdom Park
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
  role?: "admin" | "viewer";
};

export function MapPanel({ activeRoute, onRouteChange, role = "viewer" }: MapPanelProps) {
  const [navData, setNavData] = useState<NavData | null>(null);
  const [cogData, setCogData] = useState<CogData | null>(null);
  const [latestImages, setLatestImages] = useState<{ [key: string]: string }>({});
  const [isSignalLost, setIsSignalLost] = useState(false);
  const [rosConnected, setRosConnected] = useState(false);
  const rosLastUpdateRef = useRef(0);
  const ROS_STALE_MS = 5000;

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
  const [mapCommand, setMapCommand] = useState<{ id: number; type: "ship" | "arena" } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
      const { data: cData } = await supabase.from("Center_Lintasan").select("*");
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
    const navCh = supabase.channel("gps_logs_changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "nav_data" }, (payload) => {
      if (Date.now() - rosLastUpdateRef.current > ROS_STALE_MS) setNavData(payload.new as any);
    }).subscribe();
    const cogCh = supabase.channel("cog_data_changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "cog_data" }, (payload) => {
      if (Date.now() - rosLastUpdateRef.current > ROS_STALE_MS) setCogData(payload.new as any);
    }).subscribe();
    const imgCh = supabase.channel("image_mission_changes").on("postgres_changes", { event: "INSERT", schema: "public", table: "image_mission" }, (payload) => {
      const newRow = payload.new as any;
      setLatestImages((prev) => ({ ...prev, [newRow.image_slot_name]: newRow.image_url }));
    }).subscribe();

    return () => { supabase.removeChannel(navCh); supabase.removeChannel(cogCh); supabase.removeChannel(imgCh); };
  }, []);

  // ROS Integration via rosbridge_server with auto-reconnect
  useEffect(() => {
    let ros: any = null;
    let gpsTopic: any = null;
    let headingTopic: any = null;
    let sogTopic: any = null;
    let cogTopic: any = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let reconnectScheduled = false;
    const MAX_RECONNECT_DELAY = 30000;
    const MIN_RECONNECT_DELAY = 2000;

    const scheduleReconnect = () => {
      if (reconnectScheduled) return;
      reconnectScheduled = true;
      const delay = Math.min(MIN_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
      reconnectAttempts++;
      console.log(`[ROS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
      reconnectTimer = setTimeout(() => {
        reconnectScheduled = false;
        initRos();
      }, delay);
    };

    const cleanupTopics = () => {
      if (gpsTopic) { try { gpsTopic.unsubscribe(); } catch {} }
      if (headingTopic) { try { headingTopic.unsubscribe(); } catch {} }
      if (sogTopic) { try { sogTopic.unsubscribe(); } catch {} }
      if (cogTopic) { try { cogTopic.unsubscribe(); } catch {} }
      gpsTopic = null;
      headingTopic = null;
      sogTopic = null;
      cogTopic = null;
    };

    async function initRos() {
      try {
        cleanupTopics();
        if (ros) { try { ros.close(); } catch {} }

        const ROSLIBModule = await import("roslib");
        const ROSLIB = (ROSLIBModule as any).default || ROSLIBModule;

        ros = new ROSLIB.Ros({ url: "ws://localhost:9090" });

        ros.on("connection", () => {
          console.log("[ROS] Connected to rosbridge websocket server.");
          setRosConnected(true);
          reconnectAttempts = 0;
          reconnectScheduled = false;

          gpsTopic = new ROSLIB.Topic({
            ros, name: "/mavros/global_position/global",
            messageType: "sensor_msgs/NavSatFix",
          });
          gpsTopic.subscribe((message: any) => {
            rosLastUpdateRef.current = Date.now();
            setNavData((prev: any) => ({
              ...prev,
              latitude: message.latitude,
              longitude: message.longitude,
              timestamp: new Date().toISOString(),
              sog_ms: prev?.sog_ms ?? 2.0,
            }));
          });

          headingTopic = new ROSLIB.Topic({
            ros, name: "/mavros/global_position/compass_hdg",
            messageType: "std_msgs/Float64",
          });
          headingTopic.subscribe((message: any) => {
            rosLastUpdateRef.current = Date.now();
            setCogData((prev: any) => ({
              ...prev,
              cog: message.data,
              timestamp: new Date().toISOString(),
            }));
          });

          sogTopic = new ROSLIB.Topic({
            ros, name: "/nav/sog_ms",
            messageType: "std_msgs/Float32",
          });
          sogTopic.subscribe((message: any) => {
            rosLastUpdateRef.current = Date.now();
            setNavData((prev: any) => ({
              ...prev,
              sog_ms: message.data,
              timestamp: new Date().toISOString(),
            }));
          });

          cogTopic = new ROSLIB.Topic({
            ros, name: "/nav/cog_deg",
            messageType: "std_msgs/Float32",
          });
          cogTopic.subscribe((message: any) => {
            rosLastUpdateRef.current = Date.now();
            setCogData((prev: any) => ({
              ...prev,
              cog: message.data,
              timestamp: new Date().toISOString(),
            }));
          });
        });

        ros.on("error", (error: any) => {
          if (reconnectAttempts === 0) {
            console.warn("[ROS] rosbridge not reachable, will keep retrying...");
          }
          if (rosConnected) {
            setRosConnected(false);
            cleanupTopics();
          }
          scheduleReconnect();
        });

        ros.on("close", () => {
          console.log("[ROS] Connection closed.");
          setRosConnected(false);
          cleanupTopics();
          scheduleReconnect();
        });
      } catch (e) {
        console.warn("[ROS] Init error:", e);
        setRosConnected(false);
        scheduleReconnect();
      }
    }

    initRos();

    return () => {
      reconnectScheduled = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      cleanupTopics();
      if (ros) { try { ros.close(); } catch {} }
    };
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
    const oldWaypoints = missionWaypoints[missionType];
    const changedType = waypointTypes.find((t) => {
      if (!oldWaypoints) return true;
      return oldWaypoints[t][0] !== newWaypoints[t][0] || oldWaypoints[t][1] !== newWaypoints[t][1];
    });
    setMissionWaypoints((prev) => ({ ...prev, [missionType]: newWaypoints }));
    if (changedType) {
      const { error } = await supabase.from("mission_waypoints").upsert(
        { mission_name: missionType, waypoint_type: changedType,
          latitude: newWaypoints[changedType][0], longitude: newWaypoints[changedType][1] },
        { onConflict: "mission_name,waypoint_type" }
      );
      if (error) console.error("Gagal upsert mission_waypoints:", error);
    }
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
    <section className="flex min-w-0 flex-1 flex-col h-full border border-border bg-surface-strong shadow-[0_0_0_1px_var(--border)_inset]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border px-4 sm:px-5 py-4 gap-3 sm:gap-0">
        <div className="flex items-center gap-2.5">
          <Map className="h-4 w-4 text-lime-neon" />
          <h2 className="text-[1.05rem] text-kapur-muda font-medium tracking-wide">Real-Time Map</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {role === "admin" && !centerEditMode ? (
            <button
              className="inline-flex items-center justify-center rounded-sm text-sm transition-colors border border-border text-kapur-muda/80 hover:bg-foreground/5 px-3 py-1.5 gap-2"
              onClick={startEditCenter}
            >
              <PenTool className="h-3 w-3" />
              <span className="hidden sm:inline">Set Origin</span>
            </button>
          ) : role === "admin" && centerEditMode ? (
            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center rounded-sm text-sm transition-colors bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 gap-2"
                onClick={confirmCenter}
              >
                <Check className="h-3 w-3" />
                <span>Confirm</span>
              </button>
              <button
                className="inline-flex items-center justify-center rounded-sm text-sm transition-colors border border-border text-kapur-muda/80 hover:bg-foreground/5 px-3 py-1.5 gap-2"
                onClick={() => {
                  setCenterEditMode(false);
                  setCenterDraft(null);
                }}
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            </div>
          ) : null}

          <div className="w-px h-6 bg-foreground/10 my-auto mx-2" />

          <button
            type="button"
            onClick={() => onRouteChange("A")}
            className={`border px-4 py-1.5 transition-colors ${
              activeRoute === "A"
                ? "border-lime-neon bg-lime-neon text-midnight-hitam"
                : "border-border text-kapur-muda/80 hover:bg-foreground/5"
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
                : "border-border text-kapur-muda/80 hover:bg-foreground/5"
            }`}
          >
            Lintasan B
          </button>
        </div>
      </div>

      <div id="map-fullscreen-container" className="relative flex min-h-[400px] flex-1 overflow-hidden bg-[#dfeccf] xl:min-h-0">
        <div className="absolute inset-0 z-10">
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
            mapCommand={mapCommand}
            role={role}
          />
        </div>
        
        <div className="absolute right-3 top-3 z-20 flex gap-2 items-start">
          <div className="inline-flex rounded-sm bg-lime-neon px-2 py-1 h-8 items-center text-xs font-bold tracking-widest text-midnight-hitam shadow-md">
            {routeLabel}
          </div>
          <button
            className="inline-flex items-center justify-center rounded-md text-black hover:bg-slate-50 h-8 w-8 transition-colors border border-black/10 bg-white shadow-lg"
            title="Toggle Fullscreen"
            onClick={() => {
              const mapEl = document.getElementById("map-fullscreen-container");
              if (!document.fullscreenElement && mapEl) {
                mapEl.requestFullscreen();
              } else if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Map controls bottom left */}
        <div className="absolute bottom-4 left-3 z-20 flex flex-col gap-2">
          <div className="flex flex-col rounded-md bg-white shadow-lg border border-black/10 overflow-hidden text-black w-[130px]">
            <button
              className="inline-flex items-center justify-start hover:bg-slate-50 h-8 px-3 transition-colors gap-2"
              onClick={() => setMapCommand({ id: Date.now(), type: "ship" })}
              title="Locate Kapal"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Kapal</span>
            </button>
            <div className="h-px w-full bg-black/10" />
            <button
              className="inline-flex items-center justify-start hover:bg-slate-50 h-8 px-3 transition-colors gap-2"
              onClick={() => setMapCommand({ id: Date.now(), type: "arena" })}
              title="Center Arena"
            >
              <Target className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Arena</span>
            </button>
            <div className="h-px w-full bg-black/10" />
            <button
              className="inline-flex items-center justify-start hover:bg-slate-50 h-8 px-3 transition-colors gap-2"
              onClick={refreshTrack}
              title="Reset Track"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

