"use client";

import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Column<T> {
  key: string; label: string; sortable?: boolean;
  render?: (item: T) => React.ReactNode; className?: string;
}

interface DataTableProps<T> {
  data: T[]; columns: Column<T>[]; searchable?: boolean;
  searchPlaceholder?: string; searchKeys?: string[]; emptyMessage?: string;
  className?: string; onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode; filters?: React.ReactNode;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  data, columns, searchable = true, searchPlaceholder = "Search...", searchKeys = [],
  emptyMessage = "No data found.", className, onRowClick, actions, filters,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (search && searchKeys.length > 0) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((item) => searchKeys.some((key) => {
        const value = getNestedValue(item, key);
        return value && String(value).toLowerCase().includes(lowerSearch);
      }));
    }
    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aVal = getNestedValue(a, sortKey);
        const bVal = getNestedValue(b, sortKey);
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        let comparison = 0;
        if (typeof aVal === "string" && typeof bVal === "string") comparison = aVal.localeCompare(bVal);
        else if (aVal instanceof Date && bVal instanceof Date) comparison = aVal.getTime() - bVal.getTime();
        else comparison = Number(aVal) - Number(bVal);
        return sortDir === "desc" ? -comparison : comparison;
      });
    }
    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortKey(null); setSortDir(null); }
    } else { setSortKey(key); setSortDir("asc"); }
  };

  return (
    <div className={cn("rounded-card border border-border bg-white shadow-card", className)}>
      {(searchable || filters) && (
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-button border border-border bg-white py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-teal focus:ring-1 focus:ring-brand-teal focus:outline-none sm:w-72"
              />
            </div>
          )}
          {filters && <div className="flex items-center gap-2">{filters}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted",
                    col.sortable && "cursor-pointer select-none hover:text-text-primary",
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredData.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-text-muted">{emptyMessage}</td></tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={(item as Record<string, unknown>).id as string || index}
                  className={cn("border-b border-border transition-colors hover:bg-surface-muted/50", onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-text-primary", col.className)}>
                      {col.render ? col.render(item) : String(getNestedValue(item, col.key) ?? "")}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3 text-right">{actions(item)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-3 text-xs text-text-muted">
        {filteredData.length} of {data.length} results
      </div>
    </div>
  );
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}
