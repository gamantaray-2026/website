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

        <div className="flex flex-col xl:flex-row flex-1 gap-5 pt-5 xl:min-h-0">
          <div className="order-2 xl:order-1 flex w-full xl:w-[340px] shrink-0 flex-col min-h-0">
            <NavigationPanel
              activeStepId={activeMissionStepId}
              onStepChange={setActiveMissionStepId}
              role={role}
            />
          </div>
          <div className="order-1 xl:order-2 flex flex-1 flex-col min-h-[500px] xl:min-h-0">
            <MapPanel activeRoute={activeRoute} onRouteChange={setActiveRoute} role={role} />
          </div>
          <div className="order-3 xl:order-3 flex w-full xl:w-[340px] shrink-0 flex-col min-h-0">
            <CameraFeedsPanel
              selectedFeedTitle={selectedCameraFeed}
              onFeedSelect={setSelectedCameraFeed}
            />
          </div>
        </div>

        
        <footer className="mt-5 shrink-0 border-t border-border pt-4 pb-1 text-center text-sm font-medium tracking-wide text-sage-dingin">
          Copyright &copy; {new Date().getFullYear()} Safinah One Gamantaray Universitas Gadjah Mada
        </footer>
      </div>
    </main>
  );
}
