"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  FileJson,
  FileX2,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminMutate } from "@/lib/adminFetch";
import { useAdminPrograms } from "@/hooks/admin/useAdminPrograms";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

interface ExamRegOption {
  id: string;
  label: string;
}

export default function AdminImportPage() {
  const t = useTranslations("admin.import");
  const { token: adminToken } = useAdminSession();

  const { data: programs = [] } = useAdminPrograms({ include_archived: false });

  // Build flat exam-reg list from programs detail
  // We only have program list here, not details — use the ER select differently:
  // User picks a program, then we show an ER ID input (we don't have the ER list without fetching each program detail).
  // Simpler: show a plain text input for exam_regulation_id (UUID).
  const [examRegId, setExamRegId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<unknown[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleValidate() {
    setParseError(null);
    setPreview(null);
    setResult(null);
    setImportError(null);

    if (!jsonText.trim()) {
      setParseError(t("errorEmpty"));
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setParseError(t("errorNotArray"));
        return;
      }
      setPreview(parsed);
    } catch {
      setParseError(t("errorInvalidJson"));
    }
  }

  async function handleImport() {
    if (!preview || !examRegId.trim()) return;
    setImporting(true);
    setImportError(null);
    setResult(null);
    try {
      const res = await adminMutate<ImportResult>("modules/import/json", "POST", {
        body: { exam_regulation_id: examRegId.trim(), modules: preview },
        adminToken: adminToken ?? undefined,
      });
      setResult(res ?? null);
      setPreview(null);
      setJsonText("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setImportError(t("importError", { error: msg }));
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setJsonText("");
    setParseError(null);
    setPreview(null);
    setResult(null);
    setImportError(null);
  }

  const canImport = !!preview && !!examRegId.trim() && !!adminToken;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* JSON Import section */}
      <div className="rounded-lg border bg-card p-4 sm:p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileJson className="h-4 w-4 text-muted-foreground" />
          {t("jsonSection")}
        </h2>

        {/* Exam-reg ID input */}
        <div>
          <label className="text-sm font-medium block mb-1">{t("examRegLabel")}</label>
          <input
            type="text"
            value={examRegId}
            onChange={(e) => setExamRegId(e.target.value)}
            placeholder={t("examRegPlaceholder")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">{t("examRegHint")}</p>
        </div>

        {/* JSON textarea */}
        <div>
          <label className="text-sm font-medium block mb-1">{t("jsonLabel")}</label>
          <textarea
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setParseError(null); setPreview(null); }}
            rows={10}
            placeholder={t("jsonPlaceholder")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>

        {/* Parse error */}
        {parseError && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <FileX2 className="h-4 w-4 shrink-0" />
            {parseError}
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="rounded-md border bg-muted/40 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("previewCount", { count: preview.length })}
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {(preview as Array<{ name?: string; kuerzel?: string; ects?: number }>)
                .slice(0, 10)
                .map((m, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground">
                    {i + 1}. {m.kuerzel ?? "—"} — {m.name ?? "?"} ({m.ects ?? "?"} ECTS)
                  </div>
                ))}
              {preview.length > 10 && (
                <p className="text-xs text-muted-foreground italic">
                  {t("previewMore", { count: preview.length - 10 })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import result */}
        {result && (
          <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-900/10 p-4 space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              {t("resultSuccess")}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t("resultCreated", { count: result.created })}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t("resultSkipped", { count: result.skipped })}
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                  {t("resultErrors", { count: result.errors.length })}
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs font-mono text-red-600 dark:text-red-400">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import error */}
        {importError && (
          <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-900/10 p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{importError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidate}
            disabled={!jsonText.trim()}
          >
            {t("validateBtn")}
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={!canImport || importing}
          >
            {importing ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("importingBtn")}</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" />{t("importBtn")}</>
            )}
          </Button>
          {(preview || result) && (
            <Button size="sm" variant="ghost" onClick={reset}>
              {t("resetBtn")}
            </Button>
          )}
        </div>

        {!adminToken && (
          <p className="text-xs text-red-500">{t("noSession")}</p>
        )}
      </div>

      {/* PDF placeholder */}
      <div className="rounded-lg border border-dashed bg-muted/20 p-5 sm:p-6 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <FileJson className="h-4 w-4" />
          {t("pdfSection")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("pdfDesc")}</p>
        <Button size="sm" variant="outline" disabled>
          {t("pdfBtn")}
        </Button>
        <p className="text-xs text-muted-foreground italic">{t("pdfComingSoon")}</p>
      </div>
    </div>
  );
}
