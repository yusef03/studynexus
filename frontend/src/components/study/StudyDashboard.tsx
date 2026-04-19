"use client";

import { useState, useCallback } from "react";
import { StatsCard } from "@/components/study/StatsCard";
import { ModuleList } from "@/components/study/ModuleList";

export function StudyDashboard() {
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const handleModuleSaved = useCallback(() => {
    setStatsRefreshKey((k) => k + 1);
  }, []);

  return (
    <>
      <StatsCard refreshKey={statsRefreshKey} />
      <ModuleList onModuleSaved={handleModuleSaved} />
    </>
  );
}
