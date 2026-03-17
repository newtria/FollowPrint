"use client";

import { useState, useMemo, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import type { InstagramAccount, TabKey } from "@/lib/types";

interface Props {
  accounts: InstagramAccount[];
  tabKey: TabKey;
  dateLabel: string;
}

type SortMode = "name" | "newest" | "oldest";

const PAGE_SIZE = 50;

function downloadCsv(accounts: InstagramAccount[], filename: string) {
  const header = "username,profile_url,timestamp,date\n";
  const rows = accounts
    .map((a) => {
      const date = a.timestamp
        ? new Date(a.timestamp * 1000).toISOString()
        : "";
      return `${a.username},${a.profileUrl},${a.timestamp},${date}`;
    })
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `followprint-${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AccountList({ accounts, tabKey, dateLabel }: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [showCount, setShowCount] = useState(PAGE_SIZE);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    let list = accounts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.username.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.username.localeCompare(b.username);
        case "newest":
          return b.timestamp - a.timestamp;
        case "oldest":
          return a.timestamp - b.timestamp;
      }
    });
  }, [accounts, search, sort]);

  const visible = filtered.slice(0, showCount);

  const formatDate = (ts: number) => {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleDateString();
  };

  const handleCopy = useCallback(async () => {
    const text = filtered.map((a) => a.username).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filtered]);

  const handleExport = useCallback(() => {
    downloadCsv(filtered, tabKey);
  }, [filtered, tabKey]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowCount(PAGE_SIZE);
            }}
            placeholder={t("dashboard.search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1">
          {(["name", "newest", "oldest"] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                sort === s
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {t(
                `dashboard.sort${s.charAt(0).toUpperCase()}${s.slice(1)}`
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Count + Actions */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {filtered.length} {t("dashboard.total")}
        </p>
        {filtered.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? t("dashboard.copied") : t("dashboard.copyAll")}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              CSV
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 dark:text-zinc-600">
          {t("dashboard.noData")}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((account) => (
            <div
              key={account.username}
              className="flex items-center justify-between p-3 rounded-xl glass hover:scale-[1.01] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {account.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    @{account.username}
                  </p>
                  {account.timestamp > 0 && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {dateLabel} {formatDate(account.timestamp)}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={account.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {t("dashboard.viewProfile")}
              </a>
            </div>
          ))}

          {showCount < filtered.length && (
            <button
              onClick={() => setShowCount((c) => c + PAGE_SIZE)}
              className="w-full py-3 text-sm text-violet-600 dark:text-violet-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors"
            >
              +{filtered.length - showCount} more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
