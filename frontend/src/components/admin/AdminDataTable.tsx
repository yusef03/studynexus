"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  /** Extra Tailwind classes for the td/th */
  className?: string;
  /** Hide on mobile (true = hidden on small screens) */
  hideOnMobile?: boolean;
}

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSortChange?: (sort: SortState) => void;
  sortState?: SortState;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  getRowKey: (row: T) => string;
}

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }, [fn, delay]) as T; // eslint-disable-line react-hooks/exhaustive-deps
}

export function AdminDataTable<T>({
  columns,
  data,
  total,
  page,
  limit = 25,
  loading = false,
  onPageChange,
  onSortChange,
  sortState,
  onSearch,
  searchPlaceholder,
  onRowClick,
  getRowKey,
}: Props<T>) {
  const t = useTranslations("admin.table");
  const [searchValue, setSearchValue] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const debouncedSearch = useDebounce((q: string) => onSearch?.(q), 350);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchValue(e.target.value);
    debouncedSearch(e.target.value);
  }

  function handleSort(key: string) {
    if (!onSortChange) return;
    if (sortState?.key === key) {
      onSortChange({ key, dir: sortState.dir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, dir: "asc" });
    }
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortState?.key !== colKey) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortState.dir === "asc"
      ? <ChevronUp className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3" />;
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      {onSearch && (
        <input
          type="search"
          value={searchValue}
          onChange={handleSearch}
          placeholder={searchPlaceholder ?? t("search")}
          className="w-full sm:max-w-xs rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      )}

      {/* Table wrapper — horizontally scrollable on mobile */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 sm:px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap",
                    col.sortable && onSortChange && "cursor-pointer select-none hover:text-foreground",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-3 sm:px-4 py-3", col.hideOnMobile && "hidden sm:table-cell")}
                    >
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50 active:bg-muted"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 sm:px-4 py-3 align-middle",
                        col.hideOnMobile && "hidden sm:table-cell",
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="text-xs">{t("totalEntries", { total })}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("prev")}</span>
          </button>

          <span className="px-3 py-1.5 text-xs font-medium">
            {t("page", { page, total: totalPages })}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs disabled:opacity-40 hover:bg-muted transition-colors"
          >
            <span className="hidden sm:inline">{t("next")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
