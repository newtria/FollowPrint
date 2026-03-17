"use client";

import { useMemo, useCallback, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { analyzeCharacter } from "@/lib/character";
import type { AnalysisResult } from "@/lib/types";
import StoryCard from "./StoryCard";

interface Props {
  data: AnalysisResult;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function CharacterCard({ data }: Props) {
  const { t, lang } = useI18n();
  const result = useMemo(() => analyzeCharacter(data), [data]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const typeName = t(`character.types.${result.typeKey}.name`);
    const text = lang === "ko"
      ? `나의 인스타 캐릭터: ${typeName}\n소셜 ${result.stats.socialScore} | 충성도 ${result.stats.loyaltyScore} | 호기심 ${result.stats.curiosityScore} | 선별력 ${result.stats.selectivityScore}\n\nFollowprint에서 분석해보세요!`
      : `My Instagram character: ${typeName}\nSocial ${result.stats.socialScore} | Loyalty ${result.stats.loyaltyScore} | Curiosity ${result.stats.curiosityScore} | Selectivity ${result.stats.selectivityScore}\n\nTry yours at Followprint!`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }, [t, lang, result]);

  const formatHour = (h: number) => {
    if (lang === "ko") {
      return h < 12 ? `오전 ${h || 12}시` : `오후 ${h === 12 ? 12 : h - 12}시`;
    }
    return h < 12 ? `${h || 12} AM` : `${h === 12 ? 12 : h - 12} PM`;
  };

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{t("character.title")}</h3>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {shared ? t("character.shared") : t("character.share")}
        </button>
        <StoryCard
          result={result}
          followerCount={data.followers.length}
          followingCount={data.following.length}
          mutualRate={
            data.following.length > 0
              ? Math.round((data.mutual.length / data.following.length) * 100)
              : 0
          }
        />
      </div>

      <div ref={cardRef} className="rounded-2xl glass overflow-hidden">
        {/* Type Header */}
        <div className="p-6 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-center">
          <div className="text-5xl font-black mb-2 opacity-90">
            {result.emoji}
          </div>
          <h4 className="text-xl font-bold">
            {t(`character.types.${result.typeKey}.name`)}
          </h4>
          <p className="text-sm text-white/80 mt-1">
            {t(`character.types.${result.typeKey}.desc`)}
          </p>
        </div>

        {/* Scores */}
        <div className="p-6 space-y-3">
          <ScoreBar
            label={t("character.scores.social")}
            value={result.stats.socialScore}
            color="bg-violet-500"
          />
          <ScoreBar
            label={t("character.scores.loyalty")}
            value={result.stats.loyaltyScore}
            color="bg-green-500"
          />
          <ScoreBar
            label={t("character.scores.curiosity")}
            value={result.stats.curiosityScore}
            color="bg-orange-500"
          />
          <ScoreBar
            label={t("character.scores.selectivity")}
            value={result.stats.selectivityScore}
            color="bg-blue-500"
          />
        </div>

        {/* Fun Facts */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-center">
            <p className="text-lg font-bold">{formatHour(result.stats.activeHour)}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("character.activeTime")}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-center">
            <p className="text-lg font-bold">
              {result.stats.followsPerMonth}
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                /{t("character.perMonth")}
              </span>
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("character.newFollows")}
            </p>
          </div>
        </div>

        {/* Highlights */}
        {result.highlights.length > 0 && (
          <div className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {result.highlights.map((key) => (
                <span
                  key={key}
                  className="px-3 py-1 text-xs rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                >
                  {t(key)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
