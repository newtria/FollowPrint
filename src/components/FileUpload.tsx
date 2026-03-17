"use client";

import { useState, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { parseFileFull } from "@/lib/parser";
import type { FullData } from "@/lib/types";

interface Props {
  onResult: (result: FullData) => void;
}

export default function FileUpload({ onResult }: Props) {
  const { t } = useI18n();
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setProcessing(true);
      try {
        const result = await parseFileFull(file);
        onResult(result);
      } catch (err) {
        const code = err instanceof Error ? err.message : "default";
        const translated = t(`upload.error.${code}`);
        setError(
          translated !== `upload.error.${code}`
            ? translated
            : t("upload.error.default")
        );
      } finally {
        setProcessing(false);
      }
    },
    [onResult, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <section className="py-12">
      <h3 className="text-2xl font-black mb-6">{t("upload.title")}</h3>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-3xl p-16 text-center transition-all
          ${dragActive
            ? "drop-active glass border-2 border-dashed border-violet-500 scale-[1.02]"
            : "glass border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-600 hover:scale-[1.01]"
          }
          ${processing ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />

        {processing ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              {t("upload.processing")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-violet-500 dark:text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 font-bold text-lg">
              {t("upload.dragDrop")}
            </p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm">
              {t("upload.or")}
            </p>
            <button className="px-8 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold hover:scale-105 transition-transform">
              {t("upload.browse")}
            </button>
            <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-2">
              {t("upload.hint")}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-5 rounded-2xl glass border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </section>
  );
}
