"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

interface DataPoint {
  day: string;
  count: number;
}

interface Props {
  data: DataPoint[];
  loading?: boolean;
}

function formatDay(day: string) {
  try {
    return new Date(day).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  } catch {
    return day;
  }
}

export function GrowthChart({ data, loading }: Props) {
  const t = useTranslations("admin.dashboard.growth");

  if (loading) {
    return <div className="h-40 sm:h-48 w-full animate-pulse rounded bg-muted" />;
  }

  if (!data.length) {
    return (
      <div className="h-40 sm:h-48 flex items-center justify-center text-sm text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  const formatted = data.map((d) => ({ ...d, label: formatDay(d.day) }));

  return (
    <ResponsiveContainer width="100%" height={192}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(value: unknown) => [value as number, t("newUsers")]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
