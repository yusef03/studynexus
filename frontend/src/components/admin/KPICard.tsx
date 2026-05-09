"use client";

import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: number; // positive = up, negative = down, undefined = neutral
  loading?: boolean;
  className?: string;
}

export function KPICard({ label, value, sub, icon: Icon, trend, loading, className }: Props) {
  return (
    <div className={`rounded-lg border bg-card p-4 sm:p-5 space-y-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {(sub || trend !== undefined) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {trend !== undefined && (
                <span
                  className={
                    trend > 0
                      ? "flex items-center gap-0.5 text-emerald-600"
                      : trend < 0
                      ? "flex items-center gap-0.5 text-red-500"
                      : ""
                  }
                >
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : trend < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {trend > 0 ? "+" : ""}
                  {trend}%
                </span>
              )}
              {sub && <span>{sub}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
