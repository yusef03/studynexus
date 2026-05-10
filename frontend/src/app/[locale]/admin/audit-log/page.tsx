"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FileX2,
  Loader2,
  LogIn,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminAuditLog";
import type { AuditAction } from "@/types/admin";

// ── Action badge ─────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<
  AuditAction,
  { color: string; Icon: React.ElementType }
> = {
  CREATE:         { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",   Icon: FilePlus2 },
  UPDATE:         { color: "bg-blue-100  text-blue-800  dark:bg-blue-900/30  dark:text-blue-300",    Icon: Pencil },
  DELETE:         { color: "bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300",     Icon: Trash2 },
  ARCHIVE:        { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",   Icon: Archive },
  RESTORE:        { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300", Icon: RotateCcw },
  RESET_PASSWORD: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300", Icon: AlertTriangle },
  LOGIN:          { color: "bg-zinc-100  text-zinc-700  dark:bg-zinc-800     dark:text-zinc-300",    Icon: LogIn },
  IMPORT:         { color: "bg-cyan-100  text-cyan-800  dark:bg-cyan-900/30  dark:text-cyan-300",    Icon: Upload },
};

function ActionBadge({ action, label }: { action: string; label: string }) {
  const style = ACTION_STYLES[action as AuditAction] ?? {
    color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    Icon: FileX2,
  };
  const { Icon } = style;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${style.color}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ── Diff renderer ─────────────────────────────────────────────────────────────

function DiffBlock({
  old_value,
  new_value,
  tOld,
  tNew,
}: {
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  tOld: string;
  tNew: string;
}) {
  if (!old_value && !new_value) return null;
  const keys = Array.from(
    new Set([
      ...Object.keys(old_value ?? {}),
      ...Object.keys(new_value ?? {}),
    ])
  );
  if (keys.length === 0) return null;
  return (
    <div className="mt-2 rounded border bg-muted/40 px-3 py-2 text-xs space-y-0.5 font-mono">
      {keys.map((k) => {
        const prev = old_value?.[k];
        const next = new_value?.[k];
        if (prev === next) return null;
        return (
          <div key={k} className="flex flex-wrap gap-2">
            <span className="text-muted-foreground">{k}:</span>
            {prev !== undefined && (
              <span className="line-through text-red-600 dark:text-red-400">
                {String(prev)}
              </span>
            )}
            {next !== undefined && (
              <span className="text-green-600 dark:text-green-400">
                {String(next)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

const ENTITY_TYPES = ["Module", "Program", "ExamRegulation", "University", "Faculty", "User", "Prerequisite"];
const ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE", "ARCHIVE", "RESTORE", "RESET_PASSWORD", "LOGIN", "IMPORT"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAuditLogPage() {
  const t = useTranslations("admin.auditLog");
  const locale = useLocale();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, error } = useAdminAuditLogs({
    page,
    page_size: 25,
    entity_type: entityType || undefined,
    action: action || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  function resetFilters() {
    setEntityType("");
    setAction("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const inputCls =
    "rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full";

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin-audit-log"] })}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {t("refresh")}
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t("filterEntityType")}
          </label>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className={inputCls}
          >
            <option value="">{t("filterAll")}</option>
            {ENTITY_TYPES.map((et) => (
              <option key={et} value={et}>{et}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t("filterAction")}
          </label>
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className={inputCls}
          >
            <option value="">{t("filterAll")}</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{t(`action${a}` as any)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t("filterDateFrom")}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            {t("filterDateTo")}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className={inputCls}
          />
        </div>

        {(entityType || action || dateFrom || dateTo) && (
          <div className="col-span-full flex justify-end">
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              {t("filterReset")}
            </Button>
          </div>
        )}
      </div>

      {/* Summary */}
      {data && (
        <p className="text-xs text-muted-foreground">
          {t("totalEntries", { total: data.total })}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{t("loadError")}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && data?.items.length === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("noEntries")}</p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && !error && data && data.items.length > 0 && (
        <div className="relative space-y-0">
          {/* vertical line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border hidden sm:block" />

          {data.items.map((entry) => {
            const dateStr = new Date(entry.created_at).toLocaleString(locale, {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={entry.id}
                className="relative flex gap-3 sm:gap-4 py-3 sm:pl-10"
              >
                {/* Dot */}
                <div className="hidden sm:flex absolute left-0 top-4 h-10 w-10 items-center justify-center rounded-full border bg-card z-10 shrink-0">
                  <span className="text-xs">{entry.entity_type.slice(0, 2)}</span>
                </div>

                {/* Card */}
                <div className="flex-1 rounded-lg border bg-card p-3 sm:p-4 space-y-2">
                  <div className="flex flex-wrap items-start gap-2 justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionBadge
                        action={entry.action}
                        label={t(`action${entry.action}` as any)}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        {entry.entity_type}
                      </span>
                      {entry.entity_label && (
                        <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                          {entry.entity_label}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{dateStr}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("byAdmin", { name: entry.admin_name })}</span>
                    {entry.ip_address && <span className="font-mono">{entry.ip_address}</span>}
                  </div>

                  {entry.reason && (
                    <p className="text-xs italic text-muted-foreground border-l-2 border-amber-400 pl-2">
                      {entry.reason}
                    </p>
                  )}

                  <DiffBlock
                    old_value={entry.old_value}
                    new_value={entry.new_value}
                    tOld={t("oldValue")}
                    tNew={t("newValue")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("prevPage")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("pageInfo", { page, total: data.total_pages })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page >= data.total_pages}
          >
            {t("nextPage")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
