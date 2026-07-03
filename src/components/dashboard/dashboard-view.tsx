"use client";

import { useState } from "react";

import { CameraFeedsPanel } from "./camera-feeds-panel";
import { DashboardHeader } from "./dashboard-header";
import { MapPanel } from "./map-panel";
import { NavigationPanel } from "./navigation-panel";
import type { DashboardRoute } from "./types";

export function DashboardView({ forceRole }: { forceRole?: "admin" | "viewer" }) {
  const [activeRoute, setActiveRoute] = useState<DashboardRoute>("A");
  const [activeMissionStepId, setActiveMissionStepId] = useState("01");
  const [selectedCameraFeed, setSelectedCameraFeed] = useState("SL");
  const [role, setRole] = useState<"admin" | "viewer">(forceRole ?? "viewer");

  return (
    <main className="min-h-screen w-full overflow-y-auto overflow-x-hidden bg-background text-foreground xl:h-screen xl:w-screen xl:overflow-hidden">
      <div className="mx-auto flex h-full min-h-screen max-w-[1920px] flex-col px-5 pb-5 pt-4 sm:px-6 lg:px-7 xl:min-h-0">
        <DashboardHeader role={role} onRoleChange={setRole} hideToggle={!!forceRole} />

        <div className="grid flex-1 gap-5 pt-5 xl:min-h-0 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <NavigationPanel
            activeStepId={activeMissionStepId}
            onStepChange={setActiveMissionStepId}
            role={role}
          />
          <MapPanel activeRoute={activeRoute} onRouteChange={setActiveRoute} role={role} />
          <CameraFeedsPanel
            selectedFeedTitle={selectedCameraFeed}
            onFeedSelect={setSelectedCameraFeed}
          />
        </div>

        
        <footer className="mt-5 shrink-0 border-t border-border pt-4 pb-1 text-center text-sm font-medium tracking-wide text-sage-dingin">
          Copyright &copy; {new Date().getFullYear()} Safinah One Gamantaray Universitas Gadjah Mada
        </footer>
      </div>
    </main>
  );
}
