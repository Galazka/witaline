"use client";
import { useState, useMemo } from "react";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Szukaj...",
  pageSize = 10,
  onRowClick,
  emptyMessage = "Brak danych",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => {
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      }),
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), "pl");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const from = sorted.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min((safePage + 1) * pageSize, sorted.length);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <div className="w-full">
      {searchable && (
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-zinc-200 bg-white/70 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none backdrop-blur transition-colors focus:border-brand-400 focus:bg-white/80 focus:ring-2 focus:ring-brand-400/20"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-white/20 bg-white/55 backdrop-blur-xl">
        <table className="w-full min-w-max text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`sticky top-0 z-10 bg-white/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 backdrop-blur ${
                    col.sortable ? "cursor-pointer select-none hover:text-zinc-800" : ""
                  } ${col.className ?? ""}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span className="text-zinc-500">
                        {sortDir === "asc" ? "\u25B2" : "\u25BC"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-zinc-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((item, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(item)}
                    className={`border-b border-zinc-200/70 transition-colors last:border-0 ${
                    onRowClick
                      ? "cursor-pointer hover:bg-brand-50"
                      : "hover:bg-white/60"
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-zinc-700 ${col.className ?? ""}`}
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.key] as React.ReactNode) ?? "\u2014"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Pokazuje {from}\u2013{to} z {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-lg border border-zinc-200 bg-white/70 px-3 py-1.5 text-zinc-700 backdrop-blur transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Poprzednia
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg border border-zinc-200 bg-white/70 px-3 py-1.5 text-zinc-700 backdrop-blur transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Nast\u0119pna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
export type { Column, DataTableProps };
