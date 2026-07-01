"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import L, { LayerGroup } from "leaflet";
import "leaflet-rotate";
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type NavData = {
  latitude: number;
  longitude: number;
  sog?: number;
  sog_ms?: number;
  timestamp?: string;
};
export type CogData = { cog: number };

export type MapState = {
  view_type: "lintasan1" | "lintasan2";
  is_refreshed: boolean;
};

export type WaypointType =
  | "start"
  | "buoys"
  | "finish"
  | "image_surface"
  | "image_underwater";

export type Waypoints = Record<WaypointType, [number, number]>;

type MissionConfig = { latLabels: string[]; lonLabels: string[] };

const MISSION_LABELS: Record<string, MissionConfig> = {
  lintasan1: {
    latLabels: ["5", "4", "3", "2", "1"],
    lonLabels: ["A", "B", "C", "D", "E"],
  },
  lintasan2: {
    latLabels: ["5", "4", "3", "2", "1"],
    lonLabels: ["E", "D", "C", "B", "A"],
  },
};

const GRID_BEARING_DEG = 0;
const MAP_BEARING_DEG = 0;

const redBuoyIcon = L.icon({
  iconUrl: "/merah.png",
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});
const greenBuoyIcon = L.icon({
  iconUrl: "/hijau.png",
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});
const startIcon = L.icon({
  iconUrl: "/start.png",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});
const Object_surface = L.icon({
  iconUrl: "/atas.jpeg",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});
