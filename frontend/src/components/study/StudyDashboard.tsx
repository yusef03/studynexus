"use client";

import { useState } from "react";
import { StatsCard } from "@/components/study/StatsCard";
import { ModuleList } from "@/components/study/ModuleList";

export function StudyDashboard() {
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  return (
    <>
      <StatsCard refreshKey={statsRefreshKey} />
      <ModuleList onModuleSaved={() => setStatsRefreshKey((k) => k + 1)} />
    </>
  );
}
