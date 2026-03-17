"use client";

import { useI18n } from "@/lib/i18n";
import type { InsightsData } from "@/lib/types";

interface Props {
  data: InsightsData;
}

function RankedList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { name: string; count: number }[];
  emptyText: string;
}) {
  if (items.length === 0) return null;
  const maxCount = items[0]?.count || 1;

  return (
    <div className="p-5 rounded-2xl glass">
      <h4 className="font-bold text-sm mb-4">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">{emptyText}</p>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 10).map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 w-5 text-right shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0 ml-2">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HourChart({
  title,
  hours,
}: {
  title: string;
  hours: number[];
}) {
  const maxHour = Math.max(...hours, 1);
  const hasData = hours.some((h) => h > 0);
  if (!hasData) return null;

  return (
    <div className="p-5 rounded-2xl glass">
      <h4 className="font-bold text-sm mb-4">{title}</h4>
      <div className="flex items-end gap-[3px] h-24">
        {hours.map((count, hour) => (
          <div key={hour} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-sm bg-gradient-to-t from-violet-600 to-violet-400 dark:from-violet-500 dark:to-violet-300 transition-all"
              style={{
                height: `${(count / maxHour) * 100}%`,
                minHeight: count > 0 ? "4px" : "0px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-zinc-400">
        <span>0</span>
        <span>6</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </div>
  );
}

function RecentList({
  title,
  items,
}: {
  title: string;
  items: { name: string; timestamp: number }[];
}) {
  if (items.length === 0) return null;

  const formatDate = (ts: number) => {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleDateString();
  };

  return (
    <div className="p-5 rounded-2xl glass">
      <h4 className="font-bold text-sm mb-4">{title}</h4>
      <div className="space-y-2">
        {items.slice(0, 15).map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="truncate">{item.name}</span>
            <span className="text-xs text-zinc-400 shrink-0 ml-2">
              {formatDate(item.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Insights({ data }: Props) {
  const { t } = useI18n();

  const hasAnyData =
    data.topLikedAccounts.length > 0 ||
    data.topSavedAccounts.length > 0 ||
    data.profileSearches.length > 0 ||
    data.wordSearches.length > 0 ||
    data.loginHours.some((h) => h > 0);

  if (!hasAnyData) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <h3 className="text-lg font-bold mb-4">{t("insights.title")}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <RankedList
          title={t("insights.topLiked")}
          items={data.topLikedAccounts}
          emptyText={t("dashboard.noData")}
        />
        <RankedList
          title={t("insights.topSaved")}
          items={data.topSavedAccounts}
          emptyText={t("dashboard.noData")}
        />
        <RecentList
          title={t("insights.profileSearches")}
          items={data.profileSearches}
        />
        <RecentList
          title={t("insights.wordSearches")}
          items={data.wordSearches}
        />
        <HourChart
          title={t("insights.activityHours")}
          hours={data.loginHours}
        />
        {data.chatNames.length > 0 && (
          <div className="p-5 rounded-2xl glass">
            <h4 className="font-bold text-sm mb-4">
              {t("insights.dms")}
            </h4>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">
              {data.chatNames.length}
            </p>
            <div className="space-y-1.5">
              {data.chatNames.map((name) => (
                <p key={name} className="text-sm text-zinc-600 dark:text-zinc-400">
                  {name}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