const Object_under = L.icon({
  iconUrl: "/bawah.png",
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});
const centerEditIcon = L.icon({
  iconUrl: "/ping.svg",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createShipIcon = (angleDeg: number): L.DivIcon =>
  L.divIcon({
    className: "ship-icon-wrapper",
    html: `
      <img src="/kapalasli3.png"
        style="width:50px;height:40px;transform:rotate(${angleDeg}deg);transform-origin:center;display:block;" />
    `,
    iconSize: [50, 40],
    iconAnchor: [25, 20],
  });

function metersOffsetToLatLng(
  center: [number, number],
  dxMeters: number,
  dyMeters: number
): L.LatLng {
  const [lat, lon] = center;
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos((lat * Math.PI) / 180);
  const dLat = dyMeters / metersPerDegLat;
  const dLon = dxMeters / metersPerDegLon;
  return L.latLng(lat + dLat, lon + dLon);
}

function metersToLatLon(centerLat: number, meters: number) {
  const metersPerDegLat = 111320;
  const metersPerDegLon = 111320 * Math.cos((centerLat * Math.PI) / 180);
  return {
    dLat: meters / metersPerDegLat,
    dLon: meters / metersPerDegLon,
  };
}

export default function MapLeaflet({
  supabase,
  navData,
  cogData,
  mapState,
  centers,
  missionWaypoints,
  centerEditMode,
  centerDraft,
  onCenterDraftChange,
  onWaypointsChange,
}: {
  supabase: SupabaseClient;

  navData: NavData | null;
  cogData: CogData | null;
  mapState: MapState;

  centers: Record<string, [number, number]>;
  missionWaypoints: Record<string, Waypoints>;

  centerEditMode: boolean;
  centerDraft: [number, number] | null;
  onCenterDraftChange: (lat: number, lng: number) => void;

  onWaypointsChange: (missionType: string, newWaypoints: Waypoints) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);

  // untuk cancel async
  const runIdRef = useRef(0);

  // center yang dikunci
  const lockedCenterRef = useRef<[number, number]>([-7.7715, 110.3778]);

  const guardRef = useRef(false);

  // ship + track
  const shipMarkerRef = useRef<L.Marker | null>(null);
  const pathRef = useRef<L.Polyline | null>(null);
  const trackRef = useRef<[number, number][]>([]);

  // layers
  const waypointLayerRef = useRef<LayerGroup>(L.layerGroup());
  const buoyLayerRef = useRef<LayerGroup>(L.layerGroup());
  const gridLayersRef = useRef<Record<string, LayerGroup>>({
    lintasan1: L.layerGroup(),
    lintasan2: L.layerGroup(),
  });

  const centerMarkerRef = useRef<L.Marker | null>(null);

  const getCenter = (view: string) =>
    centers[view] ?? [-7.9154834, 112.5891244];

  /** KUNCI MAP TOTAL */
  const lockMapTotal = (map: L.Map) => {
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard?.disable?.();

    // rotate plugin handlers
    (map as any).dragRotate?.disable?.();
    (map as any).touchRotate?.disable?.();
    (map as any).rotate?.disable?.();
  };

  /** Bound super ketat supaya map tidak bisa pan sama sekali */
  const setTightBounds = (map: L.Map, center: [number, number]) => {
    const delta = metersToLatLon(center[0], 0.001); // 1mm cukup buat desktop
    const bounds = L.latLngBounds(
      [center[0] - delta.dLat, center[1] - delta.dLon],
      [center[0] + delta.dLat, center[1] + delta.dLon]
    );
    map.setMaxBounds(bounds);
    (map as any).options.maxBoundsViscosity = 1.0;
  };

  /** Hard lock: kalau map bergerak sedikit pun, balikin */
  const enforceHardLock = (map: L.Map) => {
    if (guardRef.current) return;

    const [lat0, lon0] = lockedCenterRef.current;
    const c = map.getCenter();

    // kalau sama, jangan ngulang
    const eps = 1e-12;
    if (Math.abs(c.lat - lat0) <= eps && Math.abs(c.lng - lon0) <= eps) return;

    guardRef.current = true;
    map.stop();
    map.setView([lat0, lon0], map.getZoom(), { animate: false });
    (map as any).setBearing?.(MAP_BEARING_DEG);
    guardRef.current = false;
  };

  /** Stop DOM event di marker biar map gak ikut drag */
  const stopMarkerDOM = (marker: L.Marker) => {
    requestAnimationFrame(() => {
      const el = marker.getElement();
      if (!el) return;

      // ini yang paling “keras” untuk desktop
      L.DomEvent.on(el, "mousedown", L.DomEvent.stop);
      L.DomEvent.on(el, "dblclick", L.DomEvent.stop);
      L.DomEvent.on(el, "click", L.DomEvent.stop);
      L.DomEvent.on(el, "contextmenu", L.DomEvent.stop);

      // tambahan (kadang membantu)
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    });
  };

  /** GRID */
  const drawGrid = (map: L.Map, missionType: string) => {
    const center = getCenter(missionType);
    const labels = MISSION_LABELS[missionType] ?? MISSION_LABELS.lintasan1;

    const layers =
      gridLayersRef.current[missionType] ??
      (gridLayersRef.current[missionType] = L.layerGroup());
    layers.clearLayers();

    const numDivisions = 5;
    const cellSizeM = 5;
    const totalSizeM = numDivisions * cellSizeM;
    const halfSizeM = totalSizeM / 2;

    const headingRad = (GRID_BEARING_DEG * Math.PI) / 180;
    const sinH = Math.sin(headingRad);
    const cosH = Math.cos(headingRad);

    const ux = sinH;
    const uy = cosH;
    const vx = -cosH;
    const vy = sinH;

    const toLatLng = (aMeters: number, bMeters: number) => {
      const dx = aMeters * ux + bMeters * vx;
      const dy = aMeters * uy + bMeters * vy;
      return metersOffsetToLatLng(center, dx, dy);
    };

    for (let row = 0; row <= numDivisions; row++) {
      const b = -halfSizeM + row * cellSizeM;
      L.polyline([toLatLng(-halfSizeM, b), toLatLng(+halfSizeM, b)], {
        color: "rgba(0,0,0,0.15)",
        weight: 1,
      }).addTo(layers);
    }
    for (let col = 0; col <= numDivisions; col++) {
      const a = -halfSizeM + col * cellSizeM;
      L.polyline([toLatLng(a, -halfSizeM), toLatLng(a, +halfSizeM)], {
        color: "rgba(0,0,0,0.15)",
        weight: 1,
      }).addTo(layers);
    }

    for (let row = 0; row < numDivisions; row++) {
      const b = -halfSizeM + (row + 0.5) * cellSizeM;
      for (let col = 0; col < numDivisions; col++) {
        const a = -halfSizeM + (col + 0.5) * cellSizeM;
        const cellCenter = toLatLng(a, b);
        const label = `${labels.lonLabels[col]}${labels.latLabels[row]}`;

        L.marker(cellCenter, {
          icon: L.divIcon({
            className:
              "bg-transparent text-center text-[18px] font-black text-black/30 tracking-tighter",
            html: label,
            iconAnchor: [15, 10],
          }),
          interactive: false,
        }).addTo(layers);
      }
    }

    layers.addTo(map);
  };

  /** WAYPOINTS */
  const drawWaypoints = (map: L.Map, missionType: string) => {
    waypointLayerRef.current.clearLayers();
    const wp = missionWaypoints[missionType];
    if (!wp) return;

    const addDrag = (key: WaypointType, icon: L.Icon, label: string) => {
      const marker = L.marker(wp[key], {
        icon,
        draggable: true,
        autoPan: false,
        bubblingMouseEvents: false,
      } as any)
        .addTo(waypointLayerRef.current)
        .bindPopup(label);

      marker.on("add", () => stopMarkerDOM(marker));

      marker.on("dragstart", () => {
        lockMapTotal(map);
        enforceHardLock(map);
      });

      marker.on("drag", () => {
        lockMapTotal(map);
        enforceHardLock(map);
      });

      marker.on("dragend", (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        onWaypointsChange(missionType, { ...wp, [key]: [lat, lng] });
        lockMapTotal(map);
        enforceHardLock(map);
      });
    };

    addDrag("start", startIcon, "Start");
    addDrag("image_surface", Object_surface, "Image Surface");
    addDrag("image_underwater", Object_under, "Image Underwater");

    waypointLayerRef.current.addTo(map);
  };

  /** BUOYS TABLE */
  const fetchBuoyData = async (map: L.Map, myRunId: number) => {
    if (runIdRef.current !== myRunId) return;
    if (!mapRef.current || mapRef.current !== map) return;

    if (!map.hasLayer(buoyLayerRef.current)) buoyLayerRef.current.addTo(map);
    buoyLayerRef.current.clearLayers();

    const { data: buoys, error } = await supabase
      .from("buoys")
      .select("id,color,latitude,longitude");

    if (runIdRef.current !== myRunId) return;
    if (!mapRef.current || mapRef.current !== map) return;

    if (error) {
      console.error("Failed to fetch buoy data:", error);
      return;
    }

    (buoys ?? []).forEach((buoy: any) => {
      if (runIdRef.current !== myRunId) return;
      if (!mapRef.current || mapRef.current !== map) return;

      const icon = buoy.color === "red" ? redBuoyIcon : greenBuoyIcon;

      const marker = L.marker([buoy.latitude, buoy.longitude], {
        icon,
        draggable: true,
        autoPan: false,
        bubblingMouseEvents: false,
      } as any)
        .addTo(buoyLayerRef.current)
        .bindPopup(`Pelampung ${buoy.color}`);

      marker.on("add", () => stopMarkerDOM(marker));

      marker.on("dragstart", () => {
        lockMapTotal(map);
        enforceHardLock(map);
      });

      marker.on("drag", () => {
        lockMapTotal(map);
        enforceHardLock(map);
      });

      marker.on("dragend", async () => {
        const { lat, lng } = marker.getLatLng();
        const { error: updateError } = await supabase
          .from("buoys")
          .update({ latitude: lat, longitude: lng })
          .eq("id", buoy.id);

        if (updateError)
          console.error("Gagal update posisi buoy:", updateError);

        lockMapTotal(map);
        enforceHardLock(map);
      });
    });
  };

  /** INIT MAP */
  useEffect(() => {
    if (mapRef.current) return;

    const myRunId = ++runIdRef.current;

    const initialCenter = getCenter("lintasan1");
    lockedCenterRef.current = initialCenter;

    const map = (L as any).map("map", {
      center: initialCenter,
      zoom: 21,
      zoomControl: false,

      dragging: false,
      inertia: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,

      rotate: true,
      bearing: 0,
      touchRotate: false,
      dragRotate: false,
      rotateControl: false,
    });

    mapRef.current = map;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
      { maxZoom: 22 }
    ).addTo(map);

    // ✅ bearing fixed 120°
    (map as any).setBearing?.(MAP_BEARING_DEG);

    waypointLayerRef.current.addTo(map);
    buoyLayerRef.current.addTo(map);

    drawGrid(map, "lintasan1");
    drawGrid(map, "lintasan2");

    // grid aktif sesuai lintasan sekarang
    Object.values(gridLayersRef.current).forEach((lg) => lg.remove());
    drawGrid(map, mapState.view_type);

    drawWaypoints(map, mapState.view_type);

    // kunci keras
    lockMapTotal(map);
    setTightBounds(map, initialCenter);
    enforceHardLock(map);

    // kalau ada move nyasar, balikin lagi
    map.on("movestart", () => enforceHardLock(map));
    map.on("move", () => enforceHardLock(map));

    fetchBuoyData(map, myRunId);

    const buoyCh = supabase
      .channel("buoys_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "buoys" },
        () => {
          if (mapRef.current && runIdRef.current === myRunId)
            fetchBuoyData(mapRef.current, myRunId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buoyCh);

      // invalidate async lama
      if (runIdRef.current === myRunId) runIdRef.current++;

      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** GANTI LINTASAN / CENTER */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const view = mapState.view_type;
    const center = getCenter(view);

    lockedCenterRef.current = center;

    map.setView(center, 21, { animate: false });
    (map as any).setBearing?.(MAP_BEARING_DEG);

    Object.values(gridLayersRef.current).forEach((lg) => lg.remove());
    drawGrid(map, view);

    lockMapTotal(map);
    setTightBounds(map, center);
    enforceHardLock(map);
  }, [mapState.view_type, centers]);

  /** WAYPOINT UPDATE (redraw marker doang) */
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    drawWaypoints(map, mapState.view_type);

    lockMapTotal(map);
    enforceHardLock(map);
    (map as any).setBearing?.(MAP_BEARING_DEG);
  }, [missionWaypoints, mapState.view_type]);

  /** refresh track */
  useEffect(() => {
    if (!mapRef.current) return;
    if (!mapState.is_refreshed) return;

    if (pathRef.current) {
      mapRef.current.removeLayer(pathRef.current);
      pathRef.current = null;
    }
    if (shipMarkerRef.current) {
      mapRef.current.removeLayer(shipMarkerRef.current);
      shipMarkerRef.current = null;
    }
    trackRef.current = [];

    lockMapTotal(mapRef.current);
    enforceHardLock(mapRef.current);
  }, [mapState.is_refreshed]);

  /** NAV TRACK */
  useEffect(() => {
    if (!mapRef.current || !navData) return;

    const map = mapRef.current;
    const pos: [number, number] = [navData.latitude, navData.longitude];

    if (!shipMarkerRef.current) {
      shipMarkerRef.current = L.marker(pos, {
        icon: createShipIcon(cogData?.cog ?? 0),
      }).addTo(map);
    } else {
      shipMarkerRef.current.setLatLng(pos);
    }

    trackRef.current.push(pos);
    if (trackRef.current.length >= 2) {
      if (!pathRef.current) {
        pathRef.current = L.polyline(trackRef.current, {
          color: "red",
          weight: 1,
          dashArray: "2,2",
        }).addTo(map);
      } else {
        pathRef.current.setLatLngs(trackRef.current);
      }
    }

    lockMapTotal(map);
    enforceHardLock(map);
    (map as any).setBearing?.(MAP_BEARING_DEG);
  }, [navData, cogData]);

  // rotasi kapal
  useEffect(() => {
    if (!shipMarkerRef.current || !cogData) return;
    shipMarkerRef.current.setIcon(
      createShipIcon(cogData.cog - MAP_BEARING_DEG)
    );
  }, [cogData]);

  /** CENTER MARKER */
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const view = mapState.view_type;
    const base = centerDraft
      ? L.latLng(centerDraft[0], centerDraft[1])
      : L.latLng(...getCenter(view));

    lockMapTotal(map);
    enforceHardLock(map);

    if (!centerEditMode) {
      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current);
        centerMarkerRef.current = null;
      }
      return;
    }

    if (!centerMarkerRef.current) {
      centerMarkerRef.current = L.marker(base, {
        draggable: true,
        icon: centerEditIcon,
        autoPan: false,
        bubblingMouseEvents: false,
      } as any)
        .addTo(map)
        .bindPopup("Geser marker untuk ubah center");

      centerMarkerRef.current.on("add", () =>
        stopMarkerDOM(centerMarkerRef.current!)
      );

      centerMarkerRef.current.on("dragstart", () => {
        lockMapTotal(map);
        enforceHardLock(map);
      });

      centerMarkerRef.current.on("drag", () => {
        lockMapTotal(map);
        enforceHardLock(map);
      });

      centerMarkerRef.current.on("dragend", (e) => {
        const { lat, lng } = (e.target as L.Marker).getLatLng();
        onCenterDraftChange(lat, lng);

        lockMapTotal(map);
        enforceHardLock(map);
      });
    } else {
      centerMarkerRef.current.setLatLng(base);
    }
  }, [
    centerEditMode,
    centerDraft,
    mapState.view_type,
    centers,
    onCenterDraftChange,
  ]);

  return <div id="map" className="h-full w-full rounded-lg border border-[#ccc]" />;
}
