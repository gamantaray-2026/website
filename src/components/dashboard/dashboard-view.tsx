"use client";

import { useState } from "react";

import { CameraFeedsPanel } from "./camera-feeds-panel";
import { DashboardHeader } from "./dashboard-header";
import { MapPanel } from "./map-panel";
import { NavigationPanel } from "./navigation-panel";
import type { DashboardRoute } from "./types";

export function DashboardView() {
  const [activeRoute, setActiveRoute] = useState<DashboardRoute>("A");
  const [activeMissionStepId, setActiveMissionStepId] = useState("01");
  const [selectedCameraFeed, setSelectedCameraFeed] = useState("SL");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col px-5 pb-5 pt-4 sm:px-6 lg:px-7">
        <DashboardHeader />

        <div className="grid flex-1 gap-5 pt-5 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <NavigationPanel
            activeStepId={activeMissionStepId}
            onStepChange={setActiveMissionStepId}
          />
          <MapPanel activeRoute={activeRoute} onRouteChange={setActiveRoute} />
          <CameraFeedsPanel
            selectedFeedTitle={selectedCameraFeed}
            onFeedSelect={setSelectedCameraFeed}
          />
        </div>

        
        <footer className="mt-5 border-t border-white/10 pt-4 text-center text-sm font-medium tracking-wide text-sage-dingin">
          Copyright &copy; {new Date().getFullYear()} Safinah One Gamantaray Universitas Gadjah Mada
        </footer>
      </div>
    </main>
  );
}
