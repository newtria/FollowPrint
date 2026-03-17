"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import type { AnalysisResult, InsightsData, TabKey } from "@/lib/types";
import AccountList from "./AccountList";
import CharacterCard from "./CharacterCard";
import Insights from "./Insights";

interface Props {
  data: AnalysisResult;
  insights: InsightsData;
  onReset: () => void;
}

const TAB_KEYS: TabKey[] = [
  "pending",
  "nonMutual",
  "fansOnly",
  "mutual",
  "unfollowed",
  "closeFriends",
  "blocked",
  "restricted",
];

const STAT_CARDS: { key: TabKey; color: string; gradient: string }[] = [
  { key: "pending", color: "text-orange-500", gradient: "from-orange-500/20 to-amber-500/10" },
  { key: "nonMutual", color: "text-red-500", gradient: "from-red-500/20 to-rose-500/10" },
  { key: "fansOnly", color: "text-blue-500", gradient: "from-blue-500/20 to-cyan-500/10" },
  { key: "mutual", color: "text-green-500", gradient: "from-green-500/20 to-emerald-500/10" },
];

export default function Dashboard({ data, insights, onReset }: Props) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const tabData: Record<TabKey, typeof data.followers> = useMemo(
    () => ({
      pending: data.pendingRequests,
      nonMutual: data.nonMutual,
      fansOnly: data.fansOnly,
      mutual: data.mutual,
      unfollowed: data.recentlyUnfollowed,
      closeFriends: data.closeFriends,
      blocked: data.blockedAccounts,
      restricted: data.restrictedAccounts,
    }),
    [data]
  );

  const mutualityRate =
    data.following.length > 0
      ? Math.round((data.mutual.length / data.following.length) * 100)
      : 0;

  const ratio =
    data.following.length > 0
      ? (data.followers.length / data.following.length).toFixed(1)
      : "0";

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <h2 className="text-3xl font-black gradient-text">
          {t("dashboard.title")}
        </h2>
        <button
          onClick={onReset}
          className="px-4 py-2.5 text-sm font-medium rounded-xl glass hover:scale-105 transition-all"
        >
          {t("dashboard.reset")}
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8 animate-fade-in">
        {[
          { label: t("dashboard.overview.followers"), value: data.followers.length, accent: false },
          { label: t("dashboard.overview.following"), value: data.following.length, accent: false },
          { label: t("dashboard.overview.ratio"), value: ratio, accent: false },
          { label: t("dashboard.overview.mutuality"), value: `${mutualityRate}%`, accent: true },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-4 text-center">
            <p className={`text-2xl font-black ${stat.accent ? "gradient-text" : ""}`}>
              {stat.value}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Character Analysis */}
      <CharacterCard data={data} />

      {/* Insights */}
      <Insights data={insights} />

      {/* Stats Cards */}
      <h3 className="text-lg font-bold mb-4">{t("dashboard.tabs.pending").split(" ")[0]} & More</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {STAT_CARDS.map(({ key, color, gradient }, i) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`p-5 rounded-2xl transition-all text-left animate-fade-in-scale hover:scale-[1.03] ${
              activeTab === key
                ? `glass border-2 border-violet-500 dark:border-violet-400 bg-gradient-to-br ${gradient}`
                : "glass hover:border-violet-300 dark:hover:border-violet-700"
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <p className={`text-3xl font-black ${color}`}>
              {tabData[key].length}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
              {t(`dashboard.tabs.${key}`)}
            </p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-6 px-6">
        {TAB_KEYS.map((key) => {
          const count = tabData[key].length;
          if (count === 0 && key !== activeTab) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                activeTab === key
                  ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold shadow-lg shadow-violet-500/20"
                  : "glass text-zinc-600 dark:text-zinc-400 hover:scale-105"
              }`}
            >
              {t(`dashboard.tabs.${key}`)}
              <span
                className={`text-xs ${activeTab === key ? "text-white/70" : "text-zinc-400 dark:text-zinc-500"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Account List */}
      <AccountList
        accounts={tabData[activeTab]}
        tabKey={activeTab}
        dateLabel={
          activeTab === "pending"
            ? t("dashboard.requestedOn")
            : t("dashboard.followedOn")
        }
      />
    </div>
  );
}
