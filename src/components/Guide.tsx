"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

const INSTAGRAM_DYI_URL =
  "https://accountscenter.instagram.com/info_and_permissions/dyi/";

const STEP_ICONS = [
  "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12",
];

export default function Guide() {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(true);

  return (
    <section id="guide" className="py-12">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-6 cursor-pointer group"
      >
        <div className="text-left">
          <h3 className="text-2xl font-black">{t("guide.title")}</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            {t("guide.subtitle")}
          </p>
        </div>
        <div className="p-2 rounded-xl glass group-hover:scale-110 transition-all">
          <svg
            className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <div
                key={n}
                className="group p-5 rounded-2xl glass hover:scale-[1.02] transition-all animate-fade-in-scale"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={STEP_ICONS[i]} />
                  </svg>
                </div>
                <h4 className="font-bold text-sm mb-1.5">
                  <span className="text-violet-500 dark:text-violet-400 mr-1">{n}.</span>
                  {t(`guide.step${n}.title`)}
                </h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t(`guide.step${n}.desc`)}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <a
              href={INSTAGRAM_DYI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold hover:scale-105 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              {t("guide.openInstagram")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
